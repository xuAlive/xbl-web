<template>
  <div class="account-container">
    <el-card class="header-card">
      <h2 class="page-title">账号管理</h2>
      <el-button type="primary" @click="loadUserList">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </el-card>

    <el-card class="content-card">
      <el-table :data="accountList" style="width: 100%" v-loading="loading">
        <el-table-column prop="account" label="账号" width="150" />
        <el-table-column prop="userName" label="真实姓名" width="120" />
        <el-table-column prop="name" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="isDelete" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isDelete === 0 ? 'success' : 'danger'">
              {{ scope.row.isDelete === 0 ? '正常' : '已删除' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleViewDetail(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && accountList.length === 0" description="暂无用户数据" />
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="dialogVisible" title="用户详情" width="600px">
      <el-descriptions :column="2" border v-if="currentUser">
        <el-descriptions-item label="账号">{{ currentUser.account }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ currentUser.userName }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.name }}</el-descriptions-item>
        <el-descriptions-item label="邮箱" :span="2">{{ currentUser.email }}</el-descriptions-item>
        <el-descriptions-item label="出生日期">{{ currentUser.birthday || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ currentUser.age || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ currentUser.sex === 1 ? '男' : currentUser.sex === 0 ? '女' : '未填写' }}
        </el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentUser.idCard || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="个人简介" :span="2">
          {{ currentUser.intro || '未填写' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getUserList, getUserInfoByAccount, type UserBasic, type UserInfo } from '../../api/user'

const accountList = ref<UserBasic[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentUser = ref<UserInfo | null>(null)

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  // 如果已经是 yyyy-MM-dd HH:mm:ss 格式，直接返回
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTime)) {
    return dateTime
  }
  // 如果是其他格式，尝试转换
  const date = new Date(dateTime)
  if (isNaN(date.getTime())) return dateTime

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 加载用户列表
const loadUserList = async () => {
  loading.value = true
  try {
    const data = await getUserList()
    accountList.value = data
  } finally {
    loading.value = false
  }
}

// 查看用户详情
const handleViewDetail = async (row: UserBasic) => {
  loading.value = true
  try {
    const data = await getUserInfoByAccount(row.account)
    if (data) {
      currentUser.value = data
      dialogVisible.value = true
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped lang="sass">
.account-container
  padding: 20px
  height: 100%
  overflow-y: auto

  .header-card
    margin-bottom: 20px
    display: flex
    justify-content: space-between
    align-items: center

    .page-title
      font-size: 24px
      color: #2c5282
      margin: 0
      font-family: var(--font-family-base)

  .content-card
    .pagination
      margin-top: 20px
      display: flex
      justify-content: flex-end
</style>
