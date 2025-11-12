'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { clearCart } from '@/lib/cart';

/**
 * Payment Callback Page
 *
 * Handles payment callback from EasyPay in redirect mode.
 * Verifies payment, creates order, and redirects to complete page.
 */

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('결제 처리 중...');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get callback data from URL parameters
        const resCd = searchParams.get('resCd');
        const resMsg = searchParams.get('resMsg');
        const shopOrderNo = searchParams.get('shopOrderNo');
        const authorizationId = searchParams.get('authorizationId');
        const amount = searchParams.get('amount');

        console.log('Processing payment callback:', {
          resCd,
          resMsg,
          shopOrderNo,
          authorizationId,
        });

        // Check if payment was successful
        if (resCd !== '0000') {
          console.error('Payment failed:', resMsg);
          setStatus('error');
          setMessage(`결제 실패: ${resMsg}`);

          // Send error message to parent if in popup
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'PAYMENT_FAILED',
                message: resMsg,
              },
              window.location.origin
            );

            // Close popup after showing error
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            // Redirect to payment page with error in redirect mode
            setTimeout(() => {
              router.push(`/payment?error=${encodeURIComponent(resMsg || 'Payment failed')}`);
            }, 2000);
          }
          return;
        }

        if (!shopOrderNo) {
          throw new Error('Shop order number is missing');
        }

        // Retrieve pending order data from storage
        // Try sessionStorage first, then localStorage
        let pendingOrderData = null;
        try {
          pendingOrderData = sessionStorage.getItem('pendingOrder');
          if (!pendingOrderData) {
            pendingOrderData = localStorage.getItem('pendingOrder');
          }
        } catch (e) {
          console.error('Storage access error:', e);
        }

        if (!pendingOrderData) {
          throw new Error('Order data not found');
        }

        const orderData = JSON.parse(pendingOrderData);
        console.log('Retrieved order data:', orderData);

        // Verify shop order number matches
        const storedShopOrderNo = sessionStorage.getItem('currentShopOrderNo') ||
                                  localStorage.getItem('currentShopOrderNo');

        if (storedShopOrderNo && storedShopOrderNo !== shopOrderNo) {
          throw new Error('Order number mismatch');
        }

        // Step 1: Verify payment with server
        console.log('Verifying payment with server...');
        const approveResponse = await fetch('/api/payment/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopOrderNo: shopOrderNo,
            amount: parseInt(amount || orderData.orderData.total_amount, 10),
            authorizationId: authorizationId,
          }),
        });

        if (!approveResponse.ok) {
          const errorData = await approveResponse.json();
          throw new Error(errorData.message || 'Payment verification failed');
        }

        const approveResult = await approveResponse.json();
        console.log('Payment verification result:', approveResult);

        if (!approveResult.success) {
          throw new Error(approveResult.message || 'Payment verification failed');
        }

        // Step 2: Create order in database
        console.log('Creating order in database...');
        const createOrderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order: {
              ...orderData.orderData,
              payment_id: approveResult.data.paymentId,
              shop_order_no: shopOrderNo,
              payment_status: 'completed',
              payment_method: 'card',
            },
            items: orderData.cartItems,
          }),
        });

        if (!createOrderResponse.ok) {
          const errorData = await createOrderResponse.json();
          throw new Error(errorData.message || 'Order creation failed');
        }

        const orderResult = await createOrderResponse.json();
        console.log('Order created:', orderResult);

        // Step 3: Clear cart and storage
        clearCart();
        try {
          sessionStorage.removeItem('pendingOrder');
          sessionStorage.removeItem('currentShopOrderNo');
          localStorage.removeItem('pendingOrder');
          localStorage.removeItem('currentShopOrderNo');
        } catch (e) {
          console.error('Storage cleanup error:', e);
        }

        // Step 4: Show success and redirect
        setStatus('success');
        setMessage('결제 완료!');

        // Send success message to parent if in popup
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'PAYMENT_SUCCESS',
              orderId: orderResult.orderId,
            },
            window.location.origin
          );

          // Close popup after success
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          // Redirect to complete page in redirect mode
          setTimeout(() => {
            router.push(`/payment/complete?orderId=${orderResult.orderId}`);
          }, 1000);
        }

      } catch (error) {
        console.error('Payment processing error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다');

        // Send error to parent if in popup
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'PAYMENT_ERROR',
              message: error instanceof Error ? error.message : 'Payment processing failed',
            },
            window.location.origin
          );

          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          // Redirect to payment page with error
          setTimeout(() => {
            router.push(`/payment?error=${encodeURIComponent(
              error instanceof Error ? error.message : 'Payment processing failed'
            )}`);
          }, 2000);
        }
      }
    };

    processPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-foreground flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg border border-black/6 shadow-sm max-w-md">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-zinc-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-black">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-lg text-black font-semibold">{message}</p>
            <p className="text-sm text-zinc-600 mt-2">잠시 후 완료 페이지로 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <p className="text-lg text-black font-semibold">결제 실패</p>
            <p className="text-sm text-zinc-600 mt-2">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
