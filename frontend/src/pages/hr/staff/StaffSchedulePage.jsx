import { useEffect, useMemo, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import RegisterButton from "../../../components/common/RegisterButton";
import SearchBar from "../../../components/common/SearchBar";
import CommonTable from "../../../components/common/CommonTable";
import CommonModal from "../../../components/common/CommonModal";
import Pagination from "../../../components/common/Pagination";
import StaffScheduleForm from "../../../components/form/StaffScheduleForm";
import BulkScheduleForm from "../../../components/form/BulkScheduleForm";
import AutoScheduleConditionForm from "../../../components/form/AutoScheduleConditionForm";
import AutoScheduleResultView from "../../../components/schedule/AutoScheduleResultView";
import WeekScheduleTable from "../../../components/schedule/WeekScheduleTable";
import usePagination from "../../../hooks/usePagination";
import { Button } from "@/components/ui/button";
import { CalendarDays, Bot, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  bulkConfirmSchedule, bulkRegisterSchedule, confirmAutoSchedule,
  confirmSchedule, deleteSchedule, generateAutoSchedule,
  getScheduleList, registerSchedule, updateSchedule,
} from "../../../api/hr/staffScheduleApi";
import { getStaffList } from "../../../api/hr/staffApi";
import { getDepartmentList } from "../../../api/hr/departmentApi";
import { getRoleList } from "../../../api/hr/roleApi";
import { getSchedulePolicyList, getPolicyList } from "../../../api/hr/schedulePolicyApi";

const initialForm     = { scheduleId: "", departmentId: "", staffId: "", workDate: "", scheduleTypeId: "", status: "TEMP" };
const initialBulkForm = { departmentId: "", staffIds: [], startDate: "", endDate: "", scheduleTypeId: "", status: "TEMP" };

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};


const DepartmentScheduleGroup = ({ departmentName, items, columns, deptTableData }) => {
  const { pagedData, page, setPage, totalPages } = usePagination(items, 5);
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-zinc-500 mb-2">{departmentName}</p>
      <CommonTable columns={columns} data={deptTableData(pagedData)} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} variant="sub" />
    </div>
  );
};

const selectClass = "h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const getRoles = () => {
  try {
    const token = sessionStorage.getItem("accessToken");
    return token ? (jwtDecode(token).roles || []) : [];
  } catch { return []; }
};
const canManageSchedule = () => {
  const roles = getRoles();
  return roles.includes("PROFESSOR") || roles.includes("ADMIN");
};

