import axios from "axios";
import jwtAxios from "./jwtAxios";

const BASE = `${import.meta.env.VITE_SPRING_API_BASE_URL}/api/notifications`;

export const getNoticeList = async (page = 0, size = 10) => {
    const res = await axios.get(BASE, { params: { page, size } });
    return res.data;
};

export const getImportantNotices = async () => {
    const res = await axios.get(`${BASE}/important`);
    return res.data;
};

export const getNoticeDetail = async (id) => {
    const res = await axios.get(`${BASE}/${id}`);
    return res.data;
};

export const createNotice = async (data) => {
    const res = await jwtAxios.post(BASE, data);
    return res.data;
};

export const updateNotice = async (id, data) => {
    const res = await jwtAxios.put(`${BASE}/${id}`, data);
    return res.data;
};

export const deleteNotice = async (id) => {
    const res = await jwtAxios.delete(`${BASE}/${id}`);
    return res.data;
};
