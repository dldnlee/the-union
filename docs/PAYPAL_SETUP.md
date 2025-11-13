# PayPal Payment Integration - Quick Setup Guide

## Quick Start (3 Steps)

### 1. Add Your PayPal Credentials

Edit your `.env.local` file and add:

```bash
# Get these from https://developer.paypal.com/dashboard/applications
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
NEXT_PUBLIC_PAYPAL_ENV=sandbox
```

### 2. Restart Your Development Server

```bash
npm run dev
```

### 3. Test the Integration

1. Visit [http://localhost:3000/payment](http://localhost:3000/payment)
2. Fill out the payment form
3. Select "PayPal" as payment method
4. Click the PayPal button and complete test payment

## Where to Get PayPal Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Sign in with your PayPal business account
3. Go to **Apps & Credentials**
4. Select **Sandbox** tab
5. Create a new app or select existing app
6. Copy your **Client ID** and **Secret**

## What Was Added

### New Files Created

1. **API Routes:**
   - [`/app/api/payment/paypal/create-order/route.ts`](app/api/payment/paypal/create-order/route.ts) - Creates PayPal orders
   - [`/app/api/payment/paypal/capture-order/route.ts`](app/api/payment/paypal/capture-order/route.ts) - Captures payments

2. **Components:**
   - [`/components/PayPalButton.tsx`](components/PayPalButton.tsx) - Reusable PayPal button component

3. **Documentation:**
   - [`/docs/PAYPAL_INTEGRATION.md`](docs/PAYPAL_INTEGRATION.md) - Complete integration guide
   - This file - Quick setup reference

### Modified Files

1. **[`/app/payment/page.tsx`](app/payment/page.tsx)**
   - Added PayPal button when PayPal payment method is selected
   - Dynamic test info based on payment method

2. **[`.env.local.example`](.env.local.example)**
   - Added PayPal environment variables template

3. **[`package.json`](package.json)**
   - Added `@paypal/react-paypal-js` dependency

## Testing with PayPal Sandbox

### Create Test Buyer Account

1. Go to [sandbox.paypal.com](https://www.sandbox.paypal.com/)
2. Click "Sign Up" to create a test personal account
3. Or use test accounts from [PayPal Developer Dashboard → Sandbox → Accounts](https://developer.paypal.com/dashboard/accounts)

### Test Payment Flow

1. Select PayPal as payment method on your payment page
2. PayPal button will appear
3. Click PayPal button
4. Log in with test buyer account
5. Approve payment
6. You'll be redirected to the completion page

## Switching to Production

When ready to accept real payments:

```bash
# In .env.local, change:
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id_here
PAYPAL_CLIENT_SECRET=your_live_client_secret_here
NEXT_PUBLIC_PAYPAL_ENV=live
```

Get Live credentials from the **Live** tab in [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).

## Common Issues

### PayPal Button Not Showing

- Make sure you added credentials to `.env.local`
- Restart your dev server: `npm run dev`
- Check browser console for errors

### "Missing API credentials" Error

- Verify environment variables are set correctly
- Variable names must match exactly: `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`

### Payment Fails Immediately

- Check you're using Sandbox credentials with `NEXT_PUBLIC_PAYPAL_ENV=sandbox`
- Verify Client ID and Secret match the same app in PayPal Dashboard

## Need More Details?

See the complete documentation: [`/docs/PAYPAL_INTEGRATION.md`](docs/PAYPAL_INTEGRATION.md)

## Support

- [PayPal Developer Docs](https://developer.paypal.com/docs/)
- [PayPal REST API](https://developer.paypal.com/api/rest/)
- [PayPal Sandbox](https://developer.paypal.com/tools/sandbox/)

---

**Ready to test?** Add your credentials and visit [http://localhost:3000/payment](http://localhost:3000/payment)