import { defineStore } from 'pinia'
import type { SiteSettings } from '~/types'
import { settingsApi } from '~/utils/api'

export const useSiteStore = defineStore('site', {
  state: () => ({
    settings: null as SiteSettings | null,
    loaded: false as boolean
  }),

  getters: {
    title: (state) => state.settings?.title || 'hdochub 个人技术博客',
    subtitle: (state) => state.settings?.subtitle || '面向工程师的技术博客',
    description: (state) => state.settings?.description || '',
    icp: (state) => state.settings?.icp || '',
    pageSize: (state) => state.settings?.pageSize || 10
  },

  actions: {
    async load() {
      if (this.loaded) return
      try {
        this.settings = await settingsApi.get()
      } catch {
        // 使用默认值
      }
      this.loaded = true
    },

    update(settings: SiteSettings) {
      this.settings = settings
    }
  }
})
