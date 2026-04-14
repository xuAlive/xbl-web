<template>
  <div class="home-container">
    <div class="home-header">
      <div class="user-info">
        <el-avatar :size="50" class="avatar">
          {{ displayName.charAt(0) }}
        </el-avatar>
        <div class="user-detail">
          <div class="user-name">
            {{ displayName }}
            <el-tag :type="roleTagType" size="small" style="margin-left: 8px">{{ roleLabel }}</el-tag>
          </div>
          <div class="user-desc">欢迎使用小徐的应用</div>
        </div>
      </div>
    </div>

    <div v-if="isGuest" class="verify-section">
      <div class="verify-card">
        <div class="verify-title">
          <el-icon :size="18" color="#E6A23C"><WarningFilled /></el-icon>
          <span>验证手机号升级为正式用户，获取更多权限</span>
        </div>
        <div class="verify-form">
          <el-input
            v-model="verifyPhoneNumber"
            placeholder="请输入手机号"
            :disabled="verifyLoading"
            maxlength="11"
            size="large"
            class="verify-input"
          />
          <el-button
            type="primary"
            size="large"
            @click="handleVerifyPhone"
            :loading="verifyLoading"
            :disabled="!verifyPhoneNumber"
            class="verify-btn"
          >
            验证
          </el-button>
        </div>
      </div>
    </div>

    <div class="app-section">
      <div class="section-title">我的应用</div>
      <div class="app-grid">
        <div
          v-for="app in apps"
          :key="app.name"
          class="app-card"
          :style="{ '--app-color': app.color }"
          @click="navigateTo(app.path)"
        >
          <div class="app-icon">
            <el-icon :size="32"><component :is="app.icon" /></el-icon>
          </div>
          <div class="app-name">{{ app.name }}</div>
          <div class="app-desc">{{ app.desc }}</div>
        </div>
      </div>
    </div>

    <div class="quick-section">
      <div class="section-title">快捷操作</div>
      <div class="quick-actions">
        <div class="quick-item" @click="navigateTo('/blog/edit')">
          <el-icon :size="24"><EditPen /></el-icon>
          <span>写文章</span>
        </div>
        <div class="quick-item" @click="navigateTo('/diary')">
          <el-icon :size="24"><Notebook /></el-icon>
          <span>写日记</span>
        </div>
        <div class="quick-item" @click="navigateTo('/deepseek')">
          <el-icon :size="24"><ChatDotRound /></el-icon>
          <span>AI对话</span>
        </div>
        <div class="quick-item" @click="handleLogout">
          <el-icon :size="24"><SwitchButton /></el-icon>
          <span>退出</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { EditPen, Notebook, ChatDotRound, SwitchButton, Reading, ChatLineSquare, Calendar, Document, WarningFilled, Stopwatch } from '@element-plus/icons-vue'
import { getUserInfo, clearAuth, handleWechatCallback, getUserRoleCode, setUserRoleCode, setUserPermissions, setUserMenus } from '@/mobile/utils/auth'
import { confirm } from '@/shared/ui/confirm'
import { message } from '@/shared/ui/feedback'
import { getUserRoleCode as fetchUserRoleCode } from '@/modules/mobile/system/api/role'
import { getUserPermissions as fetchUserPermissions } from '@/modules/mobile/system/api/permission'
import { getUserMenus as fetchUserMenus } from '@/modules/mobile/system/api/menu'
import { verifyPhone } from '@/modules/mobile/system/api/user'

const router = useRouter()

const displayName = ref('用户')
const roleCode = ref(getUserRoleCode())
const verifyPhoneNumber = ref('')
const verifyLoading = ref(false)

const roleLabel = computed(() => {
  const map: Record<string, string> = { ADMIN: '管理员', USER: '正式用户', GUEST: '游客' }
  return map[roleCode.value] || roleCode.value || '未知'
})

const roleTagType = computed(() => {
  const map: Record<string, '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    ADMIN: 'danger',
    USER: 'success',
    GUEST: 'warning'
  }
  return map[roleCode.value] || 'info'
})

const isGuest = computed(() => roleCode.value === 'GUEST')

const handleVerifyPhone = async () => {
  const phone = verifyPhoneNumber.value.trim()
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    message.warning('请输入正确的手机号')
    return
  }
  verifyLoading.value = true
  try {
    const success = await verifyPhone(phone)
    if (success) {
      const newRoleCode = await fetchUserRoleCode()
      setUserRoleCode(newRoleCode)
      roleCode.value = newRoleCode

      const permissions = await fetchUserPermissions()
      setUserPermissions(permissions.map(p => p.permissionCode))

      const menus = await fetchUserMenus()
      setUserMenus(menus)

      verifyPhoneNumber.value = ''
    }
  } finally {
    verifyLoading.value = false
  }
}

const apps = ref([
  { name: '个人博客', desc: '记录生活，分享想法', icon: Reading, color: '#409EFF', path: '/blog' },
  { name: 'AI对话', desc: 'DeepSeek智能助手', icon: ChatLineSquare, color: '#67C23A', path: '/deepseek' },
  { name: '排班管理', desc: '轻松管理工作排班', icon: Calendar, color: '#E6A23C', path: '/schedule' },
  { name: '日记本', desc: '记录每一天的心情', icon: Document, color: '#F56C6C', path: '/diary' },
  { name: '工时记录', desc: '项目记工、签到补签、结算管理', icon: Stopwatch, color: '#14B8A6', path: '/timesheet' }
])

const navigateTo = (path: string) => {
  router.push(path)
}

const handleLogout = () => {
  confirm({
    message: '确定要退出登录吗？',
    confirmText: '确定',
  }).then((confirmed) => {
    if (!confirmed) return
    clearAuth()
    router.push('/login')
  })
}

onMounted(() => {
  handleWechatCallback()

  const userInfo = getUserInfo()
  if (userInfo) {
    displayName.value = userInfo.userName || userInfo.account || '用户'
  }
})
</script>

<style scoped lang="scss">
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 20px;
}

.home-header {
  padding: 40px 20px 30px;

  .user-info {
    display: flex;
    align-items: center;
    gap: 15px;

    .avatar {
      background: rgba(255, 255, 255, 0.9);
      color: #667eea;
      font-weight: bold;
      font-size: 20px;
    }

    .user-detail {
      .user-name {
        font-size: 20px;
        font-weight: 600;
        color: #fff;
      }

      .user-desc {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 4px;
      }
    }
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  padding-left: 5px;
}

.app-section {
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 25px 20px;
  min-height: calc(100vh - 180px);
}

.verify-section {
  padding: 0 20px;
  margin-top: -10px;
  margin-bottom: 15px;
}

.verify-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  .verify-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #666;
    margin-bottom: 12px;
  }

  .verify-form {
    display: flex;
    gap: 10px;

    .verify-input {
      flex: 1;
    }

    .verify-btn {
      border-radius: 12px;
    }
  }
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.app-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;

  &:active {
    transform: scale(0.96);
  }

  .app-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: var(--app-color);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;

    .el-icon {
      color: #fff;
    }
  }

  .app-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 6px;
  }

  .app-desc {
    font-size: 12px;
    color: #999;
    line-height: 1.4;
  }
}

.quick-section {
  padding: 0 20px;
  margin-top: 25px;
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 16px;
  padding: 20px 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 12px;
  transition: all 0.2s;
  cursor: pointer;

  &:active {
    background: #f5f5f5;
  }

  .el-icon {
    color: #666;
  }

  span {
    font-size: 12px;
    color: #666;
  }
}
</style>
