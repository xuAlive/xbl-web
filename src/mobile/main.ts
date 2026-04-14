import './assets/style.scss'

import MobileApp from '@/mobile/App.vue'
import { bootstrapApp } from '@/app/bootstrap'
import router from '@/mobile/router'

bootstrapApp(MobileApp, router)
