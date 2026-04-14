import {$post} from "../utils/request";
import { notification } from '@/shared/ui/feedback'
import { setUserInfo, setUserMenus, setUserRoleCode, setUserPermissions } from '../utils/userInfo'
import { getUserMenus as fetchUserMenus } from './menu'
import { getUserInfoByAccount } from './user'
import { getUserRoleCode as fetchUserRoleCode } from './role'
import { getUserPermissions as fetchUserPermissions } from './permission'

export const $login=async (params: any)=>{
    let ret = $post('/sys/login',JSON.stringify(params));

    if (1 == (await ret).code){
        notification({
            title: '通知',
            message: (await ret).codeMessage,
            type: 'success',
        })
        const token = (await ret).data
        sessionStorage.setItem("token", token)

        // 获取用户详细信息
        const userDetail = await getUserInfoByAccount(params.account)

        // 保存用户信息（包含昵称和真实姓名）
        setUserInfo({
            account: params.account,
            token: token,
            name: userDetail?.name || '',        // 昵称
            userName: userDetail?.userName || '' // 真实姓名
        })

        // 获取并保存用户菜单
        const menus = await fetchUserMenus()
        setUserMenus(menus)

        // 获取并保存用户角色编码
        const roleCode = await fetchUserRoleCode()
        setUserRoleCode(roleCode)

        // 获取并保存用户权限列表
        const permissions = await fetchUserPermissions()
        const permissionCodes = permissions.map(p => p.permissionCode)
        setUserPermissions(permissionCodes)

        return true
    }else {
        notification({
            title: '通知',
            message: (await ret).codeMessage,
            type: 'error',
        })
        return false
    }
}
