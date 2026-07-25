import { useState, useCallback } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useSelector, useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SseProvider from "@/components/common/SseProvider";
import { logout } from "@/store/authSlice";
import jwtAxios from "@/api/jwtAxios";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Calendar, Megaphone, CalendarCheck, ClipboardList, Stethoscope,
  UserCheck, Receipt, Users, UserCog, Building2, CalendarRange,
  Scissors, Settings, Settings2, LayoutList, Shield, KeyRound,
  MessageSquare, Bot, ChevronLeft, ChevronRight, ChevronDown, LogOut, User,
} from "lucide-react";

const DOCTORS = ["DOCTOR", "RESIDENT", "FELLOW", "PROFESSOR"];
const NURSES  = ["NURSE", "HEAD_NURSE"];
const ADMIN   = ["ADMIN"];
const MEDICAL = [...DOCTORS, ...NURSES];

const MENU = [
  { path: "/my-schedule",      label: "내 스케줄",  icon: Calendar,      roles: MEDICAL },
  { path: "/communication",    label: "공지사항",   icon: Megaphone },
  { path: "/medical",          label: "진료 관리",  icon: Stethoscope,   roles: DOCTORS },
  { path: "/reservationconfirm", label: "예약 확인", icon: ClipboardList, roles: [...DOCTORS, ...NURSES, ...ADMIN] },
  { path: "/reception",        label: "접수",       icon: UserCheck,     roles: [...DOCTORS, ...ADMIN] },
  { path: "/billing",          label: "수납",       icon: Receipt,       roles: ADMIN },
  {
    label: "인사관리", icon: Users,
    children: [
      { path: "/staff",          label: "직원관리",   icon: UserCog,      roles: ADMIN },
      { path: "/department",     label: "부서관리",   icon: Building2,    roles: ADMIN },
      { path: "/staff_schedule", label: "근무스케줄", icon: CalendarRange, roles: ["HEAD_NURSE", "PROFESSOR", "ADMIN", "MANAGER"] },
      { path: "/surgery",        label: "수술스케줄", icon: Scissors,     roles: ["HEAD_NURSE", "PROFESSOR"] },
    ],
  },
  {
    label: "운영관리", icon: Settings,
    children: [
      { path: "/operation/schedule_policy",      label: "스케줄 설정", icon: Settings2,  roles: ["ADMIN"] },
      { path: "/operation/dept_schedule_policy", label: "부서별 정책", icon: LayoutList, roles: ["ADMIN"] },
    ],
  },
  { path: "/chat",            label: "채팅",    icon: MessageSquare, roles: ["ADMIN", "DOCTOR", "NURSE", "MANAGER", "STAFF"] },
  { path: "/inquiry/chatbot",         label: "챗봇 관리", icon: Bot,          roles: ADMIN },
];

const StaffLayout = () => {
  const [collapsed, setCollapsed]   = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const { userId, name: userName }  = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  let roles = [];
  try {
    const token = sessionStorage.getItem("accessToken");
    if (token) roles = jwtDecode(token).roles || [];
  } catch {}

  const hasAccess = (itemRoles) => !itemRoles || itemRoles.some((r) => roles.includes(r));
  const toggleGroup = (label) => setOpenGroups((p) => ({ ...p, [label]: !p[label] }));

  const handleLogout = async () => {
    try { await jwtAxios.post("/logout"); } catch {}
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleSse = useCallback((data) => {
    if (data.type === "scheduleConfirmed") {
      const msg = typeof data.message === "string" ? JSON.parse(data.message) : data.message;
      const dateText = msg.startDate && msg.endDate
        ? (msg.startDate === msg.endDate ? msg.startDate : `${msg.startDate} ~ ${msg.endDate}`)
        : msg.data;
      toast.info(`📅 ${dateText} ${msg.message}`, { autoClose: 5000 });
      return;
    }
    toast(
      <div className="whitespace-pre-line text-sm">
        🩺 새 예약{"\n"}예약 번호: {data.reservationId}{"\n"}환자: {data.patientName}{"\n"}날짜: {data.reservationDate}
      </div>
    );
  }, []);

  const linkClass = ({ isActive }) =>
    cn(
      "flex items-center rounded-lg transition-colors text-sm",
      collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2",
      isActive ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
    );

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink to={item.path} className={linkClass}>
              <Icon size={18} />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return (
      <NavLink to={item.path} className={linkClass}>
        <Icon size={16} />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const renderMenu = () =>
    MENU.flatMap((item) => {
      if (item.children) {
        const children = item.children.filter((c) => hasAccess(c.roles));
        if (children.length === 0) return [];

        if (collapsed) return children.map((c) => <NavItem key={c.path} item={c} />);

        const isOpen  = openGroups[item.label] !== false;
        const GIcon   = item.icon;
        return [
          <div key={item.label}>
            <button
              onClick={() => toggleGroup(item.label)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider rounded-lg hover:text-zinc-300 transition-colors"
            >
              <span className="flex items-center gap-3">
                <GIcon size={15} />
                {item.label}
              </span>
              <ChevronDown size={12} className={cn("transition-transform duration-150", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="mt-1 ml-3 space-y-1 border-l border-zinc-800 pl-3">
                {children.map((c) => <NavItem key={c.path} item={c} />)}
              </div>
            )}
          </div>,
        ];
      }
      if (!hasAccess(item.roles)) return [];
      return [<NavItem key={item.path} item={item} />];
    });

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-zinc-50 overflow-hidden">
        {userId && <SseProvider userId={userId} onMessage={handleSse} />}

        {/* Sidebar */}
        <aside className={cn(
          "flex flex-col bg-zinc-900 shrink-0 transition-all duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60"
        )}>
          {/* Header */}
          <div className={cn(
            "flex items-center h-14 border-b border-zinc-800 px-3",
            collapsed ? "justify-center" : "justify-between"
          )}>
            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-white font-black text-base tracking-tight">HUH</span>
                <span className="text-zinc-400 text-[9px] font-medium tracking-wide">Hansol University Hospital</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
            {renderMenu()}
          </nav>

          {/* Footer */}
          <div className={cn("p-3 border-t border-zinc-800", collapsed && "flex justify-center")}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">로그아웃</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                    <User size={14} className="text-zinc-300" />
                  </div>
                  <span className="text-sm text-zinc-300 truncate">{userName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto py-6">
          <Outlet />
        </main>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover />
    </TooltipProvider>
  );
};

export default StaffLayout;
