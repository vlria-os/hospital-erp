import FullCalendar from '@fullcalendar/react';
import React, { useEffect, useRef, useState } from 'react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayjs from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import jwtAxios from '../../api/jwtAxios';
import { useDispatch } from 'react-redux';
import { setDoctorId } from "../../store/sseSlice";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, CalendarCheck } from 'lucide-react';

const STATUS_TABS = [
  { key: "RECEIVED",  label: "신청" },
  { key: "PENDING",   label: "가예약" },
  { key: "CONFIRMED", label: "확정" },
];

const SCHEDULE_TYPE_LABELS = {
  DAY:     '주간',
  EVENING: '야간근무',
  NIGHT:   '당직근무',
  OFF:     '휴무',
};
const SCHEDULE_TYPE_COLORS = {
  DAY:     '#0ea5e9',
  EVENING: '#8b5cf6',
  NIGHT:   '#f97316',
  OFF:     '#adadad',
};

const ReservationConfirm = () => {
  const [slotBlocked, setSlotBlocked]   = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [department, setDepartment]     = useState([]);
  const [doctor, setDoctor]             = useState([]);
  const [selectedDoc, setSelectedDoc]   = useState(null);
  const [selectedDept, setSelectedDept] = useState("");
  const [events, setEvents]             = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots]       = useState([]);
  const [status, setStatus]             = useState("RECEIVED");
  const [currentMonth, setCurrentMonth] = useState(null);
  const [selectedRow, setSelectedRow]   = useState(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [name, setName]                 = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [page, setPage]                 = useState(0);
  const [size]                          = useState(3);
  const [patientId, setPatientId]=useState("");

  const calendarRef    = useRef(null);
  const isRowClickRef  = useRef(false);
  const queryClient    = useQueryClient();
  const dispatch       = useDispatch();

  useEffect(() => { setPage(0); }, [debouncedName, selectedDept, status]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(name), 400);
    return () => clearTimeout(t);
  }, [name]);

  useEffect(() => {
    jwtAxios.get('/api/department/list')
      .then(res => setDepartment(res.data.content ?? res.data ?? []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setTimeSlots([]); setSlotBlocked(false); setBlockMessage("");
  }, [selectedDept, selectedDoc]);

  useEffect(() => {
    if (!selectedDept) { setDoctor([]); return; }
    jwtAxios.get(`/api/staff/doctor?departmentId=${selectedDept}`)
      .then(res => {
        setDoctor(res.data.content ?? []);
        if (isRowClickRef.current) { isRowClickRef.current = false; return; }
        setSelectedDoc(null);
      })
      .catch(console.error);
  }, [selectedDept]);

  useEffect(() => {
    if (!currentMonth || !selectedDept) return;
    const isNext = dayjs(currentMonth).isAfter(dayjs().endOf('month'));
    const url = isNext ? "/api/slot/department" : (selectedDoc ? "/api/slot/doctor" : "/api/slot/department");
    const params = isNext
      ? { monthly: currentMonth, departmentId: selectedDept }
      : selectedDoc
        ? { monthly: currentMonth, doctorId: selectedDoc }
        : { monthly: currentMonth, departmentId: selectedDept };

    jwtAxios.get(url, { params }).then(res => {
      console.log("슬롯 데이터:", res.data.content); 
      const data = res.data.content ?? [];
      setEvents(data.filter(s => dayjs(s.date).day() !== 0).map(slot => ({
        title: slot.available
          ? `가능 (${slot.totalCapacity}명)`
          : (SCHEDULE_TYPE_LABELS[slot.scheduleType] || slot.scheduleType || '휴무'),
        start: slot.date,
        color: slot.available
          ? "#3b82f6"
          : (SCHEDULE_TYPE_COLORS[slot.scheduleType] || "#e5e7eb"),
        textColor: '#fff',
        allDay: true,
        extendedProps: { available: slot.available, blocked: !slot.available, scheduleType: slot.scheduleType }
      })));
    }).catch(console.error);
  }, [selectedDoc, currentMonth, selectedDept, calendarRefreshKey]);

  const fetchReservationList = ({ status, dept, name, page }) => {
    let url = "/api/reservation";
    if (status === "PENDING") url += "/pending";
    if (status === "CONFIRMED") url += "/confirmed";
    return jwtAxios.get(url, { params: { department: dept || undefined, name, page, size } }).then(r => r.data);
  };

  const { data } = useQuery({
    queryKey: ['reservationList', status, selectedDept, debouncedName, page],
    queryFn: () => fetchReservationList({ status, dept: selectedDept, name: debouncedName, page }),
    placeholderData: (prev) => prev,
  });

  const list       = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const getDate = (item) => status === "RECEIVED" ? item.preferredDate : item.reservationDate;

  const loadSlots = (date, docId, deptId) => {
    const dayOfWeek = dayjs(date).day();
    const dailyIso  = date + "T00:00:00";
    const isNext    = dayjs(date).isAfter(dayjs().endOf('month'));

    if (dayOfWeek === 0) { setSlotBlocked(true); setBlockMessage("일요일은 예약이 불가합니다."); setTimeSlots([]); return; }
    if (!isNext && !docId) { setSlotBlocked(true); setBlockMessage("의사를 선택해야 예약 가능 시간을 확인할 수 있습니다."); setTimeSlots([]); return; }

    setSlotBlocked(false); setBlockMessage("");
    const url    = isNext ? `/api/slot/daily/department` : `/api/slot/daily/doctor`;
    const params = isNext ? { daily: dailyIso, departmentId: deptId } : { daily: dailyIso, doctorId: docId };

    jwtAxios.get(url, { params }).then(res => {
      const data = res.data.content ?? [];
      const allBlocked = data.length === 0 || data.every(s => !s.available);
      if (allBlocked && !isNext) { setSlotBlocked(true); setBlockMessage("해당 날짜는 예약이 불가합니다."); setTimeSlots([]); return; }
      const slots = [];
      for (let h = 9; h <= 17; h++) {
        if (h === 13) continue;
        if (dayOfWeek === 6 && h >= 13) continue;
        const slot = data.find(s => new Date(s.startTime).getHours() === h);
        slots.push({ hour: h, capacity: slot ? slot.capacity : 3, available: slot ? slot.available : true });
      }
      setSlotBlocked(false); setBlockMessage(""); setTimeSlots(slots);
    }).catch(console.error);
  };

  const handleDateClick  = (info) => { setSelectedDate(info.dateStr); loadSlots(info.dateStr, selectedDoc, selectedDept); };
  const handleEventClick = (info) => { const d = dayjs(info.event.start).format('YYYY-MM-DD'); setSelectedDate(d); loadSlots(d, selectedDoc, selectedDept); };

  const handleDatesSet = (info) => {
    const formatted = dayjs(info.view.currentStart).format('YYYY-MM-01T00:00:00');
    setCurrentMonth(prev => prev === formatted ? prev : formatted);
    if (dayjs(formatted).isAfter(dayjs().endOf('month'))) setSelectedDoc(null);
  };

  const handleRowClick = (item) => {
    const docId = item.doctorId ?? null;
    isRowClickRef.current = true;
    setSelectedDept(item.departmentId); setSelectedDoc(docId); setSelectedRow(item.reservationId); setPatientId(item.patientId);
    const date = getDate(item) ? dayjs(getDate(item)).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    setSelectedDate(date); setTimeSlots([]); setSlotBlocked(false); setBlockMessage("");
    if (calendarRef.current) calendarRef.current.getApi().gotoDate(date);
    loadSlots(date, docId, item.departmentId);
  };

  const handleSlotClick = (hour) => {
    if (!selectedRow) return alert("예약할 행을 선택하세요!");
    const isNext = dayjs(currentMonth).isAfter(dayjs().endOf('month'));
    if (!isNext && !selectedDoc) return alert("이번 달 예약은 의사를 선택해야 합니다.");
    const payload = { reservationId: selectedRow, reservationDate: `${selectedDate}T${hour}:00`, doctorId: selectedDoc || null, departmentId: selectedDept, patientId: patientId || null};
    const req = status === "CONFIRMED" ? jwtAxios.put('/api/reservation', payload) : jwtAxios.post('/api/reservation/confirm', payload);
    req.then(() => {
      alert(status === "CONFIRMED" ? "예약 수정 완료!" : "예약 완료!");
      setSelectedRow(null);
      // 슬롯 즉시 재조회
      loadSlots(selectedDate, selectedDoc, selectedDept);
      // 캘린더 가능 인원 수 재조회 트리거
      setCalendarRefreshKey(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['reservationList'] });
      if (selectedDoc) dispatch(setDoctorId(selectedDoc));
    }).catch(console.error);
  };

  const handleCancel = (reservationId) => {
    jwtAxios.get(`/api/reservation/delete?reservationId=${reservationId}`)
      .then(() => { alert("예약 취소 완료"); setSelectedRow(null); setTimeSlots([]); queryClient.invalidateQueries({ queryKey: ['reservationList'] }); })
      .catch(console.error);
  };

  const isThisMonth = dayjs(currentMonth).isSame(dayjs(), 'month');

  return (
    <div className="p-4 flex gap-4 h-full" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* 왼쪽: 필터 + 목록 */}
      <div className="w-72 shrink-0 flex flex-col gap-3">

        {/* 진료과 선택 */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500">진료과</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">과를 선택하세요</option>
              {department.map(dep => (
                <option key={dep.departmentId} value={dep.departmentId}>{dep.departmentName}</option>
              ))}
            </select>
          </div>

          {/* 의사 선택 (이번 달만) */}
          {isThisMonth && doctor.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">담당 의사</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    selectedDoc === null ? "bg-blue-600 text-white border-blue-600" : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-blue-300"
                  )}
                >전체</button>
                {doctor.map(doc => (
                  <button key={doc.staffId}
                    onClick={() => setSelectedDoc(doc.staffId)}
                    className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                      selectedDoc === doc.staffId ? "bg-blue-600 text-white border-blue-600" : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-blue-300"
                    )}
                  >{doc.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 상태 탭 + 검색 + 목록 */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex flex-col gap-3 flex-1 overflow-hidden">
          <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
            {STATUS_TABS.map(tab => (
              <button key={tab.key} onClick={() => setStatus(tab.key)}
                className={cn("flex-1 py-1.5 text-xs font-medium transition-colors",
                  status === tab.key ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50"
                )}
              >{tab.label}</button>
            ))}
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input className="pl-8 h-8 text-sm" placeholder="이름 검색" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {list.length === 0 ? (
              <p className="text-center text-sm text-zinc-400 py-6">데이터가 없습니다.</p>
            ) : list.map(item => {
              const isSelected = selectedRow === item.reservationId;
              return (
                <div key={item.reservationId} onClick={() => handleRowClick(item)}
                  className={cn("rounded-lg p-3 border cursor-pointer transition-all text-sm",
                    isSelected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                  )}
                >
                  {/* 환자명 + 진료과 + 날짜 + 취소 */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-900">{item.patientName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 font-medium">{item.departmentName}</span>
                      <span className="text-xs text-zinc-400">{getDate(item) ? dayjs(getDate(item)).format('MM/DD HH:mm') : '없음'}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleCancel(item.reservationId); }}
                        className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-500 hover:bg-red-100 border border-red-100">취소</button>
                    </div>
                  </div>
                  {/* 증상 - 가운데 강조 */}
                  <p className="text-sm text-zinc-700 my-1.5 line-clamp-2">{item.symptom || '증상 없음'}</p>
                  {/* 의사 - 아래 */}
                  <div className="text-xs text-zinc-400">👨‍⚕️ {item.doctorName || '희망 의사 없음'}</div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="px-3 h-7 text-xs rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40">이전</button>
              <span className="text-xs text-zinc-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}
                className="px-3 h-7 text-xs rounded border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40">다음</button>
            </div>
          )}
        </div>
      </div>

      {/* 가운데: 달력 */}
      <div className="flex-1 bg-white rounded-xl border border-zinc-200 p-3">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          fixedWeekCount={false}
          ref={calendarRef}
          validRange={{ start: dayjs().format('YYYY-MM-DD') }}
          height="100%"
          dayCellClassNames={(info) => {
            const dateStr = dayjs(info.date).format('YYYY-MM-DD');
            return selectedDate === dateStr ? ['selected-day'] : [];
          }}
        />
      </div>

      {/* 오른쪽: 시간 슬롯 */}
      <div className="w-56 shrink-0 bg-white rounded-xl border border-zinc-200 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <CalendarCheck size={15} className="text-blue-600" />
          <span className="text-sm font-semibold text-zinc-800">
            {selectedDate ? dayjs(selectedDate).format('MM/DD (ddd)') : '날짜 선택'}
          </span>
        </div>

        {slotBlocked ? (
          <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-center">
            <div className="text-lg mb-1">⛔</div>
            <p className="text-xs text-red-500 font-medium">{blockMessage || "해당 날짜는 예약 불가입니다."}</p>
          </div>
        ) : timeSlots.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">날짜를 선택하세요</p>
        ) : (
          <div className="space-y-1.5 overflow-y-auto">
            {timeSlots.map(slot => {
              if (slot.hour === 13) return null;
              const disabled = !slot.available || slot.capacity === 0;
              return (
                <React.Fragment key={slot.hour}>
                  <div
                    onClick={() => { if (!disabled) handleSlotClick(`${String(slot.hour).padStart(2, '0')}:00`); }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      disabled
                        ? "bg-zinc-50 text-zinc-300 cursor-not-allowed"
                        : "bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100"
                    )}
                  >
                    <span className="font-semibold">{String(slot.hour).padStart(2, '0')}:00</span>
                    <span className="text-xs">{disabled ? '불가' : `${slot.capacity}명`}</span>
                  </div>
                  {slot.hour === 12 && (
                    <div className="flex items-center gap-2 my-1">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-[10px] text-zinc-400">점심</span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationConfirm;
