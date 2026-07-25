import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";

import StaffLayout from "../layout/StaffLayout";
import PatientLayout from "../layout/PatientLayout";

import LoginPage from "../pages/login/LoginPage";
import JoinPage from "../pages/join/JoinPage";
import NaverJoin from "../pages/login/social/NaverJoin";
import KakaoJoin from "../pages/login/social/KakaoJoin";

import PatientHomePage from "../pages/patient/PatientHomePage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import CommunicationPage from "../pages/communication/CommunicationPage";
import ReservationPage from "../pages/reservation/ReservationPage";
import ReservationConfirm from "../pages/reservation/ReservationConfirm";
import InquiryChatBotPage from "../pages/InquiryChatbot/InquiryChatBotPage";
import MedicalRecordPage from "../pages/medical/MedicalRecordPage";
import ReceptionPage from "../pages/reception/ReceptionPage";
import SurgerySchedulePage from "../pages/surgery/SurgerySchedulePage";
import BillingLayout from "../pages/billing/BillingLayout";
import StaffPage from "../pages/hr/staff/StaffPage";
import DepartmentPage from "../pages/hr/department/DepartmentPage";
import StaffSchedulePage from "../pages/hr/staff/StaffSchedulePage";
import MySchedulePage from "../pages/hr/staff/MySchedulePage";
import Schedule_policyPage from "../pages/operation/Schedule_PolicyPage";
import DepartmentSchedulePolicyPage from "../pages/operation/DepartmentSchedulePolicyPage";
import AdminPage from "../pages/admin/AdminPage";
import NotificationPage from "../pages/notification/NotificationPage";
import ChatLayout from "../pages/chat/Layout/ChatLayout";
import MyPageLayout from "@/pages/patient/myPage/MyPageLayout";
import MyInformatinPage from "@/pages/patient/myPage/MyInformatinPage";

const DOCTORS = ["INTERN", "RESIDENT", "FELLOW", "SPECIALIST", "PROFESSOR", "HEAD_DOCTOR"];
const NURSES = ["NURSE", "CHARGE_NURSE", "HEAD_NURSE", "DIRECTOR_NURSE"];
const ADMIN_STAFF = ["STAFF", "MANAGER", "ADMIN"];

const routeRoles = {
  "/dashboard":     null,
  "/my-schedule":   [...DOCTORS, "DOCTOR", ...NURSES, "NURSE"],
  "/medical":       [...DOCTORS],
  "/reception":     [...DOCTORS, ...ADMIN_STAFF],
  "/patient":       [...DOCTORS, ...NURSES, ...ADMIN_STAFF],
  "/surgery":       ["HEAD_NURSE", "PROFESSOR"],
  "/billing":       [...ADMIN_STAFF],
  "/chat":          ["ADMIN", "DOCTOR", "NURSE", "MANAGER", "STAFF"],
  "/staff":         [...ADMIN_STAFF],
  "/department":    [...ADMIN_STAFF],
  "/staff_schedule":["HEAD_NURSE", "PROFESSOR", "ADMIN", "MANAGER"],
  "/operation/schedule_policy":      ["ADMIN"],
  "/operation/dept_schedule_policy": ["ADMIN"],
  "/admin":         ["ADMIN"],
  "/notification":  null,
  "/patient/mypage": ["PATIENT"],
  "/patient/mypage/information": ["PATIENT"],
  "/reservationconfirm": [...DOCTORS, "DOCTOR", ...NURSES, "NURSE", ...ADMIN_STAFF]
  // 아래는 비로그인도 접근 가능 (routeRoles에 없으면 PatientLayout에서 처리)
};

