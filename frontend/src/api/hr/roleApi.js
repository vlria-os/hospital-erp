import jwtAxios from "../jwtAxios";

export const getRoleList = async () => {
  const res = await jwtAxios.get("/api/role/list");
  return res.data;
};
