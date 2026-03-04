import { OnEvent } from '@nestjs/event-emitter';
import { UserDocument } from '../../../schemas/user.schema';
import mammoth from 'mammoth';
import { EQuizType, Quiz } from '../../../schemas/quiz.schema';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuizService } from '../quiz.service';

export class QuizListener {
  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
  ) {}
  logger = new Logger(QuizService.name);

  @OnEvent('quiz.import.process')
  async handleProcessImportWord(payloadEvent: {
    buffer: Buffer;
    user: UserDocument;
  }) {
    const { buffer, user } = payloadEvent;
    try {
      this.logger.log('Started background processing for Word file import');
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      const questions = text
        .split(/Câu\s+\d+:/i)
        .filter((item) => item.trim().length > 0);
      const createdQuizzes = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const lines = q
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        if (lines.length < 3) continue;

        const content = lines[0];
        const answers = [];
        let correctAnswerKeys = [];
        let note = '';

        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (/^[A-D][.:]/.test(line)) {
            const key = line.charAt(0).toUpperCase();
            const textAns = line.substring(2).trim();
            answers.push({ id: key, text: textAns });
          } else if (/^Đáp án\s*:/i.test(line)) {
            const rawKeys = line.split(':')[1].toUpperCase().trim();
            correctAnswerKeys = rawKeys
              .split(/[,;\s&]/)
              .map((k) => k.trim())
              .filter((k) => ['A', 'B', 'C', 'D'].includes(k));
          } else if (/^(Chú ý|Ghi chú|Note)\s*:/i.test(line)) {
            note = line.substring(line.indexOf(':') + 1).trim();
          }
        }

        if (answers.length > 0 && correctAnswerKeys.length > 0) {
          let type =
            correctAnswerKeys.length > 1
              ? EQuizType.MultipleChoice
              : EQuizType.OneChoice;

          // Detect True/False based on having exactly 2 answers and 1 correct answer (no text check needed)
          if (answers.length === 2 && correctAnswerKeys.length === 1) {
            type = EQuizType.TrueFalse;
          }

          const payload: any = {
            type,
            content,
            answers,
            corrects: correctAnswerKeys,
            note,
            tag_ids: [],
            creator_id: user._id,
            updater_id: user._id,
          };

          const newQuiz = await this.quizModel.create(payload);
          createdQuizzes.push(newQuiz);
        }
      }

      this.logger.log(
        `Successfully background imported ${createdQuizzes.length} questions`,
      );
    } catch (error) {
      this.logger.error('Error processing background word file import', error);
    }
  }
}
