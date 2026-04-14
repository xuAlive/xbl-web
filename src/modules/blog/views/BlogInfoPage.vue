<template>
  <div class="blog-info-container">
    <el-tabs v-model="activeTab" type="border-card" class="blog-tabs">
      <el-tab-pane label="我的记录" name="myRecords">
        <MyRecords ref="myRecordsRef" />
      </el-tab-pane>
      <el-tab-pane label="浏览记录" name="browsingHistory">
        <BrowsingHistory ref="browsingHistoryRef" />
      </el-tab-pane>
      <el-tab-pane label="新作发布" name="blog" lazy>
        <BlogEditor />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watch, nextTick, onActivated } from 'vue'
import MyRecords from '@/views/blog/myRecords.vue'
import BrowsingHistory from '@/views/blog/browsingHistory.vue'

const BlogEditor = defineAsyncComponent(() => import('@/views/blog/blog.vue'))

const activeTab = ref('myRecords')
const myRecordsRef = ref<{ reload: () => void } | null>(null)
const browsingHistoryRef = ref<{ reload: () => void } | null>(null)

const refreshCurrentTab = () => {
  if (activeTab.value === 'myRecords') {
    myRecordsRef.value?.reload()
    return
  }

  if (activeTab.value === 'browsingHistory') {
    browsingHistoryRef.value?.reload()
  }
}

watch(activeTab, async () => {
  await nextTick()
  refreshCurrentTab()
})

onActivated(() => {
  refreshCurrentTab()
})
</script>

<style scoped lang="scss">
.blog-info-container {
  height: 100%;
  padding: 20px;
  background: #f5f7fa;

  .blog-tabs {
    height: 100%;

    :deep(.el-tabs__content) {
      height: calc(100% - 55px);
      overflow: hidden;
    }

    :deep(.el-tab-pane) {
      height: 100%;
      overflow: auto;
    }
  }
}
</style>
