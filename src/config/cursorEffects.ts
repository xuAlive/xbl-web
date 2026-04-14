/**
 * 鼠标特效主题配置
 */

export interface TrailConfig {
  speedDivisor: number
  maxPerFrame: number
  spread: number
  velocityFactor: number
  hueRange: [number, number] // [baseHue, hueSpread]
  sizeRange: [number, number]
  lifeRange: [number, number]
  glowMultiplier: number
}

export interface BurstConfig {
  count: [number, number]
  innerCount: number
  speedRange: [number, number]
  zSpeedRange: [number, number]
  hueMode: 'random' | 'fixed'
  baseHue: number
  hueSpread: number
  sizeRange: [number, number]
  lifeRange: [number, number]
}

export interface IdleEffect {
  type: 'orbit' | 'pulse' | 'float' | 'sparkle' | 'breathe' | 'ripple'
  particleCount: number
  speed: number
  radius: number
  hueShift: boolean
}

export interface PhysicsConfig {
  gravity: number
  friction: number
  zFriction: number
  perspective: number
  maxParticles: number
}

export interface EffectTheme {
  id: string
  name: string
  description: string
  trail: TrailConfig
  burst: BurstConfig
  idle: IdleEffect
  physics: PhysicsConfig
  saturation: { trail: string; burst: string }
  lightness: { trail: string; burst: string }
}

