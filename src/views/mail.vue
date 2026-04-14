<template>
  <div class="mail-page" v-loading="loading">
    <el-card class="mail-shell">
      <template #header>
        <div class="card-header">
          <div>
            <h3>邮箱中心</h3>
            <p>当前展示系统通知投递记录，方便查看发送时间、渠道和内容详情。</p>
          </div>
          <div class="mail-meta">
            <span class="mail-meta-label">当前邮箱</span>
            <span class="mail-meta-value">{{ currentEmail || '未设置邮箱' }}</span>
          </div>
        </div>
      </template>

      <div class="mail-layout">
        <div class="mail-list-panel">
          <div class="mail-list-toolbar">
            <el-tag type="info">共 {{ mailList.length }} 条</el-tag>
          </div>

          <div class="mail-list">
            <div
              v-for="mail in mailList"
              :key="mail.id"
              class="mail-item"
              :class="{ active: currentMail?.id === mail.id }"
              @click="selectMail(mail)"
            >
              <div class="mail-item-head">
                <span class="mail-subject">{{ mail.title || '系统通知' }}</span>
                <el-tag size="small" :type="mail.status === 1 ? 'success' : 'danger'">
                  {{ mail.status === 1 ? '发送成功' : '发送失败' }}
                </el-tag>
              </div>
              <div class="mail-preview">{{ mail.content || mail.errorMessage || '暂无内容' }}</div>
              <div class="mail-footer">
                <span>{{ notificationTypeLabel(mail.notificationType) }}</span>
                <span>{{ formatDateTime(mail.sendTime || mail.createTime) }}</span>
              </div>
            </div>

            <el-empty v-if="!loading && mailList.length === 0" description="暂无投递记录" :image-size="90" />
          </div>
        </div>

        <div class="mail-detail-panel">
          <template v-if="currentMail">
            <div class="mail-detail-head">
              <div>
                <h4>{{ currentMail.title || '系统通知' }}</h4>
                <div class="mail-detail-tags">
                  <el-tag size="small">{{ notificationTypeLabel(currentMail.notificationType) }}</el-tag>
                  <el-tag size="small" :type="currentMail.status === 1 ? 'success' : 'danger'">
                    {{ currentMail.status === 1 ? '发送成功' : '发送失败' }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="mail-info">
              <p><strong>收件邮箱：</strong>{{ currentEmail || '未设置邮箱' }}</p>
              <p><strong>发送时间：</strong>{{ formatDateTime(currentMail.sendTime || currentMail.createTime) }}</p>
              <p><strong>通知渠道：</strong>{{ notificationTypeLabel(currentMail.notificationType) }}</p>
              <p v-if="currentMail.errorMessage"><strong>失败原因：</strong>{{ currentMail.errorMessage }}</p>
            </div>

            <el-divider />

            <div class="mail-content">
              {{ currentMail.content || currentMail.errorMessage || '暂无详细内容' }}
            </div>
          </template>

          <el-empty v-else description="请选择一条投递记录查看详情" :image-size="120" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getNotificationLogs, type NotificationLog } from '../api/calendar'
import { getUserInfoByAccount } from '../api/user'

const loading = ref(false)
const mailList = ref<NotificationLog[]>([])
const currentMail = ref<NotificationLog | null>(null)
const currentEmail = ref('')

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

const notificationTypeLabel = (type?: string) => {
  const map: Record<string, string> = {
    app: '应用内通知',
    wechat: '微信公众号',
    dingtalk: '钉钉',
    sms: '短信',
    email: '邮件'
  }
  return map[type || ''] || (type || '系统通知')
}

const selectMail = (mail: NotificationLog) => {
  currentMail.value = mail
}

const loadData = async () => {
  loading.value = true
  const [logs, userInfo] = await Promise.all([
    getNotificationLogs(),
    getUserInfoByAccount()
  ])
  mailList.value = logs
  currentMail.value = logs[0] || null
  currentEmail.value = userInfo?.email || ''
  loading.value = false
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped lang="sass">
.mail-page
  padding: 20px
  height: 100%
  overflow: hidden

.mail-shell
  height: 100%

  :deep(.el-card__body)
    height: calc(100% - 73px)
    min-height: 0

.card-header
  display: flex
  justify-content: space-between
  align-items: center
  gap: 16px

  h3
    margin: 0
    font-family: var(--font-family-base)
    color: #2c3e50

  p
    margin: 6px 0 0
    color: #8a97a6
    font-size: 13px

.mail-meta
  display: flex
  flex-direction: column
  align-items: flex-end
  gap: 4px

.mail-meta-label
  font-size: 12px
  color: #9aa7b8

.mail-meta-value
  color: #20304a
  font-weight: 600

.mail-layout
  display: grid
  grid-template-columns: 360px 1fr
  gap: 18px
  height: 100%
  min-height: 0

.mail-list-panel,
.mail-detail-panel
  border: 1px solid #edf2f7
  border-radius: 18px
  background: #fff
  min-height: 0
  overflow: hidden

.mail-list-panel
  display: flex
  flex-direction: column

.mail-list-toolbar
  padding: 16px 16px 0

.mail-list
  flex: 1
  min-height: 0
  overflow-y: auto
  padding: 16px

.mail-item
  padding: 16px
  border-radius: 14px
  border: 1px solid #edf2f7
  transition: all 0.2s ease
  cursor: pointer
  margin-bottom: 12px

  &:hover
    border-color: #bfd8ff
    background: #f8fbff

  &.active
    border-color: #409eff
    background: #eff6ff

.mail-item-head
  display: flex
  justify-content: space-between
  gap: 12px
  align-items: center

.mail-subject
  font-weight: 700
  color: #24364d

.mail-preview
  margin-top: 10px
  color: #607086
  line-height: 1.7
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.mail-footer
  margin-top: 10px
  display: flex
  justify-content: space-between
  gap: 12px
  color: #9aa7b8
  font-size: 12px

.mail-detail-panel
  padding: 22px 24px
  display: flex
  flex-direction: column

.mail-detail-head
  display: flex
  justify-content: space-between
  align-items: flex-start

  h4
    margin: 0
    font-size: 24px
    color: #20304a

.mail-detail-tags
  display: flex
  gap: 8px
  margin-top: 12px

.mail-info
  margin-top: 18px

  p
    margin: 10px 0
    color: #55687f

.mail-content
  flex: 1
  min-height: 0
  overflow-y: auto
  line-height: 1.85
  color: #42556d
  white-space: pre-wrap

@media (max-width: 900px)
  .mail-page
    padding: 12px
    overflow-y: auto

  .mail-shell
    height: auto

    :deep(.el-card__body)
      height: auto

  .mail-layout
    grid-template-columns: 1fr
    height: auto

  .mail-list-panel
    max-height: 420px

  .mail-detail-panel
    min-height: 360px
</style>
