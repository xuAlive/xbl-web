<template>
  <div class="effect-preview" :class="{ active }">
    <canvas ref="previewCanvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { EffectTheme } from '../config/cursorEffects'

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
  size: number
  hue: number
  type: 'trail' | 'burst' | 'idle'
}

const props = withDefaults(defineProps<{
  theme: EffectTheme
  width?: number
  height?: number
  active?: boolean
}>(), {
  width: 280,
  height: 180,
  active: false
})

const previewCanvas = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D | null = null
let animationId = 0
let particles: Particle[] = []
let frame = 0
let simMouseX = 0
let simMouseY = 0
let prevSimX = 0
let prevSimY = 0
let isSimIdle = false
let idleFrame = 0

const createTrailParticle = (x: number, y: number, dx: number, dy: number) => {
  const cfg = props.theme.trail
  const speed = Math.sqrt(dx * dx + dy * dy)
  // 减少预览中的粒子数量
  const count = Math.min(Math.floor(speed / cfg.speedDivisor) + 1, Math.ceil(cfg.maxPerFrame * 0.5))
  for (let i = 0; i < count; i++) {
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * cfg.spread
    const v = speed * cfg.velocityFactor * Math.random() + 0.5
    particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      z: Math.random() * 60 - 30,
      vx: -Math.cos(angle) * v + (Math.random() - 0.5) * 1.5,
      vy: -Math.sin(angle) * v + (Math.random() - 0.5) * 1.5 - 0.5,
      vz: (Math.random() - 0.5) * 2,
      life: 1,
      maxLife: cfg.lifeRange[0] * 0.7 + Math.random() * cfg.lifeRange[1] * 0.7,
      size: (cfg.sizeRange[0] + Math.random() * cfg.sizeRange[1]) * 0.8,
      hue: cfg.hueRange[0] + Math.random() * cfg.hueRange[1],
      type: 'trail'
    })
  }
}

const createBurstParticles = (x: number, y: number) => {
  const cfg = props.theme.burst
  const count = Math.floor((cfg.count[0] + Math.random() * cfg.count[1]) * 0.4)
  const baseHue = cfg.hueMode === 'random' ? Math.random() * 360 : cfg.baseHue
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const speed = (cfg.speedRange[0] + Math.random() * cfg.speedRange[1]) * 0.6
    particles.push({
      x, y, z: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: (Math.random() - 0.5) * 4,
      life: 1,
      maxLife: cfg.lifeRange[0] * 0.6 + Math.random() * cfg.lifeRange[1] * 0.6,
      size: (cfg.sizeRange[0] + Math.random() * cfg.sizeRange[1]) * 0.7,
      hue: baseHue + Math.random() * cfg.hueSpread,
      type: 'burst'
    })
  }
}

const createIdleParticles = () => {
  const cfg = props.theme.idle
  const trailCfg = props.theme.trail
  idleFrame++
  const baseHue = cfg.hueShift
    ? (trailCfg.hueRange[0] + idleFrame * 0.5) % 360
    : trailCfg.hueRange[0]

  // 简化的闲置特效预览
  switch (cfg.type) {
    case 'orbit': {
      for (let i = 0; i < Math.ceil(cfg.particleCount * 0.5); i++) {
        const angle = (Math.PI * 2 * i) / Math.ceil(cfg.particleCount * 0.5) + idleFrame * 0.02 * cfg.speed
        const r = cfg.radius * 0.6
        particles.push({
          x: simMouseX + Math.cos(angle) * r,
          y: simMouseY + Math.sin(angle) * r,
          z: 0, vx: 0, vy: 0, vz: 0,
          life: 1, maxLife: 20,
          size: 1.5,
          hue: baseHue + Math.random() * trailCfg.hueRange[1] * 0.5,
          type: 'idle'
        })
      }
      break
    }
    case 'float': {
      if (idleFrame % 4 === 0) {
        particles.push({
          x: simMouseX + (Math.random() - 0.5) * cfg.radius,
          y: simMouseY + (Math.random() - 0.5) * cfg.radius * 0.5,
          z: 0,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.3 - Math.random() * 0.3,
          vz: 0,
          life: 1, maxLife: 35,
          size: 1.5 + Math.random(),
          hue: baseHue + Math.random() * trailCfg.hueRange[1],
          type: 'idle'
        })
      }
      break
    }
    case 'pulse': {
      if (idleFrame % 5 === 0) {
        const pulsePhase = Math.sin(idleFrame * 0.05 * cfg.speed)
        const r = cfg.radius * 0.4 * (0.5 + pulsePhase * 0.5)
        const angle = Math.random() * Math.PI * 2
        particles.push({
          x: simMouseX + Math.cos(angle) * r,
          y: simMouseY + Math.sin(angle) * r,
          z: 0, vx: Math.cos(angle) * 0.3, vy: Math.sin(angle) * 0.3, vz: 0,
          life: 1, maxLife: 18,
          size: 1.5 + pulsePhase,
          hue: baseHue + Math.random() * trailCfg.hueRange[1] * 0.3,
          type: 'idle'
        })
      }
      break
    }
    case 'sparkle': {
      if (idleFrame % 6 === 0) {
        const angle = Math.random() * Math.PI * 2
        const dist = Math.random() * cfg.radius * 0.6
        particles.push({
          x: simMouseX + Math.cos(angle) * dist,
          y: simMouseY + Math.sin(angle) * dist,
          z: 0, vx: 0, vy: 0, vz: 0,
          life: 1, maxLife: 10 + Math.random() * 8,
          size: 1 + Math.random() * 2,
          hue: baseHue + Math.random() * trailCfg.hueRange[1],
          type: 'idle'
        })
      }
      break
    }
    case 'breathe': {
      if (idleFrame % 10 === 0) {
        const ringR = cfg.radius * 0.5 * (0.3 + (idleFrame % 40) / 40 * 0.7)
        for (let i = 0; i < Math.ceil(cfg.particleCount * 0.5); i++) {
          const a = (Math.PI * 2 * i) / Math.ceil(cfg.particleCount * 0.5)
          particles.push({
            x: simMouseX + Math.cos(a) * ringR,
            y: simMouseY + Math.sin(a) * ringR,
            z: 0, vx: Math.cos(a) * 0.2, vy: Math.sin(a) * 0.2, vz: 0,
            life: 1, maxLife: 25,
            size: 1.2,
            hue: baseHue + Math.random() * trailCfg.hueRange[1] * 0.3,
            type: 'idle'
          })
        }
      }
      break
    }
    case 'ripple': {
      if (idleFrame % 12 === 0) {
        for (let i = 0; i < Math.ceil(cfg.particleCount * 0.5); i++) {
          const a = (Math.PI * 2 * i) / Math.ceil(cfg.particleCount * 0.5)
          particles.push({
            x: simMouseX, y: simMouseY, z: 0,
            vx: Math.cos(a) * cfg.speed * 0.8,
            vy: Math.sin(a) * cfg.speed * 0.8,
            vz: 0,
            life: 1, maxLife: 30,
            size: 1.2,
            hue: baseHue + Math.random() * trailCfg.hueRange[1],
            type: 'idle'
          })
        }
      }
      break
    }
  }
}

