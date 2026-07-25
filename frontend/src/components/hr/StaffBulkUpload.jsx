import React, { useRef, useState } from 'react'
import jwtAxios from '../../api/jwtAxios';
import * as XLSX from 'xlsx';
import CommonModal from '../common/CommonModal';
import './StaffBulkUpload.css';

function validateRow(row, validDeptNames = []) {
  const errors = [];
  if(!row.email) errors.push("이메일 누락");
  if(!row.password) errors.push("비밀번호 누락");
  if(!row.name) errors.push("이름 누락");
  if(!row.dept_name) errors.push("부서명 누락");
  else if(validDeptNames.length > 0 && !validDeptNames.includes(row.dept_name))
    errors.push(`존재하지 않는 부서명: "${row.dept_name}"`);
  if(!row.role_id || isNaN(Number(row.role_id))) errors.push("roleId 누락 또는 숫자 아님");
  if(!["Y", "N"].includes((row.is_active||"").toUpperCase())){
    errors.push("활성여부 Y 또는 N");
  }
  return errors;
}

const StaffBulkUpload = ({open, onClose, onSuccess, departmentList = [], roleList = []}) => {
  const validDeptNames = departmentList.map(d => d.departmentName);
  const [step, setStep] = useState("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  const parseExcel = (file) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload=(e)=> {
      try {
        const wb = XLSX.read(e.target.result,{type:"array"});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, {defval:""});

        if (data.length === 0) {
          alert("파일에 데이터가 없거나 컬럼명이 템플릿과 다릅니다.\n템플릿을 다운로드해서 사용해주세요.");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        const mapped = data.map((raw)=>{
          const row ={
            email     : String(raw["email"] || "").trim(),
            password  : String(raw["password"] || "").trim(),
            name      : String(raw["이름"] || "").trim(),
            dept_name : String(raw["부서명"] || "").trim(),
            role_id   : String(raw["roleId"] || "").trim(),
            phone     : String(raw["전화번호"] || "").trim(),
            address   : String(raw["주소"] || "").trim(),
            manager_id: String(raw["담당자 email"] || "").trim() || null,
            is_active : String(raw["활성여부(Y/N)"] || "").trim().toUpperCase(),
          };
          row._errors = validateRow(row, validDeptNames);
          return row;
        });
        setRows(mapped);
        setStep("preview");
      } catch (err) {
        alert("파일을 읽는 중 오류가 발생했습니다. xlsx 또는 xls 파일인지 확인해주세요.");
        console.error(err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      alert("파일을 읽을 수 없습니다.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if(file) parseExcel(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if(file) parseExcel(file);
  };

  const downloadTemplete = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["email","password","이름","부서명","roleId","전화번호","주소","담당자 email","활성여부(Y/N)"],
      ["hong@hospital.com","password123","홍길동","내과","1","010-0000-0000","서울시 강남구","","Y"],
    ]);
    ws["!cols"] = [24,14,10,10,8,14,20,24,12].map((w) => ({wch:w}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"직원등록");
    XLSX.writeFile(wb,"직원_일괄등록_템플릿.xlsx");
  };

  const handleSubmit = async() => {
    setLoading(true);
    try{
      const validRows = rows.filter((r)=> r._errors.length === 0)
      .map(({ _errors, email, password, name, dept_name, role_id, phone, address, manager_id, is_active }) => ({
        email,
        password,
        name,
        deptName: dept_name,
        roleIds: [Number(role_id)],
        phone,
        address,
        managerId: manager_id || null,
        isActive: is_active,
      }));

      console.log("bulk-upload 전송 데이터:", JSON.stringify(validRows, null, 2));
      const res = await jwtAxios.post("/api/staff/bulk-upload", validRows);
      setResult(res.data);
      setStep("result");

      if (onSuccess) onSuccess();
    }catch(err){
      const msg = err?.response?.data?.message || err?.response?.data || "등록 중 오류가 발생했습니다.";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
      if (onSuccess) onSuccess();
    }finally{
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setRows([]);
    setFileName("");
    setResult(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const errorCount = rows.filter((r)=>r._errors.length > 0).length;
  const okCount = rows.length - errorCount;

  return (
    <CommonModal open={open} onClose={handleClose} title="직원 일괄등록" contentClass="max-w-4xl sm:max-w-4xl">
    <div className='bulk-upload'>

      {/* 업로드 */}
      {step == "upload" && (
        <div className='bulk-upload_body'>
          <div
          className={`bulk-upload__dropzone${dragging ? " bulk-upload__dropzone--dragging" : ""}`}
          onDragOver={(e) => {e.preventDefault(); setDragging(true);}}
          onDragLeave={()=> setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}>
            <span className="bulk-upload__dropzone-icon">📂</span>
            <p>엑셀 파일을 클릭하거나 드래그하여 업로드</p>
            <span className='bulk-upload_dropzone-sub'>.xlsx, xls 지원</span>
          </div>

          <input
          ref={fileInputRef}
          type='file'
          accept='.xlsx,.xls'
          style={{display:"none"}}
          onChange={handleFileChange}/>

          <button className="btn btn--outline" onClick={downloadTemplete}>
            📥 템플릿 다운로드
          </button>

          {validDeptNames.length > 0 && (
            <div style={{marginTop:'12px', fontSize:'12px', color:'#64748b', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'10px 14px'}}>
              <strong style={{display:'block', marginBottom:'6px', color:'#334155'}}>사용 가능한 부서명</strong>
              <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                {validDeptNames.map(name => (
                  <span key={name} style={{background:'#e2e8f0', borderRadius:'4px', padding:'2px 8px'}}>{name}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 미리보기 */}
      {step == "preview" && (
        <div className="bulk-upload__body">
            <p className="bulk-upload__filename">{fileName}</p>

            <div className="bulk-upload__stats">
              <div className="stat-card">
                <span className="stat-card__label">전체</span>
                <span className="stat-card__value">{rows.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">정상</span>
                <span className="stat-card__value stat-card__value--green">{okCount}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">오류</span>
                <span className="stat-card__value stat-card__value--red">{errorCount}</span>
              </div>
            </div>

            {errorCount > 0 && (
              <div className="bulk-upload__warning">
                ⚠️ {errorCount}개 행에 오류가 있습니다. 오류 행은 제외하고 등록됩니다.
              </div>
            )}
            <div className="bulk-upload__table-wrap">
              <table className="bulk-upload__table">
                <thead>
                  <tr>
                    <th>행</th>
                    <th>email</th>
                    <th>이름</th>
                    <th>부서명</th>
                    <th>roleId</th>
                    <th>전화번호</th>
                    <th>주소</th>
                    <th>담당자 email</th>
                    <th>활성여부</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={row._errors.length > 0 ? "row--error" : ""}
                      title={row._errors.join(", ")}
                    >
                      <td>{i + 1}</td>
                      <td>{row.email      || "-"}</td>
                      <td>{row.name       || "-"}</td>
                      <td>{row.dept_name  || "-"}</td>
                      <td>{row.role_id    || "-"}</td>
                      <td>{row.phone      || "-"}</td>
                      <td className="td--ellipsis">{row.address || "-"}</td>
                      <td>{row.manager_id || "-"}</td>
                      <td>
                        <span className={`badge ${row.is_active === "Y" ? "badge--green" : "badge--red"}`}>
                          {row.is_active === "Y" ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td>
                        {row._errors.length > 0 ? (
                          <span className="badge badge--amber" title={row._errors.join(", ")}>오류</span>
                        ) : (
                          <span className="badge badge--green">정상</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bulk-upload__footer">
            <button className="btn btn--outline" onClick={() => setStep("upload")}>
              다시 선택
            </button>
              <button
               className="btn btn--primary"
               onClick={handleSubmit}
               disabled={loading || okCount === 0}
              >
                {loading ? "등록 중..." : `${okCount}건 등록하기`}
              </button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="bulk-upload__body">
            <div className="bulk-upload__stats">
              <div className="stat-card">
                <span className="stat-card__label">전체</span>
                <span className="stat-card__value">{result.successCount + result.failCount}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">성공</span>
                <span className="stat-card__value stat-card__value--green">{result.successCount}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">실패</span>
                <span className="stat-card__value stat-card__value--red">{result.failCount}</span>
              </div>
            </div>

            {result.failCount > 0 && (
              <>
                <p className="bulk-upload__section-label">실패 목록</p>
                <div className="bulk-upload__table-wrap">
                  <table className="bulk-upload__table">
                    <thead>
                      <tr>
                        <th>행</th>
                        <th>email</th>
                        <th>이름</th>
                        <th>사유</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.failDetails.map((f, i) => (
                        <tr key={i}>
                          <td>{f.row}</td>
                          <td>{f.email}</td>
                          <td>{f.name}</td>
                          <td className="td--error">{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="bulk-upload__footer">
              <button className="btn btn--primary" onClick={handleClose}>닫기</button>
            </div>
          </div>
        )}

      </div>
    </CommonModal>
  );
};

export default StaffBulkUpload;
