import { $get, $post } from '@/shared/http/client'
import { message } from '@/shared/ui/feedback'

export interface MedicalRecordQcPromptTemplate {
  id?: number
  account?: string
  templateName: string
  sceneCode?: string
  modelProvider?: string
  modelName: string
  systemMessage: string
  promptTemplate: string
  defaultFlag?: number
  enabled?: number
  sortOrder?: number
  createTime?: string
  updateTime?: string
  isDelete?: number
}

export interface MedicalRecordQcModelOption {
  label: string
  value: string
  provider: string
}

export interface MedicalRecordQcSection {
  sectionCode: string
  sectionName: string
  passed?: boolean
  passedText?: string
  conclusion?: string
  problems: string[]
  suggestions: string[]
}

export interface MedicalRecordQcKnowledgeReference {
  itemId?: number
  title?: string
  sourceName?: string
  chapterTitle?: string
  quoteText?: string
}

export interface MedicalRecordCaseQcResult {
  fullMedicalRecord?: string
  chiefComplaint?: string
  presentIllness?: string
  preliminaryDiagnosis?: string
  department?: string
  modelName?: string
  promptTemplateId?: number
  promptTemplateName?: string
  qualified?: boolean
  qualifiedText?: string
  riskLevel?: 'low' | 'medium' | 'high' | string
  riskLevelText?: string
  summary?: string
  problems: string[]
  suggestions: string[]
  knowledgeReferences: MedicalRecordQcKnowledgeReference[]
  sections: MedicalRecordQcSection[]
  rawModelResult?: string
}

export interface MedicalRecordCaseQcPayload {
  fullMedicalRecord?: string
  chiefComplaint?: string
  presentIllness?: string
  preliminaryDiagnosis?: string
  department?: string
  promptTemplateId?: number
  modelName?: string
}

const getErrorMessage = (ret: any, fallback: string) => ret?.codeMessage || ret?.msg || fallback

export const medicalRecordCaseQc = async (payload: MedicalRecordCaseQcPayload) => {
  try {
    const ret = await $post('/ai/medical-record/case/qc', payload)
    if (ret.code === 1) {
      message.success('病例质控完成')
      return ret.data as MedicalRecordCaseQcResult
    }
    message.error(getErrorMessage(ret, '病例质控失败'))
    return null
  } catch (error) {
    console.error('病例质控失败:', error)
    message.error('病例质控失败')
    return null
  }
}

export const getMedicalRecordQcTemplates = async () => {
  try {
    const ret = await $get('/ai/medical-record/case/qc/template/list')
    if (ret.code === 1) {
      return ret.data as MedicalRecordQcPromptTemplate[]
    }
    message.error(getErrorMessage(ret, '质控模板加载失败'))
    return []
  } catch (error) {
    console.error('质控模板加载失败:', error)
    message.error('质控模板加载失败')
    return []
  }
}

export const saveMedicalRecordQcTemplate = async (payload: MedicalRecordQcPromptTemplate) => {
  try {
    const ret = await $post('/ai/medical-record/case/qc/template/save', payload)
    if (ret.code === 1) {
      message.success('质控模板已保存')
      return ret.data as MedicalRecordQcPromptTemplate
    }
    message.error(getErrorMessage(ret, '质控模板保存失败'))
    return null
  } catch (error) {
    console.error('质控模板保存失败:', error)
    message.error('质控模板保存失败')
    return null
  }
}

export const deleteMedicalRecordQcTemplate = async (id: number) => {
  try {
    const ret = await $post('/ai/medical-record/case/qc/template/delete', { id })
    if (ret.code === 1) {
      message.success('质控模板已删除')
      return true
    }
    message.error(getErrorMessage(ret, '质控模板删除失败'))
    return false
  } catch (error) {
    console.error('质控模板删除失败:', error)
    message.error('质控模板删除失败')
    return false
  }
}

export const getMedicalRecordQcModelOptions = async () => {
  try {
    const ret = await $get('/ai/medical-record/case/qc/model/options')
    if (ret.code === 1) {
      return ret.data as MedicalRecordQcModelOption[]
    }
    message.error(getErrorMessage(ret, '模型列表加载失败'))
    return []
  } catch (error) {
    console.error('模型列表加载失败:', error)
    message.error('模型列表加载失败')
    return []
  }
}
