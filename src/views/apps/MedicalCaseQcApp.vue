<template>
  <div class="medical-case-qc-page xbl-app-page xbl-app-page--medical-case-qc">
    <el-card class="hero-card">
      <div class="hero-top">
        <div>
          <div class="hero-title-row">
            <el-button class="back-button" text @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回小程序
            </el-button>
            <h2 class="hero-title">
              <el-icon><Document /></el-icon>
              病例质控
            </h2>
          </div>
          <p class="hero-desc">
            结合千问模型与医疗知识库，对主诉、现病史和诊断一致性进行结构化质控，并给出可追溯的知识依据。
          </p>
        </div>
        <div class="hero-actions">
          <el-button :loading="submitting" @click="fillExample">填入示例</el-button>
          <el-button @click="openTemplateDrawer">
            <el-icon><Setting /></el-icon>
            模板维护
          </el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">开始质控</el-button>
        </div>
      </div>
    </el-card>

    <div class="workspace">
      <div class="left-panel">
        <el-card class="case-form-card">
          <template #header>
            <div class="card-header">
              <span>病例信息</span>
              <el-button link type="primary" @click="resetForm">重置</el-button>
            </div>
          </template>

          <el-form label-position="top">
            <div class="form-grid">
              <el-form-item label="质控模板" required>
                <el-select
                  v-model="form.promptTemplateId"
                  placeholder="请选择质控模板"
                  filterable
                  :loading="templateLoading"
                  @change="handleTemplateChange"
                >
                  <el-option
                    v-for="template in templates"
                    :key="template.id"
                    :label="template.templateName"
                    :value="template.id"
                    :disabled="template.enabled === 0"
                  >
                    <span>{{ template.templateName }}</span>
                    <span class="option-sub">{{ template.account ? '自建' : '系统' }}</span>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="模型" required>
                <el-select v-model="form.modelName" placeholder="请选择模型" filterable allow-create>
                  <el-option
                    v-for="model in modelOptions"
                    :key="model.value"
                    :label="model.label"
                    :value="model.value"
                  />
                </el-select>
              </el-form-item>
            </div>

            <el-form-item label="完整病例" required>
              <el-input
                v-model="form.fullMedicalRecord"
                type="textarea"
                :rows="12"
                maxlength="12000"
                show-word-limit
                placeholder="粘贴完整病例文本，模型会先解析主诉、现病史、诊断、检查、治疗经过等内容，再检索知识库做质控。"
              />
            </el-form-item>

            <el-form-item label="主诉" required>
              <el-input
                v-model="form.chiefComplaint"
                type="textarea"
                :rows="3"
                maxlength="200"
                show-word-limit
                placeholder="例如：反复胸闷气短 3 天"
              />
              <div class="field-hint">建议按“主要症状 + 持续时间”填写，这是病例质控的首要判断项。</div>
            </el-form-item>

            <el-form-item label="现病史">
              <el-input
                v-model="form.presentIllness"
                type="textarea"
                :rows="7"
                maxlength="1500"
                show-word-limit
                placeholder="例如：患者 3 天前无明显诱因出现胸闷气短，活动后加重，休息后稍缓解，无明显胸痛……"
              />
            </el-form-item>

            <el-form-item label="初步诊断">
              <el-input
                v-model="form.preliminaryDiagnosis"
                type="textarea"
                :rows="3"
                maxlength="300"
                show-word-limit
                placeholder="例如：冠心病？心功能不全？"
              />
            </el-form-item>

            <el-form-item label="科室">
              <el-input
                v-model="form.department"
                maxlength="50"
                placeholder="例如：心内科"
              />
            </el-form-item>

            <div class="submit-row">
              <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">开始质控</el-button>
            </div>
          </el-form>
        </el-card>

        <el-card class="doctor-note-card">
          <template #header>
            <div class="card-header">
              <span>查看说明</span>
            </div>
          </template>
          <div class="doctor-note-list">
            <div class="doctor-note-item">总览：快速判断病例是否通过、风险等级和本次使用模型。</div>
            <div class="doctor-note-item">分项质控：分别查看主诉、现病史、诊断一致性和知识依据建议。</div>
            <div class="doctor-note-item">知识依据：重点查看引用条目、来源书籍和原文片段，便于医生复核。</div>
          </div>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="result-card">
          <template #header>
            <div class="card-header">
              <span>质控结果</span>
              <div class="header-actions" v-if="result">
                <el-tag :type="qualifiedTagType(result.qualified)">{{ result.qualifiedText || qualifiedText(result.qualified) }}</el-tag>
                <el-tag :type="riskTagType(result.riskLevel)">{{ result.riskLevelText || riskText(result.riskLevel) }}</el-tag>
              </div>
            </div>
          </template>

          <el-empty
            v-if="!result && !submitting"
            description="填写病例信息后开始质控，系统会结合医疗知识库返回结构化结果"
            :image-size="96"
          />

          <div v-else class="result-body" v-loading="submitting">
            <div v-if="result" class="overview-card">
              <div class="overview-top">
                <div class="overview-main">
                  <div class="overview-title">病例质控总览</div>
                  <div class="overview-summary">{{ result.summary || '暂无总结' }}</div>
                </div>
                <div class="overview-meta">
                  <div class="meta-pill">
                    <span class="meta-label">本次模型</span>
                    <strong>{{ result.modelName || '-' }}</strong>
                  </div>
                  <div class="meta-pill">
                    <span class="meta-label">质控模板</span>
                    <strong>{{ result.promptTemplateName || selectedTemplate?.templateName || '-' }}</strong>
                  </div>
                  <div class="meta-pill">
                    <span class="meta-label">科室</span>
                    <strong>{{ result.department || form.department || '未填写' }}</strong>
                  </div>
                </div>
              </div>

              <div class="overview-grid">
                <div class="overview-item">
                  <span class="overview-label">主诉</span>
                  <strong>{{ result.chiefComplaint || '-' }}</strong>
                </div>
                <div class="overview-item">
                  <span class="overview-label">初步诊断</span>
                  <strong>{{ result.preliminaryDiagnosis || '-' }}</strong>
                </div>
                <div class="overview-item overview-item--wide">
                  <span class="overview-label">完整病例摘要</span>
                  <strong>{{ result.fullMedicalRecord || form.fullMedicalRecord || result.presentIllness || form.presentIllness || '-' }}</strong>
                </div>
              </div>
            </div>

            <div v-if="result?.sections?.length" class="section-block">
              <div class="section-heading">分项质控</div>
              <div class="section-grid">
                <div
                  v-for="section in result.sections"
                  :key="section.sectionCode"
                  :class="['section-card', { 'section-card--warning': section.passed === false }]"
                >
                  <div class="section-card-top">
                    <div class="section-card-title">{{ section.sectionName }}</div>
                    <el-tag :type="section.passed ? 'success' : 'danger'">
                      {{ section.passedText || (section.passed ? '通过' : '需修正') }}
                    </el-tag>
                  </div>
                  <div class="section-card-conclusion">{{ section.conclusion || '暂无结论' }}</div>
                  <div v-if="section.problems?.length" class="section-card-sub">
                    <div class="sub-title">发现问题</div>
                    <ul class="tag-list">
                      <li v-for="problem in section.problems" :key="problem">{{ problem }}</li>
                    </ul>
                  </div>
                  <div v-if="section.suggestions?.length" class="section-card-sub">
                    <div class="sub-title">处理建议</div>
                    <ul class="tag-list">
                      <li v-for="suggestion in section.suggestions" :key="suggestion">{{ suggestion }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="result?.problems?.length" class="section-block">
              <div class="section-heading">重点问题</div>
              <div class="bullet-panel bullet-panel--danger">
                <div v-for="problem in result.problems" :key="problem" class="bullet-item">{{ problem }}</div>
              </div>
            </div>

            <div v-if="result?.suggestions?.length" class="section-block">
              <div class="section-heading">整改建议</div>
              <div class="bullet-panel bullet-panel--primary">
                <div v-for="suggestion in result.suggestions" :key="suggestion" class="bullet-item">{{ suggestion }}</div>
              </div>
            </div>

            <div class="section-block">
              <div class="section-heading">知识依据</div>
              <el-empty
                v-if="!(result?.knowledgeReferences?.length)"
                description="本次质控未引用知识条目，可能是模型认为规则判断已足够"
                :image-size="76"
              />
              <div v-else class="reference-list">
                <div
                  v-for="reference in result?.knowledgeReferences || []"
                  :key="`${reference.itemId}-${reference.chapterTitle}-${reference.quoteText}`"
                  class="reference-card"
                >
                  <div class="reference-title">{{ reference.title || '未命名知识条目' }}</div>
                  <div class="reference-meta">
                    <span>条目ID：{{ reference.itemId || '-' }}</span>
                    <span>来源：{{ reference.sourceName || '-' }}</span>
                    <span>章节：{{ reference.chapterTitle || '-' }}</span>
                  </div>
                  <div class="reference-quote">{{ reference.quoteText || '暂无原文引用' }}</div>
                </div>
              </div>
            </div>

            <div class="section-block">
              <div class="section-heading">模型原始返回</div>
              <el-input
                :model-value="result?.rawModelResult || ''"
                type="textarea"
                :rows="8"
                readonly
                placeholder="当前暂无模型原始返回"
              />
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <el-drawer
      v-model="templateDrawerVisible"
      title="质控 Prompt 模板维护"
      size="760px"
      append-to-body
    >
      <div class="template-drawer">
        <div class="template-toolbar">
          <el-button type="primary" @click="createTemplate">
            <el-icon><Plus /></el-icon>
            新建模板
          </el-button>
          <el-button :disabled="!selectedTemplate" @click="copySelectedTemplate">
            <el-icon><DocumentCopy /></el-icon>
            复制当前模板
          </el-button>
        </div>

        <div class="template-list" v-loading="templateLoading">
          <div
            v-for="template in templates"
            :key="template.id"
            :class="['template-row', { 'template-row--active': template.id === form.promptTemplateId }]"
          >
            <div>
              <div class="template-row-title">{{ template.templateName }}</div>
              <div class="template-row-meta">
                <span>{{ template.account ? '自建模板' : '系统模板' }}</span>
                <span>{{ template.modelName }}</span>
                <span>{{ template.enabled === 0 ? '停用' : '启用' }}</span>
              </div>
            </div>
            <div class="template-row-actions">
              <el-button link type="primary" @click="selectTemplate(template)">使用</el-button>
              <el-button link type="primary" :disabled="!template.account" @click="editTemplate(template)">编辑</el-button>
              <el-button link type="danger" :disabled="!template.account" @click="removeTemplate(template)">删除</el-button>
            </div>
          </div>
        </div>

        <el-form v-if="templateEditing" label-position="top" class="template-form">
          <div class="form-grid">
            <el-form-item label="模板名称" required>
              <el-input v-model="templateForm.templateName" maxlength="100" />
            </el-form-item>
            <el-form-item label="默认模型" required>
              <el-select v-model="templateForm.modelName" filterable allow-create>
                <el-option
                  v-for="model in modelOptions"
                  :key="model.value"
                  :label="model.label"
                  :value="model.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <div class="form-grid">
            <el-form-item label="启用状态">
              <el-switch v-model="templateForm.enabledBoolean" active-text="启用" inactive-text="停用" />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="templateForm.sortOrder" :min="1" :max="999" />
            </el-form-item>
          </div>

          <el-form-item label="System Message" required>
            <el-input
              v-model="templateForm.systemMessage"
              type="textarea"
              :rows="7"
              maxlength="6000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="Prompt 模板" required>
            <el-input
              v-model="templateForm.promptTemplate"
              type="textarea"
              :rows="14"
              maxlength="16000"
              show-word-limit
            />
            <div class="field-hint">
              可用变量：&#36;{medicalRecord}、&#36;{chiefComplaint}、&#36;{presentIllness}、&#36;{preliminaryDiagnosis}、&#36;{department}
            </div>
          </el-form-item>

          <div class="template-form-actions">
            <el-button @click="templateEditing = false">取消</el-button>
            <el-button type="primary" @click="saveTemplateForm">保存模板</el-button>
          </div>
        </el-form>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Document, DocumentCopy, Plus, Setting } from '@element-plus/icons-vue'
