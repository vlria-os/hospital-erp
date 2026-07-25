import { emailCheck } from '@/api/joinApi';
import { checkPassword, getMyInformation, removeMySocialAccount, updateMyInformation } from '@/api/patientApi';
import { Button } from '@/components/ui/button';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ChevronLeft, UserRound } from 'lucide-react';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const MyInformatinPage = () => {
  const [email, setEmail]=useState("");
  const [password, setPassword]=useState("");
  const [name, setName]=useState("");
  const [rrn, setRrn]=useState("");
  const [phone, setPhone]=useState("");
  const [address, setAddress]=useState("");
  const [openNewEmailBox, setOpenNewEmailBox]=useState(false);
  const [emailChecked, setEmailChecked]=useState(false);
  const [emailCheckResult, SetEmailCheckResult]=useState("");
  const [openNewNameBox, setOpenNewNameBox]=useState(false);
  const [openNewPhoneBox, setOpenNewPhoneBox]=useState(false);
  const [openNewAddressBox, setOpenNewAddressBox]=useState(false);
  const [passwordCheckResult, setPasswordCheckResult]=useState("");
  const [passwordChecked, setPasswordChecked]=useState(false);
  const [openPasswordModal, setOpenPasswordModal]=useState(false);
  const [newPassword, setNewPassword]=useState("");

  const queryClient=useQueryClient();
  const navigate=useNavigate();

  const { data, isLoading, isError }=useQuery({
    queryKey: ['myInformation', email, password, name, phone, address],
    queryFn: () => getMyInformation(),
    placeholderData: keepPreviousData
  });

  const emailCheckMutation=useMutation({
    mutationFn: emailCheck,
    onSuccess: (result) => {
      if(result === "success"){
        if (result === "success") {
          SetEmailCheckResult("사용 가능한 이메일입니다.");
          setEmailChecked(true);
        } else {
          SetEmailCheckResult("이미 사용 중인 이메일입니다.");
          setEmailChecked(false);
        }
      }
    },
    onError: () => { SetEmailCheckResult("오류가 발생했습니다."); setEmailChecked(false); }
  });

  const passwordCheckMutation=useMutation({
    mutationFn: checkPassword,
    onSuccess: (result) => {
      if(result === "true" || result === true){
        setPasswordCheckResult("비밀번호가 일치합니다.");
        setPasswordChecked(true);
      } else {
        setPasswordCheckResult("비밀번호가 일치하지 않습니다.");
        setPasswordChecked(false);
      }
    },
    onError: () => {
      setPasswordCheckResult("오류가 발생했습니다.");
    }
  });

  const resetAll = () => {
    setEmail(""); setPassword(""); setName(""); setRrn(""); setPhone(""); setAddress(""); setNewPassword("");
    SetEmailCheckResult(""); setEmailChecked(false);
    setPasswordCheckResult(""); setPasswordChecked(false);
    setOpenNewEmailBox(false); setOpenNewNameBox(false); setOpenNewPhoneBox(false); setOpenNewAddressBox(false);
    setOpenPasswordModal(false);
  };

  const updateInfoMutation=useMutation({
    mutationFn: updateMyInformation,
    onSuccess: (result) => {
      if(result.value == null){
        const key=result.key;
        alert(key + "수정 성공!");
        resetAll();
        queryClient.invalidateQueries({queryKey: ['myInformation']});
        navigate("/patient/mypage/information", {replace:true});
      } else {
        const key=result.key;
        const value=result.value;
        alert(key + " 항목을 " + value + " 으로 수정 성공!");
        resetAll();
        queryClient.invalidateQueries({queryKey: ['myInformation']});
        navigate("/patient/mypage/information", {replace:true});
      }
    },
    onError: () => {
      alert("내 정보 수정 실패!");
    }
  });

  const removeSocialMutation=useMutation({
    mutationFn: removeMySocialAccount,
    onSuccess: (result) => {
      if(result === "success"){
        alert("소셜 로그인 계정 삭제 성공!");
        queryClient.invalidateQueries({queryKey: ['myInformation']});
        navigate("/patient/mypage/information", {replace:true});
      }
    },
    onError: () => {
      alert("소셜 로그인 계정 삭제 실패!");
    }
  })

  const info=data;

  const isLocal = info?.local && (info?.socialAccounts === null || info?.socialAccounts?.length === 0);
  const onlySocial = info?.onlySocial && info?.socialAccounts !== null && info?.socialAccounts?.length > 0 && (info?.email === null || info?.email === "");
  const hasSocial = info?.hasSocial && info?.email !== null && info?.socialAccounts !== null && info?.socialAccounts?.length > 0;

  const handleEmailCheck=()=>{
    if (!email) { SetEmailCheckResult("이메일을 입력하세요."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { SetEmailCheckResult("이메일 형식이 올바르지 않습니다."); return; }
    emailCheckMutation.mutate(email);
  }

  const handlePasswordCheck=(password)=>{
    if(!password) return;
    passwordCheckMutation.mutate(password);
  }

  const handleUpdateInformation=(key, value)=>{
    if(!key || !value) return;
    updateInfoMutation.mutate({key, value});
  }

  const handleRemoveSocial=(provider)=>{
    if(!provider) {
      alert("소셜 로그인 정보를 읽을 수 없습니다.");
      return;
    }
    removeSocialMutation.mutate({ provider });
  }

  const inputClass = "flex-1 rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400";

  return (
    <div className="p-6 space-y-5">
      <button
        type="button"
        onClick={() => navigate("/patient/mypage", { replace: true })}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
      >
        <ChevronLeft size={16} />
        마이페이지
      </button>

      <div className="flex items-center gap-2">
        <UserRound size={20} className="text-blue-600" />
        <h1 className="text-lg font-bold text-zinc-900">내 정보</h1>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500">
          불러오는 중...
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-red-500">
          내 정보를 불러오지 못했습니다.
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500">
          내 정보가 존재하지 않습니다.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">

          {/* 이메일 */}
          <div className="px-5 py-4 space-y-3">
            {isLocal ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 mb-0.5">이메일</p>
                    <p className="text-sm font-medium text-zinc-900">{info.email}</p>
                  </div>
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenNewEmailBox(true)}>수정</Button>
                </div>
                {openNewEmailBox && (
                  <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
                    <div className="flex gap-2">
                      <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="새 이메일" className={inputClass} />
                      <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleEmailCheck} disabled={emailChecked}>중복 검사</Button>
                    </div>
                    {emailCheckResult && (
                      <p className={`text-xs ${emailChecked ? 'text-blue-600' : 'text-red-500'}`}>{emailCheckResult}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenNewEmailBox(false)}>닫기</Button>
                      <Button size="sm" className="cursor-pointer" onClick={() => handleUpdateInformation("email", email)} disabled={!emailChecked}>저장</Button>
                    </div>
                  </div>
                )}
              </>
            ) : hasSocial ? (
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">이메일</p>
                <p className="text-sm font-medium text-zinc-900">{info.email}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">이메일</p>
                <p className="text-sm font-medium text-zinc-500">소셜 로그인 전용 계정입니다.</p>
              </div>
            )}
          </div>

          {/* 비밀번호 */}
          {!onlySocial && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">비밀번호</p>
                  <p className="text-sm font-medium text-zinc-900">••••••••</p>
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenPasswordModal(true)}>비밀번호 재설정</Button>
              </div>
            </div>
          )}

          {/* 이름 */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">이름</p>
                <p className="text-sm font-medium text-zinc-900">{info.name}</p>
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenNewNameBox(true)}>수정</Button>
            </div>
            {openNewNameBox && (
              <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="새 이름" className={inputClass} />
                  <Button size="sm" className="cursor-pointer" onClick={() => handleUpdateInformation("name", name)}>저장</Button>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenNewNameBox(false)}>닫기</Button>
                </div>
              </div>
            )}
          </div>

          {/* 주민등록번호 */}
          <div className="px-5 py-4">
            <p className="text-xs text-zinc-400 mb-0.5">주민등록번호</p>
            <p className="text-sm font-medium text-zinc-900">{info.rrn}</p>
          </div>

          {/* 전화번호 */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">전화번호</p>
                <p className="text-sm font-medium text-zinc-900">{info.phone ?? "-"}</p>
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenNewPhoneBox(true)}>수정</Button>
            </div>
            {openNewPhoneBox && (
              <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="숫자만 입력"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className={inputClass}
                  />
                  <Button size="sm" className="cursor-pointer" onClick={() => handleUpdateInformation("phone", phone)}>저장</Button>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenNewPhoneBox(false)}>닫기</Button>
                </div>
              </div>
            )}
          </div>

          {/* 주소 */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">주소</p>
                <p className="text-sm font-medium text-zinc-900">{info.address ?? "-"}</p>
              </div>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenNewAddressBox(true)}>수정</Button>
            </div>
            {openNewAddressBox && (
              <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="새 주소" className={inputClass} />
                  <Button size="sm" className="cursor-pointer" onClick={() => handleUpdateInformation("address", address)}>저장</Button>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpenNewAddressBox(false)}>닫기</Button>
                </div>
              </div>
            )}
          </div>

          {/* 소셜 로그인 */}
          {info.socialAccounts !== null && info.socialAccounts.length > 0 && (
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-zinc-400">소셜 로그인</p>
              <div className="space-y-2">
                {info.socialAccounts.map((a) => (
                  <div key={a.socialAccountId} className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{a.provider}</p>
                      <p className="text-xs text-zinc-400">{dayjs(a.createdAt).format("YYYY.MM.DD HH:mm")}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                      onClick={() => handleRemoveSocial(a.provider)}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 비밀번호 재설정 모달 */}
      {openPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">비밀번호 재설정</h2>
              <button
                type="button"
                onClick={() => setOpenPasswordModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">현재 비밀번호 입력</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <Button size="sm" className="cursor-pointer" onClick={() => handlePasswordCheck(password)} disabled={passwordChecked}>확인</Button>
              </div>
              {passwordCheckResult && (
                <p className={`text-xs ${passwordChecked ? 'text-blue-600' : 'text-red-500'}`}>{passwordCheckResult}</p>
              )}
            </div>
            {passwordChecked && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">새 비밀번호 입력</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                  />
                  <Button size="sm" className="cursor-pointer" onClick={() => handleUpdateInformation("password", newPassword)}>저장</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MyInformatinPage
