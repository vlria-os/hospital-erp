import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { emailCheck, join, rrnCheck } from "../../api/joinApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const heightOptions = [];
for (let i = 1400; i <= 2500; i++) heightOptions.push((i / 10).toFixed(1));
export const weightOptions = Array.from({ length: 241 }, (_, i) => (30 + i * 0.5).toFixed(1));

const JoinPage = () => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [checkedPwd, setCheckedPwd]     = useState("");
  const [name, setName]                 = useState("");
  const [rrn, setRrn]                   = useState("");
  const [phone, setPhone]               = useState("");
  const [address, setAddress]           = useState("");
  const [gender, setGender]             = useState("");
  const [bloodType, setBloodType]       = useState("");
  const [height, setHeight]             = useState("");
  const [weight, setWeight]             = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState("");
  const [rrnChecked, setRrnChecked]     = useState(false);
  const [rrnCheckResult, setRrnCheckResult]     = useState("");
  const [errors, setErrors]             = useState({});

  const navigate = useNavigate();

  const emailCheckMutation = useMutation({
    mutationFn: emailCheck,
    onSuccess: (result) => {
      if (result === "success") {
        setEmailCheckResult("사용 가능한 이메일입니다.");
        setEmailChecked(true);
      } else {
        setEmailCheckResult("이미 사용 중인 이메일입니다.");
        setEmailChecked(false);
      }
    },
    onError: () => { setEmailCheckResult("오류가 발생했습니다."); setEmailChecked(false); },
  });

  const handleEmailCheck = () => {
    if (!email) { setEmailCheckResult("이메일을 입력하세요."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailCheckResult("이메일 형식이 올바르지 않습니다."); return; }
    emailCheckMutation.mutate(email);
  };

  const rrnCheckMutation = useMutation({
    mutationFn: rrnCheck,
    onSuccess: (result) => {
      if (result === "REGISTERED_USER") {
        alert("이미 등록된 회원입니다. 기존 계정으로 로그인하세요."); navigate("/login", { replace: true });
      } else if (result === "SOCIAL_USER") {
        alert("소셜 로그인 정보가 존재합니다. 소셜 계정으로 로그인하세요."); navigate("/login", { replace: true });
      } else if (result === "UNREGISTERED_USER") {
        setRrnCheckResult("환자 정보가 존재합니다. 가입 후 자동으로 연동됩니다."); setRrnChecked(true);
      } else {
        setRrnCheckResult("가입 가능한 주민등록번호입니다."); setRrnChecked(true);
      }
    },
    onError: () => { setRrnCheckResult("오류가 발생했습니다."); setRrnChecked(false); },
  });

  const handleRrnCheck = () => {
    if (!rrn) { setRrnCheckResult("주민등록번호를 입력하세요."); return; }
    if (!/^\d{13}$/.test(rrn)) { setRrnCheckResult("주민등록번호 13자리를 입력하세요."); return; }
    rrnCheckMutation.mutate(rrn);
  };

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "이메일을 입력하세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "이메일 형식이 올바르지 않습니다.";
    if (!password) newErrors.password = "비밀번호를 입력하세요.";
    if (!checkedPwd) newErrors.checkedPwd = "비밀번호 확인을 입력하세요.";
    if (password && checkedPwd && password !== checkedPwd) newErrors.checkedPwdMatch = "비밀번호가 일치하지 않습니다.";
    if (!name) newErrors.name = "이름을 입력하세요.";
    if (!rrn) newErrors.rrn = "주민등록번호를 입력하세요.";
    else if (!/^\d{13}$/.test(rrn)) newErrors.rrn2 = "주민등록번호 13자리를 입력하세요.";
    if (!emailChecked) newErrors.emailChecked = "이메일 중복 여부를 확인하세요.";
    if (!rrnChecked) newErrors.rrnChecked = "주민등록번호를 조회하세요.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const joinMutation = useMutation({
    mutationFn: join,
    onSuccess: (result) => {
      if (result === "REGISTERED_USER") alert("회원 가입에 성공했습니다. 생성된 계정이 기존 환자 정보와 연동되었습니다.");
      else alert("회원 가입에 성공했습니다.");
      navigate("/login", { replace: true });
    },
    onError: () => alert("회원 가입에 실패했습니다. 다시 시도해 주세요."),
  });

  const handleJoin = () => {
    if (!validate()) return;
    joinMutation.mutate({ email, password, name, rrn, phone, address, gender, bloodType, height, weight });
  };

  const isPasswordMatched = checkedPwd !== "" && password === checkedPwd;

  const ErrorMsg = ({ msg }) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

  const CheckResult = ({ msg, ok }) =>
    msg ? (
      <p className={cn("text-xs mt-1", ok ? "text-blue-600" : "text-red-500")}>{msg}</p>
    ) : null;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Hospital ERP</h1>
          <p className="mt-1 text-sm text-zinc-500">환자 계정을 만들어 서비스를 이용하세요</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
          <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }} className="space-y-5">

            {/* 이메일 */}
            <div className="space-y-1.5">
              <Label>이메일</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailChecked(false);
                    setEmailCheckResult("");
                    setErrors((p) => ({ ...p, email: "", emailChecked: "" }));
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 cursor-pointer"
                  disabled={!email || emailChecked || emailCheckMutation.isPending}
                  onClick={handleEmailCheck}
                >
                  {emailCheckMutation.isPending ? "확인 중" : "중복 확인"}
                </Button>
              </div>
              <ErrorMsg msg={errors.email} />
              <ErrorMsg msg={errors.emailChecked} />
              <CheckResult msg={emailCheckResult} ok={emailChecked} />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1.5">
              <Label>비밀번호</Label>
              <Input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "", checkedPwdMatch: "" })); }}
              />
              <ErrorMsg msg={errors.password} />
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-1.5">
              <Label>비밀번호 확인</Label>
              <Input
                type="password"
                placeholder="비밀번호 재입력"
                value={checkedPwd}
                onChange={(e) => { setCheckedPwd(e.target.value); setErrors((p) => ({ ...p, checkedPwd: "", checkedPwdMatch: "" })); }}
              />
              <ErrorMsg msg={errors.checkedPwd} />
              <ErrorMsg msg={errors.checkedPwdMatch} />
              {checkedPwd && (
                <p className={cn("text-xs mt-1", isPasswordMatched ? "text-blue-600" : "text-red-500")}>
                  {isPasswordMatched ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                </p>
              )}
            </div>

            {/* 이름 */}
            <div className="space-y-1.5">
              <Label>이름</Label>
              <Input
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
              />
              <ErrorMsg msg={errors.name} />
            </div>

            {/* 주민등록번호 */}
            <div className="space-y-1.5">
              <Label>주민등록번호</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="숫자 13자리"
                  maxLength={13}
                  value={rrn}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setRrn(v);
                    setRrnChecked(false);
                    setRrnCheckResult("");
                    setErrors((p) => ({ ...p, rrn: "", rrn2: "", rrnChecked: "" }));
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 cursor-pointer"
                  disabled={!rrn || rrnChecked || rrnCheckMutation.isPending}
                  onClick={handleRrnCheck}
                >
                  {rrnCheckMutation.isPending ? "조회 중" : "조회"}
                </Button>
              </div>
              <ErrorMsg msg={errors.rrn} />
              <ErrorMsg msg={errors.rrn2} />
              <ErrorMsg msg={errors.rrnChecked} />
              <CheckResult msg={rrnCheckResult} ok={rrnChecked} />
            </div>

            {/* 2열 그리드 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 전화번호 */}
              <div className="space-y-1.5">
                <Label>전화번호</Label>
                <Input
                  type="text"
                  placeholder="숫자만 입력"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              {/* 성별 */}
              <div className="space-y-1.5">
                <Label>성별</Label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  <option value="F">여성</option>
                  <option value="M">남성</option>
                </select>
              </div>

              {/* 혈액형 */}
              <div className="space-y-1.5">
                <Label>혈액형</Label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  {["RH+ A","RH- A","RH+ B","RH- B","RH+ O","RH- O","RH+ AB","RH- AB"].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* 신장 */}
              <div className="space-y-1.5">
                <Label>신장 (cm)</Label>
                <select
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  {heightOptions.map((h) => <option key={h} value={h}>{h} cm</option>)}
                </select>
              </div>

              {/* 체중 */}
              <div className="space-y-1.5 col-span-2">
                <Label>체중 (kg)</Label>
                <select
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  {weightOptions.map((w) => <option key={w} value={w}>{w} kg</option>)}
                </select>
              </div>
            </div>

            {/* 주소 */}
            <div className="space-y-1.5">
              <Label>주소</Label>
              <Input
                type="text"
                placeholder="주소 입력"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? "처리 중..." : "회원가입"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-6">
          이미 계정이 있으신가요?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-blue-600 font-medium hover:underline cursor-pointer"
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  );
};

export default JoinPage;
