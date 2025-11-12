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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: '주문 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal capture failed:', errorData);
      return NextResponse.json(
        { success: false, message: 'PayPal 결제 승인에 실패했습니다', error: errorData },
        { status: response.status }
      );
    }

    const captureData = await response.json();

    // Check capture status
    if (captureData.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: '결제가 완료되었습니다',
        captureData,
        transactionId: captureData.purchase_units[0]?.payments?.captures[0]?.id || orderId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `결제 상태: ${captureData.status}`,
          captureData,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PayPal capture order error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '결제 승인 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}