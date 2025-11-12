# EasyPay Integration Setup Guide

This guide will help you set up and test the EasyPay card payment integration in your Next.js application.

## Overview

The EasyPay integration has been implemented following the official 3-step WebPay flow with automatic R102 error handling. The system supports both popup and redirect payment modes.

## Files Created

### API Routes
- **[app/api/payment/register/route.ts](app/api/payment/register/route.ts)** - Payment registration endpoint
- **[app/api/payment/approve/route.ts](app/api/payment/approve/route.ts)** - Payment verification endpoint with R102 fallback
- **[app/api/payment/callback/route.ts](app/api/payment/callback/route.ts)** - Payment callback handler
- **[app/api/orders/create/route.ts](app/api/orders/create/route.ts)** - Order creation endpoint

### Frontend Pages
- **[app/payment/page.tsx](app/payment/page.tsx)** - Payment form with EasyPay integration
- **[app/payment/callback/page.tsx](app/payment/callback/page.tsx)** - Payment callback processor
- **[app/payment/complete/page.tsx](app/payment/complete/page.tsx)** - Order confirmation page

### Configuration
- **[.env.local.example](.env.local.example)** - Environment variables template

### Documentation
- **[EASYPAY_INTEGRATION.md](EASYPAY_INTEGRATION.md)** - Detailed integration guide
- **[EASYPAY_FIXES.md](EASYPAY_FIXES.md)** - Common issues and fixes
- **[PAYMENT_CALLBACK_FLOW.md](PAYMENT_CALLBACK_FLOW.md)** - Callback flow documentation

## Setup Steps

### 1. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Update the following variables in `.env.local`:

```env
# Supabase (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# EasyPay Configuration (Test Mode)
EASYPAY_MALL_ID=T0021482
EASYPAY_API_KEY=your_actual_api_key_here
EASYPAY_API_URL=https://testpgapi.easypay.co.kr
EASYPAY_TEST_MODE=true
```

**Important:** Replace `your_actual_api_key_here` with your actual EasyPay API key provided by KICC.

### 2. Verify Database Schema

Ensure your Supabase database has the following tables:

- `orders` - Main orders table
- `order_items` - Order line items
- `delivery_method` - Delivery methods (팬미팅현장수령, 국내배송, 해외배송)
- `products` - Product catalog
- `product_variants` - Product variants
- `inventory_stock` - Inventory management

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Your app should now be running at http://localhost:3000

## Testing the Payment Flow

### Test Card Payment

1. **Navigate to Payment Page**
   - Add items to cart
   - Go to `/payment`

2. **Fill Out Order Form**
   - Enter customer information
   - Select delivery method
   - Choose "신용카드" (Credit Card) as payment method
   - Agree to terms

3. **Complete Payment**
   - Click "결제하기" button
   - Payment popup should open (or redirect if popup blocked)
   - Use EasyPay test card numbers provided by KICC
   - Complete the test payment

4. **Verify Success**
   - Payment callback page should process the payment
   - Order should be created in database
   - Cart should be cleared
   - User should be redirected to `/payment/complete`

### Expected Flow

```
User clicks "결제하기"
  ↓
System registers payment with EasyPay
  ↓
Popup/redirect opens with EasyPay payment page
  ↓
User completes payment
  ↓
EasyPay redirects to callback endpoint
  ↓
System verifies payment (approval or query API)
  ↓
Order created in database
  ↓
User redirected to completion page
```

## Understanding R102 Error

**R102 is EXPECTED behavior for EasyPay WebPay!**

### Why R102 Occurs
- WebPay payments are automatically approved by EasyPay when completed
- When we call the approval API, the payment is already approved
- EasyPay returns R102 indicating the approval request is invalid

### How We Handle It
The system automatically:
1. Tries approval API first
2. On R102 error, falls back to query API
3. Query API returns the payment status
4. Payment is verified successfully ✅

This is implemented in [app/api/payment/approve/route.ts](app/api/payment/approve/route.ts:104-176).

## Troubleshooting

### Payment Registration Fails