import { message } from '@/shared/ui/feedback'
import {
  deleteMedicalRecordQcTemplate,
  getMedicalRecordQcModelOptions,
  getMedicalRecordQcTemplates,
  medicalRecordCaseQc,
  saveMedicalRecordQcTemplate,
  type MedicalRecordCaseQcPayload,
  type MedicalRecordCaseQcResult,
  type MedicalRecordQcModelOption,
  type MedicalRecordQcPromptTemplate,
} from '@/api/medicalRecordQc'

const router = useRouter()

const submitting = ref(false)
const templateLoading = ref(false)
const templateDrawerVisible = ref(false)
const templateEditing = ref(false)
const result = ref<MedicalRecordCaseQcResult | null>(null)
const templates = ref<MedicalRecordQcPromptTemplate[]>([])
const modelOptions = ref<MedicalRecordQcModelOption[]>([])

const form = reactive<MedicalRecordCaseQcPayload>({
  fullMedicalRecord: '',
  chiefComplaint: '',
  presentIllness: '',
  preliminaryDiagnosis: '',
  department: '',
  promptTemplateId: undefined,
  modelName: '',
})

const templateForm = reactive<MedicalRecordQcPromptTemplate & { enabledBoolean?: boolean }>({
  templateName: '',
  sceneCode: 'medical_case_qc',
  modelProvider: 'qwen',
  modelName: '',
  systemMessage: '',
  promptTemplate: '',
  defaultFlag: 0,
  enabled: 1,
  enabledBoolean: true,
  sortOrder: 100,
})

