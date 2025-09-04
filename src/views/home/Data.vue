<template>
  <el-card class="page-container">
    <!-- 顶部标题 + 操作按钮 -->
    <template #header>
      <div class="card-header">
        <span>数据库管理</span>
        <div>
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
          <el-button type="success" @click="uploadDialogVisible = true">
            <el-icon><Upload /></el-icon> 上传SQL
          </el-button>
          <el-button type="warning" @click="remoteDialogVisible = true">
            <el-icon><Connection /></el-icon> 添加远程数据库
          </el-button>
        </div>
      </div>
    </template>

    <!-- 数据库切换标签页 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 本地数据库标签页 -->
      <el-tab-pane label="本地数据库" name="local">
        <el-row :gutter="20">
          <!-- 左侧：数据库和表列表 -->
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <span>数据库列表</span>
              </template>
              <!-- 数据库选择 -->
              <el-select
                v-model="selectedLocalDb"
                placeholder="请选择数据库"
                style="width: 100%; margin-bottom: 16px"
                @change="handleLocalDbChange"
              >
                <el-option v-for="db in localDatabases" :key="db" :label="db" :value="db" />
              </el-select>

              <!-- 数据表列表 -->
              <div v-if="selectedLocalDb" class="table-list">
                <el-divider content-position="left">数据表</el-divider>
                <el-scrollbar height="300px">
                  <div
                    v-for="table in localTables"
                    :key="table"
                    class="table-item"
                    :class="{ active: selectedLocalTable === table }"
                    @click="handleLocalTableClick(table)"
                  >
                    <el-icon><Document /></el-icon>
                    {{ table }}
                  </div>
                </el-scrollbar>
              </div>

              <!-- 删除数据库按钮 -->
              <el-popconfirm
                v-if="selectedLocalDb"
                title="确定删除该数据库吗？此操作不可恢复！"
                @confirm="handleDeleteDatabase"
              >
                <template #reference>
                  <el-button type="danger" size="small" style="margin-top: 16px">
                    <el-icon><Delete /></el-icon> 删除数据库
                  </el-button>
                </template>
              </el-popconfirm>
            </el-card>
          </el-col>

          <!-- 右侧：数据展示 -->
          <el-col :span="16">
            <el-card shadow="hover">
              <template #header>
                <span>数据预览</span>
                <el-button
                  v-if="tableData.length > 0"
                  type="primary"
                  size="small"
                  style="float: right"
                  @click="handleExportCsv"
                >
                  导出CSV
                </el-button>
              </template>

              <!-- 字段信息 -->
              <div v-if="tableColumns.length > 0" class="column-info">
                <el-tag v-for="col in tableColumns" :key="col" style="margin: 0 4px 4px 0">
                  {{ col }}
                </el-tag>
              </div>

              <!-- 数据表格 -->
              <el-table v-loading="dataLoading" :data="tableData" stripe max-height="400" style="margin-top: 16px">
                <el-table-column v-for="col in tableColumns" :key="col" :prop="col" :label="col" show-overflow-tooltip />
              </el-table>

              <!-- 空状态 -->
              <el-empty v-if="!selectedLocalTable && !dataLoading" description="请选择要查看的数据表" />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 远程数据库标签页 -->
      <el-tab-pane label="远程数据库" name="remote">
        <!-- 远程数据库列表 -->
        <el-table v-loading="remoteLoading" :data="remoteDatabases" stripe style="width: 100%; margin-bottom: 20px">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="dbHost" label="主机地址" />
          <el-table-column prop="dbPort" label="端口" width="80" />
          <el-table-column prop="dbName" label="数据库名" />
          <el-table-column prop="dbUsername" label="用户名" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="handleViewRemote(scope.row)"> 查看数据 </el-button>
              <el-popconfirm title="确定删除该远程数据库配置吗？" @confirm="handleDeleteRemote(scope.row.id)">
                <template #reference>
                  <el-button size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <!-- 远程数据库数据展示 -->
        <el-card v-if="selectedRemoteDb" shadow="hover">
          <template #header>
            <span>{{ selectedRemoteDb.dbName }} - 数据预览</span>
          </template>

          <el-row :gutter="20">
            <!-- 表选择 -->
            <el-col :span="6">
              <el-select
                v-model="selectedRemoteTable"
                placeholder="选择数据表"
                style="width: 100%"
                @change="handleRemoteTableChange"
              >
                <el-option v-for="table in remoteTables" :key="table" :label="table" :value="table" />
              </el-select>
            </el-col>
          </el-row>

          <!-- 远程数据表格 -->
          <el-table v-loading="remoteDataLoading" :data="remoteTableData" stripe max-height="350" style="margin-top: 16px">
            <el-table-column v-for="col in remoteTableColumns" :key="col" :prop="col" :label="col" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 上传SQL文件弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="上传SQL文件" width="500px">
      <el-upload ref="uploadRef" drag accept=".sql" :auto-upload="false" :limit="1" :on-change="handleFileChange">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将SQL文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">只支持 .sql 文件</div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUploadSql">确认上传</el-button>
      </template>
    </el-dialog>

    <!-- 添加远程数据库弹窗 -->
    <el-dialog v-model="remoteDialogVisible" title="添加远程数据库" width="600px">
      <el-form ref="remoteFormRef" :model="remoteForm" :rules="remoteRules" label-width="100px">
        <el-form-item label="主机地址" prop="dbHost">
          <el-input v-model="remoteForm.dbHost" placeholder="例如：192.168.1.100" />
        </el-form-item>
        <el-form-item label="端口" prop="dbPort">
          <el-input-number v-model="remoteForm.dbPort" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="数据库类型" prop="dbType">
          <el-select v-model="remoteForm.dbType" placeholder="请选择数据库类型">
            <el-option label="MySQL" :value="1" />
            <el-option label="PostgreSQL" :value="2" />
            <el-option label="Oracle" :value="3" />
            <el-option label="SQL Server" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据库名" prop="dbName">
          <el-input v-model="remoteForm.dbName" placeholder="数据库名称" />
        </el-form-item>
        <el-form-item label="用户名" prop="dbUsername">
          <el-input v-model="remoteForm.dbUsername" placeholder="连接用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="dbPassword">
          <el-input v-model="remoteForm.dbPassword" type="password" placeholder="连接密码" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="remoteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddRemote">确认添加</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Upload, Connection, Document, Delete, UploadFilled } from "@element-plus/icons-vue";