const StaffSchedulePage = () => {
  const [scheduleList, setScheduleList]       = useState([]);
  const [departmentList, setDepartmentList]   = useState([]);
  const [staffList, setStaffList]             = useState([]);
  const [scheduleTypeList, setScheduleTypeList] = useState([]);
  const [roleList, setRoleList]               = useState([]);
  const [searchKeyword, setSearchKeyword]     = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId]   = useState("");
  const [selectedScheduleTypeId, setSelectedScheduleTypeId] = useState("");
  const [selectedDate, setSelectedDate]       = useState(getTodayString());
  const [calendarRange, setCalendarRange]     = useState({ start: null, end: null });
  const [viewMode, setViewMode]               = useState("month");
  const [open, setOpen]                       = useState(false);
  const [formData, setFormData]               = useState(initialForm);
  const [isEdit, setIsEdit]                   = useState(false);
  const [bulkOpen, setBulkOpen]               = useState(false);
  const [bulkFormData, setBulkFormData]       = useState(initialBulkForm);
  const [autoOpen, setAutoOpen]               = useState(false);
  const [autoLoading, setAutoLoading]         = useState(false);
  const [autoResultOpen, setAutoResultOpen]   = useState(false);
  const [autoResultSchedules, setAutoResultSchedules] = useState({ assignments: [], unassigned: [], warnings: [], validationErrors: [] });
  const [autoConfirmLoading, setAutoConfirmLoading] = useState(false);
  const [selectedIds, setSelectedIds]         = useState([]);
  const calendarRef = useRef(null);
  const [policyList, setPolicyList] = useState([]);

  const sortedDepartmentList = useMemo(() =>
    [...departmentList].sort((a,b) => (a.departmentName||"").localeCompare(b.departmentName||"","ko")),
    [departmentList]);

  const sortedScheduleTypeList = useMemo(() =>
    [...scheduleTypeList].sort((a,b) => (a.typeName||"").localeCompare(b.typeName||"","ko")),
    [scheduleTypeList]);

  const allDepartmentsForFilter = useMemo(() => {
    const deptMap = new Map();
    departmentList.forEach(d => deptMap.set(String(d.departmentId), d));
    staffList.forEach(s => {
      if (s.departmentId && s.departmentName && !deptMap.has(String(s.departmentId)))
        deptMap.set(String(s.departmentId), { departmentId: s.departmentId, departmentName: s.departmentName });
    });
    return [...deptMap.values()].sort((a,b) => (a.departmentName||"").localeCompare(b.departmentName||"","ko"));
  }, [departmentList, staffList]);

  const filteredScheduleList = useMemo(() => {
    let r = scheduleList;
    if (searchKeyword.trim()) r = r.filter(i => (i.staffName||"").includes(searchKeyword.trim()));
    if (selectedDepartmentId) r = r.filter(i => String(i.departmentId) === String(selectedDepartmentId));
    if (selectedScheduleTypeId) r = r.filter(i => String(i.scheduleTypeId) === String(selectedScheduleTypeId));
    if (selectedDate) r = r.filter(i => i.workDate === selectedDate);
    return r;
  }, [scheduleList, searchKeyword, selectedDate, selectedDepartmentId, selectedScheduleTypeId]);

  const allGroupedScheduleList = useMemo(() => {
    const staffMap = new Map(staffList.map(s => [String(s.staffId), s]));
    return filteredScheduleList.reduce((acc, item) => {
      const k = item.departmentName || staffMap.get(String(item.staffId))?.departmentName || "미지정 부서";
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});
  }, [filteredScheduleList, staffList]);

  const departmentNames = useMemo(() => Object.keys(allGroupedScheduleList), [allGroupedScheduleList]);
  const { pagedData: pagedDeptNames, page: schedulePage, setPage: setSchedulePage, totalPages: scheduleTotalPages } = usePagination(departmentNames, 2);

  const groupedScheduleList = useMemo(() =>
    pagedDeptNames.reduce((acc, n) => { acc[n] = allGroupedScheduleList[n]; return acc; }, {}),
    [pagedDeptNames, allGroupedScheduleList]);

  const filteredWeekStaffList = useMemo(() => {
    let r = staffList;
    const kw = searchKeyword.trim().toLowerCase();
    if (selectedDepartmentId) r = r.filter(s => String(s.departmentId) === String(selectedDepartmentId));
    if (kw) r = r.filter(s => (s.name||"").toLowerCase().includes(kw));
    return r;
  }, [staffList, selectedDepartmentId, searchKeyword]);

  const weekDepartmentGroups = useMemo(() => {
    const ids = new Set(filteredWeekStaffList.map(s => String(s.staffId)));
    let r = scheduleList;
    if (selectedDepartmentId) r = r.filter(i => String(i.departmentId) === String(selectedDepartmentId));
    if (selectedScheduleTypeId) r = r.filter(i => String(i.scheduleTypeId) === String(selectedScheduleTypeId));
    r = r.filter(i => ids.has(String(i.staffId)));
    const staffMap = new Map(staffList.map(s => [String(s.staffId), s]));
    return r.reduce((acc, item) => {
      const k = item.departmentName || staffMap.get(String(item.staffId))?.departmentName || "미지정 부서";
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});
  }, [scheduleList, selectedDepartmentId, filteredWeekStaffList, selectedScheduleTypeId]);

  const events = useMemo(() => {
    const { start, end } = calendarRange;
    const visible = (start && end)
      ? scheduleList.filter(i => i.workDate >= start && i.workDate <= end)
      : scheduleList;
    const dateMap = visible.reduce((acc, item) => {
      const d = item.workDate;
      if (!acc[d]) acc[d] = { date: d, workCount: 0, offCount: 0 };
      if (!item.startTime) acc[d].offCount += 1;
      else acc[d].workCount += 1;
      return acc;
    }, {});
    return Object.values(dateMap).flatMap(item => [
      { title: `근무 ${item.workCount}명`, date: item.date, backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
      { title: `휴무 ${item.offCount}명`,  date: item.date, backgroundColor: "#f43f5e", borderColor: "#f43f5e" },
    ]);
  }, [scheduleList, calendarRange]);

  const columns = [
    { key: "select", title: (
      <input type="checkbox"
        checked={filteredScheduleList.filter(i => i.status==="TEMP").length > 0 &&
          filteredScheduleList.filter(i => i.status==="TEMP").every(i => selectedIds.includes(i.scheduleId))}
        onChange={e => handleCheckAll(e.target.checked)} />
    )},
    { key: "workDate",       title: "날짜" },
    { key: "staffName",      title: "직원명(번호)" },
    { key: "departmentName", title: "부서명" },
    { key: "typeName",       title: "근무유형" },
    { key: "status",         title: "상태" },
    { key: "action",         title: "관리" },
  ];

  useEffect(() => { fetchInitData(); }, []);
  useEffect(() => {
    if (viewMode === "week" && !selectedDepartmentId && allDepartmentsForFilter.length > 0)
      setSelectedDepartmentId(String(allDepartmentsForFilter[0].departmentId));
  }, [viewMode, selectedDepartmentId, allDepartmentsForFilter]);

  const fetchInitData = async () => {
    try {
      const [d, st, sT, rL, pL] = await Promise.all([
        getDepartmentList(), getStaffList(), getSchedulePolicyList(), getRoleList(), getPolicyList(),
      ]);
      setDepartmentList(d || []); 
      setStaffList(st || []); 
      setScheduleTypeList(sT || []); 
      setRoleList(rL || []);
      setPolicyList(pL || []);
    } catch { alert("데이터를 불러오는 중 오류가 발생했습니다"); }
  };

  const fetchScheduleData = async (startDate, endDate) => {
    const start = startDate ?? calendarRange.start;
    const end = endDate ?? calendarRange.end;
    const size = staffList.length > 0 ? Math.max(200, staffList.length * 31) : 500;
    try { setScheduleList((await getScheduleList(start, end, size)) || []); } catch (e) { console.error(e); }
  };

  const hasDuplicateSchedule = (target) =>
    scheduleList.some(i => String(i.staffId)===String(target.staffId) && i.workDate===target.workDate && String(i.scheduleId)!==String(target.scheduleId||""));

  const handleOpen  = () => { setIsEdit(false); setFormData(initialForm); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormData(initialForm); setIsEdit(false); };
  const handleBulkOpen  = () => { setBulkFormData(initialBulkForm); setBulkOpen(true); };
  const handleBulkClose = () => { setBulkFormData(initialBulkForm); setBulkOpen(false); };
  const handleAutoOpen  = () => setAutoOpen(true);
  const handleAutoClose = () => setAutoOpen(false);

  const handleAutoSubmit = async (conditionData) => {
    setAutoLoading(true);
    try {
      const result = await generateAutoSchedule(conditionData);
      setAutoResultSchedules({ assignments: result.assignments||[], unassigned: result.unassigned||[], warnings: result.warnings||[], validationErrors: result.validationErrors||[] });
      setAutoOpen(false); setAutoResultOpen(true);
    } catch (e) { alert(e.response?.data?.message || "AI 스케줄 생성 중 오류가 발생했습니다"); }
    finally { setAutoLoading(false); }
  };

  const handleAutoResultCancel = () => {
    setAutoResultOpen(false);
    setAutoResultSchedules({ assignments: [], unassigned: [], warnings: [], validationErrors: [] });
  };

  const handleAutoConfirm = async () => {
    setAutoConfirmLoading(true);
    try {
      const result = await confirmAutoSchedule(autoResultSchedules.assignments);
      if (result.validationErrors?.length > 0) alert(`저장 완료 (일부 스킵됨)\n\n${result.validationErrors.join("\n")}`);
      else alert("스케줄 확정 완료");
      setAutoResultOpen(false);
      setAutoResultSchedules({ assignments: [], unassigned: [], warnings: [], validationErrors: [] });
      fetchScheduleData();
    } catch (e) { alert(e.response?.data?.message || "확정 중 오류가 발생했습니다"); }
    finally { setAutoConfirmLoading(false); }
  };

  const handleSubmit = async (submitData) => {
    try {
      if (hasDuplicateSchedule(submitData)) { alert("같은 직원의 같은 날짜 스케줄이 이미 등록되어 있습니다"); return; }
      if (isEdit) { await updateSchedule(submitData.scheduleId, submitData); alert("수정완료"); }
      else        { await registerSchedule(submitData); alert("등록완료"); }
      handleClose(); fetchScheduleData();
    } catch (e) { alert(e.response?.data?.message || "저장 중 오류가 발생했습니다"); }
  };

  const handleEdit = (row) => {
    setIsEdit(true);
    setFormData({ scheduleId: row.scheduleId, departmentId: row.departmentId||"", staffId: row.staffId||"", workDate: row.workDate||"", scheduleTypeId: row.scheduleTypeId||"", status: row.status||"TEMP" });
    setOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try { await deleteSchedule(row.scheduleId); alert("삭제완료"); fetchScheduleData(); }
    catch { alert("삭제 중 오류가 발생했습니다"); }
  };

  const handleConfirm = async (scheduleId) => {
    if (!window.confirm("해당 스케줄을 확정하시겠습니까?")) return;
    try { await confirmSchedule(scheduleId); alert("스케줄 확정완료"); fetchScheduleData(); }
    catch (e) { console.error(e); }
  };

  const handleBulkSubmit = async (formData) => {
    try {
      const result = await bulkRegisterSchedule(formData);
      if (result.skippedList?.length > 0)
        alert(`${result.message}\n\n${result.skippedList.map(i => `${i.staffName} / ${i.workDate} / ${i.reason}`).join("\n")}`);
      else alert(result.message);
      fetchScheduleData(); setBulkOpen(false);
    } catch (e) { alert(e.response?.data?.message || "저장 중 오류가 발생했습니다"); }
  };

  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0) { alert("선택된 스케줄이 없습니다"); return; }
    if (!window.confirm("선택한 스케줄을 확정하시겠습니까?")) return;
    try { await bulkConfirmSchedule(selectedIds); alert("스케줄 확정 완료"); setSelectedIds([]); fetchScheduleData(); }
    catch { alert("스케줄 확정 중 오류가 발생했습니다"); }
  };

  const handleCheck    = (id) => setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const handleCheckAll = (checked) => setSelectedIds(checked ? filteredScheduleList.filter(i => i.status==="TEMP").map(i => i.scheduleId) : []);
  const handleToday    = () => { const t = getTodayString(); setSelectedDate(t); calendarRef.current?.getApi().gotoDate(t); };
  const handleMonthView = () => { setViewMode("month"); setSelectedDepartmentId(""); };
  const handleWeekView  = () => {
    setViewMode("week");
    if (allDepartmentsForFilter.length > 0) setSelectedDepartmentId(p => p || String(allDepartmentsForFilter[0].departmentId));
  };
  const handleResetAll = () => {
    const t = getTodayString();
    setSearchKeyword(""); setSelectedDate(t); setSelectedScheduleTypeId("");
    setSelectedDepartmentId(viewMode==="week" && allDepartmentsForFilter.length>0 ? String(allDepartmentsForFilter[0].departmentId) : "");
  };

  const deptTableData = (list) => list.map(item => ({
    ...item,
    staffName: `${item.staffName} (${item.staffId})`,
    select: item.status === "TEMP" ? (
      <input type="checkbox" checked={selectedIds.includes(item.scheduleId)} onChange={() => handleCheck(item.scheduleId)} />
    ) : null,
    action: (
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer"
          disabled={item.status==="CONFIRMED"} onClick={() => handleEdit(item)}>수정</Button>
        <Button size="sm" className="h-7 text-xs cursor-pointer bg-red-500 hover:bg-red-600"
          disabled={item.status==="CONFIRMED"} onClick={() => handleDelete(item)}>삭제</Button>
        {item.status === "TEMP" && (
          <Button size="sm" className="h-7 text-xs cursor-pointer bg-green-600 hover:bg-green-700"
            onClick={() => handleConfirm(item.scheduleId)}>확정</Button>
        )}
      </div>
    ),
  }));

  return (
    <div className="p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-zinc-900">직원 스케줄 관리</h2>
        </div>
        {canManageSchedule() && (
          <div className="flex gap-2 flex-wrap">
            <RegisterButton onClick={handleOpen}>개별등록</RegisterButton>
            <Button variant="outline" className="cursor-pointer" onClick={handleBulkOpen}>일괄등록</Button>
            <Button variant="outline" className="cursor-pointer gap-1.5" onClick={handleAutoOpen}>
              <Bot size={14} /> 자동스케줄
            </Button>
            <Button className="cursor-pointer gap-1.5" onClick={handleBulkConfirm}
              disabled={viewMode==="week" || selectedIds.length===0}>
              <CheckCheck size={14} /> 선택확정
            </Button>
          </div>
        )}
      </div>

      {/* 필터 바 */}
      <div className="flex items-center gap-2 flex-wrap">
        <SearchBar value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} showButton={false} placeholder="직원 이름 검색" />
        <select value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(e.target.value)} className={selectClass}>
          {viewMode === "month" && <option value="">전체부서</option>}
          {allDepartmentsForFilter.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
        </select>
        <select value={selectedScheduleTypeId} onChange={e => setSelectedScheduleTypeId(e.target.value)} className={selectClass}>
          <option value="">전체 유형</option>
          {sortedScheduleTypeList.map(t => (
            <option key={t.scheduleTypeId} value={t.scheduleTypeId} disabled={t.isActive===false}>
              {t.typeName}{t.isActive===false ? " (비활성)" : ""}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleResetAll}>초기화</Button>
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden ml-auto">
          <button onClick={handleMonthView}
            className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode==="month" ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50")}>달력형</button>
          <button onClick={handleWeekView}
            className={cn("px-3 py-1.5 text-xs font-medium transition-colors border-l border-zinc-200",
              viewMode==="week" ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50")}>주간형</button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      {viewMode === "month" ? (
        <div className="flex gap-4 items-start">
          {/* 달력 */}
          <div className="flex-3 bg-white rounded-xl border border-zinc-200 p-3 shadow-sm">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              headerToolbar={{ right: "prev,next myToday", center: "title", left: "" }}
              customButtons={{ myToday: { text: "오늘", click: handleToday } }}
              datesSet={info => {
                const calApi = calendarRef.current?.getApi();
                const currentDate = calApi ? calApi.getDate() : new Date(
                  (info.start.getTime() + info.end.getTime()) / 2
                );
                const y = currentDate.getFullYear();
                const m = String(currentDate.getMonth() + 1).padStart(2, "0");
                const lastDay = new Date(y, currentDate.getMonth() + 1, 0).getDate();
                const start = `${y}-${m}-01`;
                const end = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
                setCalendarRange({ start, end });
                fetchScheduleData(start, end);
              }}
              dateClick={info => setSelectedDate(info.dateStr)}
              dayCellClassNames={info => {
                const d = info.date;
                const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                return selectedDate === s ? ["selected-day"] : [];
              }}
              height="auto" dayMaxEvents={true} dayMaxEventRows={3} fixedWeekCount={false}
            />
          </div>

          {/* 날짜별 스케줄 목록 */}
          <div className="flex-2 bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
            <p className="text-sm font-semibold text-zinc-800 mb-3">
              {selectedDate || getTodayString()} 스케줄
            </p>
            {Object.entries(groupedScheduleList).map(([deptName, items]) => (
              <DepartmentScheduleGroup key={deptName} departmentName={deptName}
                items={items} columns={columns} deptTableData={deptTableData} />
            ))}
            <Pagination page={schedulePage} totalPages={scheduleTotalPages} onPageChange={setSchedulePage} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(weekDepartmentGroups).length > 0 ? (
            Object.entries(weekDepartmentGroups).map(([deptName, items]) => (
              <WeekScheduleTable key={deptName} title={deptName}
                staffList={filteredWeekStaffList} scheduleList={items}
                scheduleTypeList={scheduleTypeList} selectedDate={selectedDate} />
            ))
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-sm text-zinc-400">
              표시할 주간 스케줄이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 개별 등록/수정 모달 */}
      <CommonModal open={open} onClose={handleClose} title={isEdit ? "스케줄 수정" : "스케줄 등록"}>
        <StaffScheduleForm formData={formData} setFormData={setFormData} onSubmit={handleSubmit}
          onClose={handleClose} departmentList={departmentList} staffList={staffList}
          scheduleTypeList={scheduleTypeList} roleList={roleList} isEdit={isEdit} />
      </CommonModal>

      {/* 일괄 등록 모달 */}
      <CommonModal open={bulkOpen} onClose={handleBulkClose} title="스케줄 일괄등록">
        <BulkScheduleForm formData={bulkFormData} setFormData={setBulkFormData} onSubmit={handleBulkSubmit}
          onClose={handleBulkClose} departmentList={departmentList} staffList={staffList} scheduleTypeList={scheduleTypeList} roleList={roleList} />
      </CommonModal>

      {/* AI 자동 스케줄 모달 */}
      <CommonModal open={autoOpen} onClose={!autoLoading ? handleAutoClose : undefined} title="자동 스케줄 조건 설정">
        <AutoScheduleConditionForm 
        onSubmit={handleAutoSubmit} 
        onClose={handleAutoClose}
        departmentList={departmentList} 
        policyList={policyList}
        isLoading={autoLoading} />
      </CommonModal>

      {/* AI 결과 리뷰 모달 */}
      <CommonModal open={autoResultOpen} onClose={!autoConfirmLoading ? handleAutoResultCancel : undefined}
        title="AI 스케줄 생성 결과" contentClass="max-w-3xl sm:max-w-3xl">
        <AutoScheduleResultView assignments={autoResultSchedules.assignments}
          unassigned={autoResultSchedules.unassigned} warnings={autoResultSchedules.warnings}
          validationErrors={autoResultSchedules.validationErrors}
          onConfirm={handleAutoConfirm} onCancel={handleAutoResultCancel} isLoading={autoConfirmLoading} />
      </CommonModal>
    </div>
  );
};

export default StaffSchedulePage;
