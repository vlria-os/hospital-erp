import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

const canRegisterSurgery = () => {
  try {
    const token = sessionStorage.getItem("accessToken");
    const roles = token ? (jwtDecode(token).roles || []) : [];
    return roles.includes("PROFESSOR");
  } catch { return false; }
};
import CommonModal from "../../components/common/CommonModal";
import { getSurgeryList, registerSurgery, registerEmergencySurgery, updateSurgery, cancelSurgery } from "../../api/surgeryApi";
import { getStaffList } from "../../api/hr/staffApi";
import { getDoctorDepartmentList } from "../../api/hr/departmentApi";
import { getScheduleList } from "../../api/hr/staffScheduleApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scissors, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const getWeekDates = (baseDate) => {
  const d = new Date(baseDate);
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(sunday);
    cur.setDate(sunday.getDate() + i);
    return {
      date: formatDate(cur),
      label: `${String(cur.getMonth()+1).padStart(2,"0")}/${String(cur.getDate()).padStart(2,"0")}`,
      dayName: ["일","월","화","수","목","금","토"][cur.getDay()],
      isToday: formatDate(cur) === getTodayString(),
    };
  });
};

const STATUS_LABEL = { SCHEDULED: "예정", IN_PROGRESS: "진행 중", COMPLETED: "완료", CANCELLED: "취소", EMERGENCY: "응급" };
const STATUS_BADGE = {
  SCHEDULED:   "bg-blue-100 text-blue-700 hover:bg-blue-100",
  IN_PROGRESS: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  COMPLETED:   "bg-green-100 text-green-700 hover:bg-green-100",
  CANCELLED:   "bg-zinc-100 text-zinc-500 hover:bg-zinc-100",
  EMERGENCY:   "bg-red-100 text-red-700 hover:bg-red-100",
};
const STATUS_BORDER = {
  SCHEDULED: "border-l-blue-500", IN_PROGRESS: "border-l-amber-500",
  COMPLETED: "border-l-green-500", CANCELLED: "border-l-zinc-300", EMERGENCY: "border-l-red-500",
};

const emptyForm = { surgeryId: null, doctorId: "", patientId: "", startTime: "", durationHours: 1, description: "", status: "SCHEDULED" };

const selectClass = "w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50";

