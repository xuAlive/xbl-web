<template>
  <div class="permission-manage-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>权限管理</h3>
          <el-button type="primary" @click="handleAdd">新增权限</el-button>
        </div>
      </template>

      <el-table :data="permissionList" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="permissionCode" label="权限编码" width="200" />
        <el-table-column prop="permissionName" label="权限名称" width="150" />
        <el-table-column prop="resourceType" label="资源类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.resourceType === 'API'" type="primary">API</el-tag>
            <el-tag v-else-if="row.resourceType === 'BUTTON'" type="success">按钮</el-tag>
            <el-tag v-else type="info">数据</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resourcePath" label="资源路径" width="250" />
        <el-table-column prop="description" label="权限描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">启用</el-tag>
            <el-tag v-else type="danger">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="permissionForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="权限编码" prop="permissionCode">
          <el-input v-model="permissionForm.permissionCode" placeholder="例如：system:user:list" />
        </el-form-item>
        <el-form-item label="权限名称" prop="permissionName">
          <el-input v-model="permissionForm.permissionName" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="资源类型" prop="resourceType">
          <el-select v-model="permissionForm.resourceType" placeholder="请选择资源类型">
            <el-option label="API" value="API" />
            <el-option label="按钮" value="BUTTON" />
            <el-option label="数据" value="DATA" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源路径" prop="resourcePath">
          <el-input
            v-model="permissionForm.resourcePath"
            placeholder="例如：/blog/sys/getUserList"
          />
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="permissionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="permissionForm.status">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllPermissions, addPermission, updatePermission, type Permission } from '../../api/permission'

const loading = ref(false)
const permissionList = ref<Permission[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增权限')
const formRef = ref()

const permissionForm = ref<Permission>({
  permissionCode: '',
  permissionName: '',
  resourceType: 'API',
  resourcePath: '',
  description: '',
  status: 1
})

const rules = {
  permissionCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  permissionName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  resourceType: [{ required: true, message: '请选择资源类型', trigger: 'change' }]
}

// 加载权限列表
const loadPermissionList = async () => {
  loading.value = true
  permissionList.value = await getAllPermissions()
  loading.value = false
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增权限'
  permissionForm.value = {
    permissionCode: '',
    permissionName: '',
    resourceType: 'API',
    resourcePath: '',
    description: '',
    status: 1
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Permission) => {
  dialogTitle.value = '编辑权限'
  permissionForm.value = { ...row }
  dialogVisible.value = true
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      let success = false
      if (permissionForm.value.id) {
        success = await updatePermission(permissionForm.value)
      } else {
        success = await addPermission(permissionForm.value)
      }

      if (success) {
        dialogVisible.value = false
        loadPermissionList()
      }
    }
  })
}

onMounted(() => {
  loadPermissionList()
})
</script>

<style scoped lang="scss">
.permission-manage-container {
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
