import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getMySchedule, getMyScheduleDetail } from "../../../api/hr/staffScheduleApi";
import { Calendar } from "lucide-react";

const TYPE_COLORS = {
  DAY:     "#0ea5e9",
  EVENING: "#8b5cf6",
  NIGHT:   "#f97316",
  OFF:     "#f43f5e",
};

const TYPE_LABELS = {
  DAY:     "주간",
  EVENING: "야간",
  NIGHT:   "당직",
  OFF:     "휴무",
};

const SHIFT_HOUR_RANGES = {
  DAY:     { start: 9,  end: 18 },
  EVENING: { start: 15, end: 24 },
  NIGHT:   { start: 0,  end: 9  },
  OFF:     null,
};

const SHIFT_DISPLAY_HOURS = {
  DAY:     Array.from({ length: 9 }, (_, i) => 9  + i), // 09~17
  EVENING: Array.from({ length: 9 }, (_, i) => 15 + i), // 15~23
  NIGHT:   Array.from({ length: 9 }, (_, i) => i),       // 00~08
  OFF:     [],
};

const isHourInShift = (hour, typeCode) => {
  if (typeCode === "DAY")     return hour >= 9  && hour < 18;
  if (typeCode === "EVENING") return hour >= 15 && hour < 24;
  if (typeCode === "NIGHT")   return hour >= 0  && hour < 9;
  return false;
};

