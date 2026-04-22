<template>
  <div class="fortune-page" :class="{ 'result-mode': isResultMode }">
    <div class="page-grid" :class="{ 'input-collapsed': isInputCollapsed }">
      <section class="hero-panel">
        <div class="hero-copy">
          <h1>{{ activeTab === 'single' ? '八字运势测算' : '合八字姻缘分析' }}</h1>
          <p>
            输入生辰信息后自动切换为动态分析页，命盘摘要与 AI 解读同步生成，
            阅读方式参考主流对话式测算站点。
          </p>
        </div>

        <div class="hero-side">
          <div class="tab-switch">
            <button class="tab-button" :class="{ active: activeTab === 'single' }" @click="activeTab = 'single'">
              八字运势
            </button>
            <button class="tab-button" :class="{ active: activeTab === 'marriage' }" @click="activeTab = 'marriage'">
              合八字姻缘
            </button>
          </div>
        </div>
      </section>

      <section class="panel-card input-panel" :class="{ collapsed: isInputCollapsed }">
        <div v-if="isInputCollapsed" class="collapsed-panel">
          <button class="sidebar-toggle" type="button" @click="expandInputPanel">
            <span class="sidebar-toggle-icon">›</span>
          </button>
          <span class="sidebar-label">{{ activeTab === 'single' ? '填写信息' : '合盘信息' }}</span>
          <span class="sidebar-caption">点击展开</span>
        </div>

        <template v-else>
        <div class="panel-heading">
          <div>
            <h2>{{ activeTab === 'single' ? '填写测算信息' : '填写双方信息' }}</h2>
          </div>
          <div class="panel-heading-actions">
            <el-button v-if="!props.mobileMode" plain @click="toggleInputPanel">折叠</el-button>
            <el-button plain @click="historyDrawerVisible = true">历史记录</el-button>
            <el-tag :type="streaming ? 'warning' : 'info'" effect="dark">
              {{ streaming ? '分析生成中' : '等待提交' }}
            </el-tag>
          </div>
        </div>

        <template v-if="activeTab === 'single'">
          <div class="form-grid single-grid">
            <div class="field-card">
              <label>姓名</label>
              <el-input v-model="singleForm.name" maxlength="20" placeholder="请输入姓名，可选" />
            </div>
            <div class="field-card wide">
              <label>出生日期</label>
              <div class="date-row">
                <div class="segment-input-group date-segments">
                  <input
                    ref="singleBirthYearRef"
                    v-model="singleForm.birthYear"
                    class="segment-input year"
                    inputmode="numeric"
                    maxlength="4"
                    placeholder="年"
                    @input="handleSegmentInput(singleForm, 'birthYear', 4, singleBirthMonthRef)"
                  />
                  <span class="segment-separator">-</span>
                  <input
                    ref="singleBirthMonthRef"
                    v-model="singleForm.birthMonth"
                    class="segment-input"
                    inputmode="numeric"
                    maxlength="2"
                    placeholder="月"
                    @input="handleSegmentInput(singleForm, 'birthMonth', 2, singleBirthDayRef)"
                  />
                  <span class="segment-separator">-</span>
                  <input
                    ref="singleBirthDayRef"
                    v-model="singleForm.birthDay"
                    class="segment-input"
                    inputmode="numeric"
                    maxlength="2"
                    placeholder="日"
                    @input="handleSegmentInput(singleForm, 'birthDay', 2)"
                  />
                </div>
                <el-segmented v-model="singleForm.calendarType" :options="calendarOptions" />
              </div>
            </div>
            <div class="field-card">
              <label>出生时间</label>
              <div class="segment-input-group time-segments">
                <input
                  ref="singleBirthHourRef"
                  v-model="singleForm.birthHour"
                  class="segment-input"
                  inputmode="numeric"
                  maxlength="2"
                  placeholder="时"
                  @input="handleSegmentInput(singleForm, 'birthHour', 2, singleBirthMinuteRef)"
                />
                <span class="segment-separator">:</span>
                <input
                  ref="singleBirthMinuteRef"
                  v-model="singleForm.birthMinute"
                  class="segment-input"
                  inputmode="numeric"
                  maxlength="2"
                  placeholder="分"
                  @input="handleSegmentInput(singleForm, 'birthMinute', 2)"
                />
              </div>
            </div>
            <div class="field-card">
              <label>性别</label>
              <el-segmented v-model="singleForm.gender" :options="genderOptions" block />
            </div>
          </div>

          <div class="focus-card">
            <div class="focus-head">
              <strong>关注方向</strong>
              <el-switch
                v-if="singleForm.calendarType === 'lunar'"
                v-model="singleForm.leapMonth"
                inline-prompt
                active-text="闰月"
                inactive-text="平月"
              />
            </div>
            <div class="focus-tags">
              <button
                v-for="item in singleQuestionPresets"
                :key="item"
                class="focus-tag"
                @click="singleForm.question = item"
              >
                {{ item }}
              </button>
            </div>
            <el-input
              v-model="singleForm.question"
              type="textarea"
              :rows="3"
              resize="none"
              maxlength="200"
              placeholder="补充你最关心的问题，例如：最近事业变化、财运趋势、感情机会"
            />
          </div>

          <div class="submit-row">
            <div class="submit-tips">
              <span>支持阴历/阳历输入</span>
              <span>结果以流式逐段生成</span>
              <span>历史记录可回看</span>
            </div>
            <el-button type="warning" size="large" :loading="streaming" @click="submitSingle">
              开始测算
            </el-button>
          </div>
        </template>

        <template v-else>
          <div class="pair-stack">
            <section class="pair-form-card">
              <div class="pair-title">甲方信息</div>
              <div class="form-grid">
                <div class="field-card">
                  <label>姓名</label>
                  <el-input v-model="marriageForm.personA.name" maxlength="20" placeholder="请输入姓名，可选" />
                </div>
                <div class="field-card wide">
                  <label>出生日期</label>
                  <div class="date-row">
                    <div class="segment-input-group date-segments">
                      <input
                        ref="personABirthYearRef"
                        v-model="marriageForm.personA.birthYear"
                        class="segment-input year"
                        inputmode="numeric"
                        maxlength="4"
                        placeholder="年"
                        @input="handleSegmentInput(marriageForm.personA, 'birthYear', 4, personABirthMonthRef)"
                      />
                      <span class="segment-separator">-</span>
                      <input
                        ref="personABirthMonthRef"
                        v-model="marriageForm.personA.birthMonth"
                        class="segment-input"
                        inputmode="numeric"
                        maxlength="2"
                        placeholder="月"
                        @input="handleSegmentInput(marriageForm.personA, 'birthMonth', 2, personABirthDayRef)"
                      />
                      <span class="segment-separator">-</span>
                      <input
                        ref="personABirthDayRef"
                        v-model="marriageForm.personA.birthDay"
                        class="segment-input"
                        inputmode="numeric"
                        maxlength="2"
                        placeholder="日"
                        @input="handleSegmentInput(marriageForm.personA, 'birthDay', 2)"
                      />
                    </div>
                    <el-segmented v-model="marriageForm.personA.calendarType" :options="calendarOptions" />
                  </div>
                </div>
                <div class="field-card">
                  <label>出生时间</label>
                  <div class="segment-input-group time-segments">
                    <input
                      ref="personABirthHourRef"
                      v-model="marriageForm.personA.birthHour"
                      class="segment-input"
                      inputmode="numeric"
                      maxlength="2"
                      placeholder="时"
                      @input="handleSegmentInput(marriageForm.personA, 'birthHour', 2, personABirthMinuteRef)"
                    />
                    <span class="segment-separator">:</span>
                    <input
                      ref="personABirthMinuteRef"
                      v-model="marriageForm.personA.birthMinute"
                      class="segment-input"
                      inputmode="numeric"
                      maxlength="2"
                      placeholder="分"
                      @input="handleSegmentInput(marriageForm.personA, 'birthMinute', 2)"
                    />
                  </div>
                </div>
                <div class="field-card">
                  <label>性别</label>
                  <el-segmented v-model="marriageForm.personA.gender" :options="genderOptions" block />
                </div>
              </div>
            </section>

            <section class="pair-form-card">
              <div class="pair-title">乙方信息</div>
              <div class="form-grid">
                <div class="field-card">
                  <label>姓名</label>
                  <el-input v-model="marriageForm.personB.name" maxlength="20" placeholder="请输入姓名，可选" />
                </div>
                <div class="field-card wide">
                  <label>出生日期</label>
                  <div class="date-row">
                    <div class="segment-input-group date-segments">
                      <input
                        ref="personBBirthYearRef"
                        v-model="marriageForm.personB.birthYear"
                        class="segment-input year"
                        inputmode="numeric"
                        maxlength="4"
                        placeholder="年"
                        @input="handleSegmentInput(marriageForm.personB, 'birthYear', 4, personBBirthMonthRef)"
                      />
                      <span class="segment-separator">-</span>
                      <input
                        ref="personBBirthMonthRef"
                        v-model="marriageForm.personB.birthMonth"
                        class="segment-input"
                        inputmode="numeric"
                        maxlength="2"
                        placeholder="月"
                        @input="handleSegmentInput(marriageForm.personB, 'birthMonth', 2, personBBirthDayRef)"
                      />
                      <span class="segment-separator">-</span>
                      <input
                        ref="personBBirthDayRef"
                        v-model="marriageForm.personB.birthDay"
                        class="segment-input"
                        inputmode="numeric"
                        maxlength="2"
                        placeholder="日"
                        @input="handleSegmentInput(marriageForm.personB, 'birthDay', 2)"
                      />
                    </div>
                    <el-segmented v-model="marriageForm.personB.calendarType" :options="calendarOptions" />
                  </div>
                </div>
                <div class="field-card">
                  <label>出生时间</label>
                  <div class="segment-input-group time-segments">
                    <input
                      ref="personBBirthHourRef"
                      v-model="marriageForm.personB.birthHour"
                      class="segment-input"
                      inputmode="numeric"
                      maxlength="2"
                      placeholder="时"
                      @input="handleSegmentInput(marriageForm.personB, 'birthHour', 2, personBBirthMinuteRef)"
                    />
                    <span class="segment-separator">:</span>
                    <input
                      ref="personBBirthMinuteRef"
                      v-model="marriageForm.personB.birthMinute"
                      class="segment-input"
                      inputmode="numeric"
                      maxlength="2"
                      placeholder="分"
                      @input="handleSegmentInput(marriageForm.personB, 'birthMinute', 2)"
                    />
                  </div>
                </div>
                <div class="field-card">
                  <label>性别</label>
                  <el-segmented v-model="marriageForm.personB.gender" :options="genderOptions" block />
                </div>
              </div>
            </section>
          </div>

          <div class="focus-card">
            <div class="focus-head double-switches">
              <strong>双方关注方向</strong>
              <div class="switch-group">
                <el-switch
                  v-if="marriageForm.personA.calendarType === 'lunar'"
                  v-model="marriageForm.personA.leapMonth"
                  inline-prompt
                  active-text="甲方闰月"
                  inactive-text="甲方平月"
                />
                <el-switch
                  v-if="marriageForm.personB.calendarType === 'lunar'"
                  v-model="marriageForm.personB.leapMonth"
                  inline-prompt
                  active-text="乙方闰月"
                  inactive-text="乙方平月"
                />
              </div>
            </div>
            <div class="focus-tags">
              <button
                v-for="item in marriageQuestionPresets"
                :key="item"
                class="focus-tag"
                @click="marriageForm.question = item"
              >
                {{ item }}
              </button>
            </div>
            <el-input
              v-model="marriageForm.question"
              type="textarea"
              :rows="3"
              resize="none"
              maxlength="200"
              placeholder="补充你最关注的问题，例如：缘分契合、婚后磨合、未来规划"
            />
          </div>

          <div class="submit-row">
            <div class="submit-tips">
              <span>支持双方单独切换阴历/阳历</span>
              <span>命盘信息先生成，再流式输出合盘分析</span>
            </div>
            <el-button type="warning" size="large" :loading="streaming" @click="submitMarriage">
              开始合盘
            </el-button>
          </div>
        </template>
        </template>
      </section>

      <section class="panel-card summary-panel">
        <div class="panel-heading">
          <div>
            <h2>{{ activeTab === 'single' ? '命盘信息' : '双方命盘概览' }}</h2>
          </div>
          <el-tag :type="resolveStatusTagType(currentStatus)">
            {{ resolveStatusText(currentStatus) }}
          </el-tag>
        </div>

        <template v-if="activeTab === 'single'">
          <div v-if="!singleMetaSource" class="destiny-placeholder">
            <div class="destiny-stage">
              <div class="destiny-orbit orbit-one"></div>
              <div class="destiny-orbit orbit-two"></div>
              <div class="destiny-core">命</div>
              <span class="destiny-rune rune-a">乾</span>
              <span class="destiny-rune rune-b">坤</span>
              <span class="destiny-rune rune-c">星</span>
              <span class="destiny-rune rune-d">运</span>
            </div>
            <div class="destiny-copy">
              <strong>命盘待启</strong>
              <p>填写生辰信息后，将在此生成命盘摘要、八字结构与关键运势线索。</p>
            </div>
          </div>
          <template v-else>
            <section class="pair-summary-card single-summary-card">
              <div class="pair-summary-head">
                <div>
                  <strong>{{ singleForm.name || '测算对象' }}</strong>
                  <p>{{ displayedCalendarType === 'solar' ? '阳历输入' : '阴历输入' }}</p>
                </div>
                <span>{{ displayedZodiac }}</span>
              </div>

              <div class="mini-pillars">
                <span>{{ displayedYearPillar }}</span>
                <span>{{ displayedMonthPillar }}</span>
                <span>{{ displayedDayPillar }}</span>
                <span>{{ displayedHourPillar }}</span>
              </div>

              <div class="meta-list compact">
                <div class="meta-item">
                  <label>八字</label>
                  <span>{{ displayedBaZi }}</span>
                </div>
                <div class="meta-item">
                  <label>生肖</label>
                  <span>{{ displayedZodiac }}</span>
                </div>
                <div v-if="displayedShiChen" class="meta-item">
                  <label>时辰</label>
                  <span>{{ displayedShiChen }}</span>
                </div>
                <div v-if="displayedLunarText" class="meta-item">
                  <label>农历</label>
                  <span>{{ displayedLunarText }}</span>
                </div>
                <div v-if="displayedSolarDate" class="meta-item">
                  <label>公历</label>
                  <span>{{ displayedSolarDate }}</span>
                </div>
              </div>
            </section>
          </template>
        </template>

        <template v-else>
          <div v-if="!marriageMetaSource" class="destiny-placeholder double">
            <div class="destiny-stage">
              <div class="destiny-orbit orbit-one"></div>
              <div class="destiny-orbit orbit-two"></div>
              <div class="destiny-core">合</div>
              <span class="destiny-rune rune-a">缘</span>
              <span class="destiny-rune rune-b">契</span>
              <span class="destiny-rune rune-c">合</span>
              <span class="destiny-rune rune-d">象</span>
            </div>
            <div class="destiny-copy">
              <strong>合盘待启</strong>
              <p>输入双方信息后，将在此生成双方命盘概览、缘分契合与婚配走势提示。</p>
            </div>
          </div>
          <div v-else class="pair-summary-grid">
            <section class="pair-summary-card">
              <div class="pair-summary-head">
                <div>
                  <strong>{{ marriageMetaSource.personA.name || '甲方' }}</strong>
                  <p>{{ marriageMetaSource.personA.calendarType === 'solar' ? '阳历输入' : '阴历输入' }}</p>
                </div>
                <span>{{ marriageMetaSource.personA.zodiac }}</span>
              </div>
              <div class="mini-pillars">
                <span>{{ marriageMetaSource.personA.yearPillar }}</span>
                <span>{{ marriageMetaSource.personA.monthPillar }}</span>
                <span>{{ marriageMetaSource.personA.dayPillar }}</span>
                <span>{{ marriageMetaSource.personA.hourPillar || '未知' }}</span>
              </div>
              <div class="meta-list compact">
                <div class="meta-item">
                  <label>八字</label>
                  <span>{{ marriageMetaSource.personA.baZi }}</span>
                </div>
                <div class="meta-item">
                  <label>农历</label>
                  <span>{{ marriageMetaSource.personA.lunarText || '未提供' }}</span>
                </div>
              </div>
            </section>

            <section class="pair-summary-card">
              <div class="pair-summary-head">
                <div>
                  <strong>{{ marriageMetaSource.personB.name || '乙方' }}</strong>
                  <p>{{ marriageMetaSource.personB.calendarType === 'solar' ? '阳历输入' : '阴历输入' }}</p>
                </div>
                <span>{{ marriageMetaSource.personB.zodiac }}</span>
              </div>
              <div class="mini-pillars">
                <span>{{ marriageMetaSource.personB.yearPillar }}</span>
                <span>{{ marriageMetaSource.personB.monthPillar }}</span>
                <span>{{ marriageMetaSource.personB.dayPillar }}</span>
                <span>{{ marriageMetaSource.personB.hourPillar || '未知' }}</span>
              </div>
              <div class="meta-list compact">
                <div class="meta-item">
                  <label>八字</label>
                  <span>{{ marriageMetaSource.personB.baZi }}</span>
                </div>
                <div class="meta-item">
                  <label>农历</label>
                  <span>{{ marriageMetaSource.personB.lunarText || '未提供' }}</span>
                </div>
              </div>
            </section>
          </div>
        </template>
      </section>

      <section class="panel-card analysis-panel">
        <div class="panel-heading">
          <div>
            <h2>运势分析</h2>
          </div>
          <el-tag :type="streaming ? 'warning' : renderedContent ? 'success' : 'info'">
            {{ streaming ? '输出中' : renderedContent ? '已生成' : '待开始' }}
          </el-tag>
        </div>

        <div class="analysis-body">
          <el-empty v-if="!renderedContent && !streaming" description="提交信息后开始分析" :image-size="90" />

          <template v-else>
            <div v-if="analysisSections.length === 0 && streaming" class="streaming-card">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>正在生成命理解读，请稍候…</p>
            </div>

            <div
              v-for="section in analysisSections"
              :key="section.title"
              class="analysis-section"
              :class="{ featured: section.featured }"
            >
              <div class="section-content" :class="{ titleless: !section.displayTitle }">
                <h3 v-if="section.displayTitle">{{ section.displayTitle }}</h3>
                <div class="markdown-body" v-html="section.html"></div>
              </div>
            </div>

            <div v-if="streaming" class="streaming-inline">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>AI 正在继续输出内容…</span>
            </div>
          </template>
        </div>
      </section>
    </div>

    <el-drawer
      v-model="historyDrawerVisible"
      :title="activeTab === 'single' ? '八字运势历史记录' : '合八字姻缘历史记录'"
      size="420px"
      append-to-body
    >
      <div class="history-drawer">
        <el-empty
          v-if="visibleHistoryList.length === 0"
          description="暂无记录"
          :image-size="82"
        />

        <div v-else class="history-list">
          <div
            v-for="item in visibleHistoryList"
            :key="item.id"
            class="history-card"
            :class="{ active: activeRecordId === item.id }"
            @click="handleHistorySelect(item.id)"
          >
            <template v-if="activeTab === 'single'">
              <div class="history-card-top">
                <strong>{{ (item as BaziFortuneHistoryItem).baZi || (item as BaziFortuneHistoryItem).birthDate }}</strong>
                <el-tag size="small" :type="resolveStatusTagType(item.status)">{{ resolveStatusText(item.status) }}</el-tag>
              </div>
              <p>{{ (item as BaziFortuneHistoryItem).birthDate }} {{ (item as BaziFortuneHistoryItem).birthTime }}</p>
              <small>{{ (item as BaziFortuneHistoryItem).question || '整体运势分析' }}</small>
            </template>
            <template v-else>
              <div class="history-card-top">
                <strong>{{ `${(item as BaziMarriageHistoryItem).personAName || '甲方'} · ${(item as BaziMarriageHistoryItem).personBName || '乙方'}` }}</strong>
                <el-tag size="small" :type="resolveStatusTagType(item.status)">{{ resolveStatusText(item.status) }}</el-tag>
              </div>
              <p>{{ (item as BaziMarriageHistoryItem).personABaZi || '未生成' }} / {{ (item as BaziMarriageHistoryItem).personBBaZi || '未生成' }}</p>
              <small>{{ (item as BaziMarriageHistoryItem).question || '合盘姻缘分析' }}</small>
            </template>
          </div>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import { addAuthChangeListener, isLoggedIn } from '@/shared/auth/session'