// ── SurgeryForm ──────────────────────────────────────────────────────────────
const SurgeryForm = ({ formData, setFormData, onSubmit, onClose, isEdit, isEmergency, staffList, departmentList, scheduleList }) => {
  const [filterDeptId, setFilterDeptId] = useState("");

  const filteredDoctors = useMemo(() =>
    !filterDeptId ? staffList : staffList.filter(s => String(s.departmentId) === String(filterDeptId)),
    [staffList, filterDeptId]);

  const scheduleWarning = useMemo(() => {
    if (!formData.doctorId || !formData.startTime) return null;
    const dateStr = formData.startTime.slice(0, 10);
    const schedule = scheduleList.find(s => String(s.staffId) === String(formData.doctorId) && s.workDate === dateStr);
    if (!schedule) return { level: "error", msg: "해당 날짜에 직원 스케줄이 등록되지 않아 수술 등록이 불가합니다." };
    if (schedule.scheduleTypeId === 3) return { level: "error", msg: `휴일(${schedule.typeName || "OFF"}) 스케줄입니다. 수술 등록이 불가합니다.` };
    if (schedule.status === "TEMP") return { level: "warn", msg: `스케줄이 미확정(임시) 상태입니다. 확정 후 등록을 권장합니다.` };
    return { level: "ok", msg: `근무 스케줄 확인됨 (${schedule.typeName || schedule.typeCode || "근무"})` };
  }, [formData.doctorId, formData.startTime, scheduleList]);

  const isScheduleBlocked = !isEmergency && scheduleWarning?.level === "error";

  const handleChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.doctorId || !formData.patientId || !formData.startTime || !formData.durationHours) {
      alert("의사, 환자, 수술 시작 시간, 예상 시간은 필수입니다"); return;
    }
    if (isScheduleBlocked) { alert(scheduleWarning.msg); return; }
    onSubmit(formData);
  };

  const warningClass = scheduleWarning ? {
    error: "bg-red-50 border border-red-200 text-red-700",
    warn:  "bg-amber-50 border border-amber-200 text-amber-700",
    ok:    "bg-green-50 border border-green-200 text-green-700",
  }[scheduleWarning.level] : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 제목 */}
      <div className={cn(
        "rounded-xl px-4 py-3 flex items-center gap-3",
        isEmergency ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-100"
      )}>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          isEmergency ? "bg-red-100" : "bg-blue-100")}>
          <Scissors size={16} className={isEmergency ? "text-red-600" : "text-blue-600"} />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900">
            {isEmergency ? "응급 수술 등록" : isEdit ? "수술 수정" : "수술 등록"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEmergency ? "스케줄이 없어도 강제 등록됩니다." : "담당 의사의 근무 스케줄을 확인 후 등록하세요."}
          </p>
        </div>
        {isEmergency && <Badge className="ml-auto bg-red-100 text-red-700 hover:bg-red-100">응급</Badge>}
      </div>

      {/* 의사 선택 섹션 */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">의사 선택</p>
        <div className="space-y-1.5">
          <Label>담당 부서</Label>
          <select value={filterDeptId} onChange={e => setFilterDeptId(e.target.value)} className={selectClass}>
            <option value="">부서 선택</option>
            {departmentList.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>담당 의사 <span className="text-red-500">*</span></Label>
          <select name="doctorId" value={formData.doctorId} onChange={handleChange} required className={selectClass}>
            <option value="">의사 선택</option>
            {filteredDoctors.map(s => <option key={s.staffId} value={s.staffId}>{s.name} (#{s.staffId})</option>)}
          </select>
        </div>
      </div>

      {/* 수술 일정 섹션 */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">수술 일정</p>
        <div className="space-y-1.5">
          <Label>환자 ID <span className="text-red-500">*</span></Label>
          <Input type="number" name="patientId" value={formData.patientId} onChange={handleChange}
            placeholder="환자 ID를 입력하세요" required min={1} />
        </div>
        <div className="space-y-1.5">
          <Label>수술 시작 시간 <span className="text-red-500">*</span></Label>
          <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange}
            required className={selectClass} />
        </div>
        <div className="space-y-1.5">
          <Label>예상 소요 시간</Label>
          <div className="flex items-center gap-3">
            <Input type="number" name="durationHours" value={formData.durationHours} onChange={handleChange}
              min={1} max={24} required className="w-28" />
            <span className="text-sm text-zinc-500">시간</span>
          </div>
        </div>
        {isEdit && (
          <div className="space-y-1.5">
            <Label>상태</Label>
            <select name="status" value={formData.status} onChange={handleChange} className={selectClass}>
              {Object.entries(STATUS_LABEL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 스케줄 경고 */}
      {scheduleWarning && (
        <div className={cn("rounded-lg px-3 py-2.5 text-sm flex items-start gap-2", warningClass)}>
          <span className="shrink-0">{scheduleWarning.level === "error" ? "⛔" : scheduleWarning.level === "warn" ? "⚠️" : "✅"}</span>
          <span>
            {scheduleWarning.msg}
            {isEmergency && scheduleWarning.level === "error" && (
              <span className="ml-1.5 font-semibold">(응급 수술이므로 강제 등록 가능)</span>
            )}
          </span>
        </div>
      )}

      {/* 수술 내용 */}
      <div className="space-y-1.5">
        <Label>수술 내용</Label>
        <Textarea name="description" value={formData.description} onChange={handleChange}
          placeholder="수술 내용을 입력하세요" rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
        <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>취소</Button>
        <Button type="submit" disabled={isScheduleBlocked}
          className={cn("cursor-pointer", isEmergency ? "bg-red-600 hover:bg-red-700" : "")}>
          {isEmergency ? "응급 등록" : isEdit ? "수정" : "등록"}
        </Button>
      </div>
    </form>
  );
};

// ── SurgerySchedulePage ───────────────────────────────────────────────────────
const SurgerySchedulePage = () => {
  const [surgeryList, setSurgeryList]       = useState([]);
  const [staffList, setStaffList]           = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [scheduleList, setScheduleList]     = useState([]);
  const [selectedDeptId, setSelectedDeptId]       = useState("");
  const [selectedDoctorId, setSelectedDoctorId]   = useState("");
  const [selectedStatus, setSelectedStatus]       = useState("");
  const [doctorSearchKeyword, setDoctorSearchKeyword] = useState("");
  const [currentWeek, setCurrentWeek]       = useState(getTodayString());
  const [detailOpen, setDetailOpen]         = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [modalOpen, setModalOpen]           = useState(false);
  const [isEdit, setIsEdit]                 = useState(false);
  const [isEmergency, setIsEmergency]       = useState(false);
  const [formData, setFormData]             = useState(emptyForm);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [surgeries, staffs, depts, schedules] = await Promise.all([
        getSurgeryList(), getStaffList(), getDoctorDepartmentList(), getScheduleList(),
      ]);
      setSurgeryList(surgeries); setStaffList(staffs); setDepartmentList(depts);
      setScheduleList(Array.isArray(schedules) ? schedules : schedules?.content ?? []);
    } catch { alert("데이터를 불러오는 중 오류가 발생했습니다"); }
  };

  const fetchSurgeries = async () => {
    try { setSurgeryList(await getSurgeryList()); } catch (e) { console.error(e); }
  };

  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  const moveWeek  = (diff) => { const d = new Date(currentWeek); d.setDate(d.getDate() + diff * 7); setCurrentWeek(formatDate(d)); };

  const sortedDepartments = useMemo(() =>
    [...departmentList].sort((a,b) => (a.departmentName||"").localeCompare(b.departmentName||"","ko")),
    [departmentList]);

  const doctorsByDept = useMemo(() =>
    !selectedDeptId ? staffList : staffList.filter(s => String(s.departmentId) === String(selectedDeptId)),
    [staffList, selectedDeptId]);

  const filteredDoctors = useMemo(() => {
    let r = doctorsByDept;
    if (selectedDoctorId) r = r.filter(s => String(s.staffId) === String(selectedDoctorId));
    if (doctorSearchKeyword.trim()) r = r.filter(s => (s.name||"").includes(doctorSearchKeyword.trim()));
    return r;
  }, [doctorsByDept, selectedDoctorId, doctorSearchKeyword]);

  const surgeryMap = useMemo(() => {
    const map = {};
    const weekSet = new Set(weekDates.map(d => d.date));
    surgeryList.forEach(s => {
      if (!s.startTime) return;
      const dateStr = s.startTime.slice(0, 10);
      if (!weekSet.has(dateStr)) return;
      if (selectedStatus && s.status !== selectedStatus) return;
      const did = s.doctorId;
      if (!did) return;
      if (!map[did]) map[did] = {};
      if (!map[did][dateStr]) map[did][dateStr] = [];
      map[did][dateStr].push(s);
    });
    return map;
  }, [surgeryList, weekDates, selectedStatus]);

  const openDetail   = (s) => { setSelectedSurgery(s); setDetailOpen(true); };
  const closeDetail  = () => { setDetailOpen(false); setSelectedSurgery(null); };
  const openRegister = () => { setIsEdit(false); setIsEmergency(false); setFormData(emptyForm); setModalOpen(true); };
  const openEmergency = () => { setIsEdit(false); setIsEmergency(true); setFormData(emptyForm); setModalOpen(true); };
  const closeModal   = () => { setModalOpen(false); setFormData(emptyForm); };

  const openEdit = (s) => {
    setIsEdit(true); setIsEmergency(false); closeDetail();
    let durationHours = 1;
    if (s.startTime && s.endTime) durationHours = Math.round((new Date(s.endTime) - new Date(s.startTime)) / 3600000) || 1;
    setFormData({ surgeryId: s.surgeryId, doctorId: s.doctorId||"", patientId: s.patientId||"",
      startTime: s.startTime ? s.startTime.slice(0, 16) : "", durationHours, description: s.description||"", status: s.status||"SCHEDULED" });
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      const startIso = data.startTime.length === 16 ? data.startTime + ":00" : data.startTime;
      const payload  = { doctorId: Number(data.doctorId), patientId: Number(data.patientId), startTime: startIso, durationHours: Number(data.durationHours), description: data.description };
      if (isEdit)          { await updateSurgery({ ...payload, surgeryId: data.surgeryId, status: data.status }); alert("수술이 수정되었습니다"); }
      else if (isEmergency){ await registerEmergencySurgery(payload); alert("응급 수술이 등록되었습니다"); }
      else                 { await registerSurgery(payload); alert("수술이 등록되었습니다"); }
      closeModal(); fetchSurgeries();
    } catch (err) { alert(err?.response?.data?.message || "저장 중 오류가 발생했습니다"); }
  };

  const handleCancel = async (surgeryId) => {
    if (!window.confirm("해당 수술을 취소하시겠습니까?")) return;
    try { await cancelSurgery(surgeryId); alert("수술이 취소되었습니다"); closeDetail(); fetchSurgeries(); }
    catch { alert("취소 중 오류가 발생했습니다"); }
  };

  const handleResetFilter = () => { setSelectedDeptId(""); setSelectedDoctorId(""); setSelectedStatus(""); setDoctorSearchKeyword(""); setCurrentWeek(getTodayString()); };

  return (
    <div className="p-6 space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-zinc-900">수술 스케줄 관리</h2>
        </div>
        {canRegisterSurgery() && (
          <div className="flex gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={openRegister}>수술 등록</Button>
            <Button className="cursor-pointer bg-red-600 hover:bg-red-700 gap-1.5" onClick={openEmergency}>
              <AlertTriangle size={14} /> 응급 수술 등록
            </Button>
          </div>
        )}
      </div>

      {/* 필터 바 */}
      <div className="flex items-end gap-3 flex-wrap bg-zinc-50 rounded-xl border border-zinc-200 px-5 py-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-500">부서</p>
          <select value={selectedDeptId} onChange={e => { setSelectedDeptId(e.target.value); setSelectedDoctorId(""); }}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm min-w-36 focus:outline-none">
            <option value="">전체 부서</option>
            {sortedDepartments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-500">의사</p>
          <select value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm min-w-36 focus:outline-none">
            <option value="">전체 의사</option>
            {doctorsByDept.map(s => <option key={s.staffId} value={s.staffId}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-500">의사 검색</p>
          <Input value={doctorSearchKeyword} onChange={e => setDoctorSearchKeyword(e.target.value)}
            placeholder="이름 입력" className="w-36 h-9" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-500">상태</p>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm min-w-28 focus:outline-none">
            <option value="">전체 상태</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleResetFilter}>초기화</Button>
      </div>

      {/* 주간 캘린더 */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* 주간 네비 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200">
          <Button size="sm" variant="outline" className="cursor-pointer gap-1" onClick={() => moveWeek(-1)}>
            <ChevronLeft size={14} /> 이전 주
          </Button>
          <span className="text-sm font-semibold text-zinc-800 flex-1 text-center">
            {weekDates[0]?.date} ~ {weekDates[6]?.date}
          </span>
          <Button size="sm" variant="outline" className="cursor-pointer gap-1" onClick={() => moveWeek(1)}>
            다음 주 <ChevronRight size={14} />
          </Button>
          <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setCurrentWeek(getTodayString())}>오늘</Button>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: "900px", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th className="w-28 px-3 py-2.5 bg-zinc-50 border-b border-r border-zinc-200 text-xs font-semibold text-zinc-500 text-center">의사</th>
                {weekDates.map(day => (
                  <th key={day.date} className={cn(
                    "px-2 py-2.5 border-b border-r border-zinc-200 text-center text-xs",
                    day.isToday ? "bg-blue-50" : "bg-zinc-50",
                    day.dayName === "일" ? "text-red-500" : day.dayName === "토" ? "text-blue-600" : "text-zinc-600"
                  )}>
                    <p className="font-bold text-sm">{day.dayName}</p>
                    <p className="text-zinc-400 mt-0.5">{day.label}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-zinc-400">표시할 의사 데이터가 없습니다.</td>
                </tr>
              ) : (
                filteredDoctors.map(doctor => (
                  <tr key={doctor.staffId} className="border-b border-zinc-100">
                    <td className="px-3 py-3 border-r border-zinc-200 bg-zinc-50 text-center">
                      <p className="text-sm font-semibold text-zinc-800">{doctor.name}</p>
                      <p className="text-xs text-zinc-400">#{doctor.staffId}</p>
                    </td>
                    {weekDates.map(day => {
                      const surgeries   = surgeryMap[doctor.staffId]?.[day.date] || [];
                      const docSchedule = scheduleList.find(s => String(s.staffId)===String(doctor.staffId) && s.workDate===day.date);
                      const isOff       = docSchedule?.scheduleTypeId === 3;
                      const hasNoSch    = !docSchedule;

                      return (
                        <td key={day.date} className={cn(
                          "px-2 py-2 border-r border-zinc-100 align-top min-h-20",
                          day.isToday && "bg-blue-50/30",
                          isOff && "bg-red-50/40",
                          hasNoSch && !isOff && "bg-zinc-50/60"
                        )}>
                          {/* 스케줄 뱃지 */}
                          <div className="mb-1.5">
                            {isOff && <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">휴일</span>}
                            {!isOff && !hasNoSch && docSchedule.status === "TEMP" && (
                              <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">미확정</span>
                            )}
                            {!isOff && !hasNoSch && docSchedule.status !== "TEMP" && (
                              <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">{docSchedule.typeName || "근무"}</span>
                            )}
                            {hasNoSch && <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400">스케줄없음</span>}
                          </div>

                          {/* 수술 카드 */}
                          {surgeries.map(s => (
                            <div key={s.surgeryId} onClick={() => openDetail(s)}
                              className={cn("rounded-md p-1.5 mb-1 cursor-pointer border-l-2 bg-white border border-zinc-200 hover:shadow-sm transition-shadow text-xs",
                                STATUS_BORDER[s.status] || "border-l-zinc-300"
                              )}>
                              <Badge className={cn("text-[9px] px-1 py-0 mb-1", STATUS_BADGE[s.status] || STATUS_BADGE.SCHEDULED)}>
                                {STATUS_LABEL[s.status] || s.status}
                              </Badge>
                              <p className="font-semibold text-zinc-700">
                                {s.startTime?.slice(11,16)}{s.endTime ? ` ~ ${s.endTime.slice(11,16)}` : ""}
                              </p>
                              <p className="text-zinc-500 truncate">{s.description || "-"}</p>
                              <p className="text-zinc-400">환자: {s.patientName || s.patientId || "-"}</p>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 모달 */}
      <CommonModal open={detailOpen} onClose={closeDetail} title="수술 상세 정보">
        {selectedSurgery && (
          <div className="space-y-4">
            <div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2.5 text-sm">
              {[
                ["상태",      <Badge className={cn("text-xs", STATUS_BADGE[selectedSurgery.status])}>{STATUS_LABEL[selectedSurgery.status]||selectedSurgery.status}</Badge>],
                ["담당 의사",  `${selectedSurgery.doctorName} (#${selectedSurgery.doctorId})`],
                ["환자",      `${selectedSurgery.patientName} (#${selectedSurgery.patientId})`],
                ["시작 시간",  selectedSurgery.startTime ? new Date(selectedSurgery.startTime).toLocaleString('ko-KR') : ""],
                ["종료 시간",  selectedSurgery.endTime ? new Date(selectedSurgery.endTime).toLocaleString('ko-KR') : ""],
                ["수술 내용",  selectedSurgery.description || "-"],
                ["등록 일시",  selectedSurgery.createdAt ? new Date(selectedSurgery.createdAt).toLocaleString('ko-KR') : ""],
              ].map(([k, v]) => (
                <>
                  <span className="text-zinc-500 font-medium self-center">{k}</span>
                  <span className="text-zinc-800 self-center">{v}</span>
                </>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={closeDetail}>닫기</Button>
              {selectedSurgery.status !== "CANCELLED" && (
                <>
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => openEdit(selectedSurgery)}>수정하기</Button>
                  <Button size="sm" className="cursor-pointer bg-red-500 hover:bg-red-600" onClick={() => handleCancel(selectedSurgery.surgeryId)}>수술 취소</Button>
                </>
              )}
            </div>
          </div>
        )}
      </CommonModal>

      {/* 등록/수정 모달 */}
      <CommonModal open={modalOpen} onClose={closeModal} title={isEmergency ? "응급 수술 등록" : isEdit ? "수술 수정" : "수술 등록"}>
        <SurgeryForm formData={formData} setFormData={setFormData} onSubmit={handleSubmit}
          onClose={closeModal} isEdit={isEdit} isEmergency={isEmergency}
          staffList={staffList} departmentList={departmentList} scheduleList={scheduleList} />
      </CommonModal>
    </div>
  );
};

export default SurgerySchedulePage;
