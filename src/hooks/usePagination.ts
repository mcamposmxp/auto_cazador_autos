import { useState, useMemo } from "react";

interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

interface UsePaginationReturn extends PaginationConfig {
  offset: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export function usePagination(initialLimit: number = 10): UsePaginationReturn {
  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const offset = useMemo(() => (page - 1) * limit, [page, limit]);
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrevPage = useMemo(() => page > 1, [page]);

  const nextPage = () => {
    if (hasNextPage) {
      setPageState(page + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
      setPageState(page - 1);
    }
  };

  const setPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageState(newPage);
    }
  };

  const setLimit = (newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1); // Reset to first page when changing limit
  };

  return {
    page,
    limit,
    total,
    offset,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    setPage,
    setLimit
  };
}