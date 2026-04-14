<template>
  <div class="timesheet-project-page">
    <header class="page-header safe-area-top">
      <button class="back-btn" @click="router.push('/')">返回</button>
      <div class="header-body">
        <div class="header-title">工时项目</div>
        <div class="header-subtitle">先选项目，再进入详情</div>
      </div>
      <button class="switch-btn" @click="projectDialogVisible = true">新建</button>
    </header>

    <main class="page-main">
      <section class="list-card">
        <div class="section-head">
          <h3>项目列表</h3>
          <div class="section-actions">
            <el-button link @click="projectDialogVisible = true">创建</el-button>
            <el-button link @click="loadProjects">刷新</el-button>
          </div>
        </div>

        <div v-if="projects.length" class="project-list">
          <button
            v-for="project in projects"
            :key="project.id"
            class="project-card"
            @click="openProject(project.id)"
          >
            <div class="project-title-row">
              <strong>{{ project.projectName }}</strong>
              <span :class="['status-badge', project.status === 1 ? 'editing' : 'finished']">
                {{ project.status === 1 ? '编辑中' : '已结束' }}
              </span>
            </div>
            <div class="project-meta">{{ modeText(project.mode) }}</div>
            <div class="project-meta">{{ project.creatorName || project.creatorAccount }}</div>
            <div class="project-meta">创建时间：{{ formatDateTime(project.createTime) }}</div>
            <div v-if="project.status === 2" class="project-meta">结束时间：{{ formatDateTime(project.finishedTime) }}</div>
            <div class="project-remark">{{ project.remark || '暂无项目说明' }}</div>
          </button>
        </div>

        <el-empty v-else description="还没有项目，先创建一个" :image-size="90" />
      </section>
    </main>

    <el-dialog v-model="projectDialogVisible" title="新建项目" width="92%">
      <el-form :model="projectForm" label-position="top">
        <el-form-item label="项目名称">
          <el-input v-model="projectForm.projectName" />
        </el-form-item>
        <el-form-item label="记工模式">
          <el-radio-group v-model="projectForm.mode">
            <el-radio :label="1">签到记工</el-radio>
            <el-radio :label="2">人工记工</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="项目说明">
          <el-input v-model="projectForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateProject">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import { createTimesheetProject, getMyTimesheetProjects, type TimesheetProject } from '../../../api/timesheet'

const router = useRouter()
const projects = ref<TimesheetProject[]>([])
const projectDialogVisible = ref(false)
const projectForm = ref({
  projectName: '',
  mode: 1,
  remark: ''
})

const modeText = (mode: number) => (mode === 1 ? '签到记工' : '人工记工')

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

const loadProjects = async () => {
  projects.value = await getMyTimesheetProjects()
}

const handleCreateProject = async () => {
  if (!projectForm.value.projectName.trim()) {
    message.warning('请输入项目名称')
    return
  }
  const project = await createTimesheetProject(projectForm.value)
  if (!project) return
  projectDialogVisible.value = false
  projectForm.value = { projectName: '', mode: 1, remark: '' }
  await loadProjects()
  router.push(`/timesheet/project/${project.id}`)
}

const openProject = (projectId: number) => {
  router.push(`/timesheet/project/${projectId}`)
}

onMounted(loadProjects)
</script>

<style scoped lang="scss">
.timesheet-project-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.16), transparent 32%),
    linear-gradient(180deg, #f6fbfb 0%, #eef3ff 54%, #f8f7f3 100%);
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(248, 251, 253, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.back-btn,
.switch-btn {
  border: none;
  background: #fff;
  border-radius: 999px;
  padding: 9px 0;
  font-size: 12px;
  color: #0f172a;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.header-body {
  text-align: center;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.header-subtitle {
  font-size: 12px;
  color: #64748b;
}

.page-main {
  padding: 16px 16px calc(28px + env(safe-area-inset-bottom));
}

.list-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20px 45px rgba(30, 41, 59, 0.08);
}

.list-card {
  padding: 16px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.section-head h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-card {
  width: 100%;
  border: none;
  text-align: left;
  border-radius: 20px;
  background: linear-gradient(180deg, #fbfdff, #f4f7fb);
  padding: 16px;
}

.project-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  color: #0f172a;
}

.project-meta,
.project-remark {
  font-size: 12px;
  color: #64748b;
  line-height: 1.7;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.status-badge.editing {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.status-badge.finished {
  background: rgba(100, 116, 139, 0.14);
  color: #475569;
}
</style>
