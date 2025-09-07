<template>
  <el-card class="page-container">
    <!-- 1. 顶部标题 + 操作按钮 -->
    <template #header>
      <div class="card-header">
        <span>敏感数据感知</span>
        <div>
          <el-button type="primary" @click="fetchTasks">
            <el-icon>
              <Refresh />
            </el-icon>
            刷新
          </el-button>
          <el-button type="success" @click="handleCreate">
            <el-icon>
              <Plus />
            </el-icon>
            新建任务
          </el-button>
        </div>
      </div>
    </template>

    <!-- 2. 任务列表 -->
    <el-table v-loading="tableLoading" :data="taskList" stripe style="width: 100%; margin-bottom: 20px">
      <el-table-column prop="identifyName" label="任务名称" />
      <el-table-column prop="dbName" label="数据库" />
      <el-table-column prop="tbName" label="数据表" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="scope">
          <el-tag :type="statusColor(scope.row.status)">
            {{ statusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button size="small" @click="viewResult(scope.row)"> 查看结果 </el-button>
          <el-button size="small" @click="handleEdit(scope.row)"> 编辑 </el-button>
          <el-popconfirm title="确定删除该任务吗？" @confirm="deleteTask(scope.row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 3. 任务结果弹窗 -->
    <el-dialog v-model="resultVisible" title="任务结果" width="70%" :close-on-click-modal="false">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="敏感数据字段">
          {{ currentTask?.columns }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 结果数据表格 -->
      <el-table v-loading="resultLoading" :data="resultData" height="400" stripe style="margin-top: 16px">
        <el-table-column v-for="col in resultColumns" :key="col" :prop="col" :label="col" />
      </el-table>
      <template #footer>
        <el-button type="primary" @click="goCreateDataMaskTask"> 数据脱敏 </el-button>
      </template>
    </el-dialog>

    <!-- 4. 新建/编辑任务弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑任务' : '新建任务'"
      width="600px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="taskFormRef" :model="taskForm" :rules="rules" label-width="100px">
        <el-form-item label="任务名称" prop="identifyName">
          <el-input v-model="taskForm.identifyName" placeholder="例如：用户表敏感数据感知" />
        </el-form-item>

        <el-form-item label="数据库" prop="dbName">
          <el-select v-model="taskForm.dbName" filterable placeholder="请选择数据库" @change="onDbChange">
            <el-option v-for="db in dbOptions" :key="db" :label="db" :value="db" />
          </el-select>
        </el-form-item>

        <el-form-item label="数据表" prop="tbName">
          <el-select v-model="taskForm.tbName" filterable placeholder="请选择数据表" @change="onTbChange">
            <el-option v-for="tb in tbOptions" :key="tb" :label="tb" :value="tb" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="submitForm"> 确 定 </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
/* ---------------- 依赖引入 ---------------- */
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Plus } from "@element-plus/icons-vue";
import request from "@/utils/request";
import router from "@/router";

/* ---------------- 响应式数据 ---------------- */
// 任务列表
const taskList = ref([]);
// 表格 Loading
const tableLoading = ref(false);
// 结果弹窗
const resultVisible = ref(false);
const currentTask = ref(null);
const resultData = ref([]);
const resultColumns = ref([]);
const resultLoading = ref(false);

/* ---------------- 新建/编辑弹窗数据 ---------------- */
const formVisible = ref(false);
const isEdit = ref(false);
const saveLoading = ref(false);
const taskFormRef = ref();
// 表单模型
const taskForm = reactive({
  id: undefined, // 编辑时写入
  identifyName: "",
  dbName: "",
  tbName: "",
});
// 下拉数据源
const dbOptions = ref([]);
const dbIsRemoteMap = {};
const tbOptions = ref([]);
const colOptions = ref([]);

/* ---------------- 轮询相关 ---------------- */
let pollTimer = null;
const POLL_INTERVAL = 2000; // 2s

/* ---------------- 工具函数 ---------------- */
function statusText(status) {
  const map = { 0: "待执行", 1: "执行中", 2: "已完成", 3: "失败" };
  return map[status] || "未知";
}
function statusColor(status) {
  const map = { 0: "info", 1: "warning", 2: "success", 3: "danger" };
  return map[status] || "info";
}

/* ---------------- 网络请求 ---------------- */
// 获取任务列表
async function fetchTasks() {
  tableLoading.value = true;
  try {
    const data = await request.get("/identify/getAllIdentify");
    taskList.value = data.data.map((item) => ({
      ...item,
    }));
    // 启停轮询
    handlePoll();
  } finally {
    tableLoading.value = false;
  }
}
// 删除任务
async function deleteTask(id) {
  const data = await request.delete(`/identify/deleteIdentify/${id}`);
  ElMessage.success("删除成功");
  fetchTasks();
}
// 查看结果
async function viewResult(task) {
  resultVisible.value = true;
  currentTask.value = task;
  resultLoading.value = true;
  try {
    const colRes = await request.get("/data/getColumns", {
      params: { dbName: task.dbName, tbName: task.tbName, isRemote: dbIsRemoteMap[task.dbName] },
    });
    resultColumns.value = colRes.data;
    const recordRes = await request.get("/data/getRecords", {
      params: { dbName: task.dbName, tbName: task.tbName, isRemote: dbIsRemoteMap[task.dbName] },
    });
    resultData.value = recordRes.data;
  } finally {
    resultLoading.value = false;
  }
}

/* ---------------- 新建/编辑相关 ---------------- */
// 获取数据库列表
async function fetchDatabases() {
  Object.keys(dbIsRemoteMap).forEach(key => delete dbIsRemoteMap[key]);
  dbOptions.value = [];
  const localData = await request.get("/data/getLocalDatabases");
  for (const item of localData.data) {
    dbIsRemoteMap[item] = 0;
    dbOptions.value.push(item);
  }
  const remoteData = await request.get("/data/getRemoteDatabases");
  for (const item of remoteData.data) {
    dbIsRemoteMap[item.dbName] = 1;
    dbOptions.value.push(item.dbName);
  }
}
// 获取表列表
async function fetchTables(db) {
  tbOptions.value = [];
  colOptions.value = [];
  const data = await request.get("/data/getAllTables", {
    params: { dbName: db, isRemote: dbIsRemoteMap[db] },
  });
  tbOptions.value = data.data;
}
// 获取字段列表
async function fetchColumns(db, tb) {
  colOptions.value = [];
  const data = await request.get("/data/getColumns", {
    params: { dbName: db, tbName: tb, isRemote: dbIsRemoteMap[db] },
  });
  colOptions.value = data.data;
}
// 选择数据库
function onDbChange(db) {
  taskForm.tbName = "";
  fetchTables(db);
}
// 选择表
function onTbChange(tb) {}

// 表单校验
const rules = reactive({
  identifyName: [{ required: true, message: "请输入感知任务名称", trigger: "blur" }],
  dbName: [{ required: true, message: "请选择数据库", trigger: "change" }],
  tbName: [{ required: true, message: "请选择数据表", trigger: "change" }],
  fields: [{ type: "array", required: true, message: "请选择脱敏字段", trigger: "change" }],
  maskRule: [{ required: true, message: "请选择脱敏规则", trigger: "change" }],
  targetTable: [{ required: true, message: "请输入目标表名", trigger: "blur" }],
});
// 重置表单
function resetForm() {
  Object.assign(taskForm, {
    id: undefined,
    identifyName: "",
    dbName: "",
    tbName: "",
  });
  taskFormRef.value?.clearValidate();
}
// 提交表单
async function submitForm() {
  await taskFormRef.value.validate();
  saveLoading.value = true;
  try {
    const payload = {
      ...taskForm,
      isRemote: dbIsRemoteMap[taskForm.dbName],
      columns: "",
      status: 0,
    };
    // 编辑模式
    if (isEdit.value) {
      const data = await request.put("/identify/updateIdentify", payload);
      ElMessage.success("更新成功");
      formVisible.value = false;
      fetchTasks();
    } else {
      // 新建模式
      const data = await request.post("/identify/createIdentify", payload);
      ElMessage.success("创建成功");
      formVisible.value = false;
      fetchTasks();
    }
  } finally {
    saveLoading.value = false;
  }
}

const goCreateDataMaskTask = () => {
  localStorage.setItem("currentCreating", JSON.stringify(currentTask.value));
  router.push("/home/task");
};

/* ---------------- 轮询 ---------------- */
function startPoll() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    fetchTasks();
  }, POLL_INTERVAL);
}
function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
// 根据列表状态启停轮询
function handlePoll() {
  const hasRunning = taskList.value.some((t) => t.status === 0 || t.status === 1);
  if (hasRunning) startPoll();
  else stopPoll();
}

/* ---------------- 事件处理 ---------------- */
function handleCreate() {
  isEdit.value = false;
  formVisible.value = true;
}

function handleEdit(row) {
  isEdit.value = true;
  // 回填数据
  Object.assign(taskForm, {
    id: row.id,
    identifyName: row.identifyName,
    dbName: row.dbName,
    tbName: row.tbName,
  });
  // 拉联下拉数据
  fetchTables(taskForm.dbName);
  fetchColumns(taskForm.dbName, taskForm.tbName);
  formVisible.value = true;
}

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  fetchTasks();
  fetchDatabases();
});
onBeforeUnmount(() => {
  stopPoll();
});
</script>

<style lang="scss" scoped>
.page-container {
  position: relative;
  min-height: 100%;
  box-sizing: border-box;
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
