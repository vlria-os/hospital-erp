import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Stethoscope, Bot, Search, AlertTriangle, Plus } from 'lucide-react';

export const API_BASE_URL = import.meta.env.VITE_CHATBOT_API_BASE_URL;

const STATUS_TABS = [
  { key: "DIAGNOSIS",    label: "진료" },
  { key: "TEST",         label: "검사" },
  { key: "SURGERY",      label: "수술" },
  { key: "PRESCRIPTION", label: "처방" },
];

const WAITING_TABS = [
  { key: "",           label: "전체" },
  { key: "RECEIVED",   label: "대기" },
  { key: "CONSULTING", label: "진료중" },
  { key: "COMPLETED",  label: "완료" },
];

const WAITING_BADGE = {
  RECEIVED:   { label: "대기",   className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  CONSULTING: { label: "진료중", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  COMPLETED:  { label: "완료",   className: "bg-green-100 text-green-700 hover:bg-green-100" },
};

const MedicalRecordPage = () => {
  const queryClient = useQueryClient();
  const [selectedPat, setSelectedPat]               = useState("");
  const [status, setStatus]                         = useState("DIAGNOSIS");
  const [page, setPage]                             = useState(0);
  const [size]                                      = useState(3);
  const [selectedRecord, setSelectedRecord]         = useState(null);
  const [isAdding, setIsAdding]                     = useState(false);
  const [showReasonModal, setShowReasonModal]       = useState(false);
  const [reason, setReason]                         = useState("");
  const [pendingRecord, setPendingRecord]           = useState(null);
  const [waitingPage, setWaitingPage]               = useState(0);
  const [waitingSize]                               = useState(3);
  const [showStatusModal, setShowStatusModal]       = useState(false);
  const [pendingReceptionId, setPendingReceptionId] = useState(null);
  const [pendingPatientId, setPendingPatientId]     = useState(null);
  const [waitingStatus, setWaitingStatus]           = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId]     = useState(null);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState("");
  const [aiResult, setAiResult]                     = useState(null);
  const [showCompleteModal, setShowCompleteModal]   = useState(false);
  const [searchKeyword, setSearchKeyword]           = useState("");
  const [searchPage, setSearchPage]                 = useState(0);
  const [searchSize]                                = useState(3);
  const [searchData, setSearchData]                 = useState(null);
  const [isSearching, setIsSearching]               = useState(false);
  const [newRecord, setNewRecord]                   = useState({ title: "", symptom: "", content: "", isSensitive: false });
  const [aiLoading, setAiLoading]                   = useState(false);

  const handleSearch = async (newPage = 0) => {
    if (!searchKeyword || !selectedPat) return;
    const res = await jwtAxios.post("/api/elastic/search", { patientId: selectedPat, keyword: searchKeyword, page: newPage, size: searchSize });
    setSearchData(res.data); setSearchPage(newPage); setSelectedRecord(null); setIsSearching(true);
  };

  const clearSearch = () => { setSearchKeyword(""); setIsSearching(false); setSearchData(null); };

  const { data: waitingData } = useQuery({
    queryKey: ["medicalRecords", waitingStatus, waitingPage, waitingSize],
    queryFn: async () => (await jwtAxios.get("/api/waitingList", { params: { page: waitingPage, size: waitingSize, ...(waitingStatus && { status: waitingStatus }) } })).data,
  });
  const list = waitingData?.content || [];

  const { data: patientData } = useQuery({
    queryKey: ["patientInfo", selectedPat],
    queryFn: async () => (await jwtAxios.get("/api/medicalrecord/patientInfo", { params: { patientId: selectedPat } })).data,
    enabled: !!selectedPat,
  });

  const { data: recordData } = useQuery({
    queryKey: ["medicalRecord", selectedPat, status, page],
    queryFn: async () => (await jwtAxios.get("/api/medicalrecord/record", { params: { patientId: selectedPat, status, page, size } })).data,
    enabled: !!selectedPat && !!status,
  });

  const recordList  = recordData?.content || [];
  const displayList = isSearching ? (searchData?.content || []) : recordList;
  const currentPage = isSearching ? searchPage : page;
  const totalPages  = isSearching ? (searchData?.totalPages || 1) : (recordData?.totalPages || 1);

  const saveRecord = async () => {
    await jwtAxios.post("/api/medicalrecord", { patientId: selectedPat, medicalRecordStatus: status, title: newRecord.title, content: newRecord.content, symptom: newRecord.symptom, isSensitive: newRecord.isSensitive });
    queryClient.invalidateQueries({ queryKey: ["medicalRecord"] });
    alert("추가 완료"); setIsAdding(false); setNewRecord({ title: "", content: "", symptom: "", isSensitive: false });
    setShowCompleteModal(false); setPendingReceptionId(null);
  };

  const handleAdd       = () => { setPendingReceptionId(pendingReceptionId); setShowCompleteModal(true); };
  const handleConfirmYes = async () => { try { if (pendingReceptionId) await jwtAxios.patch("/api/reception/status", null, { params: { receptionId: pendingReceptionId, status: "COMPLETED" } }); await saveRecord(); } catch (err) { console.error(err); } };
  const handleConfirmNo  = async () => { try { await saveRecord(); } catch (err) { console.error(err); } };

  const handleRecordClick = async (item) => {
    try {
      if (item.isSensitive) { setPendingRecord(item); setShowReasonModal(true); return; }
      const res = await jwtAxios.get("/api/medicalrecord/record/detail", { params: { recordId: item.medicalRecordId, reason: null } });
      setSelectedRecord(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmitReason = async () => {
    try {
      await jwtAxios.get("/api/medicalrecord/record/detail", { params: { recordId: pendingRecord.medicalRecordId, reason } });
      setSelectedRecord(pendingRecord); setShowReasonModal(false); setReason(""); setPendingRecord(null);
    } catch (err) { console.error(err); alert("열람 기록 저장 실패"); }
  };

  const handleChangeToInProgress = async () => {
    try {
      await jwtAxios.patch("/api/reception/status", null, { params: { receptionId: pendingReceptionId, status: "CONSULTING" } });
      setShowStatusModal(false); setPendingReceptionId(null); setPendingPatientId(null);
      queryClient.invalidateQueries({ queryKey: ["medicalRecords"] });
    } catch (err) { console.error(err); alert("상태 변경 실패"); }
  };

  const aiHandler = async () => {
    if (!newRecord.symptom) { alert("증상을 입력하세요"); return; }
    setAiLoading(true);
    try {
      const res = await jwtAxios.post(`${API_BASE_URL}/ai/diagnose`, { patientId: parseInt(selectedPat), departmentId: parseInt(selectedDepartmentId), departmentName: selectedDepartmentName, symptom: newRecord.symptom }, { headers: { "Content-Type": "application/json" } });
      const data = res.data;
      const warning = `⚠️ 본 기록에는 AI 보조 진단 결과가 포함되어 있습니다. AI는 참고용이며, 최종 진단 및 치료 결정에 대한 책임은 담당 의사에게 있습니다.\n----------------------------------------\n`;
      setAiResult(data);
      setNewRecord(prev => ({ ...prev, content: warning + data.ai_diagnosis }));
    } catch (err) { console.error("AI 진단 오류:", err); alert("AI 진단 요청 실패"); }
    finally { setAiLoading(false); }
  };

  const wBadge = (s) => WAITING_BADGE[s] ?? { label: s, className: '' };

  return (
    <div className="flex gap-4 p-4 h-full bg-zinc-50" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* 왼쪽: 대기 목록 */}
      <div className="w-72 shrink-0 bg-white rounded-xl border border-zinc-200 flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope size={16} className="text-blue-600" />
            <h2 className="text-sm font-bold text-zinc-900">진료</h2>
          </div>
          <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
            {WAITING_TABS.map(tab => (
              <button key={tab.key} onClick={() => { setWaitingStatus(tab.key); setWaitingPage(0); }}
                className={cn("flex-1 py-1.5 text-xs font-medium transition-colors",
                  waitingStatus === tab.key ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50"
                )}>{tab.label}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {list.map(item => (
            <div key={item.receptionId}
              onClick={() => { setPendingReceptionId(item.receptionId); setPendingPatientId(item.patientId); setSelectedPat(item.patientId); setSelectedDepartmentId(item.departmentId); setSelectedDepartmentName(item.departmentName); setShowStatusModal(item.status === "RECEIVED"); }}
              className={cn("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                pendingReceptionId === item.receptionId ? "border-blue-400 bg-blue-50" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
              )}
            >
              <div>
                <p className="text-sm font-semibold text-zinc-900">{item.patientName}</p>
                 <p className="text-xs text-zinc-600">{item.symptom}</p>
                <p className="text-xs text-zinc-400">접수 #{item.receptionId}</p>
              </div>
              <Badge className={wBadge(item.status).className}>{wBadge(item.status).label}</Badge>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 p-3 border-t border-zinc-100">
          <button onClick={() => setWaitingPage(p => p - 1)} disabled={waitingPage === 0}
            className="px-3 h-7 text-xs rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40">이전</button>
          <span className="text-xs text-zinc-500">{waitingPage + 1} / {waitingData?.totalPages || 1}</span>
          <button onClick={() => setWaitingPage(p => p + 1)} disabled={waitingPage + 1 >= (waitingData?.totalPages || 1)}
            className="px-3 h-7 text-xs rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40">다음</button>
        </div>
      </div>

      {/* 오른쪽: 환자 정보 + 진료 기록 */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">

        {/* 환자 정보 */}
        {patientData?.patient && (
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs font-semibold text-zinc-500 mb-3">환자 정보</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "이름", value: patientData.patient.name },
                { label: "전화번호", value: patientData.patient.phone },
                { label: "성별", value: "Female" },
                { label: "혈액형", value: "A Rh+" },
                { label: "신장", value: "162 cm" },
                { label: "체중", value: "52 kg" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-3 py-2 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className="text-sm font-semibold text-zinc-800">{value || "-"}</span>
                </div>
              ))}
              <div className="col-span-3 flex justify-between items-center px-3 py-2 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-xs text-zinc-500">주소</span>
                <span className="text-sm font-semibold text-zinc-800">{patientData.patient.address || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {!selectedPat ? (
          <div className="flex-1 bg-white rounded-xl border border-zinc-200 flex items-center justify-center">
            <p className="text-sm text-zinc-400">환자를 선택해주세요</p>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden">
            {/* 탭 + 검색 + 추가 버튼 */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 flex-wrap">
              <div className="flex gap-1">
                {STATUS_TABS.map(tab => (
                  <button key={tab.key} onClick={() => { setStatus(tab.key); setPage(0); }}
                    className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border-b-2 transition-colors",
                      status === tab.key ? "border-blue-600 text-blue-600 bg-blue-50" : "border-transparent text-zinc-500 hover:text-zinc-800"
                    )}>{tab.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input className="pl-7 h-8 text-xs w-36" placeholder="검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs cursor-pointer" onClick={() => handleSearch(0)}>검색</Button>
                {isSearching && <Button size="sm" variant="ghost" className="h-8 text-xs cursor-pointer" onClick={clearSearch}>초기화</Button>}
                {status !== "SEARCH" && (
                  <Button size="sm" className="h-8 text-xs gap-1 cursor-pointer" onClick={() => { setIsAdding(true); setSelectedRecord(null); }}>
                    <Plus size={12} /> 추가
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden gap-4 p-4">
              {/* 기록 목록 */}
              <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto">
                {displayList.map(item => (
                  <div key={item.medicalRecordId} onClick={() => handleRecordClick(item)}
                    className="p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-zinc-400">{item.doctorName}</span>
                      <span className="text-[10px] text-zinc-300">{item.createAt ? item.createAt ? new Date(item.createAt).toLocaleString('ko-KR') : "" : ""}</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-800">
                      {item.isSensitive ? <span className="flex items-center gap-1 text-amber-600"><AlertTriangle size={12} /> 민감 정보 포함</span> : item.title}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button onClick={() => isSearching ? handleSearch(searchPage - 1) : setPage(p => p - 1)} disabled={currentPage === 0}
                    className="px-2 h-6 text-xs rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40">이전</button>
                  <span className="text-xs text-zinc-400">{currentPage + 1} / {totalPages}</span>
                  <button onClick={() => isSearching ? handleSearch(searchPage + 1) : setPage(p => p + 1)} disabled={currentPage + 1 >= totalPages}
                    className="px-2 h-6 text-xs rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40">다음</button>
                </div>
              </div>

              {/* 상세 / 추가 폼 */}
              <div className="flex-1 overflow-y-auto">
                {isAdding ? (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-zinc-700">새 기록 추가 ({status})</p>

                    <div className="space-y-1.5">
                      <Label className="text-xs">제목</Label>
                      <Input value={newRecord.title} onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })} />
                    </div>

                    {status === "DIAGNOSIS" && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">증상</Label>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 cursor-pointer border-violet-200 text-violet-600 hover:bg-violet-50" onClick={aiHandler} disabled={aiLoading}>
                            <Bot size={12} /> {aiLoading ? "분석 중..." : "AI 진단"}
                          </Button>
                        </div>
                        <Textarea value={newRecord.symptom} onChange={(e) => setNewRecord({ ...newRecord, symptom: e.target.value })} rows={3} />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs">내용</Label>
                      <Textarea value={newRecord.content} onChange={(e) => setNewRecord({ ...newRecord, content: e.target.value })} rows={5} />
                    </div>

                    {aiResult && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1"><Bot size={12} /> AI 진단 결과</p>
                        <p className="text-xs text-green-800 whitespace-pre-wrap leading-relaxed">{aiResult.ai_diagnosis}</p>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newRecord.isSensitive} onChange={(e) => setNewRecord({ ...newRecord, isSensitive: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                      <span className="text-xs text-zinc-600 flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" /> 민감 정보 포함</span>
                    </label>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setIsAdding(false)}>취소</Button>
                      <Button size="sm" className="cursor-pointer" onClick={handleAdd}>저장</Button>
                    </div>
                  </div>
                ) : selectedRecord ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start pb-3 border-b border-zinc-100">
                      <p className="text-sm font-bold text-zinc-900">{selectedRecord.departmentName} / {selectedRecord.doctorName}</p>
                      <p className="text-xs text-zinc-400">{selectedRecord.createAt ? new Date(selectedRecord.createAt).toLocaleString('ko-KR') : ""}</p>
                    </div>
                    <p className="text-lg font-bold text-zinc-900">{selectedRecord.title}</p>
                    {selectedRecord.isSensitive && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
                        <AlertTriangle size={13} /> 민감 정보 포함
                      </div>
                    )}
                    <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      <strong>증상:</strong> {selectedRecord.symptom || '증상 없음'}<br /><br />
                      {selectedRecord.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-zinc-400">기록을 선택하세요</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 민감 정보 열람 모달 */}
      <Dialog open={showReasonModal} onOpenChange={(v) => { if (!v) setShowReasonModal(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> 민감 정보 열람</DialogTitle></DialogHeader>
          <p className="text-xs text-red-500">이 기록은 민감 정보입니다. 열람 사유는 로그로 저장됩니다.</p>
          <Textarea placeholder="열람 사유 입력" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-2" />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowReasonModal(false)}>취소</Button>
            <Button size="sm" className="cursor-pointer" disabled={!reason} onClick={handleSubmitReason}>확인</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 진료 시작 모달 */}
      <Dialog open={showStatusModal} onOpenChange={(v) => { if (!v) setShowStatusModal(false); }}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader><DialogTitle>진료 시작</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-600 mt-2">진료중으로 변경하시겠습니까?</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button size="sm" className="cursor-pointer" onClick={handleChangeToInProgress}>예</Button>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowStatusModal(false)}>아니오</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 진료 완료 모달 */}
      <Dialog open={showCompleteModal} onOpenChange={(v) => { if (!v) setShowCompleteModal(false); }}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader><DialogTitle>진료 완료</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-600 mt-2">진료를 완료하시겠습니까?</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button size="sm" className="cursor-pointer" onClick={handleConfirmYes}>예</Button>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleConfirmNo}>아니오</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicalRecordPage;
