import jwtAxios from "./jwtAxios";
export const API_BASE_URL = import.meta.env.VITE_SPRING_API_BASE_URL;

export const getBillingList=async(page, sort, keyword)=>{
    const res=await jwtAxios.get(`${API_BASE_URL}/api/billing`, {
        params: {
            page,
            size: 10,
            sort,
            ...(keyword && {keyword})
        }
    });

    return res.data;
}

export const preparePayment=async(param) => {
    const res=await jwtAxios.post(`${API_BASE_URL}/api/payment/prepare`, param);
    return res.data;
}

export const confirmPayment=async(param) => {
    const res=await jwtAxios.post(`${API_BASE_URL}/api/payment/confirm`, param);
    return res.data;
}

export const cashPayment=async(param) => {
    const res=await jwtAxios.post(`${API_BASE_URL}/api/payment/cash`, param);
    return res.data;
}

export const getPaymentList=async(page, sort, keyword)=>{
    const res=await jwtAxios.get(`${API_BASE_URL}/api/payment`, {
        params: {
            page,
            size: 10,
            sort,
            ...(keyword && {keyword})
        }
    });

    return res.data;
}

export const insertTotalAmount=async(param) => {
    const res=await jwtAxios.post(`${API_BASE_URL}/api/billing/total/amount`, param);
    return res.data;
}