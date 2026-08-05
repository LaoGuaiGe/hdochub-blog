<script setup lang="ts">
import type { ResourceDetail } from '~/types'
import { resourceApi, uploadApi } from '~/utils/api'
import { formatDate, formatNumber } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const { confirm } = useConfirm()
const { success, error: errorToast } = useToast()

const { data: list, pending, refresh } = await useAsyncData('admin-resources', () => resourceApi.adminList())

const modalVisible = ref(false)
const editing = ref<ResourceDetail | null>(null)
const submitting = ref(false)
const uploading = ref(false)

const form = reactive({
  title: '',
  description: '',
  coverImage: '',
  downloadUrl: '',
  extractionCode: '',
  panType: 'baidu',
  content: '',
  sort: 0,
  status: 'PUBLISHED'
})
const errors = reactive({
  title: '',
  downloadUrl: ''
})

const statusOptions = [
  { label: '已发布', value: 'PUBLISHED' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已下架', value: 'OFFLINE' }
]

function resetForm() {
  form.title = ''
  form.description = ''
  form.coverImage = ''
  form.downloadUrl = ''
  form.extractionCode = ''
  form.panType = 'baidu'
  form.content = ''
  form.sort = 0
  form.status = 'PUBLISHED'
  errors.title = ''
  errors.downloadUrl = ''
}

function openCreate() {
  editing.value = null
  resetForm()
  modalVisible.value = true
}

function openEdit(row: ResourceDetail) {
  editing.value = row
  form.title = row.title
  form.description = row.description || ''
  form.coverImage = row.coverImage || ''
  form.downloadUrl = row.downloadUrl
  form.extractionCode = row.extractionCode || ''
  form.panType = row.panType || 'baidu'
  form.content = row.content || ''
  form.sort = row.sort
  form.status = row.status
  errors.title = ''
  errors.downloadUrl = ''
  modalVisible.value = true
}

function validate(): boolean {
  errors.title = ''
  errors.downloadUrl = ''
  let ok = true
  if (!form.title.trim()) {
    errors.title = '请输入标题'
    ok = false
  } else if (form.title.length > 100) {
    errors.title = '标题最多 100 字符'
    ok = false
  }
  if (!form.downloadUrl.trim()) {
    errors.downloadUrl = '请输入百度网盘下载地址'
    ok = false
  }
  return ok
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      coverImage: form.coverImage.trim() || undefined,
      downloadUrl: form.downloadUrl.trim(),
      extractionCode: form.extractionCode.trim() || undefined,
      panType: form.panType,
      content: form.content || undefined,
      sort: Number(form.sort) || 0,
      status: form.status
    }
    if (editing.value) {
      await resourceApi.update(editing.value.id, payload)
      success('资源已更新')
    } else {
      await resourceApi.create(payload)
      success('资源已新增')
    }
    modalVisible.value = false
    refresh()
  } catch (err: any) {
    errorToast(err.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: ResourceDetail) {
  const ok = await confirm({
    title: '删除资源',
    message: `确认删除资源「${row.title}」？此操作不可恢复。`,
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await resourceApi.delete(row.id)
    success('资源已删除')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '删除失败')
  }
}

async function onCoverChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || !target.files[0]) return
  uploading.value = true
  try {
    const res = await uploadApi.image(target.files[0], 'COVER')
    form.coverImage = res.url
    success('封面已上传')
  } catch (err: any) {
    errorToast(err.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

const statusMap: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: '已发布', cls: 'bg-yellow' },
  DRAFT: { label: '草稿', cls: 'bg-ink-200' },
  OFFLINE: { label: '已下架', cls: 'bg-red text-white' }
}

const columns = [
  { key: 'title', title: '标题' },
  { key: 'downloadCount', title: '下载次数', hideOnMobile: true },
  { key: 'sort', title: '排序', hideOnMobile: true },
  { key: 'status', title: '状态' },
  { key: 'createdAt', title: '创建时间', hideOnTablet: true },
  { key: 'actions', title: '操作', align: 'right' as const }
]

