import { createApp, type Component } from 'vue'
import { createPinia } from 'pinia'
import type { Router } from 'vue-router'

import { setupPermissionDirectives } from '@/directives/permission'

export function bootstrapApp(rootComponent: Component, router: Router) {
  const app = createApp(rootComponent)

  app.use(createPinia())
  app.use(router)
  setupPermissionDirectives(app)
  app.mount('#app')
}
