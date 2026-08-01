import { api } from '~/utils/api'

export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      api
    }
  }
})
