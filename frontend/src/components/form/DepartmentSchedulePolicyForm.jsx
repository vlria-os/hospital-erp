import { useEffect, useState } from "react";
import { getDepartmentList } from "../../api/hr/departmentApi";
import { getRoleList } from "../../api/hr/roleApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SHIFT_OPTIONS = ["DAY", "EVENING", "NIGHT", "OFF"];
const SHIFT_LABEL   = { DAY: "데이", EVENING: "이브닝", NIGHT: "나이트", OFF: "휴무" };
const SHIFT_COLOR   = { DAY: "bg-sky-50 border-sky-200 text-sky-700", EVENING: "bg-amber-50 border-amber-200 text-amber-700", NIGHT: "bg-violet-50 border-violet-200 text-violet-700", OFF: "bg-rose-50 border-rose-200 text-rose-700" };

const initState = {
  roleId: "", departmentId: "", jobType: "", shiftTypes: [], minStaffMap: {},
  maxConsecutiveNight: "", blockNightToDay: false, blockNightToEvening: false,
  maxWorkDaysPerWeek: "", isActive: true,
};

const selectClass = "w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-zinc-50";

const DepartmentSchedulePolicyForm = ({ onSubmit, onClose, initialData }) => {
  const [form, setForm]                   = useState(initState);
  const [departmentList, setDepartmentList] = useState([]);
  const [roleList, setRoleList]           = useState([]);

  useEffect(() => {
    getDepartmentList()
      .then(data => setDepartmentList(Array.isArray(data) ? data : []))
      .catch(() => setDepartmentList([]));
    getRoleList()
      .then(data => setRoleList(Array.isArray(data) ? data : []))
      .catch(() => setRoleList([]));
  }, []);

  useEffect(() => {
    setForm(initialData ? {
      roleId:              initialData.roleId ?? "",
      departmentId:        initialData.departmentId ?? "",
      jobType:             initialData.jobType ?? "",
      shiftTypes:          initialData.shiftTypes ?? [],
      minStaffMap:         initialData.minStaffMap ?? {},
      maxConsecutiveNight: initialData.maxConsecutiveNight ?? "",
      blockNightToDay:     initialData.blockNightToDay ?? false,
      blockNightToEvening: initialData.blockNightToEvening ?? false,
      maxWorkDaysPerWeek:  initialData.maxWorkDaysPerWeek ?? "",
      isActive:            initialData.isActive !== undefined ? initialData.isActive : true,
    } : initState);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name !== "shiftTypes") { setForm(p => ({ ...p, [name]: checked })); return; }
    if (name === "isActive") { setForm(p => ({ ...p, isActive: value === "true" })); return; }
    if (name === "roleId") {
      const found = roleList.find(r => String(r.roleId) === value);
      setForm(p => ({ ...p, roleId: value, jobType: found?.roleName || "" }));
      return;
    }
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleShiftToggle = (shift) => {
    setForm(p => {
      const cur = p.shiftTypes || [];
      if (cur.includes(shift)) {
        const m = { ...p.minStaffMap }; delete m[shift];
        return { ...p, shiftTypes: cur.filter(s => s !== shift), minStaffMap: m };
      }
      return { ...p, shiftTypes: [...cur, shift], minStaffMap: { ...p.minStaffMap, [shift]: 1 } };
    });
  };

  const handleMinStaffChange = (shift, value) => {
    setForm(p => ({ ...p, minStaffMap: { ...p.minStaffMap, [shift]: Number(value) } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.roleId)                      { alert("직급(Role)을 선택하세요"); return; }
    if (form.shiftTypes.length === 0)      { alert("허용 근무유형을 하나 이상 선택하세요"); return; }
    onSubmit({
      roleId: Number(form.roleId),
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      jobType: form.jobType,
      shiftTypes: form.shiftTypes, minStaffMap: form.minStaffMap,
      maxConsecutiveNight: form.maxConsecutiveNight !== "" ? Number(form.maxConsecutiveNight) : null,
      blockNightToDay: form.blockNightToDay, blockNightToEvening: form.blockNightToEvening,
      maxWorkDaysPerWeek: form.maxWorkDaysPerWeek !== "" ? Number(form.maxWorkDaysPerWeek) : null,
      isActive: form.isActive,
    });
  };

  const isEdit = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-base font-semibold text-zinc-900">
        {isEdit ? "부서 스케줄 정책 수정" : "부서 스케줄 정책 등록"}
      </p>

      {/* 기본 설정 */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">기본 설정</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>직급 (Role) <span className="text-red-500">*</span></Label>
            <select name="roleId" value={form.roleId} onChange={handleChange}
              disabled={isEdit} className={selectClass}>
              <option value="">직급 선택</option>
              {roleList.map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>직무유형</Label>
            <input type="text" name="jobType" value={form.jobType} readOnly
              className="w-full h-9 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm text-zinc-500 cursor-not-allowed" />
          </div>

          <div className="space-y-1.5">
            <Label>부서 <span className="text-xs text-zinc-400">(의사 진료과만 선택)</span></Label>
            <select name="departmentId" value={form.departmentId} onChange={handleChange}
              disabled={isEdit} className={selectClass}>
              <option value="">부서 선택 (선택사항)</option>
              {departmentList.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>주 최대 근무일</Label>
            <div className="flex items-center gap-2">
              <Input type="number" name="maxWorkDaysPerWeek" min={1} max={7} placeholder="예: 5"
                value={form.maxWorkDaysPerWeek} onChange={handleChange} className="w-24" />
              <span className="text-sm text-zinc-500">일</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>최대 연속 야간근무</Label>
            <div className="flex items-center gap-2">
              <Input type="number" name="maxConsecutiveNight" min={0} placeholder="예: 3"
                value={form.maxConsecutiveNight} onChange={handleChange} className="w-24" />
              <span className="text-sm text-zinc-500">일</span>
            </div>
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label>상태</Label>
            <select name="isActive" value={String(form.isActive)} onChange={handleChange} className={selectClass}>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>
        </div>
      </div>

      {/* 허용 근무유형 + 최소인원 */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">허용 근무유형 및 최소인원</p>
        <div className="grid grid-cols-2 gap-2">
          {SHIFT_OPTIONS.map(shift => {
            const checked = form.shiftTypes.includes(shift);
            return (
              <div key={shift}
                className={cn("flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-colors",
                  checked ? SHIFT_COLOR[shift] : "border-zinc-200 bg-white text-zinc-500"
                )}
                onClick={() => handleShiftToggle(shift)}
              >
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={checked} onChange={() => handleShiftToggle(shift)}
                    className="accent-blue-600 cursor-pointer" onClick={e => e.stopPropagation()} />
                  <span className="text-sm font-medium">{SHIFT_LABEL[shift]}</span>
                </div>
                {checked && (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input type="number" min={0} value={form.minStaffMap[shift] ?? 1}
                      onChange={e => handleMinStaffChange(shift, e.target.value)}
                      className="w-14 h-7 rounded border border-current bg-white/70 px-2 text-xs text-center focus:outline-none"
                      placeholder="최소" />
                    <span className="text-xs">명</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 야간 제한 */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">야간 근무 후 제한</p>
        <div className="space-y-2">
          {[
            { name: "blockNightToDay",     label: "야간 → 데이(DAY) 근무 금지" },
            { name: "blockNightToEvening", label: "야간 → 이브닝(EVENING) 근무 금지" },
          ].map(({ name, label }) => (
            <label key={name} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name={name} checked={form[name]} onChange={handleChange}
                className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-zinc-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
        <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>취소</Button>
        <Button type="submit" className="cursor-pointer">{isEdit ? "수정" : "등록"}</Button>
      </div>
    </form>
  );
};

export default DepartmentSchedulePolicyForm;
