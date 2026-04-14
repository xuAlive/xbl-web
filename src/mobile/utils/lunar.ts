/**
 * 农历计算工具
 * Lunar Calendar Utility
 */

// 农历数据 1900-2100
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
]

// 天干
const Gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

// 地支
const Zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 生肖
const Animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 农历月份
const nStr1 = ['日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const nStr2 = ['初', '十', '廿', '卅']
const nStr3 = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']

// 返回农历y年一整年的总天数
function lYearDays(y: number): number {
  let i, sum = 348
  for (i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[y - 1900] & i) ? 1 : 0
  }
  return sum + leapDays(y)
}

// 返回农历y年闰月是哪个月；若y年没有闰月 则返回0
function leapMonth(y: number): number {
  return lunarInfo[y - 1900] & 0xf
}

// 返回农历y年闰月的天数 若该年没有闰月则返回0
function leapDays(y: number): number {
  if (leapMonth(y)) {
    return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

// 返回农历y年m月（非闰月）的总天数，计算m为闰月时的天数请使用leapDays方法
function monthDays(y: number, m: number): number {
  if (m > 12 || m < 1) {
    return -1
  }
  return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29
}

// 农历年份转换为干支纪年
function toGanZhiYear(lYear: number): string {
  let ganKey = (lYear - 3) % 10
  let zhiKey = (lYear - 3) % 12
  if (ganKey === 0) ganKey = 10
  if (zhiKey === 0) zhiKey = 12
  return Gan[ganKey - 1] + Zhi[zhiKey - 1]
}

// 传入offset偏移量返回干支
function toGanZhi(offset: number): string {
  return Gan[offset % 10] + Zhi[offset % 12]
}

// 传入农历日期数字返回汉字表示法
function toChinaDay(d: number): string {
  let s
  switch (d) {
    case 10:
      s = '初十'
      break
    case 20:
      s = '二十'
      break
    case 30:
      s = '三十'
      break
    default:
      s = nStr2[Math.floor(d / 10)]
      s += nStr1[d % 10]
  }
  return s
}

// 传入农历月份数字返回汉字表示法
function toChinaMonth(m: number): string {
  if (m > 12 || m < 1) {
    return ''
  }
  return nStr3[m - 1] + '月'
}

export interface LunarDate {
  lYear: number      // 农历年
  lMonth: number     // 农历月
  lDay: number       // 农历日
  animal: string     // 生肖
  yearCn: string     // 农历年（中文）
  monthCn: string    // 农历月（中文）
  dayCn: string      // 农历日（中文）
  gzYear: string     // 干支年
  gzMonth: string    // 干支月
  gzDay: string      // 干支日
  isLeap: boolean    // 是否闰月
  isTerm: boolean    // 是否节气
  term: string       // 节气名
}

// 传入阳历年月日获得详细的农历信息
export function solar2lunar(y: number, m: number, d: number): LunarDate | null {
  if (y < 1900 || y > 2100) {
    return null
  }

  if (y === 1900 && m === 1 && d < 31) {
    return null
  }

  let objDate = new Date(y, m - 1, d)
  let i, leap = 0, temp = 0

  // 计算从1900年1月31日（农历正月初一）到指定日期的天数
  let offset = Math.floor((objDate.getTime() - new Date(1900, 0, 31).getTime()) / 86400000)

  // 计算农历年
  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lYearDays(i)
    offset -= temp
  }
  if (offset < 0) {
    offset += temp
    i--
  }

  let year = i
  leap = leapMonth(i)
  let isLeap = false

  // 计算农历月
  for (i = 1; i < 13 && offset > 0; i++) {
    // 闰月
    if (leap > 0 && i === (leap + 1) && isLeap === false) {
      --i
      isLeap = true
      temp = leapDays(year)
    } else {
      temp = monthDays(year, i)
    }

    // 解除闰月
    if (isLeap === true && i === (leap + 1)) {
      isLeap = false
    }

    offset -= temp
  }

  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) {
      isLeap = false
    } else {
      isLeap = true
      --i
    }
  }

  if (offset < 0) {
    offset += temp
    --i
  }

  let month = i
  let day = offset + 1

  // 天干地支计算
  let sm = m - 1
  let gzY = toGanZhiYear(year)

  // 月柱
  let firstNode = getTermInfo(y, m * 2 - 1)
  let gzM = toGanZhi((y - 1900) * 12 + m + 11)
  if (d >= firstNode) {
    gzM = toGanZhi((y - 1900) * 12 + m + 12)
  }

  // 日柱
  let dayCyclical = Math.floor((Date.UTC(y, sm, 1, 0, 0, 0, 0) / 86400000) + 25567 + 10)
  let gzD = toGanZhi(dayCyclical + d - 1)

  // 节气
  let term = ''
  let isTerm = false
  let firstTermDay = getTermInfo(y, m * 2 - 1)
  let secondTermDay = getTermInfo(y, m * 2)

  if (d === firstTermDay) {
    isTerm = true
    term = getSolarTerm(m * 2 - 1)
  }
  if (d === secondTermDay) {
    isTerm = true
    term = getSolarTerm(m * 2)
  }

  return {
    lYear: year,
    lMonth: month,
    lDay: day,
    animal: Animals[(year - 4) % 12],
    yearCn: gzY + '年',
    monthCn: (isLeap ? '闰' : '') + toChinaMonth(month),
    dayCn: toChinaDay(day),
    gzYear: gzY,
    gzMonth: gzM,
    gzDay: gzD,
    isLeap: isLeap,
    isTerm: isTerm,
    term: term
  }
}

// 节气信息
const sTermInfo = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921,
  173149, 195551, 218072, 240693, 263343, 285989, 308563, 331033,
  353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758
]

const solarTerm = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
]

function getSolarTerm(n: number): string {
  return solarTerm[n - 1] || ''
}

function getTermInfo(y: number, n: number): number {
  const offDate = new Date((31556925974.7 * (y - 1900) + sTermInfo[n - 1] * 60000) + Date.UTC(1900, 0, 6, 2, 5))
  return offDate.getUTCDate()
}

// 获取指定日期的农历简要信息
export function getLunarDayStr(y: number, m: number, d: number): string {
  const lunar = solar2lunar(y, m, d)
  if (!lunar) return ''

  // 优先显示节气
  if (lunar.isTerm) {
    return lunar.term
  }

  // 初一显示月份
  if (lunar.lDay === 1) {
    return lunar.monthCn
  }

  // 其他显示日期
  return lunar.dayCn
}
