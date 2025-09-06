import { createRouter, createWebHistory } from "vue-router";

import LoginVue from "@/views/Login.vue";
import LayoutVue from "@/views/Layout.vue";
import Main from "@/views/home/Main.vue";
import Data from "@/views/home/Data.vue";
import RemoteData from "@/views/home/RemoteData.vue";
import Identify from "@/views/home/Identify.vue";
import Task from "@/views/home/Task.vue";
import UserAvatarVue from "@/views/user/UserAvatar.vue";
import UserInfoVue from "@/views/user/UserInfo.vue";
import UserResetPasswordVue from "@/views/user/UserResetPassword.vue";

const routes = [
  { path: "/login", component: LoginVue },
  {
    path: "/",
    component: LayoutVue,
    redirect: "/home/main",
    children: [
      { path: "/home/main", component: Main },
      { path: "/home/data", component: Data },
      { path: "/home/remotedata", component: RemoteData },
      { path: "/home/identify", component: Identify },
      { path: "/home/task", component: Task },
      { path: "/user/info", component: UserInfoVue },
      { path: "/user/avatar", component: UserAvatarVue },
      { path: "/user/resetPassword", component: UserResetPasswordVue },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
});

export default router;
