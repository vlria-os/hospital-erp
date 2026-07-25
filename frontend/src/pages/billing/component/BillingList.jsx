import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { cashPayment, confirmPayment, getBillingList, insertTotalAmount, preparePayment } from '../../../api/billingApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const API_CLIENT_KEY = import.meta.env.VITE_TOSS_API_CLIENT_KEY;

const STATUS_MAP = {
  PENDING:   { label: '미결제',    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  PARTIAL:   { label: '부분결제',  className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  COMPLETED: { label: '완료',      className: 'bg-green-100 text-green-700 hover:bg-green-100' },
};

const BillingList = ({ keyword }) => {
  const [page, setPage]                       = useState(0);
  const [sort, setSort]                       = useState("billingId,desc");
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [amount, setAmount]                   = useState("");
  const [totalAmount, setTotalAmount]         = useState("");
  const [recordId, setRecordId]               = useState("");
  const [name, setName]                       = useState("");
  const [billing, setBilling]                 = useState(null);
  const [paying, setPaying]                   = useState(false);
  const [openTotalAmountModal, setOpenTotalAmountModal] = useState(false);
  const [inputAmount, setInputAmount]         = useState("");

  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const queryClient    = useQueryClient();

  useEffect(() => { setPage(0); }, [keyword]);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId    = searchParams.get("orderId");
    const amount     = searchParams.get("amount");
    if (!paymentKey || !orderId || !amount) return;

    const confirm = async () => {
      try {
        await confirmPayment({ paymentKey, orderId, amount: Number(amount) });
        alert("결제가 완료되었습니다.");
        queryClient.invalidateQueries({ queryKey: ["billingList"] });
        queryClient.invalidateQueries({ queryKey: ["paymentList"] });
        navigate("/billing", { replace: true });
      } catch {
        alert("결제 승인 실패!");
        navigate("/billing", { replace: true });
      }
    };
    confirm();
  }, [searchParams, navigate, queryClient]);

  const insertAmountMutation = useMutation({
    mutationFn: insertTotalAmount,
    onSuccess: () => {
      alert("총 금액이 변경되었습니다.");
      queryClient.invalidateQueries({ queryKey: ['billingList'] });
      closeTotalAmountModal();
    },
    onError: () => alert("총 금액 변경에 실패했습니다."),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['billingList', keyword, page, sort],
    queryFn: () => getBillingList(page, sort, keyword),
  });

  const handlePayment = async () => {
    if (paying) return;
    setPaying(true);
    try {
      if (!billing) { alert("청구서 정보가 없습니다."); return; }
      const payAmount = Number(amount);
      if (!payAmount || payAmount <= 0) { alert("결제 금액이 올바르지 않습니다."); return; }

      const prepare = await preparePayment({ billingId: billing.billingId, amount: payAmount });
      const tossPayments = await loadTossPayments(API_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: `billing_${billing.billingId}` });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: prepare.amount },
        orderId: prepare.orderId,
        orderName: prepare.orderName,
        customerName: prepare.customerName,
        successUrl: `${window.location.origin}/billing`,
        failUrl: `${window.location.origin}/billing`,
      });
      closePaymentModal();
    } catch { alert("결제를 진행할 수 없습니다."); }
    finally { setPaying(false); }
  };

  const handleCashPayment=async()=>{
    if(paying) return;
    setPaying(true);

    try{
      if(!billing) {
        alert("청구서 정보가 없습니다.");
        return;
      }

      const payAmount=Number(amount);
      if (!payAmount || payAmount <= 0) { alert("결제 금액이 올바르지 않습니다."); return; }

      const res=await cashPayment({billingId: billing.billingId, amount: payAmount});
      alert("결제가 완료되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["billingList"] });
      queryClient.invalidateQueries({ queryKey: ["paymentList"] });
      closePaymentModal();
      navigate("/billing", { replace: true });
    }catch{
      alert("현금 결제 실패!");
      closePaymentModal();
      navigate("/billing", { replace: true });
    } finally {
      setPaying(false);
    }
  }

  const closePaymentModal = () => {
    setOpenPaymentModal(false); setBilling(null);
    setName(""); setTotalAmount(""); setRecordId(""); setAmount("");
  };

  const closeTotalAmountModal = () => {
    setOpenTotalAmountModal(false); setBilling(null); setInputAmount("");
  };

  const status = (s) => STATUS_MAP[s] ?? { label: s, className: '' };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-700">청구 목록</h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none"
        >
          <option value="billingId,desc">최신순</option>
          <option value="billingId,asc">등록순</option>
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
              <col style={{ width: '120px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '64px' }} />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-zinc-50">
                <TableHead className="text-xs whitespace-nowrap">번호</TableHead>
                <TableHead className="text-xs whitespace-nowrap">환자</TableHead>
                <TableHead className="text-xs whitespace-nowrap">접수번호</TableHead>
                <TableHead className="text-xs whitespace-nowrap">총 금액</TableHead>
                <TableHead className="text-xs whitespace-nowrap">상태</TableHead>
                <TableHead className="text-xs whitespace-nowrap">결제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.content?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-400">청구서가 없습니다.</TableCell>
                </TableRow>
              ) : (
                data?.content?.map((b, i) => (
                  <TableRow key={b.billingId}>
                    <TableCell className="text-sm">{page * 10 + i + 1}</TableCell>
                    <TableCell className="text-sm truncate">{b.patientName}</TableCell>
                    <TableCell className="text-sm">{b.receptionId}</TableCell>
                    <TableCell className="text-sm">
                      {b.totalAmount === null ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer"
                          onClick={() => { setBilling(b); setInputAmount(""); setOpenTotalAmountModal(true); }}>
                          입력
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>{b.totalAmount.toLocaleString()}원</span>
                          {b.status === 'PENDING' && (
                            <button onClick={() => { setBilling(b); setInputAmount(b.totalAmount); setOpenTotalAmountModal(true); }}
                              className="text-[10px] text-zinc-400 hover:text-zinc-600 underline cursor-pointer">수정</button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${status(b.status).className}`}>{status(b.status).label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" className="h-7 text-xs cursor-pointer"
                        disabled={(b.status !== 'PENDING' && b.status !== 'PARTIAL') || b.totalAmount === null}
                        onClick={() => { setAmount(""); setBilling(b); setName(b.patientName); setTotalAmount(b.totalAmount); setRecordId(b.receptionId); setOpenPaymentModal(true); }}>
                        결제
                      </Button>
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

      {/* 결제 모달 */}
      <Dialog open={openPaymentModal} onOpenChange={(v) => { if (!v) closePaymentModal(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>결제</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4 space-y-1.5 text-sm">
              <p><span className="text-zinc-500 w-20 inline-block">환자</span><span className="font-medium">{name}</span></p>
              <p><span className="text-zinc-500 w-20 inline-block">접수 번호</span><span className="font-medium">{recordId}</span></p>
              <p><span className="text-zinc-500 w-20 inline-block">총 금액</span><span className="font-medium">{Number(totalAmount).toLocaleString()}원</span></p>
            </div>
            <div className="space-y-1.5">
              <Label>결제 금액</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="금액 입력" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={handleCashPayment}>현금 결제</Button>
            <Button className="flex-1 cursor-pointer" onClick={handlePayment} disabled={paying}>
              {paying ? '처리 중...' : '전자 결제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 총 금액 입력 모달 */}
      <Dialog open={openTotalAmountModal} onOpenChange={(v) => { if (!v) closeTotalAmountModal(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{billing?.receptionId}번 접수 건 총 금액</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 mt-2">
            <Label>금액</Label>
            <Input type="number" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)} placeholder="금액 입력" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeTotalAmountModal} className="cursor-pointer">취소</Button>
            <Button
              disabled={insertAmountMutation.isPending}
              className="cursor-pointer"
              onClick={() => {
                if (!billing) { alert("청구서 정보가 없습니다."); return; }
                const amt = Number(inputAmount);
                if (!amt || amt <= 0) { alert("금액이 올바르지 않습니다."); return; }
                insertAmountMutation.mutate({ billingId: billing.billingId, totalAmount: amt });
              }}
            >
              {insertAmountMutation.isPending ? '처리 중...' : '확인'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingList;
