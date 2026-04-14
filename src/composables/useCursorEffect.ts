/**
 * 鼠标特效组合式函数
 * 将粒子引擎从 App.vue 提取，支持主题配置和闲置特效
 */
import { ref, computed, type Ref } from 'vue'
import { getThemeById, defaultThemeId, type EffectTheme } from '../config/cursorEffects'

const STORAGE_KEY = 'cursor_effect_theme'

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

function loadThemeFromStorage(): string {
  return localStorage.getItem(STORAGE_KEY) || defaultThemeId
}

export function useCursorEffect(canvasRef: Ref<HTMLCanvasElement | undefined>) {
  const currentThemeId = ref<string>(loadThemeFromStorage())
  const currentTheme = computed<EffectTheme>(() => getThemeById(currentThemeId.value))

  let ctx: CanvasRenderingContext2D | null = null
  let animationId = 0
  let particles: Particle[] = []
  let mouseX = 0
  let mouseY = 0
  let prevMouseX = 0
  let prevMouseY = 0
  let idleTimer = 0
  let isIdle = false
  let idleFrame = 0

  const createTrailParticle = (x: number, y: number, dx: number, dy: number) => {
    const cfg = currentTheme.value.trail
    const speed = Math.sqrt(dx * dx + dy * dy)
    const count = Math.min(Math.floor(speed / cfg.speedDivisor) + 1, cfg.maxPerFrame)
    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * cfg.spread
      const v = speed * cfg.velocityFactor * Math.random() + 0.5
      particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        z: Math.random() * 100 - 50,
        vx: -Math.cos(angle) * v + (Math.random() - 0.5) * 2,
        vy: -Math.sin(angle) * v + (Math.random() - 0.5) * 2 - 1,
        vz: (Math.random() - 0.5) * 3,
        life: 1,
        maxLife: cfg.lifeRange[0] + Math.random() * cfg.lifeRange[1],
        size: cfg.sizeRange[0] + Math.random() * cfg.sizeRange[1],
        hue: cfg.hueRange[0] + Math.random() * cfg.hueRange[1],
        type: 'trail'
      })
    }
  }

  const createBurstParticles = (x: number, y: number) => {
    const cfg = currentTheme.value.burst
    const count = cfg.count[0] + Math.floor(Math.random() * cfg.count[1])
    const baseHue = cfg.hueMode === 'random' ? Math.random() * 360 : cfg.baseHue
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = cfg.speedRange[0] + Math.random() * cfg.speedRange[1]
      const zSpeed = cfg.zSpeedRange[0] + Math.random() * (cfg.zSpeedRange[1] - cfg.zSpeedRange[0])
      particles.push({
        x, y, z: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: zSpeed,
        life: 1,
        maxLife: cfg.lifeRange[0] + Math.random() * cfg.lifeRange[1],
        size: cfg.sizeRange[0] + Math.random() * cfg.sizeRange[1],
        hue: baseHue + Math.random() * cfg.hueSpread,
        type: 'burst'
      })
    }
    // 内圈小粒子
    for (let i = 0; i < cfg.innerCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.5 + Math.random() * 2
      particles.push({
        x, y,
        z: (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.5) * 4,
        life: 1,
        maxLife: 30 + Math.random() * 20,
        size: 1 + Math.random() * 2,
        hue: baseHue + 40 + Math.random() * 40,
        type: 'burst'
      })
    }
  }

  const createIdleParticles = () => {
    const cfg = currentTheme.value.idle
    const trailCfg = currentTheme.value.trail
    idleFrame++

    const baseHue = cfg.hueShift
      ? (trailCfg.hueRange[0] + idleFrame * 0.5) % 360
      : trailCfg.hueRange[0]

    switch (cfg.type) {
      case 'orbit': {
        // 粒子绕光标旋转
        for (let i = 0; i < cfg.particleCount; i++) {
          const angle = (Math.PI * 2 * i) / cfg.particleCount + idleFrame * 0.02 * cfg.speed
          particles.push({
            x: mouseX + Math.cos(angle) * cfg.radius,
            y: mouseY + Math.sin(angle) * cfg.radius,
            z: Math.sin(angle * 2) * 20,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            vz: 0,
            life: 1,
            maxLife: 25,
            size: 1.5 + Math.random() * 1.5,
            hue: baseHue + Math.random() * trailCfg.hueRange[1] * 0.5,
            type: 'idle'
          })
        }
        break
      }
      case 'float': {
        // 粒子在光标附近上下漂浮
        if (idleFrame % 3 === 0) {
          for (let i = 0; i < Math.ceil(cfg.particleCount / 2); i++) {
            const offsetX = (Math.random() - 0.5) * cfg.radius * 2
            particles.push({
              x: mouseX + offsetX,
              y: mouseY + (Math.random() - 0.5) * cfg.radius,
              z: (Math.random() - 0.5) * 40,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.3 - Math.random() * 0.5,
              vz: (Math.random() - 0.5) * 0.5,
              life: 1,
              maxLife: 40 + Math.random() * 30,
              size: 1.5 + Math.random() * 2,
              hue: baseHue + Math.random() * trailCfg.hueRange[1],
              type: 'idle'
            })
          }
        }
        break
      }
      case 'pulse': {
        // 脉冲式放大缩小发光
        const pulsePhase = Math.sin(idleFrame * 0.05 * cfg.speed)
        if (idleFrame % 4 === 0) {
          const r = cfg.radius * (0.5 + pulsePhase * 0.5)
          for (let i = 0; i < cfg.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2
            particles.push({
              x: mouseX + Math.cos(angle) * r,
              y: mouseY + Math.sin(angle) * r,
              z: 0,
              vx: Math.cos(angle) * 0.5,
              vy: Math.sin(angle) * 0.5,
              vz: 0,
              life: 1,
              maxLife: 20,
              size: 2 + pulsePhase * 2,
              hue: baseHue + Math.random() * trailCfg.hueRange[1] * 0.3,
              type: 'idle'
            })
          }
        }
        break
      }
      case 'sparkle': {
        // 随机位置闪烁亮点
        if (idleFrame % 5 === 0) {
          for (let i = 0; i < Math.ceil(cfg.particleCount / 2); i++) {
            const angle = Math.random() * Math.PI * 2
            const dist = Math.random() * cfg.radius
            particles.push({
              x: mouseX + Math.cos(angle) * dist,
              y: mouseY + Math.sin(angle) * dist,
              z: (Math.random() - 0.5) * 20,
              vx: 0,
              vy: 0,
              vz: 0,
              life: 1,
              maxLife: 12 + Math.random() * 10,
              size: 1 + Math.random() * 3,
              hue: baseHue + Math.random() * trailCfg.hueRange[1],
              type: 'idle'
            })
          }
        }
        break
      }
      case 'breathe': {
        // 周期性扩展粒子环
        if (idleFrame % 8 === 0) {
          const ringRadius = cfg.radius * (0.3 + (idleFrame % 40) / 40 * 0.7)
          for (let i = 0; i < cfg.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / cfg.particleCount
            particles.push({
              x: mouseX + Math.cos(angle) * ringRadius,
              y: mouseY + Math.sin(angle) * ringRadius,
              z: 0,
              vx: Math.cos(angle) * 0.3,
              vy: Math.sin(angle) * 0.3,
              vz: 0,
              life: 1,
              maxLife: 30,
              size: 1.5 + Math.random(),
              hue: baseHue + Math.random() * trailCfg.hueRange[1] * 0.3,
              type: 'idle'
            })
          }
        }
        break
      }
      case 'ripple': {
        // 涟漪式向外扩散
        if (idleFrame % 10 === 0) {
          for (let i = 0; i < cfg.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / cfg.particleCount
            particles.push({
              x: mouseX,
              y: mouseY,
              z: 0,
              vx: Math.cos(angle) * cfg.speed * 1.2,
              vy: Math.sin(angle) * cfg.speed * 1.2,
              vz: 0,
              life: 1,
              maxLife: 35 + Math.random() * 15,
              size: 1.5 + Math.random() * 1.5,
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
    if (!ctx || !canvasRef.value) return
    const W = canvasRef.value.width
    const H = canvasRef.value.height
    const phys = currentTheme.value.physics
    const theme = currentTheme.value

    ctx.clearRect(0, 0, W, H)

    // 闲置特效
    if (isIdle && mouseX > 0 && mouseY > 0) {
      createIdleParticles()
    }

    // 更新和绘制粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= 1 / p.maxLife
      if (p.life <= 0) {
        particles.splice(i, 1)
        continue
      }

      // 物理更新
      p.x += p.vx
      p.y += p.vy
      p.z += p.vz
      p.vy += phys.gravity
      p.vx *= phys.friction
      p.vy *= phys.friction
      p.vz *= phys.zFriction

      // 3D 透视投影
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

      // 发光效果
      if (screenSize > 2) {
        const glowMul = p.type === 'idle' ? 4 : theme.trail.glowMultiplier
        ctx.shadowBlur = screenSize * glowMul
        ctx.shadowColor = `hsla(${p.hue}, ${saturation}, ${lightness}, ${alpha * 0.6})`
      }

      ctx.beginPath()
      ctx.arc(screenX, screenY, Math.max(screenSize * 0.5, 0.5), 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue}, ${saturation}, ${lightness}, ${alpha})`
      ctx.fill()

      ctx.restore()
    }

    // 粒子数量限制
    if (particles.length > phys.maxParticles) {
      particles.splice(0, particles.length - phys.maxParticles)
    }

    animationId = requestAnimationFrame(animate)
  }

  const handleMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX
    mouseY = e.clientY
    const dx = mouseX - prevMouseX
    const dy = mouseY - prevMouseY
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      createTrailParticle(mouseX, mouseY, dx, dy)
      isIdle = false
      idleFrame = 0
      clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => { isIdle = true }, 800)
    }
    prevMouseX = mouseX
    prevMouseY = mouseY
  }

  const handleClick = (e: MouseEvent) => {
    createBurstParticles(e.clientX, e.clientY)
  }

  const handleResize = () => {
    if (!canvasRef.value) return
    canvasRef.value.width = window.innerWidth
    canvasRef.value.height = window.innerHeight
  }

  const handleThemeChange = (e: Event) => {
    const themeId = (e as CustomEvent<string>).detail
    if (themeId && typeof themeId === 'string') {
      currentThemeId.value = themeId
      localStorage.setItem(STORAGE_KEY, themeId)
    }
  }

  function setTheme(id: string) {
    currentThemeId.value = id
    localStorage.setItem(STORAGE_KEY, id)
  }

  function init() {
    if (!canvasRef.value) return
    ctx = canvasRef.value.getContext('2d')
    handleResize()
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    window.addEventListener('resize', handleResize)
    window.addEventListener('cursor-effect-change', handleThemeChange)
    animate()
  }

  function destroy() {
    cancelAnimationFrame(animationId)
    clearTimeout(idleTimer)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('click', handleClick)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('cursor-effect-change', handleThemeChange)
    particles = []
  }

  return { currentThemeId, currentTheme, setTheme, init, destroy }
}