import { message } from '@/shared/ui/feedback'
import { loadMarkdownRenderer, renderPlainMarkdown, type MarkdownRenderer } from '@/shared/utils/markdown'
import {
  getBaziFortuneDetail,
  getBaziFortuneHistory,
  getBaziMarriageDetail,
  getBaziMarriageHistory,
  streamBaziFortune,
  streamBaziMarriage,
  type BaziFortuneDetail,
  type BaziFortuneHistoryItem,
  type BaziFortuneMeta,
  type BaziMarriageDetail,
  type BaziMarriageHistoryItem,
  type BaziMarriageMeta,
  type BaziMarriagePersonMeta,
  type BaziMarriagePersonRequest,
} from '@/api/bazi'

type CalendarType = 'lunar' | 'solar'
type Gender = '男' | '女'

interface BirthDateParts {
  year: number
  month: number
  day: number
}

interface PersonFormState {
  name: string
  gender: Gender
  calendarType: CalendarType
  birthDateText: string
  birthTime: string
  birthYear: string
  birthMonth: string
  birthDay: string
  birthHour: string
  birthMinute: string
  leapMonth: boolean
}

interface AnalysisSection {
  title: string
  displayTitle: string
  html: string
  featured: boolean
}

interface Props {
  mobileMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mobileMode: false,
})

