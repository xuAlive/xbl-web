<template>
  <div class="login" :style="{ backgroundImage: `url(${loginBgUrl})` }">
    <div class="login-box">
      <h2>欢迎登录</h2>
      <el-form
        size="large"
        ref="formRef"
        :model="formData"
        status-icon
        :rules="rules"
        label-width="60px"
      >
        <el-form-item label="账号" prop="loginId">
          <el-input v-model.number="formData.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="loginPwd">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm(formRef)" style="width: 100%">登录</el-button>
        </el-form-item>
        <el-form-item>
          <el-button @click="openRegisterDialog" style="width: 100%">注册</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog v-model="registerDialogVisible" title="注册账号" width="420px" :close-on-click-modal="false">
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="80px"
        size="large"
      >
        <el-form-item label="账号" prop="account">
          <el-input v-model="registerForm.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="registerForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRegister" :loading="registerLoading">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { $login, $register } from '@/modules/system/api/auth'
import { getUserInfoByAccount } from '@/modules/system/api/user'
import { setUserInfo, setUserMenus, setUserRoleCode, setUserPermissions, getUrlParam, removeUrlParam } from '@/utils/userInfo'
import { getUserMenus as fetchUserMenus } from '@/modules/system/api/menu'
import { getUserRoleCode as fetchUserRoleCode } from '@/modules/system/api/role'
import { getUserPermissions as fetchUserPermissions } from '@/modules/system/api/permission'
import { $post } from '@/utils/request'
import { useRouter } from 'vue-router'

const router = useRouter()

const loginBgUrl = computed(() => {
  const config = (window as any).__APP_CONFIG__ || {}
  const images = config.LOGIN_BG_IMAGES || []
  const index = (config.LOGIN_BG_INDEX || 1) - 1
  return images[index] || ''
})

const formRef = ref<FormInstance>()
const formData = reactive({
  account: '',
  password: ''
})

const validateLoginId = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入账号'))
  } else {
    callback()
  }
}

const validateLoginPwd = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    callback()
  }
}

const rules = reactive<FormRules<typeof formData>>({
  account: [{ validator: validateLoginId, trigger: 'blur' }],
  password: [{ validator: validateLoginPwd, trigger: 'blur' }],
})

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate(async (valid) => {
    if (valid) {
      const ret = await $login(formData)
      if (ret) {
        sessionStorage.removeItem('login_system_message_shown')
        router.push('/index/home')
      }
    }
  })
}

const registerDialogVisible = ref(false)
const registerFormRef = ref<FormInstance>()
const registerLoading = ref(false)

const registerForm = reactive({
  account: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = reactive<FormRules>({
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
})

const openRegisterDialog = () => {
  registerForm.account = ''
  registerForm.nickname = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  registerDialogVisible.value = true
}

const handleRegister = () => {
  if (!registerFormRef.value) return
  registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true
      try {
        const token = await $register({
          account: registerForm.account,
          password: registerForm.password,
          nickname: registerForm.nickname
        })
        if (token) {
          registerDialogVisible.value = false
          sessionStorage.setItem('token', token)

          setUserInfo({
            account: registerForm.account,
            token,
            name: registerForm.nickname,
            userName: ''
          })

          const menus = await fetchUserMenus()
          setUserMenus(menus)

          const roleCode = await fetchUserRoleCode()
          setUserRoleCode(roleCode)

          const permissions = await fetchUserPermissions()
          const permissionCodes = permissions.map((p: any) => p.permissionCode)
          setUserPermissions(permissionCodes)

          sessionStorage.removeItem('login_system_message_shown')
          router.push('/index/home')
        }
      } finally {
        registerLoading.value = false
      }
    }
  })
}

const handleWechatLogin = async (authCode: string) => {
  const ret = await $post(`/wechat/exchange?code=${encodeURIComponent(authCode)}`, {})
  if (ret.code !== 1 || !ret.data) {
    return
  }

  const token = ret.data as string
  sessionStorage.setItem('token', token)

  const userDetail = await getUserInfoByAccount()
  setUserInfo({
    account: userDetail?.account || '',
    token,
    name: userDetail?.name || '',
    userName: userDetail?.userName || ''
  })

  const menus = await fetchUserMenus()
  setUserMenus(menus)

  const roleCode = await fetchUserRoleCode()
  setUserRoleCode(roleCode)

  const permissions = await fetchUserPermissions()
  setUserPermissions(permissions.map((p: any) => p.permissionCode))

  sessionStorage.removeItem('login_system_message_shown')
  removeUrlParam('authCode')
  router.push('/index/home')
}

onMounted(() => {
  const authCode = getUrlParam('authCode')
  if (authCode) {
    void handleWechatLogin(authCode)
  }
})
</script>

<style scoped lang="sass">
.login
  position: fixed
  top: 0
  left: 0
  right: 0
  bottom: 0
  width: 100%
  height: 100%
  margin: 0
  padding: 0
  background-color: #e8f4f8
  background-size: 100% 100%
  background-position: center
  background-repeat: no-repeat
  display: flex
  justify-content: flex-end
  align-items: center
  overflow: hidden

  .login-box
    width: 400px
    padding: 40px
    margin-right: 150px
    background: rgba(255, 255, 255, 0.9)
    border-radius: 12px
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2)

    h2
      color: #2c5282
      font-size: 28px
      text-align: center
      margin-bottom: 30px
      font-weight: 600

    :deep(.el-form-item__label)
      color: #4a5568
      font-weight: 500

    :deep(.el-input__wrapper)
      border-radius: 8px

    :deep(.el-button--primary)
      background: #4299e1
      border-color: #4299e1
      border-radius: 8px
      height: 44px
      font-size: 16px
      &:hover
        background: #3182ce
        border-color: #3182ce

    :deep(.el-button--default)
      border-radius: 8px
      height: 44px
      font-size: 16px
</style>
