'use client';

import { useState } from 'react';

type AddressSearchProps = {
  onSelectAddress: (address: string, zipCode: string) => void;
  apiKey: string;
};

type JusoResult = {
  roadAddr: string;
  zipNo: string;
  bdNm: string;
  jibunAddr: string;
};

export function AddressSearch({ onSelectAddress, apiKey }: AddressSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<JusoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('검색어를 입력해주세요');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      // Korean address search API (Juso API)
      const response = await fetch(
        `https://business.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${apiKey}&currentPage=1&countPerPage=10&keyword=${encodeURIComponent(
          keyword
        )}&resultType=json`
      );

      const data = await response.json();

      if (data.results?.common?.errorCode !== '0') {
        throw new Error(data.results?.common?.errorMessage || '주소 검색에 실패했습니다');
      }

      const addressList = data.results?.juso || [];
      setResults(addressList);

      if (addressList.length === 0) {
        setError('검색 결과가 없습니다');
      }
    } catch (err) {
      console.error('Address search error:', err);
      setError(err instanceof Error ? err.message : '주소 검색 중 오류가 발생했습니다');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (result: JusoResult) => {
    onSelectAddress(result.roadAddr, result.zipNo);
    setResults([]);
    setKeyword('');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="도로명 주소 또는 건물명을 입력하세요"
          className="flex-1 px-4 py-2 bg-white border border-zinc-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="px-6 py-2 bg-zinc-800 text-white rounded-md font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? '검색 중...' : '검색'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {results.length > 0 && (
        <div className="border border-zinc-300 rounded-md max-h-64 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectAddress(result)}
              className="w-full text-left p-3 hover:bg-zinc-50 transition-colors border-b border-zinc-200 last:border-b-0"
            >
              <p className="text-sm font-medium text-black">{result.roadAddr}</p>
              <p className="text-xs text-zinc-600 mt-1">
                ({result.zipNo}) {result.jibunAddr}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