const singleQuestionPresets = ['事业方向', '财运趋势', '感情发展', '健康提醒', '近期机会']
const marriageQuestionPresets = ['缘分契合', '婚后磨合', '双方互补', '矛盾风险', '未来规划']

const markdownRenderer = ref<MarkdownRenderer | null>(null)
const activeTab = ref<'single' | 'marriage'>('single')
const streaming = ref(false)
const historyDrawerVisible = ref(false)
const activeRecordId = ref<number | null>(null)
const inputCollapsed = ref(false)
const shouldAutoScrollMobile = ref(true)
const touchStartY = ref<number | null>(null)
const singleBirthYearRef = ref<HTMLInputElement | null>(null)
const singleBirthMonthRef = ref<HTMLInputElement | null>(null)
const singleBirthDayRef = ref<HTMLInputElement | null>(null)
const singleBirthHourRef = ref<HTMLInputElement | null>(null)
const singleBirthMinuteRef = ref<HTMLInputElement | null>(null)
const personABirthYearRef = ref<HTMLInputElement | null>(null)
const personABirthMonthRef = ref<HTMLInputElement | null>(null)
const personABirthDayRef = ref<HTMLInputElement | null>(null)
const personABirthHourRef = ref<HTMLInputElement | null>(null)
const personABirthMinuteRef = ref<HTMLInputElement | null>(null)
const personBBirthYearRef = ref<HTMLInputElement | null>(null)
const personBBirthMonthRef = ref<HTMLInputElement | null>(null)
const personBBirthDayRef = ref<HTMLInputElement | null>(null)
const personBBirthHourRef = ref<HTMLInputElement | null>(null)
const personBBirthMinuteRef = ref<HTMLInputElement | null>(null)
let removeAuthChangeListener: (() => void) | null = null

