import { useEffect, useState, useMemo } from "react";
import usePagination from "../../../hooks/usePagination";
import RegisterButton from "../../../components/common/RegisterButton";
import SearchBar from "../../../components/common/SearchBar";
import CommonModal from "../../../components/common/CommonModal";
import { getDepartmentList, registerDepartment, updateDepartment, deleteDepartment } from "../../../api/hr/departmentApi";
import DepartmentForm from "../../../components/form/DepartmentForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin } from "lucide-react";

const DepartmentPage = () => {
  const [departmentList, setDepartmentList]         = useState([]);
  const PAGE_SIZE = 12;
  const [deptPage, setDeptPage] = useState(0);
  const [originalDepartmentList, setOriginalDepartmentList] = useState([]);
  const [open, setOpen]                             = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchKeyword, setSearchKeyword]           = useState("");

  useEffect(() => { loadDepartmentList(); }, []);

  const loadDepartmentList = async () => {
    try {
      const data = await getDepartmentList();
      const list = Array.isArray(data) ? data : [];
      setDepartmentList(list);
      setOriginalDepartmentList(list);
    } catch (err) { console.error("부서 목록 조회 실패", err); setDepartmentList([]); }
  };

  const handleOpen  = () => { setSelectedDepartment(null); setOpen(true); };
  const handleClose = () => { setOpen(false); setSelectedDepartment(null); };
  const handleEdit  = (dept) => { setSelectedDepartment(dept); setOpen(true); };

  const handleSubmit = async (data) => {
    try {
      if (selectedDepartment) await updateDepartment(data);
      else                    await registerDepartment(data);
      await loadDepartmentList();
      handleClose();
    } catch (err) { console.error("부서 저장 실패", err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try { await deleteDepartment(id); await loadDepartmentList(); }
    catch (err) { console.error("부서 삭제 실패", err); }
  };

  const handleSearch = () => {
    const kw = searchKeyword.replace(/\s/g,"").toLowerCase();
    if (!kw) { setDepartmentList(originalDepartmentList); return; }
    const matched = originalDepartmentList.filter(i =>
      (i.departmentName||"").replace(/\s/g,"").toLowerCase().includes(kw)
    );
    if (matched.length === 0) { alert("검색 결과가 없습니다"); setDepartmentList([]); return; }
    setDepartmentList(matched); setDeptPage(0);
  };

  const handleResetSearch = () => { setSearchKeyword(""); setDepartmentList(originalDepartmentList); setDeptPage(0); };

  const allActive    = departmentList.filter(d => d.status !== "N");
  const allInactive  = departmentList.filter(d => d.status === "N");
  const totalDeptPages = Math.max(1, Math.ceil(departmentList.length / PAGE_SIZE));
  const pagedDepts = departmentList.slice(deptPage * PAGE_SIZE, (deptPage + 1) * PAGE_SIZE);
  const activeList   = pagedDepts.filter(d => d.status !== "N");
  const inactiveList = pagedDepts.filter(d => d.status === "N");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-zinc-900">부서 관리</h2>
          <span className="text-sm text-zinc-400 font-normal">
            총 {departmentList.length}개
          </span>
        </div>
        <RegisterButton onClick={handleOpen} />
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2">
        <SearchBar value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)}
          onSearch={handleSearch} placeholder="부서명을 입력하세요" />
        <Button variant="outline" className="cursor-pointer" onClick={handleResetSearch}>전체보기</Button>
      </div>

      {/* 사용 중인 부서 */}
      {activeList.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">사용 중 ({activeList.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeList.map(dept => (
              <div key={dept.departmentId}
                className="bg-white rounded-xl border border-zinc-200 p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 size={15} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{dept.departmentName}</p>
                      {dept.location && (
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {dept.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">사용</Badge>
                </div>
                <div className="flex justify-end gap-1.5 pt-2 border-t border-zinc-100">
                  <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer"
                    onClick={() => handleEdit(dept)}>수정</Button>
                  <Button size="sm" className="h-7 text-xs cursor-pointer bg-red-500 hover:bg-red-600"
                    onClick={() => handleDelete(dept.departmentId)}>삭제</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 비활성 부서 */}
      {inactiveList.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">비활성 ({inactiveList.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inactiveList.map(dept => (
              <div key={dept.departmentId}
                className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 flex flex-col gap-3 opacity-60">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                      <Building2 size={15} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-500 line-through">{dept.departmentName}</p>
                      {dept.location && (
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {dept.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-zinc-100 text-zinc-400 hover:bg-zinc-100 text-[10px]">비활성</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {departmentList.length === 0 && (
        <div className="text-center py-16 text-sm text-zinc-400">부서가 없습니다.</div>
      )}

      {/* 페이지네이션 */}
      {totalDeptPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setDeptPage(p => p - 1)} disabled={deptPage === 0}
            className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">이전</button>
          <span className="text-sm text-zinc-500">{deptPage + 1} / {totalDeptPages}</span>
          <button onClick={() => setDeptPage(p => p + 1)} disabled={deptPage >= totalDeptPages - 1}
            className="px-4 h-8 text-sm rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">다음</button>
        </div>
      )}

      <CommonModal open={open} onClose={handleClose} title={selectedDepartment ? "부서 수정" : "부서 등록"}>
        <DepartmentForm onSubmit={handleSubmit} onClose={handleClose} initialData={selectedDepartment} />
      </CommonModal>
    </div>
  );
};

export default DepartmentPage;
