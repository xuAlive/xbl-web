<template>
  <div class="menu-container">
    <el-card>
      <h2 class="page-title">菜单管理</h2>
      <p class="page-desc">这里可以管理系统菜单结构和权限配置</p>

      <el-tree
        :data="menuData"
        :props="defaultProps"
        default-expand-all
        class="menu-tree"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <span>{{ node.label }}</span>
            <span>
              <el-button type="text" size="small">编辑</el-button>
              <el-button type="text" size="small">删除</el-button>
            </span>
          </span>
        </template>
      </el-tree>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const menuData = ref([
  {
    label: '首页',
    children: [
      { label: '博客广场' },
      { label: '博客列表' },
      { label: '小程序' }
    ]
  },
  {
    label: '个人博客',
    children: [
      { label: '我的家园' },
      { label: '账号详情' }
    ]
  },
  {
    label: '系统管理',
    children: [
      { label: '账号管理' },
      { label: '菜单管理' },
      { label: '登陆信息' }
    ]
  }
])

const defaultProps = {
  children: 'children',
  label: 'label'
}
</script>

<style scoped lang="sass">
.menu-container
  padding: 20px
  height: 100%
  overflow-y: auto

  .page-title
    font-size: 24px
    color: #2c5282
    margin: 0 0 10px 0
    font-family: var(--font-family-base)

  .page-desc
    color: #718096
    margin-bottom: 20px

  .menu-tree
    margin-top: 20px

  .custom-tree-node
    flex: 1
    display: flex
    align-items: center
    justify-content: space-between
    font-size: 14px
    padding-right: 8px
</style>
