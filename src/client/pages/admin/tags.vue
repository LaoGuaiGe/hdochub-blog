<script setup lang="ts">
import type { Tag } from '~/types'
import { tagApi } from '~/utils/api'
import { formatDate } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const { confirm } = useConfirm()
const { success, error: errorToast } = useToast()

const { data: tags, pending, refresh } = await useAsyncData('admin-tags', () => tagApi.list())

const searchKeyword = ref('')

const filteredTags = computed(() => {
  if (!tags.value) return []
  if (!searchKeyword.value) return tags.value
  return tags.value.filter(t => t.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

const editModalVisible = ref(false)
const editingTag = ref<Tag | null>(null)
const editName = ref('')
const editError = ref('')

const mergeModalVisible = ref(false)
const mergeSource = ref<Tag | null>(null)
const mergeTargetId = ref<number>(0)

function openEdit(tag: Tag) {
  editingTag.value = tag
  editName.value = tag.name
  editError.value = ''
  editModalVisible.value = true
}

async function submitEdit() {
  if (!editName.value.trim()) {
    editError.value = '请输入标签名'
    return
  }
  try {
    await tagApi.update(editingTag.value!.id, editName.value.trim())
    success('标签已更新')
    editModalVisible.value = false
    refresh()
  } catch (err: any) {
    errorToast(err.message || '更新失败')
  }
}

function openMerge(tag: Tag) {
  mergeSource.value = tag
  mergeTargetId.value = 0
  mergeModalVisible.value = true
}

async function submitMerge() {
  if (!mergeTargetId.value) {
    errorToast('请选择目标标签')
    return
  }
  if (mergeTargetId.value === mergeSource.value!.id) {
    errorToast('不能合并到自身')
    return
  }
  const ok = await confirm({
    title: '合并标签',
    message: `确认将标签「${mergeSource.value!.name}」合并到选中标签？合并后原标签将被删除。`,
    confirmText: '确认合并',
    danger: true
  })
  if (!ok) return
  try {
    await tagApi.merge(mergeSource.value!.id, mergeTargetId.value)
    success('标签已合并')
    mergeModalVisible.value = false
    refresh()
  } catch (err: any) {
    errorToast(err.message || '合并失败')
  }
}

async function handleDelete(tag: Tag) {
  const ok = await confirm({
    title: '删除标签',
    message: `确认删除标签「${tag.name}」？删除后将从关联文章移除该标签。`,
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await tagApi.delete(tag.id)
    success('标签已删除')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '删除失败')
  }
}

const mergeTargetOptions = computed(() => {
  if (!tags.value || !mergeSource.value) return []
  return tags.value
    .filter(t => t.id !== mergeSource.value!.id)
    .map(t => ({ label: `${t.name} (${t.articleCount})`, value: t.id }))
})

const columns = [
  { key: 'name', title: '标签名称' },
  { key: 'articleCount', title: '关联文章数' },
  { key: 'createdAt', title: '创建时间', hideOnTablet: true },
  { key: 'actions', title: '操作', align: 'right' as const }
]

useHead({ title: '标签管理 - hdochub admin' })
</script>

<template>
  <div>
    <div class="mb-6 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">标签管理</h1>
    </div>

    <div class="mb-4 max-w-xs">
      <BSearchBar v-model="searchKeyword" size="small" placeholder="搜索标签名..." />
    </div>

    <BTable :columns="columns" :data="filteredTags" :loading="pending">
      <template #name="{ row }">
        <span class="font-mono text-small font-bold">{{ row.name }}</span>
      </template>
      <template #articleCount="{ row }">{{ row.articleCount || 0 }}</template>
      <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <button class="btn-text !text-tiny" @click="openEdit(row)">编辑</button>
          <button class="btn-text !text-tiny" @click="openMerge(row)">合并</button>
          <button class="btn-text !text-tiny !text-red" @click="handleDelete(row)">删除</button>
        </div>
      </template>
    </BTable>

    <!-- 编辑弹窗 -->
    <BModal :visible="editModalVisible" title="编辑标签" :width="400" @close="editModalVisible = false">
      <div class="space-y-4">
        <BInput v-model="editName" label="标签名称" required :error="editError" />
        <div class="flex justify-end gap-2">
          <BButton type="secondary" @click="editModalVisible = false">取消</BButton>
          <BButton type="primary" @click="submitEdit">保存</BButton>
        </div>
      </div>
    </BModal>

    <!-- 合并弹窗 -->
    <BModal :visible="mergeModalVisible" title="合并标签" :width="400" @close="mergeModalVisible = false">
      <div v-if="mergeSource" class="space-y-4">
        <p class="font-mono text-body-ui">
          将标签「<span class="bg-yellow px-1">{{ mergeSource.name }}</span>」合并到：
        </p>
        <BSelect
          v-model="mergeTargetId"
          :options="mergeTargetOptions"
          label="目标标签"
          placeholder="选择目标标签"
        />
        <BAlert type="warning" message="合并后原标签将被删除，其关联文章转移至目标标签。" />
        <div class="flex justify-end gap-2">
          <BButton type="secondary" @click="mergeModalVisible = false">取消</BButton>
          <BButton type="danger" @click="submitMerge">确认合并</BButton>
        </div>
      </div>
    </BModal>
  </div>
</template>
