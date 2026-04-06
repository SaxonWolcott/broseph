# Stripe Setup Guide

This guide walks you through setting up Stripe for local development and testing of the payment features in Broseph.

## 1. Create a Stripe Account

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and sign up (free)
2. You do **not** need to activate your account or provide business details for test mode

## 2. Stay in Test Mode

The Stripe dashboard has a "Test mode" toggle in the top-right corner. Make sure it says **"Test mode"** — never switch to live mode for development. All API keys, transactions, and webhooks in test mode use fake money.

## 3. Get Your API Keys

1. In the Stripe dashboard, go to **Developers > API Keys**
2. Copy these two keys:
   - **Publishable key** — starts with `pk_test_...` (used by frontend, safe to expose)
   - **Secret key** — starts with `sk_test_...` (used by backend, keep private)

## 4. Install the Stripe CLI

The Stripe CLI forwards webhook events from Stripe to your local API server.

1. Download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   - **Windows**: `winget install Stripe.StripeCLI` or download the zip
   - **Mac**: `brew install stripe/stripe-cli/stripe`
2. Run `stripe login` and follow the browser prompt to authenticate

## 5. Forward Webhooks Locally

In a separate terminal, run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will print a **webhook signing secret** that starts with `whsec_...` — copy it.

> **Note:** You need to keep this terminal running while testing payments. Every time you restart `stripe listen`, you get a new signing secret.

## 6. Add Environment Variables

Add these three values to your `.env` file (in the project root, next to `.env.example`):

```env
STRIPE_SECRET_KEY=sk_test_...your-secret-key...
STRIPE_WEBHOOK_SECRET=whsec_...from-stripe-listen...
STRIPE_PUBLIC_KEY=pk_test_...your-publishable-key...
```

## 7. Test Card Numbers

Stripe provides fake card numbers for testing. No real money is ever charged.

| Card Number          | Result              |
|----------------------|---------------------|
| `4242 4242 4242 4242` | Always succeeds    |
| `4000 0000 0000 0002` | Always declines    |
| `4000 0000 0000 3220` | Requires 3D Secure |

For all test cards:
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

## 8. Testing the Payment Flow

1. Start all services: `pnpm dev`
2. Start Stripe webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Open the app and go to a group chat
4. Click the **+** button > **Payment**
5. Create a payment request with some items
6. Click **Pay** on an item — you'll be redirected to Stripe's checkout page
7. Use test card `4242 4242 4242 4242` to complete the payment
8. After redirecting back, the webhook fires and the item shows as paid

## Troubleshooting

- **"Stripe is not configured"** — Make sure `STRIPE_SECRET_KEY` is set in `.env` and restart the API
- **Webhook signature errors** — Make sure `stripe listen` is running and the `STRIPE_WEBHOOK_SECRET` matches what it printed
- **Payment stuck on "processing"** — Check that `stripe listen` is forwarding events. If the session expired, the item will reset to "unpaid" automatically
