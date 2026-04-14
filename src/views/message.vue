<template>
  <div class="message-page" v-loading="loading">
    <el-card class="message-shell">
      <template #header>
        <div class="card-header">
          <div>
            <h3>消息中心</h3>
            <p>提醒消息支持已读处理，系统消息支持管理员统一发布。</p>
          </div>
          <div class="header-actions">
            <el-button
              v-if="activeCategory === 'notification'"
              type="primary"
              plain
              :disabled="unreadNotifications.length === 0"
              @click="handleMarkAllRead"
            >
              全部标为已读
            </el-button>
            <el-button
              v-if="activeCategory === 'system' && canPublishSystemMessage"
              type="primary"
              @click="createDialogVisible = true"
            >
              发布系统消息
            </el-button>
          </div>
        </div>
      </template>

      <div class="message-layout">
        <div class="message-list-panel">
          <el-tabs v-model="activeCategory" class="message-tabs">
            <el-tab-pane :label="`提醒消息 (${notifications.length})`" name="notification" />
            <el-tab-pane :label="`系统消息 (${systemMessages.length})`" name="system" />
          </el-tabs>

          <div v-if="activeCategory === 'notification'" class="sub-tabs">
            <el-radio-group v-model="notificationTab" size="small">
              <el-radio-button label="unread">未读</el-radio-button>
              <el-radio-button label="all">全部</el-radio-button>
            </el-radio-group>
          </div>

          <div class="message-list">
            <template v-if="activeCategory === 'notification'">
              <div
                v-for="item in visibleNotifications"
                :key="`notification-${item.id}`"
                class="message-item"
                :class="{ active: selectedNotification?.id === item.id, unread: item.isRead === 0 }"
                @click="selectedNotification = item"
              >
                <div class="message-item-head">
                  <span class="message-title">{{ item.title || '提醒消息' }}</span>
                  <el-tag size="small" :type="item.isRead === 0 ? 'danger' : 'info'">
                    {{ item.isRead === 0 ? '未读' : '已读' }}
                  </el-tag>
                </div>
                <div class="message-preview">{{ item.content || '暂无内容' }}</div>
                <div class="message-time">{{ formatDateTime(item.remindTime || item.createTime) }}</div>
              </div>

              <el-empty
                v-if="!loading && visibleNotifications.length === 0"
                :description="notificationTab === 'unread' ? '暂无未读提醒' : '暂无提醒消息'"
                :image-size="90"
              />
            </template>

            <template v-else>
              <div
                v-for="item in systemMessages"
                :key="`system-${item.id}`"
                class="message-item"
                :class="{ active: selectedSystemMessage?.id === item.id }"
                @click="selectedSystemMessage = item"
              >
                <div class="message-item-head">
                  <span class="message-title">{{ item.title }}</span>
                  <el-tag size="small" type="warning">系统消息</el-tag>
                </div>
                <div class="message-preview">{{ item.content }}</div>
                <div class="message-time">{{ formatDateTime(item.createTime) }}</div>
              </div>

              <el-empty v-if="!loading && systemMessages.length === 0" description="暂无系统消息" :image-size="90" />
            </template>
          </div>
        </div>

        <div class="message-detail-panel">
          <template v-if="activeCategory === 'notification' && selectedNotification">
            <div class="detail-head">
              <div>
                <h4>{{ selectedNotification.title || '提醒消息' }}</h4>
                <div class="detail-meta">
                  <span>{{ selectedNotification.isRead === 0 ? '未读提醒' : '已读提醒' }}</span>
                  <span>{{ formatDateTime(selectedNotification.remindTime || selectedNotification.createTime) }}</span>
                </div>
              </div>
              <el-button
                v-if="selectedNotification.isRead === 0"
                type="primary"
                link
                @click="handleMarkRead(selectedNotification)"
              >
                标为已读
              </el-button>
            </div>

            <div class="detail-content">{{ selectedNotification.content || '暂无消息内容' }}</div>
          </template>

          <template v-else-if="activeCategory === 'system' && selectedSystemMessage">
            <div class="detail-head">
              <div>
                <h4>{{ selectedSystemMessage.title }}</h4>
                <div class="detail-meta">
                  <span>系统消息</span>
                  <span>{{ formatDateTime(selectedSystemMessage.createTime) }}</span>
                  <span>发布人：{{ selectedSystemMessage.creatorAccount }}</span>
                </div>
              </div>
            </div>

            <div class="detail-content">{{ selectedSystemMessage.content }}</div>
          </template>

          <el-empty v-else description="请选择一条消息查看详情" :image-size="120" />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="发布系统消息" width="520px">
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="createForm.title" maxlength="100" show-word-limit placeholder="请输入系统消息标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="6"
            maxlength="1000"
            show-word-limit
            placeholder="请输入系统消息内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateSystemMessage">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message } from '@/shared/ui/feedback'
