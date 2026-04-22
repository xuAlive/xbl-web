<template>
  <div class="account-page">
    <div class="page-header">
      <button class="back-button" type="button" @click="goBack">
        <el-icon :size="22"><ArrowLeft /></el-icon>
      </button>
      <div class="page-title-wrap">
        <h1 class="page-title">个人信息</h1>
        <p class="page-subtitle">查看并维护你的资料与身份信息</p>
      </div>
    </div>

    <div class="profile-card">
      <div class="profile-avatar">{{ displayName.charAt(0) || '用' }}</div>
      <div class="profile-main">
        <div class="profile-name">{{ displayName }}</div>
        <div class="profile-account">{{ formData.account || '当前账号' }}</div>
      </div>
      <el-tag :type="roleTagType" round effect="light">{{ roleLabel }}</el-tag>
    </div>

    <div v-if="isGuest" class="verify-card">
      <div class="verify-head">
        <el-icon :size="18"><WarningFilled /></el-icon>
        <span>游客手机号验证</span>
      </div>
      <p class="verify-text">验证手机号后可升级为正式用户，获取更多权限。</p>
      <div class="verify-form">
        <el-input
          v-model="verifyPhoneNumber"
          placeholder="请输入手机号"
          maxlength="11"
          :disabled="verifyLoading"
          inputmode="numeric"
        />
        <el-button
          type="warning"
          :loading="verifyLoading"
          :disabled="!verifyPhoneNumber"
          @click="handleVerifyPhone"
        >
          验证
        </el-button>
      </div>
    </div>

    <div class="form-card">
      <div class="card-head">
        <h2>资料详情</h2>
        <div class="actions">
          <template v-if="!isEditing">
            <el-button type="primary" @click="startEdit">编辑资料</el-button>
          </template>
          <template v-else>
            <el-button type="primary" :loading="saving" @click="saveUserInfo">保存</el-button>
            <el-button @click="cancelEdit">取消</el-button>
          </template>
        </div>
      </div>

      <el-form :model="formData" label-position="top" :disabled="!isEditing" class="profile-form">
        <el-form-item label="账号">
          <el-input v-model="formData.account" disabled />
        </el-form-item>

        <el-form-item label="昵称">
          <el-input v-model="formData.name" maxlength="30" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="真实姓名">
          <el-input v-model="formData.userName" maxlength="30" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-model="formData.phone" maxlength="20" inputmode="tel" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input v-model="formData.email" maxlength="80" inputmode="email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="性别">
          <el-segmented
            v-model="sexValue"
            :options="sexOptions"
            :disabled="!isEditing"
            block
          />
        </el-form-item>

        <div class="row two-cols">
          <el-form-item label="出生日期">
            <el-date-picker
              v-model="formData.birthday"
              type="date"
              placeholder="选择出生日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              @change="onBirthdayChange"
            />
          </el-form-item>

          <el-form-item label="年龄">
            <el-input :model-value="String(formData.age || 0)" disabled />
          </el-form-item>
        </div>

        <el-form-item label="身份证号">
          <el-input v-model="formData.idCard" maxlength="30" placeholder="请输入身份证号" />
        </el-form-item>

        <el-form-item label="个人简介">
          <el-input
            v-model="formData.intro"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
            placeholder="介绍一下你自己"
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="form-card">
      <div class="card-head">
        <button type="button" class="password-toggle" @click="togglePasswordExpanded">
          <span>修改密码</span>
          <el-icon class="password-toggle-icon" :class="{ expanded: passwordExpanded }"><ArrowDown /></el-icon>
        </button>
      </div>

      <el-collapse-transition>
        <div v-show="passwordExpanded" class="password-panel">
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-position="top"
            status-icon
            class="profile-form"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入原密码"
                autocomplete="current-password"
              />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                placeholder="请输入新密码"
                autocomplete="new-password"
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
                autocomplete="new-password"
              />
            </el-form-item>

            <div class="actions password-actions">
              <el-button @click="resetPasswordForm">重置</el-button>
              <el-button type="primary" :loading="passwordLoading" @click="submitPasswordChange">
                修改密码
              </el-button>
            </div>
          </el-form>
        </div>
      </el-collapse-transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onMounted, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import { ArrowDown, ArrowLeft, WarningFilled } from '@element-plus/icons-vue'