const selectedTemplate = computed(() => templates.value.find((item) => item.id === form.promptTemplateId) || null)

const goBack = () => {
  router.push('/index/miniapp')
}

const fillExample = () => {
  form.fullMedicalRecord = `科室：心内科
主诉：反复胸闷气短3天
现病史：患者3天前无明显诱因出现胸闷气短，活动后加重，休息后稍缓解，无发热，无咳嗽，无明显胸痛。既往有高血压病史10年，血压控制一般。今日为进一步诊治来院。
体格检查：神志清，双肺呼吸音稍粗，心率92次/分，律齐，双下肢轻度水肿。
辅助检查：心电图提示ST-T改变，BNP升高。
初步诊断：冠心病？心功能不全？`
  form.chiefComplaint = '反复胸闷气短3天'
  form.presentIllness = '患者3天前无明显诱因出现胸闷气短，活动后加重，休息后稍缓解，无发热，无咳嗽，无明显胸痛，今来院就诊。'
  form.preliminaryDiagnosis = '冠心病？心功能不全？'
  form.department = '心内科'
}

const resetForm = () => {
  form.fullMedicalRecord = ''
  form.chiefComplaint = ''
  form.presentIllness = ''
  form.preliminaryDiagnosis = ''
  form.department = ''
  result.value = null
}

