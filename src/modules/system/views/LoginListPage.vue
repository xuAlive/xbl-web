<template>
  <div class="login-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2 class="page-title">登录信息</h2>
          <el-button type="primary" @click="refresh">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>

      <el-table :data="loginList" style="width: 100%" v-loading="tableLoading">
        <el-table-column prop="account" label="账号" width="150" />
        <el-table-column prop="ip" label="登录IP" width="180" />
        <el-table-column prop="address" label="登录地点" width="200">
          <template #default="scope">
            {{ scope.row.address || '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="loginCount" label="登录次数" width="120" align="center" />
        <el-table-column prop="lastLoginTime" label="最后登录时间">
          <template #default="scope">
            {{ formatDateTime(scope.row.lastLoginTime) }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!tableLoading && loginList.length === 0" description="暂无登录记录" />

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <div class="charts-row">
      <el-card class="chart-card map-card">
        <template #header>
          <h3 class="chart-title">登录地点分布</h3>
        </template>
        <div ref="mapChartRef" class="chart-container" v-loading="statsLoading"></div>
      </el-card>

      <el-card class="chart-card pie-card">
        <template #header>
          <h3 class="chart-title">省份登录统计</h3>
        </template>
        <div ref="pieChartRef" class="chart-container" v-loading="statsLoading"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getLoginRecords, getLoginLocationStats, type LoginRecord, type LoginLocationStats } from '@/api/login'
import { loadEcharts, type EChartsModule } from '@/shared/utils/echarts'

const loginList = ref<LoginRecord[]>([])
const tableLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

const statsLoading = ref(false)
const mapChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let echartsLib: EChartsModule | null = null
let mapInstance: ReturnType<EChartsModule['init']> | null = null
let pieInstance: ReturnType<EChartsModule['init']> | null = null
let mapRegistered = false

const ensureEcharts = async () => {
  echartsLib ??= await loadEcharts()
  return echartsLib
}

const cityCoordinates: Record<string, [number, number]> = {
  '北京': [116.4074, 39.9042],
  '上海': [121.4737, 31.2304],
  '广州': [113.2644, 23.1291],
  '深圳': [114.0579, 22.5431],
  '杭州': [120.1551, 30.2741],
  '成都': [104.0668, 30.5728],
  '武汉': [114.3055, 30.5931],
  '西安': [108.9398, 34.3416],
  '南京': [118.7969, 32.0603],
  '重庆': [106.5516, 29.563],
  '天津': [117.201, 39.0842],
  '苏州': [120.5954, 31.2989],
  '郑州': [113.6254, 34.7466],
  '长沙': [112.9388, 28.2282],
  '沈阳': [123.4328, 41.8045],
  '青岛': [120.3826, 36.0671],
  '济南': [117.1205, 36.6519],
  '大连': [121.6147, 38.914],
  '厦门': [118.0894, 24.4798],
  '合肥': [117.2272, 31.8206],
  '福州': [119.2965, 26.0745],
  '石家庄': [114.5149, 38.0428],
  '哈尔滨': [126.5349, 45.8038],
  '昆明': [102.8329, 24.8801],
  '南昌': [115.8581, 28.6832],
  '贵阳': [106.6302, 26.6477],
  '太原': [112.5489, 37.8706],
  '南宁': [108.3665, 22.817],
  '兰州': [103.8343, 36.0611],
  '呼和浩特': [111.749, 40.8424],
  '乌鲁木齐': [87.6177, 43.7928],
  '拉萨': [91.1322, 29.6604],
  '银川': [106.2782, 38.4664],
  '西宁': [101.7782, 36.6171],
  '海口': [110.3486, 20.02],
  '本地': [116.4074, 39.9042],
  '未知': [116.4074, 39.9042]
}

const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
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

const extractCityName = (address: string): string => {
  if (!address) return '未知'
  for (const city in cityCoordinates) {
    if (address.includes(city)) return city
  }
  const cityMatch = address.match(/([^省]+省)?([^市]+市)/)
  if (cityMatch && cityMatch[2]) {
    const extracted = cityMatch[2].replace('市', '')
    if (cityCoordinates[extracted]) return extracted
  }
  return '未知'
}

const loadTable = async () => {
  tableLoading.value = true
  try {
    const result = await getLoginRecords(currentPage.value, pageSize.value)
    loginList.value = result.records
    total.value = result.total
  } finally {
    tableLoading.value = false
  }
}

const handlePageChange = () => {
  loadTable()
}

const handleSizeChange = () => {
  currentPage.value = 1
  loadTable()
}

const loadCharts = async () => {
  statsLoading.value = true
  try {
    const stats = await getLoginLocationStats()
    await nextTick()
    await renderMap(stats)
    await renderPieChart(stats)
  } finally {
    statsLoading.value = false
  }
}

const renderMap = async (stats: LoginLocationStats) => {
  if (!mapChartRef.value) return
  const echarts = await ensureEcharts()
  if (!mapInstance) {
    mapInstance = echarts.init(mapChartRef.value)
  }

  const locationMap = new Map<string, number>()
  stats.locations.forEach(record => {
    const location = record.address || '未知'
    locationMap.set(location, (locationMap.get(location) || 0) + record.loginCount)
  })

  const scatterData = Array.from(locationMap.entries()).map(([location, count]) => {
    const cityName = extractCityName(location)
    const coords = cityCoordinates[cityName] || cityCoordinates['未知']
    return {
      name: location,
      value: [...coords, count],
      itemStyle: { color: '#5470c6' }
    }
  })

  const option = {
    title: {
      text: '登录地点分布图',
      subtext: '圆圈大小表示登录次数',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}<br/>登录次数: ${params.value[2]}`
    },
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.2,
      itemStyle: { areaColor: '#f3f3f3', borderColor: '#999' },
      emphasis: { itemStyle: { areaColor: '#e0e0e0' } }
    },
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize: (val: number[]) => Math.min(Math.max(val[2] * 2, 10), 50),
        label: { show: true, formatter: '{b}', position: 'right', fontSize: 11 },
        emphasis: { label: { show: true } }
      },
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: scatterData.slice(0, 5),
        symbolSize: (val: number[]) => Math.min(Math.max(val[2] * 2, 10), 50),
        showEffectOn: 'render',
        rippleEffect: { brushType: 'stroke', scale: 3, period: 4 },
        label: { show: false },
        itemStyle: { color: '#f56c6c', shadowBlur: 10, shadowColor: '#f56c6c' }
      }
    ]
  }

  const applyOption = () => {
    mapInstance?.setOption(option, true)
  }

  if (!mapRegistered) {
    fetch('/china.json')
      .then(res => res.json())
      .then(geoJson => {
        echarts.registerMap('china', geoJson)
        mapRegistered = true
        applyOption()
      })
      .catch(err => console.error('加载地图数据失败:', err))
  } else {
    applyOption()
  }
}

const renderPieChart = async (stats: LoginLocationStats) => {
  if (!pieChartRef.value) return
  const echarts = await ensureEcharts()
  if (!pieInstance) {
    pieInstance = echarts.init(pieChartRef.value)
  }

  const pieData = stats.provinceStats
    .filter(item => item.province && item.province !== '未知' && item.province !== '本地')
    .map(item => ({
      name: item.province,
      value: item.count
    }))

  const otherCount = stats.provinceStats
    .filter(item => !item.province || item.province === '未知' || item.province === '本地')
    .reduce((sum, item) => sum + item.count, 0)
  if (otherCount > 0) {
    pieData.push({ name: '其他', value: otherCount })
  }

  const option = {
    title: {
      text: '各省登录次数',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: '15%'
    },
    series: [
      {
        type: 'pie',
        radius: ['30%', '65%'],
        center: ['55%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}次'
        },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: pieData
      }
    ]
  }

  pieInstance.setOption(option, true)
}

const refresh = () => {
  loadTable()
  loadCharts()
}

const handleResize = () => {
  mapInstance?.resize()
  pieInstance?.resize()
}

onMounted(() => {
  loadTable()
  loadCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  mapInstance?.dispose()
  pieInstance?.dispose()
})
</script>

<style scoped lang="sass">
.login-list-container
  padding: 20px
  height: 100%
  overflow-y: auto

  .card-header
    display: flex
    justify-content: space-between
    align-items: center

  .page-title
    font-size: 24px
    color: #2c5282
    margin: 0
    font-family: var(--font-family-base)

  .chart-title
    font-size: 18px
    color: #2c5282
    margin: 0
    font-family: var(--font-family-base)

  .pagination-container
    display: flex
    justify-content: flex-end
    margin-top: 16px

  .charts-row
    display: flex
    gap: 20px
    margin-top: 20px

    .chart-card
      flex: 1
      min-width: 0

    .map-card
      flex: 1.2

    .chart-container
      width: 100%
      height: 500px
</style>