**Check:**
- `EASYPAY_MALL_ID` is set correctly
- `EASYPAY_API_URL` points to correct environment
- Network can reach EasyPay API
- Server logs for detailed error messages

### Payment Approval Fails

**This is normal!** R102 error should trigger automatic fallback to query API.

**Check server logs for:**
```
R102 Error - Invalid authorization or missing parameters
Attempting to query payment status instead...
Query response: { resCd: '0000', ... }
Payment query successful, using query data
```

If both approval and query fail:
- Verify `EASYPAY_API_KEY` is correct
- Check `shopOrderNo` matches between registration and callback
- Ensure payment was actually completed in EasyPay window

### Order Data Not Found

**Check:**
- Browser allows `localStorage` and `sessionStorage`
- `pendingOrder` is stored before opening payment window
- Console for storage-related errors

### Popup Blocked

**This is handled automatically!** The system detects popup blocking and falls back to redirect mode.

## Production Deployment

### Before Going Live

1. **Update Environment Variables:**
   ```env
   EASYPAY_API_URL=https://pgapi.easypay.co.kr
   EASYPAY_TEST_MODE=false
   NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
   EASYPAY_MALL_ID=your_production_mall_id
   EASYPAY_API_KEY=your_production_api_key
   ```

2. **Obtain Production Credentials:**
   - Contact KICC/EasyPay for production credentials
   - Complete merchant verification process
   - Receive production mall ID and API key

3. **Security Checklist:**
   - ✅ API keys stored in environment variables (never in code)
   - ✅ HTTPS enabled on production domain
   - ✅ Server-side payment verification implemented
   - ✅ Amount validation in approval endpoint
   - ✅ Order number verification in callback

4. **Test in Staging:**
   - Create staging environment with production-like setup
   - Test all payment scenarios
   - Verify error handling
   - Check order creation and inventory updates

5. **Monitor:**
   - Set up logging for payment events
   - Monitor R102 fallback success rate
   - Track payment failures
   - Alert on critical errors

## Payment Flow Architecture

### Dual Storage Strategy
- **sessionStorage**: Primary storage for popup flow
- **localStorage**: Fallback for redirect flow
- Ensures payment works in all browser configurations

### Security Features
1. **Server-side payment registration** - API keys never exposed to client
2. **Order number matching** - Verifies callback data matches stored order
3. **Server-side verification** - Always verifies with EasyPay before creating order
4. **Amount validation** - Ensures paid amount matches expected amount
5. **Origin validation** - postMessage only accepted from same origin

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payment/register` | POST | Register payment with EasyPay |
| `/api/payment/callback` | POST/GET | Receive payment callback from EasyPay |
| `/api/payment/approve` | POST | Verify payment with approval API |
| `/api/payment/approve?shopOrderNo=xxx` | GET | Query payment status |
| `/api/orders/create` | POST | Create order in database |

## Support & Resources

### Documentation
- [EASYPAY_INTEGRATION.md](EASYPAY_INTEGRATION.md) - Complete integration guide
- [EASYPAY_FIXES.md](EASYPAY_FIXES.md) - Quick fixes reference
- [PAYMENT_CALLBACK_FLOW.md](PAYMENT_CALLBACK_FLOW.md) - Callback flow details

### Getting Help
- Check server logs for detailed error information
- Review browser console for client-side errors
- Verify all environment variables are set correctly
- Ensure EasyPay test credentials are valid

### Contact
- **EasyPay Support:** Contact KICC for integration assistance
- **Technical Issues:** Check the documentation files listed above

## Next Steps

1. ✅ Set up environment variables
2. ✅ Test payment flow in development
3. ⬜ Customize completion page design
4. ⬜ Implement email confirmation
5. ⬜ Add order tracking page
6. ⬜ Set up production credentials
7. ⬜ Deploy to production

## Notes

- The integration supports both popup and redirect payment modes
- R102 error handling is automatic - no action needed
- Payment verification always happens server-side for security
- Cart is cleared only after successful order creation
- Order data is stored in both sessionStorage and localStorage for reliability

---

**Last Updated:** 2025-01-13
**EasyPay API Version:** WebPay v9
**Integration Status:** ✅ Complete
