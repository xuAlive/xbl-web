<template>
  <div class="timesheet-page xbl-app-page xbl-app-page--timesheet">
    <el-card class="hero-card">
      <div class="hero-head">
        <div>
          <h2 class="hero-title">工时记录系统</h2>
          <p class="hero-desc">项目建档、成员管理、签到补签、人工记工、重复结算和薪资换算都在这一页完成。</p>
        </div>
        <div class="hero-actions">
          <el-button @click="goBack" plain>返回小程序</el-button>
          <el-button type="primary" @click="projectDialogVisible = true">新建项目</el-button>
        </div>
      </div>
    </el-card>

    <div class="workspace">
      <el-card class="sidebar-card">
        <template #header>
          <div class="card-header">
            <span>我的项目</span>
            <el-button type="primary" link @click="loadProjects">刷新</el-button>
          </div>
        </template>

        <div class="project-list" v-loading="projectLoading">
          <div
            v-for="project in projects"
            :key="project.id"
            :class="['project-item', { active: activeProjectId === project.id }]"
            @click="selectProject(project.id)"
          >
            <div class="project-item-head">
              <span class="project-name">{{ project.projectName }}</span>
              <el-tag :type="project.status === 1 ? 'success' : 'info'" size="small">
                {{ project.status === 1 ? '编辑中' : '已结束' }}
              </el-tag>
            </div>
            <div class="project-meta">
              <span>{{ modeText(project.mode) }}</span>
              <span>{{ project.creatorName || project.creatorAccount }}</span>
            </div>
          </div>

          <el-empty v-if="!projectLoading && projects.length === 0" description="还没有项目" :image-size="70" />
        </div>
      </el-card>

      <div class="main-panel">
        <el-empty v-if="!activeProject" description="请选择左侧项目，或先新建一个项目" :image-size="100" />

        <template v-else>
          <el-card class="summary-card" v-loading="detailLoading">
            <div class="summary-top">
              <div>
                <div class="summary-title-row">
                  <h3>{{ activeProject.projectName }}</h3>
                  <el-tag :type="activeProject.mode === 1 ? 'warning' : 'primary'">
                    {{ modeText(activeProject.mode) }}
                  </el-tag>
                  <el-tag :type="activeProject.status === 1 ? 'success' : 'info'">
                    {{ activeProject.status === 1 ? '编辑中' : '已结束' }}
                  </el-tag>
                </div>
                <div class="summary-desc-wrap">
                  <p class="summary-desc">{{ activeProject.remark || '暂无项目说明' }}</p>
                  <el-button link type="primary" class="summary-detail-link" @click="projectInfoDialogVisible = true">
                    查看项目详情
                  </el-button>
                </div>
              </div>
              <div class="summary-actions">
                <el-radio-group v-model="activeTab">
                  <el-radio-button label="overview">概览</el-radio-button>
                  <el-radio-button label="record">记工</el-radio-button>
                  <el-radio-button label="settlement">结算</el-radio-button>
                </el-radio-group>
                <el-button
                  v-if="canManageProject"
                  type="danger"
                  plain
                  :disabled="activeProject.status !== 2"
                  @click="handleDeleteProject"
                >
                  删除项目
                </el-button>
              </div>
            </div>

            <div class="summary-metrics">
              <div class="metric-box">
                <div class="metric-label">创建者</div>
                <div class="metric-value">{{ activeProject.creatorName || activeProject.creatorAccount }}</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">项目成员</div>
                <div class="metric-value">{{ activeMembers.length }}</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">结算次数</div>
                <div class="metric-value">{{ settlements.length }}</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">当前用户</div>
                <div class="metric-value">{{ displayName }}</div>
              </div>
            </div>
          </el-card>

          <template v-if="activeTab === 'overview'">
            <div class="grid-two overview-panel">
              <el-card class="members-card">
                <template #header>
                  <div class="card-header">
                    <span>项目成员</span>
                    <el-button v-if="canManageProject" type="primary" link @click="memberDialogVisible = true">添加成员</el-button>
                  </div>
                </template>

                <div class="panel-scroll">
                  <el-table :data="activeMembers" size="small" height="360">
                    <el-table-column prop="memberName" label="姓名" min-width="120" />
                    <el-table-column prop="memberAccount" label="账号" min-width="140" />
                    <el-table-column prop="memberPhone" label="手机号" min-width="130" />
                    <el-table-column prop="joinTime" label="加入时间" min-width="180" />
                    <el-table-column v-if="canManageProject" label="操作" width="90">
                      <template #default="{ row }">
                        <el-button
                          type="danger"
                          link
                          size="small"
                          :disabled="row.memberAccount === activeProject.creatorAccount"
                          @click="handleRemoveMember(row.id)"
                        >
                          移除
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>

              <el-card class="settlement-list-card">
                <template #header>
                  <div class="card-header">
                    <span>历史结算</span>
                    <el-button type="primary" link @click="loadSettlements">刷新</el-button>
                  </div>
                </template>

                <div class="panel-scroll">
                  <el-table :data="settlements" size="small" height="360" @row-click="handlePickSettlement">
                    <el-table-column prop="settlementNo" label="结算单号" min-width="180" />
                    <el-table-column label="类型" width="110">
                      <template #default="{ row }">{{ settlementTypeText(row.settlementType) }}</template>
                    </el-table-column>
                    <el-table-column prop="totalWorkUnits" label="总工数" width="100" />
                    <el-table-column prop="totalSalary" label="总薪资" width="110" />
                  </el-table>
                </div>
              </el-card>
            </div>
          </template>

          <template v-if="activeTab === 'record'">
            <el-card v-if="activeProject.mode === 1" class="record-card record-panel">
              <template #header>
                <div class="card-header">
                  <span>签到记工</span>
                  <span class="tip-text">4 小时内算半工，超过 4 小时算 1 工</span>
                </div>
              </template>

              <div class="action-row">
                <el-button type="success" :disabled="activeProject.status !== 1" @click="handleSign(1)">签到</el-button>
                <el-button type="warning" :disabled="activeProject.status !== 1" @click="handleSign(2)">离班签到</el-button>
                <el-button :disabled="activeProject.status !== 1" @click="makeupDialogVisible = true">申请补签</el-button>
                <el-button @click="loadAttendanceData">刷新</el-button>
              </div>

              <div class="record-table-section">
              <el-table :data="attendanceRecords" size="small" height="100%">
                <el-table-column prop="memberName" label="成员" min-width="120" />
                <el-table-column prop="workDate" label="日期" width="120" />
                <el-table-column prop="signInTime" label="签到时间" min-width="170" />
                <el-table-column prop="signOutTime" label="离班时间" min-width="170" />
                <el-table-column prop="workHours" label="工时" width="90" />
                <el-table-column prop="workUnits" label="工数" width="90" />
                <el-table-column label="状态" width="120">
                  <template #default="{ row }">{{ attendanceStatusText(row.recordStatus) }}</template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" min-width="160" />
              </el-table>
              </div>

              <div class="subsection-title">补签审批</div>
              <div class="record-table-section record-table-section--compact">
              <el-table :data="makeupRequests" size="small" height="100%">
                <el-table-column prop="memberName" label="成员" min-width="120" />
                <el-table-column prop="workDate" label="日期" width="120" />
                <el-table-column prop="makeupSignInTime" label="补签到" min-width="170" />
                <el-table-column prop="makeupSignOutTime" label="补离班" min-width="170" />
                <el-table-column label="审批状态" width="100">
                  <template #default="{ row }">{{ makeupStatusText(row.approvalStatus) }}</template>
                </el-table-column>
                <el-table-column prop="reason" label="原因" min-width="180" />
                <el-table-column v-if="canManageProject" label="操作" width="160">
                  <template #default="{ row }">
                    <el-button v-if="row.approvalStatus === 1" type="success" link size="small" @click="handleApproveMakeup(row.id, 2)">通过</el-button>
                    <el-button v-if="row.approvalStatus === 1" type="danger" link size="small" @click="handleApproveMakeup(row.id, 3)">拒绝</el-button>
                  </template>
                </el-table-column>
              </el-table>
              </div>
            </el-card>

            <el-card v-else class="record-card record-panel">
              <template #header>
                <div class="record-header">
                  <div>
                    <span>人工记工</span>
                    <span class="tip-text">项目创建者按天维护成员工数，只支持 0 / 0.5 / 1 工</span>
                  </div>
                  <div class="manual-toolbar">
                    <el-date-picker
                      v-model="manualWorkDate"
                      type="date"
                      value-format="YYYY-MM-DD"
                      format="YYYY-MM-DD"
                      placeholder="选择记工日期"
                    />
                    <el-button type="primary" :disabled="!canManageProject || activeProject.status !== 1" @click="handleSaveManualWorklog">保存当天记工</el-button>
                    <el-button @click="loadManualData">刷新</el-button>
                  </div>
                </div>
              </template>

              <div class="panel-scroll panel-scroll--tall">
                <el-table :data="manualEditorRows" size="small">
                  <el-table-column prop="memberName" label="成员" min-width="120" />
                  <el-table-column prop="memberAccount" label="账号" min-width="140" />
                  <el-table-column prop="memberPhone" label="手机号" min-width="140">
                    <template #default="{ row }">{{ activeMembers.find(item => item.id === row.memberId)?.memberPhone || '-' }}</template>
                  </el-table-column>
                  <el-table-column label="工数" width="160">
                    <template #default="{ row }">
                      <el-select v-model="row.workUnits" :disabled="!canManageProject || activeProject.status !== 1">
                        <el-option :value="0" label="0 工" />
                        <el-option :value="0.5" label="0.5 工" />
                        <el-option :value="1" label="1 工" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="备注" min-width="220">
                    <template #default="{ row }">
                      <el-input v-model="row.remark" :disabled="!canManageProject || activeProject.status !== 1" placeholder="备注" />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </template>

          <template v-if="activeTab === 'settlement'">
            <el-card class="settlement-card settlement-panel">
              <template #header>
                <div class="card-header">
                  <span>项目结算</span>
                  <span class="tip-text">支持单人、批量和项目结束结算。重复结算会保留多次记录。</span>
                </div>
              </template>

              <div class="settlement-toolbar">
                <el-select v-model="selectedMemberIds" multiple collapse-tags placeholder="选择结算成员" style="width: 320px;">
                  <el-option v-for="member in activeMembers" :key="member.id" :label="member.memberName" :value="member.id" />
                </el-select>
                <el-input-number v-model="settlementUnitSalary" :min="0" :precision="2" placeholder="每工薪资" />
                <el-button type="primary" :disabled="!canManageProject" @click="handleCreateSettlement">立即结算</el-button>
                <el-button type="danger" :disabled="!canManageProject || activeProject.status !== 1" @click="handleFinishProject">结束项目并结算</el-button>
              </div>

              <div class="record-table-section record-table-section--compact">
              <el-table :data="settlements" size="small" height="100%" @row-click="handlePickSettlement">
                <el-table-column prop="settlementNo" label="结算单号" min-width="180" />
                <el-table-column label="类型" width="110">
                  <template #default="{ row }">{{ settlementTypeText(row.settlementType) }}</template>
                </el-table-column>
                <el-table-column prop="itemCount" label="明细数" width="90" />
                <el-table-column prop="totalWorkHours" label="总工时" width="100" />
                <el-table-column prop="totalWorkUnits" label="总工数" width="100" />
                <el-table-column prop="totalSalary" label="总薪资" width="110" />
                <el-table-column prop="createTime" label="结算时间" min-width="170" />
              </el-table>
              </div>

              <div v-if="selectedSettlementDetail" class="detail-panel">
                <div class="detail-head">
                  <h4>结算详情</h4>
                  <div class="detail-actions">
                    <el-input-number v-model="salaryCalcUnit" :min="0" :precision="2" placeholder="每工薪资" />
                    <el-button type="success" @click="handleCalcSalary">重新计算薪资</el-button>
                  </div>
                </div>

                <div class="record-table-section record-table-section--compact">
                <el-table :data="selectedSettlementDetail.memberSummaries" size="small" height="100%">
                  <el-table-column prop="memberName" label="成员" min-width="120" />
                  <el-table-column prop="totalWorkHours" label="工时" width="90" />
                  <el-table-column prop="totalWorkUnits" label="工数" width="90" />
                  <el-table-column prop="unitSalary" label="单价" width="90" />
                  <el-table-column prop="totalSalary" label="薪资" width="100" />
                </el-table>
                </div>

                <div class="subsection-title">本次结算明细</div>
                <div class="record-table-section">
                <el-table :data="selectedSettlementDetail.items" size="small" height="100%">
                  <el-table-column prop="memberName" label="成员" min-width="120" />
                  <el-table-column prop="workDate" label="日期" width="120" />
                  <el-table-column prop="workHours" label="工时" width="90" />
                  <el-table-column prop="workUnits" label="工数" width="90" />
                  <el-table-column label="来源" width="100">
                    <template #default="{ row }">{{ row.sourceMode === 1 ? '签到' : '人工' }}</template>
                  </el-table-column>
                  <el-table-column prop="salaryAmount" label="薪资" width="100" />
                  <el-table-column prop="remark" label="备注" min-width="160" />
                </el-table>
                </div>
              </div>
            </el-card>
          </template>
        </template>
      </div>
    </div>

    <el-dialog v-model="projectDialogVisible" title="新建项目" width="460px">
      <el-form :model="projectForm" label-width="90px">
        <el-form-item label="项目名称">
          <el-input v-model="projectForm.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="记工模式">
          <el-radio-group v-model="projectForm.mode">
            <el-radio :label="1">签到记工</el-radio>
            <el-radio :label="2">人工记工</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="项目说明">
          <el-input v-model="projectForm.remark" type="textarea" :rows="3" placeholder="项目说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateProject">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="memberDialogVisible" title="添加成员" width="420px">
        <el-form :model="memberForm" label-width="90px">
          <el-form-item label="成员账号">
          <el-input
            v-model="memberForm.memberAccount"
            :placeholder="activeProject?.mode === 2 ? '人工记工模式可不填账号' : '请输入成员账号'"
          />
        </el-form-item>
        <el-form-item label="成员姓名">
          <el-input v-model="memberForm.memberName" placeholder="请输入成员姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="memberForm.memberPhone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddMember">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="makeupDialogVisible" title="申请补签" width="520px">
      <el-form :model="makeupForm" label-width="100px">
        <el-form-item label="工时日期">
          <el-date-picker v-model="makeupForm.workDate" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="补签到时间">
          <el-date-picker v-model="makeupForm.signInTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="补离班时间">
          <el-date-picker v-model="makeupForm.signOutTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="补签原因">
          <el-input v-model="makeupForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="makeupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateMakeup">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="projectInfoDialogVisible" title="项目详情" width="620px">
      <div v-if="activeProject" class="project-info-dialog">
        <div class="project-info-grid">
          <div class="project-info-item">
            <span class="project-info-label">项目名称</span>
            <span class="project-info-value">{{ activeProject.projectName }}</span>
          </div>
          <div class="project-info-item">
            <span class="project-info-label">创建者</span>
            <span class="project-info-value">{{ activeProject.creatorName || activeProject.creatorAccount }}</span>
          </div>
          <div class="project-info-item">
            <span class="project-info-label">记工模式</span>
            <span class="project-info-value">{{ modeText(activeProject.mode) }}</span>
          </div>
          <div class="project-info-item">
            <span class="project-info-label">项目状态</span>
            <span class="project-info-value">{{ activeProject.status === 1 ? '编辑中' : '已结束' }}</span>
          </div>
          <div class="project-info-item">
            <span class="project-info-label">项目成员</span>
            <span class="project-info-value">{{ activeMembers.length }} 人</span>
          </div>
          <div class="project-info-item">
            <span class="project-info-label">结算次数</span>
            <span class="project-info-value">{{ settlements.length }} 次</span>
          </div>
        </div>
        <div class="project-info-section">
          <div class="project-info-label">项目说明</div>
          <div class="project-info-remark">{{ activeProject.remark || '暂无项目说明' }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import { confirm } from '@/shared/ui/confirm'
import { getAccount, getDisplayName } from '../../utils/userInfo'
import {
  addTimesheetMember,
  approveMakeupRequest,
  calcSettlementSalary,
  createMakeupRequest,
  createSettlement,
  createTimesheetProject,
  deleteTimesheetProject,
  finishProjectSettlement,
  getAttendanceList,
  getMakeupRequestList,
  getManualWorklogList,
  getMyTimesheetProjects,
  getSettlementDetail,
  getSettlementList,
  getTimesheetProjectDetail,
  removeTimesheetMember,
  saveManualWorklog,
  signAttendance,
  type AttendanceRecord,
  type MakeupRequest,
  type ManualWorklog,
  type ProjectDetail,
  type ProjectMember,
  type Settlement,
  type SettlementDetail,
  type TimesheetProject
} from '../../api/timesheet'

const router = useRouter()
const currentAccount = getAccount()
const displayName = getDisplayName()

const projectLoading = ref(false)
const detailLoading = ref(false)
const projects = ref<TimesheetProject[]>([])
const projectDetail = ref<ProjectDetail | null>(null)
const activeProjectId = ref<number | null>(null)
const activeTab = ref('overview')

const attendanceRecords = ref<AttendanceRecord[]>([])
const makeupRequests = ref<MakeupRequest[]>([])
const manualRecords = ref<ManualWorklog[]>([])
const settlements = ref<Settlement[]>([])
const selectedSettlementDetail = ref<SettlementDetail | null>(null)

const projectDialogVisible = ref(false)
const memberDialogVisible = ref(false)
const makeupDialogVisible = ref(false)
const projectInfoDialogVisible = ref(false)

const projectForm = ref({
  projectName: '',
  mode: 1,
  remark: ''
})

const memberForm = ref({
  memberAccount: '',
  memberName: '',
  memberPhone: ''
})

const makeupForm = ref({
  workDate: '',
  signInTime: '',
  signOutTime: '',
  reason: ''
})

const manualWorkDate = ref(today())
const manualEditorRows = ref<Array<{ memberId: number; memberAccount: string; memberName: string; workUnits: number; remark: string }>>([])
const selectedMemberIds = ref<number[]>([])
const settlementUnitSalary = ref<number | null>(null)
const salaryCalcUnit = ref<number>(0)

const activeProject = computed(() => projectDetail.value?.project || null)
const activeMembers = computed<ProjectMember[]>(() => projectDetail.value?.members || [])
const canManageProject = computed(() => activeProject.value?.creatorAccount === currentAccount)

const modeText = (mode: number) => mode === 1 ? '签到记工' : '人工记工'
const settlementTypeText = (type: number) => ({ 1: '单人结算', 2: '批量结算', 3: '结束结算' }[type] || '未知')
const attendanceStatusText = (status: number) => ({ 1: '待离班', 2: '已完成', 3: '补签通过' }[status] || '未知')
const makeupStatusText = (status: number) => ({ 1: '待审批', 2: '已通过', 3: '已拒绝' }[status] || '未知')

function today() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const goBack = () => {
  if (window.location.pathname.includes('/wechat/')) {
    router.push('/')
    return
  }
  router.push('/index/miniapp')
}

const loadProjects = async () => {
  projectLoading.value = true
  projects.value = await getMyTimesheetProjects()
  projectLoading.value = false
  if (!activeProjectId.value && projects.value.length > 0) {
    await selectProject(projects.value[0].id)
  } else if (activeProjectId.value && !projects.value.some(item => item.id === activeProjectId.value)) {
    activeProjectId.value = null
    projectDetail.value = null
  }
}

const buildManualEditorRows = () => {
  manualEditorRows.value = activeMembers.value.map(member => {
    const record = manualRecords.value.find(item => item.memberId === member.id && item.workDate === manualWorkDate.value)
    return {
      memberId: member.id,
      memberAccount: member.memberAccount || '-',
      memberName: member.memberName,
      workUnits: Number(record?.workUnits || 0),
      remark: record?.remark || ''
    }
  })
}

const loadProjectDetail = async () => {
  if (!activeProjectId.value) return
  detailLoading.value = true
  projectDetail.value = await getTimesheetProjectDetail(activeProjectId.value)
  detailLoading.value = false
}

const loadAttendanceData = async () => {
  if (!activeProjectId.value) return
  attendanceRecords.value = await getAttendanceList(activeProjectId.value)
  makeupRequests.value = await getMakeupRequestList(activeProjectId.value)
}

const loadManualData = async () => {
  if (!activeProjectId.value) return
  manualRecords.value = await getManualWorklogList(activeProjectId.value)
  buildManualEditorRows()
}

const loadSettlements = async () => {
  if (!activeProjectId.value) return
  settlements.value = await getSettlementList(activeProjectId.value)
}

const selectProject = async (projectId: number) => {
  activeProjectId.value = projectId
  selectedSettlementDetail.value = null
  await loadProjectDetail()
  if (activeProject.value?.mode === 1) {
    await loadAttendanceData()
  } else {
    await loadManualData()
  }
  await loadSettlements()
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
  await selectProject(project.id)
}

const handleAddMember = async () => {
  if (!activeProject.value) return
  const account = memberForm.value.memberAccount.trim()
  if (!memberForm.value.memberName.trim() || !memberForm.value.memberPhone.trim()) {
    message.warning('请填写成员姓名和手机号')
    return
  }
  if (activeProject.value.mode === 1 && !account) {
    message.warning('签到记工模式必须填写成员账号')
    return
  }
  const success = await addTimesheetMember({
    projectId: activeProject.value.id,
    memberAccount: account || undefined,
    memberName: memberForm.value.memberName.trim(),
    memberPhone: memberForm.value.memberPhone.trim()
  })
  if (!success) return
  memberDialogVisible.value = false
  memberForm.value = { memberAccount: '', memberName: '', memberPhone: '' }
  await loadProjectDetail()
  buildManualEditorRows()
}

const handleRemoveMember = async (memberId: number) => {
  if (!activeProject.value) return
  if (!(await confirm({ message: '确定移除该成员吗？', confirmText: '删除' }))) return
  const success = await removeTimesheetMember(activeProject.value.id, memberId)
  if (success) {
    await loadProjectDetail()
    buildManualEditorRows()
  }
}

const handleDeleteProject = async () => {
  if (!activeProject.value) return
  if (!(await confirm({ message: '删除后项目将从列表隐藏，是否继续？', confirmText: '删除' }))) return
  const success = await deleteTimesheetProject(activeProject.value.id)
  if (!success) return
  activeProjectId.value = null
  projectDetail.value = null
  attendanceRecords.value = []
  makeupRequests.value = []
  manualRecords.value = []
  settlements.value = []
  selectedSettlementDetail.value = null
  await loadProjects()
}

const handleSign = async (signType: number) => {
  if (!activeProject.value) return
  const record = await signAttendance({ projectId: activeProject.value.id, signType })
  if (record) {
    await loadAttendanceData()
  }
}

const handleCreateMakeup = async () => {
  if (!activeProject.value) return
  const { workDate, signInTime, signOutTime } = makeupForm.value
  if (!workDate || !signInTime || !signOutTime) {
    message.warning('请填写完整补签信息')
    return
  }
  const success = await createMakeupRequest({
    projectId: activeProject.value.id,
    workDate,
    signInTime,
    signOutTime,
    reason: makeupForm.value.reason
  })
  if (!success) return
  makeupDialogVisible.value = false
  makeupForm.value = { workDate: '', signInTime: '', signOutTime: '', reason: '' }
  await loadAttendanceData()
}

const handleApproveMakeup = async (requestId: number, approvalStatus: number) => {
  const success = await approveMakeupRequest({ requestId, approvalStatus })
  if (success) {
    await loadAttendanceData()
  }
}

const handleSaveManualWorklog = async () => {
  if (!activeProject.value) return
  const success = await saveManualWorklog({
    projectId: activeProject.value.id,
    workDate: manualWorkDate.value,
    items: manualEditorRows.value.map(item => ({
      memberId: item.memberId,
      workUnits: Number(item.workUnits),
      remark: item.remark
    }))
  })
  if (success) {
    await loadManualData()
  }
}

const handleCreateSettlement = async () => {
  if (!activeProject.value) return
  const detail = await createSettlement({
    projectId: activeProject.value.id,
    memberIds: selectedMemberIds.value.length ? selectedMemberIds.value : undefined,
    unitSalary: settlementUnitSalary.value
  })
  if (!detail) return
  selectedSettlementDetail.value = detail
  salaryCalcUnit.value = Number(detail.settlement.unitSalary || 0)
  await loadSettlements()
}

const handleFinishProject = async () => {
  if (!activeProject.value) return
  if (!(await confirm({ message: '结束项目后将关闭编辑功能，是否继续？', confirmText: '确定' }))) return
  const detail = await finishProjectSettlement({
    projectId: activeProject.value.id,
    memberIds: selectedMemberIds.value.length ? selectedMemberIds.value : undefined,
    unitSalary: settlementUnitSalary.value
  })
  if (!detail) return
  selectedSettlementDetail.value = detail
  salaryCalcUnit.value = Number(detail.settlement.unitSalary || 0)
  await selectProject(activeProject.value.id)
}

const handlePickSettlement = async (row: Settlement) => {
  const detail = await getSettlementDetail(row.id)
  if (!detail) return
  selectedSettlementDetail.value = detail
  salaryCalcUnit.value = Number(detail.settlement.unitSalary || 0)
}

const handleCalcSalary = async () => {
  if (!selectedSettlementDetail.value) return
  const detail = await calcSettlementSalary({
    settlementId: selectedSettlementDetail.value.settlement.id,
    unitSalary: Number(salaryCalcUnit.value)
  })
  if (!detail) return
  selectedSettlementDetail.value = detail
  await loadSettlements()
}

watch(manualWorkDate, () => {
  buildManualEditorRows()
})

watch(activeTab, async (tab) => {
  if (!activeProject.value) return
  if (tab === 'record') {
    if (activeProject.value.mode === 1) {
      await loadAttendanceData()
    } else {
      await loadManualData()
    }
  }
  if (tab === 'settlement') {
    await loadSettlements()
  }
})

onMounted(async () => {
  await loadProjects()
})
</script>

<style scoped lang="sass">
.timesheet-page
  padding: 20px
  height: 100%
  min-height: 0
  background: linear-gradient(135deg, #f7f1e3 0%, #f0f4f8 45%, #e9f5db 100%)
  display: flex
  flex-direction: column
  gap: 18px
  overflow: hidden

.hero-card
  margin-bottom: 0
  border: 1px solid rgba(24, 39, 75, 0.08)
  background: linear-gradient(180deg, #f8fbff 0%, #f2f6fb 100%)
  color: #20304a
  flex: 0 0 auto
  box-shadow: 0 12px 28px rgba(54, 73, 99, 0.06)

  :deep(.el-card__body)
    padding: 22px 28px

.hero-head
  display: flex
  justify-content: space-between
  gap: 16px
  align-items: center

.hero-topline
  font-size: 12px
  letter-spacing: 0.24em
  text-transform: uppercase
  opacity: 0.76

.hero-title
  margin: 0 0 8px
  font-size: 24px
  line-height: 1.2
  font-family: var(--font-family-base)

.hero-desc
  margin: 0
  max-width: 720px
  color: #607086
  font-size: 14px
  line-height: 1.6

.hero-actions
  display: flex
  gap: 10px

  :deep(.el-button)
    padding: 9px 16px
    min-height: 38px

.summary-actions
  display: flex
  flex-wrap: wrap
  justify-content: flex-end
  gap: 12px

.workspace
  display: grid
  grid-template-columns: 300px 1fr
  gap: 18px
  flex: 1
  min-height: 0
  overflow: hidden

.sidebar-card,
.summary-card,
.members-card,
.settlement-list-card,
.record-card,
.settlement-card
  border-radius: 20px
  border: 1px solid rgba(24, 39, 75, 0.08)
  box-shadow: 0 14px 40px rgba(54, 73, 99, 0.08)

.members-card,
.settlement-list-card
  height: 560px

.card-header
  display: flex
  justify-content: space-between
  align-items: center

.sidebar-card
  height: 100%
  min-height: 0

  :deep(.el-card__body)
    height: calc(100% - 57px)
    overflow: hidden
    display: flex
    flex-direction: column

.project-list
  display: flex
  flex-direction: column
  gap: 12px
  min-height: 0
  height: 100%
  overflow-y: auto

.project-item
  padding: 14px
  border-radius: 16px
  border: 1px solid #e8edf4
  cursor: pointer
  transition: 0.2s ease
  background: #fff

  &:hover
    transform: translateY(-2px)
    border-color: #e67e22

  &.active
    background: linear-gradient(135deg, #fff4e8, #fff)
    border-color: #e67e22
    box-shadow: 0 10px 20px rgba(230, 126, 34, 0.12)

.project-item-head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 10px
  margin-bottom: 8px

.project-name
  font-weight: 700
  color: #1f2d3d

.project-meta
  display: flex
  justify-content: space-between
  color: #718096
  font-size: 12px

.main-panel
  display: flex
  flex-direction: column
  gap: 18px
  min-height: 0
  overflow: hidden

.members-card,
.settlement-list-card,
.record-card,
.settlement-card
  :deep(.el-card__body)
    display: flex
    flex-direction: column
    min-height: 0
    overflow: hidden

.members-card,
.settlement-list-card
  min-height: 0
  height: 100%

  :deep(.el-card__body)
    height: calc(100% - 57px)
    max-height: none
    overflow: hidden

.summary-top
  display: flex
  justify-content: space-between
  gap: 18px
  align-items: flex-start

.summary-title-row
  display: flex
  align-items: center
  flex-wrap: wrap
  gap: 10px

  h3
    margin: 0
    font-size: 28px
    color: #20304a

.summary-desc
  margin: 10px 0 0
  color: #607086
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.summary-desc-wrap
  display: flex
  align-items: flex-start
  gap: 10px

.summary-detail-link
  padding: 0
  flex: 0 0 auto

.summary-metrics
  margin-top: 18px
  display: grid
  grid-template-columns: repeat(4, 1fr)
  gap: 14px

.metric-box
  border-radius: 16px
  padding: 16px
  background: linear-gradient(135deg, #f8fbff, #fff7ef)

.metric-label
  font-size: 12px
  color: #7d8ea3
  margin-bottom: 8px

.metric-value
  font-size: 20px
  font-weight: 700
  color: #20304a

.grid-two
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 18px
  flex: 1
  min-height: 0

.action-row,
.manual-toolbar,
.settlement-toolbar,
.detail-head
  display: flex
  flex-wrap: wrap
  gap: 12px
  align-items: center
  margin-bottom: 16px

.detail-head
  justify-content: space-between
  margin-top: 20px

.detail-actions
  display: flex
  gap: 12px
  align-items: center

.record-header
  display: flex
  justify-content: space-between
  align-items: center
  gap: 16px
  flex-wrap: wrap

.overview-panel,
.record-panel,
.settlement-panel,
.detail-panel
  min-height: 0

.record-card,
.settlement-card
  flex: 1
  min-height: 0

.panel-scroll
  flex: 1
  min-height: 0
  overflow-y: auto
  height: 100%

.panel-scroll--tall
  max-height: none

.record-table-section
  min-height: 0
  height: 240px
  overflow: hidden

.record-table-section--compact
  height: 180px

.subsection-title
  margin: 20px 0 12px
  font-size: 16px
  font-weight: 700
  color: #24364d

.tip-text
  color: #8b97a7
  font-size: 12px

.detail-panel
  margin-top: 22px
  padding-top: 18px
  border-top: 1px solid #eef2f7
  display: flex
  flex-direction: column
  gap: 14px
  overflow: hidden

.project-info-dialog
  display: flex
  flex-direction: column
  gap: 18px

.project-info-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 14px

.project-info-item,
.project-info-section
  padding: 14px 16px
  border-radius: 16px
  background: linear-gradient(135deg, #f8fbff, #fff8ef)
  border: 1px solid rgba(24, 39, 75, 0.08)

.project-info-label
  display: block
  font-size: 12px
  color: #7d8ea3
  margin-bottom: 8px

.project-info-value
  color: #20304a
  font-size: 16px
  font-weight: 600
  word-break: break-all

.project-info-remark
  max-height: 220px
  overflow-y: auto
  line-height: 1.75
  color: #42556d
  white-space: pre-wrap

:deep(.el-table)
  height: 100%

@media (max-width: 1100px)
  .workspace
    grid-template-columns: 1fr
    overflow-y: auto

  .grid-two
    grid-template-columns: 1fr

  .members-card,
  .settlement-list-card
    height: 360px

  .summary-metrics
    grid-template-columns: repeat(2, 1fr)

@media (max-width: 768px)
  .timesheet-page
    padding: 12px
    overflow-y: auto

  .hero-card
    :deep(.el-card__body)
      padding: 18px

  .hero-head,
  .summary-top
    flex-direction: column
    align-items: stretch

  .summary-actions
    justify-content: flex-start

  .record-header
    align-items: stretch

  .summary-metrics
    grid-template-columns: 1fr

  .project-info-grid
    grid-template-columns: 1fr
</style>
