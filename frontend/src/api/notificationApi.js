import jwtAxios, { API_BASE_URL } from "./jwtAxios";

const host = `${API_BASE_URL}/notifications`;

//공지목록(페이지)
export const getNotificationList = async (page=0, size =10)=> {
    const res =await jwtAxios.get(`${host}?page=${page}&size=${size}`);
    return res.data;
};

//상세조회
export const getNotificationOne = async(id) =>{
    const res = await jwtAxios.get(`${host}/${id}`);
    return res.data;
}

//공지등록
export const registerNotification = async(data)=>{
    const res = await jwtAxios.post(host,data);
    return res.data;
};

//공지수정 
export const updateNotification = async(id, data)=>{
    const res = await jwtAxios.put(`${host}/${id}`,data);
    return res.data;
};

//공지삭제
export const deleteNotification = async(id) => {
    const res = await jwtAxios.delete(`${host}/${id}`);
    return res.data;
};