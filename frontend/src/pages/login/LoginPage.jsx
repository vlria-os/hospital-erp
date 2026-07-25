import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { loginPost } from "../../api/userApi";
import { loginSuccess } from "../../store/authSlice";
import { socialUserLogin } from "../../api/socialLoginApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const NAVER_API_URL    = import.meta.env.VITE_NAVER_LOGIN_API_URL;
export const KAKAO_CLIENT_ID  = import.meta.env.VITE_KAKAO_CLIENT_ID;
export const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

const LoginPage = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [searchParams]          = useSearchParams();
  const [called, setCalled]     = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const naverMutation = useMutation({
    mutationFn: socialUserLogin,
    onSuccess: (result) => { dispatch(loginSuccess(result)); navigate("/", { replace: true }); },
    onError: () => setError("네이버 로그인에 실패했습니다."),
  });

  const kakaoMutation = useMutation({
    mutationFn: socialUserLogin,
    onSuccess: (result) => { 
      dispatch(loginSuccess(result)); 
      navigate("/", { replace: true }); 
    },
    onError: () => setError("카카오 로그인에 실패했습니다."),
  });

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (!called && mode === "naverLogin")  { setCalled(true); naverMutation.mutate(); }
    if (!called && mode === "kakaoLogin")  { setCalled(true); kakaoMutation.mutate(); }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await loginPost({ email, password });
      dispatch(loginSuccess(data));
      navigate("/", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === "SOCIAL_LOGIN_ONLY") {
        const names = (data.providers || []).map((p) =>
          p === "NAVER" ? "네이버" : p === "KAKAO" ? "카카오" : p
        );
        setError(`소셜 로그인 전용 계정입니다. ${names.join(", ")} 로그인을 이용해 주세요.`);
      } else {
        setError("이메일 또는 비밀번호를 확인해 주세요.");
      }
    }
  };

  const handleNaverLogin = () => { window.location.href = NAVER_API_URL; };
  const handleKakaoLogin = () => {
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center leading-none mb-3">
            <span className="text-3xl font-black text-blue-600 tracking-tight">HUH</span>
            <span className="text-xs font-medium text-zinc-400 tracking-wide mt-0.5">Hansol University Hospital</span>
          </Link>
          <p className="text-sm text-zinc-500">계정으로 로그인하세요</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 space-y-5">

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full cursor-pointer">
              로그인
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-100" />
            <span className="text-xs text-zinc-400">또는</span>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          {/* Social */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleNaverLogin}
              className="w-full h-10 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#03C75A" }}
            >
              <span className="font-bold text-base leading-none">N</span>
              네이버로 로그인
            </button>

            <button
              type="button"
              onClick={handleKakaoLogin}
              className="w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#FEE500", color: "#191919" }}
            >
              <span className="font-bold text-base leading-none">K</span>
              카카오로 로그인
            </button>
          </div>
        </div>

        {/* Join */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          아직 계정이 없으신가요?{" "}
          <button
            type="button"
            onClick={() => navigate("/join")}
            className="text-blue-600 font-medium hover:underline cursor-pointer"
          >
            회원가입
          </button>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
