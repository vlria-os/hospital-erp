import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initState = {
  scheduleTypeId: "", typeCode: "", typeName: "",
  startTime: "", endTime: "", createdAt: "", isActive: true,
};

const selectClass = "w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50";

const SchedulePolicyForm = ({ onSubmit, onClose, initialData }) => {
  const [form, setForm] = useState(initState);

  useEffect(() => {
    setForm(initialData ? {
      scheduleTypeId: initialData.scheduleTypeId || "",
      typeCode:  initialData.typeCode  || "",
      typeName:  initialData.typeName  || "",
      startTime: initialData.startTime || "",
      endTime:   initialData.endTime   || "",
      createdAt: initialData.createdAt || "",
      isActive:  initialData.isActive !== null && initialData.isActive !== undefined ? initialData.isActive : true,
    } : initState);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") { setForm(p => ({ ...p, isActive: value === "true" })); return; }
    if (name === "typeCode")  { setForm(p => ({ ...p, typeCode: value.toUpperCase() })); return; }
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.typeCode.trim()) { alert("근무유형 코드를 입력하세요"); return; }
    if (!form.typeName.trim()) { alert("근무유형명을 입력하세요"); return; }
    onSubmit({
      scheduleTypeId: form.scheduleTypeId ? Number(form.scheduleTypeId) : null,
      typeCode: form.typeCode.trim(), typeName: form.typeName.trim(),
      startTime: form.startTime, endTime: form.endTime,
      createdAt: form.createdAt, isActive: form.isActive,
    });
    setForm(initState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-base font-semibold text-zinc-900">
        {initialData ? "근무유형 수정" : "근무유형 등록"}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>근무유형 코드 <span className="text-red-500">*</span></Label>
          <Input name="typeCode" placeholder="예: DAY, NIGHT, OFF"
            value={form.typeCode} onChange={handleChange} disabled={!!initialData} />
        </div>

        <div className="space-y-1.5">
          <Label>근무유형명 <span className="text-red-500">*</span></Label>
          <Input name="typeName" placeholder="예: 주간근무"
            value={form.typeName} onChange={handleChange} />
        </div>

        <div className="space-y-1.5">
          <Label>시작 시간</Label>
          <input type="time" name="startTime" value={form.startTime}
            onChange={handleChange} className={selectClass} />
        </div>

        <div className="space-y-1.5">
          <Label>종료 시간</Label>
          <input type="time" name="endTime" value={form.endTime}
            onChange={handleChange} className={selectClass} />
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label>상태</Label>
          <select name="isActive" value={String(form.isActive)} onChange={handleChange} className={selectClass}>
            <option value="true">사용</option>
            <option value="false">비활성</option>
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

export default SchedulePolicyForm;
