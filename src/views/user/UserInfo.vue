<script setup>
import { onBeforeUnmount, ref } from "vue";
import { ElMessage } from "element-plus";

import useUserInfoStore from "@/stores/userInfo";
import { userInfoService } from "@/api/user";
import { userInfoUpdateService } from "@/api/user";
const userInfoStore = useUserInfoStore();
const userInfo = ref(userInfoStore.info);

//调用函数,获取用户详细信息
const getUserInfo = async () => {
  let result = await userInfoService();
  userInfoStore.setInfo(result.data);
};
onBeforeUnmount(() => {
  getUserInfo();
});

//校验函数
const rules = {
  email: [
    { required: true, message: "请输入用户邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: "blur" },
  ],
};

//修改个人信息
const form = ref();
const updateUserInfo = async () => {
  //表单验证
  let vaild = await form.value.validate((vaild) => {
    if (!vaild) ElMessage.error("请检查输入项");
  });
  if (vaild) {
    await userInfoUpdateService(userInfo.value);
    ElMessage.success("修改成功");
  }
};
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>基本资料</span>
      </div>
    </template>
    <el-row>
      <el-col :span="12">
        <el-form :model="userInfo" :rules="rules" label-width="100px" size="large" ref="form">
          <el-form-item label="用户ID">
            <el-input v-model="userInfo.id" disabled></el-input>
          </el-form-item>
          <el-form-item label="用户名称">
            <el-input v-model="userInfo.username" disabled></el-input>
          </el-form-item>
          <el-form-item label="用户邮箱" prop="email">
            <el-input v-model="userInfo.email"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="updateUserInfo">提交修改</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </el-card>
</template>
