<template>
  <div class="settlement-detail-page">
    <header class="detail-header safe-area-top">
      <button class="back-btn" @click="handleBack">返回</button>
      <div class="detail-title-wrap">
        <div class="detail-title">结算详情</div>
        <div class="detail-subtitle">{{ detail?.settlement.settlementNo || '加载中' }}</div>
      </div>
      <span class="header-space"></span>
    </header>

    <main class="detail-main">
      <el-skeleton v-if="loading" :rows="8" animated />
      <el-empty v-else-if="!detail" description="未找到结算详情" :image-size="88" />

      <template v-else>
        <section class="summary-card">
          <div class="summary-grid">
            <div class="summary-cell">
              <span>结算类型</span>
              <strong>{{ settlementTypeText(detail.settlement.settlementType) }}</strong>
            </div>
            <div class="summary-cell">
              <span>明细数量</span>
              <strong>{{ detail.settlement.itemCount }}</strong>
            </div>
            <div class="summary-cell">
              <span>总工数</span>
              <strong>{{ detail.settlement.totalWorkUnits || 0 }}</strong>
            </div>
            <div class="summary-cell">
              <span>总薪资</span>
              <strong>{{ detail.settlement.totalSalary || 0 }}</strong>
            </div>
          </div>
          <div class="summary-time">结算时间：{{ detail.settlement.createTime || '-' }}</div>
        </section>

        <section class="detail-card">
          <div class="section-head">
            <h3>重新计算薪资</h3>
          </div>
          <el-input-number v-model="salaryCalcUnit" :min="0" :precision="2" class="full-width" />
          <el-button type="success" class="full-width" @click="handleCalcSalary">按当前单价重算</el-button>
        </section>

        <section class="detail-card">
          <div class="section-head">
            <h3>本次结算人员</h3>
          </div>
          <div class="member-table">
            <div class="member-table-head">
              <span>员工姓名</span>
              <span>{{ isManualMode ? '工数' : '工时/工' }}</span>
              <span>单价</span>
              <span>薪资</span>
            </div>
            <button
              v-for="member in detail.memberSummaries"
              :key="member.memberId"
              class="member-table-row"
              @click="openMemberDialog(member.memberId)"
            >
              <span>{{ member.memberName }}</span>
              <span>{{ formatWorkMetric(member) }}</span>
              <span>{{ formatMoney(member.unitSalary) }}</span>
              <span>{{ formatMoney(member.totalSalary) }}</span>
            </button>
          </div>
        </section>

        <el-dialog
          v-model="memberDialogVisible"
          :title="selectedMemberSummary ? `${selectedMemberSummary.memberName} 的结算详情` : '结算详情'"
          width="92%"
          destroy-on-close
        >
          <template v-if="selectedMemberSummary">
            <div class="list-stack">
              <div class="info-card">
                <div class="info-top">
                  <strong>{{ selectedMemberSummary.memberName }}</strong>
                  <span>{{ selectedMemberSummary.memberAccount || '未绑定账号' }}</span>
                </div>
                <div v-if="!isManualMode" class="info-line">工时：{{ selectedMemberSummary.totalWorkHours || 0 }} 小时</div>
                <div class="info-line">工数：{{ selectedMemberSummary.totalWorkUnits || 0 }} 工</div>
                <div class="info-line">单价：{{ formatMoney(selectedMemberSummary.unitSalary) }}</div>
                <div class="info-line">薪资：{{ formatMoney(selectedMemberSummary.totalSalary) }}</div>
              </div>
            </div>
            <div class="detail-divider">明细记录</div>
            <div class="list-stack">
              <div v-for="item in selectedMemberItems" :key="item.id" class="info-card">
                <div class="info-top">
                  <strong>{{ item.memberName }}</strong>
                  <span>{{ item.workDate }}</span>
                </div>
                <div class="info-line">来源：{{ item.sourceMode === 1 ? '签到' : '人工' }}</div>
                <div v-if="!isManualMode" class="info-line">工时：{{ item.workHours || 0 }} 小时</div>
                <div class="info-line">工数：{{ item.workUnits || 0 }} 工</div>
                <div class="info-line">单价：{{ formatMoney(item.unitSalary) }}</div>
                <div class="info-line">薪资：{{ formatMoney(item.salaryAmount) }}</div>
                <div class="info-line">备注：{{ item.remark || '-' }}</div>
              </div>
            </div>
          </template>
        </el-dialog>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { calcSettlementSalary, getSettlementDetail, type SettlementDetail } from '../../../api/timesheet'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detail = ref<SettlementDetail | null>(null)
