import jwtAxios from "./jwtAxios";
export const API_BASE_URL = import.meta.env.VITE_SPRING_API_BASE_URL;

export const getMyReservations=async(page, sort, status) => {
    const res=await jwtAxios.get(`${API_BASE_URL}/api/patient/reservation`, {
        params: {
            page,
            sort,
            size: 5,
            ...(status && {status})
        }
    });

    return res.data;
}

export const cancelReservation=async(param)=>{
    const res=await jwtAxios.put(`${API_BASE_URL}/api/patient/reservation/cancel`, param);
    return res.data;
}

export const getMyReceptions=async(page, sort) => {
    const res=await jwtAxios.get(`${API_BASE_URL}/api/patient/reception`, {
        params: {
            page,
            sort,
            size: 5
        }
    });

    return res.data;
}

export const getMyPaymentList=async(page, sort, receptionId) => {
    const res=await jwtAxios.get(`${API_BASE_URL}/api/patient/payment`, {
        params: {
            page,
            sort,
            size: 3,
            receptionId
        }
    });

    return res.data;
}

export const getMyInformation=async() => {
    const res=await jwtAxios.get(`${API_BASE_URL}/api/patient/information`);
    return res.data;
}

export const checkPassword=async(password) => {
    const res=await jwtAxios.get(`${API_BASE_URL}/api/patient/check/password`, {
        params : {
            password
        }
    });

    return res.data;
}

export const updateMyInformation=async(param) => {
    const res=await jwtAxios.put(`${API_BASE_URL}/api/patient/information/update`, param);
    return res.data;
}

export const removeMySocialAccount=async(param) => {
    const res=await jwtAxios.delete(`${API_BASE_URL}/api/patient/remove/social`, {
        params: {
            provider: param.provider
        }
    });

    return res.data;
}