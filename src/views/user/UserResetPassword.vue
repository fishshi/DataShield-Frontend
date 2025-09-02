<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { userPasswordUpdateService } from "@/api/user";
import { userLoginService } from "@/api/user";

import useUserInfoStore from "@/stores/userInfo";
const userInfoStore = useUserInfoStore();

// 导入tokenStore
import { useTokenStore } from "@/stores/token";
const tokenStore = useTokenStore();

//定义数据模型
const passwords = ref({
  oldPassword: "",
  newPassword: "",
  renewPassword: "",
});

//校验密码的函数
const checkReNewPassword = (rule, value, callback) => {
  if (value === "") {
    callback(new Error("请再次确认新密码"));
  } else if (value !== passwords.value.newPassword) {
    callback(new Error("请确保两次输入的密码一样"));
  } else {
    callback();
  }
};

//定义表单校验规则
const rules = {
  oldPassword: [
    { required: true, message: "请输入旧密码", trigger: "blur" },
    { min: 5, max: 16, message: "长度为5~16位非空字符", trigger: "blur" },
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 5, max: 16, message: "长度为5~16位非空字符", trigger: "blur" },
  ],
  renewPassword: [{ required: true, validator: checkReNewPassword, trigger: "blur" }],
};

//调用后台接口,完成修改
const form = ref();
const changePassword = async () => {
  let vaild = await form.value.validate((valid) => {
    if (!valid) ElMessage.error("请检查输入项");
  });
  if (vaild) {
    await userPasswordUpdateService(passwords.value.oldPassword, passwords.value.newPassword);
    tokenStore.removeToken();
    //调用接口,获取token
    let result = await userLoginService({
      username: userInfoStore.info.username,
      password: passwords.value.newPassword,
    });
    console.log(result.data);
    //把得到的token存储到pinia中
    tokenStore.setToken(result.data);
    ElMessage.success("修改成功");
  }
};
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>修改密码</span>
      </div>
    </template>
    <el-row>
      <el-col :span="12">
        <el-form :model="passwords" :rules="rules" label-width="100px" size="large" ref="form">
          <el-form-item label="原密码" prop="oldPassword">
            <el-input v-model="passwords.oldPassword" type="password"></el-input>
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="passwords.newPassword" type="password"></el-input>
          </el-form-item>
          <el-form-item label="确认密码" prop="renewPassword">
            <el-input v-model="passwords.renewPassword" type="password"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="changePassword">提交修改</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </el-card>
</template>
