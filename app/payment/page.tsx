'use client';

import { useState, useEffect } from 'react';
import { formatKRW } from '@/lib/utils';
import Link from 'next/link';
import PayPalButton from '@/components/PayPalButton';

type PaymentMethod = 'card' | 'paypal';

// Payment method display mapping
const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: '신용카드' },
  { value: 'paypal', label: 'PayPal' },
];

export default function PaymentPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [testAmount, setTestAmount] = useState(1000); // Test amount field
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Listen for messages from payment popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      const { type, orderId, message: errorMessage } = event.data;

      if (type === 'PAYMENT_SUCCESS' && orderId) {
        // Redirect to complete page
        window.location.href = `/payment/complete?orderId=${orderId}`;
      } else if (type === 'PAYMENT_FAILED') {
        alert(`결제 실패: ${errorMessage}`);
        setIsSubmitting(false);
      } else if (type === 'PAYMENT_ERROR') {
        alert(`결제 처리 중 오류가 발생했습니다: ${errorMessage}`);
        setIsSubmitting(false);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      alert('이름을 입력해주세요');
      return;
    }
    if (!email.trim()) {
      alert('이메일을 입력해주세요');
      return;
    }
    if (!phone.trim()) {
      alert('전화번호를 입력해주세요');
      return;
    }
    if (!testAmount || testAmount <= 0) {
      alert('결제 금액을 입력해주세요');
      return;
    }
    if (!agreedToTerms) {
      alert('개인정보 수집 및 이용, 결제 진행에 동의해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data for testing
      const orderData = {
        name: name,
        email: email,
        phone_num: phone,
        address: null,
        delivery_method: '팬미팅현장수령',
        payment_method: paymentMethod,
        total_amount: testAmount,
      };

      // Create test cart items
      const testCartItems = [
        {
          productId: 'test-product',
          productName: '테스트 상품',
          price: testAmount,
          quantity: 1,
          option: null,
        },
      ];

      // Store order data in both sessionStorage and localStorage for callback page
      const pendingOrder = {
        orderData,
        cartItems: testCartItems,
      };

      try {
        sessionStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));
        localStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));
      } catch (storageError) {
        console.error('Storage error:', storageError);
      }

      // Register payment with EasyPay (only for card payments)
      if (paymentMethod === 'card') {
        const registerResponse = await fetch('/api/payment/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: testAmount,
            orderInfo: {
              goodsName: '테스트 상품',
              userId: email,
            },
          }),
        });

        if (!registerResponse.ok) {
          const errorData = await registerResponse.json();
          throw new Error(errorData.message || '결제 등록 실패');
        }

        const registerResult = await registerResponse.json();
        console.log('Payment registration result:', registerResult);

        if (!registerResult.success || !registerResult.authPageUrl) {
          throw new Error(registerResult.message || '결제 URL을 받지 못했습니다');
        }

        // Store shop order number for verification
        try {
          sessionStorage.setItem('currentShopOrderNo', registerResult.shopOrderNo);
          localStorage.setItem('currentShopOrderNo', registerResult.shopOrderNo);
        } catch (storageError) {
          console.error('Storage error:', storageError);
        }

        // Open payment window (popup or redirect)
        const popupWidth = 500;
        const popupHeight = 700;
        const left = window.screenX + (window.outerWidth - popupWidth) / 2;
        const top = window.screenY + (window.outerHeight - popupHeight) / 2;

        const paymentWindow = window.open(
          registerResult.authPageUrl,
          'easypay_payment',
          `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        // Check if popup was blocked
        if (!paymentWindow || paymentWindow.closed || typeof paymentWindow.closed === 'undefined') {
          console.log('Popup blocked, falling back to redirect');
          // Fallback to redirect
          window.location.href = registerResult.authPageUrl;
        } else {
          console.log('Payment popup opened successfully');
          // Popup opened successfully - wait for callback
          // The callback page will send a postMessage when done
        }
      } else {
        // For non-card payments (PayPal, etc.), implement their flow here
        alert('해당 결제 수단은 아직 지원하지 않습니다');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      return false;
    }
    if (!testAmount || testAmount <= 0) {
      return false;
    }
    if (!agreedToTerms) {
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-foreground">
      <main className="max-w-2xl mx-auto p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-700 hover:text-black transition-colors mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          <span className="font-medium">뒤로가기</span>
        </Link>
        <h1 className="text-3xl font-semibold text-black mb-8">결제 테스트</h1>

        <div className="bg-white rounded-lg border border-black/6 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-black">테스트 모드</h2>
          </div>
          <p className="text-sm text-zinc-600">
            이 페이지는 EasyPay 결제 테스트용입니다. 원하는 금액을 입력하고 테스트 결제를 진행할 수 있습니다.
          </p>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-black/6 shadow-sm p-6">
          {/* Test Amount */}
          <div className="mb-6">
            <label htmlFor="testAmount" className="block text-sm font-medium text-black mb-2">
              테스트 결제 금액 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="testAmount"
                value={testAmount}
                onChange={(e) => setTestAmount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-zinc-400"
                placeholder="1000"
                min="100"
                step="100"
                required
              />
              <span className="absolute right-4 top-2 text-zinc-600">원</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">최소 금액: 100원</p>
            <div className="mt-2 text-lg font-semibold text-black">
              결제 금액: {formatKRW(testAmount)}
            </div>
          </div>

          {/* Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="홍길동"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="honggildong@gmail.com"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="mb-6">
            <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder="010-1234-5678"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              결제 수단 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className="flex items-center gap-3 p-3 rounded-md border border-zinc-300 cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-4 h-4 text-black"
                  />
                  {method.value === 'card' ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-zinc-700"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-zinc-700"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                      />
                    </svg>
                  )}
                  <span className="text-black">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 p-4 rounded-md border border-zinc-300 cursor-pointer hover:bg-zinc-50 transition-colors">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-black rounded focus:ring-2 focus:ring-zinc-400"
              />
              <span className="text-sm text-black flex-1">
                개인정보 수집 및 이용, 결제 진행에 동의합니다.{' '}
                <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          {/* Submit Button / PayPal Button */}
          {paymentMethod === 'paypal' ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 text-center">
                PayPal 버튼을 클릭하여 결제를 진행해주세요
              </p>
              {isFormValid() ? (
                <PayPalButton
                  amount={testAmount / 1000} // Convert KRW to USD (approximate exchange rate)
                  currency="USD"
                  orderInfo={{
                    goodsName: '테스트 상품',
                    userId: email,
                  }}
                  onSuccess={(orderId) => {
                    console.log('PayPal payment success:', orderId);
                    // Store PayPal order info
                    try {
                      sessionStorage.setItem('paypalOrderId', orderId);
                      localStorage.setItem('paypalOrderId', orderId);
                    } catch (storageError) {
                      console.error('Storage error:', storageError);
                    }
                    // Redirect to complete page
                    window.location.href = `/payment/complete?orderId=${orderId}&method=paypal`;
                  }}
                  onError={(error) => {
                    console.error('PayPal payment error:', error);
                    alert(error);
                    setIsSubmitting(false);
                  }}
                />
              ) : (
                <div className="p-4 bg-zinc-100 border border-zinc-300 rounded-md text-center">
                  <p className="text-sm text-zinc-600">
                    모든 필수 항목을 입력하고 약관에 동의해주세요
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="w-full py-3 px-6 bg-black text-white rounded-md font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : '테스트 결제하기'}
            </button>
          )}
        </form>

        {/* Test Info */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">테스트 안내</h3>
          {paymentMethod === 'card' ? (
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• EasyPay 테스트 환경으로 실제 결제가 발생하지 않습니다</li>
              <li>• 테스트 카드 번호는 EasyPay/KICC에서 제공합니다</li>
              <li>• R102 오류는 정상 동작이며 자동으로 처리됩니다</li>
              <li>• 팝업이 차단되면 자동으로 리다이렉트 모드로 전환됩니다</li>
            </ul>
          ) : (
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• PayPal 샌드박스 환경으로 실제 결제가 발생하지 않습니다</li>
              <li>• PayPal 테스트 계정으로 로그인하여 결제를 진행하세요</li>
              <li>• 금액은 자동으로 USD로 환산됩니다 (약 1,000원 = 1 USD)</li>
              <li>• PayPal 결제 창에서 직접 결제를 완료할 수 있습니다</li>
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