const historyList = ref<BaziFortuneHistoryItem[]>([])
const marriageHistoryList = ref<BaziMarriageHistoryItem[]>([])

const singleMeta = ref<BaziFortuneMeta | null>(null)
const singleDetail = ref<BaziFortuneDetail | null>(null)
const marriageMeta = ref<BaziMarriageMeta | null>(null)
const marriageDetail = ref<BaziMarriageDetail | null>(null)

const singleRenderedContent = ref('')
const marriageRenderedContent = ref('')

const singleForm = reactive({
  name: '',
  birthDateText: '',
  birthTime: '',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  birthHour: '',
  birthMinute: '',
  calendarType: 'lunar' as CalendarType,
  leapMonth: false,
  gender: '男' as Gender,
  question: '',
})

const createPersonForm = (name: string, gender: Gender): PersonFormState => ({
  name,
  gender,
  calendarType: 'lunar',
  birthDateText: '',
  birthTime: '',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  birthHour: '',
  birthMinute: '',
  leapMonth: false,
})

const marriageForm = reactive({
  personA: createPersonForm('男方', '男'),
  personB: createPersonForm('女方', '女'),
  question: '',
})

const genderOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
]

const calendarOptions = [
  { label: '阴历', value: 'lunar' },
  { label: '阳历', value: 'solar' },
]