const handleSubmit = async () => {
  if (!form.fullMedicalRecord?.trim() && !form.chiefComplaint?.trim()) {
    message.warning('请先填写完整病例或主诉')
    return
  }
  if (!form.promptTemplateId) {
    message.warning('请先选择质控模板')
    return
  }
  if (!form.modelName?.trim()) {
    message.warning('请先选择模型')
    return
  }
  submitting.value = true
  try {
    const ret = await medicalRecordCaseQc({
      fullMedicalRecord: form.fullMedicalRecord?.trim() || undefined,
      chiefComplaint: form.chiefComplaint?.trim() || undefined,
      presentIllness: form.presentIllness?.trim() || undefined,
      preliminaryDiagnosis: form.preliminaryDiagnosis?.trim() || undefined,
      department: form.department?.trim() || undefined,
      promptTemplateId: form.promptTemplateId,
      modelName: form.modelName?.trim(),
    })
    if (ret) {
      result.value = ret
    }
  } finally {
    submitting.value = false
  }
}

const loadOptions = async () => {
  templateLoading.value = true
  try {
    const [templateRet, modelRet] = await Promise.all([
      getMedicalRecordQcTemplates(),
      getMedicalRecordQcModelOptions(),
    ])
    templates.value = templateRet
    modelOptions.value = modelRet
    const defaultTemplate = templateRet.find((item) => item.enabled !== 0 && item.defaultFlag === 1)
      || templateRet.find((item) => item.enabled !== 0)
      || templateRet[0]
    if (defaultTemplate && !form.promptTemplateId) {
      form.promptTemplateId = defaultTemplate.id
      form.modelName = defaultTemplate.modelName
    }
    if (!form.modelName && modelRet.length) {
      form.modelName = modelRet[0].value
    }
  } finally {
    templateLoading.value = false
  }
}

