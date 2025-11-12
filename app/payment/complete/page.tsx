'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

/**
 * Payment Complete Page
 *
 * Displays order confirmation after successful payment.
 */

function CompleteContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-foreground">
      <main className="max-w-2xl mx-auto p-8 pt-16">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
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
          <h1 className="text-3xl font-semibold text-black mb-2">결제가 완료되었습니다!</h1>
          <p className="text-zinc-600">주문이 성공적으로 접수되었습니다.</p>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-lg border border-black/6 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">주문 정보</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-zinc-200">
              <span className="text-zinc-600">주문번호</span>
              <span className="text-black font-mono font-medium">{orderId || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-600">결제 상태</span>
              <span className="text-green-600 font-medium">완료</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-black mb-3">다음 단계</h2>
          <ul className="space-y-2 text-sm text-zinc-700">
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>주문 확인 이메일이 발송되었습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>배송 정보는 주문 상태 페이지에서 확인하실 수 있습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>문의사항이 있으시면 고객센터로 연락해주세요.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="flex-1 py-3 px-6 bg-black text-white rounded-md font-medium text-center hover:opacity-90 transition-opacity"
            >
              주문 상세보기
            </Link>
          )}
          <Link
            href="/"
            className="flex-1 py-3 px-6 bg-white text-black border border-zinc-300 rounded-md font-medium text-center hover:bg-zinc-50 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-600">
            문의사항이 있으신가요?{' '}
            <Link href="/support" className="text-black font-medium hover:underline">
              고객센터
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 font-sans text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600">로딩 중...</p>
        </div>
      </div>
    }>
      <CompleteContent />
    </Suspense>
  );
}
