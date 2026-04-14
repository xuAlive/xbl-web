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

      <el-empty v-else description="加载用户信息失败" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getUserInfoByAccount, updateUserInfo, verifyPhone, type UserInfo } from '../../api/user'
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
</style>