// Staff 전용 페이지 권한 체크
const StaffRoute = ({ children, allowedRoles }) => {
  const token = sessionStorage.getItem("accessToken");

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    try {
      const decoded = jwtDecode(token);
      const roles = decoded.roles || [];
      if (!allowedRoles.some(role => roles.includes(role))) {
        return <Navigate to="/" replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

const RoleBasedHome = () => {
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    try {
      const { roles = [] } = jwtDecode(token);
      if (roles.includes("ADMIN")) return <Navigate to="/communication" replace />;
      if (roles.length > 0 && !roles.every((r) => r === "PATIENT")) return <Navigate to="/my-schedule" replace />;
    } catch {}
  }
  return <PatientHomePage />;
};

const LayoutWrapper = () => {
  const { roles } = useSelector((s) => s.auth);
  const token = sessionStorage.getItem("accessToken");

  const isStaff =
    token &&
    Array.isArray(roles) &&
    roles.some((r) => r !== "PATIENT");

  return isStaff ? <StaffLayout /> : <PatientLayout />;
};

const Router = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/social/login/naver" element={<NaverJoin />} />
      <Route path="/social/login/kakao" element={<KakaoJoin />} />

      <Route element={<LayoutWrapper />}>
        <Route path="/" element={<RoleBasedHome />} />

        {/* 비로그인 접근 가능 */}
        <Route path="/communication"   element={<CommunicationPage />} />
        <Route path="/inquiry/chatbot" element={<InquiryChatBotPage />} />

        {/* 로그인 + 권한 필요 */}
        <Route path="/dashboard"   element={<StaffRoute allowedRoles={routeRoles["/dashboard"]}><DashboardPage /></StaffRoute>} />
        <Route path="/my-schedule" element={<StaffRoute allowedRoles={routeRoles["/my-schedule"]}><MySchedulePage /></StaffRoute>} />
        <Route path="/medical"     element={<StaffRoute allowedRoles={routeRoles["/medical"]}><MedicalRecordPage /></StaffRoute>} />
        <Route path="/reception"   element={<StaffRoute allowedRoles={routeRoles["/reception"]}><ReceptionPage /></StaffRoute>} />
        <Route path="/surgery"     element={<StaffRoute allowedRoles={routeRoles["/surgery"]}><SurgerySchedulePage /></StaffRoute>} />
        <Route path="/billing"     element={<StaffRoute allowedRoles={routeRoles["/billing"]}><BillingLayout /></StaffRoute>} />
        <Route path="/chat"        element={<StaffRoute allowedRoles={routeRoles["/chat"]}><ChatLayout /></StaffRoute>} />
        <Route path="/staff"          element={<StaffRoute allowedRoles={routeRoles["/staff"]}><StaffPage /></StaffRoute>} />
        <Route path="/department"     element={<StaffRoute allowedRoles={routeRoles["/department"]}><DepartmentPage /></StaffRoute>} />
        <Route path="/staff_schedule" element={<StaffRoute allowedRoles={routeRoles["/staff_schedule"]}><StaffSchedulePage /></StaffRoute>} />
        <Route path="/operation/schedule_policy"      element={<StaffRoute allowedRoles={routeRoles["/operation/schedule_policy"]}><Schedule_policyPage /></StaffRoute>} />
        <Route path="/operation/dept_schedule_policy" element={<StaffRoute allowedRoles={routeRoles["/operation/dept_schedule_policy"]}><DepartmentSchedulePolicyPage /></StaffRoute>} />
        <Route path="/admin"       element={<StaffRoute allowedRoles={routeRoles["/admin"]}><AdminPage /></StaffRoute>} />
        <Route path="/notification" element={<StaffRoute allowedRoles={routeRoles["/notification"]}><NotificationPage /></StaffRoute>} />
        <Route path="/reservationconfirm" element={<StaffRoute allowedRoles={routeRoles["/reservationconfirm"]}><ReservationConfirm /></StaffRoute>} />

        {/* 환자 페이지 */}
        <Route path="/reservation"     element={<ReservationPage />} />
        <Route path="/patient/mypage" element={<MyPageLayout/>} />
        <Route path="/patient/mypage/information" element={<MyInformatinPage/>} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default Router;
