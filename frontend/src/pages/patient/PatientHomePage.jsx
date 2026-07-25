import { useNavigate } from "react-router-dom";
import hospitalImg from "../../assets/hosp.PNG";
import { useSelector } from "react-redux";
import { CalendarCheck, Bot, Megaphone, ArrowRight } from "lucide-react";

const FEATURE_CARDS = [
  {
    path: "/reservation",
    icon: CalendarCheck,
    title: "진료 예약",
    subtitle: "Appointment",
    description: "원하는 진료과와 의사를\n선택해 간편하게 예약하세요.",
    bg: "rgba(29, 78, 216, 0.93)",
    isReservation: true,
    delay: 0,
  },
  {
    path: "/inquiry/chatbot",
    icon: Bot,
    title: "AI 문의",
    subtitle: "AI Chatbot",
    description: "궁금한 점을 AI 챗봇에게\n언제든지 물어보세요.",
    bg: "rgba(109, 40, 217, 0.93)",
    isReservation: false,
    delay: 130,
  },
  {
    path: "/communication",
    icon: Megaphone,
    title: "공지사항",
    subtitle: "Notice",
    description: "병원 공지 및 이벤트 소식을\n빠르게 확인하세요.",
    bg: "rgba(180, 83, 9, 0.93)",
    isReservation: false,
    delay: 260,
  },
];

const PatientHomePage = () => {
  const navigate = useNavigate();
  const { name, userId, roles } = useSelector((s) => s.auth);

  const handleCardClick = (card) => {
    if (card.isReservation) {
      if (!userId) { navigate("/login"); return; }
      if (!Array.isArray(roles) || !roles.includes("PATIENT")) {
        alert("환자 계정으로만 진료를 예약할 수 있습니다.");
        return;
      }
    }
    navigate(card.path);
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(80px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-card {
          opacity: 0;
          animation: slideUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transition: filter 0.2s ease, transform 0.2s ease;
        }
      `}</style>

      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url(${hospitalImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          backgroundRepeat: "no-repeat",
          height: "calc(100vh - 56px)",
        }}
      >
          {/* 인사말 + 헤드라인 */}
          <div className="relative z-10 px-16 pt-14 text-white">
            <p className="text-blue-200 text-sm font-semibold mb-4">
              {name ? `${name} 님, 안녕하세요.` : "안녕하세요."}
            </p>
            <h1 className="text-5xl font-black leading-tight mb-4">
              편리한 진료,<br />스마트한 건강 관리
            </h1>
            <p className="text-white/75 text-base leading-relaxed">
              진료 예약부터 AI 의료 문의, 공지 확인까지<br />
              필요한 서비스를 한 곳에서 이용하세요.
            </p>
          </div>

          {/* 카드 3개 — 바닥에서 위로 띄움 */}
          <div className="absolute bottom-28 left-0 right-0 z-20 flex justify-center gap-5 px-10">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.path}
                  className="hero-card cursor-pointer group flex flex-col justify-between"
                  style={{
                    background: card.bg,
                    flex: "1 1 0",
                    maxWidth: "290px",
                    minHeight: "260px",
                    padding: "28px",
                    animationDelay: `${card.delay}ms`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = "brightness(1.13)";
                    e.currentTarget.style.transform = "translateY(-6px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "";
                    e.currentTarget.style.transform = "";
                  }}
                  onClick={() => handleCardClick(card)}
                >
                  <div>
                    <p className="text-white/50 text-xs font-semibold mb-2 tracking-widest uppercase">
                      {card.subtitle}
                    </p>
                    <h2 className="text-white text-2xl font-bold mb-3">{card.title}</h2>
                    <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                      {card.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-white/65 text-sm mt-6 group-hover:text-white group-hover:gap-3 transition-all duration-200">
                    바로가기 <ArrowRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </>
  );
};

export default PatientHomePage;