const STATUS_LABEL = { CONFIRMED: "확정", TEMP: "임시" };

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getMonthRange = (dateStr) => {
  const d     = new Date(dateStr);
  const year  = d.getFullYear();
  const month = d.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last  = new Date(year, month + 1, 0).getDate();
  const end   = `${year}-${String(month + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { startDate: start, endDate: end };
};

const fmtHour = (h) => `${String(h % 24).padStart(2, "0")}:00`;

const MySchedulePage = () => {
  const { name: authName } = useSelector((s) => s.auth);
  const [scheduleList, setScheduleList]     = useState([]);
  const [selectedDate, setSelectedDate]     = useState(getTodayString());
  const [currentMonth, setCurrentMonth]     = useState(getTodayString());
  const [loading, setLoading]               = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const calendarRef = useRef(null);
  const [detail, setDetail]               = useState({ reservationDtoList: [], surgeryDtoList: [] });
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSchedule = async (monthDate) => {
    setLoading(true);
    try {
      const { startDate, endDate } = getMonthRange(monthDate);
      const data    = await getMySchedule({ startDate, endDate, size: 100 });
      const content = data.content ?? [];
      setScheduleList(content);
      setDepartmentName(prev => prev || (content[0]?.departmentName ?? ""));
    } catch (err) { console.error("내 스케줄 조회 실패", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedule(currentMonth); }, [currentMonth]);

  const events = useMemo(() =>
    scheduleList.map((item) => ({
      title:           item.typeName,
      date:            item.workDate,
      backgroundColor: TYPE_COLORS[item.typeCode] ?? "#6b7280",
      borderColor:     "transparent",
      extendedProps:   { ...item },
    })), [scheduleList]);

  const selectedDaySchedules = useMemo(() =>
    scheduleList.filter((item) => item.workDate === selectedDate),
    [scheduleList, selectedDate]);

  const handleDateClick = async (info) => {
    setSelectedDate(info.dateStr);
    setDetailLoading(true);
    try {
      const data = await getMyScheduleDetail(info.dateStr);
      setDetail(data);
    } catch (err) {
      console.error("상세 조회 실패", err);
      setDetail({ reservationDtoList: [], surgeryDtoList: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  // 해당 날의 근무 시간대 + 이벤트 있는 시간만 추출
  const displayHours = useMemo(() => {
    const hours = new Set();
    selectedDaySchedules.forEach(s => {
      (SHIFT_DISPLAY_HOURS[s.typeCode] ?? []).forEach(h => hours.add(h));
    });
    // 근무 범위 밖 이벤트도 포함
    (detail.reservationDtoList ?? []).forEach(r => {
      if (r.reservationDate) hours.add(new Date(r.reservationDate).getHours());
    });
    (detail.surgeryDtoList ?? []).forEach(s => {
      if (s.startTime) hours.add(new Date(s.startTime).getHours());
    });
    return Array.from(hours).sort((a, b) => a - b);
  }, [selectedDaySchedules, detail]);

  const hasSchedule   = selectedDaySchedules.length > 0;
  const hasTimetable  = selectedDaySchedules.some(s => s.typeCode !== "OFF");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-zinc-900">내 스케줄</h1>
            <p className="text-xs text-zinc-400 h-4">
              {authName}{departmentName ? ` · ${departmentName}` : ""}
            </p>
          </div>
        </div>
        {loading && <span className="text-xs text-zinc-400">불러오는 중...</span>}
      </div>

      {/* 달력 + 타임테이블 */}
      <div className="flex gap-4 items-start">

        {/* 달력 */}
        <div className="flex-1 bg-white rounded-xl border border-zinc-200 p-3 shadow-sm">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            headerToolbar={{ left: "", center: "title", right: "prev,next" }}
            datesSet={(info) => {
              const mid = new Date((info.start.getTime() + info.end.getTime()) / 2);
              const m   = `${mid.getFullYear()}-${String(mid.getMonth() + 1).padStart(2, "0")}-01`;
              setCurrentMonth(m);
            }}
            dateClick={handleDateClick}
            height="auto"
            fixedWeekCount={false}
            dayMaxEvents={3}
          />
        </div>

        {/* 사이드 패널 */}
        <div className="w-72 shrink-0 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">

          {/* 패널 헤더 */}
          <div className="px-4 py-3 border-b border-zinc-100 shrink-0">
            <p className="text-sm font-semibold text-zinc-800 mb-2">{selectedDate}</p>
            <div className="flex flex-wrap gap-1.5">
              {!hasSchedule ? (
                <span className="text-xs text-zinc-400">근무 일정 없음</span>
              ) : (
                selectedDaySchedules.map(item => {
                  const range = SHIFT_HOUR_RANGES[item.typeCode];
                  return (
                    <span
                      key={item.scheduleId}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
                      style={{ backgroundColor: TYPE_COLORS[item.typeCode] ?? "#6b7280" }}
                    >
                      {item.typeName}
                      {range && (
                        <span className="font-normal opacity-80 ml-1">
                          {fmtHour(range.start)} – {range.end === 24 ? "24:00" : fmtHour(range.end)}
                        </span>
                      )}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* 타임테이블 (근무 있는 날만, 휴무 제외) */}
          {hasTimetable && (
            <div className="overflow-y-auto" style={{ maxHeight: 460 }}>
              {detailLoading ? (
                <div className="flex items-center justify-center h-32">
                  <span className="text-xs text-zinc-400">불러오는 중...</span>
                </div>
              ) : displayHours.length === 0 ? (
                <div className="flex items-center justify-center h-24">
                  <span className="text-xs text-zinc-400">일정 없음</span>
                </div>
              ) : (
                displayHours.map(hour => {
                  const shiftForHour = selectedDaySchedules.find(s => isHourInShift(hour, s.typeCode));
                  const reservations = (detail.reservationDtoList ?? []).filter(r =>
                    r.reservationDate && new Date(r.reservationDate).getHours() === hour
                  );
                  const surgeries = (detail.surgeryDtoList ?? []).filter(s =>
                    s.startTime && new Date(s.startTime).getHours() === hour
                  );
                  const hasEvents  = reservations.length > 0 || surgeries.length > 0;
                  const isActive   = !!shiftForHour;
                  const shiftColor = isActive ? TYPE_COLORS[shiftForHour.typeCode] : null;

                  return (
                    <div
                      key={hour}
                      className="flex border-b border-zinc-50 last:border-0"
                      style={{
                        minHeight: 44,
                        backgroundColor: isActive ? `${shiftColor}15` : undefined,
                      }}
                    >
                      {/* 시간 라벨 */}
                      <div className="w-10 shrink-0 flex items-start pt-3 justify-end pr-2">
                        <span className="text-[10px] font-mono text-zinc-400 leading-none">
                          {String(hour).padStart(2, "0")}
                        </span>
                      </div>

                      {/* 근무 컬러 바 */}
                      <div
                        className="w-1 shrink-0 self-stretch my-px rounded-full"
                        style={{ backgroundColor: isActive ? shiftColor : "transparent" }}
                      />

                      {/* 이벤트 */}
                      <div className={`flex-1 px-2 ${hasEvents ? "py-1.5 space-y-1" : ""}`}>
                        {reservations.map(r => (
                          <div
                            key={r.reservationId}
                            className="rounded-md px-2 py-1 text-[11px] flex items-center gap-1.5"
                            style={{ backgroundColor: "#dbeafe", borderLeft: "3px solid #3b82f6" }}
                          >
                            <span className="font-semibold text-blue-700 shrink-0">진료</span>
                            <span className="text-blue-600 truncate">
                              {r.name}
                            </span>
                          </div>
                        ))}
                        {surgeries.map(s => (
                          <div
                            key={s.surgeryId}
                            className="rounded-md px-2 py-1 text-[11px] flex items-center gap-1.5"
                            style={{ backgroundColor: "#ffe4e6", borderLeft: "3px solid #f43f5e" }}
                          >
                            <span className="font-semibold text-rose-600 shrink-0">수술</span>
                            <span className="text-rose-500 truncate">
                              {s.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 범례 */}
          <div className="px-4 py-2.5 border-t border-zinc-100 shrink-0">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {Object.entries(TYPE_COLORS).map(([code, color]) => (
                <div key={code} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-zinc-500">{TYPE_LABELS[code]}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <span className="w-3 h-2 rounded-sm shrink-0 bg-blue-200" style={{ borderLeft: "2px solid #3b82f6" }} />
                <span className="text-[10px] text-zinc-500">진료</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-2 rounded-sm shrink-0 bg-rose-200" style={{ borderLeft: "2px solid #f43f5e" }} />
                <span className="text-[10px] text-zinc-500">수술</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MySchedulePage;
