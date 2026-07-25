import jwtAxios, { API_BASE_URL } from "../jwtAxios";

const host = "/api/staff";

export const getStaffList = async() => {
    const res = await jwtAxios.get(`${host}/list?size=200`);
    return res.data?.content ?? res.data;
};

export const getStaffOne = async(staffId) => {
    const res = await jwtAxios.get(`${host}/${staffId}`);
    return res.data;
};

export const registerStaff = async(staffData) => {
    const res = await jwtAxios.post(`${host}/register`, staffData);
    return res.data;
};

export const updateStaff = async (staffData) =>{
    const res = await jwtAxios.put(`${host}/update`, staffData);
    return res.data;
};
export const deleteStaff = async(staffId) => {
    const res= await jwtAxios.delete(`${host}/${staffId}`);
    return res.data;
};