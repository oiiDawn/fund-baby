'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import type { FundData, FundSearchResult } from '@/app/types';

interface UseFundSearchOptions {
  searchFunds: (query: string) => Promise<FundSearchResult[]>;
  existingFunds: FundData[];
}

export function useFundSearch({
  searchFunds,
  existingFunds,
}: UseFundSearchOptions) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FundSearchResult[]>([]);
  const [selectedFunds, setSelectedFunds] = useState<FundSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  async function performSearch(value: string) {
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const fundsOnly = await searchFunds(value);
      setSearchResults(fundsOnly);
    } catch (searchError) {
      console.error('搜索失败', searchError);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchInput(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      void performSearch(value);
    }, 300);
  }

  function toggleSelectFund(fund: FundSearchResult) {
    setSelectedFunds((previousFunds) => {
      const exists = previousFunds.find(
        (selectedFund) => selectedFund.CODE === fund.CODE,
      );
      if (exists) {
        return previousFunds.filter(
          (selectedFund) => selectedFund.CODE !== fund.CODE,
        );
      }
      return [...previousFunds, fund];
    });
  }

  function resetSearch() {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedFunds([]);
    setShowDropdown(false);
    setError('');
  }

  function isFundAlreadyAdded(fundCode: string) {
    return existingFunds.some((fund) => fund.code === fundCode);
  }

  return {
    error,
    isSearching,
    searchResults,
    searchTerm,
    selectedFunds,
    showDropdown,
    handleSearchInput,
    isFundAlreadyAdded,
    resetSearch,
    setError,
    setSearchTerm,
    setSelectedFunds,
    setShowDropdown,
    toggleSelectFund,
  };
}