const animate = () => {
  if (!ctx) return
  const W = props.width
  const H = props.height
  const phys = props.theme.physics
  const theme = props.theme

  // 降帧：每3帧绘制一次
  frame++
  if (frame % 3 !== 0) {
    animationId = requestAnimationFrame(animate)
    return
  }

  ctx.clearRect(0, 0, W, H)

  // 模拟鼠标轨迹 - 正弦波移动
  const cycleLen = 300 // 约5秒一个周期(300帧/60fps * 3跳帧)
  const phase = (frame / 3) % cycleLen
  const t = phase / cycleLen

  if (t < 0.6) {
    // 移动阶段
    const moveT = t / 0.6
    prevSimX = simMouseX
    prevSimY = simMouseY
    simMouseX = W * 0.2 + W * 0.6 * moveT
    simMouseY = H * 0.5 + Math.sin(moveT * Math.PI * 2) * H * 0.25
    isSimIdle = false
    idleFrame = 0
    const dx = simMouseX - prevSimX
    const dy = simMouseY - prevSimY
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      createTrailParticle(simMouseX, simMouseY, dx * 2, dy * 2)
    }
  } else if (t < 0.65) {
    // 点击爆发
    if (Math.abs(t - 0.62) < 0.005) {
      createBurstParticles(simMouseX, simMouseY)
    }
  } else {
    // 闲置阶段
    isSimIdle = true
    createIdleParticles()
  }

  // 绘制粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life -= 1 / p.maxLife
    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }

    p.x += p.vx
    p.y += p.vy
    p.z += p.vz
    p.vy += phys.gravity
    p.vx *= phys.friction
    p.vy *= phys.friction
    p.vz *= phys.zFriction

    const scale = phys.perspective / (phys.perspective + p.z)
    const screenX = p.x + (p.x - W / 2) * (scale - 1)
    const screenY = p.y + (p.y - H / 2) * (scale - 1)
    const screenSize = p.size * scale

    const isBurst = p.type === 'burst'
    const alpha = p.life * (isBurst ? 0.9 : 0.7)
    const saturation = isBurst ? theme.saturation.burst : theme.saturation.trail
    const baseLightness = parseInt(isBurst ? theme.lightness.burst : theme.lightness.trail)
    const lightnessOffset = isBurst ? (1 - p.life) * 30 : (1 - p.life) * 20
    const lightness = `${baseLightness + lightnessOffset}%`

    ctx.save()
    ctx.globalAlpha = alpha

    if (screenSize > 1.5) {
      ctx.shadowBlur = screenSize * 3
      ctx.shadowColor = `hsla(${p.hue}, ${saturation}, ${lightness}, ${alpha * 0.5})`
    }

    ctx.beginPath()
    ctx.arc(screenX, screenY, Math.max(screenSize * 0.5, 0.3), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, ${saturation}, ${lightness}, ${alpha})`
    ctx.fill()
    ctx.restore()
  }

  // 粒子上限
  if (particles.length > 200) {
    particles.splice(0, particles.length - 200)
  }

  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  if (!previewCanvas.value) return
  ctx = previewCanvas.value.getContext('2d')
  simMouseX = props.width * 0.2
  simMouseY = props.height * 0.5
  prevSimX = simMouseX
  prevSimY = simMouseY
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  particles = []
})
</script>

<style scoped lang="scss">
.effect-preview {
  border-radius: 10px;
  overflow: hidden;
  background: #1a1a2e;
  border: 2px solid transparent;
  transition: border-color 0.3s;

  &.active {
    border-color: #409eff;
  }

  canvas {
    display: block;
    width: 100%;
    height: auto;
  }
}
</style>
