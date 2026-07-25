import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { updateToken, logout } from "../../store/authSlice";
import { EventSourcePolyfill } from "event-source-polyfill";
import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_SPRING_API_BASE_URL;
const SSE_URL = "/api/sse/subscribe";
const REFRESH_URL = `${API_BASE_URL}/api/jwt/token/refresh`;

const SseProvider = ({ userId, onMessage }) => {
  const dispatch = useDispatch();
  const eventSourceRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const reconnectTimerRef = useRef(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    console.log("userId 확인:", userId);
    if (!userId) return;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const closeExistingConnection = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const connect = () => {
      if (unmountedRef.current) return;

      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        console.log("❌ accessToken 없음 - SSE 연결 중단");
        return;
      }

      console.log("🔌 SSE 연결 시도");

      closeExistingConnection();

      const es = new EventSourcePolyfill(`${API_BASE_URL}${SSE_URL}/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        // refresh API는 쿠키 기반이라 여기 옵션이 꼭 필요하진 않지만,
        // 서버/CORS 설정에 따라 같이 두는 편이 안전할 수 있음
        withCredentials: true,
        heartbeatTimeout: 60 * 1000,
      });

      eventSourceRef.current = es;

      es.onopen = () => {
        console.log("✅ SSE 연결 성공");
      };

      es.addEventListener("newReservation", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("🔥 새 예약:", data);
          onMessage?.(data);
        } catch (err) {
          console.log("newReservation 파싱 실패", err);
        }
      });

      //스케줄 알림
      es.addEventListener("scheduleConfirmed", (event)=>{
        console.log("📅 스케줄 확정 알림:", event.data);
        onMessage?.({type:"scheduleConfirmed", message: event.data});
      });

      // 서버가 일반 message 이벤트로 보낼 수도 있어서 보조로 둠
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 기본 메시지 수신:", data);
        } catch {
          // 텍스트 heartbeat 등은 조용히 무시
        }
      };

      es.onerror = async (error) => {
        console.log("❌ SSE 에러 발생", error);

        closeExistingConnection();

        if (unmountedRef.current) return;
        if (isRefreshingRef.current) return;

        isRefreshingRef.current = true;

        try {
          const accessToken = sessionStorage.getItem("accessToken");

          // refreshToken은 쿠키에만 있고,
          // withCredentials: true 로 쿠키를 같이 보냄
          const res = await axios.post(
            REFRESH_URL,
            {},
            {
              withCredentials: true,
              headers: {
                Authorization : `Bearer ${accessToken}`
              }
            }
          );

          const newAccessToken = res?.data?.accessToken;

          if (!newAccessToken) {
            throw new Error("재발급 응답에 accessToken 없음");
          }

          sessionStorage.setItem("accessToken", newAccessToken);

          dispatch(
            updateToken({
              accessToken: newAccessToken,
            })
          );

          console.log("✅ accessToken 재발급 성공");

          clearReconnectTimer();
          reconnectTimerRef.current = setTimeout(() => {
            isRefreshingRef.current = false;
            connect();
          }, 500);
        } catch (refreshError) {
          console.log("❌ 토큰 재발급 실패", refreshError);

          sessionStorage.removeItem("accessToken");
          clearReconnectTimer();
          dispatch(logout?.());
        } finally {
          if (reconnectTimerRef.current === null) {
            isRefreshingRef.current = false;
          }
        }
      };
    };

    connect();

    return () => {
      unmountedRef.current = true;
      clearReconnectTimer();
      closeExistingConnection();
      isRefreshingRef.current = false;
    };
  }, [userId, dispatch, onMessage]);

  return null;
};

export default SseProvider;