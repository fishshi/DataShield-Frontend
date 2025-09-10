<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { ElMessage } from "element-plus";
import request from "@/utils/request";
import * as echarts from "echarts";
import formatTime from "@/utils/day";

/* ================ 响应式数据 ================ */
// 图表实例
const identifyChartRef = ref(null);
const taskChartRef = ref(null);
let identifyChart = null;
let taskChart = null;

// 数据
const identifyTasks = ref([]);
const maskTasks = ref([]);
const localDatabases = ref([]);
const remoteDatabases = ref([]);
const recentTasks = ref([]);

// Loading状态
const overviewLoading = ref(false);
const databaseLoading = ref(false);
const recentTasksLoading = ref(false);

// 轮询定时器
let pollTimer = null;
const POLL_INTERVAL = 5000; // 5秒刷新一次

/* ================ 计算属性 ================ */
// 感知任务统计
const identifyStats = computed(() => {
  const stats = { pending: 0, running: 0, completed: 0, failed: 0 };
  identifyTasks.value.forEach(task => {
    switch(task.status) {
      case 0: stats.pending++; break;
      case 1: stats.running++; break;
      case 2: stats.completed++; break;
      case 3: stats.failed++; break;
    }
  });
  return stats;
});

// 脱敏任务统计
const maskStats = computed(() => {
  const stats = { pending: 0, running: 0, completed: 0, failed: 0 };
  maskTasks.value.forEach(task => {
    switch(task.status) {
      case 0: stats.pending++; break;
      case 1: stats.running++; break;
      case 2: stats.completed++; break;
      case 3: stats.failed++; break;
    }
  });
  return stats;
});

// 合并所有任务用于最近任务列表
const allTasks = computed(() => {
  const identify = identifyTasks.value.map(t => ({
    ...t,
    type: 'identify',
    typeName: '敏感感知',
    name: t.identifyName,
    time: t.updateTime || t.createTime
  }));
  
  const mask = maskTasks.value.map(t => ({
    ...t,
    type: 'mask',
    typeName: '数据脱敏',
    name: t.taskName,
    time: t.updateTime || t.createTime
  }));
  
  return [...identify, ...mask]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 10); // 只显示最近10条
});

/* ================ 网络请求 ================ */
// 获取感知任务列表
async function fetchIdentifyTasks() {
  try {
    const data = await request.get("/identify/getAllIdentify");
    identifyTasks.value = data.data || [];
  } catch (e) {
    console.error("获取感知任务失败:", e);
  }
}

// 获取脱敏任务列表
async function fetchMaskTasks() {
  try {
    const data = await request.get("/task/getAllTasks");
    maskTasks.value = data.data || [];
  } catch (e) {
    console.error("获取脱敏任务失败:", e);
  }
}

// 获取本地数据库列表
async function fetchLocalDatabases() {
  try {
    const data = await request.get("/data/getLocalDatabases");
    localDatabases.value = data.data || [];
  } catch (e) {
    console.error("获取本地数据库失败:", e);
  }
}

// 获取远程数据库列表
async function fetchRemoteDatabases() {
  try {
    const data = await request.get("/data/getRemoteDatabases");
    remoteDatabases.value = data.data || [];
  } catch (e) {
    console.error("获取远程数据库失败:", e);
  }
}

// 刷新所有数据
async function refreshAll() {
  overviewLoading.value = true;
  databaseLoading.value = true;
  recentTasksLoading.value = true;
  
  try {
    await Promise.all([
      fetchIdentifyTasks(),
      fetchMaskTasks(),
      fetchLocalDatabases(),
      fetchRemoteDatabases()
    ]);
    
    // 更新图表
    updateCharts();
  } finally {
    overviewLoading.value = false;
    databaseLoading.value = false;
    recentTasksLoading.value = false;
  }
}

/* ================ 图表相关 ================ */
// 初始化图表
function initCharts() {
  // 感知任务图表
  if (identifyChartRef.value) {
    identifyChart = echarts.init(identifyChartRef.value);
    identifyChart.setOption(getChartOption('感知任务状态', identifyStats.value));
  }
  
  // 脱敏任务图表
  if (taskChartRef.value) {
    taskChart = echarts.init(taskChartRef.value);
    taskChart.setOption(getChartOption('脱敏任务状态', maskStats.value));
  }
  
  // 响应窗口大小变化
  window.addEventListener('resize', handleResize);
}

// 更新图表
function updateCharts() {
  if (identifyChart) {
    identifyChart.setOption(getChartOption('感知任务状态', identifyStats.value));
  }
  if (taskChart) {
    taskChart.setOption(getChartOption('脱敏任务状态', maskStats.value));
  }
}

// 获取图表配置
function getChartOption(title, stats) {
  const data = [
    { value: stats.pending, name: '未开始', itemStyle: { color: '#909399' } },
    { value: stats.running, name: '进行中', itemStyle: { color: '#E6A23C' } },
    { value: stats.completed, name: '已完成', itemStyle: { color: '#67C23A' } },
    { value: stats.failed, name: '失败', itemStyle: { color: '#F56C6C' } }
  ].filter(item => item.value > 0); // 过滤掉值为0的项
  
  return {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 40
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '60%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.length > 0 ? data : [{ value: 1, name: '暂无任务', itemStyle: { color: '#f0f0f0' } }]
      }
    ]
  };
}

// 处理窗口大小变化
function handleResize() {
  identifyChart?.resize();
  taskChart?.resize();
}

/* ================ 工具函数 ================ */
// 状态文本
function statusText(status) {
  const map = { 0: '未开始', 1: '进行中', 2: '已完成', 3: '失败' };
  return map[status] || '未知';
}

// 状态颜色
function statusType(status) {
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' };
  return map[status] || 'info';
}

