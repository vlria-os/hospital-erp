import { Outlet, NavLink, useNavigate, useLocation, replace } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logout } from "@/store/authSlice";
import jwtAxios from "@/api/jwtAxios";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Phone, MapPin } from "lucide-react";

const FOOTER_INFO = [
  { icon: Clock,  text: "평일 09:00 – 18:00 · 토요일 09:00 – 13:00" },
  { icon: Phone,  text: "02-1999-0920" },
  { icon: MapPin, text: "서울특별시 서초구 서초대로77길 41" },
];

const NAV = [
  { path: "/communication",    label: "공지사항" },
  { path: "/reservation",      label: "진료 예약" },
  { path: "/inquiry/chatbot",  label: "AI 문의" },
];

const PatientLayout = () => {
  const { userId, name, roles } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  const handleLogout = async () => {
    try { await jwtAxios.post("/logout"); } catch {}
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleReservationClick = (e) => {
    e.preventDefault();
    if (!userId) { navigate("/login"); return; }
    if (!Array.isArray(roles) || !roles.includes("PATIENT")) {
      alert("환자 계정으로만 진료를 예약할 수 있습니다.");
      return;
    }
    navigate("/reservation");
  };

  return (
    <div className="h-screen overflow-y-auto flex flex-col bg-zinc-50">
      {/* Top nav */}
      <header className="sticky top-0 z-50 shrink-0 bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <NavLink to="/" className="flex flex-col leading-none shrink-0">
            <span className="text-xl font-black text-blue-600 tracking-tight">HUH</span>
            <span className="text-[10px] font-medium text-zinc-400 tracking-wide">Hansol University Hospital</span>
          </NavLink>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={link.path === "/reservation" ? handleReservationClick : undefined}
                className={({ isActive }) =>
                  cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User / Auth */}
          <div className="flex items-center gap-3 shrink-0">
            {name && (
              <span
                className="text-sm text-zinc-500 hidden sm:block cursor-pointer hover:text-blue-600 hover:underline underline-offset-2 transition-colors"
                onClick={() => navigate("/patient/mypage", { replace: true })}
              >
                {name} 님
              </span>
            )}
            {userId ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className={isHome ? "flex-1 w-full overflow-hidden" : "flex-1 max-w-5xl w-full mx-auto px-4 py-8"}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap justify-center gap-x-8 gap-y-3">
          <span className="text-xs font-semibold text-zinc-700 mr-2">병원 안내</span>
          {FOOTER_INFO.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              <Icon size={12} className="text-zinc-400 shrink-0" />
              <span className="text-xs text-zinc-500">{text}</span>
            </div>
          ))}
        </div>
      </footer>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default PatientLayout;
