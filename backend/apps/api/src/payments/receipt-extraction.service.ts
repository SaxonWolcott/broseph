import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ExtractedReceipt, ExtractedReceiptItem } from '@app/shared';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are a receipt parser. Given a receipt image, call the \`extract_receipt\` tool with the data you can read.

Rules:
- All monetary amounts are in integer cents. $15.99 → 1599. Never use dollars or floats.
- \`items\` lists food/products ONLY. Do NOT add tax, tip, subtotal, or total as items — those go in their dedicated fields.
- If a line item has indented sub-components without their own prices (e.g., a combo meal listing what's included, like "1 9Nuggets" followed by indented "1 Barbecue Sauce", "1 Sweet and Sour Sauce", "1 L Sprite", "1 L Fries"), report ONLY the parent line and its price. The sub-components are part of the meal, not separate items.
- Every item in \`items\` must have a positive amount_cents. Never emit items with zero or unknown amounts. If a line item has no visible price, omit it.
- If the receipt has no itemized prices at all (just a total with no per-item amounts), return a single item whose description is the merchant or purpose (e.g., "McDonald's", "Gas", "Parking") and whose amount_cents equals the total.
- Currency is lowercase ISO 4217 (usd, eur, gbp, etc.). Default to "usd" if no currency symbol is visible.
- \`title\` should be a short friendly label combining merchant and (if known) date — e.g., "Dinner at Olive Garden" or "Target — Apr 27".
- Omit fields you can't read confidently. Don't guess. Tax/tip lines are common; subtotal sometimes is not.
- If the image is not a receipt, set parse_status="not_a_receipt" and skip the optional fields.
- If it is a receipt but text is illegible/blurry, set parse_status="illegible" and fill in only what you can.
- Otherwise set parse_status="ok".`;

const TOOL_INPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    parse_status: {
      type: 'string' as const,
      enum: ['ok', 'not_a_receipt', 'illegible'] as const,
      description:
        "ok = fields filled. not_a_receipt = image isn't a receipt. illegible = is a receipt but couldn't read it.",
    },
    title: {
      type: 'string' as const,
      description: "Friendly suggested title, e.g., 'Dinner at Olive Garden'.",
    },
    merchant_name: { type: 'string' as const },
    purchase_date: {
      type: 'string' as const,
      description: 'ISO 8601 date (YYYY-MM-DD).',
    },
    currency: {
      type: 'string' as const,
      description: "Lowercase ISO 4217 code, e.g., 'usd'. Default to 'usd' if unclear.",
    },
    subtotal_cents: { type: 'integer' as const },
    tax_cents: { type: 'integer' as const },
    tip_cents: { type: 'integer' as const },
    total_amount_cents: {
      type: 'integer' as const,
      description: 'Final total in integer cents ($15.99 → 1599).',
    },
    items: {
      type: 'array' as const,
      description:
        'Food/product line items only. Do NOT include tax, tip, subtotal, or total here.',
      items: {
        type: 'object' as const,
        properties: {
          description: { type: 'string' as const },
          amount_cents: { type: 'integer' as const },
        },
        required: ['description', 'amount_cents'],
      },
    },
  },
  required: ['parse_status', 'title', 'currency', 'total_amount_cents', 'items'],
};

interface ToolInput {
  parse_status: 'ok' | 'not_a_receipt' | 'illegible';
  title: string;
  merchant_name?: string;
  purchase_date?: string;
  currency: string;
  subtotal_cents?: number;
  tax_cents?: number;
  tip_cents?: number;
  total_amount_cents: number;
  items: { description: string; amount_cents: number }[];
}

@Injectable()
export class ReceiptExtractionService implements OnModuleInit {
  private client: Anthropic | null = null;
  private readonly logger = new Logger(ReceiptExtractionService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — receipt extraction will be unavailable',
      );
      return;
    }
    this.client = new Anthropic({ apiKey });
  }

  async extractFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    abortSignal?: AbortSignal,
  ): Promise<ExtractedReceipt> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Receipt extraction is not configured. Set ANTHROPIC_API_KEY in .env',
      );
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported image type: ${mimeType}. Use JPEG, PNG, WebP, or GIF.`,
      );
    }

    const base64Image = imageBuffer.toString('base64');

    let response;
    try {
      response = await this.client.messages.create(
        {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: [
            {
              type: 'text',
              text: SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          tools: [
            {
              name: 'extract_receipt',
              description: 'Extract structured data from a receipt image.',
              input_schema: TOOL_INPUT_SCHEMA,
              cache_control: { type: 'ephemeral' },
            },
          ],
          tool_choice: { type: 'tool', name: 'extract_receipt' },
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType as
                      | 'image/jpeg'
                      | 'image/png'
                      | 'image/webp'
                      | 'image/gif',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        },
        { signal: abortSignal },
      );
    } catch (err) {
      throw this.translateAnthropicError(err, abortSignal);
    }

    const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      this.logger.error('Anthropic response had no tool_use block');
      throw new ServiceUnavailableException(
        'Receipt scanning is temporarily unavailable. Please try again.',
      );
    }

    const input = toolUseBlock.input as ToolInput;
    return this.toCamelCase(input);
  }

  private translateAnthropicError(err: unknown, abortSignal?: AbortSignal): Error {
    // User cancelled — let the abort propagate, no need to translate.
    if (abortSignal?.aborted) {
      return err instanceof Error ? err : new Error(String(err));
    }

    const message = err instanceof Error ? err.message : String(err);
    this.logger.error(`Receipt extraction failed: ${message}`);

    if (err instanceof Anthropic.RateLimitError) {
      return new ServiceUnavailableException(
        'Too many receipt scans right now. Try again in a moment.',
      );
    }

    if (err instanceof Anthropic.APIConnectionError) {
      return new ServiceUnavailableException(
        'Could not reach the receipt scanner. Check your connection and try again.',
      );
    }

    // Catches auth errors, credit-balance issues, server errors, and anything else from the SDK.
    return new ServiceUnavailableException(
      'Receipt scanning is temporarily unavailable. Please try again later.',
    );
  }

  private toCamelCase(input: ToolInput): ExtractedReceipt {
    const items: ExtractedReceiptItem[] = (input.items ?? []).map((i) => ({
      description: i.description,
      amountCents: i.amount_cents,
    }));

    return {
      parseStatus: input.parse_status,
      title: input.title,
      merchantName: input.merchant_name,
      purchaseDate: input.purchase_date,
      currency: input.currency,
      subtotalCents: input.subtotal_cents,
      taxCents: input.tax_cents,
      tipCents: input.tip_cents,
      totalAmountCents: input.total_amount_cents,
      items,
      model: MODEL,
      extractedAt: new Date().toISOString(),
    };
  }
}
