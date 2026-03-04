import path from 'node:path';
import { existsSync, mkdirSync } from 'fs';
import { createLogger, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const template = async (path: string, context: object) => {
  try {
    const ejs = await import('ejs');
    return ejs.renderFile(path, context);
  } catch (e) {
    throw new Error(
      'Cannot find module ejs. To use this feature you must install it `npm install ejs && npm install --save-dev @types/ejs`',
    );
  }
};

const logDir = path.resolve(__dirname, '../../storage/logs/email');
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

export const emailLogger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, '%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '5m',
      maxFiles: '30d', // giữ log trong 30 ngày
    }),
  ],
});
