import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { LIMITS } from '../constants/limits';

// ── Request DTOs ──

export class CreatePaymentItemInput {
  @ApiProperty({ example: 'Gas money' })
  @IsString()
  @MaxLength(LIMITS.MAX_PAYMENT_ITEM_DESCRIPTION_LENGTH)
  description!: string;

  @ApiProperty({ example: 2000, description: 'Amount in cents' })
  @IsInt()
  @Min(LIMITS.MIN_PAYMENT_AMOUNT_CENTS)
  @Max(LIMITS.MAX_PAYMENT_AMOUNT_CENTS)
  amountCents!: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Assigned user for per_person mode' })
  @IsOptional()
  @IsUUID('4')
  assignedUserId?: string;
}

export class CreatePaymentRequestDto {
  @ApiProperty({ example: 'Dinner at Olive Garden' })
  @IsString()
  @MaxLength(LIMITS.MAX_PAYMENT_TITLE_LENGTH)
  title!: string;

  @ApiProperty({ enum: ['per_item', 'per_person', 'direct'] })
  @IsString()
  @IsIn(['per_item', 'per_person', 'direct'])
  mode!: 'per_item' | 'per_person' | 'direct';

  @ApiPropertyOptional({ format: 'uuid', description: 'Recipient for direct payment mode' })
  @IsOptional()
  @IsUUID('4')
  recipientId?: string;

  @ApiProperty({ type: [CreatePaymentItemInput], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LIMITS.MAX_PAYMENT_ITEMS)
  items!: CreatePaymentItemInput[];
}

export class InitiateCheckoutDto {
  @ApiProperty({ format: 'uuid', description: 'Payment item to pay for' })
  @IsUUID('4')
  itemId!: string;
}

// ── Response DTOs ──

export class PaymentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  amountCents!: number;

  @ApiProperty()
  position!: number;

  @ApiProperty({ enum: ['unpaid', 'processing', 'paid', 'failed'] })
  status!: 'unpaid' | 'processing' | 'paid' | 'failed';

  @ApiPropertyOptional({ format: 'uuid' })
  assignedUserId!: string | null;

  @ApiPropertyOptional()
  assignedUserName!: string | null;

  @ApiPropertyOptional()
  assignedUserAvatarUrl!: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  paidBy!: string | null;

  @ApiPropertyOptional()
  paidByName!: string | null;

  @ApiPropertyOptional()
  paidByAvatarUrl!: string | null;

  @ApiPropertyOptional()
  paidAt!: string | null;
}

export class PaymentRequestDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ['per_item', 'per_person', 'direct'] })
  mode!: 'per_item' | 'per_person' | 'direct';

  @ApiPropertyOptional({ format: 'uuid' })
  recipientId!: string | null;

  @ApiPropertyOptional()
  recipientName!: string | null;

  @ApiProperty()
  totalAmountCents!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: ['active', 'completed', 'cancelled'] })
  status!: 'active' | 'completed' | 'cancelled';

  @ApiProperty({ type: [PaymentItemDto] })
  items!: PaymentItemDto[];

  @ApiProperty({ format: 'uuid' })
  creatorId!: string;

  @ApiProperty()
  createdAt!: string;
}

export class CheckoutSessionResponseDto {
  @ApiProperty()
  checkoutUrl!: string;

  @ApiProperty()
  sessionId!: string;
}