import {
  getNotificationList,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification
} from '../api/calendar'
import { createSystemMessage, getSystemMessageList, type SystemMessage } from '../api/systemMessage'
import { getUserRoleCode } from '@/utils/userInfo'

const loading = ref(false)
const activeCategory = ref<'notification' | 'system'>('notification')
const notificationTab = ref<'unread' | 'all'>('unread')
const notifications = ref<AppNotification[]>([])
const systemMessages = ref<SystemMessage[]>([])
const selectedNotification = ref<AppNotification | null>(null)
const selectedSystemMessage = ref<SystemMessage | null>(null)
const createDialogVisible = ref(false)
const createForm = ref({
  title: '',
  content: ''
})

const canPublishSystemMessage = getUserRoleCode() === 'ADMIN'

const unreadNotifications = computed(() => notifications.value.filter(item => item.isRead === 0))
const visibleNotifications = computed(() => notificationTab.value === 'unread' ? unreadNotifications.value : notifications.value)

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

const ensureSelections = () => {
  selectedNotification.value = visibleNotifications.value[0] || notifications.value[0] || null
  selectedSystemMessage.value = systemMessages.value[0] || null
}

const loadData = async () => {
  loading.value = true
  const [notificationList, systemMessageList] = await Promise.all([
    getNotificationList(),
    getSystemMessageList()
  ])
  notifications.value = notificationList
  systemMessages.value = systemMessageList
  loading.value = false
  ensureSelections()
}

const handleMarkRead = async (item: AppNotification) => {
  const success = await markNotificationAsRead(item.id)
  if (!success) return
  notifications.value = notifications.value.map(notification =>
    notification.id === item.id ? { ...notification, isRead: 1 } : notification
  )
  ensureSelections()
  message.success('已标记为已读')
}

const handleMarkAllRead = async () => {
  const success = await markAllNotificationsAsRead()
  if (!success) return
  notifications.value = notifications.value.map(item => ({ ...item, isRead: 1 }))
  ensureSelections()
  message.success('已全部标记为已读')
}

const handleCreateSystemMessage = async () => {
  if (!createForm.value.title.trim() || !createForm.value.content.trim()) {
    message.warning('请填写完整的标题和内容')
    return
  }

  const created = await createSystemMessage({
    title: createForm.value.title.trim(),
    content: createForm.value.content.trim()
  })
  if (!created) return

  createDialogVisible.value = false
  createForm.value = { title: '', content: '' }
  activeCategory.value = 'system'
  await loadData()
  selectedSystemMessage.value = created
}

watch([activeCategory, notificationTab], () => {
  ensureSelections()
})

onMounted(() => {
  void loadData()
})
</script>

<style scoped lang="sass">
.message-page
  padding: 20px
  height: 100%
  overflow: hidden

.message-shell
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

.header-actions
  display: flex
  gap: 12px

.message-layout
  display: grid
  grid-template-columns: 360px 1fr
  gap: 18px
  height: 100%
  min-height: 0

.message-list-panel,
.message-detail-panel
  border: 1px solid #edf2f7
  border-radius: 18px
  background: #fff
  min-height: 0
  overflow: hidden

.message-list-panel
  display: flex
  flex-direction: column

.message-tabs
  padding: 0 16px
  flex: 0 0 auto

.sub-tabs
  padding: 0 16px 12px

.message-list
  flex: 1
  min-height: 0
  overflow-y: auto
  padding: 0 16px 16px

.message-item
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

  &.unread
    box-shadow: 0 10px 24px rgba(64, 158, 255, 0.08)

.message-item-head
  display: flex
  justify-content: space-between
  gap: 12px
  align-items: center

.message-title
  font-weight: 700
  color: #24364d

.message-preview
  margin-top: 10px
  color: #607086
  line-height: 1.7
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.message-time
  margin-top: 10px
  color: #9aa7b8
  font-size: 12px

.message-detail-panel
  padding: 22px 24px
  display: flex
  flex-direction: column

.detail-head
  display: flex
  justify-content: space-between
  gap: 16px
  align-items: flex-start
  padding-bottom: 16px
  border-bottom: 1px solid #edf2f7

  h4
    margin: 0
    font-size: 24px
    color: #20304a

.detail-meta
  display: flex
  gap: 16px
  margin-top: 10px
  color: #8a97a6
  font-size: 13px
  flex-wrap: wrap

.detail-content
  flex: 1
  min-height: 0
  overflow-y: auto
  padding-top: 18px
  line-height: 1.85
  color: #42556d
  white-space: pre-wrap

@media (max-width: 900px)
  .message-page
    padding: 12px
    overflow-y: auto

  .message-shell
    height: auto

    :deep(.el-card__body)
      height: auto

  .message-layout
    grid-template-columns: 1fr
    height: auto

  .message-list-panel
    max-height: 420px

  .message-detail-panel
    min-height: 360px
</style>