import axios from "axios";

/* ================ 响应式数据 ================ */
// 标签页
const activeTab = ref("local");

// 本地数据库相关
const localDatabases = ref([]);
const selectedLocalDb = ref("");
const localTables = ref([]);
const selectedLocalTable = ref("");
const tableColumns = ref([]);
const tableData = ref([]);
const dataLoading = ref(false);

// 远程数据库相关
const remoteDatabases = ref([]);
const remoteLoading = ref(false);
const selectedRemoteDb = ref(null);
const remoteTables = ref([]);
const selectedRemoteTable = ref("");
const remoteTableColumns = ref([]);
const remoteTableData = ref([]);
const remoteDataLoading = ref(false);

// 弹窗相关
const uploadDialogVisible = ref(false);
const remoteDialogVisible = ref(false);
const uploadRef = ref(null);
const selectedFile = ref(null);
const remoteFormRef = ref(null);
const remoteForm = ref({
  dbHost: "",
  dbPort: 3306,
  dbType: 1,
  dbName: "",
  dbUsername: "",
  dbPassword: "",
});

// 表单验证规则
const remoteRules = {
  dbHost: [{ required: true, message: "请输入主机地址", trigger: "blur" }],
  dbPort: [{ required: true, message: "请输入端口号", trigger: "blur" }],
  dbType: [{ required: true, message: "请选择数据库类型", trigger: "change" }],
  dbName: [{ required: true, message: "请输入数据库名", trigger: "blur" }],
  dbUsername: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  dbPassword: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

/* ================ 网络请求 ================ */
// 获取本地数据库列表
async function fetchLocalDatabases() {
  try {
    const { data } = await axios.get("/api/data/getLocalDatabases");
    if (data.code === 200) {
      localDatabases.value = data.data || [];
    } else {
      ElMessage.error(data.msg || "获取本地数据库失败");
    }
  } catch (e) {
    ElMessage.error("网络异常：" + e.message);
  }
}

// 获取远程数据库列表
async function fetchRemoteDatabases() {
  remoteLoading.value = true;
  try {
    const { data } = await axios.get("/api/data/getRemoteDatabases");
    if (data.code === 200) {
      remoteDatabases.value = data.data || [];
    } else {
      ElMessage.error(data.msg || "获取远程数据库失败");
    }
  } catch (e) {
    ElMessage.error("网络异常：" + e.message);
  } finally {
    remoteLoading.value = false;
  }
}

// 获取数据表列表
async function fetchTables(dbName, isRemote) {
  try {
    const { data } = await axios.get("/api/data/getAllTables", {
      params: { dbName, isRemote },
    });
    if (data.code === 200) {
      return data.data || [];
    } else {
      ElMessage.error(data.msg || "获取数据表失败");
      return [];
    }
  } catch (e) {
    ElMessage.error("网络异常：" + e.message);
    return [];
  }
}

// 获取表字段
async function fetchColumns(dbName, tbName, isRemote) {
  try {
    const { data } = await axios.get("/api/data/getColumns", {
      params: { dbName, tbName, isRemote },
    });
    if (data.code === 200) {
      return data.data || [];
    } else {
      ElMessage.error(data.msg || "获取字段失败");
      return [];
    }
  } catch (e) {
    ElMessage.error("网络异常：" + e.message);
    return [];
  }
}

// 获取表数据
async function fetchRecords(dbName, tbName, isRemote) {
  try {
    const { data } = await axios.get("/api/data/getRecords", {
      params: { dbName, tbName, isRemote },
    });
    if (data.code === 200) {
      return data.data || [];
    } else {
      ElMessage.error(data.msg || "获取数据失败");
      return [];
    }
  } catch (e) {
    ElMessage.error("网络异常：" + e.message);
    return [];
  }
}

// 删除数据库
async function deleteDatabase(dbName) {
  try {
    const { data } = await axios.delete(`/api/data/dropDatabase/${dbName}`);
    if (data.code === 200) {
      ElMessage.success("删除成功");
      // 清空相关状态
      selectedLocalDb.value = "";
      localTables.value = [];
      selectedLocalTable.value = "";
      tableColumns.value = [];
      tableData.value = [];
      // 刷新数据库列表
      await fetchLocalDatabases();
    } else {
      ElMessage.error(data.msg || "删除失败");
    }
  } catch (e) {
    ElMessage.error("网络异常：" + e.message);
  }
}

// 上传SQL文件
async function uploadSqlFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await axios.post("/api/data/uploadSql", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (data.code === 200) {
      ElMessage.success("SQL文件上传成功");
      uploadDialogVisible.value = false;
      selectedFile.value = null;
      uploadRef.value?.clearFiles();
      // 刷新本地数据库列表
      await fetchLocalDatabases();
    } else {
      ElMessage.error(data.msg || "上传失败");
    }
  } catch (e) {
    ElMessage.error("网络异常：" + e.message);
  }
}

