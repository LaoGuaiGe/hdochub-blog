<script setup lang="ts">
import type { Category } from '~/types'
import { categoryApi } from '~/utils/api'
import { formatDate } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const { confirm } = useConfirm()
const { success, error: errorToast } = useToast()

const { data: categories, pending, refresh } = await useAsyncData('admin-categories', () => categoryApi.list())

const modalVisible = ref(false)
const editingCategory = ref<Category | null>(null)
const form = reactive({
  name: '',
  description: '',
  sort: 0
})
const formError = reactive({
  name: ''
})
const submitting = ref(false)

function openCreate() {
  editingCategory.value = null
  form.name = ''
  form.description = ''
  form.sort = 0
  formError.name = ''
  modalVisible.value = true
}

function openEdit(cat: Category) {
  editingCategory.value = cat
  form.name = cat.name
  form.description = cat.description || ''
  form.sort = cat.sort
  formError.name = ''
  modalVisible.value = true
}

function validate(): boolean {
  formError.name = ''
  if (!form.name.trim()) {
    formError.name = '请输入分类名称'
    return false
  }
  if (form.name.length > 20) {
    formError.name = '分类名称不超过 20 字符'
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    if (editingCategory.value) {
      await categoryApi.update(editingCategory.value.id, {
        name: form.name,
        description: form.description,
        sort: form.sort
      })
      success('分类已更新')
    } else {
      await categoryApi.create({
        name: form.name,
        description: form.description,
        sort: form.sort
      })
      success('分类已新增')
    }
    modalVisible.value = false
    refresh()
  } catch (err: any) {
    errorToast(err.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(cat: Category) {
  if (cat.articleCount && cat.articleCount > 0) {
    errorToast(`该分类下有 ${cat.articleCount} 篇文章，请先迁移文章`)
    return
  }
  const ok = await confirm({
    title: '删除分类',
    message: `确认删除分类「${cat.name}」？`,
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await categoryApi.delete(cat.id)
    success('分类已删除')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '删除失败')
  }
}

const columns = [
  { key: 'name', title: '分类名称' },
  { key: 'articleCount', title: '文章数' },
  { key: 'sort', title: '排序', hideOnMobile: true },
  { key: 'createdAt', title: '创建时间', hideOnTablet: true },
  { key: 'actions', title: '操作', align: 'right' as const }
]

useHead({ title: '分类管理 - hdochub admin' })
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">分类管理</h1>
      <button class="btn-primary" @click="openCreate">+ 新增分类</button>
    </div>

    <BTable :columns="columns" :data="categories || []" :loading="pending">
      <template #name="{ row }">
        <span class="font-mono text-small font-bold">{{ row.name }}</span>
      </template>
      <template #articleCount="{ row }">{{ row.articleCount || 0 }}</template>
      <template #sort="{ row }">{{ row.sort }}</template>
      <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <button class="btn-text !text-tiny" @click="openEdit(row)">编辑</button>
          <button class="btn-text !text-tiny !text-red" @click="handleDelete(row)">删除</button>
        </div>
      </template>
    </BTable>

    <!-- 新增/编辑弹窗 -->
    <BModal :visible="modalVisible" :title="editingCategory ? '编辑分类' : '新增分类'" :width="400" @close="modalVisible = false">
      <div class="space-y-4">
        <BInput v-model="form.name" label="分类名称" required placeholder="2-4字为佳" :error="formError.name" />
        <BTextarea v-model="form.description" label="描述" placeholder="分类描述（可选）" :rows="2" />
        <BInput v-model="form.sort" type="number" label="排序" placeholder="数字越小越靠前" />
        <div class="flex justify-end gap-2">
          <BButton type="secondary" @click="modalVisible = false">取消</BButton>
          <BButton type="primary" :loading="submitting" @click="submit">保存</BButton>
        </div>
      </div>
    </BModal>
  </div>
</template>
