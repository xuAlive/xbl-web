<template>
  <teleport to="body">
    <div v-if="modelValue" class="xbl-confirm-overlay">
      <div class="xbl-confirm-card" role="dialog" aria-modal="true">
        <button class="xbl-confirm-close" type="button" @click="handleCancel" aria-label="关闭">
          ×
        </button>

        <div class="xbl-confirm-title">{{ title }}</div>
        <div class="xbl-confirm-message">{{ message }}</div>

        <div class="xbl-confirm-actions">
          <button class="xbl-confirm-button xbl-confirm-button-cancel" type="button" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button class="xbl-confirm-button xbl-confirm-button-danger" type="button" @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
  }>(),
  {
    title: '温馨提示',
    confirmText: '删除',
    cancelText: '取消',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const handleCancel = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<style scoped>
.xbl-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.26);
}

.xbl-confirm-card {
  position: relative;
  width: min(620px, calc(100vw - 48px));
  max-width: calc(100vw - 48px);
  min-height: 188px;
  padding: 24px 24px 22px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(31, 41, 55, 0.12);
}

.xbl-confirm-close {
  position: absolute;
  top: 20px;
  right: 22px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.xbl-confirm-title {
  color: #22253d;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
}

.xbl-confirm-message {
  margin-top: 18px;
  color: #2d3254;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.65;
}

.xbl-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 22px;
}

.xbl-confirm-button {
  min-width: 118px;
  height: 46px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.xbl-confirm-button-cancel {
  border: 1.5px solid #d7dbe8;
  background: #ffffff;
  color: #101010;
}

.xbl-confirm-button-danger {
  border: none;
  background: #ff3b4d;
  color: #ffffff;
}

@media (max-width: 640px) {
  .xbl-confirm-overlay {
    padding: 12px;
  }

  .xbl-confirm-card {
    width: min(100%, calc(100vw - 24px));
    max-width: calc(100vw - 24px);
    min-height: 0;
    padding: 22px 18px 18px;
    border-radius: 20px;
  }

  .xbl-confirm-close {
    top: 16px;
    right: 16px;
    font-size: 22px;
  }

  .xbl-confirm-title {
    font-size: 17px;
  }

  .xbl-confirm-message {
    margin-top: 16px;
    font-size: 14px;
  }

  .xbl-confirm-actions {
    gap: 10px;
    margin-top: 18px;
  }

  .xbl-confirm-button {
    flex: 1;
    min-width: 0;
    height: 42px;
    font-size: 14px;
  }
}
</style>