import { addAuthChangeListener, getToken, getUserInfo, getUserRoleCode, setUserInfo, setUserMenus, setUserPermissions, setUserRoleCode } from '@/mobile/utils/auth'
import { changePassword, getUserInfoByAccount, updateUserInfo, verifyPhone, type UserInfo } from '@/modules/mobile/system/api/user'
import { getUserRoleCode as fetchUserRoleCode } from '@/modules/mobile/system/api/role'
import { getUserPermissions as fetchUserPermissions } from '@/modules/mobile/system/api/permission'
import { getUserMenus as fetchUserMenus } from '@/modules/mobile/system/api/menu'
import { message } from '@/shared/ui/feedback'

const router = useRouter()

const isEditing = ref(false)
const saving = ref(false)
const verifyPhoneNumber = ref('')
const verifyLoading = ref(false)
const roleCode = ref(getUserRoleCode())
const sexValue = ref<'男' | '女'>('男')
const passwordFormRef = ref<FormInstance>()
const passwordLoading = ref(false)
const passwordExpanded = ref(false)
let removeAuthListener: (() => void) | null = null

const formData = ref<UserInfo>({
  account: '',
  phone: '',
  name: '',
  userName: '',
  email: '',
  birthday: '',
  age: 0,
  sex: 1,
  idCard: '',
  intro: ''
})

const originalData = ref<UserInfo | null>(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const sexOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' }
]

const validateConfirmPassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入确认密码'))
    return
  }
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
    return
  }
  callback()
}

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

const displayName = computed(() => formData.value.name || formData.value.userName || formData.value.account || '用户')

const roleLabel = computed(() => {
  const map: Record<string, string> = { ADMIN: '管理员', USER: '正式用户', GUEST: '游客' }
  return map[roleCode.value] || roleCode.value || '未知'
})

const roleTagType = computed(() => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    ADMIN: 'danger',
    USER: 'success',
    GUEST: 'warning'
  }
  return map[roleCode.value] || 'info'
})

const isGuest = computed(() => roleCode.value === 'GUEST')

const syncSessionUser = (user: UserInfo) => {
  const current = getUserInfo()
  setUserInfo({
    account: user.account || current?.account || '',
    token: getToken(),
    name: user.name || '',
    userName: user.userName || ''
  })
}

const calculateAge = (birthday?: string) => {
  if (!birthday) return 0
  const birthDate = new Date(birthday)
  if (Number.isNaN(birthDate.getTime())) {
    return 0
  }
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }
  return Math.max(age, 0)
}

const applyUserInfo = (user: UserInfo | null) => {
  if (!user) {
    return
  }
  const next: UserInfo = {
    account: user.account || '',
    phone: user.phone || '',
    name: user.name || '',
    userName: user.userName || '',
    email: user.email || '',
    birthday: user.birthday || '',
    age: user.age || calculateAge(user.birthday),
    sex: typeof user.sex === 'number' ? user.sex : 1,
    idCard: user.idCard || '',
    intro: user.intro || ''
  }
  originalData.value = { ...next }
  formData.value = { ...next }
  sexValue.value = next.sex === 0 ? '女' : '男'
  syncSessionUser(next)
}

const refreshProfile = async () => {
  const data = await getUserInfoByAccount()
  applyUserInfo(data)
  roleCode.value = getUserRoleCode()
}

const refreshPermissions = async () => {
  const [nextRoleCode, permissions, menus] = await Promise.all([
    fetchUserRoleCode(),
    fetchUserPermissions(),
    fetchUserMenus()
  ])
  setUserRoleCode(nextRoleCode)
  setUserPermissions(permissions.map(item => item.permissionCode))
  setUserMenus(menus)
  roleCode.value = nextRoleCode
}

const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  if (originalData.value) {
    formData.value = { ...originalData.value }
    sexValue.value = originalData.value.sex === 0 ? '女' : '男'
  }
}

const onBirthdayChange = (value?: string) => {
  formData.value.age = calculateAge(value)
}

const saveUserInfo = async () => {
  formData.value.sex = sexValue.value === '女' ? 0 : 1
  formData.value.age = calculateAge(formData.value.birthday)
  saving.value = true
  try {
    const success = await updateUserInfo(formData.value)
    if (!success) {
      return
    }
    isEditing.value = false
    await refreshProfile()
  } finally {
    saving.value = false
  }
}