export const effectThemes: Record<string, EffectTheme> = {
  ocean: {
    id: 'ocean',
    name: '海洋波浪',
    description: '沉静的蓝绿色粒子尾迹，宁静深邃',
    trail: {
      speedDivisor: 3,
      maxPerFrame: 5,
      spread: 1.5,
      velocityFactor: 0.3,
      hueRange: [200, 60],
      sizeRange: [2, 3],
      lifeRange: [40, 30],
      glowMultiplier: 3,
    },
    burst: {
      count: [30, 20],
      innerCount: 15,
      speedRange: [2, 6],
      zSpeedRange: [-4, 8],
      hueMode: 'random',
      baseHue: 0,
      hueSpread: 80,
      sizeRange: [2, 5],
      lifeRange: [50, 40],
    },
    idle: {
      type: 'orbit',
      particleCount: 6,
      speed: 1,
      radius: 30,
      hueShift: false,
    },
    physics: {
      gravity: 0.03,
      friction: 0.98,
      zFriction: 0.95,
      perspective: 300,
      maxParticles: 500,
    },
    saturation: { trail: '80%', burst: '90%' },
    lightness: { trail: '60%', burst: '50%' },
  },

  aurora: {
    id: 'aurora',
    name: '极光幻影',
    description: '绿紫交织的极光色彩，梦幻飘逸',
    trail: {
      speedDivisor: 2,
      maxPerFrame: 6,
      spread: 2.0,
      velocityFactor: 0.25,
      hueRange: [100, 180],
      sizeRange: [2, 4],
      lifeRange: [50, 40],
      glowMultiplier: 4,
    },
    burst: {
      count: [25, 15],
      innerCount: 12,
      speedRange: [1.5, 5],
      zSpeedRange: [-3, 6],
      hueMode: 'random',
      baseHue: 0,
      hueSpread: 120,
      sizeRange: [2, 4],
      lifeRange: [60, 40],
    },
    idle: {
      type: 'float',
      particleCount: 8,
      speed: 0.8,
      radius: 35,
      hueShift: true,
    },
    physics: {
      gravity: 0.01,
      friction: 0.97,
      zFriction: 0.94,
      perspective: 350,
      maxParticles: 500,
    },
    saturation: { trail: '70%', burst: '85%' },
    lightness: { trail: '55%', burst: '55%' },
  },

  fire: {
    id: 'fire',
    name: '烈焰燃烧',
    description: '炽热的橙红色火焰粒子，充满能量',
    trail: {
      speedDivisor: 2,
      maxPerFrame: 7,
      spread: 1.2,
      velocityFactor: 0.35,
      hueRange: [0, 40],
      sizeRange: [2, 4],
      lifeRange: [30, 25],
      glowMultiplier: 4,
    },
    burst: {
      count: [35, 25],
      innerCount: 18,
      speedRange: [3, 8],
      zSpeedRange: [-5, 10],
      hueMode: 'fixed',
      baseHue: 15,
      hueSpread: 40,
      sizeRange: [2, 6],
      lifeRange: [40, 30],
    },
    idle: {
      type: 'pulse',
      particleCount: 4,
      speed: 1.5,
      radius: 20,
      hueShift: false,
    },
    physics: {
      gravity: -0.05,
      friction: 0.96,
      zFriction: 0.93,
      perspective: 280,
      maxParticles: 600,
    },
    saturation: { trail: '100%', burst: '100%' },
    lightness: { trail: '50%', burst: '50%' },
  },

  sakura: {
    id: 'sakura',
    name: '樱花飘落',
    description: '柔和的粉色花瓣粒子，温柔浪漫',
    trail: {
      speedDivisor: 4,
      maxPerFrame: 4,
      spread: 2.0,
      velocityFactor: 0.2,
      hueRange: [320, 40],
      sizeRange: [2, 3],
      lifeRange: [50, 40],
      glowMultiplier: 3,
    },
    burst: {
      count: [20, 15],
      innerCount: 10,
      speedRange: [1, 4],
      zSpeedRange: [-2, 4],
      hueMode: 'fixed',
      baseHue: 340,
      hueSpread: 30,
      sizeRange: [2, 4],
      lifeRange: [60, 50],
    },
    idle: {
      type: 'sparkle',
      particleCount: 5,
      speed: 0.6,
      radius: 40,
      hueShift: false,
    },
    physics: {
      gravity: 0.04,
      friction: 0.97,
      zFriction: 0.96,
      perspective: 320,
      maxParticles: 400,
    },
    saturation: { trail: '60%', burst: '70%' },
    lightness: { trail: '70%', burst: '65%' },
  },

  matrix: {
    id: 'matrix',
    name: '数字矩阵',
    description: '纯绿色数字风格粒子，赛博朋克',
    trail: {
      speedDivisor: 3,
      maxPerFrame: 6,
      spread: 0.8,
      velocityFactor: 0.4,
      hueRange: [120, 20],
      sizeRange: [1, 3],
      lifeRange: [35, 25],
      glowMultiplier: 5,
    },
    burst: {
      count: [40, 20],
      innerCount: 20,
      speedRange: [2, 7],
      zSpeedRange: [-3, 6],
      hueMode: 'fixed',
      baseHue: 130,
      hueSpread: 20,
      sizeRange: [1, 4],
      lifeRange: [40, 30],
    },
    idle: {
      type: 'breathe',
      particleCount: 8,
      speed: 1.2,
      radius: 25,
      hueShift: false,
    },
    physics: {
      gravity: 0.06,
      friction: 0.95,
      zFriction: 0.92,
      perspective: 250,
      maxParticles: 600,
    },
    saturation: { trail: '100%', burst: '100%' },
    lightness: { trail: '50%', burst: '45%' },
  },

  galaxy: {
    id: 'galaxy',
    name: '星河漫游',
    description: '全光谱循环的宇宙星尘，绚烂壮阔',
    trail: {
      speedDivisor: 2,
      maxPerFrame: 6,
      spread: 1.8,
      velocityFactor: 0.3,
      hueRange: [0, 360],
      sizeRange: [1, 4],
      lifeRange: [45, 35],
      glowMultiplier: 4,
    },
    burst: {
      count: [35, 25],
      innerCount: 15,
      speedRange: [2, 8],
      zSpeedRange: [-6, 12],
      hueMode: 'random',
      baseHue: 0,
      hueSpread: 100,
      sizeRange: [1, 6],
      lifeRange: [55, 45],
    },
    idle: {
      type: 'ripple',
      particleCount: 10,
      speed: 1,
      radius: 35,
      hueShift: true,
    },
    physics: {
      gravity: 0.02,
      friction: 0.97,
      zFriction: 0.94,
      perspective: 350,
      maxParticles: 600,
    },
    saturation: { trail: '90%', burst: '95%' },
    lightness: { trail: '55%', burst: '50%' },
  },
}

export const defaultThemeId = 'ocean'

export const getThemeList = (): EffectTheme[] => Object.values(effectThemes)

export const getThemeById = (id: string): EffectTheme =>
  effectThemes[id] || effectThemes[defaultThemeId]
