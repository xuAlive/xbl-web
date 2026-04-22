import httpClient, { $get, $post } from '@/shared/http/client'
import { message } from '@/shared/ui/feedback'

export interface MedicalKnowledgeSource {
  id: number
  account?: string
  sourceName: string
  sourceType: number
  fileFormat: string
  fileSize: number
  fileHash?: string
  localPath?: string
  storagePath: string
  parseStatus: number
  extractStatus: number
  chapterCount: number
  chunkCount: number
  knowledgeCount: number
  errorMessage?: string
  createTime?: string
  updateTime?: string
  isDelete?: number
}

export interface MedicalKnowledgeTask {
  id: number
  sourceId: number
  taskType: number
  taskStatus: number
  modelName?: string
  promptVersion?: string
  resultMessage?: string
  startTime?: string
  finishTime?: string
  createTime?: string
  updateTime?: string
}

export interface MedicalKnowledgeItem {
  id: number
  sourceId: number
  itemType: string
  title: string
  keywords?: string
  department?: string
  summary?: string
  content: string
  structuredData?: string
  confidenceScore?: number
  dedupKey?: string
  reviewStatus?: number
  createTime?: string
  updateTime?: string
}

export interface MedicalKnowledgeSourceDetail {
  source: MedicalKnowledgeSource
  tasks: MedicalKnowledgeTask[]
  latestItems: MedicalKnowledgeItem[]
}

export interface MedicalKnowledgeEvidence {
  refId: number
  chunkId: number
  chapterNo?: number
  chapterTitle?: string
  pageFrom?: number
  pageTo?: number
  quoteText?: string
  cleanContent?: string
  sortOrder?: number
}

export interface MedicalKnowledgeItemDetail {
  item: MedicalKnowledgeItem
  source: MedicalKnowledgeSource
  references: MedicalKnowledgeEvidence[]
}

export interface MedicalKnowledgePage<T> {
  total: number
  list: T[]
}

export interface MedicalKnowledgeImportResult {
  totalFiles: number
  sourceIds: number[]
  sourceNames: string[]
}

const getErrorMessage = (ret: any, fallback: string) => ret?.codeMessage || ret?.msg || fallback

export const importMedicalKnowledgeByLocalPath = async (localPath: string) => {
  try {
    const ret = await $post('/medical/knowledge/source/local/import', { localPath })
    if (ret.code === 1) {
      message.success('本地书籍导入任务已提交')
      return ret.data as MedicalKnowledgeImportResult
    }
    message.error(getErrorMessage(ret, '本地书籍导入失败'))
    return null
  } catch (error) {
    console.error('本地书籍导入失败:', error)
    message.error('本地书籍导入失败')
    return null
  }
}

export const uploadMedicalKnowledgeFile = async (file: File) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await httpClient.post('/medical/knowledge/source/upload', formData)
    const ret = response.data
    if (ret.code === 1) {
      message.success('上传成功，提取任务已提交')
      return ret.data as MedicalKnowledgeImportResult
    }
    message.error(getErrorMessage(ret, '上传失败'))
    return null
  } catch (error) {
    console.error('上传医疗知识文件失败:', error)
    message.error('上传医疗知识文件失败')
    return null
  }
}

export const getMedicalKnowledgeSourceList = async () => {
  try {
    const ret = await $get('/medical/knowledge/source/list')
    if (ret.code === 1) {
      return ret.data as MedicalKnowledgeSource[]
    }
    message.error(getErrorMessage(ret, '获取来源列表失败'))
    return []
  } catch (error) {
    console.error('获取来源列表失败:', error)
    message.error('获取来源列表失败')
    return []
  }
}

export const getMedicalKnowledgeSourceDetail = async (id: number) => {
  try {
    const ret = await $get(`/medical/knowledge/source/detail/${id}`)
    if (ret.code === 1) {
      return ret.data as MedicalKnowledgeSourceDetail
    }
    message.error(getErrorMessage(ret, '获取来源详情失败'))
    return null
  } catch (error) {
    console.error('获取来源详情失败:', error)
    message.error('获取来源详情失败')
    return null
  }
}

export const reextractMedicalKnowledgeSource = async (id: number) => {
  try {
    const ret = await $post('/medical/knowledge/source/reextract', { id })
    if (ret.code === 1) {
      message.success('重新提取任务已提交')
      return true
    }
    message.error(getErrorMessage(ret, '重新提取失败'))
    return false
  } catch (error) {
    console.error('重新提取失败:', error)
    message.error('重新提取失败')
    return false
  }
}

export const getMedicalKnowledgeItemPage = async (params: Record<string, any>) => {
  try {
    const ret = await $get('/medical/knowledge/item/list', params)
    if (ret.code === 1) {
      return ret.data as MedicalKnowledgePage<MedicalKnowledgeItem>
    }
    message.error(getErrorMessage(ret, '获取知识条目失败'))
    return { total: 0, list: [] }
  } catch (error) {
    console.error('获取知识条目失败:', error)
    message.error('获取知识条目失败')
    return { total: 0, list: [] }
  }
}

export const getMedicalKnowledgeItemTypes = async (sourceId?: number) => {
  try {
    const ret = await $get('/medical/knowledge/item/types', {
      sourceId,
    })
    if (ret.code === 1) {
      return ret.data as string[]
    }
    message.error(getErrorMessage(ret, '获取知识类型失败'))
    return []
  } catch (error) {
    console.error('获取知识类型失败:', error)
    message.error('获取知识类型失败')
    return []
  }
}

export const getMedicalKnowledgeItemDetail = async (id: number) => {
  try {
    const ret = await $get(`/medical/knowledge/item/detail/${id}`)
    if (ret.code === 1) {
      return ret.data as MedicalKnowledgeItemDetail
    }
    message.error(getErrorMessage(ret, '获取知识详情失败'))
    return null
  } catch (error) {
    console.error('获取知识详情失败:', error)
    message.error('获取知识详情失败')
    return null
  }
}

export const deleteMedicalKnowledgeItem = async (id: number) => {
  try {
    const ret = await $post('/medical/knowledge/item/delete', { id })
    if (ret.code === 1) {
      message.success('知识条目已删除')
      return true
    }
    message.error(getErrorMessage(ret, '删除知识条目失败'))
    return false
  } catch (error) {
    console.error('删除知识条目失败:', error)
    message.error('删除知识条目失败')
    return false
  }
}
