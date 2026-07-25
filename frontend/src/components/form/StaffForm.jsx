import { useEffect, useState } from "react";
import CommonModal from "../common/CommonModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRoleList } from "../../api/hr/roleApi";
import { displayRole } from "../../utils/roleUtils";

const initState = {
  staffId: "", userId: "", email: "", password: "", departmentId: "",
  managerId: "", roleId: "", name: "", phone: "", address: "", isActive: "Y",
};

const selectClass = "w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

const StaffForm = ({ onSubmit, onClose, initialData, departmentList = [], staffList = [] }) => {
  const [form, setForm]                           = useState(initState);
  const [managerModalOpen, setManagerModalOpen]   = useState(false);
  const [managerKeyword, setManagerKeyword]       = useState("");
  const [managerSearchResult, setManagerSearchResult] = useState([]);
  const [selectedManagerLabel, setSelectedManagerLabel] = useState("");
  const [roleList, setRoleList] = useState([]);

  useEffect(() => {
    getRoleList().then(setRoleList).catch(() => setRoleList([]));
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        staffId: initialData.staffId || "", userId: initialData.userId || "",
        email: "", password: "",
        departmentId: initialData.departmentId || "", managerId: initialData.managerId || "",
        roleId: initialData.roleId || "", name: initialData.name || "",
        phone: initialData.phone || "", address: initialData.address || "",
        isActive: initialData.isActive ?? "Y",
      });
      const mgr = staffList.find(s => Number(s.staffId) === Number(initialData.managerId));
      setSelectedManagerLabel(mgr ? `${mgr.staffId} / ${mgr.name || ""}` : "");
    } else {
      setForm(initState); setSelectedManagerLabel(""); setManagerKeyword(""); setManagerSearchResult([]);
    }
  }, [initialData, staffList]);

    const ASSIGNABLE_PARENT_ROLES = new Set(["NURSE"]);
    const parentRoleNames = new Set(
      roleList
        .map(r => r.parentRoleName)
        .filter(name => name && !ASSIGNABLE_PARENT_ROLES.has(name))
    );
    const assignableRoles = roleList.filter(r => !parentRoleNames.has(r.roleName));

  const selectedRole = roleList.find(r => String(r.roleId) === String(form.roleId));
  const isDoctorRole = selectedRole?.parentRoleName === "DOCTOR";

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "roleId") {
      const role = roleList.find(r => String(r.roleId) === value);
      const isDoctor = role?.parentRoleName === "DOCTOR";
      setForm(p => ({ ...p, roleId: value, departmentId: isDoctor ? p.departmentId : "" }));
      return;
    }
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleManagerSearch = () => {
    const kw = managerKeyword.trim().replace(/\s/g, "").toLowerCase();
    setManagerSearchResult(staffList.filter(s => {
      const t = `${s.staffId||""} ${s.name||""} ${s.roleName||""}`.replace(/\s/g,"").toLowerCase();
      return !kw || t.includes(kw);
    }));
  };

  const handleOpenManagerModal  = () => { setManagerModalOpen(true); setManagerKeyword(""); setManagerSearchResult(staffList); };
  const handleCloseManagerModal = () => { setManagerModalOpen(false); setManagerKeyword(""); setManagerSearchResult([]); };
  const handleManagerSelect = (staff) => {
    setForm(p => ({ ...p, managerId: staff.staffId }));
    setSelectedManagerLabel(`${staff.staffId} / ${staff.name || ""}`);
    handleCloseManagerModal();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.roleId) { alert("직급을 선택해주세요."); return; }
    if (isDoctorRole && !form.departmentId) { alert("의사 직급은 부서 선택이 필수입니다."); return; }
    onSubmit({
      staffId: form.staffId ? Number(form.staffId) : null,
      userId: form.userId || null,
      email: form.email || null, password: form.password || null,
      departmentId: isDoctorRole && form.departmentId ? Number(form.departmentId) : null,
      managerId: form.managerId ? Number(form.managerId) : null,
      roleIds: [Number(form.roleId)],
      name: form.name, phone: form.phone,
      address: form.address, isActive: form.isActive,
    });
    setForm(initState); setSelectedManagerLabel(""); setManagerKeyword(""); setManagerSearchResult([]);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-base font-semibold text-zinc-900">
          {initialData ? "직원 수정" : "직원 등록"}
        </p>

        <div className="grid grid-cols-2 gap-4">
          {!initialData && (
            <>
              <div className="space-y-1.5">
                <Label>이메일</Label>
                <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="이메일 입력" />
              </div>
              <div className="space-y-1.5">
                <Label>비밀번호</Label>
                <Input type="password" name="password" value={form.password} onChange={handleChange} placeholder="비밀번호 입력" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>직급</Label>
            <select name="roleId" value={form.roleId} onChange={handleChange} className={selectClass}>
              <option value="">직급 선택</option>
              {assignableRoles.map(role => (
                <option key={role.roleId} value={role.roleId}>{displayRole(role.roleName)}</option>
              ))}
            </select>
          </div>

          {isDoctorRole && (
            <div className="space-y-1.5">
              <Label>부서명 <span className="text-red-500">*</span></Label>
              <select name="departmentId" value={form.departmentId} onChange={handleChange} disabled={!!initialData} className={selectClass}>
                <option value="">부서 선택</option>
                {departmentList.map(dept => (
                  <option key={dept.departmentId} value={dept.departmentId}>{dept.departmentName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>이름</Label>
            <Input type="text" name="name" placeholder="이름" value={form.name} onChange={handleChange} />
          </div>

          <div className="space-y-1.5">
            <Label>전화번호</Label>
            <Input type="text" name="phone" placeholder="전화번호" value={form.phone} onChange={handleChange} />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>주소</Label>
            <Input type="text" name="address" placeholder="주소" value={form.address} onChange={handleChange} />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>담당직원</Label>
            <div className="flex gap-2">
              <Input value={selectedManagerLabel} placeholder="담당직원을 검색하세요" readOnly className="flex-1" />
              <Button type="button" variant="outline" className="shrink-0 cursor-pointer" onClick={handleOpenManagerModal}>검색</Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>상태</Label>
            <select name="isActive" value={form.isActive} onChange={handleChange} className={selectClass}>
              <option value="Y">사용</option>
              <option value="N">비활성</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
          <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>취소</Button>
          <Button type="submit" className="cursor-pointer">{initialData ? "수정" : "등록"}</Button>
        </div>
      </form>

      {/* 담당직원 검색 모달 */}
      <CommonModal open={managerModalOpen} onClose={handleCloseManagerModal} title="담당직원 검색">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={managerKeyword}
              onChange={(e) => setManagerKeyword(e.target.value)}
              placeholder="이름 / ID / 직급 검색"
              className="flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleManagerSearch(); } }}
            />
            <Button type="button" variant="outline" className="shrink-0 cursor-pointer" onClick={handleManagerSearch}>검색</Button>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-y-auto max-h-72 divide-y divide-zinc-100">
            {managerSearchResult.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">검색 결과가 없습니다.</p>
            ) : (
              managerSearchResult.map(staff => (
                <div key={staff.staffId} onClick={() => handleManagerSelect(staff)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{staff.name || "-"}</p>
                    <p className="text-xs text-zinc-400">ID: {staff.staffId} · {displayRole(staff.roleName)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CommonModal>
    </>
  );
};

export default StaffForm;