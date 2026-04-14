import { createRouter, createWebHashHistory } from 'vue-router'
import { isLoggedIn } from '../utils/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      meta: { title: '应用中心', requiresAuth: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/system/views/HomePage.vue')
    },
    {
      path: '/blog',
      name: 'Blog',
      meta: { title: '个人博客', requiresAuth: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/blog/views/BlogIndexPage.vue'),
      children: [
        {
          path: '',
          redirect: '/blog/square'
        },
        {
          path: 'square',
          name: 'BlogSquare',
          meta: { title: '博客广场', platform: 'mobile' },
          component: () => import('@/modules/mobile/blog/views/BlogSquarePage.vue')
        },
        {
          path: 'my',
          name: 'BlogMy',
          meta: { title: '我的博客', platform: 'mobile' },
          component: () => import('@/modules/mobile/blog/views/BlogMyPage.vue')
        },
        {
          path: 'history',
          name: 'BlogHistory',
          meta: { title: '浏览记录', platform: 'mobile' },
          component: () => import('@/modules/mobile/blog/views/BlogBrowsingHistoryPage.vue')
        },
        {
          path: 'detail/:id',
          name: 'BlogDetail',
          meta: { title: '文章详情', platform: 'mobile' },
          component: () => import('@/modules/mobile/blog/views/BlogDetailPage.vue')
        },
        {
          path: 'edit',
          name: 'BlogEdit',
          meta: { title: '写文章', platform: 'mobile' },
          component: () => import('@/modules/mobile/blog/views/BlogEditPage.vue')
        }
      ]
    },
    {
      path: '/deepseek',
      name: 'DeepSeek',
      meta: { title: 'AI对话', requiresAuth: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/blog/views/DeepseekPage.vue')
    },
    {
      path: '/schedule',
      name: 'Schedule',
      meta: { title: '排班管理', requiresAuth: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/schedule/views/ScheduleIndexPage.vue'),
      children: [
        {
          path: '',
          redirect: '/schedule/my'
        },
        {
          path: 'my',
          name: 'ScheduleMy',
          meta: { title: '我的排班', platform: 'mobile' },
          component: () => import('@/modules/mobile/schedule/views/ScheduleMyPage.vue')
        },
        {
          path: 'manage',
          name: 'ScheduleManage',
          meta: { title: '排班管理', platform: 'mobile' },
          component: () => import('@/modules/mobile/schedule/views/ScheduleManagePage.vue')
        },
        {
          path: 'employee',
          name: 'ScheduleEmployee',
          meta: { title: '员工管理', platform: 'mobile' },
          component: () => import('@/modules/mobile/schedule/views/ScheduleEmployeePage.vue')
        }
      ]
    },
    {
      path: '/diary',
      name: 'Diary',
      meta: { title: '日记本', requiresAuth: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/calendar/views/DiaryIndexPage.vue'),
      children: [
        {
          path: '',
          name: 'DiaryWrite',
          meta: { title: '写日记', platform: 'mobile' },
          component: () => import('@/modules/mobile/calendar/views/DiaryWritePage.vue')
        },
        {
          path: 'calendar',
          name: 'DiaryCalendar',
          meta: { title: '日历', platform: 'mobile' },
          component: () => import('@/modules/mobile/calendar/views/DiaryCalendarPage.vue')
        },
        {
          path: 'edit/:id?',
          name: 'DiaryEdit',
          meta: { title: '编辑日记', platform: 'mobile' },
          component: () => import('@/modules/mobile/calendar/views/DiaryEditPage.vue')
        }
      ]
    },
    {
      path: '/timesheet',
      name: 'Timesheet',
      meta: { title: '工时记录', requiresAuth: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/timesheet/views/TimesheetIndexPage.vue')
    },
    {
      path: '/timesheet/project/:projectId',
      name: 'TimesheetProjectDetail',
      meta: { title: '项目详情', requiresAuth: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/timesheet/views/ProjectDetailPage.vue')
    },
    {
      path: '/timesheet/settlement/:id',
      name: 'TimesheetSettlementDetail',
      meta: { title: '结算详情', requiresAuth: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/timesheet/views/SettlementDetailPage.vue')
    },
    {
      path: '/login',
      name: 'Login',
      meta: { title: '登录', publicRoute: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/system/views/LoginPage.vue')
    },
    {
      path: '/register',
      name: 'Register',
      meta: { title: '注册', publicRoute: true, platform: 'mobile' },
      component: () => import('@/modules/mobile/system/views/RegisterPage.vue')
    }
  ]
})

router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '小徐的应用'

  if (to.meta.requiresAuth && !isLoggedIn()) {
    sessionStorage.setItem('redirect_path', to.fullPath)
    next('/login')
    return
  }

  next()
})

export default router
