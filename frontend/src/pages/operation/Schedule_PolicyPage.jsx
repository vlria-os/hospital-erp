import { useEffect, useState } from "react";
import dayjs from "dayjs";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/common/Pagination";
import RegisterButton from "../../components/common/RegisterButton";
import SearchBar from "../../components/common/SearchBar";
import CommonTable from "../../components/common/CommonTable";
import CommonModal from "../../components/common/CommonModal";
import SchedulePolicyForm from "../../components/form/SchedulePolicyForm";
import { getSchedulePolicyList, registerSchedulePolicy, updateSchedulePolicy } from "../../api/hr/schedulePolicyApi";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

const Schedule_policyPage = () => {
  const [schedulePolicyList, setSchedulePolicyList]         = useState([]);
  const [originalSchedulePolicyList, setOriginalSchedulePolicyList] = useState([]);
  const [open, setOpen]                                     = useState(false);
  const [selectedSchedulePolicy, setSelectedSchedulePolicy] = useState(null);
  const [searchKeyword, setSearchKeyword]                   = useState("");
  const { pagedData: pagedPolicyList, page, setPage, totalPages } = usePagination(schedulePolicyList);

  useEffect(() => { loadSchedulePolicyList(); }, []);

  const loadSchedulePolicyList = async () => {
    try {
      const data = await getSchedulePolicyList();
      const mapped = data.map(item => ({
        scheduleTypeId: item.scheduleTypeId,
        typeCode:       item.typeCode,
        typeName:       item.typeName,
        startTime:      item.startTime,
        endTime:        item.endTime,
        isActive:       item.isActive,
        isActiveText:   item.isActive ? "사용" : "비활성",
        createdAt:      item.createdAt ? dayjs(item.createdAt).format("YYYY년 MM월 DD일 HH시 mm분 ss초") : "",
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
      setSchedulePolicyList(mapped);
      setOriginalSchedulePolicyList(mapped);
    } catch (err) { console.error("근무유형 목록 조회 실패", err); }
  };

  const handleOpen  = () => { setSelectedSchedulePolicy(null); setOpen(true); };
  const handleClose = () => { setOpen(false); setSelectedSchedulePolicy(null); };
  const handleEdit  = (p) => { setSelectedSchedulePolicy(p); setOpen(true); };

  const handleSubmit = async (data) => {
    try {
      if (selectedSchedulePolicy) await updateSchedulePolicy(data.scheduleTypeId, data);
      else                        await registerSchedulePolicy(data);
      await loadSchedulePolicyList();
      handleClose();
    } catch (err) { alert(err?.response?.data?.message || "저장 중 오류가 발생했습니다"); }
  };

  const handleToggleActive = async (item) => {
    if (!window.confirm(item.isActive ? "이 근무유형을 비활성처리하시겠습니까?" : "이 근무유형을 다시 활성화하시겠습니까?")) return;
    try {
      await updateSchedulePolicy(item.scheduleTypeId, { ...item, isActive: !item.isActive });
      await loadSchedulePolicyList();
    } catch { alert("상태 변경 중 오류가 발생했습니다"); }
  };

  const handleSearch = () => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) { setSchedulePolicyList(originalSchedulePolicyList); return; }
    const matched = originalSchedulePolicyList.filter(i =>
      i.typeCode.toLowerCase().includes(kw) || i.typeName.toLowerCase().includes(kw)
    );
    if (matched.length === 0) { alert("검색 결과가 없습니다"); setSchedulePolicyList([]); return; }
    setSchedulePolicyList(matched);
  };

  const handleResetSearch = () => { setSearchKeyword(""); setSchedulePolicyList(originalSchedulePolicyList); };

  const columns = [
    { key: "scheduleTypeId", title: "번호" },
    { key: "typeCode",       title: "코드" },
    { key: "typeName",       title: "근무유형" },
    { key: "startTime",      title: "시작시간" },
    { key: "endTime",        title: "종료시간" },
    { key: "isActiveText",   title: "상태" },
    { key: "createdAt",      title: "등록일" },
    { key: "action",         title: "관리" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-zinc-900">스케줄 운영설정</h2>
        </div>
        <RegisterButton onClick={handleOpen} />
      </div>

      <div className="flex items-center gap-2">
        <SearchBar value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)}
          onSearch={handleSearch} placeholder="근무 유형을 입력하세요" />
        <Button variant="outline" className="cursor-pointer" onClick={handleResetSearch}>전체보기</Button>
      </div>

      <CommonTable columns={columns} data={pagedPolicyList} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <CommonModal open={open} onClose={handleClose} title={selectedSchedulePolicy ? "근무유형 수정" : "근무유형 등록"}>
        <SchedulePolicyForm onSubmit={handleSubmit} onClose={handleClose} initialData={selectedSchedulePolicy} />
      </CommonModal>
    </div>
  );
};

export default Schedule_policyPage;
