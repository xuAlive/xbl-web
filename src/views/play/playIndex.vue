<template>
  <el-card shadow="hover">
    <template #header>
      <div>娱乐工坊</div>
    </template>
    <el-row :gutter="20">
      <el-col :span="6" v-for="(app, index) in apps" :key="index">
        <el-card shadow="hover" class="icon-card app-card" @click="openApp(app.link)">
          <div style="text-align: center;">{{ app.name }}</div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'

interface AppItem {
  name: string
  link: string
}

const router = useRouter()

const apps = ref<AppItem[]>([
  { name: 'DeepSeek对话', link: 'deepSeekChat' },
  { name: '百度翻译', link: 'https://fanyi.baidu.com/mtpe-individual/multimodal?#/' },
  { name: '百度一下', link: 'https://www.baidu.com/index.htm' },
  { name: '小程序4', link: 'https://example.com/app4' },
  { name: '小程序5', link: 'https://example.com/app5' }
])

const openApp = (link: string) => {
  if (link === 'deepSeekChat') {
    router.push('/index/deepseek')
  } else {
    window.open(link, '_blank')
  }
}
</script>

<style scoped>
.app-card {
  cursor: pointer;
  margin-bottom: 20px;
}
.app-card:hover {
  transform: translateY(-2px);
}
</style>
