<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import XblConfirmHost from '@/shared/components/XblConfirmHost.vue'

onMounted(() => {
  document.body.classList.add('xbl-mobile-app')
})

onUnmounted(() => {
  document.body.classList.remove('xbl-mobile-app')
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
    <XblConfirmHost />
  </el-config-provider>
</template>
