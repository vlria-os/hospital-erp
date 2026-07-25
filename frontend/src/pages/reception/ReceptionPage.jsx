import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import jwtAxios from '../../api/jwtAxios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardList, Search, User, Stethoscope, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const STATUS_TABS = [
  { key: "",           label: "전체" },
  { key: "PENDING",    label: "미접수" },
  { key: "RECEIVED",   label: "접수" },
  { key: "CONSULTING", label: "진료중" },
  { key: "COMPLETED",  label: "완료" },
];

const STATUS_BADGE = {
  PENDING:    { label: "미접수",  className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  RECEIVED:   { label: "접수",    className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  CONSULTING: { label: "진료중",  className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100" },
  COMPLETED:  { label: "완료",    className: "bg-green-100 text-green-700 hover:bg-green-100" },
};

const ReceptionPage = () => {
  const [status, setStatus]           = useState("");
  const [name, setName]               = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [page, setPage]               = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { setPage(0); }, [status, debouncedName]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(name), 500);
    return () => clearTimeout(timer);
  }, [name]);

  const confirmedHandler = async (receptionId) => {
    await jwtAxios.get(`/api/administration/recieved?receptionId=${receptionId}`)
      .then(() => { alert("접수 완료"); queryClient.invalidateQueries({ queryKey: ['receptionList'] }); })
      .catch(console.error);
  };

  const cancelHandler = async (reservationId) => {
    await jwtAxios.get(`/api/reception/cancel?reservationId=${reservationId}`)
      .then(() => { alert("취소 완료"); queryClient.invalidateQueries({ queryKey: ['receptionList'] }); })
      .catch(console.error);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['receptionList', status, debouncedName, page],
    queryFn: () => jwtAxios.get('/api/reception', {
      params: { status: status || undefined, name: debouncedName, page, size: 5 }
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const list       = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const badge = (s) => STATUS_BADGE[s] ?? { label: s, className: '' };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <ClipboardList size={20} className="text-blue-600" />
        <h1 className="text-lg font-bold text-zinc-900">접수</h1>
      </div>

      {/* 탭 */}
      <div className="flex rounded-xl border border-zinc-200 overflow-hidden bg-white">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              status === tab.key
                ? "bg-blue-600 text-white"
                : "text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input
          className="pl-8"
          placeholder="환자 이름 검색"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* 카드 목록 */}
      {isLoading ? (
        <p className="text-center text-sm text-zinc-400 py-8">불러오는 중...</p>
      ) : list.length === 0 ? (
        <p className="text-center text-sm text-zinc-400 py-8">접수 내역이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <div
              key={item.receptionId}
              className={cn(
                "bg-white rounded-xl border p-4 shadow-sm cursor-pointer transition-colors",
                selectedCard === item.receptionId
                  ? "border-blue-400 bg-blue-50"
                  : "border-zinc-200 hover:border-zinc-300"
              )}
              onClick={() => setSelectedCard(item.receptionId)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-zinc-400" />
                  <span className="font-semibold text-zinc-900">{item.patientName}</span>
                </div>
                <Badge className={badge(item.status).className}>{badge(item.status).label}</Badge>
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                  <Stethoscope size={13} className="text-zinc-400" />
                  {item.doctorName}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Clock size={12} className="text-zinc-300" />
                  {dayjs(item.reservationDate).format('YYYY.MM.DD HH:mm:ss')}
                </div>
              </div>
              {item.status !== "COMPLETED" && (
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                  <Button
                    size="sm"
                    className="h-7 text-xs cursor-pointer"
                    onClick={() => confirmedHandler(item.receptionId)}
                  >
                    접수
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs cursor-pointer"
                    onClick={() => cancelHandler(item.reservationId)}
                  >
                    취소
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages >= 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)} disabled={page === 0}
            className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >이전</button>
          <span className="text-sm text-zinc-500">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}
            className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >다음</button>
        </div>
      )}
    </div>
  );
};

export default ReceptionPage;
