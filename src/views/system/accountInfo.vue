<template>
  <div class="account-info-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">账号详情</h2>
          <el-button v-if="!isEditing" type="primary" @click="startEdit">编辑资料</el-button>
          <div v-else>
            <el-button type="primary" @click="saveUserInfo">保存</el-button>
            <el-button @click="cancelEdit">取消</el-button>
          </div>
        </div>
      </template>

      <!-- 角色展示 -->
      <el-row :gutter="20" style="margin-bottom: 16px">
        <el-col :span="12">
          <span style="font-weight: bold; color: #606266; margin-right: 12px">当前角色：</span>
          <el-tag :type="roleTagType" size="large" disable-transitions>{{ roleLabel }}</el-tag>
        </el-col>
      </el-row>

      <!-- 游客手机号验证区域（独立于表单，不受编辑模式影响） -->
      <div v-if="isGuest" style="margin-bottom: 20px">
        <el-alert
          title="您当前为游客身份，验证手机号后可升级为正式用户，获取更多权限"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-form label-width="100px">
          <el-form-item label="手机号验证">
            <div style="display: flex; gap: 8px; width: 50%">
              <el-input
                v-model="verifyPhoneNumber"
                placeholder="请输入手机号"
                :disabled="verifyLoading"
                maxlength="11"
              />
              <el-button
                type="primary"
                @click="handleVerifyPhone"
                :loading="verifyLoading"
                :disabled="!verifyPhoneNumber"
              >
                验证
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <el-form v-if="userInfo" :model="formData" label-width="100px" :disabled="!isEditing">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号">
              <el-input v-model="userInfo.account" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="formData.phone" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="formData.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名">
              <el-input v-model="formData.userName" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="昵称">
              <el-input v-model="formData.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="formData.sex">
                <el-radio :label="1">男</el-radio>
                <el-radio :label="0">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker
                v-model="formData.birthday"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="onBirthdayChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄">
              <el-input v-model="formData.age" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号">
              <el-input v-model="formData.idCard" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="个人简介">
              <el-input
                v-model="formData.intro"
                type="textarea"
                :rows="4"
                placeholder="请输入个人简介"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template v-if="userInfo">
        <section class="password-section">
          <button type="button" class="password-toggle" @click="togglePasswordExpanded">
            <span>修改密码</span>
            <el-icon class="password-toggle-icon" :class="{ expanded: passwordExpanded }"><ArrowDown /></el-icon>
          </button>

          <el-collapse-transition>
            <div v-show="passwordExpanded" class="password-panel">
              <el-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="100px"
                status-icon
                class="password-form"
              >
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="原密码" prop="oldPassword">
                      <el-input
                        v-model="passwordForm.oldPassword"
                        type="password"
                        show-password
                        placeholder="请输入原密码"
                        autocomplete="current-password"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="新密码" prop="newPassword">
                      <el-input
                        v-model="passwordForm.newPassword"
                        type="password"
                        show-password
                        placeholder="请输入新密码"
                        autocomplete="new-password"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="确认密码" prop="confirmPassword">
                      <el-input
                        v-model="passwordForm.confirmPassword"
                        type="password"
                        show-password
                        placeholder="请再次输入新密码"
                        autocomplete="new-password"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <div class="password-actions">
                  <el-button @click="resetPasswordForm">重置</el-button>
                  <el-button type="primary" :loading="passwordLoading" @click="submitPasswordChange">
                    修改密码
                  </el-button>
                </div>
              </el-form>
            </div>
          </el-collapse-transition>
        </section>
      </template>

      <el-empty v-else description="加载用户信息失败" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { changePassword, getUserInfoByAccount, updateUserInfo, verifyPhone, type UserInfo } from '../../api/user'
import { getUserRoleCode as fetchUserRoleCode } from '../../api/role'
import { getUserPermissions as fetchUserPermissions } from '../../api/permission'
import { getUserRoleCode, setUserRoleCode, setUserPermissions, setUserMenus } from '../../utils/userInfo'
import { getUserMenus as fetchUserMenus } from '../../api/menu'
import { message } from '@/shared/ui/feedback'

const userInfo = ref<UserInfo | null>(null)
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
const isEditing = ref(false)
const roleCode = ref(getUserRoleCode())
const verifyPhoneNumber = ref('')
const verifyLoading = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordLoading = ref(false)
const passwordExpanded = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 角色显示名称
const roleLabel = computed(() => {
  const map: Record<string, string> = { ADMIN: '管理员', USER: '正式用户', GUEST: '游客' }
  return map[roleCode.value] || roleCode.value || '未知'
})

// 角色标签颜色
const roleTagType = computed(() => {
  const map: Record<string, '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    ADMIN: 'danger',
    USER: 'success',
    GUEST: 'warning'
  }
  return map[roleCode.value] || 'info'
})

// 是否游客
const isGuest = computed(() => roleCode.value === 'GUEST')

const validateConfirmPassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入确认密码'))
    return
  }
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
    return
  }
  callback()
}

const passwordRules = reactive<FormRules<typeof passwordForm>>({
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
})

// 验证手机号
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
      // 刷新角色和权限
      const newRoleCode = await fetchUserRoleCode()
      setUserRoleCode(newRoleCode)
      roleCode.value = newRoleCode

      const permissions = await fetchUserPermissions()
      const permissionCodes = permissions.map(p => p.permissionCode)
      setUserPermissions(permissionCodes)

      // 刷新菜单
      const menus = await fetchUserMenus()
      setUserMenus(menus)

      // 刷新用户信息
      await loadUserInfo()
      verifyPhoneNumber.value = ''
    }
  } finally {
    verifyLoading.value = false
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  const data = await getUserInfoByAccount()
  if (data) {
    userInfo.value = data
    formData.value = { ...data }
  }
}

// 开始编辑
const startEdit = () => {
  isEditing.value = true
}

// 根据出生日期计算年龄
const calculateAge = (birthday: string): number => {
  if (!birthday) return 0
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// 出生日期变化时自动计算年龄
const onBirthdayChange = (value: string) => {
  formData.value.age = calculateAge(value)
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  if (userInfo.value) {
    formData.value = { ...userInfo.value }
  }
}

// 保存用户信息
const saveUserInfo = async () => {
  const success = await updateUserInfo(formData.value)
  if (success) {
    isEditing.value = false
    await loadUserInfo()
  }
}

const resetPasswordForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
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
    if (passwordForm.oldPassword === passwordForm.newPassword) {
      message.warning('新密码不能与原密码相同')
      return
    }

    passwordLoading.value = true
    try {
      const success = await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      })
      if (success) {
        await loadUserInfo()
        resetPasswordForm()
      }
    } finally {
      passwordLoading.value = false
    }
  })
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped lang="sass">
.account-info-container
  padding: 20px
  height: 100%
  overflow-y: auto

  .card-header
    display: flex
    justify-content: space-between
    align-items: center

  .page-title
    font-size: 24px
    color: #2c5282
    margin: 0
    font-family: var(--font-family-base)

  .password-form
    margin-top: 0

  .password-section
    margin-top: 8px
    border-top: 1px solid #ebeef5
    padding-top: 16px

  .password-panel
    padding-top: 14px

  .password-toggle
    width: 100%
    display: flex
    align-items: center
    justify-content: space-between
    background: transparent
    border: 0
    padding: 0
    font-size: 16px
    font-weight: 600
    color: #303133
    cursor: pointer

  .password-toggle-icon
    transition: transform .2s ease

    &.expanded
      transform: rotate(180deg)

  .password-actions
    display: flex
    justify-content: flex-end
</style>