// 数据库类型
function dbTypeText(type) {
  const map = { 1: 'MySQL', 2: 'PostgreSQL', 3: 'Oracle', 4: 'SQL Server' };
  return map[type] || 'Unknown';
}

/* ================ 轮询相关 ================ */
// 开始轮询
function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    refreshAll();
  }, POLL_INTERVAL);
}

// 停止轮询
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/* ================ 生命周期 ================ */
onMounted(async () => {
  await refreshAll();
  // 延迟初始化图表，确保DOM已渲染
  setTimeout(() => {
    initCharts();
  }, 100);
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
  window.removeEventListener('resize', handleResize);
  identifyChart?.dispose();
  taskChart?.dispose();
});
</script>

<template>
  <div class="dashboard-container">
    <!-- 顶部区域 -->
    <el-row :gutter="20" class="top-section">
      <!-- 左上角：任务总览 -->
      <el-col :span="12">
        <el-card class="overview-card" v-loading="overviewLoading">
          <template #header>
            <div class="card-header">
              <span>任务总览</span>
              <el-button text type="primary" @click="refreshAll">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </template>
          
          <div class="charts-container">
            <!-- 感知任务饼图 -->
            <div class="chart-wrapper">
              <div ref="identifyChartRef" class="chart"></div>
              <div class="chart-summary">
                <div class="summary-item">
                  <span>总计</span>
                  <span class="count">{{ identifyTasks.length }}</span>
                </div>
              </div>
            </div>
            
            <!-- 脱敏任务饼图 -->
            <div class="chart-wrapper">
              <div ref="taskChartRef" class="chart"></div>
              <div class="chart-summary">
                <div class="summary-item">
                  <span>总计</span>
                  <span class="count">{{ maskTasks.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右上角：数据库列表 -->
      <el-col :span="12">
        <el-card class="database-card" v-loading="databaseLoading">
          <template #header>
            <div class="card-header">
              <span>已托管数据库</span>
              <el-tag type="info" size="small">
                共 {{ localDatabases.length + remoteDatabases.length }} 个
              </el-tag>
            </div>
          </template>
          
          <div class="database-list">
            <!-- 本地数据库 -->
            <div v-if="localDatabases.length > 0" class="db-section">
              <div class="section-title">
                <el-icon><Folder /></el-icon>
                <span>本地数据库</span>
              </div>
              <div class="db-items">
                <div v-for="db in localDatabases" :key="db" class="db-item">
                  <el-icon><Database /></el-icon>
                  <span class="db-name">{{ db }}</span>
                  <el-tag size="small" type="success">本地</el-tag>
                </div>
              </div>
            </div>
            
            <!-- 远程数据库 -->
            <div v-if="remoteDatabases.length > 0" class="db-section">
              <div class="section-title">
                <el-icon><Connection /></el-icon>
                <span>远程数据库</span>
              </div>
              <div class="db-items">
                <div v-for="db in remoteDatabases" :key="db.id" class="db-item">
                  <el-icon><Database /></el-icon>
                  <span class="db-name">{{ db.dbName }}</span>
                  <el-tag size="small">{{ dbTypeText(db.dbType) }}</el-tag>
                  <span class="db-host">{{ db.dbHost }}:{{ db.dbPort }}</span>
                </div>
              </div>
            </div>
            
            <!-- 空状态 -->
            <el-empty v-if="localDatabases.length === 0 && remoteDatabases.length === 0" 
                      description="暂无数据库" 
                      :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 底部区域：最近运行任务 -->
    <el-card class="recent-tasks-card" v-loading="recentTasksLoading">
      <template #header>
        <div class="card-header">
          <span>最近运行任务</span>
          <div class="header-right">
            <el-tag v-if="allTasks.length > 0" size="small">
              最近 {{ allTasks.length }} 条记录
            </el-tag>
          </div>
        </div>
      </template>
      
      <el-table :data="allTasks" stripe style="width: 100%">
        <el-table-column prop="typeName" label="任务类型" width="100">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.type === 'identify' ? 'primary' : 'warning'">
              {{ scope.row.typeName }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="任务名称" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="dbName" label="数据库" width="150" show-overflow-tooltip />
        
        <el-table-column prop="tbName" label="数据表" width="150" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.tbName || scope.row.dbTable || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="90">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)" size="small">
              {{ statusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="time" label="最后更新" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.time) || '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .top-section {
    flex-shrink: 0;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
  
  // 任务总览卡片
  .overview-card {
    height: 420px;
    
    .charts-container {
      display: flex;
      justify-content: space-around;
      height: 320px;
      
      .chart-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .chart {
          width: 100%;
          height: 280px;
        }
        
        .chart-summary {
          margin-top: 10px;
          
          .summary-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #666;
            font-size: 14px;
            
            .count {
              font-size: 20px;
              font-weight: bold;
              color: #409eff;
            }
          }
        }
      }
    }
  }
  
  // 数据库列表卡片
  .database-card {
    height: 420px;
    
    .database-list {
      max-height: 320px;
      overflow-y: auto;
      
      .db-section {
        margin-bottom: 20px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ebeef5;
          color: #606266;
          font-size: 14px;
          font-weight: 500;
        }
        
        .db-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          .db-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f5f7fa;
            border-radius: 4px;
            transition: all 0.3s;
            
            &:hover {
              background: #ecf5ff;
            }
            
            .db-name {
              flex: 1;
              font-weight: 500;
              color: #303133;
            }
            
            .db-host {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }
  }
  
  // 最近任务卡片
  .recent-tasks-card {
    flex: 1;
    min-height: 300px;
  }
}

// 滚动条样式
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
  
  &:hover {
    background: #909399;
  }
}
</style>