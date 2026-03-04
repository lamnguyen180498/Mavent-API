import { IsNotEmpty, IsOptional } from 'class-validator';

export class WebhookSepayDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  gateway: string;

  @IsNotEmpty()
  transactionDate: string;

  @IsNotEmpty()
  content: string;

  @IsOptional()
  code?: string;

  @IsNotEmpty()
  transferType: string;

  @IsNotEmpty()
  accountNumber: string;

  @IsNotEmpty()
  transferAmount: number;

  @IsNotEmpty()
  accumulated: number;

  @IsOptional()
  subAccount?: string;

  @IsNotEmpty()
  referenceCode: string;

  @IsOptional()
  description?: string;
}
