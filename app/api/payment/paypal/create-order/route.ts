import { NextRequest, NextResponse } from 'next/server';

// PayPal API base URL based on environment
const PAYPAL_API_BASE = process.env.NEXT_PUBLIC_PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Generate PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to get PayPal access token: ${errorData.error_description || response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'USD', orderInfo } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: '결제 금액이 올바르지 않습니다' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: orderInfo?.goodsName || '상품 구매',
          custom_id: orderInfo?.userId || '', // Store user email or ID for reference
        },
      ],
      application_context: {
        brand_name: 'The Union',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/complete`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment`,
      },
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal order creation failed:', errorData);
      return NextResponse.json(
        { success: false, message: 'PayPal 주문 생성에 실패했습니다', error: errorData },
        { status: response.status }
      );
    }

    const order = await response.json();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order,
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '주문 생성 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}