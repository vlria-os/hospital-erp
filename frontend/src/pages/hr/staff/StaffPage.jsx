import { useEffect, useMemo, useState } from "react";
import usePagination from "../../../hooks/usePagination";
import Pagination from "../../../components/common/Pagination";
import StaffForm from "../../../components/form/StaffForm";
import CommonModal from "../../../components/common/CommonModal";
import CommonTable from "../../../components/common/CommonTable";
import RegisterButton from "../../../components/common/RegisterButton";
import SearchBar from "../../../components/common/SearchBar";
import { getStaffList, registerStaff, updateStaff } from "../../../api/hr/staffApi";
import { displayRole } from "../../../utils/roleUtils";
import { getDepartmentList } from "../../../api/hr/departmentApi";
import { getRoleList } from "../../../api/hr/roleApi";
import StaffBulkUpload from "../../../components/hr/StaffBulkUpload";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

const StaffPage = () => {
  const [staffList, setStaffList]               = useState([]);
  const [originalStaffList, setOriginalStaffList] = useState([]);
  const [departmentList, setDepartmentList]     = useState([]);
  const [open, setOpen]                         = useState(false);
  const [selectedStaff, setSelectedStaff]       = useState(null);
  const [bulkOpen, setBulkOpen]                 = useState(false);
  const [roleList, setRoleList]                 = useState([]);
  const [searchKeyword, setSearchKeyword]       = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [searchModalOpen, setSearchModalOpen]   = useState(false);
  const [searchCandidates, setSearchCandidates] = useState([]);

  const { pagedData: pagedStaffList, page, setPage, totalPages } = usePagination(staffList);

  const sortedDepartmentList = useMemo(() =>
    [...departmentList].sort((a, b) => (a.departmentName || "").localeCompare(b.departmentName || "", "ko")),
    [departmentList]);

  const sortedFilteredStaffList = useMemo(() => {
    let result = [...originalStaffList];
    if (selectedDepartmentId) result = result.filter(i => String(i.departmentId) === String(selectedDepartmentId));
    if (searchKeyword.trim()) result = result.filter(i => (i.name || "").toLowerCase().includes(searchKeyword.trim().toLowerCase()));
    return result.sort((a, b) => {
      const n = (a.name || "").localeCompare(b.name || "", "ko");
      return n !== 0 ? n : Number(a.staffId) - Number(b.staffId);
    });
  }, [originalStaffList, selectedDepartmentId, searchKeyword]);

  const columns = [
    { key: "rowNum",       title: "번호" },
    { key: "userId",       title: "직원 ID" },
    { key: "departmentName", title: "부서명" },
    { key: "managerId",    title: "담당직원ID" },
    { key: "roleDisplayName", title: "직급" },
    { key: "name",         title: "이름" },
    { key: "phone",        title: "전화번호" },
    { key: "address",      title: "주소" },
    { key: "isActiveText", title: "상태" },
    { key: "action",       title: "관리" },
  ];

  useEffect(() => {
    loadStaffList(); loadDepartmentList();
    getRoleList().then(setRoleList).catch(() => setRoleList([]));
  }, []);
  useEffect(() => { setStaffList(sortedFilteredStaffList); }, [sortedFilteredStaffList]);

  const loadStaffList = async () => {
    try {
      const data = await getStaffList();
      const mapped = data.map(item => ({
        id: item.staffId, staffId: item.staffId, userId: item.userId,
        departmentId: item.departmentId, departmentName: item.departmentName,
        managerId: item.managerId, roleId: item.roleId, roleName: item.roleName, roleDisplayName: displayRole(item.roleName), name: item.name,
        phone: item.phone, address: item.address, isActive: item.isActive,
        isActiveText: item.isActive === "Y" ? "사용" : "비활성(퇴사)",
        action: (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer"
              disabled={item.isActive === "N"} onClick={() => handleEdit(item)}>수정</Button>
            <Button size="sm" className={`h-7 text-xs cursor-pointer min-w-16 ${item.isActive === "Y" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
              onClick={() => handleToggleActive(item)}>
              {item.isActive === "Y" ? "비활성" : "활성"}
            </Button>
          </div>
        ),
      }));
      setOriginalStaffList(mapped); setStaffList(mapped);
    } catch (err) { console.error("직원 목록 조회 실패", err); }
  };

  const loadDepartmentList = async () => {
    try {
      const data = await getDepartmentList();
      setDepartmentList((data || []).filter(d => d.status !== "N"));
    } catch (err) { console.error("부서 목록 조회 실패", err); }
  };

  const handleOpen  = () => { setSelectedStaff(null); setOpen(true); };
  const handleClose = () => { setOpen(false); setSelectedStaff(null); };
  const handleEdit  = (staff) => { setSelectedStaff(staff); setOpen(true); };

  const handleSubmit = async (staffData) => {
    try {
      if (selectedStaff) { await updateStaff(staffData); alert("직원 정보가 수정되었습니다."); }
      else               { await registerStaff(staffData); alert("직원 등록이 완료되었습니다."); }
      await loadStaffList(); handleClose();
    } catch (err) { console.error("직원 저장 실패", err); alert("저장 중 오류가 발생했습니다."); }
  };

  const handleToggleActive = async (item) => {
    const next = item.isActive === "Y" ? "N" : "Y";
    if (!window.confirm(item.isActive === "Y" ? "이 직원을 비활성(퇴사)처리하시겠습니까?" : "이 직원을 다시 활성화하시겠습니까?")) return;
    try {
      await updateStaff({ staffId: item.staffId, userId: item.userId, departmentId: item.departmentId, managerId: item.managerId, roleIds: [item.roleId], name: item.name, phone: item.phone, address: item.address, isActive: next });
      await loadStaffList();
    } catch (err) { console.error("활성 상태 변경 실패", err); alert("상태 변경 중 오류가 발생했습니다."); }
  };

  const handleSearch = () => {
    const keyword = searchKeyword.trim().toLowerCase();
    let base = [...originalStaffList];
    if (selectedDepartmentId) base = base.filter(i => String(i.departmentId) === String(selectedDepartmentId));
    if (!keyword) { setStaffList(base.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"))); return; }
    const matched = base.filter(i => (i.name || "").toLowerCase().includes(keyword))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
    if (matched.length === 0) { alert("검색 결과가 없습니다."); setStaffList([]); return; }
    if (matched.length === 1) { setStaffList(matched); return; }
    setSearchCandidates(matched); setSearchModalOpen(true);
  };

  const handleSelectCandidate = (staff) => { setStaffList([staff]); setSearchModalOpen(false); setSearchCandidates([]); };

  const handleResetSearch = () => {
    setSearchKeyword(""); setSelectedDepartmentId(""); setSearchCandidates([]); setSearchModalOpen(false);
    setStaffList([...originalStaffList].sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko")));
  };

  return (
    <div className="p-6 space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-zinc-900">직원 관리</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="cursor-pointer" onClick={() => setBulkOpen(true)}>일괄등록</Button>
          <RegisterButton onClick={handleOpen} />
        </div>
      </div>

      {/* 검색 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        <SearchBar value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} onSearch={handleSearch} placeholder="이름으로 검색" />
        <select
          value={selectedDepartmentId}
          onChange={(e) => setSelectedDepartmentId(e.target.value)}
          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체부서</option>
          {sortedDepartmentList.map(dept => (
            <option key={dept.departmentId} value={dept.departmentId}>{dept.departmentName}</option>
          ))}
        </select>
        <Button variant="outline" className="cursor-pointer" onClick={handleResetSearch}>전체보기</Button>
      </div>

      {/* 테이블 */}
      <CommonTable columns={columns} data={pagedStaffList.map((item, idx) => ({ ...item, rowNum: page * 10 + idx + 1 }))} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* 직원 등록/수정 모달 */}
      <CommonModal open={open} onClose={handleClose}>
        <StaffForm onSubmit={handleSubmit} onClose={handleClose} initialData={selectedStaff} departmentList={departmentList} staffList={originalStaffList} />
      </CommonModal>

      {/* 일괄등록 모달 */}
      <StaffBulkUpload open={bulkOpen} onClose={() => setBulkOpen(false)} onSuccess={loadStaffList} departmentList={departmentList} roleList={roleList} />

      {/* 동명이인 선택 모달 */}
      <CommonModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)}>
        <p className="text-sm font-semibold text-zinc-800 mb-1">동명이인 선택</p>
        <p className="text-xs text-zinc-400 mb-3">직원번호 / 이름 / 부서명 / 전화번호</p>
        <div className="space-y-2">
          {searchCandidates.map(staff => (
            <button key={staff.staffId} type="button" onClick={() => handleSelectCandidate(staff)}
              className="w-full text-left px-4 py-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-sm text-zinc-700 cursor-pointer transition-colors">
              {staff.staffId} / {staff.name} / {staff.departmentName} / {staff.phone}
            </button>
          ))}
        </div>
      </CommonModal>
    </div>
  );
};

export default StaffPage;