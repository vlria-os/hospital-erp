import jwtAxios, { API_BASE_URL } from "../jwtAxios";

const host="/api/department";

export const getDepartmentList= async()=>{
    const res=await jwtAxios.get(`${host}/list`);
    return res.data;
};

export const getDoctorDepartmentList = async () => {
    const res = await jwtAxios.get(`${host}/list`);
    return res.data.content ?? res.data ?? [];
};

export const getDepartmentOne = async(departmentId)=>{
    const res=await jwtAxios.get(`${host}/${departmentId}`);
    return res.data;
};

export const registerDepartment = async(dapartmentData)=>{
    const res = await jwtAxios.post(`${host}/register`, dapartmentData);
    return res.data;
};

export const updateDepartment = async(departmentData)=>{
    const res = await jwtAxios.put(`${host}/${departmentData.departmentId}`, departmentData);
    return res.data;
};

export const deleteDepartment = async(departmentId)=>{
    const res = await jwtAxios.delete(`${host}/${departmentId}`);
    return res.data;
}