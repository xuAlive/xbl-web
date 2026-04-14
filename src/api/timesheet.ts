import { message } from '@/shared/ui/feedback'
import { $get, $post } from '../utils/request'
import { getTimesheetBaseURL } from '../config/baseURL'

export interface TimesheetProject {
  id: number
  projectName: string
  mode: number
  status: number
  creatorAccount: string
  creatorName?: string
  remark?: string
  finishedTime?: string
  createTime?: string
  updateTime?: string
  isDelete?: number
}

export interface ProjectMember {
  id: number
  projectId: number
  memberAccount?: string
  memberName: string
  memberPhone?: string
  joinTime?: string
}

export interface ProjectDetail {
  project: TimesheetProject
  members: ProjectMember[]
}

export interface AttendanceRecord {
  id: number
  projectId: number
  memberId: number
  memberAccount: string
  memberName: string
  workDate: string
  signInTime?: string
  signOutTime?: string
  workHours?: number
  workUnits?: number
  recordStatus: number
  remark?: string
}

export interface MakeupRequest {
  id: number
  projectId: number
  memberId: number
  memberAccount: string
  memberName: string
  workDate: string
  makeupSignInTime: string
  makeupSignOutTime: string
  reason?: string
  approvalStatus: number
  approverName?: string
  approvalRemark?: string
}

export interface ManualWorklog {
  id: number
  projectId: number
  memberId: number
  memberAccount: string
  memberName: string
  workDate: string
  workUnits: number
  remark?: string
}

export interface Settlement {
  id: number
  projectId: number
  settlementNo: string
  settlementType: number
  settledBy?: string
  settledByName?: string
  itemCount: number
  totalWorkHours?: number
  totalWorkUnits?: number
  unitSalary?: number
  totalSalary?: number
  createTime?: string
}

export interface SettlementItem {
  id: number
  settlementId: number
  projectId: number
  memberId: number
  memberAccount: string
  memberName: string
  workDate: string
  sourceMode: number
  sourceRecordId: number
  workHours?: number
  workUnits?: number
  unitSalary?: number
  salaryAmount?: number
  remark?: string
}

export interface SettlementMemberSummary {
  memberId: number
  memberAccount: string
  memberName: string
  totalWorkHours?: number
  totalWorkUnits?: number
  unitSalary?: number
  totalSalary?: number
}

export interface SettlementDetail {
  settlement: Settlement
  items: SettlementItem[]
  memberSummaries: SettlementMemberSummary[]
}

const handleResponse = (ret: any, errorMessage: string) => {
  if (ret.code === 1) {
    return ret.data
  }
  message.error(ret.codeMessage || errorMessage)
  return null
}

export const getMyTimesheetProjects = async () => {
  try {
    const ret = await $get(getTimesheetBaseURL() + '/project/my', {})
    return handleResponse(ret, '获取项目失败') || []
  } catch (error) {
    console.error('获取项目失败:', error)
    message.error('获取项目失败')
    return []
  }
}

export const createTimesheetProject = async (data: { projectName: string; mode: number; remark?: string }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/project/create', data)
    const project = handleResponse(ret, '创建项目失败')
    if (project) {
      message.success('项目创建成功')
    }
    return project as TimesheetProject | null
  } catch (error) {
    console.error('创建项目失败:', error)
    message.error('创建项目失败')
    return null
  }
}

export const getTimesheetProjectDetail = async (projectId: number) => {
  try {
    const ret = await $get(getTimesheetBaseURL() + `/project/detail/${projectId}`, {})
    return handleResponse(ret, '获取项目详情失败') as ProjectDetail | null
  } catch (error) {
    console.error('获取项目详情失败:', error)
    message.error('获取项目详情失败')
    return null
  }
}

export const addTimesheetMember = async (data: { projectId: number; memberAccount?: string; memberName: string; memberPhone: string }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/project/member/add', data)
    if (ret.code === 1) {
      message.success('成员添加成功')
      return true
    }
    message.error(ret.codeMessage || '成员添加失败')
    return false
  } catch (error) {
    console.error('成员添加失败:', error)
    message.error('成员添加失败')
    return false
  }
}

export const removeTimesheetMember = async (projectId: number, memberId: number) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + `/project/member/remove?projectId=${projectId}&memberId=${memberId}`, {})
    if (ret.code === 1) {
      message.success('成员移除成功')
      return true
    }
    message.error(ret.codeMessage || '成员移除失败')
    return false
  } catch (error) {
    console.error('成员移除失败:', error)
    message.error('成员移除失败')
    return false
  }
}

export const syncTimesheetMembers = async (data: { targetProjectId: number; sourceProjectId: number }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/project/member/sync', data)
    if (ret.code === 1) {
      const count = Number(ret.data || 0)
      message.success(count > 0 ? `已同步 ${count} 位成员` : '没有可同步的新成员')
      return count
    }
    message.error(ret.codeMessage || '同步成员失败')
    return -1
  } catch (error) {
    console.error('同步成员失败:', error)
    message.error('同步成员失败')
    return -1
  }
}

