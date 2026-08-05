<script setup lang="ts">
const siteStore = useSiteStore()
const config = useRuntimeConfig()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-black text-white">
    <div class="container-list py-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p class="font-mono text-h5 font-bold uppercase">{{ siteStore.title || 'hdochub' }}</p>
          <p class="mt-1 font-mono text-small text-ink-300">{{ siteStore.subtitle }}</p>
        </div>
        <nav class="flex flex-wrap gap-4">
          <NuxtLink to="/resources" class="font-mono text-small hover:text-yellow transition-all duration-fast ease-linear">资源</NuxtLink>
          <NuxtLink to="/about" class="font-mono text-small hover:text-yellow transition-all duration-fast ease-linear">关于</NuxtLink>
          <NuxtLink to="/links" class="font-mono text-small hover:text-yellow transition-all duration-fast ease-linear">友链</NuxtLink>
          <a :href="`${config.public.siteUrl}/rss.xml`" class="font-mono text-small hover:text-yellow transition-all duration-fast ease-linear">[RSS]</a>
        </nav>
      </div>
      <div class="mt-6 border-t-2 border-white pt-4">
        <p class="font-mono text-tiny text-ink-300">
          © {{ year }} {{ siteStore.title || 'hdochub' }} · {{ siteStore.icp || '' }}
        </p>
        <p class="mt-1 font-mono text-tiny text-ink-300">
          Powered by hdochub · {{ config.public.siteUrl.replace(/^https?:\/\//, '') }}
        </p>
      </div>
    </div>
  </footer>
</template>
