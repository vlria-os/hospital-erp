import { useEffect, useState } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CalendarCheck, Clock, AlertCircle, Phone, Info } from 'lucide-react';

const ReservationPage = () => {
  const [department, setDepartment]     = useState([]);
  const [doctor, setDoctor]             = useState([]);
  const [selectedDoc, setSelectedDoc]   = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [symptom, setSymptom]           = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [timeSlots, setTimeSlots]       = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    jwtAxios.get('/api/department/list')
      .then((res) => setDepartment(res.data.content ?? res.data ?? []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDept) { setDoctor([]); setSelectedDoc(""); return; }
    jwtAxios.get(`/api/staff/doctor?departmentId=${selectedDept}`)
      .then((res) => setDoctor(res.data.content))
      .catch(console.error);
  }, [selectedDept]);

  useEffect(() => {
    setSelectedTime(""); setTimeSlots([]);
    if (!selectedDate || !selectedDept) return;
    const dailyIso = selectedDate + "T00:00:00";
    const url = selectedDoc ? "/api/slot/daily/doctor" : "/api/slot/daily/department";
    const params = selectedDoc
      ? { daily: dailyIso, doctorId: selectedDoc }
      : { daily: dailyIso, departmentId: selectedDept };
    setSlotsLoading(true);
    jwtAxios.get(url, { params })
      .then((res) => {
        const data = res.data.content ?? [];
        if (data.length === 0 || data.every((s) => !s.available)) { setTimeSlots([]); return; }
        const slotsByHour = [];
        for (let h = 9; h <= 17; h++) {
          if (h === 13) continue;
          const slot = data.find((s) => new Date(s.startTime).getHours() === h);
          slotsByHour.push({ hour: h, capacity: slot ? slot.capacity : 0, available: slot ? slot.available : false });
        }
        setTimeSlots(slotsByHour);
      })
      .catch((err) => console.error("슬롯 조회 실패:", err))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedDoc, selectedDept]);

  const submitHandler = () => {
    const reservationData = {
      doctorId: selectedDoc || null,
      departmentId: selectedDept,
      preferredDate: selectedDate
        ? selectedDate + (selectedTime ? `T${selectedTime}:00` : "T00:00:00")
        : null,
      symptom,
    };
    jwtAxios.post('/api/reservation', reservationData)
      .then((res) => {
        alert('예약이 완료되었습니다. 예약번호: ' + res.data.reservationId);
        setSelectedDept(""); setSelectedDoc(""); setSelectedDate("");
        setSelectedTime(""); setSymptom(""); setTimeSlots([]);
      })
      .catch((err) => { console.error('예약 실패:', err); alert('예약에 실패했습니다.'); });
  };

  const selectClass = "w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-lg mx-auto space-y-3 px-6 py-6">

      <div className="flex items-center gap-2">
        <CalendarCheck size={20} className="text-blue-600" />
        <h1 className="text-xl font-bold text-zinc-900">진료 예약</h1>
      </div>

      {/* 예약 폼 */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 space-y-3">
        <div className="space-y-1.5">
          <Label>진료과</Label>
          <select className={selectClass} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
            <option value="">선택하세요</option>
            {department.map((dep) => (
              <option key={dep.departmentId} value={dep.departmentId}>{dep.departmentName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>희망 의사 <span className="text-zinc-400 font-normal">(선택)</span></Label>
          <select className={selectClass} value={selectedDoc} onChange={(e) => setSelectedDoc(Number(e.target.value))} disabled={!selectedDept}>
            <option value="">희망 의사 없음</option>
            {doctor.map((doc) => (
              <option key={doc.staffId} value={doc.staffId}>{doc.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>희망 날짜</Label>
          <input
            type="date"
            className={selectClass}
            value={selectedDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Clock size={13} className="text-zinc-400" /> 희망 시간
          </Label>
          {!selectedDate || !selectedDept ? (
            <p className="text-xs text-zinc-400">진료과와 날짜를 선택하면 예약 가능한 시간이 표시됩니다.</p>
          ) : slotsLoading ? (
            <p className="text-xs text-zinc-400">조회 중...</p>
          ) : timeSlots.length === 0 ? (
            <p className="text-xs text-red-500">예약 가능한 시간이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((slot) => {
                const timeStr    = `${String(slot.hour).padStart(2, "0")}:00`;
                const isSelected = selectedTime === timeStr;
                const disabled   = !slot.available || slot.capacity === 0;
                return (
                  <button
                    key={slot.hour}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedTime(timeStr)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      disabled
                        ? "bg-zinc-50 border-zinc-200 text-zinc-300 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-zinc-200 text-zinc-700 hover:border-blue-400 hover:text-blue-600"
                    )}
                  >
                    {timeStr}
                    {!disabled && <span className="ml-1 text-[10px] opacity-70">({slot.capacity}명)</span>}
                    {disabled && <span className="ml-1 text-[10px]">불가</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>증상</Label>
          <Textarea value={symptom} onChange={(e) => setSymptom(e.target.value)} rows={3} placeholder="증상을 자세히 입력해주세요" />
        </div>

        <Button type="button" className="w-full cursor-pointer" onClick={submitHandler} disabled={!selectedDept || !selectedDate}>
          예약하기
        </Button>
      </div>

      {/* 안내 카드 2개 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-zinc-200 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-blue-500" />
            <span className="text-xs font-semibold text-zinc-700">예약 안내</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-500 leading-relaxed">
            <li className="flex gap-1.5"><span className="text-blue-400 shrink-0">·</span>진료과 선택 후 담당 의사를 선택할 수 있습니다.</li>
            <li className="flex gap-1.5"><span className="text-blue-400 shrink-0">·</span>의사 미선택 시 진료과 배정으로 진행됩니다.</li>
            <li className="flex gap-1.5"><span className="text-blue-400 shrink-0">·</span>날짜와 진료과 선택 후 예약 가능 시간이 표시됩니다.</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={13} className="text-amber-500" />
            <span className="text-xs font-semibold text-zinc-700">취소 안내</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-500 leading-relaxed">
            <li className="flex gap-1.5"><span className="text-amber-400 shrink-0">·</span>취소는 예약 시간 1시간 전까지 가능합니다. 전화로 문의해 주세요.</li>
            <li className="flex gap-1.5"><span className="text-amber-400 shrink-0">·</span>노쇼 3회 이상 시 예약이 제한될 수 있습니다.</li>
          </ul>
          <div className="pt-1 border-t border-zinc-100 flex items-center gap-1.5">
            <Phone size={11} className="text-zinc-400" />
            <span className="text-xs text-zinc-400">전화 예약: 02-1999-0920</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ReservationPage;
