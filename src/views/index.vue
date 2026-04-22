<template>
  <div class="index">
    <div class="left">
      <h2>忘川阁</h2>
      <el-menu
          :router="true"
          active-text-color="#ffa60f"
          background-color="#314a43"
          :default-active="currentPath"
          class="el-menu-vertical-demo"
      >
        <!-- 动态渲染菜单 -->
        <template v-for="menu in sideMenus" :key="menu.id">
          <!-- 有子菜单的目录 -->
          <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="String(menu.id)">
            <template #title>
              <el-icon><component :is="getIconComponent(menu.icon)" /></el-icon>
              <span>{{ menu.menuName }}</span>
            </template>
            <template v-for="child in menu.children" :key="child.id">
              <el-menu-item
                v-if="child.visible === 1"
                :index="child.path"
              >
                {{ child.menuName }}
              </el-menu-item>
            </template>
          </el-sub-menu>
          <!-- 没有子菜单的菜单项 -->
          <el-menu-item
            v-else-if="menu.menuType === 2 && menu.visible === 1"
            :index="menu.path"
          >
            <el-icon><component :is="getIconComponent(menu.icon)" /></el-icon>
            <span>{{ menu.menuName }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
    <div class="right">
      <div class="top"><el-menu
          :ellipsis="false"
          mode="horizontal"
          background-color="#314a43"
          text-color="#fff"
          active-text-color="#ffd04b"
          @select="handleTopMenuSelect"
      >
        <!-- 动态渲染顶部菜单（邮件、消息等） -->
        <template v-for="menu in topMenus" :key="menu.id">
          <el-menu-item :index="menu.path">
            <el-icon><component :is="getIconComponent(menu.icon)" /></el-icon>
            {{ menu.menuName }}
          </el-menu-item>
        </template>
        <el-sub-menu index="user-menu">
          <template #title><el-icon><Avatar /></el-icon>{{ userName }}</template>
          <el-menu-item index="feedback">问题反馈</el-menu-item>
          <el-menu-item index="logout" @click="handleLogout">退出登录</el-menu-item>
        </el-sub-menu>

      </el-menu></div>
      <transition name="fade-slide">
        <div v-if="loginSystemMessageVisible && loginSystemMessage" class="login-system-message">
          <div class="login-system-message__main">
            <div class="login-system-message__title">{{ loginSystemMessage.title }}</div>
            <div class="login-system-message__content">{{ loginSystemMessage.content }}</div>
          </div>
          <button class="login-system-message__close" type="button" @click="closeLoginSystemMessage">
            x
          </button>
        </div>
      </transition>
      <div class="center">
        <router-view v-slot="{ Component, route: currentRoute }">
          <keep-alive>
            <component
              :is="Component"
              :key="currentRoute.fullPath"
              v-if="Component && currentRoute.meta.keepAlive"
            />
          </keep-alive>
          <component
            :is="Component"
            :key="currentRoute.fullPath"
            v-if="Component && !currentRoute.meta.keepAlive"
          />
        </router-view>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, markRaw, watch } from 'vue'
import { HomeFilled, UserFilled, Tools, Message, ChatDotSquare, Avatar, House, Reading, Cellphone, Bell, Edit, HomeFilled as HomeFilledIcon, User, InfoFilled, Document, Menu as MenuIcon, Lock, Setting } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import { confirm } from '@/shared/ui/confirm'
import { clearUserInfo, getUserMenus, getUserInfo } from '../utils/userInfo'
import type { Menu } from '@/modules/system/api/menu'
import { getLatestSystemMessage, type SystemMessage } from '@/api/systemMessage'

const router = useRouter()
const route = useRoute()
const loginSystemMessage = ref<SystemMessage | null>(null)
const loginSystemMessageVisible = ref(false)
let systemMessageTimer: number | null = null

type PageLoader = () => Promise<unknown>

// 用户菜单数据
const menus = ref<Menu[]>([])

// 当前路径
const currentPath = computed(() => route.path)

// 用户名（优先级：昵称 > 真实姓名 > 账号）
const userName = computed(() => {
  const userInfo = getUserInfo()
  return userInfo?.name || userInfo?.userName || userInfo?.account || '用户'
})

