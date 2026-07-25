import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getPaymentList } from '../../../api/billingApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const PaymentList = ({ keyword }) => {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("paymentDatetime,desc");

  useEffect(() => { setPage(0); }, [keyword]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['paymentList', keyword, page, sort],
    queryFn: () => getPaymentList(page, sort, keyword),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-700">결제 내역</h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none"
        >
          <option value="paymentDatetime,desc">최신순</option>
          <option value="paymentDatetime,asc">등록순</option>
        </select>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-zinc-400">불러오는 중...</p>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-red-400">목록을 불러오지 못했습니다.</p>
        ) : (
          <Table className="table-fixed w-full">
            <colgroup>
              <col style={{ width: '48px' }} />
              <col style={{ width: '96px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '96px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '144px' }} />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-zinc-50">
                <TableHead className="text-xs whitespace-nowrap">번호</TableHead>
                <TableHead className="text-xs whitespace-nowrap">환자</TableHead>
                <TableHead className="text-xs whitespace-nowrap">접수번호</TableHead>
                <TableHead className="text-xs whitespace-nowrap">결제금액</TableHead>
                <TableHead className="text-xs whitespace-nowrap">방식</TableHead>
                <TableHead className="text-xs whitespace-nowrap">결제일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.content?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-400">결제 내역이 없습니다.</TableCell>
                </TableRow>
              ) : (
                data?.content?.map((p, i) => (
                  <TableRow key={p.paymentId}>
                    <TableCell className="text-sm">{page * 10 + i + 1}</TableCell>
                    <TableCell className="text-sm">{p.patientName}</TableCell>
                    <TableCell className="text-sm">{p.receptionId}</TableCell>
                    <TableCell className="text-sm font-medium">{Number(p.amount).toLocaleString()}원</TableCell>
                    <TableCell>
                      <Badge className="text-xs bg-zinc-100 text-zinc-600 hover:bg-zinc-100">{p.method}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 whitespace-nowrap">
                      {dayjs(p.paymentDatetime).format('YYYY년 MM월 DD일 HH시 mm분 ss초')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setPage((p) => p - 1)} disabled={data?.first}
          className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">이전</button>
        <span className="text-sm text-zinc-500">{data?.number != null ? data.number + 1 : ''}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={data?.last}
          className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">다음</button>
      </div>
    </div>
  );
};

export default PaymentList;
