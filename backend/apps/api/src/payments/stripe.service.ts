import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Stripe v22 uses a constructor function export pattern
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stripe = require('stripe');

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: any;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe features will be unavailable');
      return;
    }
    this.stripe = new Stripe(secretKey);
  }

  getClient(): any {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');
    }
    return this.stripe;
  }

  async createCheckoutSession(opts: {
    paymentItemId: string;
    payerId: string;
    description: string;
    amountCents: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkoutUrl: string; sessionId: string }> {
    const session = await this.getClient().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: opts.currency,
            product_data: { name: opts.description },
            unit_amount: opts.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentItemId: opts.paymentItemId,
        payerId: opts.payerId,
      },
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  verifyWebhookSignature(payload: Buffer, signature: string): { type: string; id: string; data: { object: Record<string, unknown> } } {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not set');
    }
    return this.getClient().webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