// 图标映射
const iconMap: Record<string, any> = {
  'el-icon-house': markRaw(House),
  'el-icon-home-filled': markRaw(HomeFilled),
  'el-icon-reading': markRaw(Reading),
  'el-icon-cellphone': markRaw(Cellphone),
  'el-icon-chat-dot-round': markRaw(ChatDotSquare),
  'el-icon-message': markRaw(Message),
  'el-icon-bell': markRaw(Bell),
  'el-icon-edit': markRaw(Edit),
  'el-icon-setting': markRaw(Setting),
  'el-icon-user': markRaw(User),
  'el-icon-info-filled': markRaw(InfoFilled),
  'el-icon-document': markRaw(Document),
  'el-icon-menu': markRaw(MenuIcon),
  'el-icon-avatar': markRaw(Avatar),
  'el-icon-lock': markRaw(Lock),
  'el-icon-tools': markRaw(Tools),
}

// 获取图标组件
const getIconComponent = (iconName: string | undefined) => {
  if (!iconName) return HomeFilled
  return iconMap[iconName] || HomeFilled
}

// 侧边栏菜单（parent_id=0的一级目录及其子菜单）
const sideMenus = computed(() => {
  return menus.value.filter(menu => menu.parentId === 0 && menu.visible === 1)
})

// 顶部菜单（parent_id=-1的菜单显示在右上角）
const topMenus = computed(() => {
  return menus.value.filter(menu => menu.parentId === -1 && menu.visible === 1)
})

const routePreloaders: Record<string, PageLoader> = {
  '/index/home': () => import('@/modules/blog/views/HomeSquarePage.vue'),
  '/index/miniapp': () => import('@/modules/blog/views/MiniappCenterPage.vue'),
  '/index/miniappManage': () => import('@/modules/system/views/MiniappManagePage.vue'),
  '/index/deepseek': () => import('@/modules/blog/views/DeepseekPage.vue'),
  '/index/bookCrawler': () => import('@/modules/crawler/views/BookCrawlerAppPage.vue'),
  '/index/medicalKnowledge': () => import('@/modules/blog/views/MedicalKnowledgePage.vue'),
  '/index/mail': () => import('@/modules/system/views/MailPage.vue'),
  '/index/message': () => import('@/modules/system/views/MessagePage.vue'),
  '/index/blogInfo': () => import('@/modules/blog/views/BlogInfoPage.vue'),
  '/index/account': () => import('@/modules/system/views/AccountPage.vue'),
  '/index/accountInfo': () => import('@/modules/system/views/AccountInfoPage.vue'),
  '/index/loginList': () => import('@/modules/system/views/LoginListPage.vue'),
  '/index/menuManage': () => import('@/modules/system/views/MenuManagePage.vue'),
  '/index/roleManage': () => import('@/modules/system/views/RoleManagePage.vue'),
  '/index/permissionManage': () => import('@/modules/system/views/PermissionManagePage.vue'),
  '/index/effectsManage': () => import('@/modules/system/views/EffectsManagePage.vue'),
  '/index/schedule': () => import('@/modules/schedule/views/ScheduleAppPage.vue'),
  '/index/calendar': () => import('@/modules/calendar/views/CalendarAppPage.vue'),
  '/index/timesheet': () => import('@/modules/timesheet/views/TimesheetAppPage.vue'),
}

const preloadedPaths = new Set<string>()

const collectVisibleMenuPaths = (items: Menu[], paths = new Set<string>()) => {
  items.forEach((item) => {
    if (item.visible === 1 && item.path) {
      paths.add(item.path)
    }

    if (item.children?.length) {
      collectVisibleMenuPaths(item.children as Menu[], paths)
    }
  })

  return paths
}

const scheduleIdleTask = (task: () => void) => {
  if ('requestIdleCallback' in window) {
    ;(window as Window & {
      requestIdleCallback: (callback: IdleRequestCallback) => number
    }).requestIdleCallback(() => task())
    return
  }

  setTimeout(task, 300)
}

const preloadAccessiblePages = () => {
  scheduleIdleTask(() => {
    const menuPaths = collectVisibleMenuPaths(menus.value)

    menuPaths.forEach((path) => {
      if (preloadedPaths.has(path)) {
        return
      }

      const loader = routePreloaders[path]
      if (!loader) {
        return
      }

      preloadedPaths.add(path)
      void loader()
    })
  })
}