const normalizeMarkdown = (content: string) => {
  let text = (content || '').replace(/\r\n/g, '\n')
  text = text.replace(/(^|\n)(#{1,6})([^\s#])/g, '$1$2 $3')
  text = text.replace(/(^|\n)([*+-])([^\s])/g, '$1$2 $3')
  text = text.replace(/(^|\n)(\d+)\.([^\s])/g, '$1$2. $3')
  text = text.replace(/([^\n])(?=\n?#{1,6}\s)/g, '$1\n\n')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

const renderMarkdown = (content: string) => {
  const normalized = normalizeMarkdown(content)
  return markdownRenderer.value?.render(normalized) ?? renderPlainMarkdown(normalized)
}

const renderedContent = computed(() => (activeTab.value === 'single' ? singleRenderedContent.value : marriageRenderedContent.value))
const singleMetaSource = computed(() => singleMeta.value || singleDetail.value)
const marriageMetaSource = computed(() => {
  if (marriageMeta.value) {
    return { personA: marriageMeta.value.personA, personB: marriageMeta.value.personB }
  }
  if (marriageDetail.value) {
    return { personA: marriageDetail.value.personA, personB: marriageDetail.value.personB }
  }
  return null
})
const displayedCalendarType = computed<CalendarType>(() => singleMeta.value?.calendarType || singleForm.calendarType)
const displayedYearPillar = computed(() => singleMetaSource.value?.yearPillar || '未生成')
const displayedMonthPillar = computed(() => singleMetaSource.value?.monthPillar || '未生成')
const displayedDayPillar = computed(() => singleMetaSource.value?.dayPillar || '未生成')
const displayedHourPillar = computed(() => singleMetaSource.value?.hourPillar || '未知')
const displayedBaZi = computed(() => singleMetaSource.value?.baZi || '未生成')
const displayedZodiac = computed(() => singleMetaSource.value?.zodiac || '未知')
const displayedShiChen = computed(() => singleMetaSource.value?.shiChen || '')
const displayedLunarText = computed(() => singleMetaSource.value?.lunarText || '')
const displayedSolarDate = computed(() => singleMetaSource.value?.solarDate || '')
const visibleHistoryList = computed(() => (activeTab.value === 'single' ? historyList.value : marriageHistoryList.value))
const currentStatus = computed(() => {
  if (streaming.value) {
    return 'PROCESSING'
  }
  if (activeTab.value === 'single') {
    return singleDetail.value?.status || ''
  }
  return marriageDetail.value?.status || ''
})
const currentQuestionText = computed(() => {
  if (activeTab.value === 'single') {
    return singleForm.question || singleDetail.value?.question || ''
  }
  return marriageForm.question || marriageDetail.value?.question || ''
})
const hasSingleResult = computed(() => Boolean(singleMetaSource.value || singleRenderedContent.value))
const hasMarriageResult = computed(() => Boolean(marriageMetaSource.value || marriageRenderedContent.value))
const isResultMode = computed(() => {
  if (activeTab.value === 'single') {
    return streaming.value || hasSingleResult.value
  }
  return streaming.value || hasMarriageResult.value
})
const isInputCollapsed = computed(() => !props.mobileMode && inputCollapsed.value)

const expandInputPanel = () => {
  if (props.mobileMode) {
    return
  }
  inputCollapsed.value = false
}

const collapseInputPanel = () => {
  if (props.mobileMode) {
    return
  }
  inputCollapsed.value = true
}

const toggleInputPanel = () => {
  if (props.mobileMode) {
    return
  }
  inputCollapsed.value = !inputCollapsed.value
}

type SegmentKey = 'birthYear' | 'birthMonth' | 'birthDay' | 'birthHour' | 'birthMinute'

const syncFormDateTimeText = (form: PersonFormState | typeof singleForm) => {
  const year = form.birthYear.trim()
  const month = form.birthMonth.trim()
  const day = form.birthDay.trim()
  const hour = form.birthHour.trim()
  const minute = form.birthMinute.trim()

  form.birthDateText = year && month && day ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : ''
  form.birthTime = hour && minute ? `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` : ''
}

const handleSegmentInput = (
  form: PersonFormState | typeof singleForm,
  key: SegmentKey,
  maxLength: number,
  nextInput?: HTMLInputElement | null,
) => {
  form[key] = form[key].replace(/\D/g, '').slice(0, maxLength)
  syncFormDateTimeText(form)
  if (form[key].length === maxLength && nextInput) {
    nextInput.focus()
  }
}

const applyDateSegments = (form: PersonFormState | typeof singleForm, birthDateText: string) => {
  const text = (birthDateText || '').trim()
  const matched = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  form.birthYear = matched?.[1] || ''
  form.birthMonth = matched?.[2] || ''
  form.birthDay = matched?.[3] || ''
  syncFormDateTimeText(form)
}

const applyTimeSegments = (form: PersonFormState | typeof singleForm, birthTimeText: string) => {
  const text = (birthTimeText || '').trim()
  const matched = /^(\d{1,2}):(\d{1,2})$/.exec(text)
  form.birthHour = matched?.[1] || ''
  form.birthMinute = matched?.[2] || ''
  syncFormDateTimeText(form)
}

const isNearPageBottom = () => {
  if (typeof window === 'undefined') {
    return true
  }
  const scrollElement = document.scrollingElement || document.documentElement
  const distance = scrollElement.scrollHeight - (window.scrollY + window.innerHeight)
  return distance <= 48
}

const syncMobileScrollIntent = () => {
  if (!props.mobileMode) {
    return
  }
  shouldAutoScrollMobile.value = isNearPageBottom()
}

const handleMobileTouchStart = (event: TouchEvent) => {
  if (!props.mobileMode) {
    return
  }
  touchStartY.value = event.touches[0]?.clientY ?? null
}

const handleMobileTouchMove = (event: TouchEvent) => {
  if (!props.mobileMode) {
    return
  }
  const currentY = event.touches[0]?.clientY
  if (touchStartY.value === null || currentY === undefined) {
    return
  }

  const deltaY = currentY - touchStartY.value
  if (deltaY > 6) {
    shouldAutoScrollMobile.value = false
  }
}

const handleMobileTouchEnd = () => {
  if (!props.mobileMode) {
    return
  }
  touchStartY.value = null
  if (isNearPageBottom()) {
    shouldAutoScrollMobile.value = true
  }
}

const scrollMobileToBottom = async () => {
  if (!props.mobileMode || !shouldAutoScrollMobile.value || typeof window === 'undefined') {
    return
  }
  await nextTick()
  requestAnimationFrame(() => {
    const scrollElement = document.scrollingElement || document.documentElement
    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
      behavior: 'auto',
    })
  })
}

const analysisSections = computed<AnalysisSection[]>(() => {
  const normalized = normalizeMarkdown(renderedContent.value)
  if (!normalized) {
    return []
  }

  const lines = normalized.split('\n')
  const parsedSections: Array<{ title: string; body: string[] }> = []
  let currentTitle = ''
  let bodyLines: string[] = []

  const pushSection = () => {
    const body = bodyLines.join('\n').trim()
    if (!currentTitle && !body) {
      return
    }
    parsedSections.push({
      title: currentTitle || '分析结果',
      body: body ? [body] : ['内容生成中，请稍候…'],
    })
  }

  for (const line of lines) {
    const matched = /^(#{2,3})\s+(.+)$/.exec(line.trim())
    if (matched) {
      if (currentTitle || bodyLines.length > 0) {
        pushSection()
      }
      currentTitle = matched[2].trim()
      bodyLines = []
      continue
    }
    bodyLines.push(line)
  }

  pushSection()

  return parsedSections.map((section, index) => ({
    title: section.title,
    displayTitle: /^总览$/.test(section.title) ? '' : section.title,
    html: renderMarkdown(section.body.join('\n').trim()),
    featured: index === 0 || /总览/.test(section.title),
  }))
})

const loadHistory = async () => {
  historyList.value = await getBaziFortuneHistory()
}

const loadMarriageHistory = async () => {
  marriageHistoryList.value = await getBaziMarriageHistory()
}

const refreshHistoryState = async () => {
  if (!isLoggedIn()) {
    historyList.value = []
    marriageHistoryList.value = []
    activeRecordId.value = null
    return
  }

  await Promise.all([loadHistory(), loadMarriageHistory()])
}

const openHistory = async (id: number) => {
  const detail = await getBaziFortuneDetail(id)
  if (!detail) {
    message.error('加载记录失败')
    return
  }
  activeTab.value = 'single'
  activeRecordId.value = id
  singleMeta.value = null
  singleDetail.value = detail
  singleRenderedContent.value = detail.fortuneContent || ''
  applyStoredBirthDate(detail.birthDate)
  applyTimeSegments(singleForm, detail.birthTime)
  singleForm.leapMonth = Boolean(detail.leapMonth)
  singleForm.gender = detail.gender as Gender
  singleForm.question = detail.question || ''
  historyDrawerVisible.value = false
}

const openMarriageHistory = async (id: number) => {
  const detail = await getBaziMarriageDetail(id)
  if (!detail) {
    message.error('加载记录失败')
    return
  }
  activeTab.value = 'marriage'
  activeRecordId.value = id
  marriageMeta.value = {
    recordId: detail.id,
    personA: detail.personA,
    personB: detail.personB,
  }
  marriageDetail.value = detail
  marriageRenderedContent.value = detail.fortuneContent || ''
  applyMarriagePerson(detail.personA, marriageForm.personA)
  applyMarriagePerson(detail.personB, marriageForm.personB)
  marriageForm.question = detail.question || ''
  historyDrawerVisible.value = false
}

const handleHistorySelect = async (id: number) => {
  if (activeTab.value === 'single') {
    await openHistory(id)
    return
  }
  await openMarriageHistory(id)
}

const submitSingle = async () => {
  syncFormDateTimeText(singleForm)
  const parsedBirthDate = parseBirthDate(singleForm.birthDateText, singleForm.calendarType)
  if (!parsedBirthDate || !isValidTime(singleForm.birthTime)) {
    return
  }

  streaming.value = true
  collapseInputPanel()
  singleMeta.value = null
  singleDetail.value = null
  singleRenderedContent.value = ''
  activeTab.value = 'single'
  activeRecordId.value = null

  try {
    await streamBaziFortune(
      {
        name: singleForm.name.trim() || undefined,
        birthYear: parsedBirthDate.year,
        birthMonth: parsedBirthDate.month,
        birthDay: parsedBirthDate.day,
        birthTime: singleForm.birthTime,
        calendarType: singleForm.calendarType,
        leapMonth: singleForm.calendarType === 'lunar' ? singleForm.leapMonth : false,
        gender: singleForm.gender,
        question: singleForm.question.trim() || undefined,
      },
      {
        onMeta(meta) {
          singleMeta.value = meta
          activeRecordId.value = meta.recordId
        },
        onDelta(content) {
          singleRenderedContent.value += content
        },
        async onDone(recordId) {
          await loadHistory()
          const detail = await getBaziFortuneDetail(recordId)
          if (detail) {
            singleDetail.value = detail
            singleRenderedContent.value = detail.fortuneContent || singleRenderedContent.value
          }
        },
        onError(text) {
          message.error(text || '生成失败')
        },
      },
    )
  } catch (error) {
    message.error((error as Error).message || '生成失败')
  } finally {
    streaming.value = false
    if (!hasSingleResult.value) {
      inputCollapsed.value = false
    }
  }
}

const submitMarriage = async () => {
  const personA = buildMarriagePersonPayload(marriageForm.personA, '甲方')
  const personB = buildMarriagePersonPayload(marriageForm.personB, '乙方')
  if (!personA || !personB) {
    return
  }

  streaming.value = true
  collapseInputPanel()
  marriageMeta.value = null
  marriageDetail.value = null
  marriageRenderedContent.value = ''
  activeTab.value = 'marriage'
  activeRecordId.value = null

  try {
    await streamBaziMarriage(
      {
        personA,
        personB,
        question: marriageForm.question.trim() || undefined,
      },
      {
        onMeta(meta) {
          marriageMeta.value = meta
          activeRecordId.value = meta.recordId ?? null
        },
        onDelta(content) {
          marriageRenderedContent.value += content
        },
        async onDone(recordId, content) {
          await loadMarriageHistory()
          if (recordId) {
            const detail = await getBaziMarriageDetail(recordId)
            if (detail) {
              marriageDetail.value = detail
              marriageMeta.value = {
                recordId: detail.id,
                personA: detail.personA,
                personB: detail.personB,
              }
              marriageRenderedContent.value = detail.fortuneContent || content || marriageRenderedContent.value
              return
            }
          }
          if (content) {
            marriageRenderedContent.value = content
          }
        },
        onError(text) {
          message.error(text || '生成失败')
        },
      },
    )
  } catch (error) {
    message.error((error as Error).message || '生成失败')
  } finally {
    streaming.value = false
    if (!hasMarriageResult.value) {
      inputCollapsed.value = false
    }
  }
}

const buildMarriagePersonPayload = (form: PersonFormState, label: string): BaziMarriagePersonRequest | null => {
  const parsedBirthDate = parseBirthDate(form.birthDateText, form.calendarType, `${label}生日`)
  if (!parsedBirthDate || !isValidTime(form.birthTime, `${label}时辰格式应为 HH:mm`)) {
    return null
  }
  return {
    name: form.name.trim() || label,
    birthYear: parsedBirthDate.year,
    birthMonth: parsedBirthDate.month,
    birthDay: parsedBirthDate.day,
    birthTime: form.birthTime,
    calendarType: form.calendarType,
    leapMonth: form.calendarType === 'lunar' ? form.leapMonth : false,
    gender: form.gender,
  }
}

const parseBirthDate = (birthDate: string, calendarType: CalendarType, errorLabel = '出生日期'): BirthDateParts | null => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec((birthDate || '').trim())
  if (!matched) {
    message.warning(`${errorLabel}格式应为 YYYY-MM-DD`)
    return null
  }
  const year = Number(matched[1])
  const month = Number(matched[2])
  const day = Number(matched[3])
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) {
    message.warning(`${errorLabel}范围不正确`)
    return null
  }
  if (calendarType === 'lunar') {
    if (day > 30) {
      message.warning(`${errorLabel}范围不正确`)
      return null
    }
    return { year, month, day }
  }
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    message.warning(`${errorLabel}范围不正确`)
    return null
  }
  return { year, month, day }
}

const isValidTime = (value: string, tip = '出生时间格式应为 HH:mm') => {
  const valid = /^([01]\d|2[0-3]):([0-5]\d)$/.test((value || '').trim())
  if (!valid) {
    message.warning(tip)
  }
  return valid
}

const stripStoredBirthDate = (storedBirthDate: string) => {
  const text = (storedBirthDate || '').trim()
  if (text.startsWith('阳历:') || text.startsWith('农历:')) {
    return text.slice(3)
  }
  return text
}

const applyStoredBirthDate = (storedBirthDate: string) => {
  const rawText = (storedBirthDate || '').trim()
  const text = stripStoredBirthDate(rawText)
  if (rawText.startsWith('阳历:')) {
    singleForm.calendarType = 'solar'
    applyDateSegments(singleForm, text)
    return
  }
  if (rawText.startsWith('农历:')) {
    singleForm.calendarType = 'lunar'
    applyDateSegments(singleForm, text)
    return
  }
  singleForm.calendarType = 'lunar'
  applyDateSegments(singleForm, text)
}

const applyMarriagePerson = (source: BaziMarriagePersonMeta, target: PersonFormState) => {
  target.name = source.name || ''
  target.gender = source.gender
  target.calendarType = source.calendarType || 'lunar'
  applyDateSegments(target, source.birthDate || '')
  applyTimeSegments(target, source.birthTime || '')
  target.leapMonth = Boolean(source.leapMonth)
}

const resolveStatusText = (status?: string) => {
  const map: Record<string, string> = {
    PROCESSING: '分析中',
    SUCCESS: '已完成',
    FAILED: '失败',
  }
  return map[status || ''] || '未开始'
}

const resolveStatusTagType = (status?: string): 'success' | 'warning' | 'danger' | 'info' => {
  if (status === 'SUCCESS') {
    return 'success'
  }
  if (status === 'FAILED') {
    return 'danger'
  }
  if (status === 'PROCESSING') {
    return 'warning'
  }
  return 'info'
}

watch(activeTab, (tab) => {
  if (tab === 'single' && !hasSingleResult.value) {
    inputCollapsed.value = false
  }
  if (tab === 'marriage' && !hasMarriageResult.value) {
    inputCollapsed.value = false
  }
})

watch(
  () => [renderedContent.value, streaming.value, singleMetaSource.value, marriageMetaSource.value, activeTab.value],
  () => {
    scrollMobileToBottom()
  },
)

onMounted(async () => {
  if (props.mobileMode && typeof window !== 'undefined') {
    shouldAutoScrollMobile.value = true
    window.addEventListener('scroll', syncMobileScrollIntent, { passive: true })
    window.addEventListener('touchstart', handleMobileTouchStart, { passive: true })
    window.addEventListener('touchmove', handleMobileTouchMove, { passive: true })
    window.addEventListener('touchend', handleMobileTouchEnd, { passive: true })
  }
  removeAuthChangeListener = addAuthChangeListener(() => {
    void refreshHistoryState()
  })
  await refreshHistoryState()
  try {
    markdownRenderer.value = await loadMarkdownRenderer({ codeHighlight: true })
  } catch (error) {
    console.error('加载八字 Markdown 渲染器失败:', error)
  }
})

onActivated(async () => {
  await refreshHistoryState()
})

onBeforeUnmount(() => {
  removeAuthChangeListener?.()
  removeAuthChangeListener = null
  if (props.mobileMode && typeof window !== 'undefined') {
    window.removeEventListener('scroll', syncMobileScrollIntent)
    window.removeEventListener('touchstart', handleMobileTouchStart)
    window.removeEventListener('touchmove', handleMobileTouchMove)
    window.removeEventListener('touchend', handleMobileTouchEnd)
  }
})
</script>

<style scoped lang="scss">
.fortune-page {
  --text-main: #182338;
  --text-secondary: #667085;
  --brand: #b45309;
  --panel: rgba(255, 255, 255, 0.92);
  --panel-border: rgba(148, 163, 184, 0.2);
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(245, 158, 11, 0.14), transparent 28%),
    radial-gradient(circle at right bottom, rgba(239, 68, 68, 0.12), transparent 26%),
    linear-gradient(180deg, #fff8ef 0%, #fffdf8 100%);
}

.page-grid {
  display: grid;
  grid-template-columns: minmax(360px, 520px) minmax(0, 1fr);
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-areas:
    'hero hero'
    'input summary'
    'analysis analysis';
  gap: 20px;
  min-height: calc(100vh - 48px);
  align-items: stretch;
}

.hero-panel,
.panel-card {
  border: 1px solid var(--panel-border);
  border-radius: 28px;
  background: var(--panel);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.hero-panel {
  grid-area: hero;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 30px;
  transition: padding 0.28s ease;
}

.hero-copy {
  max-width: 760px;
}

.hero-copy h1,
.panel-heading h2 {
  margin: 0;
  color: var(--text-main);
}

.hero-copy p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.72;
}

.hero-side {
  display: grid;
  justify-items: end;
  min-width: 240px;
}

.tab-switch {
  display: inline-flex;
  padding: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: inset 0 0 0 1px rgba(180, 83, 9, 0.12);
}

.tab-button {
  padding: 10px 18px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.18s ease;
}

.tab-button.active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  box-shadow: 0 12px 20px rgba(217, 119, 6, 0.2);
}

