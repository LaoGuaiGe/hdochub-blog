<script setup lang="ts">
import type { FriendLink, FriendLinkApplication } from '~/types'
import { friendLinkApi } from '~/utils/api'
import { formatDateTime } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const { confirm } = useConfirm()
const { success, error: errorToast } = useToast()

// ============ 友链列表 ============
const { data: links, pending, refresh: refreshLinks } = await useAsyncData('admin-friend-links', () => friendLinkApi.list())

const modalVisible = ref(false)
const editing = ref<FriendLink | null>(null)
const submitting = ref(false)

const form = reactive({
  name: '',
  url: '',
  description: '',
  logo: '',
  sort: 0
})
const errors = reactive({
  name: '',
  url: ''
})

function resetForm() {
  form.name = ''
  form.url = ''
  form.description = ''
  form.logo = ''
  form.sort = 0
  errors.name = ''
  errors.url = ''
}

function openCreate() {
  editing.value = null
  resetForm()
  modalVisible.value = true
}

function openEdit(row: FriendLink) {
  editing.value = row
  form.name = row.name
  form.url = row.url
  form.description = row.description || ''
  form.logo = row.logo || ''
  form.sort = row.sort
  errors.name = ''
  errors.url = ''
  modalVisible.value = true
}

function validate(): boolean {
  errors.name = ''
  errors.url = ''
  let ok = true
  if (!form.name.trim()) {
    errors.name = '请输入站点名称'
    ok = false
  }
  if (!form.url.trim()) {
    errors.url = '请输入网站地址'
    ok = false
  } else {
    try {
      const u = new URL(form.url)
      if (!['http:', 'https:'].includes(u.protocol)) {
        errors.url = '网址必须以 http:// 或 https:// 开头'
        ok = false
      }
    } catch {
      errors.url = '网站地址格式不正确'
      ok = false
    }
  }
  return ok
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      description: form.description.trim() || undefined,
      logo: form.logo.trim() || undefined,
      sort: Number(form.sort) || 0
    }
    if (editing.value) {
      await friendLinkApi.update(editing.value.id, payload)
      success('友链已更新')
    } else {
      await friendLinkApi.create(payload)
      success('友链已新增')
    }
    modalVisible.value = false
    refreshLinks()
  } catch (err: any) {
    errorToast(err.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: FriendLink) {
  const ok = await confirm({
    title: '删除友链',
    message: `确认删除友链「${row.name}」？`,
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await friendLinkApi.delete(row.id)
    success('友链已删除')
    refreshLinks()
  } catch (err: any) {
    errorToast(err.message || '删除失败')
  }
}

// ============ 申请列表 ============
const appStatusFilter = ref<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('')
const { data: applications, pending: appPending, refresh: refreshApps } = await useAsyncData(
  () => `admin-friend-link-applications-${appStatusFilter.value}`,
  () => friendLinkApi.applications(appStatusFilter.value || undefined),
  { watch: [appStatusFilter] }
)

const rejectModal = ref({ visible: false, id: 0, name: '', reason: '' })
const rejectSubmitting = ref(false)

function openReject(app: FriendLinkApplication) {
  rejectModal.value = { visible: true, id: app.id, name: app.name, reason: '' }
}

async function confirmReject() {
  rejectSubmitting.value = true
  try {
    await friendLinkApi.rejectApplication(rejectModal.value.id, rejectModal.value.reason.trim() || undefined)
    success('已拒绝申请')
    rejectModal.value.visible = false
    refreshApps()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  } finally {
    rejectSubmitting.value = false
  }
}

async function handleApprove(app: FriendLinkApplication) {
  const ok = await confirm({
    title: '通过申请',
    message: `确认通过「${app.name}」的友链申请？将通过后将在友链列表中显示。`,
    confirmText: '通过'
  })
  if (!ok) return
  try {
    await friendLinkApi.approveApplication(app.id)
    success('已通过申请，友链已上线')
    refreshApps()
    refreshLinks()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

async function handleDeleteApp(app: FriendLinkApplication) {
  const ok = await confirm({
    title: '删除申请',
    message: `确认删除「${app.name}」的友链申请记录？`,
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await friendLinkApi.deleteApplication(app.id)
    success('申请已删除')
    refreshApps()
  } catch (err: any) {
    errorToast(err.message || '删除失败')
  }
}

const statusTabs = [
  { label: '待审核', value: 'PENDING' as const },
  { label: '已通过', value: 'APPROVED' as const },
  { label: '已拒绝', value: 'REJECTED' as const },
  { label: '全部', value: '' as const }
]

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING: { label: '待审核', cls: 'bg-yellow' },
  APPROVED: { label: '已通过', cls: 'bg-black text-white' },
  REJECTED: { label: '已拒绝', cls: 'bg-red text-white' }
}

const linkColumns = [
  { key: 'name', title: '站点名称' },
  { key: 'url', title: '网址', hideOnMobile: true },
  { key: 'sort', title: '排序', hideOnMobile: true },
  { key: 'actions', title: '操作', align: 'right' as const }
]

useHead({ title: '友链管理 - hdochub admin' })
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">友链管理</h1>
      <button class="btn-primary" @click="openCreate">+ 新增友链</button>
    </div>

    <!-- 友链列表 -->
    <div class="mb-8">
      <p class="mb-3 font-mono text-small font-bold uppercase border-b-2 border-black pb-2">友链列表</p>
      <BTable :columns="linkColumns" :data="links || []" :loading="pending">
        <template #name="{ row }">
          <div class="flex items-center gap-2">
            <div v-if="row.logo" class="h-8 w-8 border-2 border-black overflow-hidden shrink-0">
              <img :src="row.logo" :alt="row.name" class="h-full w-full object-cover">
            </div>
            <span class="font-mono text-small font-bold">{{ row.name }}</span>
          </div>
        </template>
        <template #url="{ row }">
          <a :href="row.url" target="_blank" rel="noopener noreferrer" class="font-mono text-tiny text-black underline break-all">
            {{ row.url }}
          </a>
        </template>
        <template #sort="{ row }">{{ row.sort }}</template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <button class="btn-text !text-tiny" @click="openEdit(row)">编辑</button>
            <button class="btn-text !text-tiny !text-red" @click="handleDelete(row)">删除</button>
          </div>
        </template>
      </BTable>
    </div>

    <!-- 申请列表 -->
    <div>
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
        <p class="font-mono text-small font-bold uppercase">友链申请</p>
        <div class="flex gap-1">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            type="button"
            class="border-2 border-black px-2 py-1 font-mono text-tiny font-bold transition-all duration-fast ease-linear"
            :class="appStatusFilter === tab.value ? 'bg-black text-white' : 'bg-white text-black hover:bg-yellow'"
            @click="appStatusFilter = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div v-if="appPending" class="border-2 border-black bg-white p-6">
        <BLoading text="LOADING" full />
      </div>
      <div v-else-if="!applications || applications.length === 0" class="border-2 border-black bg-white p-6 text-center">
        <p class="font-mono text-tiny text-ink-500">NO APPLICATIONS</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="app in applications"
          :key="app.id"
          class="border-2 border-black bg-white p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="font-mono text-small font-bold">{{ app.name }}</span>
                <span class="border-2 border-black px-2 py-0.5 font-mono text-tiny font-bold" :class="statusMap[app.status]?.cls">
                  {{ statusMap[app.status]?.label || app.status }}
                </span>
                <span v-if="app.contactName" class="font-mono text-tiny text-ink-500">联系人：{{ app.contactName }}</span>
              </div>
              <a :href="app.url" target="_blank" rel="noopener noreferrer" class="font-mono text-tiny text-black underline break-all">
                {{ app.url }}
              </a>
              <p v-if="app.description" class="mt-1 font-sans text-small text-ink-700">{{ app.description }}</p>
              <p v-if="app.rejectReason" class="mt-1 font-mono text-tiny text-red">拒绝理由：{{ app.rejectReason }}</p>
            </div>
            <div class="flex flex-wrap gap-2 shrink-0">
              <template v-if="app.status === 'PENDING'">
                <button class="btn-primary !py-1 !px-3 !text-tiny" @click="handleApprove(app)">通过</button>
                <button class="btn-secondary !py-1 !px-3 !text-tiny" @click="openReject(app)">拒绝</button>
              </template>
              <a :href="app.url" target="_blank" rel="noopener noreferrer" class="btn-secondary !py-1 !px-3 !text-tiny">访问</a>
              <button class="btn-text !text-tiny !text-red" @click="handleDeleteApp(app)">删除</button>
            </div>
          </div>
          <p class="font-mono text-tiny text-ink-500 border-t-2 border-ink-200 pt-2">
            提交于 {{ formatDateTime(app.createdAt) }}
            <span v-if="app.reviewedAt"> · 处理于 {{ formatDateTime(app.reviewedAt) }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 新增/编辑友链弹窗 -->
    <BModal :visible="modalVisible" :title="editing ? '编辑友链' : '新增友链'" :width="480" @close="modalVisible = false">
      <div class="space-y-4">
        <BInput v-model="form.name" label="站点名称" required placeholder="例如：我的小博客" :error="errors.name" />
        <BInput v-model="form.url" label="网站地址" required placeholder="https://example.com" :error="errors.url" />
        <BTextarea v-model="form.description" label="站点描述" placeholder="一句话介绍（可选）" :rows="2" />
        <BInput v-model="form.logo" label="Logo URL" placeholder="图片地址（可选）" />
        <BInput v-model="form.sort" type="number" label="排序" placeholder="数字越小越靠前" />
        <div class="flex justify-end gap-2 pt-2">
          <BButton type="secondary" @click="modalVisible = false">取消</BButton>
          <BButton type="primary" :loading="submitting" @click="submit">保存</BButton>
        </div>
      </div>
    </BModal>

    <!-- 拒绝申请弹窗 -->
    <BModal :visible="rejectModal.visible" title="拒绝申请" :width="420" @close="rejectModal.visible = false">
      <div class="space-y-4">
        <p class="font-mono text-small">确认拒绝「<span class="font-bold">{{ rejectModal.name }}</span>」的申请？</p>
        <BTextarea v-model="rejectModal.reason" label="拒绝理由（可选）" placeholder="告诉对方为什么拒绝" :rows="3" />
        <div class="flex justify-end gap-2">
          <BButton type="secondary" @click="rejectModal.visible = false">取消</BButton>
          <BButton type="danger" :loading="rejectSubmitting" @click="confirmReject">确认拒绝</BButton>
        </div>
      </div>
    </BModal>
  </div>
</template>
