<script setup lang="ts">
import { settingsApi } from '~/utils/api'

definePageMeta({ layout: 'admin', middleware: ['auth', 'super-admin'] })

const { success, error: errorToast } = useToast()
const siteStore = useSiteStore()

const form = reactive({
  title: '',
  subtitle: '',
  description: '',
  icp: '',
  commentReview: false,
  allowRegister: true,
  pageSize: 10,
  adminPath: '/admin'
})

const loading = ref(true)
const submitting = ref(false)

const { data, error } = await useAsyncData('admin-settings', () => settingsApi.get())

watch(data, (val) => {
  if (val) {
    form.title = val.title
    form.subtitle = val.subtitle
    form.description = val.description
    form.icp = val.icp
    form.commentReview = val.commentReview
    form.allowRegister = val.allowRegister
    form.pageSize = val.pageSize
    form.adminPath = val.adminPath
  }
  loading.value = false
}, { immediate: true })

if (error.value) {
  loading.value = false
}

async function save() {
  if (!form.title.trim()) {
    errorToast('请输入站点标题')
    return
  }
  submitting.value = true
  try {
    const result = await settingsApi.update({ ...form })
    siteStore.update(result)
    success('设置已保存')
  } catch (err: any) {
    errorToast(err.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

useHead({ title: '站点设置 - hdochub admin' })
</script>

<template>
  <div>
    <div class="mb-6 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">站点设置</h1>
    </div>

    <div v-if="loading" class="border-2 border-black p-6">
      <BLoading text="LOADING" full />
    </div>
    <div v-else class="max-w-2xl space-y-6">
      <!-- 基本信息 -->
      <div class="border-2 border-black bg-white">
        <div class="border-b-2 border-black bg-black px-4 py-2">
          <p class="font-mono text-small font-bold uppercase text-white">基本信息</p>
        </div>
        <div class="p-4 space-y-4">
          <BInput v-model="form.title" label="站点标题" required placeholder="全站标题" />
          <BInput v-model="form.subtitle" label="站点副标题" placeholder="副标题/描述" />
          <BTextarea v-model="form.description" label="站点描述 (SEO)" placeholder="SEO meta description" :rows="3" />
          <BInput v-model="form.icp" label="备案号" placeholder="如：京ICP备XXXXXX号" />
        </div>
      </div>

      <!-- 功能开关 -->
      <div class="border-2 border-black bg-white">
        <div class="border-b-2 border-black bg-black px-4 py-2">
          <p class="font-mono text-small font-bold uppercase text-white">功能开关</p>
        </div>
        <div class="divide-y-2 divide-ink-200">
          <div class="flex items-center justify-between p-4">
            <div>
              <p class="font-mono text-small font-bold">评论需审核</p>
              <p class="font-mono text-tiny text-ink-500">开启后评论需管理员审核才公开</p>
            </div>
            <BSwitch v-model="form.commentReview" />
          </div>
          <div class="flex items-center justify-between p-4">
            <div>
              <p class="font-mono text-small font-bold">允许新用户注册</p>
              <p class="font-mono text-tiny text-ink-500">关闭后不允许新用户注册</p>
            </div>
            <BSwitch v-model="form.allowRegister" />
          </div>
        </div>
      </div>

      <!-- 内容设置 -->
      <div class="border-2 border-black bg-white">
        <div class="border-b-2 border-black bg-black px-4 py-2">
          <p class="font-mono text-small font-bold uppercase text-white">内容设置</p>
        </div>
        <div class="p-4 space-y-4">
          <BInput v-model="form.pageSize" type="number" label="每页文章数" required placeholder="默认 10" />
          <BInput v-model="form.adminPath" label="后台路径 (自定义)" placeholder="/admin" help="自定义管理员后台访问路径" />
        </div>
      </div>

      <div class="flex justify-end">
        <BButton type="primary" :loading="submitting" @click="save">保存设置</BButton>
      </div>
    </div>
  </div>
</template>
