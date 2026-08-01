<script setup lang="ts">
import { archiveApi } from '~/utils/api'
import { formatDate } from '~/utils/format'

const { data: archive, pending } = await useAsyncData('archive', () => archiveApi.list())

interface ArchiveGroup {
  year: number
  months: Array<{
    month: number
    items: any[]
  }>
  expanded: boolean
}

const groups = ref<ArchiveGroup[]>([])

watch(archive, (val) => {
  if (!val) return
  // 后端返回 {year, months: [{month, articles}]} 嵌套结构，直接映射
  groups.value = val.map((g: any, idx: number) => ({
    year: g.year,
    months: (g.months || []).map((m: any) => ({
      month: m.month,
      items: (m.articles || []).sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    })),
    expanded: idx === 0,
  }))
}, { immediate: true })

const expandedMonths = ref<Set<string>>(new Set())

function toggleYear(idx: number) {
  groups.value[idx].expanded = !groups.value[idx].expanded
}

function toggleMonth(key: string) {
  if (expandedMonths.value.has(key)) {
    expandedMonths.value.delete(key)
  } else {
    expandedMonths.value.add(key)
  }
}

function isMonthExpanded(key: string): boolean {
  return expandedMonths.value.has(key)
}

const totalCount = computed(() => {
  if (!archive.value) return 0
  return archive.value.reduce((sum: number, g: any) => sum + (g.months || []).reduce((s: number, m: any) => s + (m.articles || []).length, 0), 0)
})

useHead({ title: '归档 - hdochub' })
</script>

<template>
  <div class="container-list py-6">
    <div class="border-2 border-black bg-white p-6 mb-6">
      <h1 class="font-mono text-h2 font-bold uppercase">ARCHIVE / 文章归档</h1>
      <p class="mt-2 font-mono text-small text-ink-700">共 {{ totalCount }} 篇</p>
    </div>

    <div v-if="pending" class="border-2 border-black bg-white p-6">
      <BLoading text="LOADING" full />
    </div>
    <div v-else-if="groups.length === 0">
      <BEmpty title="NO RESULTS" description="暂无文章" />
    </div>
    <div v-else class="border-2 border-black bg-white">
      <div v-for="(group, gIdx) in groups" :key="group.year" class="border-b-2 border-black last:border-b-0">
        <button
          class="w-full flex items-center justify-between bg-ink-100 px-6 py-3 font-mono text-h4 font-bold transition-all duration-fast ease-linear hover:bg-black hover:text-white"
          @click="toggleYear(gIdx)"
        >
          <span>{{ group.year }}</span>
          <span class="text-small">
            {{ group.expanded ? '▼' : '▶' }} ({{ group.months.reduce((s, m) => s + m.items.length, 0) }})
          </span>
        </button>
        <div v-show="group.expanded">
          <div v-for="m in group.months" :key="`${group.year}-${m.month}`" class="border-t-2 border-ink-200">
            <button
              class="w-full flex items-center justify-between px-6 py-2 font-mono text-small font-bold transition-all duration-fast ease-linear hover:bg-yellow"
              @click="toggleMonth(`${group.year}-${m.month}`)"
            >
              <span>{{ m.month }}月</span>
              <span class="text-tiny">{{ isMonthExpanded(`${group.year}-${m.month}`) ? '▼' : '▶' }} ({{ m.items.length }})</span>
            </button>
            <ul v-show="isMonthExpanded(`${group.year}-${m.month}`)" class="border-t-2 border-ink-200">
              <li v-for="item in m.items" :key="item.id" class="border-b-2 border-ink-200 last:border-b-0">
                <NuxtLink
                  :to="`/post/${item.slug}`"
                  class="flex items-center gap-4 px-6 py-2 transition-all duration-fast ease-linear hover:bg-black hover:text-white"
                >
                  <span class="font-mono text-tiny text-ink-500 w-16 shrink-0">{{ formatDate(item.publishedAt).slice(5) }}</span>
                  <span class="font-mono text-small flex-1 truncate">{{ item.title }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