const closeLoginSystemMessage = () => {
  loginSystemMessageVisible.value = false
  if (systemMessageTimer) {
    clearTimeout(systemMessageTimer)
    systemMessageTimer = null
  }
}

const showLoginSystemMessage = async () => {
  const shownKey = 'login_system_message_shown'
  if (sessionStorage.getItem(shownKey) === '1') {
    return
  }

  const latestMessage = await getLatestSystemMessage()
  if (!latestMessage) {
    return
  }

  loginSystemMessage.value = latestMessage
  loginSystemMessageVisible.value = true
  sessionStorage.setItem(shownKey, '1')

  if (systemMessageTimer) {
    clearTimeout(systemMessageTimer)
  }

  systemMessageTimer = window.setTimeout(() => {
    closeLoginSystemMessage()
  }, 10000)
}

watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (!oldPath || newPath === oldPath || !loginSystemMessageVisible.value) {
      return
    }
    closeLoginSystemMessage()
  }
)

// 初始化加载菜单
onMounted(() => {
  menus.value = getUserMenus()
  // 如果没有菜单数据，可能需要重新登录
  if (menus.value.length === 0) {
    message.warning('请先登录')
    router.push('/')
  }

  preloadAccessiblePages()
  showLoginSystemMessage()
  window.addEventListener('user-menus-updated', refreshMenus)
})

onBeforeUnmount(() => {
  window.removeEventListener('user-menus-updated', refreshMenus)
  closeLoginSystemMessage()
})

const refreshMenus = () => {
  menus.value = getUserMenus()
  preloadAccessiblePages()
}

const handleTopMenuSelect = (index: string) => {
  if (index === 'logout') {
    return
  }

  if (index === 'feedback') {
    message.info('问题反馈功能整理中')
    return
  }

  if (index && route.path !== index) {
    router.push(index)
  }
}

// 退出登录处理函数
const handleLogout = () => {
  confirm({
    message: '确定要退出登录吗？',
    confirmText: '确定',
  }).then((confirmed) => {
    if (!confirmed) {
      message.info('已取消退出')
      return
    }
    // 清除用户信息
    clearUserInfo()

    // 显示退出成功提示
    message.success('退出登录成功')

    // 跳转到登录页
    router.replace('/')
  })
}
</script>
<style scoped lang="scss">
.index{
  width: 100vw;
  height: 100vh;
  display: flex;
  .left{
    width: 200px;
    flex-shrink: 0;
    background-color: #314a43;
    color: #ffa60f;
    padding-right: 5px;
    overflow-y: auto;
    .el-menu{
      border-right: none;
      color: #ffa60f;
    }
    .el-menu-item.is-active {
      color: #ffa60f;
    }
    .el-menu-item{
      color: white;
    }
    :deep(.el-sub-menu__title){
      color: white;
    }
    h2{
      text-align: center;
      font-size: 40px;
      font-family: var(--font-family-brand);
      height: 60px;
      line-height: 60px;
    }
  }
.right{
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    .top{
      height: 60px;
      background-color: #314a43;
      color: #ffa60f;
      display: flex;
      justify-content: flex-end;
    }
    .center{
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      background: #f5f7fa;
      position: relative;
    }
  }
}

.login-system-message{
  position: absolute;
  top: 72px;
  left: 16px;
  right: 16px;
  z-index: 20;
  padding: 14px 18px;
  border-radius: 16px;
  background: rgba(255, 247, 230, 0.78);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 166, 15, 0.22);
  box-shadow: 0 18px 36px rgba(255, 166, 15, 0.12);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  &__main{
    min-width: 0;
  }

  &__title{
    font-size: 15px;
    font-weight: 700;
    color: #8a5a00;
  }

  &__content{
    margin-top: 8px;
    color: #6b7280;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  &__close{
    border: none;
    background: transparent;
    color: #8a5a00;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    padding: 2px 4px;
    flex: 0 0 auto;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active{
  transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to{
  opacity: 0;
  transform: translateY(-8px);
}
</style>
