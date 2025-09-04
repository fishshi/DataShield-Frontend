import { defineStore } from "pinia";
import { ref } from "vue";
const useUserInfoStore = defineStore(
  "userInfo",
  () => {
    const info = ref({});

    const setInfo = (newInfo: { id: string; username: string; email: string; phone: string }) => {
      info.value = newInfo;
    };

    const removeInfo = () => {
      info.value = {};
    };

    return { info, setInfo, removeInfo };
  },
  { persist: true }
);

export default useUserInfoStore;
