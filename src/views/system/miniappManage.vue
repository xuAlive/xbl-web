<template>
  <div class="miniapp-manage-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <h3>小程序管理</h3>
            <p>维护可展示的小程序列表，下架后逻辑删除，不再出现在小程序中心和本页。</p>
          </div>
          <el-button type="primary" link @click="loadMiniapps">刷新</el-button>
        </div>
      </template>

        <el-table :data="miniapps" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="intro" label="简介" min-width="240" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="route" label="路由" min-width="160" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isDelete === 1 ? 'info' : 'success'">
                {{ row.isDelete === 1 ? '已下架' : '上架中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.isDelete !== 1" type="danger" size="small" @click="handleOffline(row.id)">下架</el-button>
              <el-button v-else type="success" size="small" @click="handleOnline(row.id)">上架</el-button>
            </template>
          </el-table-column>
        </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { confirm } from '@/shared/ui/confirm'
import { getMiniappManageList, offlineMiniapp, onlineMiniapp, type Miniapp } from '../../api/miniapp'

const loading = ref(false)
const miniapps = ref<Miniapp[]>([])

const loadMiniapps = async () => {
  loading.value = true
  miniapps.value = await getMiniappManageList()
  loading.value = false
}

const handleOffline = async (id: number) => {
  if (!(await confirm({ message: '下架后该小程序将不再出现在展示列表，是否继续？', confirmText: '确定' }))) return
  const success = await offlineMiniapp(id)
  if (success) {
    await loadMiniapps()
  }
}

const handleOnline = async (id: number) => {
  const success = await onlineMiniapp(id)
  if (success) {
    await loadMiniapps()
  }
}

onMounted(() => {
  loadMiniapps()
})
</script>

<style scoped lang="scss">
.miniapp-manage-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.card-header h3 {
  margin: 0 0 6px;
}

.card-header p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}
</style>
