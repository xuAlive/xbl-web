<template>
  <div class="register-container">
    <div class="register-bg"></div>

    <div class="register-content">
      <div class="register-header">
        <div class="logo">
          <el-icon :size="48"><Promotion /></el-icon>
        </div>
        <h1 class="title">注册账号</h1>
        <p class="subtitle">创建您的账号，开始探索</p>
      </div>

      <div class="register-actions">
        <el-form ref="formRef" :model="form" :rules="rules" class="register-form">
          <el-form-item prop="account">
            <el-input v-model="form.account" placeholder="请输入账号" prefix-icon="User" size="large" />
          </el-form-item>
          <el-form-item prop="nickname">
            <el-input v-model="form.nickname" placeholder="请输入昵称" prefix-icon="UserFilled" size="large" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleRegister"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="register-btn" @click="handleRegister" :loading="registerLoading">
              注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-link">
          已有账号？<a @click="goLogin">返回登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Promotion } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { setUserInfo, setUserRoleCode, setUserPermissions, setUserMenus } from '@/mobile/utils/auth'
import { $post } from '@/mobile/utils/request'
import { getUserRoleCode as fetchUserRoleCode } from '@/modules/mobile/system/api/role'
import { getUserPermissions as fetchUserPermissions } from '@/modules/mobile/system/api/permission'
import { getUserMenus as fetchUserMenus } from '@/modules/mobile/system/api/menu'
import { message } from '@/shared/ui/feedback'

const router = useRouter()
const formRef = ref<FormInstance>()
const registerLoading = ref(false)

const form = reactive({
  account: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

const handleRegister = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  registerLoading.value = true
  try {
    const res = await $post('/sys/register', {
      account: form.account,
      password: form.password,
      nickname: form.nickname
    })
    if (res.code === 1) {
      message.success('注册成功')
      setUserInfo({ account: form.account, token: res.data })

      const roleCode = await fetchUserRoleCode()
      setUserRoleCode(roleCode)

      const permissions = await fetchUserPermissions()
      setUserPermissions(permissions.map(p => p.permissionCode))

      const menus = await fetchUserMenus()
      setUserMenus(menus)

      const redirectPath = sessionStorage.getItem('redirect_path') || '/'
      sessionStorage.removeItem('redirect_path')
      router.push(redirectPath)
    } else {
      message.error(res.codeMessage || '注册失败')
    }
  } catch {
    message.error('注册失败，请稍后重试')
  } finally {
    registerLoading.value = false
  }
}

const goLogin = () => {
  router.push('/login')
}
</script>

<style scoped lang="scss">
.register-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.register-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 0 50% 50% / 0 0 15% 15%;
}

.register-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 60px 30px 30px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;

  .logo {
    width: 80px;
    height: 80px;
    background: #fff;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    .el-icon {
      color: #667eea;
    }
  }

  .title {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 10px;
  }

  .subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }
}

.register-actions {
  background: #fff;
  border-radius: 20px;
  padding: 30px 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.register-form {
  .el-form-item {
    margin-bottom: 18px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 4px 15px;
  }

  .register-btn {
    width: 100%;
    height: 48px;
    border-radius: 24px;
    font-size: 16px;
  }
}

.login-link {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
  color: #999;

  a {
    color: #667eea;
    cursor: pointer;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
