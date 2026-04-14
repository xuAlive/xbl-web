<template>
  <div class="timesheet-mobile">
    <header class="page-header safe-area-top">
      <button class="back-btn" @click="router.push('/timesheet')">返回</button>
      <div class="header-body">
        <div class="header-title">{{ activeProject?.projectName || '项目详情' }}</div>
        <div class="header-subtitle">项目概述与工时管理</div>
      </div>
      <button class="switch-btn" @click="loadProjectData">刷新</button>
    </header>

    <main class="page-main">
      <el-empty v-if="!activeProject" description="项目不存在或无权限访问" :image-size="88" />

      <template v-else>
        <section class="summary-strip">
          <div class="summary-item">
            <span class="summary-label">记工模式</span>
            <strong>{{ modeText(activeProject.mode) }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">成员总数</span>
            <strong>{{ activeMembers.length }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">结算单数</span>
            <strong>{{ settlements.length }}</strong>
          </div>
        </section>

        <section class="tab-strip">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="['tab-btn', { active: activeTab === tab.value }]"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </section>

        <section v-show="activeTab === 'overview'" class="panel-stack">
          <article class="panel-card">
            <div class="panel-head">
              <h3>项目成员</h3>
              <div class="panel-head-actions">
                <el-button v-if="canManageProject" type="primary" link @click="memberDialogVisible = true">添加</el-button>
                <el-button v-if="canManageProject" type="success" link @click="syncDialogVisible = true">同步成员</el-button>
              </div>
            </div>
            <div class="member-list">
              <div v-for="member in activeMembers" :key="member.id" class="member-card">
                <div>
                  <div class="member-name">{{ member.memberName }}</div>
                  <div class="member-meta">{{ member.memberAccount || '未绑定账号' }}</div>
                  <div class="member-meta">{{ member.memberPhone || '-' }}</div>
                </div>
                <el-button
                  v-if="canManageProject"
                  link
                  type="danger"
                  :disabled="member.memberAccount === activeProject.creatorAccount"
                  @click="handleRemoveMember(member.id)"
                >
                  移除
                </el-button>
              </div>
            </div>
          </article>

          <article class="panel-card">
            <div class="panel-head">
              <h3>最近结算</h3>
              <el-button link @click="loadSettlements">刷新</el-button>
            </div>
            <div v-if="settlements.length" class="settlement-list">
              <button
                v-for="settlement in settlements.slice(0, 5)"
                :key="settlement.id"
                class="settlement-card"
                @click="openSettlementDetail(settlement)"
              >
                <div class="settlement-no">{{ settlement.settlementNo }}</div>
                <div class="settlement-meta">
                  <span>{{ settlementTypeText(settlement.settlementType) }}</span>
                  <span>{{ settlement.totalWorkUnits || 0 }} 工</span>
                  <span>{{ settlement.totalSalary || 0 }} 元</span>
                </div>
              </button>
            </div>
            <el-empty v-else description="暂无结算记录" :image-size="72" />
          </article>
        </section>

        <section v-show="activeTab === 'record'" class="panel-stack">
          <article v-if="activeProject.mode === 1" class="panel-card">
            <div class="panel-head">
              <h3>签到记工</h3>
              <el-button link @click="loadAttendanceData">刷新</el-button>
            </div>
            <div class="action-grid">
              <el-button type="success" :disabled="activeProject.status !== 1" @click="handleSign(1)">签到</el-button>
              <el-button type="warning" :disabled="activeProject.status !== 1" @click="handleSign(2)">离班</el-button>
              <el-button :disabled="activeProject.status !== 1" @click="makeupDialogVisible = true">补签</el-button>
            </div>
            <div class="record-list">
              <div v-for="record in attendanceRecords" :key="record.id" class="record-card">
                <div class="record-top">
                  <strong>{{ record.memberName }}</strong>
                  <span>{{ record.workDate }}</span>
                </div>
                <div class="record-meta">签到：{{ record.signInTime || '-' }}</div>
                <div class="record-meta">离班：{{ record.signOutTime || '-' }}</div>
                <div class="record-meta">工时：{{ record.workHours || 0 }} 小时 / {{ record.workUnits || 0 }} 工</div>
                <div class="record-meta">状态：{{ attendanceStatusText(record.recordStatus) }}</div>
              </div>
            </div>
          </article>

          <article v-if="activeProject.mode === 1" class="panel-card">
            <div class="panel-head">
              <h3>补签审批</h3>
            </div>
            <div v-if="makeupRequests.length" class="record-list">
              <div v-for="item in makeupRequests" :key="item.id" class="record-card">
                <div class="record-top">
                  <strong>{{ item.memberName }}</strong>
                  <span>{{ makeupStatusText(item.approvalStatus) }}</span>
                </div>
                <div class="record-meta">{{ item.workDate }}</div>
                <div class="record-meta">补签到：{{ item.makeupSignInTime }}</div>
                <div class="record-meta">补离班：{{ item.makeupSignOutTime }}</div>
                <div class="record-meta">原因：{{ item.reason || '-' }}</div>
                <div v-if="canManageProject && item.approvalStatus === 1" class="inline-actions">
                  <el-button type="success" size="small" @click="handleApproveMakeup(item.id, 2)">通过</el-button>
                  <el-button type="danger" size="small" @click="handleApproveMakeup(item.id, 3)">拒绝</el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无补签申请" :image-size="72" />
          </article>

          <article v-if="activeProject.mode === 2" class="panel-card">
            <div class="panel-head">
              <h3>人工记工</h3>
              <el-button link @click="loadManualData">刷新</el-button>
            </div>
            <el-date-picker
              v-model="manualWorkDate"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              class="full-width"
            />
            <div class="manual-list">
              <div v-for="row in manualEditorRows" :key="row.memberId" class="manual-card">
                <div class="manual-name">{{ row.memberName }}</div>
                <div class="manual-account">{{ row.memberAccount }}</div>
                <el-select v-model="row.workUnits" :disabled="!canManageProject || activeProject.status !== 1" class="full-width">
                  <el-option :value="0" label="0 工" />
                  <el-option :value="0.5" label="0.5 工" />
                  <el-option :value="1" label="1 工" />
                </el-select>
                <el-input
                  v-model="row.remark"
                  type="textarea"
                  :rows="2"
                  :disabled="!canManageProject || activeProject.status !== 1"
                  placeholder="备注"
                />
              </div>
            </div>
            <el-button type="primary" class="full-width" :disabled="!canManageProject || activeProject.status !== 1" @click="handleSaveManualWorklog">
              保存当天记工
            </el-button>
          </article>
        </section>

        <section v-show="activeTab === 'settlement'" class="panel-stack">
          <article class="panel-card">
            <div class="panel-head">
              <h3>发起结算</h3>
            </div>
            <el-select v-model="selectedMemberIds" multiple collapse-tags collapse-tags-tooltip placeholder="选择结算成员" class="full-width">
              <el-option v-for="member in activeMembers" :key="member.id" :label="member.memberName" :value="member.id" />
            </el-select>
            <el-input-number v-model="settlementUnitSalary" :min="0" :precision="2" class="full-width" />
            <div class="action-grid action-grid--two">
              <el-button type="primary" :disabled="!canManageProject" @click="handleCreateSettlement">立即结算</el-button>
              <el-button type="danger" :disabled="!canManageProject || activeProject.status !== 1" @click="handleFinishProject">结束并结算</el-button>
            </div>
          </article>

          <article class="panel-card">
            <div class="panel-head">
              <h3>结算单列表</h3>
              <el-button link @click="loadSettlements">刷新</el-button>
            </div>
            <div v-if="settlements.length" class="settlement-list">
              <button
                v-for="settlement in settlements"
                :key="settlement.id"
                class="settlement-card settlement-card--detail"
                @click="openSettlementDetail(settlement)"
              >
                <div class="settlement-main">
                  <div class="settlement-no">{{ settlement.settlementNo }}</div>
                  <div class="settlement-meta">
                    <span>{{ settlementTypeText(settlement.settlementType) }}</span>
                    <span>{{ settlement.itemCount }} 条</span>
                  </div>
                </div>
                <div class="settlement-extra">
                  <div>{{ settlement.totalWorkUnits || 0 }} 工</div>
                  <div>{{ settlement.totalSalary || 0 }} 元</div>
                  <div>{{ settlement.createTime || '-' }}</div>
                </div>
              </button>
            </div>
            <el-empty v-else description="暂无结算记录" :image-size="72" />
          </article>
        </section>
      </template>
    </main>

    <el-dialog v-model="memberDialogVisible" title="添加成员" width="92%">
      <el-form :model="memberForm" label-position="top">
        <el-form-item label="成员账号">
          <el-input v-model="memberForm.memberAccount" :placeholder="activeProject?.mode === 2 ? '人工记工模式可不填账号' : '请输入成员账号'" />
        </el-form-item>
        <el-form-item label="成员姓名">
          <el-input v-model="memberForm.memberName" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="memberForm.memberPhone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddMember">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="syncDialogVisible" title="同步历史项目成员" width="92%">
      <el-form label-position="top">
        <el-form-item label="来源项目">
          <el-select v-model="selectedSourceProjectId" placeholder="选择你之前创建过的项目" class="full-width">
            <el-option
              v-for="project in syncSourceProjects"
              :key="project.id"
              :label="project.projectName"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="syncDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedSourceProjectId" @click="handleSyncMembers">同步差集成员</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="makeupDialogVisible" title="申请补签" width="92%">
      <el-form :model="makeupForm" label-position="top">
        <el-form-item label="工时日期">
          <el-date-picker v-model="makeupForm.workDate" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" class="full-width" />
        </el-form-item>
        <el-form-item label="补签到时间">
          <el-date-picker v-model="makeupForm.signInTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" class="full-width" />
        </el-form-item>
        <el-form-item label="补离班时间">
          <el-date-picker v-model="makeupForm.signOutTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" class="full-width" />
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import { confirm } from '@/shared/ui/confirm'
import { getAccount } from '../../utils/auth'
import {
  addTimesheetMember,
  approveMakeupRequest,
  createMakeupRequest,
  createSettlement,
  finishProjectSettlement,
  getAttendanceList,
  getMakeupRequestList,
  getManualWorklogList,
  getMyTimesheetProjects,
  getSettlementList,
  getTimesheetProjectDetail,
  removeTimesheetMember,
  saveManualWorklog,
  signAttendance,
  syncTimesheetMembers,
  type AttendanceRecord,
  type MakeupRequest,
  type ManualWorklog,
  type ProjectDetail,
  type ProjectMember,
  type Settlement,
  type TimesheetProject
} from '../../../api/timesheet'

const route = useRoute()
const router = useRouter()
const currentAccount = getAccount()

const tabs = [
  { label: '概述', value: 'overview' },
  { label: '记工', value: 'record' },
  { label: '结算', value: 'settlement' }
]

const activeTab = ref('overview')
const memberDialogVisible = ref(false)
const makeupDialogVisible = ref(false)
const syncDialogVisible = ref(false)

const allProjects = ref<TimesheetProject[]>([])
const projectDetail = ref<ProjectDetail | null>(null)
const attendanceRecords = ref<AttendanceRecord[]>([])
const makeupRequests = ref<MakeupRequest[]>([])
const manualRecords = ref<ManualWorklog[]>([])
const settlements = ref<Settlement[]>([])

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
const selectedSourceProjectId = ref<number | null>(null)

const activeProjectId = computed(() => Number(route.params.projectId))
const activeProject = computed(() => projectDetail.value?.project || null)
const activeMembers = computed<ProjectMember[]>(() => projectDetail.value?.members || [])
const canManageProject = computed(() => activeProject.value?.creatorAccount === currentAccount)
const syncSourceProjects = computed(() =>
  allProjects.value.filter(project => project.creatorAccount === currentAccount && project.id !== activeProjectId.value)
)

function today() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const modeText = (mode: number) => (mode === 1 ? '签到记工' : '人工记工')
const settlementTypeText = (type: number) => ({ 1: '单人结算', 2: '批量结算', 3: '结束结算' }[type] || '未知')
const attendanceStatusText = (status: number) => ({ 1: '待离班', 2: '已完成', 3: '补签通过' }[status] || '未知')
const makeupStatusText = (status: number) => ({ 1: '待审批', 2: '已通过', 3: '已拒绝' }[status] || '未知')

const loadProjects = async () => {
  allProjects.value = await getMyTimesheetProjects()
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
  projectDetail.value = await getTimesheetProjectDetail(activeProjectId.value)
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

const loadProjectData = async () => {
  await loadProjects()
  await loadProjectDetail()
  if (activeProject.value?.mode === 1) {
    await loadAttendanceData()
  } else if (activeProject.value?.mode === 2) {
    await loadManualData()
  }
  await loadSettlements()
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

const handleSyncMembers = async () => {
  if (!activeProjectId.value || !selectedSourceProjectId.value) return
  const count = await syncTimesheetMembers({
    targetProjectId: activeProjectId.value,
    sourceProjectId: selectedSourceProjectId.value
  })
  if (count < 0) return
  syncDialogVisible.value = false
  selectedSourceProjectId.value = null
  await loadProjectDetail()
  buildManualEditorRows()
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
  await loadSettlements()
  router.push(`/timesheet/settlement/${detail.settlement.id}?projectId=${activeProject.value.id}`)
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
  await loadProjectData()
  router.push(`/timesheet/settlement/${detail.settlement.id}?projectId=${activeProject.value.id}`)
}

const openSettlementDetail = (settlement: Settlement) => {
  router.push(`/timesheet/settlement/${settlement.id}?projectId=${activeProjectId.value}`)
}

watch(manualWorkDate, buildManualEditorRows)

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

watch(() => route.params.projectId, loadProjectData)

onMounted(loadProjectData)
</script>

<style scoped lang="scss">
.timesheet-mobile {
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

.panel-card,
.summary-strip,
.tab-strip {
  border-radius: 24px;
  box-shadow: 0 20px 45px rgba(30, 41, 59, 0.08);
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 14px;
  background: #ffffff;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc, #eff6ff);
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: #64748b;
}

.tab-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px;
  margin: 14px 0;
  background: rgba(255, 255, 255, 0.94);
}

.tab-btn {
  border: none;
  background: transparent;
  border-radius: 18px;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.tab-btn.active {
  background: linear-gradient(135deg, #0f766e, #2563eb);
  color: #fff;
}

.panel-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.96);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.panel-head h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}

.panel-head-actions {
  display: flex;
  gap: 6px;
}

.member-list,
.record-list,
.manual-list,
.settlement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-card,
.record-card,
.manual-card,
.settlement-card {
  border: none;
  width: 100%;
  text-align: left;
  border-radius: 20px;
  background: linear-gradient(180deg, #fbfdff, #f4f7fb);
  padding: 14px;
}

.member-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.member-name,
.manual-name,
.settlement-no {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.member-meta,
.record-meta,
.manual-account,
.settlement-meta,
.settlement-extra {
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}

.record-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.inline-actions,
.action-grid {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.action-grid {
  grid-template-columns: repeat(3, 1fr);
}

.action-grid--two {
  grid-template-columns: 1fr 1fr;
}

.manual-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settlement-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settlement-card--detail {
  gap: 10px;
}

.settlement-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.full-width {
  width: 100%;
}
</style>
