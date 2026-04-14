<template>
  <div class="menu-manage-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>菜单管理</h3>
          <el-button type="primary" @click="handleAdd">新增菜单</el-button>
        </div>
      </template>

      <el-table
        :data="menuList"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        v-loading="loading"
      >
        <el-table-column prop="menuName" label="菜单名称" width="200" />
        <el-table-column prop="menuCode" label="菜单编码" width="150" />
        <el-table-column prop="menuType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.menuType === 1" type="info">目录</el-tag>
            <el-tag v-else-if="row.menuType === 2" type="primary">菜单</el-tag>
            <el-tag v-else type="warning">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由地址" width="180" />
        <el-table-column prop="component" label="组件路径" width="200" />
        <el-table-column prop="icon" label="图标" width="100" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">启用</el-tag>
            <el-tag v-else type="danger">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
    >
      <el-form :model="menuForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="父菜单" prop="parentId">
          <el-tree-select
            v-model="menuForm.parentId"
            :data="menuTreeOptions"
            :props="{ label: 'menuName', children: 'children' }"
            value-key="id"
            placeholder="请选择父菜单（不选则为顶级菜单）"
            check-strictly
            clearable
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="menuForm.menuType">
            <el-radio :label="1">目录</el-radio>
            <el-radio :label="2">菜单</el-radio>
            <el-radio :label="3">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="menuForm.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单编码" prop="menuCode">
          <el-input v-model="menuForm.menuCode" placeholder="请输入菜单编码" />
        </el-form-item>
        <el-form-item label="路由地址" prop="path">
          <el-input v-model="menuForm.path" placeholder="请输入路由地址" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="menuForm.icon" placeholder="请输入图标" />
        </el-form-item>
        <el-form-item label="权限标识" prop="permission">
          <el-input v-model="menuForm.permission" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="menuForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="menuForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否可见" prop="visible">
          <el-radio-group v-model="menuForm.visible">
            <el-radio :label="1">显示</el-radio>
            <el-radio :label="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { confirm } from '@/shared/ui/confirm'
import { getAllMenus, addMenu, updateMenu, deleteMenu, type Menu } from '../../api/menu'

const loading = ref(false)
const menuList = ref<Menu[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增菜单')
const formRef = ref()

const menuForm = ref<Menu>({
  parentId: 0,
  menuName: '',
  menuCode: '',
  menuType: 2,
  path: '',
  component: '',
  icon: '',
  sortOrder: 0,
  visible: 1,
  status: 1,
  permission: ''
})

const rules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuCode: [{ required: true, message: '请输入菜单编码', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
}

// 菜单树选项（用于选择父菜单）
const menuTreeOptions = computed(() => {
  const addRootOption = (list: Menu[]): any[] => {
    return [
      { id: 0, menuName: '根菜单', children: list },
      ...list
    ]
  }
  return addRootOption(menuList.value)
})

// 加载菜单列表
const loadMenuList = async () => {
  loading.value = true
  menuList.value = await getAllMenus()
  loading.value = false
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增菜单'
  menuForm.value = {
    parentId: 0,
    menuName: '',
    menuCode: '',
    menuType: 2,
    path: '',
    component: '',
    icon: '',
    sortOrder: 0,
    visible: 1,
    status: 1,
    permission: ''
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Menu) => {
  dialogTitle.value = '编辑菜单'
  menuForm.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: Menu) => {
  const confirmed = await confirm({ message: '确定要删除该菜单吗？', confirmText: '删除' })
  if (!confirmed) return
  if (row.id && await deleteMenu(row.id)) {
    loadMenuList()
  }
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      let success = false
      if (menuForm.value.id) {
        success = await updateMenu(menuForm.value)
      } else {
        success = await addMenu(menuForm.value)
      }

      if (success) {
        dialogVisible.value = false
        loadMenuList()
      }
    }
  })
}

onMounted(() => {
  loadMenuList()
})
</script>

<style scoped lang="scss">
.menu-manage-container {
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