export const deleteTimesheetProject = async (id: number) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/project/delete', { id })
    if (ret.code === 1) {
      message.success('项目删除成功')
      return true
    }
    message.error(ret.codeMessage || '项目删除失败')
    return false
  } catch (error) {
    console.error('项目删除失败:', error)
    message.error('项目删除失败')
    return false
  }
}

export const signAttendance = async (data: { projectId: number; signType: number; signTime?: string; remark?: string }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/attendance/sign', data)
    const record = handleResponse(ret, '签到失败')
    if (record) {
      message.success(data.signType === 1 ? '签到成功' : '离班签到成功')
    }
    return record as AttendanceRecord | null
  } catch (error) {
    console.error('签到失败:', error)
    message.error('签到失败')
    return null
  }
}

export const getAttendanceList = async (projectId: number) => {
  try {
    const ret = await $get(getTimesheetBaseURL() + '/attendance/list', { projectId })
    return handleResponse(ret, '获取工时记录失败') || []
  } catch (error) {
    console.error('获取工时记录失败:', error)
    message.error('获取工时记录失败')
    return []
  }
}

export const createMakeupRequest = async (data: { projectId: number; workDate: string; signInTime: string; signOutTime: string; reason?: string }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/attendance/makeup/create', data)
    if (ret.code === 1) {
      message.success('补签申请已提交')
      return true
    }
    message.error(ret.codeMessage || '补签申请失败')
    return false
  } catch (error) {
    console.error('补签申请失败:', error)
    message.error('补签申请失败')
    return false
  }
}

export const getMakeupRequestList = async (projectId: number) => {
  try {
    const ret = await $get(getTimesheetBaseURL() + '/attendance/makeup/list', { projectId })
    return handleResponse(ret, '获取补签申请失败') || []
  } catch (error) {
    console.error('获取补签申请失败:', error)
    message.error('获取补签申请失败')
    return []
  }
}

export const approveMakeupRequest = async (data: { requestId: number; approvalStatus: number; approvalRemark?: string }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/attendance/makeup/approve', data)
    if (ret.code === 1) {
      message.success(data.approvalStatus === 2 ? '补签已通过' : '补签已拒绝')
      return true
    }
    message.error(ret.codeMessage || '审批失败')
    return false
  } catch (error) {
    console.error('审批失败:', error)
    message.error('审批失败')
    return false
  }
}

export const saveManualWorklog = async (data: { projectId: number; workDate: string; items: Array<{ memberId: number; workUnits: number; remark?: string }> }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/manual/save', data)
    if (ret.code === 1) {
      message.success('记工已保存')
      return true
    }
    message.error(ret.codeMessage || '记工保存失败')
    return false
  } catch (error) {
    console.error('记工保存失败:', error)
    message.error('记工保存失败')
    return false
  }
}

export const getManualWorklogList = async (projectId: number) => {
  try {
    const ret = await $get(getTimesheetBaseURL() + '/manual/list', { projectId })
    return handleResponse(ret, '获取人工记工失败') || []
  } catch (error) {
    console.error('获取人工记工失败:', error)
    message.error('获取人工记工失败')
    return []
  }
}

export const createSettlement = async (data: { projectId: number; memberIds?: number[]; unitSalary?: number | null }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/settlement/create', data)
    const detail = handleResponse(ret, '结算失败')
    if (detail) {
      message.success('结算成功')
    }
    return detail as SettlementDetail | null
  } catch (error) {
    console.error('结算失败:', error)
    message.error('结算失败')
    return null
  }
}

export const finishProjectSettlement = async (data: { projectId: number; memberIds?: number[]; unitSalary?: number | null }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/settlement/finishProject', data)
    const detail = handleResponse(ret, '项目结算失败')
    if (detail) {
      message.success('项目已结算并结束')
    }
    return detail as SettlementDetail | null
  } catch (error) {
    console.error('项目结算失败:', error)
    message.error('项目结算失败')
    return null
  }
}

export const getSettlementList = async (projectId: number) => {
  try {
    const ret = await $get(getTimesheetBaseURL() + '/settlement/list', { projectId })
    return handleResponse(ret, '获取结算记录失败') || []
  } catch (error) {
    console.error('获取结算记录失败:', error)
    message.error('获取结算记录失败')
    return []
  }
}

export const getSettlementDetail = async (settlementId: number) => {
  try {
    const ret = await $get(getTimesheetBaseURL() + `/settlement/detail/${settlementId}`, {})
    return handleResponse(ret, '获取结算详情失败') as SettlementDetail | null
  } catch (error) {
    console.error('获取结算详情失败:', error)
    message.error('获取结算详情失败')
    return null
  }
}

export const calcSettlementSalary = async (data: { settlementId: number; unitSalary: number }) => {
  try {
    const ret = await $post(getTimesheetBaseURL() + '/settlement/calcSalary', data)
    const detail = handleResponse(ret, '薪资计算失败')
    if (detail) {
      message.success('薪资计算完成')
    }
    return detail as SettlementDetail | null
  } catch (error) {
    console.error('薪资计算失败:', error)
    message.error('薪资计算失败')
    return null
  }
}