const handleTemplateChange = () => {
  if (selectedTemplate.value?.modelName) {
    form.modelName = selectedTemplate.value.modelName
  }
}

const openTemplateDrawer = () => {
  templateDrawerVisible.value = true
  templateEditing.value = false
}

const selectTemplate = (template: MedicalRecordQcPromptTemplate) => {
  form.promptTemplateId = template.id
  form.modelName = template.modelName
}

const resetTemplateForm = (template?: MedicalRecordQcPromptTemplate, asCopy = false) => {
  templateForm.id = asCopy ? undefined : template?.id
  templateForm.templateName = asCopy ? `${template?.templateName || '质控模板'} 副本` : template?.templateName || ''
  templateForm.sceneCode = template?.sceneCode || 'medical_case_qc'
  templateForm.modelProvider = template?.modelProvider || 'qwen'
  templateForm.modelName = template?.modelName || form.modelName || modelOptions.value[0]?.value || 'qwen-plus'
  templateForm.systemMessage = template?.systemMessage || ''
  templateForm.promptTemplate = template?.promptTemplate || ''
  templateForm.defaultFlag = template?.defaultFlag || 0
  templateForm.enabled = template?.enabled ?? 1
  templateForm.enabledBoolean = templateForm.enabled !== 0
  templateForm.sortOrder = template?.sortOrder || 100
}

const createTemplate = () => {
  resetTemplateForm()
  templateEditing.value = true
}

const copySelectedTemplate = () => {
  if (!selectedTemplate.value) {
    message.warning('请先选择一个模板')
    return
  }
  resetTemplateForm(selectedTemplate.value, true)
  templateEditing.value = true
}

const editTemplate = (template: MedicalRecordQcPromptTemplate) => {
  if (!template.account) {
    message.warning('系统模板不能直接编辑，请先复制为自建模板')
    return
  }
  resetTemplateForm(template)
  templateEditing.value = true
}

const removeTemplate = async (template: MedicalRecordQcPromptTemplate) => {
  if (!template.id || !template.account) {
    message.warning('系统模板不能删除')
    return
  }
  const ok = await deleteMedicalRecordQcTemplate(template.id)
  if (ok) {
    await loadOptions()
  }
}

