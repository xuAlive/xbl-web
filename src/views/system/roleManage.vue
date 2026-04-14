<template>
  <div class="role-manage-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>角色管理</h3>
          <el-button type="primary" @click="handleAdd">新增角色</el-button>
        </div>
      </template>

      <el-table :data="roleList" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleCode" label="角色编码" width="150" />
        <el-table-column prop="roleName" label="角色名称" width="150" />
        <el-table-column prop="description" label="角色描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">启用</el-tag>
            <el-tag v-else type="danger">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" size="small" @click="handleAssignMenus(row)">分配菜单</el-button>
            <el-button type="warning" size="small" @click="handleAssignPermissions(row)">分配权限</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="roleForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="roleForm.roleCode" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="roleForm.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配菜单对话框 -->
    <el-dialog v-model="menuDialogVisible" title="分配菜单" width="500px">
      <el-tree
        ref="menuTreeRef"
        :data="menuList"
        :props="{ label: 'menuName', children: 'children' }"
        show-checkbox
        node-key="id"
        default-expand-all
      />
      <template #footer>
        <el-button @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleMenuSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配权限对话框 -->
    <el-dialog v-model="permissionDialogVisible" title="分配权限" width="750px">
      <el-table
        ref="permissionTableRef"
        :data="permissionList"
        @selection-change="handlePermissionSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="permissionCode" label="权限编码" width="200" />
        <el-table-column prop="permissionName" label="权限名称" width="130" />
        <el-table-column prop="resourcePath" label="接口路径" width="220" />
        <el-table-column prop="description" label="描述" />
      </el-table>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePermissionSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { getAllRoles, addRole, updateRole, type Role } from '../../api/role'
import { getAllMenus, assignMenusToRole, getMenuIdsByRoleId, getUserMenus as fetchUserMenus, type Menu } from '../../api/menu'
import { getAllPermissions, assignPermissionsToRole, getPermissionIdsByRoleId, type Permission } from '../../api/permission'
import { message } from '@/shared/ui/feedback'
import { getUserRoleCode, setUserMenus } from '../../utils/userInfo'

const loading = ref(false)
const roleList = ref<Role[]>([])
const menuList = ref<Menu[]>([])
const permissionList = ref<Permission[]>([])

const dialogVisible = ref(false)
const menuDialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const dialogTitle = ref('新增角色')

const formRef = ref()
const menuTreeRef = ref()
const permissionTableRef = ref()

const currentRole = ref<Role | null>(null)
const selectedPermissions = ref<Permission[]>([])

const roleForm = ref<Role>({
  roleCode: '',
  roleName: '',
  description: '',
  status: 1
})

const rules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

// 加载角色列表
const loadRoleList = async () => {
  loading.value = true
  roleList.value = await getAllRoles()
  loading.value = false
}

// 加载菜单列表
const loadMenuList = async () => {
  menuList.value = await getAllMenus()
}

// 加载权限列表
const loadPermissionList = async () => {
  permissionList.value = await getAllPermissions()
}

// 收集所有叶子节点ID（el-tree只对叶子节点设置checked状态来实现正确的回显）
const getLeafMenuIds = (menus: Menu[], assignedIds: number[]): number[] => {
  const leafIds: number[] = []
  const collectLeafs = (items: Menu[]) => {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        collectLeafs(item.children)
      } else {
        if (assignedIds.includes(item.id!)) {
          leafIds.push(item.id!)
        }
      }
    }
  }
  collectLeafs(menus)
  return leafIds
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增角色'
  roleForm.value = {
    roleCode: '',
    roleName: '',
    description: '',
    status: 1
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Role) => {
  dialogTitle.value = '编辑角色'
  roleForm.value = { ...row }
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      let success = false
      if (roleForm.value.id) {
        success = await updateRole(roleForm.value)
      } else {
        success = await addRole(roleForm.value)
      }

      if (success) {
        dialogVisible.value = false
        loadRoleList()
      }
    }
  })
}

// 分配菜单 - 加载菜单并回显已分配数据
const handleAssignMenus = async (row: Role) => {
  currentRole.value = row
  await loadMenuList()
  // 获取角色已分配的菜单ID列表
  const assignedMenuIds = await getMenuIdsByRoleId(row.id!)
  menuDialogVisible.value = true
  // 等待DOM更新后设置选中状态
  await nextTick()
  if (menuTreeRef.value) {
    // 只设置叶子节点为checked，父节点会自动根据子节点状态显示为checked或half-checked
    const leafIds = getLeafMenuIds(menuList.value, assignedMenuIds)
    menuTreeRef.value.setCheckedKeys(leafIds)
  }
}

// 提交菜单分配 - 同时提交checked和half-checked节点
const handleMenuSubmit = async () => {
  if (!currentRole.value || !menuTreeRef.value) return

  const checkedKeys = menuTreeRef.value.getCheckedKeys() as number[]
  const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys() as number[]
  const allKeys = [...checkedKeys, ...halfCheckedKeys]
  const success = await assignMenusToRole(currentRole.value.id!, allKeys)

  if (success) {
    if (currentRole.value.roleCode === getUserRoleCode()) {
      const latestMenus = await fetchUserMenus()
      setUserMenus(latestMenus)
      window.dispatchEvent(new CustomEvent('user-menus-updated'))
      message.success('当前会话菜单已刷新')
    }
    menuDialogVisible.value = false
  }
}

// 分配权限 - 加载权限并回显已分配数据
const handleAssignPermissions = async (row: Role) => {
  currentRole.value = row
  await loadPermissionList()
  // 获取角色已分配的权限ID列表
  const assignedPermissionIds = await getPermissionIdsByRoleId(row.id!)
  permissionDialogVisible.value = true
  // 等待DOM更新后设置选中状态
  await nextTick()
  if (permissionTableRef.value) {
    // 根据已分配的权限ID回显选中状态
    permissionList.value.forEach(permission => {
      if (assignedPermissionIds.includes(permission.id!)) {
        permissionTableRef.value.toggleRowSelection(permission, true)
      }
    })
  }
}

// 权限选择变化
const handlePermissionSelectionChange = (selection: Permission[]) => {
  selectedPermissions.value = selection
}

// 提交权限分配
const handlePermissionSubmit = async () => {
  if (!currentRole.value) return

  const permissionIds = selectedPermissions.value.map(p => p.id!)
  const success = await assignPermissionsToRole(currentRole.value.id!, permissionIds)

  if (success) {
    permissionDialogVisible.value = false
  }
}

onMounted(() => {
  loadRoleList()
})
</script>

<style scoped lang="scss">
.role-manage-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 18px;
      color: #303133;
    }
  }
}
</style>
