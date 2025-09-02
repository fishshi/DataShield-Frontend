<template>
  <el-card class="page-container">
    <!-- 1. 顶部标题 + 操作按钮 -->
    <template #header>
      <div class="card-header">
        <span>脱敏任务管理</span>
        <div>
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
          <el-button type="success" @click="handleCreate">
            <el-icon><Plus /></el-icon> 新建任务
          </el-button>
        </div>
      </div>
    </template>

    <!-- 2. 任务列表 -->
    <el-table
      v-loading="tableLoading"
      :data="taskList"
      stripe
      style="width: 100%; margin-bottom: 20px"
    >
      <el-table-column prop="id" label="任务ID" width="80" />
      <el-table-column prop="taskName" label="任务名称" />
      <el-table-column prop="dbName" label="数据库" />
      <el-table-column prop="tbName" label="数据表" />
      <el-table-column prop="fields" label="脱敏字段">
        <template #default="scope">
          <el-tag
            v-for="f in scope.row.fields"
            :key="f"
            size="small"
            style="margin-right: 4px"
          >
            {{ f }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="strategy" label="策略" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="scope">
          <el-tag :type="statusColor(scope.row.status)">
            {{ statusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">
            查看结果
          </el-button>
          <el-button size="small" type="primary" @click="handleDownload(scope.row)">
            下载
          </el-button>
          <el-popconfirm
            title="确定删除该任务吗？"
            @confirm="handleDelete(scope.row.id)"
          >
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 3. 任务结果弹窗 -->
    <el-dialog
      v-model="resultVisible"
      title="任务结果"
      width="70%"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务名称">
          {{ currentTask?.taskName }}
        </el-descriptions-item>
        <el-descriptions-item label="目标表">
          {{ currentTask?.targetTable || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="最后修改">
          {{ currentTask?.updateTime || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 结果数据表格 -->
      <el-table
        v-loading="resultLoading"
        :data="resultData"
        height="400"
        stripe
        style="margin-top: 16px"
      >
        <el-table-column
          v-for="col in resultColumns"
          :key="col"
          :prop="col"
          :label="col"
        />
      </el-table>
    </el-dialog>
  </el-card>
</template>

<script setup>
/* ---------------- 依赖引入 ---------------- */
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import axios from 'axios'

/* ---------------- 响应式数据 ---------------- */
// 任务列表
const taskList = ref([])
// 表格 Loading
const tableLoading = ref(false)
// 结果弹窗显隐
const resultVisible = ref(false)
// 当前查看的任务
const currentTask = ref(null)
// 结果数据
const resultData = ref([])
// 结果字段
const resultColumns = ref([])
// 结果 Loading
const resultLoading = ref(false)

/* ---------------- 工具函数 ---------------- */
// 状态码 → 中文
function statusText(status) {
  const map = {
    0: '待执行',
    1: '执行中',
    2: '已完成',
    3: '失败'
  }
  return map[status] || '未知'
}
// 状态码 → 颜色
function statusColor(status) {
  const map = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return map[status] || 'info'
}

/* ---------------- 网络请求 ---------------- */
// 获取全部任务
async function fetchTasks() {
  tableLoading.value = true
  try {
    const { data } = await axios.get('/task/getAllTasks')
    if (data.code === 200) {
      // 接口返回字段略有差异，做一层适配
      taskList.value = data.data.map(item => ({
        id: item.id,
        taskName: item.taskName,
        dbName: item.dbName,
        tbName: item.tbName,
        fields: item.fields || [],
        strategy: item.strategy,
        status: item.status,
        targetTable: item.targetTable
      }))
    } else {
      ElMessage.error(data.msg || '获取任务列表失败')
    }
  } catch (e) {
    ElMessage.error('网络异常：' + e.message)
  } finally {
    tableLoading.value = false
  }
}

// 删除任务
async function deleteTask(id) {
  try {
    const { data } = await axios.delete(`/task/deleteTask/${id}`)
    if (data.code === 200) {
      ElMessage.success('删除成功')
      fetchTasks()
    } else {
      ElMessage.error(data.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error('网络异常：' + e.message)
  }
}

// 查看任务结果：先查列 → 查数据
async function viewResult(task) {
  resultVisible.value = true
  currentTask.value = task
  resultLoading.value = true
  try {
    // 1. 查列
    const { data: colRes } = await axios.get('/data/getColumns', {
      params: {
        dbName: task.dbName,
        tbName: task.targetTable,
        // 任务结果默认落在本地库
        isRemote: false
      }
    })
    if (colRes.code !== 200) throw new Error(colRes.msg || '获取列失败')
    resultColumns.value = colRes.data

    // 2. 查数据
    const { data: recordRes } = await axios.get('/data/getRecords', {
      params: {
        dbName: task.dbName,
        tbName: task.targetTable,
        isRemote: false
      }
    })
    if (recordRes.code !== 200) throw new Error(recordRes.msg || '获取数据失败')
    resultData.value = recordRes.data
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    resultLoading.value = false
  }
}

// 下载结果：先查数据 → 前端导出 CSV
async function downloadResult(task) {
  try {
    // 复用查看结果逻辑
    const [{ data: colRes }, { data: recordRes }] = await Promise.all([
      axios.get('/data/getColumns', {
        params: { dbName: task.dbName, tbName: task.targetTable, isRemote: false }
      }),
      axios.get('/data/getRecords', {
        params: { dbName: task.dbName, tbName: task.targetTable, isRemote: false }
      })
    ])
    if (colRes.code !== 200 || recordRes.code !== 200) {
      throw new Error(colRes.msg || recordRes.msg || '下载失败')
    }
    const columns = colRes.data
    const rows = recordRes.data
    // 组装 CSV
    const header = columns.join(',')
    const body = rows.map(r => columns.map(c => r[c] ?? '').join(',')).join('\n')
    const csv = `${header}\n${body}`
    // 下载
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${task.taskName}_${task.targetTable}.csv`
    link.click()
    ElMessage.success('下载成功')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

/* ---------------- 事件处理 ---------------- */
// 刷新
function handleRefresh() {
  fetchTasks()
}
// 新建任务（后续跳路由 or 弹窗，这里留好钩子）
function handleCreate() {
  // TODO: 跳转到 /task/create 或弹窗
  ElMessage.info('请实现新建任务页面')
}
// 查看
function handleView(row) {
  viewResult(row)
}
// 下载
function handleDownload(row) {
  downloadResult(row)
}
// 删除
function handleDelete(id) {
  deleteTask(id)
}

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  fetchTasks()
})
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