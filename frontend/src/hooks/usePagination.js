import { useState, useMemo, useEffect } from "react";

const usePagination = (data = [], pageSize = 10) => {
  const [page, setPage] = useState(0);

  // 데이터나 검색결과 바뀌면 1페이지로 리셋
  useEffect(() => {
    setPage(0);
  }, [data.length]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const pagedData = useMemo(
    () => data.slice(page * pageSize, (page + 1) * pageSize),
    [data, page, pageSize]
  );

  return { pagedData, page, setPage, totalPages };
};

export default usePagination;
