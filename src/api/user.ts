import request from "@/utils/request";

// 用户注册
export const userRegisterService = (registerData) => {
  return request.post("/auth/register", registerData, {
    headers: { "Content-Type": "application/json" },
  });
};

// 用户登录
export const userLoginService = (loginData) => {
  return request.post("/auth/login", loginData, {
    headers: { "Content-Type": "application/json" },
  });
};

// 检查用户名是否可注册
export const canRegisterService = (username) => {
  return request.get("/auth/canRegister", {
    params: { username },
  });
};

// 获取用户详细信息
export const userInfoService = () => {
  return request.get("/user/getUser");
};

// 修改个人信息
export const userInfoUpdateService = (userInfoData) => {
  return request.put("/user/updateUserInfo", userInfoData, {
    headers: { "Content-Type": "application/json" },
  });
};

// 修改头像
export const userAvatarUpdateService = (avatarUrl) => {
  return request.patch(
    "/user/updateAvatar",
    { avatarUrl },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};

// 修改密码
export const userPasswordUpdateService = (oldPassword, newPassword) => {
  return request.patch(
    "/user/updatePassword",
    { oldPassword, newPassword },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