const saveTemplateForm = async () => {
  if (!templateForm.templateName.trim()) {
    message.warning('请填写模板名称')
    return
  }
  if (!templateForm.systemMessage.trim()) {
    message.warning('请填写 System Message')
    return
  }
  if (!templateForm.modelName.trim()) {
    message.warning('请选择或填写默认模型')
    return
  }
  if (!templateForm.promptTemplate.trim()) {
    message.warning('请填写 Prompt 模板')
    return
  }
  const saved = await saveMedicalRecordQcTemplate({
    id: templateForm.id,
    templateName: templateForm.templateName.trim(),
    sceneCode: templateForm.sceneCode || 'medical_case_qc',
    modelProvider: templateForm.modelProvider || 'qwen',
    modelName: templateForm.modelName,
    systemMessage: templateForm.systemMessage.trim(),
    promptTemplate: templateForm.promptTemplate.trim(),
    defaultFlag: templateForm.defaultFlag || 0,
    enabled: templateForm.enabledBoolean ? 1 : 0,
    sortOrder: templateForm.sortOrder || 100,
  })
  if (saved) {
    templateEditing.value = false
    await loadOptions()
    form.promptTemplateId = saved.id
    form.modelName = saved.modelName
  }
}

const qualifiedText = (qualified?: boolean) => qualified ? '通过质控' : '需补充修正'
const qualifiedTagType = (qualified?: boolean) => qualified ? 'success' : 'danger'

const riskText = (riskLevel?: string) => {
  if (riskLevel === 'high') {
    return '高风险'
  }
  if (riskLevel === 'medium') {
    return '中风险'
  }
  return '低风险'
}

const riskTagType = (riskLevel?: string) => {
  if (riskLevel === 'high') {
    return 'danger'
  }
  if (riskLevel === 'medium') {
    return 'warning'
  }
  return 'success'
}

onMounted(loadOptions)
</script>

