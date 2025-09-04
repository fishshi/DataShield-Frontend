import axios from "axios";
import { ElMessage } from "element-plus";
import { useTokenStore } from "@/stores/token";
import router from "@/router";

const baseURL = "/api";

const instance = axios.create({ baseURL });

// 添加请求拦截器
instance.interceptors.request.use(
  (config) => {
    const tokenStore = useTokenStore();
    if (tokenStore.token) config.headers.Authorization = tokenStore.token;
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

// 添加响应拦截器
instance.interceptors.response.use(
  (result) => {
    if (result.data.code === 200) return result.data;
    ElMessage.error(result.data.msg ? result.data.msg : "服务异常");
    return Promise.reject(result.data);
  },
  (err) => {
    let status = err.response ? err.response.status : 500;
    if (status === 401) {
      ElMessage.error("登录失效，请重新登录");
      router.push("/login");
    } else ElMessage.error("服务异常");
    return Promise.reject(err);
  }
);

export default instance;
