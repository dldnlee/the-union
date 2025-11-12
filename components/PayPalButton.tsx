'use client';

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useState } from 'react';

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  orderInfo?: {
    goodsName: string;
    userId: string;
  };
}

export default function PayPalButton({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  orderInfo,
}: PayPalButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">
          PayPal 클라이언트 ID가 설정되지 않았습니다. 환경 변수를 확인해주세요.
        </p>
      </div>
    );
  }

  const createOrder = async (): Promise<string> => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/payment/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          orderInfo,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.orderId) {
        throw new Error(data.message || 'Failed to create PayPal order');
      }

      return data.orderId;
    } catch (error) {
      console.error('Create order error:', error);
      onError(error instanceof Error ? error.message : '주문 생성에 실패했습니다');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const onApprove = async (data: { orderID: string }): Promise<void> => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/payment/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      });

      const captureData = await response.json();

      if (!captureData.success) {
        throw new Error(captureData.message || 'Failed to capture payment');
      }

      onSuccess(data.orderID);
    } catch (error) {
      console.error('Capture error:', error);
      onError(error instanceof Error ? error.message : '결제 승인에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const onErrorHandler = (error: Record<string, unknown>): void => {
    console.error('PayPal error:', error);
    onError('PayPal 결제 중 오류가 발생했습니다');
    setIsProcessing(false);
  };

  const onCancel = (): void => {
    console.log('Payment cancelled by user');
    onError('결제가 취소되었습니다');
    setIsProcessing(false);
  };

  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-md">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-zinc-300 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-zinc-600">처리 중...</p>
          </div>
        </div>
      )}
      <PayPalScriptProvider
        options={{
          clientId,
          currency,
          intent: 'capture',
        }}
      >
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={onCancel}
          disabled={isProcessing}
        />
      </PayPalScriptProvider>
    </div>
  );
}