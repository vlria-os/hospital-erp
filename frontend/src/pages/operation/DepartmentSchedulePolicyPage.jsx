import { useEffect, useState } from "react";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/common/Pagination";
import RegisterButton from "../../components/common/RegisterButton";
import SearchBar from "../../components/common/SearchBar";
import CommonTable from "../../components/common/CommonTable";
import CommonModal from "../../components/common/CommonModal";
import DepartmentSchedulePolicyForm from "../../components/form/DepartmentSchedulePolicyForm";
import {
  getDepartmentSchedulePolicyList, registerDepartmentSchedulePolicy,
  updateDepartmentSchedulePolicy, deactivateDepartmentSchedulePolicy,
} from "../../api/hr/departmentSchedulePolicyApi";
import { Button } from "@/components/ui/button";
import { LayoutList } from "lucide-react";

const DepartmentSchedulePolicyPage = () => {
  const [policyList, setPolicyList]             = useState([]);
  const [originalPolicyList, setOriginalPolicyList] = useState([]);
  const [open, setOpen]                         = useState(false);
  const [selectedPolicy, setSelectedPolicy]     = useState(null);
  const [searchKeyword, setSearchKeyword]       = useState("");
  const { pagedData: pagedPolicyList, page, setPage, totalPages } = usePagination(policyList);

  useEffect(() => { loadPolicyList(); }, []);

  const loadPolicyList = async () => {
    try {
      const data = await getDepartmentSchedulePolicyList();
      const list = Array.isArray(data) ? data : [];
      const mapped = list.map(item => ({
        ...item,
        shiftTypesText: item.shiftTypes ? item.shiftTypes.join(", ") : "-",
        isActiveText:   item.isActive ? "활성" : "비활성",
        action: (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => handleEdit(item)}>수정</Button>
            <Button size="sm" className={`h-7 text-xs cursor-pointer ${item.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"}`}
              onClick={() => handleToggleActive(item)}>
              {item.isActive ? "비활성" : "활성"}
            </Button>
          </div>
        ),
      }));
      setPolicyList(mapped);
      setOriginalPolicyList(mapped);
    } catch (err) { console.error("부서 스케줄 정책 목록 조회 실패", err); setPolicyList([]); }
  };

  const handleOpen  = () => { setSelectedPolicy(null); setOpen(true); };
  const handleClose = () => { setOpen(false); setSelectedPolicy(null); };
  const handleEdit  = (p) => { setSelectedPolicy(p); setOpen(true); };

  const handleSubmit = async (data) => {
    try {
      if (selectedPolicy) await updateDepartmentSchedulePolicy(selectedPolicy.policyId, data);
      else                await registerDepartmentSchedulePolicy(data);
      await loadPolicyList();
      handleClose();
    } catch (err) { alert(err?.response?.data?.message || "저장 중 오류가 발생했습니다"); }
  };

  const handleToggleActive = async (item) => {
    if (!window.confirm(item.isActive ? "이 정책을 비활성 처리하시겠습니까?" : "이 정책을 다시 활성화하시겠습니까?")) return;
    try {
      if (item.isActive) {
        await deactivateDepartmentSchedulePolicy(item.policyId);
      } else {
        await updateDepartmentSchedulePolicy(item.policyId, {
          roleId: item.roleId, departmentId: item.departmentId,
          jobType: item.jobType, shiftTypes: item.shiftTypes, minStaffMap: item.minStaffMap,
          maxConsecutiveNight: item.maxConsecutiveNight, blockNightToDay: item.blockNightToDay,
          blockNightToEvening: item.blockNightToEvening, maxWorkDaysPerWeek: item.maxWorkDaysPerWeek,
          isActive: true,
        });
      }
      await loadPolicyList();
    } catch { alert("상태 변경 중 오류가 발생했습니다"); }
  };

  const handleSearch = () => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) { setPolicyList(originalPolicyList); return; }
    const matched = originalPolicyList.filter(i =>
      (i.departmentName||"").toLowerCase().includes(kw) || (i.jobType||"").toLowerCase().includes(kw)
    );
    if (matched.length === 0) { alert("검색 결과가 없습니다"); setPolicyList([]); return; }
    setPolicyList(matched);
  };

  const handleResetSearch = () => { setSearchKeyword(""); setPolicyList(originalPolicyList); };

  const columns = [
    { key: "rowNum",              title: "번호" },
    { key: "departmentName",      title: "부서명" },
    { key: "jobType",             title: "직무유형" },
    { key: "shiftTypesText",      title: "허용 근무유형" },
    { key: "maxWorkDaysPerWeek",  title: "주 최대 근무일" },
    { key: "maxConsecutiveNight", title: "최대 연속 야간" },
    { key: "isActiveText",        title: "상태" },
    { key: "action",              title: "관리" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutList size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-zinc-900">부서별 스케줄 정책</h2>
        </div>
        <RegisterButton onClick={handleOpen} />
      </div>

      <div className="flex items-center gap-2">
        <SearchBar value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)}
          onSearch={handleSearch} placeholder="부서명 또는 직무유형을 입력하세요" />
        <Button variant="outline" className="cursor-pointer" onClick={handleResetSearch}>전체보기</Button>
      </div>

      <CommonTable columns={columns} data={pagedPolicyList.map((item, idx) => ({ ...item, rowNum: page * 10 + idx + 1 }))} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <CommonModal open={open} onClose={handleClose} title={selectedPolicy ? "부서 정책 수정" : "부서 정책 등록"}>
        <DepartmentSchedulePolicyForm onSubmit={handleSubmit} onClose={handleClose} initialData={selectedPolicy} />
      </CommonModal>
    </div>
  );
};

export default DepartmentSchedulePolicyPage;
