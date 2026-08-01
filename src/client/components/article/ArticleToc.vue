<script setup lang="ts">
import type { TocItem } from '~/types'

interface Props {
  items: TocItem[]
}

const props = defineProps<Props>()

const activeId = ref<string>('')

let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      })
    },
    { rootMargin: '0px 0px -80% 0px', threshold: 0 }
  )
  props.items.forEach(item => {
    const el = document.getElementById(item.id)
    if (el) observer?.observe(el)
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'auto' })
    activeId.value = id
  }
}
</script>

<template>
  <nav v-if="items.length" class="border-2 border-black bg-white p-4">
    <p class="mb-3 font-mono text-small font-bold uppercase border-b-2 border-black pb-2">目录 / TOC</p>
    <ul class="space-y-1">
      <li
        v-for="item in items"
        :key="item.id"
        :class="{
          'pl-2': item.level === 2,
          'pl-6': item.level === 3
        }"
      >
        <a
          href="javascript:void(0)"
          class="block py-1 font-mono text-tiny transition-all duration-fast ease-linear"
          :class="activeId === item.id ? 'bg-yellow text-black px-2 font-bold' : 'text-black hover:bg-black hover:text-white px-2'"
          @click="scrollTo(item.id)"
        >
          {{ item.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>
