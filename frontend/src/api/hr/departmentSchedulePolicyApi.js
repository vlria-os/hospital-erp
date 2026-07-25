import jwtAxios from "../jwtAxios";

const host = "/api/schedule-policy";

export const getDepartmentSchedulePolicyList = async () => {
  const res = await jwtAxios.get(`${host}/list`);
  return res.data;
};

export const getDepartmentSchedulePolicy = async (policyId) => {
  const res = await jwtAxios.get(`${host}/${policyId}`);
  return res.data;
};

export const registerDepartmentSchedulePolicy = async (data) => {
  const res = await jwtAxios.post(`${host}`, data);
  return res.data;
};

export const updateDepartmentSchedulePolicy = async (policyId, data) => {
  const res = await jwtAxios.put(`${host}/${policyId}`, data);
  return res.data;
};

export const deactivateDepartmentSchedulePolicy = async (policyId) => {
  const res = await jwtAxios.delete(`${host}/${policyId}`);
  return res.data;
};
