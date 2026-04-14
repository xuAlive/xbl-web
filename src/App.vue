<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useCursorEffect } from './composables/useCursorEffect'
import XblConfirmHost from '@/shared/components/XblConfirmHost.vue'

const canvasRef = ref<HTMLCanvasElement>()
const { init, destroy } = useCursorEffect(canvasRef)
const route = useRoute()

onMounted(() => init())
onBeforeUnmount(() => destroy())
</script>

<template>
  <el-config-provider :locale="zhCn">
    <canvas v-if="route.meta.platform !== 'mobile'" ref="canvasRef" class="particle-canvas"></canvas>
    <router-view></router-view>
    <XblConfirmHost />
  </el-config-provider>
</template>

<style scoped>
.particle-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 1;
}
</style>
