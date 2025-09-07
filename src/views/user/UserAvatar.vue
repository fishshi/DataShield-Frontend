<script setup>
import { Plus, Upload } from "@element-plus/icons-vue";
import { ref } from "vue";
import defaultAvatar from "@/assets/default.png";
import { userAvatarUpdateService } from "@/api/user";
import { ElMessage } from "element-plus";

import useUserInfoStore from "@/stores/userInfo";
const userInfoStore = useUserInfoStore();

import { useTokenStore } from "@/stores/token";
const tokenStore = useTokenStore();
const token = tokenStore.token;

//用户头像地址
const imgUrl = ref(userInfoStore.info.avatarUrl);

const beforeUpload = (file) => {
  const isJPG = file.type === "image/jpeg";
  const isPNG = file.type === "image/png";
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG && !isPNG) {
    ElMessage.error("请上传JPG/PNG格式图片");
    return false;
  }
  if (!isLt2M) {
    ElMessage.error("图片大小不能超过2MB");
    return false;
  }
  return true;
};

const uploadRef = ref();
//选择图片成功
const uploadSuccess = (result) => {
  console.log(result);
  if (result.code == 200) {
    imgUrl.value = result.data;
    ElMessage.success("已选中图片，请点击上传头像按钮上传");
  } else {
    ElMessage.error(result.msg);
  }
};

//上传头像
const updateAvatar = async () => {
  //调用接口
  await userAvatarUpdateService(imgUrl.value);
  ElMessage.success("修改成功");
  //修改pinia中的数据
  userInfoStore.info.avatarUrl = imgUrl.value;
};
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>更换头像</span>
      </div>
    </template>
    <el-row>
      <el-col :span="12">
        <el-upload
          ref="uploadRef"
          class="avatar-uploader"
          :show-file-list="false"
          :auto-upload="true"
          action="/api/user/uploadAvatar"
          :headers="{ authorization: token }"
          :before-upload="beforeUpload"
          :on-success="uploadSuccess"
          :on-error="() => ElMessage.error('失败,请检查网络设置并稍后重试或联系系统管理员')"
        >
          <img v-if="imgUrl" :src="imgUrl" class="avatar" />
          <img v-else :src="defaultAvatar" width="278" />
        </el-upload>
        <br />
        <el-button type="primary" :icon="Plus" size="large" @click="uploadRef.$el.querySelector('input').click()">
          选择图片
        </el-button>
        <el-button type="success" :icon="Upload" size="large" @click="updateAvatar"> 上传头像 </el-button>
      </el-col>
    </el-row>
  </el-card>
</template>

<style lang="scss" scoped>
.avatar-uploader {
  :deep() {
    .avatar {
      width: 278px;
      height: 278px;
      display: block;
    }

    .el-upload {
      border: 1px dashed var(--el-border-color);
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);
    }

    .el-upload:hover {
      border-color: var(--el-color-primary);
    }

    .el-icon.avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 278px;
      height: 278px;
      text-align: center;
    }
  }
}
</style>
