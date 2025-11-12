# PayPal Payment Integration Guide

This document explains how to set up and use the PayPal payment integration in The Union project.

## Overview

The PayPal integration allows users to pay for products using their PayPal account. The implementation uses the official PayPal JavaScript SDK (`@paypal/react-paypal-js`) for seamless integration with React.

## Features

- **Sandbox & Production Support**: Easy switching between test and live environments
- **Secure Server-side Processing**: Payment creation and capture handled on the server
- **React Component**: Reusable PayPal button component with full customization
- **Currency Support**: Configurable currency (default: USD)
- **Error Handling**: Comprehensive error handling and user feedback
- **Order Tracking**: Full integration with your order management system

## Setup Instructions

### 1. Get PayPal API Credentials

1. Visit [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Log in with your PayPal business account
3. Navigate to "Apps & Credentials"
4. Create a new app or select an existing one
5. Copy your **Client ID** and **Secret** from both Sandbox and Live sections

### 2. Configure Environment Variables

Add the following variables to your `.env.local` file:

```bash
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here

# PayPal Environment (sandbox for testing, live for production)
NEXT_PUBLIC_PAYPAL_ENV=sandbox
```

**Important Notes:**
- For testing, use the **Sandbox** credentials and set `NEXT_PUBLIC_PAYPAL_ENV=sandbox`
- For production, use the **Live** credentials and set `NEXT_PUBLIC_PAYPAL_ENV=live`
- The `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is exposed to the browser (safe)
- The `PAYPAL_CLIENT_SECRET` is kept server-side only (secure)

### 3. Install Dependencies

The PayPal SDK package is already installed in this project:

```bash
npm install @paypal/react-paypal-js
```

## Architecture

### API Routes

#### 1. Create Order (`/api/payment/paypal/create-order`)

Creates a PayPal order and returns an order ID.

**Request:**
```json
{
  "amount": 10.00,
  "currency": "USD",
  "orderInfo": {
    "goodsName": "Product Name",
    "userId": "user@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "8XY12345AB678901C",
  "order": { /* Full PayPal order object */ }
}
```

#### 2. Capture Order (`/api/payment/paypal/capture-order`)

Captures (completes) the payment after user approval.

**Request:**
```json
{
  "orderId": "8XY12345AB678901C"
}
```

**Response:**
```json
{
  "success": true,
  "message": "결제가 완료되었습니다",
  "captureData": { /* Full capture data */ },
  "transactionId": "9XZ56789CD012345E"
}
```

### Component

#### PayPalButton Component

Location: [`/components/PayPalButton.tsx`](../components/PayPalButton.tsx)

A reusable React component that renders PayPal buttons with automatic payment flow handling.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | `number` | Yes | Payment amount (e.g., 10.00) |
| `currency` | `string` | No | Currency code (default: 'USD') |
| `onSuccess` | `(orderId: string) => void` | Yes | Callback when payment succeeds |
| `onError` | `(error: string) => void` | Yes | Callback when payment fails |
| `orderInfo` | `object` | No | Additional order information |

**Usage Example:**

```tsx
import PayPalButton from '@/components/PayPalButton';

function CheckoutPage() {
  return (
    <PayPalButton
      amount={29.99}
      currency="USD"
      orderInfo={{
        goodsName: "Premium Membership",
        userId: "user@example.com"
      }}
      onSuccess={(orderId) => {
        console.log('Payment successful:', orderId);
        // Redirect to success page or update UI
        window.location.href = `/payment/complete?orderId=${orderId}`;
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
        alert(`Payment failed: ${error}`);
      }}
    />
  );
}
```

## Testing

### Sandbox Testing

1. Set `NEXT_PUBLIC_PAYPAL_ENV=sandbox` in your `.env.local`
2. Use PayPal Sandbox credentials
3. Navigate to the payment page and select PayPal
4. When PayPal popup opens, use one of the following test accounts:

**Test Buyer Accounts** (Create at [sandbox.paypal.com](https://www.sandbox.paypal.com/)):
- Create a personal account for testing
- Or use PayPal's pre-created test accounts from the Developer Dashboard

**What to Test:**
- ✅ Successful payment flow
- ✅ Payment cancellation
- ✅ Error handling
- ✅ Currency conversion display
- ✅ Order completion page

### Production Deployment

Before going live:

1. ✅ Test thoroughly in Sandbox mode
2. ✅ Switch to Live credentials
3. ✅ Set `NEXT_PUBLIC_PAYPAL_ENV=live`
4. ✅ Verify all environment variables are set correctly
5. ✅ Test with small real transaction
6. ✅ Monitor PayPal transaction logs

## Integration Flow

```
1. User fills out payment form
   ↓
2. User selects PayPal payment method
   ↓
3. PayPal button is rendered
   ↓
4. User clicks PayPal button
   ↓
5. createOrder API is called (server-side)
   ↓
6. PayPal returns order ID
   ↓
7. PayPal popup/redirect opens for user login
   ↓
8. User approves payment in PayPal
   ↓
9. onApprove callback is triggered
   ↓
10. captureOrder API is called (server-side)
    ↓
11. Payment is completed and captured
    ↓
12. User is redirected to completion page
```

## Currency Conversion

The current implementation converts Korean Won (KRW) to USD using a simple approximation:

```typescript
amount={testAmount / 1000} // 1,000 KRW ≈ 1 USD
```

**For Production:**
Consider implementing real-time currency conversion using an API like:
- [exchangerate-api.com](https://www.exchangerate-api.com/)
- [fixer.io](https://fixer.io/)
- PayPal's multi-currency support

## Error Handling

The integration handles the following error scenarios:

- ❌ Missing API credentials
- ❌ Order creation failure
- ❌ Payment capture failure
- ❌ User cancellation
- ❌ Network errors
- ❌ PayPal service errors

All errors are logged to the console and displayed to the user with appropriate messages.

## Security Considerations

✅ **Client Secret is Server-side Only**: Never expose `PAYPAL_CLIENT_SECRET` to the browser

✅ **Order Validation**: All payment operations are validated server-side

✅ **HTTPS Required**: PayPal requires HTTPS in production

✅ **Webhook Verification**: Consider implementing PayPal webhooks for additional security

## Webhook Integration (Optional)

For production environments, consider setting up PayPal webhooks to handle:
- Payment completion notifications
- Refund notifications
- Dispute notifications
- Subscription events

Configure webhooks at: [PayPal Developer Dashboard → Webhooks](https://developer.paypal.com/dashboard/webhooks)

## Troubleshooting

### Issue: PayPal buttons not showing

**Solution:**
- Check that `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set correctly
- Verify the environment variable is prefixed with `NEXT_PUBLIC_`
- Restart your development server after changing env variables

### Issue: Payment fails immediately

**Solution:**
- Check browser console for error messages
- Verify PayPal credentials are correct for your environment (sandbox vs. live)
- Check that your PayPal business account is properly set up

### Issue: "Authorization failed" error

**Solution:**
- Verify `PAYPAL_CLIENT_SECRET` matches your Client ID
- Check that you're using the correct credentials for your environment
- Ensure your PayPal app has the necessary permissions

## Support & Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal JavaScript SDK Reference](https://developer.paypal.com/sdk/js/reference/)
- [PayPal REST API Reference](https://developer.paypal.com/api/rest/)
- [PayPal Sandbox Testing Guide](https://developer.paypal.com/tools/sandbox/)

## File Structure

```
the-union/
├── app/
│   ├── api/
│   │   └── payment/
│   │       └── paypal/
│   │           ├── create-order/
│   │           │   └── route.ts          # Creates PayPal orders
│   │           └── capture-order/
│   │               └── route.ts          # Captures completed payments
│   └── payment/
│       └── page.tsx                      # Payment page with PayPal integration
├── components/
│   └── PayPalButton.tsx                  # Reusable PayPal button component
├── docs/
│   └── PAYPAL_INTEGRATION.md            # This file
└── .env.local.example                   # Environment variable template
```

## Next Steps

1. Add your PayPal credentials to `.env.local`
2. Test the integration in Sandbox mode
3. Customize the PayPal button styling if needed
4. Implement proper order storage in your database
5. Set up webhooks for production reliability
6. Add currency conversion for international payments
7. Monitor transactions in PayPal Dashboard

---

**Last Updated:** 2025-11-13