import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MyReservation from './component/MyReservation';
import MyReception from './component/MyReception';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, UserRound } from 'lucide-react';

const MyPageLayout = () => {
  const { name } = useSelector((s) => s.auth);
  const accessToken = sessionStorage.getItem("accessToken");
  const roles = sessionStorage.getItem("roles");
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken || !roles.includes("PATIENT")) {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <LayoutDashboard size={20} className="text-blue-600" />
        <h1 className="text-lg font-bold text-zinc-900">마이페이지</h1>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
            <UserRound size={18} className="text-blue-600" />
          </div>
          <p className="text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">{name}</span> 님의 예약 · 접수 · 결제 정보를 한 눈에 확인하세요.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => navigate("/patient/mypage/information", { replace: true })}
        >
          내 정보
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <MyReservation />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <MyReception />
        </div>
      </div>
    </div>
  );
};

export default MyPageLayout;
