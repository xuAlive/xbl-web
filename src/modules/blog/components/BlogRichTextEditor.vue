<template>
  <div class="editor-wrapper">
    <Toolbar
      class="toolbar"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      mode="default"
    />
    <Editor
      class="editor"
      v-model="htmlValue"
      :defaultConfig="editorConfig"
      mode="default"
      @onCreated="handleCreated"
    />
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'

import { computed, shallowRef, onBeforeUnmount } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

const props = defineProps<{
  modelValue: string
  uploadImage: (file: File) => Promise<string | null | undefined>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = shallowRef<IDomEditor>()

const htmlValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [
    'group-video',
    'fullScreen'
  ]
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '开始你的创作...',
  MENU_CONF: {
    uploadImage: {
      customUpload: async (file: File, insertFn: any) => {
        const url = await props.uploadImage(file)
        if (url) {
          insertFn(url, '', '')
        }
      }
    }
  }
}

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

const getText = () => {
  return editorRef.value?.getText() || ''
}

const destroy = () => {
  editorRef.value?.destroy()
}

defineExpose({
  getText,
  destroy
})

onBeforeUnmount(() => {
  destroy()
})
</script>

<style scoped lang="scss">
.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;

  .toolbar {
    border-bottom: 1px solid #e8e8e8;
    background: #fafafa;
  }

  .editor {
    flex: 1;
    overflow-y: auto;
  }
}

:deep(.w-e-text-container) {
  background: #fff;

  [data-slate-editor] {
    padding: 20px 24px;
    min-height: 400px;

    p {
      margin: 0 0 16px 0;
      line-height: 1.8;
      font-size: 16px;
      color: #1a1a1a;
    }

    h1, h2, h3, h4, h5, h6 {
      margin: 24px 0 16px 0;
      font-weight: 600;
      color: #1a1a1a;
    }

    blockquote {
      margin: 16px 0;
      padding: 12px 16px;
      background: #f7f7f7;
      border-left: 4px solid #1890ff;
      color: #595959;
    }

    ul, ol {
      margin: 16px 0;
      padding-left: 24px;
    }

    img {
      max-width: 100%;
      border-radius: 4px;
    }

    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 14px;
    }

    pre {
      background: #282c34;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;

      code {
        background: transparent;
        color: #abb2bf;
        padding: 0;
      }
    }
  }
}

:deep(.w-e-toolbar) {
  background: #fafafa !important;
  border-bottom: 1px solid #e8e8e8 !important;
}
</style>