// 添加远程数据库
async function addRemoteDatabase(params) {
  try {
    const { data } = await axios.post("/api/data/addRemoteDatabase", params);
    if (data.code === 200) {
      ElMessage.success("远程数据库添加成功");
      remoteDialogVisible.value = false;
      // 重置表单
      remoteFormRef.value?.resetFields();
      // 刷新远程数据库列表
      await fetchRemoteDatabases();
    } else {
      ElMessage.error(data.msg || "添加失败");
    }
  } catch (e) {
    ElMessage.error("网络异常：" + e.message);
  }
}

// 删除远程数据库
async function deleteRemoteDatabase(id) {
  try {
    const { data } = await axios.delete(`/api/data/deleteRemoteDatabase/${id}`);
    if (data.code === 200) {
      ElMessage.success("删除成功");
      // 清空选中状态
      if (selectedRemoteDb.value?.id === id) {
        selectedRemoteDb.value = null;
        remoteTables.value = [];
        selectedRemoteTable.value = "";
        remoteTableColumns.value = [];
        remoteTableData.value = [];
      }
      await fetchRemoteDatabases();
    } else {
      ElMessage.error(data.msg || "删除失败");
    }
  } catch (e) {
    ElMessage.error("网络异常：" + e.message);
  }
}

/* ================ 事件处理 ================ */
// 刷新
function handleRefresh() {
  if (activeTab.value === "local") {
    fetchLocalDatabases();
  } else {
    fetchRemoteDatabases();
  }
}

