import request from "@/utils/request";

// 用户注册
export const userRegisterService = (registerData: { username: string; password: string }) => {
  return request.post("/auth/register", registerData, {
    headers: { "Content-Type": "application/json" },
  });
};

// 用户登录
export const userLoginService = (loginData: { username: string; password: string }) => {
  return request.post("/auth/login", loginData, {
    headers: { "Content-Type": "application/json" },
  });
};

// 检查用户名是否可注册
export const canRegisterService = (username: string) => {
  return request.get("/auth/canRegister", {
    params: { username },
  });
};

// 获取用户详细信息
export const userInfoService = () => {
  return request.get("/user/getUserInfo");
};

// 修改个人信息
export const userInfoUpdateService = (userInfoData: { email: string, phone: string }) => {
  return request.put("/user/updateUserInfo", userInfoData, {
    headers: { "Content-Type": "application/json" },
  });
};

// 修改头像
export const userAvatarUpdateService = (avatarUrl: string) => {
  return request.patch(
    "/user/updateAvatar",
    { avatarUrl },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};

// 修改密码
export const userPasswordUpdateService = (oldPassword: string, newPassword: string) => {
  return request.patch(
    "/user/updatePassword",
    { oldPassword, newPassword },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
