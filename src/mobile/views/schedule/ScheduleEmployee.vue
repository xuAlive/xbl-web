<template>
  <div class="employee-page">
    <!-- 搜索和添加 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索员工"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="showDialog()">
        <el-icon><Plus /></el-icon>
        添加
      </el-button>
    </div>

    <!-- 员工列表 -->
    <div class="employee-list" v-loading="loading">
      <div
        v-for="emp in filteredEmployees"
        :key="emp.id"
        class="employee-card"
      >
        <div class="emp-avatar">
          {{ (emp.employeeName || '').charAt(0) }}
        </div>
        <div class="emp-info">
          <div class="emp-name">{{ emp.employeeName }}</div>
          <div class="emp-detail">
            <span>{{ emp.employeeCode }}</span>
            <span v-if="emp.department">· {{ emp.department }}</span>
            <span v-if="emp.position">· {{ emp.position }}</span>
          </div>
          <div class="emp-phone" v-if="emp.phone">
            <el-icon><Phone /></el-icon>
            {{ emp.phone }}
          </div>
        </div>
        <div class="emp-status">
          <el-tag :type="getStatusType(emp.status)" size="small">
            {{ getStatusText(emp.status) }}
          </el-tag>
        </div>
        <div class="emp-actions">
          <el-button type="primary" link size="small" @click="showDialog(emp)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(emp)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>

      <el-empty v-if="filteredEmployees.length === 0 && !loading" description="暂无员工">
        <el-button type="primary" @click="showDialog()">添加员工</el-button>
      </el-empty>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑员工' : '添加员工'"
      width="90%"
      class="mobile-dialog"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="员工编号" required>
          <el-input v-model="form.employeeCode" placeholder="请输入员工编号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="员工姓名" required>
          <el-input v-model="form.employeeName" placeholder="请输入员工姓名" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="form.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="form.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">在职</el-radio>
            <el-radio :value="2">离职</el-radio>
            <el-radio :value="3">休假</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Delete, Phone } from '@element-plus/icons-vue'
import { confirm } from '@/shared/ui/confirm'
import { getEmployeeList, createEmployee, updateEmployee, deleteEmployee, type Employee } from '../../api/schedule'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const keyword = ref('')
const employees = ref<Employee[]>([])

const form = ref<Employee>({
  employeeCode: '',
  employeeName: '',
  department: '',
  position: '',
  phone: '',
  email: '',
  status: 1
})

const filteredEmployees = computed(() => {
  if (!keyword.value) return employees.value
  const kw = keyword.value.toLowerCase()
  return employees.value.filter(e =>
    e.employeeName?.toLowerCase().includes(kw) ||
    e.employeeCode?.toLowerCase().includes(kw) ||
    e.department?.toLowerCase().includes(kw)
  )
})

const getStatusType = (status: number) => {
  const map: Record<number, '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    1: 'success',
    2: 'danger',
    3: 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 1: '在职', 2: '离职', 3: '休假' }
  return map[status] || '未知'
}

const handleSearch = () => {
  // 搜索由 computed 自动处理
}

const showDialog = (emp?: Employee) => {
  if (emp) {
    isEdit.value = true
    form.value = { ...emp }
  } else {
    isEdit.value = false
    form.value = {
      employeeCode: '',
      employeeName: '',
      department: '',
      position: '',
      phone: '',
      email: '',
      status: 1
    }
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.employeeCode || !form.value.employeeName) {
    return
  }

  submitting.value = true
  try {
    let success = false
    if (isEdit.value) {
      success = await updateEmployee(form.value)
    } else {
      success = await createEmployee(form.value)
    }

    if (success) {
      dialogVisible.value = false
      loadEmployees()
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (emp: Employee) => {
  if (!(await confirm({ message: `确定删除员工 ${emp.employeeName} 吗？`, confirmText: '删除' }))) return

  const success = await deleteEmployee(emp.id!)
  if (success) {
    loadEmployees()
  }
}

const loadEmployees = async () => {
  loading.value = true
  employees.value = await getEmployeeList()
  loading.value = false
}

onMounted(() => {
  loadEmployees()
})
</script>

<style scoped lang="scss">
.employee-page {
  padding: 15px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;

  .el-input {
    flex: 1;
  }
}

.employee-list {
  .employee-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 10px;

    .emp-avatar {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .emp-info {
      flex: 1;
      min-width: 0;

      .emp-name {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .emp-detail {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }

      .emp-phone {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #666;
        margin-top: 4px;
      }
    }

    .emp-status {
      flex-shrink: 0;
    }

    .emp-actions {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
  }
}

.mobile-dialog {
  :deep(.el-dialog__body) {
    padding: 15px 20px;
  }

  :deep(.el-form-item) {
    margin-bottom: 15px;
  }
}
</style>