.input-panel,
.summary-panel,
.analysis-panel {
  padding: 24px;
  min-height: 0;
}

.input-panel {
  grid-area: input;
}

.summary-panel {
  grid-area: summary;
  overflow: hidden;
}

.analysis-panel {
  grid-area: analysis;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-heading-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapsed-panel {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 14px;
  height: 100%;
  padding: 12px 8px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 247, 237, 0.94) 100%);
}

.sidebar-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 12px 20px rgba(217, 119, 6, 0.22);
}

.sidebar-toggle-icon {
  font-size: 24px;
  line-height: 1;
}

.sidebar-label {
  color: var(--text-main);
  font-size: 13px;
  writing-mode: vertical-rl;
  letter-spacing: 0.24em;
}

.sidebar-caption {
  color: var(--text-secondary);
  font-size: 12px;
  writing-mode: vertical-rl;
}

.destiny-placeholder {
  display: grid;
  justify-items: center;
  gap: 22px;
  min-height: 320px;
  padding: 28px 18px;
  border-radius: 28px;
  background:
    radial-gradient(circle at center, rgba(245, 158, 11, 0.12), transparent 55%),
    linear-gradient(180deg, rgba(255, 248, 235, 0.94) 0%, rgba(255, 255, 255, 0.98) 100%);
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.14);
}