const resetPasswordForm = () => {
  passwordForm.value.oldPassword = ''
  passwordForm.value.newPassword = ''
  passwordForm.value.confirmPassword = ''
  passwordFormRef.value?.clearValidate()
}

const togglePasswordExpanded = () => {
  passwordExpanded.value = !passwordExpanded.value
  if (!passwordExpanded.value) {
    resetPasswordForm()
  }
}

const submitPasswordChange = async () => {
  if (!passwordFormRef.value) {
    return
  }

  passwordFormRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    if (passwordForm.value.oldPassword === passwordForm.value.newPassword) {
      message.warning('新密码不能与原密码相同')
      return
    }

    passwordLoading.value = true
    try {
      const success = await changePassword({
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword,
        confirmPassword: passwordForm.value.confirmPassword
      })
      if (!success) {
        return
      }
      await refreshProfile()
      resetPasswordForm()
    } finally {
      passwordLoading.value = false
    }
  })
}

const handleVerifyPhone = async () => {
  const phone = verifyPhoneNumber.value.trim()
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    message.warning('请输入正确的手机号')
    return
  }

  verifyLoading.value = true
  try {
    const success = await verifyPhone(phone)
    if (!success) {
      return
    }
    verifyPhoneNumber.value = ''
    await refreshPermissions()
    await refreshProfile()
  } finally {
    verifyLoading.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  void refreshProfile()
  removeAuthListener = addAuthChangeListener(() => {
    roleCode.value = getUserRoleCode()
    const sessionUser = getUserInfo()
    if (sessionUser) {
      formData.value.name = sessionUser.name || formData.value.name
      formData.value.userName = sessionUser.userName || formData.value.userName
      formData.value.account = sessionUser.account || formData.value.account
    }
  })
})

onActivated(() => {
  void refreshProfile()
})

onBeforeUnmount(() => {
  removeAuthListener?.()
})
</script>

<style scoped lang="scss">
.account-page {
  min-height: 100vh;
  padding: 18px 16px 28px;
  background:
    radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 34%),
    linear-gradient(180deg, #fffaf1 0%, #f7f8fc 38%, #eef2ff 100%);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.back-button {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
  color: #1f2937;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 28px rgba(148, 163, 184, 0.2);
}

.page-title-wrap {
  min-width: 0;
}

.page-title {
  margin: 0;
  font-size: 1.9rem;
  color: #172554;
  line-height: 1.1;
}

.page-subtitle {
  margin: 8px 0 0;
  font-size: 0.95rem;
  color: #64748b;
}

.profile-card,
.verify-card,
.form-card {
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 22px 44px rgba(148, 163, 184, 0.16);
  backdrop-filter: blur(14px);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 58px;
  height: 58px;
  border-radius: 20px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  font-size: 1.55rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.26);
}

.profile-main {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.profile-account {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.92rem;
  word-break: break-all;
}

.verify-card {
  margin-bottom: 16px;
  padding: 18px;
}

.verify-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #b45309;
}

.verify-text {
  margin: 10px 0 14px;
  color: #7c5a15;
  line-height: 1.7;
  font-size: 0.92rem;
}

.verify-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.form-card {
  padding: 20px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;

  h2 {
    margin: 0;
    font-size: 1.1rem;
    color: #0f172a;
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.password-actions {
  justify-content: flex-end;
}

.password-panel {
  padding-top: 14px;
}

.password-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
}

.password-toggle-icon {
  transition: transform 0.2s ease;
}

.password-toggle-icon.expanded {
  transform: rotate(180deg);
}

.profile-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.profile-form :deep(.el-form-item__label) {
  padding-bottom: 8px;
  color: #475569;
  font-weight: 600;
}

.profile-form :deep(.el-input__wrapper),
.profile-form :deep(.el-textarea__inner),
.profile-form :deep(.el-date-editor.el-input__wrapper) {
  border-radius: 16px;
  min-height: 48px;
  box-shadow: 0 0 0 1px rgba(203, 213, 225, 0.9) inset;
}

.row.two-cols {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 12px;
}

@media (max-width: 420px) {
  .verify-form,
  .row.two-cols {
    grid-template-columns: 1fr;
  }

  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions {
    width: 100%;
  }

  .actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
