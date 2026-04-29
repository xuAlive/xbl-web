import { createRouter, createWebHashHistory } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import { checkMiniappRoute } from '@/api/miniapp'

import { getUserMenus, isLoggedIn } from '@/utils/userInfo'

// 无需登录即可访问的白名单路由
const whiteList = ['/', '/login']

const alwaysAllowedAfterLogin = [
  '/index/home',
  '/index/accountInfo',
  '/index/miniapp',
  '/index/baziFortune',
  '/index/bookCrawler',
  '/index/medicalKnowledge',
  '/index/medicalCaseQc',
  '/index/timesheet',
  '/index/schedule',
  '/index/calendar',
  '/index/blogEditor'
]

const miniappRoutePaths = new Set([
  '/index/deepseek',
  '/index/baziFortune',
  '/index/bookCrawler',
  '/index/medicalKnowledge',
  '/index/medicalCaseQc',
  '/index/timesheet',
  '/index/schedule',
  '/index/calendar',
])

const canAccessRoute = (path: string): boolean => {
  if (alwaysAllowedAfterLogin.includes(path)) {
    return true
  }

  if (path.startsWith('/index/articleDetail/')) {
    return true
  }

  if (path.startsWith('/index/blogEditor/')) {
    return true
  }

  const menus = getUserMenus()
  const allowedPaths = new Set<string>()

  const collectPaths = (items: any[]) => {
    items.forEach((item) => {
      if (item.path) {
        allowedPaths.add(item.path)
      }
      if (item.children?.length) {
        collectPaths(item.children)
      }
    })
  }

  collectPaths(menus)
  return allowedPaths.has(path)
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      meta: { title: '登录', platform: 'pc', publicRoute: true },
      component: () => import('@/modules/system/views/LoginPage.vue'),
    },
    {
      path: '/login',
      redirect: '/',
    },
    {
      path: '/index',
      meta: { title: '首页', platform: 'pc' },
      component: () => import('@/modules/system/views/AppShell.vue'),
      children: [
        {
          path: 'home',
          meta: { title: '博客广场', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/blog/views/HomeSquarePage.vue'),
        },
        {
          path: 'articleDetail/:id',
          meta: { title: '文章详情', platform: 'pc' },
          component: () => import('@/modules/blog/views/ArticleDetailPage.vue'),
        },
        {
          path: 'miniapp',
          meta: { title: '小程序', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/blog/views/MiniappCenterPage.vue'),
        },
        {
          path: 'miniappManage',
          meta: { title: '小程序管理', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/MiniappManagePage.vue'),
        },
        {
          path: 'deepseek',
          meta: { title: 'DeepSeek对话', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/blog/views/DeepseekPage.vue'),
        },
        {
          path: 'baziFortune',
          meta: { title: '八字运势', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/blog/views/BaziFortunePage.vue'),
        },
        {
          path: 'bookCrawler',
          meta: { title: '书籍爬虫', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/crawler/views/BookCrawlerAppPage.vue'),
        },
        {
          path: 'medicalKnowledge',
          meta: { title: '医疗知识库', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/blog/views/MedicalKnowledgePage.vue'),
        },
        {
          path: 'medicalCaseQc',
          meta: { title: '病例质控', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/blog/views/MedicalCaseQcPage.vue'),
        },
        {
          path: 'mail',
          meta: { title: '邮件', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/MailPage.vue'),
        },
        {
          path: 'message',
          meta: { title: '消息', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/MessagePage.vue'),
        },
        {
          path: 'blogInfo',
          meta: { title: '个人博客', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/blog/views/BlogInfoPage.vue'),
        },
        {
          path: 'blogEditor/:id?',
          meta: { title: '文章编辑', platform: 'pc' },
          component: () => import('@/views/blog/blog.vue'),
        },
        {
          path: 'account',
          meta: { title: '账号管理', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/AccountPage.vue'),
        },
        {
          path: 'accountInfo',
          meta: { title: '账号详情', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/AccountInfoPage.vue'),
        },
        {
          path: 'loginList',
          meta: { title: '登录信息', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/LoginListPage.vue'),
        },
        {
          path: 'menuManage',
          meta: { title: '菜单管理', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/MenuManagePage.vue'),
        },
        {
          path: 'roleManage',
          meta: { title: '角色管理', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/RoleManagePage.vue'),
        },
        {
          path: 'permissionManage',
          meta: { title: '权限管理', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/PermissionManagePage.vue'),
        },
        {
          path: 'effectsManage',
          meta: { title: '鼠标特效', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/system/views/EffectsManagePage.vue'),
        },
        {
          path: 'schedule',
          meta: { title: '排班系统', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/schedule/views/ScheduleAppPage.vue'),
        },
        {
          path: 'calendar',
          meta: { title: '日程管理', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/calendar/views/CalendarAppPage.vue'),
        },
        {
          path: 'timesheet',
          meta: { title: '工时记录', platform: 'pc', keepAlive: true },
          component: () => import('@/modules/timesheet/views/TimesheetAppPage.vue'),
        },
      ],
    },
  ],
})

// 路由守卫 - 检查登录状态
router.beforeEach(async (to, _from, next) => {
  document.title = (to.meta.title as string) || '忘川'

  if (whiteList.includes(to.path)) {
    next()
  } else if (!isLoggedIn()) {
    message.warning('请先登录')
    next('/')
  } else if (!canAccessRoute(to.path)) {
    message.warning('当前角色无权访问该页面')
    next('/index/home')
  } else if (miniappRoutePaths.has(to.path) && !(await checkMiniappRoute(to.path))) {
    next('/index/miniapp')
  } else {
    next()
  }
})

export default router