.destiny-stage {
  position: relative;
  width: 240px;
  height: 240px;
}

.destiny-orbit {
  position: absolute;
  inset: 50%;
  border-radius: 50%;
  border: 1px dashed rgba(180, 83, 9, 0.22);
  transform: translate(-50%, -50%);
}

.orbit-one {
  width: 196px;
  height: 196px;
  animation: rotate-slow 12s linear infinite;
}

.orbit-two {
  width: 134px;
  height: 134px;
  border-style: solid;
  border-color: rgba(245, 158, 11, 0.18);
  animation: rotate-reverse 8s linear infinite;
}

.destiny-core {
  position: absolute;
  top: 50%;
  left: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 86px;
  height: 86px;
  border-radius: 28px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  transform: translate(-50%, -50%);
  box-shadow: 0 18px 30px rgba(217, 119, 6, 0.24);
  animation: pulse-core 2.8s ease-in-out infinite;
}

.destiny-rune {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.16), 0 10px 18px rgba(15, 23, 42, 0.08);
  color: #b45309;
  font-weight: 700;
  animation: rune-float 4.2s ease-in-out infinite;
}

.rune-a {
  top: 12px;
  left: 98px;
}

.rune-b {
  top: 96px;
  right: 10px;
  animation-delay: 0.8s;
}

