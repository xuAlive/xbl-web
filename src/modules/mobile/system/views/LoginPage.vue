<template>
  <div class="login-container">
    <div class="login-bg"></div>

    <div class="login-content">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="48"><Promotion /></el-icon>
        </div>
        <h1 class="title">小徐的应用</h1>
        <p class="subtitle">记录生活，分享美好</p>
      </div>

      <div class="login-actions">
        <el-button
          type="primary"
          size="large"
          class="wechat-btn disabled"
          disabled
        >
          <el-icon class="wechat-icon"><ChatDotRound /></el-icon>
          微信一键登录
        </el-button>
        <div class="wechat-tip">小程序开发中，敬请期待</div>

        <div class="divider">
          <span>或</span>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
          <el-form-item prop="account">
            <el-input
              v-model="form.account"
              placeholder="请输入账号"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              @click="handleLogin"
              :loading="loginLoading"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="register-link">
          没有账号？<a @click="goRegister">立即注册</a>
        </div>
      </div>

      <div class="login-footer">
        <p>登录即表示同意 <a href="#">用户协议</a> 和 <a href="#">隐私政策</a></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Promotion, ChatDotRound } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { setUserInfo, setUserRoleCode, setUserPermissions, setUserMenus, handleWechatCallback, isLoggedIn } from '@/mobile/utils/auth'
import { $post } from '@/mobile/utils/request'
import { getUserRoleCode as fetchUserRoleCode } from '@/modules/mobile/system/api/role'
import { getUserPermissions as fetchUserPermissions } from '@/modules/mobile/system/api/permission'
import { getUserMenus as fetchUserMenus } from '@/modules/mobile/system/api/menu'
import { getUserInfoByAccount } from '@/modules/mobile/system/api/user'
import { message } from '@/shared/ui/feedback'

const router = useRouter()
const formRef = ref<FormInstance>()
const loginLoading = ref(false)

const form = reactive({
  account: '',
  password: ''
})

const rules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loginLoading.value = true
  try {
    const res = await $post('/sys/login', form)
    if (res.code === 1) {
      const token = res.data
      const userDetail = await getUserInfoByAccount(form.account)
      setUserInfo({
        account: form.account,
        token,
        name: userDetail?.name || '',
        userName: userDetail?.userName || ''
      })

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
      message.error(res.codeMessage || '登录失败')
    }
  } catch {
    message.error('登录失败，请稍后重试')
  } finally {
    loginLoading.value = false
  }
}

onMounted(() => {
  if (handleWechatCallback()) {
    const redirectPath = sessionStorage.getItem('redirect_path') || '/'
    sessionStorage.removeItem('redirect_path')
    router.push(redirectPath)
    return
  }

  if (isLoggedIn()) {
    router.push('/')
  }
})

const goRegister = () => {
  router.push('/register')
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 0 50% 50% / 0 0 15% 15%;
}

.login-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 60px 30px 30px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

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

.login-actions {
  background: #fff;
  border-radius: 20px;
  padding: 30px 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.wechat-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  background: #07c160;
  border-color: #07c160;

  &:hover, &:focus {
    background: #06ad56;
    border-color: #06ad56;
  }

  &.disabled {
    background: #ccc;
    border-color: #ccc;
    cursor: not-allowed;

    &:hover, &:focus {
      background: #ccc;
      border-color: #ccc;
    }
  }

  .wechat-icon {
    margin-right: 8px;
  }
}

.wechat-tip {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 25px 0;
  color: #999;
  font-size: 13px;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #eee;
  }

  span {
    padding: 0 15px;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 18px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 4px 15px;
  }

  .login-btn {
    width: 100%;
    height: 48px;
    border-radius: 24px;
    font-size: 16px;
  }
}

.login-footer {
  margin-top: auto;
  text-align: center;
  padding-top: 30px;

  p {
    font-size: 12px;
    color: #999;
    margin: 0;

    a {
      color: #667eea;
      text-decoration: none;
    }
  }
}

.register-link {
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
