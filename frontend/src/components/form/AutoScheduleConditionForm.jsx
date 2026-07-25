import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const initialForm = {
  policyId: "",
  departmentId: "", roleCategory: "nurse",
  startDate: "", endDate: "",
  minStaffDay: 2, minStaffEvening: 1, minStaffNight: 1,
  maxConsecutiveNight: 3, blockNightToDay: true, blockNightToEvening: false,
  maxWorkDaysPerWeek: 5, extraCondition: "",
};

const selectClass = "w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50";
const inputClass  = "h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50";

const ROLE_TABS = [
  { key: "nurse",  label: "간호계열" },
  { key: "doctor", label: "의사계열" },
];

const Section = ({ title, children }) => (
  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide border-b border-zinc-200 pb-2">{title}</p>
    {children}
  </div>
);

const AutoScheduleConditionForm = ({ onSubmit, onClose, departmentList = [], policyList=[], isLoading = false }) => {
  const [formData, setFormData] = useState(initialForm);

  const isDoctorCategory = formData.roleCategory === "doctor";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCategoryChange = (cat) => {
    setFormData(p => ({ ...p, roleCategory: cat, departmentId: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isDoctorCategory && !formData.departmentId) { alert("부서를 선택해주세요"); return; }
    if (!formData.startDate) { alert("시작일을 선택해주세요"); return; }
    if (!formData.endDate)   { alert("종료일을 선택해주세요"); return; }
    if (formData.startDate > formData.endDate) { alert("시작일은 종료일보다 늦을 수 없습니다"); return; }
    onSubmit({
      policyId: Number(formData.policyId),
      departmentId: isDoctorCategory && formData.departmentId ? Number(formData.departmentId) : null,
      roleCategory: formData.roleCategory,
      startDate: formData.startDate, endDate: formData.endDate,
      minStaffMap: { DAY: Number(formData.minStaffDay), EVENING: Number(formData.minStaffEvening), NIGHT: Number(formData.minStaffNight) },
      maxConsecutiveNight: Number(formData.maxConsecutiveNight),
      blockNightToDay: formData.blockNightToDay, blockNightToEvening: formData.blockNightToEvening,
      maxWorkDaysPerWeek: Number(formData.maxWorkDaysPerWeek),
      extraCondition: formData.extraCondition.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot size={18} className="text-violet-600" />
        <div>
          <p className="text-base font-semibold text-zinc-900">자동 스케줄 조건 설정</p>
          <p className="text-xs text-zinc-400">조건을 입력하면 AI가 자동으로 스케줄을 생성합니다.</p>
        </div>
      </div>

      {/* 직종 탭 */}
      <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
        {ROLE_TABS.map(tab => (
          <button key={tab.key} type="button" onClick={() => handleCategoryChange(tab.key)} disabled={isLoading}
            className={cn("flex-1 py-1.5 text-xs font-medium transition-colors",
              formData.roleCategory === tab.key ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50"
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 기본 설정 */}
      <Section title="기본 설정">
          {/* 정책 선택 - 항상 보이게 */}
          <div className="space-y-1.5">
            <Label>스케줄 정책 <span className="text-red-500">*</span></Label>
            <select name="policyId" value={formData.policyId} onChange={handleChange} className={selectClass}>
              <option value="">정책 선택</option>
              {policyList.map(p => (
                <option key={p.policyId} value={p.policyId}>
                  {p.departmentName || p.jobType}
                </option>
              ))}
            </select>
          </div>
        {isDoctorCategory && (
          <div className="space-y-1.5">
            <Label>부서 <span className="text-red-500">*</span></Label>
            <select name="departmentId" value={formData.departmentId} onChange={handleChange} disabled={isLoading} className={selectClass}>
              <option value="">부서 선택</option>
              {departmentList.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>시작일 <span className="text-red-500">*</span></Label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} disabled={isLoading} className={`${inputClass} w-full`} />
          </div>
          <div className="space-y-1.5">
            <Label>종료일 <span className="text-red-500">*</span></Label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} disabled={isLoading} className={`${inputClass} w-full`} />
          </div>
        </div>
      </Section>

      {/* 최소 인원 */}
      <Section title="하루 최소 근무 인원">
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "minStaffDay",     label: "데이(DAY)" },
            { name: "minStaffEvening", label: "이브닝" },
            { name: "minStaffNight",   label: "나이트" },
          ].map(({ name, label }) => (
            <div key={name} className="space-y-1.5">
              <Label>{label}</Label>
              <input type="number" name={name} min={0} value={formData[name]} onChange={handleChange}
                disabled={isLoading} className={`${inputClass} w-full`} />
            </div>
          ))}
        </div>
      </Section>

      {/* 야간 규칙 */}
      <Section title="야간 근무 규칙">
        <div className="flex items-center gap-3">
          <Label className="shrink-0">야간 연속 최대</Label>
          <input type="number" name="maxConsecutiveNight" min={1} max={7} value={formData.maxConsecutiveNight}
            onChange={handleChange} disabled={isLoading} className={`${inputClass} w-20`} />
          <span className="text-sm text-zinc-500">일</span>
        </div>
        <div className="space-y-2 pt-1">
          {[
            { name: "blockNightToDay",     label: "야간 다음날 데이(DAY) 근무 금지" },
            { name: "blockNightToEvening", label: "야간 다음날 이브닝(EVENING) 근무 금지" },
          ].map(({ name, label }) => (
            <label key={name} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange}
                disabled={isLoading} className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-zinc-700">{label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* 주간 제한 */}
      <Section title="주간 근무 제한">
        <div className="flex items-center gap-3">
          <Label className="shrink-0">주 최대 근무일</Label>
          <input type="number" name="maxWorkDaysPerWeek" min={1} max={7} value={formData.maxWorkDaysPerWeek}
            onChange={handleChange} disabled={isLoading} className={`${inputClass} w-20`} />
          <span className="text-sm text-zinc-500">일</span>
        </div>
      </Section>

      {/* 추가 조건 */}
      <Section title="개별 추가 조건 (선택)">
        <Textarea name="extraCondition" value={formData.extraCondition} onChange={handleChange}
          placeholder={"예) 김행정 6/3 OFF\n예) 홍길동 야간 제외\n한 줄에 하나씩 입력하세요"}
          disabled={isLoading} rows={3} />
        <p className="text-xs text-zinc-400">일반 규칙 외 특수 조건만 입력하세요.</p>
      </Section>

      {isLoading && (
        <div className="text-center py-2">
          <p className="text-sm text-violet-600 font-medium">AI가 스케줄을 생성 중입니다...</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
        <Button type="button" variant="outline" disabled={isLoading} className="cursor-pointer" onClick={onClose}>취소</Button>
        <Button type="submit" disabled={isLoading} className="cursor-pointer gap-1.5">
          <Bot size={14} />{isLoading ? "생성 중..." : "AI 스케줄 생성"}
        </Button>
      </div>
    </form>
  );
};

export default AutoScheduleConditionForm;