.rune-c {
  bottom: 18px;
  left: 98px;
  animation-delay: 1.6s;
}

.rune-d {
  top: 96px;
  left: 10px;
  animation-delay: 2.4s;
}

.destiny-copy {
  display: grid;
  gap: 8px;
  max-width: 420px;
  text-align: center;
}

.destiny-copy strong {
  color: var(--text-main);
  font-size: 22px;
}

.destiny-copy p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.8;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.single-grid .wide,
.form-grid .wide {
  grid-column: span 2;
}

.field-card {
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.35);
}

.field-card label {
  display: block;
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

.date-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.segment-input-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 16px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.28);
}

.date-segments {
  width: 100%;
}

.time-segments {
  width: 100%;
  justify-content: flex-start;
}

.segment-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-main);
  font-size: 16px;
  text-align: center;
}

.segment-input.year {
  max-width: 84px;
}

.time-segments .segment-input,
.date-segments .segment-input:not(.year) {
  max-width: 52px;
}

.segment-input::placeholder {
  color: #98a2b3;
}

.segment-separator {
  color: #98a2b3;
  font-weight: 600;
}

.focus-card {
  margin-top: 18px;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 248, 235, 0.95) 0%, rgba(255, 255, 255, 0.96) 100%);
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.14);
}

.focus-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.double-switches {
  align-items: flex-start;
}

.switch-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.focus-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.focus-tag {
  padding: 9px 14px;
  border: 1px solid rgba(180, 83, 9, 0.14);
  border-radius: 999px;
  background: rgba(180, 83, 9, 0.06);
  color: var(--text-main);
  cursor: pointer;
}

.submit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
}

.submit-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.submit-tips span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  color: var(--text-secondary);
  font-size: 12px;
}

.pair-stack {
  display: grid;
  gap: 14px;
}

.pair-form-card {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.35);
}

.pair-title {
  margin-bottom: 14px;
  color: var(--text-main);
  font-weight: 700;
}

.profile-banner,
.pair-summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, #fff7ed 0%, #fffdf7 100%);
}

.profile-banner strong,
.pair-summary-head strong {
  font-size: 18px;
  color: var(--text-main);
}

.profile-banner p,
.pair-summary-head p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.banner-right {
  text-align: right;
}

.banner-right span,
.pair-summary-head span {
  display: block;
  color: #b45309;
  font-weight: 700;
}

.banner-right small {
  color: var(--text-secondary);
}

.pillar-grid,
.pair-summary-grid {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.pillar-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.pillar-card,
.pair-summary-card {
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.34);
}

.pillar-card span {
  display: block;
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

.pillar-card strong {
  color: var(--text-main);
  font-size: 20px;
}

.pair-summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.single-summary-card {
  padding: 18px;
}

.mini-pillars {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0;
}

.mini-pillars span {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border-radius: 14px;
  background: rgba(180, 83, 9, 0.08);
  color: var(--text-main);
  font-weight: 700;
}

.meta-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.meta-list.compact {
  margin-top: 0;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.9);
}

.meta-item label {
  color: var(--text-secondary);
  font-size: 13px;
}

.meta-item span {
  color: var(--text-main);
  text-align: right;
}

.analysis-body {
  display: grid;
  gap: 18px;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.analysis-section,
.streaming-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.34);
}

.analysis-section.featured {
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%);
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.22);
}

.streaming-card {
  grid-template-columns: 1fr;
  justify-items: center;
  color: var(--text-secondary);
}

.section-content.titleless :deep(.markdown-body) {
  margin-top: 0;
}

.section-content h3 {
  margin: 0 0 12px;
  color: var(--text-main);
  font-size: 20px;
}

.streaming-inline {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  color: var(--text-secondary);
  font-size: 13px;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(180, 83, 9, 0.45);
  animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.3s;
}

.history-drawer,
.history-list {
  display: grid;
  gap: 12px;
}

.history-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(203, 213, 225, 0.34);
  cursor: pointer;
}

.history-card.active {
  border-color: rgba(245, 158, 11, 0.24);
  box-shadow: 0 14px 28px rgba(245, 158, 11, 0.12);
}

.history-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-card p,
.history-card small {
  display: block;
  margin-top: 10px;
  color: var(--text-secondary);
}

.fortune-page.result-mode .hero-panel {
  padding: 16px 24px;
}

.fortune-page.result-mode .hero-copy p {
  display: none;
}

:deep(.markdown-body) {
  background: transparent;
  color: inherit;
}

:deep(.markdown-body p),
:deep(.markdown-body li) {
  line-height: 1.9;
}

:deep(.el-textarea__inner) {
  border-radius: 18px;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.75);
    opacity: 0.35;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes rotate-slow {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes rotate-reverse {
  from {
    transform: translate(-50%, -50%) rotate(360deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(0deg);
  }
}

@keyframes pulse-core {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.08);
  }
}

@keyframes rune-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (min-width: 1201px) {
  .page-grid.input-collapsed {
    grid-template-columns: 88px minmax(0, 1fr);
    grid-template-rows: auto auto minmax(360px, 1fr);
  }

  .page-grid.input-collapsed .input-panel {
    padding: 0;
    overflow: hidden;
  }

  .page-grid.input-collapsed .summary-panel {
    padding: 20px 24px;
  }
}

@media (max-width: 1200px) {
  .page-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
    grid-template-areas:
      'hero'
      'input'
      'summary'
      'analysis';
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .fortune-page {
    padding: 16px;
  }

  .hero-panel,
  .panel-card {
    border-radius: 24px;
  }

  .hero-panel {
    flex-direction: column;
    padding: 22px 20px;
  }

  .hero-side,
  .tab-switch {
    width: 100%;
  }

  .tab-button {
    flex: 1;
  }

  .panel-heading-actions {
    width: 100%;
  }

  .input-panel,
  .summary-panel,
  .analysis-panel {
    padding: 18px;
  }

  .form-grid,
  .pair-summary-grid,
  .pillar-grid {
    grid-template-columns: 1fr;
  }

  .single-grid .wide,
  .form-grid .wide {
    grid-column: span 1;
  }

  .date-row {
    grid-template-columns: 1fr;
  }

  .segment-input-group {
    width: 100%;
    justify-content: center;
    flex-wrap: nowrap;
  }

  .submit-row,
  .focus-head,
  .panel-heading,
  .panel-heading-actions,
  .profile-banner,
  .pair-summary-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .switch-group {
    width: 100%;
    justify-content: flex-start;
  }

  .analysis-section,
  .streaming-card {
    grid-template-columns: 1fr;
  }

  .destiny-stage {
    width: 200px;
    height: 200px;
  }

  .orbit-one {
    width: 164px;
    height: 164px;
  }

  .orbit-two {
    width: 110px;
    height: 110px;
  }
}
</style>