useHead({ title: '资源管理 - hdochub admin' })
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">资源管理</h1>
      <button class="btn-primary" @click="openCreate">+ 新增资源</button>
    </div>

    <BTable :columns="columns" :data="list || []" :loading="pending">
      <template #title="{ row }">
        <div class="flex items-center gap-2">
          <div v-if="row.coverImage" class="h-8 w-12 border-2 border-black overflow-hidden shrink-0">
            <img :src="row.coverImage" :alt="row.title" class="h-full w-full object-cover">
          </div>
          <span class="font-mono text-small font-bold">{{ row.title }}</span>
        </div>
      </template>
      <template #downloadCount="{ row }">{{ formatNumber(row.downloadCount) }}</template>
      <template #sort="{ row }">{{ row.sort }}</template>
      <template #status="{ row }">
        <span class="border-2 border-black px-2 py-0.5 font-mono text-tiny font-bold" :class="statusMap[row.status]?.cls">
          {{ statusMap[row.status]?.label || row.status }}
        </span>
      </template>
      <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <button class="btn-text !text-tiny" @click="openEdit(row)">编辑</button>
          <NuxtLink :to="`/resources/${row.id}`" target="_blank" class="btn-text !text-tiny">查看</NuxtLink>
          <button class="btn-text !text-tiny !text-red" @click="handleDelete(row)">删除</button>
        </div>
      </template>
    </BTable>

    <!-- 新增/编辑弹窗 -->
    <BModal :visible="modalVisible" :title="editing ? '编辑资源' : '新增资源'" :width="640" @close="modalVisible = false">
      <div class="space-y-4">
        <BInput v-model="form.title" label="标题" required placeholder="资源标题" :error="errors.title" />

        <BTextarea v-model="form.description" label="简介" placeholder="一句话介绍（可选）" :rows="2" />

        <!-- 封面 -->
        <div>
          <label class="label">封面图片</label>
          <div class="flex gap-2">
            <input v-model="form.coverImage" type="text" placeholder="图片 URL（可选）" class="input flex-1">
            <label class="btn-secondary cursor-pointer">
              <span v-if="uploading" class="loading-dots">UPLOADING</span>
              <span v-else>上传</span>
              <input type="file" accept="image/*" class="hidden" @change="onCoverChange">
            </label>
          </div>
          <div v-if="form.coverImage" class="mt-2 border-2 border-black overflow-hidden" style="max-width: 240px;">
            <img :src="form.coverImage" alt="封面" class="w-full max-h-32 object-cover">
          </div>
        </div>

        <BInput v-model="form.downloadUrl" label="百度网盘下载地址" required placeholder="https://pan.baidu.com/..." :error="errors.downloadUrl" />

        <div class="grid grid-cols-2 gap-3">
          <BInput v-model="form.extractionCode" label="提取码" placeholder="如 abcd（可选）" />
          <BInput v-model="form.sort" type="number" label="排序" placeholder="数字越小越靠前" />
        </div>

        <div>
          <label class="label">状态</label>
          <div class="flex gap-2">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              type="button"
              class="border-2 border-black px-3 py-2 font-mono text-tiny font-bold transition-all duration-fast ease-linear"
              :class="form.status === opt.value ? 'bg-black text-white' : 'bg-white text-black hover:bg-yellow'"
              @click="form.status = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <BTextarea v-model="form.content" label="详细介绍（Markdown）" placeholder="可使用 Markdown 语法编写详细介绍（可选）" :rows="6" />

        <div class="flex justify-end gap-2 pt-2">
          <BButton type="secondary" @click="modalVisible = false">取消</BButton>
          <BButton type="primary" :loading="submitting" @click="submit">保存</BButton>
        </div>
      </div>
    </BModal>
  </div>
</template>