<style scoped lang="sass">
.medical-case-qc-page
  padding: 20px
  min-height: 100%
  background: linear-gradient(180deg, #f6fbff 0%, #eef5fb 48%, #f8fafc 100%)

  .hero-card
    margin-bottom: 20px
    border: none
    color: #fff
    background: linear-gradient(135deg, #0f4c81 0%, #0f766e 100%)

  .hero-top
    display: flex
    justify-content: space-between
    gap: 24px

  .hero-title-row
    display: flex
    align-items: center
    gap: 14px
    margin-bottom: 8px

  .back-button
    color: rgba(255, 255, 255, 0.88)

  .hero-title
    display: flex
    align-items: center
    gap: 10px
    margin: 0
    font-size: 30px

  .hero-desc
    margin: 0
    color: rgba(255, 255, 255, 0.84)
    line-height: 1.8

  .hero-actions
    display: flex
    gap: 12px
    align-items: flex-start

  .workspace
    display: grid
    grid-template-columns: 380px minmax(0, 1fr)
    gap: 18px
    align-items: start

  .left-panel,
  .right-panel
    display: flex
    flex-direction: column
    gap: 18px

  .card-header
    display: flex
    align-items: center
    justify-content: space-between
    gap: 12px

  .field-hint
    margin-top: 8px
    color: #64748b
    font-size: 12px
    line-height: 1.6

  .form-grid
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 14px

  .option-sub
    float: right
    color: #94a3b8
    font-size: 12px

  .submit-row
    display: flex
    justify-content: flex-end

  .doctor-note-list
    display: flex
    flex-direction: column
    gap: 12px

  .doctor-note-item
    padding: 12px 14px
    border-radius: 14px
    background: linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)
    color: #334155
    line-height: 1.7

  .result-body
    display: flex
    flex-direction: column
    gap: 18px

  .overview-card
    padding: 18px
    border-radius: 18px
    background: linear-gradient(135deg, #f8fbff 0%, #eef9f5 100%)
    border: 1px solid rgba(15, 118, 110, 0.12)

  .overview-top
    display: flex
    justify-content: space-between
    gap: 16px

  .overview-main
    flex: 1
    min-width: 0

  .overview-title
    font-size: 18px
    font-weight: 700
    color: #0f172a

  .overview-summary
    margin-top: 10px
    color: #334155
    line-height: 1.8

  .overview-meta
    display: flex
    flex-wrap: wrap
    gap: 12px
    justify-content: flex-end

  .meta-pill
    min-width: 140px
    padding: 12px 14px
    border-radius: 14px
    background: #fff
    border: 1px solid #dbe5eb

  .meta-label,
  .overview-label
    display: block
    color: #64748b
    font-size: 12px
    margin-bottom: 6px

  .overview-grid
    margin-top: 16px
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 14px

  .overview-item
    padding: 14px
    border-radius: 14px
    background: rgba(255, 255, 255, 0.84)

    &--wide
      grid-column: 1 / -1

  .section-block
    display: flex
    flex-direction: column
    gap: 12px

  .section-heading
    font-size: 16px
    font-weight: 700
    color: #0f172a

  .section-grid
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 14px

  .section-card
    padding: 16px
    border-radius: 16px
    background: #fff
    border: 1px solid #dbe5eb

    &--warning
      border-color: rgba(220, 38, 38, 0.18)
      background: linear-gradient(180deg, #fffefe 0%, #fff7f7 100%)

  .section-card-top
    display: flex
    justify-content: space-between
    gap: 12px
    align-items: flex-start

  .section-card-title
    font-size: 16px
    font-weight: 700
    color: #0f172a

  .section-card-conclusion
    margin-top: 10px
    color: #334155
    line-height: 1.7

  .section-card-sub
    margin-top: 14px

  .sub-title
    margin-bottom: 8px
    font-size: 13px
    font-weight: 700
    color: #475569

  .tag-list
    margin: 0
    padding-left: 18px
    color: #334155

    li
      line-height: 1.7
      margin-bottom: 6px

  .bullet-panel
    padding: 16px
    border-radius: 16px
    border: 1px solid #dbe5eb

    &--danger
      background: linear-gradient(180deg, #fff7f7 0%, #fffefe 100%)
      border-color: rgba(220, 38, 38, 0.16)

    &--primary
      background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)
      border-color: rgba(59, 130, 246, 0.16)

  .bullet-item
    line-height: 1.8
    color: #334155
    margin-bottom: 8px

    &:last-child
      margin-bottom: 0

  .reference-list
    display: flex
    flex-direction: column
    gap: 12px

  .reference-card
    padding: 16px
    border-radius: 16px
    background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)
    border: 1px solid #dbe5eb

  .reference-title
    font-size: 16px
    font-weight: 700
    color: #0f172a

  .reference-meta
    display: flex
    flex-wrap: wrap
    gap: 10px
    margin-top: 8px
    color: #64748b
    font-size: 12px

  .reference-quote
    margin-top: 12px
    padding: 12px 14px
    border-radius: 14px
    background: #f8fafc
    color: #334155
    line-height: 1.8

.template-drawer
  display: flex
  flex-direction: column
  gap: 18px

  .template-toolbar
    display: flex
    gap: 10px
    justify-content: flex-end

  .template-list
    display: flex
    flex-direction: column
    gap: 10px

  .template-row
    display: flex
    align-items: center
    justify-content: space-between
    gap: 12px
    padding: 14px
    border: 1px solid #dbe5eb
    border-radius: 8px
    background: #fff

    &--active
      border-color: #2563eb
      background: #f8fbff

  .template-row-title
    font-weight: 700
    color: #0f172a

  .template-row-meta
    display: flex
    flex-wrap: wrap
    gap: 10px
    margin-top: 6px
    color: #64748b
    font-size: 12px

  .template-row-actions
    display: flex
    align-items: center
    gap: 8px

  .template-form
    padding-top: 8px
    border-top: 1px solid #e2e8f0

  .form-grid
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 14px

  .template-form-actions
    display: flex
    justify-content: flex-end
    gap: 10px

@media (max-width: 960px)
  .medical-case-qc-page
    padding: 14px

    .hero-top,
    .overview-top
      flex-direction: column

    .workspace,
    .section-grid,
    .overview-grid,
    .form-grid
      grid-template-columns: 1fr

  .template-drawer
    .form-grid
      grid-template-columns: 1fr
</style>
