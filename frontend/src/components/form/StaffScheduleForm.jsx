import { useEffect, useMemo, useState } from "react";
import CommonModal from "../common/CommonModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClass = "w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50";

const ROLE_TABS = [
  { key: "doctor", label: "의사계열" },
  { key: "nurse",  label: "간호계열" },
];

const StaffScheduleForm = ({
  formData, setFormData, onSubmit, onClose,
  departmentList = [], staffList = [], scheduleTypeList = [], roleList = [], isEdit,
}) => {
  const [staffKeyword, setStaffKeyword]             = useState("");
  const [staffModalOpen, setStaffModalOpen]         = useState(false);
  const [staffSearchResult, setStaffSearchResult]   = useState([]);
  const [selectedStaffLabel, setSelectedStaffLabel] = useState("");
  const [roleCategory, setRoleCategory]             = useState("doctor");

  const doctorRoleNames = useMemo(() =>
    new Set(roleList.filter(r => r.parentRoleName === "DOCTOR").map(r => r.roleName)), [roleList]);
  const nurseRoleNames = useMemo(() =>
    new Set(roleList.filter(r => r.roleName === "NURSE" || r.parentRoleName === "NURSE").map(r => r.roleName)), [roleList]);
  const categoryRoleNames = roleCategory === "doctor" ? doctorRoleNames : nurseRoleNames;

  const categoryStaffList = useMemo(() =>
    staffList.filter(s => categoryRoleNames.has(s.roleName)), [staffList, categoryRoleNames]);

  const isDoctorCategory = roleCategory === "doctor";
  const selectedDepartment = departmentList.find(d => String(d.departmentId) === String(formData.departmentId));

  useEffect(() => {
    if (!formData.staffId) { setSelectedStaffLabel(""); return; }
    const s = staffList.find(s => String(s.staffId) === String(formData.staffId));
    setSelectedStaffLabel(s ? `${s.staffId} / ${s.name || ""}` : "");
  }, [formData.staffId, staffList]);

  const handleCategoryChange = (cat) => {
    setRoleCategory(cat);
    setFormData(p => ({ ...p, departmentId: "", staffId: "" }));
    setSelectedStaffLabel("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "departmentId") {
      setFormData(p => ({ ...p, departmentId: value, staffId: "" }));
      setSelectedStaffLabel(""); return;
    }
    setFormData(p => ({ ...p, [name]: value }));
  };

  const getFilteredStaff = () => {
    const kw = staffKeyword.trim().replace(/\s/g, "").toLowerCase();
    return categoryStaffList.filter(s => {
      const matchDept = isDoctorCategory && formData.departmentId
        ? String(s.departmentId) === String(formData.departmentId) : true;
      if (!kw) return matchDept;
      const t = `${s.staffId||""} ${s.name||""} ${s.roleName||""}`.replace(/\s/g, "").toLowerCase();
      return matchDept && t.includes(kw);
    });
  };

  const handleOpenStaffModal = () => {
    setStaffModalOpen(true); setStaffKeyword("");
    setStaffSearchResult(categoryStaffList.filter(s =>
      isDoctorCategory && formData.departmentId ? String(s.departmentId) === String(formData.departmentId) : true
    ));
  };
  const handleCloseStaffModal = () => { setStaffModalOpen(false); setStaffKeyword(""); setStaffSearchResult([]); };
  const handleStaffSearch    = () => setStaffSearchResult(getFilteredStaff());
  const handleStaffSelect    = (staff) => {
    setFormData(p => ({ ...p, staffId: staff.staffId, departmentId: p.departmentId || (isDoctorCategory ? staff.departmentId : "") }));
    setSelectedStaffLabel(`${staff.staffId} / ${staff.name || ""}`);
    handleCloseStaffModal();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isDoctorCategory && !formData.departmentId) { alert("부서를 선택해주세요"); return; }
    if (!formData.staffId)       { alert("직원을 선택해주세요"); return; }
    if (!formData.workDate)      { alert("날짜를 선택해주세요"); return; }
    if (!formData.scheduleTypeId){ alert("근무유형을 선택해주세요"); return; }
    onSubmit({
      ...formData,
      departmentId: isDoctorCategory && formData.departmentId ? Number(formData.departmentId) : null,
      staffId: Number(formData.staffId),
      scheduleTypeId: Number(formData.scheduleTypeId),
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-base font-semibold text-zinc-900">{isEdit ? "스케줄 수정" : "스케줄 등록"}</p>

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
            <Label>직원</Label>
            <div className="flex gap-2">
              <Input value={selectedStaffLabel}
                placeholder={isDoctorCategory && formData.departmentId ? `${selectedDepartment?.departmentName||""} 직원 선택` : "직원 선택"}
                readOnly className="flex-1" />
              <Button type="button" variant="outline" className="shrink-0 cursor-pointer" onClick={handleOpenStaffModal}>검색</Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>날짜</Label>
            <input type="date" name="workDate" value={formData.workDate||""} onChange={handleChange} className={selectClass} />
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
            <select name="status" value={formData.status||""} onChange={handleChange} disabled={isEdit} className={selectClass}>
              <option value="TEMP">임시</option>
              <option value="CONFIRMED">확정</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
          <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>취소</Button>
          <Button type="submit" className="cursor-pointer">{isEdit ? "수정" : "등록"}</Button>
        </div>
      </form>

      <CommonModal open={staffModalOpen} onClose={handleCloseStaffModal} title="직원 검색">
        <div className="space-y-3">
          {isDoctorCategory && formData.departmentId && (
            <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              현재 필터: {selectedDepartment?.departmentName || "-"}
            </p>
          )}
          <div className="flex gap-2">
            <Input value={staffKeyword} onChange={e => setStaffKeyword(e.target.value)}
              placeholder="이름 / 직원번호 / 직급 검색" className="flex-1"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleStaffSearch(); } }} />
            <Button type="button" variant="outline" className="shrink-0 cursor-pointer" onClick={handleStaffSearch}>검색</Button>
            <Button type="button" variant="ghost" className="shrink-0 cursor-pointer" onClick={handleCloseStaffModal}>취소</Button>
          </div>
          <div className="rounded-lg border border-zinc-200 overflow-y-auto max-h-72 divide-y divide-zinc-100">
            {staffSearchResult.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">검색 결과가 없습니다.</p>
            ) : (
              staffSearchResult.map(staff => (
                <div key={staff.staffId} onClick={() => handleStaffSelect(staff)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{staff.name || "-"}</p>
                    <p className="text-xs text-zinc-400">{staff.departmentName || staff.roleName || "-"}</p>
                  </div>
                  <span className="text-xs text-zinc-500">#{staff.staffId}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </CommonModal>
    </>
  );
};

export default StaffScheduleForm;
