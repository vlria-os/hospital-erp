import { cancelReservation, getMyReservations } from '@/api/patientApi';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_MAP = {
  RECEIVED:  { label: '신청',      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  PENDING:   { label: '가예약',    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  CONFIRMED: { label: '확정',      className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  COMPLETED: { label: '진료 완료', className: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-100' },
  CANCELED:  { label: '취소',      className: 'bg-red-100 text-red-600 hover:bg-red-100' },
};

const STATUS_FILTERS = [
  { value: '', label: '전체' },
  { value: 'RECEIVED', label: '신청' },
  { value: 'PENDING', label: '가예약' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'COMPLETED', label: '진료 완료' },
  { value: 'CANCELED', label: '취소' },
];

const MyReservation = () => {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("reservationId,desc");
  const [status, setStatus] = useState("");

  const navigate=useNavigate();
  const queryClient=useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['myReservation', page, sort, status],
    queryFn: () => getMyReservations(page, sort, status),
    placeholderData: keepPreviousData,
  });

  const cancelMutation=useMutation({
    mutationFn: cancelReservation,
    onSuccess: (result) => {
      if(result.status === "CANCELED"){
        const reservationId=Number(result.reservationId);

        alert(reservationId + "번 예약을 취소했습니다.");
        queryClient.invalidateQueries({queryKey: ['myReservation']});
        navigate("/patient/mypage", {replace:true});
      }
    },
    onError: () => {
      alert("예약을 취소할 수 없습니다.");
    }
  });

  const cancel=(reservationId, status)=>{
    if(!reservationId || !status){
      alert("예약 정보를 읽을 수 없습니다.");
      return;
    }

    cancelMutation.mutate({ reservationId, status });
  }

  const getStatus = (s) => STATUS_MAP[s] ?? { label: '알 수 없음', className: '' };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-blue-600" />
        <h2 className="text-sm font-semibold text-zinc-700">예약 내역</h2>
      </div>

      {/* 필터 + 정렬 한 줄 — pills는 flex-1 overflow-x-auto로 스크롤, select는 shrink-0으로 항상 우측 고정 */}
      <div className="flex items-center gap-2">
        <div
          className="flex gap-1 flex-1 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { setStatus(f.value); setPage(0); }}
              className={`shrink-0 px-3 h-7 text-xs rounded-full border transition-colors cursor-pointer
                ${status === f.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-blue-400 hover:text-blue-600'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="shrink-0 h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none"
        >
          <option value="reservationId,desc">최신순</option>
          <option value="reservationId,asc">등록순</option>
        </select>
      </div>

      <div className="space-y-1.5">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-zinc-400">불러오는 중...</p>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red-400">예약 내역을 불러오지 못했습니다.</p>
        ) : data?.content?.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">예약 내역이 없습니다.</p>
        ) : (
          data?.content?.map((d) => {
            const s = getStatus(d.status);
            const canCancel = d.status === 'RECEIVED' || d.status === 'PENDING';

            return (
              <div key={d.reservationId} className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-800">{d.departmentName}</span>
                    <Badge className={`text-xs ${s.className}`}>{s.label}</Badge>
                  </div>
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      onClick={() => cancel(d.reservationId, d.status)}
                    >
                      취소
                    </Button>
                  )}
                </div>
                <p className="text-xs text-zinc-500 line-clamp-1">{d.symptom}</p>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{d.doctorName !== null ? d.doctorName:"미지정"}</span>
                  <span>{dayjs(d.createdAt).format("YYYY.MM.DD HH:mm")}</span>
                </div>
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

export default MyReservation;
