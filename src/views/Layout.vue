<script setup>
import { ref, onMounted } from "vue";
import {
  User,
  Crop,
  EditPen,
  SwitchButton,
  CaretBottom,
  Coin,
  HomeFilled,
  MostlyCloudy,
  List,
  Search,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import defaultAvatar from "@/assets/default.png";

import { useRouter } from "vue-router";
const router = useRouter();

import { useTokenStore } from "@/stores/token";
const tokenStore = useTokenStore();

import useUserInfoStore from "@/stores/userInfo";
import { userInfoService, logoutService } from "@/api/user";
const userInfoStore = useUserInfoStore();

//调用函数,获取用户信息
const getUserInfo = async () => {
  let result = await userInfoService();
  userInfoStore.setInfo(result.data);
};
getUserInfo();

const handleCommand = (command) => {
  if (command === "logout") {
    ElMessageBox.confirm("您确认要退出吗?", "温馨提示", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(async () => {
        await logoutService();
        tokenStore.removeToken();
        userInfoStore.removeInfo();

        router.push("/login");
        ElMessage.success("退出登录成功");
      })
      .catch(() => {
        ElMessage.info("用户取消了退出登录");
      });
  } else {
    router.push("/user/" + command);
  }
};
</script>

<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="el-aside__logo"></div>
      <el-menu active-text-color="rgb(255, 255, 255)" text-color="rgb(225, 225, 225)" router>
        <el-menu-item index="/home/main">
          <el-icon>
            <HomeFilled />
          </el-icon>
          <span>主页</span>
        </el-menu-item>
        <el-menu-item index="/home/data">
          <el-icon>
            <Coin />
          </el-icon>
          <span>托管数据管理</span>
        </el-menu-item>
        <el-menu-item index="/home/remotedata">
          <el-icon>
            <MostlyCloudy />
          </el-icon>
          <span>远程数据管理</span>
        </el-menu-item>
        <el-menu-item index="/home/identify">
          <el-icon>
            <Search />
          </el-icon>
          <span>敏感数据识别</span>
        </el-menu-item>
        <el-menu-item index="/home/task">
          <el-icon>
            <List />
          </el-icon>
          <span>脱敏任务管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div style="font-size: large">上网不涉密，涉密不上网</div>
        <el-dropdown placement="bottom-end" @command="handleCommand">
          <span class="el-dropdown__box">
            <el-avatar :src="userInfoStore.info.avatarUrl ? userInfoStore.info.avatarUrl : defaultAvatar" />
            <el-icon>
              <CaretBottom />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="info" :icon="User">基本资料</el-dropdown-item>
              <el-dropdown-item command="avatar" :icon="Crop">更换头像</el-dropdown-item>
              <el-dropdown-item command="resetPassword" :icon="EditPen">重置密码</el-dropdown-item>
              <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <!-- 中间区域 -->
      <el-main>
        <router-view></router-view>
      </el-main>
      <!-- 底部区域 -->
      <el-footer>
        <div>
          <span class="clickable">服务协议</span>
          <span> | </span>
          <span class="clickable">隐私政策</span>
          <span> | </span>
          <span>2855691008@qq.com</span>
        </div>
        <div>DataShield ©2025 Created by 昨夜圆船组</div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;

  .el-aside {
    background: linear-gradient(to bottom, rgb(22, 65, 126), rgb(17, 31, 57));

    &__logo {
      height: 120px;
      background: url("@/assets/logo.png") no-repeat center / 120px auto;
    }

    .el-menu {
      border-right: none;
      background-color: transparent;

      .el-menu-item:hover {
        background-color: rgba(17, 31, 57, 0.5);
      }
    }
  }

  .el-header {
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .el-dropdown__box {
      display: flex;
      align-items: center;

      .el-icon {
        color: #999;
        margin-left: 10px;
      }

      &:active,
      &:focus {
        outline: none;
      }
    }
  }

  .el-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #666;

    div {
      margin: 1px 0;
    }

    .clickable {
      cursor: pointer;
    }
  }
}
</style>