const salaryCalcUnit = ref(0)
const selectedMemberId = ref<number | null>(null)
const memberDialogVisible = ref(false)

const settlementTypeText = (type: number) => ({ 1: '单人结算', 2: '批量结算', 3: '结束结算' }[type] || '未知')
const isManualMode = computed(() => {
  if (!detail.value?.items?.length) return false
  return detail.value.items.every(item => item.sourceMode === 2)
})
const selectedMemberSummary = computed(() => {
  if (!detail.value?.memberSummaries?.length) return null
  const currentId = selectedMemberId.value ?? detail.value.memberSummaries[0].memberId
  return detail.value.memberSummaries.find(item => item.memberId === currentId) || detail.value.memberSummaries[0]
})
const selectedMemberItems = computed(() => {
  if (!detail.value?.items?.length || !selectedMemberSummary.value) return []
  return detail.value.items.filter(item => item.memberId === selectedMemberSummary.value?.memberId)
})
const formatMoney = (value?: number) => `${Number(value || 0)} 元`
const formatWorkMetric = (member: NonNullable<typeof selectedMemberSummary.value>) => {
  if (isManualMode.value) {
    return `${Number(member.totalWorkUnits || 0)} 工`
  }
  return `${Number(member.totalWorkHours || 0)} 小时 / ${Number(member.totalWorkUnits || 0)} 工`
}

const handleBack = () => {
  const projectId = Number(route.query.projectId)
  if (projectId) {
    router.push(`/timesheet/project/${projectId}`)
    return
  }
  router.push('/timesheet')
}

const loadDetail = async () => {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const ret = await getSettlementDetail(id)
    detail.value = ret
    salaryCalcUnit.value = Number(ret?.settlement.unitSalary || 0)
    selectedMemberId.value = ret?.memberSummaries?.[0]?.memberId || null
  } finally {
    loading.value = false
  }
}

const openMemberDialog = (memberId: number) => {
  selectedMemberId.value = memberId
  memberDialogVisible.value = true
}

const handleCalcSalary = async () => {
  if (!detail.value) return
  const ret = await calcSettlementSalary({
    settlementId: detail.value.settlement.id,
    unitSalary: Number(salaryCalcUnit.value)
  })
  if (ret) {
    detail.value = ret
    if (!ret.memberSummaries.find(item => item.memberId === selectedMemberId.value)) {
      selectedMemberId.value = ret.memberSummaries?.[0]?.memberId || null
    }
  }
}

onMounted(loadDetail)
</script>

<style scoped lang="scss">
.settlement-detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5fbff 0%, #f8f8f5 100%);
}

.detail-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(248, 251, 253, 0.94);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.back-btn {
  border: none;
  background: #fff;
  border-radius: 999px;
  padding: 9px 0;
  font-size: 12px;
  color: #0f172a;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.detail-title-wrap {
  text-align: center;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.detail-subtitle {
  font-size: 12px;
  color: #64748b;
}

.detail-main {
  padding: 16px 16px calc(28px + env(safe-area-inset-bottom));
}

.summary-card,
.detail-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20px 45px rgba(30, 41, 59, 0.08);
  padding: 16px;
  margin-bottom: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.summary-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc, #eff6ff);
}

.summary-cell span,
.summary-time,
.info-line,
.info-top span {
  font-size: 12px;
  color: #64748b;
}

.summary-cell strong,
.info-top strong {
  font-size: 15px;
  color: #0f172a;
}

.summary-time {
  margin-top: 12px;
}

.section-head {
  margin-bottom: 12px;
}

.section-head h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}

.list-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-table {
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(180deg, #fbfdff, #f4f7fb);
}

.member-table-head,
.member-table-row {
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 1fr 1fr;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
}

.member-table-head {
  background: rgba(148, 163, 184, 0.12);
}

.member-table-head span,
.member-table-row span {
  font-size: 12px;
  color: #64748b;
}

.member-table-row {
  width: 100%;
  border: none;
  text-align: left;
  background: transparent;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.member-table-row span:first-child {
  color: #0f172a;
  font-weight: 600;
}

.detail-divider {
  margin: 14px 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.info-card {
  border-radius: 20px;
  padding: 14px;
  background: linear-gradient(180deg, #fbfdff, #f4f7fb);
}

.info-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.info-line {
  line-height: 1.7;
}

.full-width {
  width: 100%;
  margin-top: 10px;
}

.header-space {
  display: block;
}
</style>
