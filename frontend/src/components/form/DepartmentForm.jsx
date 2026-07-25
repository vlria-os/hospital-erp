import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initState = { departmentId: "", departmentName: "", location: "", status: "Y" };

const selectClass = "w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const DepartmentForm = ({ onSubmit, onClose, initialData }) => {
  const [form, setForm] = useState(initState);

  useEffect(() => {
    setForm(initialData ? {
      departmentId:   initialData.departmentId || "",
      departmentName: initialData.departmentName || "",
      location:       initialData.location || "",
      status:         initialData.status || "Y",
    } : initState);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.departmentName.trim()) { alert("부서명을 입력해주세요"); return; }
    onSubmit({
      departmentId:   form.departmentId ? Number(form.departmentId) : null,
      departmentName: form.departmentName,
      location:       form.location,
      status:         form.status,
    });
    setForm(initState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-base font-semibold text-zinc-900">
        {initialData ? "부서 수정" : "부서 등록"}
      </p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>부서명 <span className="text-red-500">*</span></Label>
          <Input type="text" name="departmentName" placeholder="예) 내과, 외과, 신경외과"
            value={form.departmentName} onChange={handleChange} />
        </div>

        <div className="space-y-1.5">
          <Label>위치</Label>
          <Input type="text" name="location" placeholder="예) 본관 2층"
            value={form.location} onChange={handleChange} />
        </div>

        <div className="space-y-1.5">
          <Label>상태</Label>
          <select name="status" value={form.status} onChange={handleChange} className={selectClass}>
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
  );
};

export default DepartmentForm;
