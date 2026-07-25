import { getMyPaymentList, getMyReceptions } from '@/api/patientApi';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';

const MyReception = () => {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("DESC");
  const [receptionId, setReceptionId] = useState(null);
  const [paymentPage, setPaymentPage] = useState(0);
  const [paymentSort, setPaymentSort] = useState("paymentId,desc");

  const { data, isLoading, isError } = useQuery({
    queryKey: ['myReception', page, sort],
    queryFn: () => getMyReceptions(page, sort),
    placeholderData: keepPreviousData,
  });

  // mutation 대신 useQuery — queryKey에 sort/page 포함되므로 변경 시 자동 리패치
  // keepPreviousData로 이전 데이터 유지 → 깜빡임 없음
  const { data: paymentData, isLoading: paymentLoading, isError: paymentIsError } = useQuery({
    queryKey: ['myPayment', receptionId, paymentPage, paymentSort],
    queryFn: () => getMyPaymentList(paymentPage, paymentSort, receptionId),
    enabled: !!receptionId,
    placeholderData: keepPreviousData,
  });

  const handleCardClick = (id) => {
    if (receptionId === Number(id)) {
      setReceptionId(null);
      setPaymentPage(0);
      setPaymentSort("paymentId,desc");
    } else {
      setPaymentPage(0);
      setPaymentSort("paymentId,desc");
      setReceptionId(Number(id));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-zinc-700">접수 / 결제 내역</h2>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none"
        >
          <option value="DESC">최신순</option>
          <option value="ASC">등록순</option>
        </select>
      </div>

      <div className="space-y-1.5">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-zinc-400">불러오는 중...</p>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red-400">접수 내역을 불러오지 못했습니다.</p>
        ) : data?.content?.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">접수 내역이 없습니다.</p>
        ) : (
          data?.content.map((d) => {
            const isOpen = receptionId === Number(d.receptionId);

            return (
              <div key={d.receptionId} className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                <div
                  className="px-3 py-2.5 space-y-1 cursor-pointer hover:bg-zinc-50 transition-colors"
                  onClick={() => handleCardClick(d.receptionId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-800">{d.departmentName}</span>
                      <Badge className="text-xs bg-zinc-100 text-zinc-600 hover:bg-zinc-100">
                        {d.status === 'COMPLETED' ? '진료 완료' : '알 수 없음'}
                      </Badge>
                    </div>
                    {isOpen
                      ? <ChevronUp size={14} className="text-zinc-400" />
                      : <ChevronDown size={14} className="text-zinc-400" />
                    }
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">{d.symptom}</p>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>{d.doctorName}</span>
                    <span>{dayjs(d.receptionDate).format("YYYY.MM.DD")}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">결제 내역</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={paymentSort}
                          onChange={(e) => setPaymentSort(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 rounded border border-zinc-200 bg-white px-1.5 text-xs text-zinc-600 focus:outline-none"
                        >
                          <option value="paymentId,desc">최신순</option>
                          <option value="paymentId,asc">등록순</option>
                        </select>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleCardClick(d.receptionId); }}
                          className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                        >
                          닫기
                        </button>
                      </div>
                    </div>

                    {paymentLoading && !paymentData ? (
                      <p className="py-3 text-center text-xs text-zinc-400">불러오는 중...</p>
                    ) : paymentIsError ? (
                      <p className="py-3 text-center text-xs text-red-400">결제 내역을 불러오지 못했습니다.</p>
                    ) : !paymentData || paymentData?.content.length === 0 ? (
                      <p className="py-3 text-center text-xs text-zinc-400">결제 내역이 없습니다.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {paymentData.content.map((p) => (
                          <div key={p.paymentId} className="rounded-md border border-zinc-200 bg-white px-3 py-2 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">접수번호 {d.receptionId}</span>
                              <span className="text-xs font-medium text-zinc-700">{p.method}</span>
                            </div>
                            <p className="text-sm font-semibold text-zinc-800">{Number(p.amount).toLocaleString()}원</p>
                            <p className="text-xs text-zinc-400">{dayjs(p.paidAt).format("YYYY.MM.DD HH:mm")}</p>
                          </div>
                        ))}
                        <div className="flex items-center justify-center gap-2 pt-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPaymentPage((p) => p - 1); }}
                            disabled={paymentData?.first}
                            className="px-3 h-7 text-xs rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >이전</button>
                          <span className="text-xs text-zinc-500">{paymentData?.number != null ? paymentData.number + 1 : ''}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPaymentPage((p) => p + 1); }}
                            disabled={paymentData?.last}
                            className="px-3 h-7 text-xs rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >다음</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!isLoading && !isError && data?.content?.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={data?.first}
            className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >이전</button>
          <span className="text-sm text-zinc-500">{data?.number != null ? data.number + 1 : ''}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data?.last}
            className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >다음</button>
        </div>
      )}
    </div>
  );
};

export default MyReception;
