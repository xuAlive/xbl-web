<template>
  <XblConfirmDialog
    :model-value="confirmState.visible"
    :title="confirmState.title"
    :message="confirmState.message"
    :confirm-text="confirmState.confirmText"
    :cancel-text="confirmState.cancelText"
    @update:model-value="handleVisibilityChange"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<script setup lang="ts">
import XblConfirmDialog from '@/shared/components/XblConfirmDialog.vue'
import { confirmState, resolveConfirm } from '@/shared/ui/confirm'

const handleVisibilityChange = (value: boolean) => {
  if (!value) {
    resolveConfirm(false)
  }
}

const handleConfirm = () => {
  resolveConfirm(true)
}

const handleCancel = () => {
  resolveConfirm(false)
}
</script>