// 标签页切换
function handleTabChange() {
  if (activeTab.value === "remote" && remoteDatabases.value.length === 0) {
    fetchRemoteDatabases();
  }
}

// 本地数据库选择变化
async function handleLocalDbChange() {
  localTables.value = [];
  selectedLocalTable.value = "";
  tableColumns.value = [];
  tableData.value = [];

  if (selectedLocalDb.value) {
    localTables.value = await fetchTables(selectedLocalDb.value, false);
  }
}

// 本地表点击
async function handleLocalTableClick(table) {
  selectedLocalTable.value = table;
  dataLoading.value = true;

  try {
    // 获取字段和数据
    const [columns, records] = await Promise.all([
      fetchColumns(selectedLocalDb.value, table, false),
      fetchRecords(selectedLocalDb.value, table, false),
    ]);

    tableColumns.value = columns;
    tableData.value = records;
  } finally {
    dataLoading.value = false;
  }
}

// 删除数据库
function handleDeleteDatabase() {
  deleteDatabase(selectedLocalDb.value);
}

// 文件选择
function handleFileChange(file) {
  selectedFile.value = file.raw;
}

// 上传SQL
function handleUploadSql() {
  if (!selectedFile.value) {
    ElMessage.warning("请选择要上传的SQL文件");
    return;
  }
  uploadSqlFile(selectedFile.value);
}

// 添加远程数据库
function handleAddRemote() {
  remoteFormRef.value?.validate((valid) => {
    if (valid) {
      addRemoteDatabase(remoteForm.value);
    }
  });
}

// 查看远程数据库
async function handleViewRemote(row) {
  selectedRemoteDb.value = row;
  remoteTables.value = [];
  selectedRemoteTable.value = "";
  remoteTableColumns.value = [];
  remoteTableData.value = [];

  // 获取表列表
  remoteTables.value = await fetchTables(row.dbName, true);
}

// 远程表选择变化
async function handleRemoteTableChange() {
  if (!selectedRemoteTable.value || !selectedRemoteDb.value) return;

  remoteDataLoading.value = true;
  try {
    const [columns, records] = await Promise.all([
      fetchColumns(selectedRemoteDb.value.dbName, selectedRemoteTable.value, true),
      fetchRecords(selectedRemoteDb.value.dbName, selectedRemoteTable.value, true),
    ]);

    remoteTableColumns.value = columns;
    remoteTableData.value = records;
  } finally {
    remoteDataLoading.value = false;
  }
}

// 删除远程数据库
function handleDeleteRemote(id) {
  deleteRemoteDatabase(id);
}

// 导出CSV
function handleExportCsv() {
  if (!tableData.value.length || !tableColumns.value.length) {
    ElMessage.warning("没有数据可导出");
    return;
  }

  // 生成CSV
  const header = tableColumns.value.join(",");
  const rows = tableData.value.map((row) => tableColumns.value.map((col) => row[col] ?? "").join(",")).join("\n");
  const csv = `${header}\n${rows}`;

  // 下载
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${selectedLocalDb.value}_${selectedLocalTable.value}.csv`;
  link.click();

  ElMessage.success("导出成功");
}

/* ================ 生命周期 ================ */
onMounted(() => {
  fetchLocalDatabases();
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

  .table-list {
    margin-top: 16px;

    .table-item {
      padding: 8px 12px;
      margin-bottom: 4px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover {
        background-color: #f5f7fa;
      }

      &.active {
        background-color: #ecf5ff;
        color: #409eff;
        font-weight: 500;
      }
    }
  }

  .column-info {
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 16px;
  }
}
</style>
