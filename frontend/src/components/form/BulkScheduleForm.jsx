import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClass = "w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const ROLE_TABS = [
  { key: "doctor", label: "의사계열" },
  { key: "nurse",  label: "간호계열" },
];

const BulkScheduleForm = ({
  formData, setFormData, onSubmit, onClose,
  departmentList = [], staffList = [], scheduleTypeList = [], roleList = [],
}) => {
  const [staffKeyword, setStaffKeyword] = useState("");
  const [roleCategory, setRoleCategory] = useState("doctor");

  const doctorRoleNames = useMemo(() =>
    new Set(roleList.filter(r => r.parentRoleName === "DOCTOR").map(r => r.roleName)), [roleList]);
  const nurseRoleNames = useMemo(() =>
    new Set(roleList.filter(r => r.roleName === "NURSE" || r.parentRoleName === "NURSE").map(r => r.roleName)), [roleList]);

  const categoryRoleNames = roleCategory === "doctor" ? doctorRoleNames : nurseRoleNames;

  const isDoctorCategory = roleCategory === "doctor";

  const filteredStaffList = useMemo(() =>
    staffList.filter(s => {
      if (!categoryRoleNames.has(s.roleName)) return false;
      const kw = staffKeyword.trim();
      const matchKw = !kw ||
        (s.name||"").includes(kw) ||
        String(s.staffId).includes(kw) ||
        (s.roleName||"").includes(kw);
      const matchDept = isDoctorCategory && formData.departmentId
        ? String(s.departmentId) === String(formData.departmentId) : true;
      return matchKw && matchDept;
    }), [staffList, categoryRoleNames, staffKeyword, formData.departmentId, isDoctorCategory]);

  const handleCategoryChange = (cat) => {
    setRoleCategory(cat);
    setFormData(p => ({ ...p, departmentId: "", staffIds: [] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "departmentId") {
      setFormData(p => ({ ...p, departmentId: value, staffIds: [] })); return;
    }
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleStaffCheck = (staffId) => {
    setFormData(p => {
      const cur = p.staffIds || [];
      return { ...p, staffIds: cur.includes(staffId) ? cur.filter(id => id !== staffId) : [...cur, staffId] };
    });
  };

  const handleSelectAll = (checked) => {
    setFormData(p => ({ ...p, staffIds: checked ? filteredStaffList.map(s => s.staffId) : [] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isDoctorCategory && !formData.departmentId) { alert("부서를 선택해주세요"); return; }
    if (!formData.staffIds?.length)            { alert("직원을 한 명 이상 선택해주세요"); return; }
    if (!formData.startDate)                   { alert("시작일을 선택해주세요"); return; }
    if (!formData.endDate)                     { alert("종료일을 선택해주세요"); return; }
    if (formData.startDate > formData.endDate) { alert("시작일은 종료일보다 늦을 수 없습니다"); return; }
    if (!formData.scheduleTypeId)              { alert("근무유형을 선택해주세요"); return; }
    onSubmit({
      ...formData,
      departmentId: isDoctorCategory && formData.departmentId ? formData.departmentId : null,
    });
  };

  const selectedCount = (formData.staffIds||[]).length;
  const allSelected   = filteredStaffList.length > 0 && filteredStaffList.every(s => (formData.staffIds||[]).includes(s.staffId));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-base font-semibold text-zinc-900">스케줄 일괄등록</p>

      {/* 직종 탭 */}
      <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
        {ROLE_TABS.map(tab => (
          <button key={tab.key} type="button" onClick={() => handleCategoryChange(tab.key)}
            className={cn("flex-1 py-1.5 text-xs font-medium transition-colors",
              roleCategory === tab.key ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50"
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isDoctorCategory && (
          <div className="space-y-1.5">
            <Label>부서 <span className="text-red-500">*</span></Label>
            <select name="departmentId" value={formData.departmentId||""} onChange={handleChange} className={selectClass}>
              <option value="">부서 선택</option>
              {departmentList.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
          </div>
        )}

        <div className={cn("space-y-1.5", !isDoctorCategory && "col-span-2")}>
          <Label>직원 검색</Label>
          <Input value={staffKeyword} onChange={e => setStaffKeyword(e.target.value)} placeholder="직원명 검색" />
        </div>
      </div>

      {/* 직원 선택 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>직원 선택</Label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={e => handleSelectAll(e.target.checked)}
                className="accent-blue-600" />
              전체선택
            </label>
            {selectedCount > 0 && (
              <span className="text-xs text-blue-600 font-medium">{selectedCount}명 선택됨</span>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 overflow-y-auto max-h-40 divide-y divide-zinc-100">
          {filteredStaffList.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">선택 가능한 직원이 없습니다.</p>
          ) : (
            filteredStaffList.map(staff => (
              <label key={staff.staffId}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-zinc-50 transition-colors">
                <input type="checkbox" checked={(formData.staffIds||[]).includes(staff.staffId)}
                  onChange={() => handleStaffCheck(staff.staffId)} className="accent-blue-600" />
                <span className="text-sm text-zinc-800">{staff.name}</span>
                <span className="text-xs text-zinc-400 ml-auto">{staff.departmentName || staff.roleName || "-"}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>시작일</Label>
          <input type="date" name="startDate" value={formData.startDate||""} onChange={handleChange} className={selectClass} />
        </div>
        <div className="space-y-1.5">
          <Label>종료일</Label>
          <input type="date" name="endDate" value={formData.endDate||""} onChange={handleChange} className={selectClass} />
        </div>
        <div className="space-y-1.5">
          <Label>근무유형</Label>
          <select name="scheduleTypeId" value={formData.scheduleTypeId||""} onChange={handleChange} className={selectClass}>
            <option value="">근무유형 선택</option>
            {scheduleTypeList.map(t => (
              <option key={t.scheduleTypeId} value={t.scheduleTypeId} disabled={t.isActive===false}>
                {t.typeName}{t.isActive===false ? " (비활성)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>상태</Label>
          <select name="status" value={formData.status||""} onChange={handleChange} className={selectClass}>
            <option value="TEMP">임시</option>
            <option value="CONFIRMED">확정</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
        <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>취소</Button>
        <Button type="submit" className="cursor-pointer">일괄등록</Button>
      </div>
    </form>
  );
};

export default BulkScheduleForm;
