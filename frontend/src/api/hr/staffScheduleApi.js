import jwtAxios, { API_BASE_URL } from "../jwtAxios";

const host="/api/staff_schedule";

export const getScheduleList=async(startDate, endDate, size=500)=>{
    const params = { size };
    if (startDate) params.startDate = startDate;
    if (endDate)   params.endDate   = endDate;
    const res=await jwtAxios.get(`${host}/list`, { params });
    return res.data?.content ?? res.data;
};

export const getSchedule = async(scheduleId)=>{
    const res=await jwtAxios.get(`${host}/${scheduleId}`);
    return res.data;
};

export const registerSchedule = async(scheduleData)=>{
    const res = await jwtAxios.post(`${host}/register`, scheduleData);
    return res.data;
};

export const updateSchedule = async(scheduleId, scheduleData)=>{
    const res = await jwtAxios.put(`${host}/${scheduleId}`, scheduleData);
    return res.data;
};

export const deleteSchedule = async(scheduleId)=>{
    const res = await jwtAxios.delete(`${host}/${scheduleId}`);
    return res.data;
};

//개별확정
export const confirmSchedule = async(scheduleId) =>{
    const res = await jwtAxios.put(`${host}/${scheduleId}/confirm`);
    return res.data;
};

//선택 일괄 확정
export const bulkConfirmSchedule = async(scheduleIds) =>{
    const res = await jwtAxios.put(`${host}/confirm/bulk`, scheduleIds);
    return res.data;
};

//스케줄 일괄등록
export const bulkRegisterSchedule = async (data) => {
    const res = await jwtAxios.post(`${host}/bulk_register`,data);
    return res.data;
};

// AI 자동 스케줄 생성 (저장 안 함)
export const generateAutoSchedule = async (conditionData) => {
    const res = await jwtAxios.post("/api/auto-schedule/generate", conditionData);
    return res.data;
};

// AI 생성 스케줄 확정 저장
export const confirmAutoSchedule = async (assignments, departmentId) => {
    const res = await jwtAxios.post("/api/auto-schedule/confirm", { assignments, departmentId });
    return res.data;
};

// 내 스케줄 조회 (DOCTOR, NURSE 전용)
export const getMySchedule = async ({ startDate, endDate, page = 0, size = 30 } = {}) => {
    const params = { page, size };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await jwtAxios.get(`${host}/my`, { params });
    return res.data;
};

export const getMyScheduleDetail = async (date) => {
  const res = await jwtAxios.get(`${host}/my/detail`, {
    params: { today: date }
  });
  return res.data;
};


