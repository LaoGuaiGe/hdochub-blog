<script setup lang="ts">
import { friendLinkApi } from '~/utils/api'
import { getInitial } from '~/utils/format'

const { success, error: errorToast } = useToast()

const { data: links, pending } = await useAsyncData('friend-links', () => friendLinkApi.list())

// 交个朋友 - 申请表单
const showModal = ref(false)
const submitting = ref(false)
const form = reactive({
  name: '',
  url: '',
  description: '',
  contactName: ''
})
const errors = reactive({
  name: '',
  url: '',
  description: '',
  contactName: ''
})

function openModal() {
  showModal.value = true
}

function closeModal() {
  if (submitting.value) return
  showModal.value = false
  resetForm()
}

function resetForm() {
  form.name = ''
  form.url = ''
  form.description = ''
  form.contactName = ''
  errors.name = ''
  errors.url = ''
  errors.description = ''
  errors.contactName = ''
}

function validateName(): boolean {
  if (!form.name.trim()) {
    errors.name = '请填写站点名称'
  } else if (form.name.length > 50) {
    errors.name = '站点名称最多 50 字符'
  } else {
    errors.name = ''
  }
  return !errors.name
}

function validateUrl(): boolean {
  if (!form.url.trim()) {
    errors.url = '请填写网站地址'
  } else {
    try {
      const u = new URL(form.url)
      if (!['http:', 'https:'].includes(u.protocol)) {
        errors.url = '网址必须以 http:// 或 https:// 开头'
      } else {
        errors.url = ''
      }
    } catch {
      errors.url = '网站地址格式不正确'
    }
  }
  return !errors.url
}

function validateDescription(): boolean {
  if (form.description && form.description.length > 500) {
    errors.description = '网站描述最多 500 字符'
    return false
  }
  errors.description = ''
  return true
}

function validateContactName(): boolean {
  if (form.contactName && form.contactName.length > 50) {
    errors.contactName = '个人名称最多 50 字符'
    return false
  }
  errors.contactName = ''
  return true
}

function validate(): boolean {
  const v1 = validateName()
  const v2 = validateUrl()
  const v3 = validateDescription()
  const v4 = validateContactName()
  return v1 && v2 && v3 && v4
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await friendLinkApi.apply({
      name: form.name.trim(),
      url: form.url.trim(),
      description: form.description.trim() || undefined,
      contactName: form.contactName.trim() || undefined
    })
    success('申请已提交，等待站长审核！')
    closeModal()
  } catch (err: any) {
    errorToast(err.message || '提交失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

useHead({ title: '友链 - hdochub' })
</script>

<template>
  <div class="container-list py-6">
    <!-- 标题区 + 交个朋友按钮 -->
    <div class="border-2 border-black bg-white mb-6">
      <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <h1 class="font-mono text-h2 font-bold uppercase">FRIENDS / 友情链接</h1>
          <p class="mt-1 font-mono text-tiny text-ink-500">互相串门，一起成长</p>
        </div>
        <button
          type="button"
          class="btn-primary"
          @click="openModal"
        >
          <span class="font-mono font-bold uppercase">+ 交个朋友</span>
        </button>
      </div>
    </div>

    <div v-if="pending" class="border-2 border-black bg-white p-6">
      <BLoading text="LOADING" full />
    </div>
    <div v-else-if="!links || links.length === 0">
      <BEmpty title="NO LINKS" description="暂无友链，快来当第一个！" />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <a
        v-for="link in links"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="card card-hover p-4 flex flex-col"
      >
        <div class="flex items-center gap-3 mb-3 border-b-2 border-black pb-3">
          <div v-if="link.logo" class="h-10 w-10 border-2 border-black overflow-hidden">
            <img :src="link.logo" :alt="link.name" class="h-full w-full object-cover">
          </div>
          <div v-else class="avatar" style="width: 40px; height: 40px;">
            {{ getInitial(link.name) }}
          </div>
          <h3 class="font-mono text-h5 font-bold">{{ link.name }}</h3>
        </div>
        <p class="font-sans text-small text-ink-700 flex-1 mb-3">{{ link.description || '暂无简介' }}</p>
        <span class="font-mono text-small font-bold uppercase border-t-2 border-black pt-2">
          访问 →
        </span>
      </a>
    </div>

    <!-- 交个朋友 申请弹窗 -->
    <BModal :visible="showModal" title="交个朋友 / APPLY" :width="480" @close="closeModal">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <div class="border-2 border-black bg-yellow px-3 py-2">
          <p class="font-mono text-tiny font-bold">想加入友链？填写以下信息，站长会尽快审核。</p>
        </div>

        <BInput
          v-model="form.name"
          label="站点名称"
          required
          placeholder="例如：我的小博客"
          :error="errors.name"
          @blur="validateName"
        />

        <BInput
          v-model="form.url"
          label="网站地址"
          required
          placeholder="https://example.com"
          :error="errors.url"
          @blur="validateUrl"
        />

        <div>
          <label class="label">网站描述</label>
          <textarea
            v-model="form.description"
            rows="3"
            maxlength="500"
            placeholder="一句话介绍你的网站（选填）"
            class="input"
            :class="{ 'input-error': errors.description }"
            @blur="validateDescription"
          />
          <p v-if="errors.description" class="form-error">{{ errors.description }}</p>
          <p v-else class="form-help">{{ form.description.length }}/500</p>
        </div>

        <BInput
          v-model="form.contactName"
          label="个人名称"
          placeholder="你怎么称呼？（选填）"
          :error="errors.contactName"
          @blur="validateContactName"
        />

        <div class="flex gap-3 pt-2">
          <BButton type="secondary" block @click="closeModal">取消</BButton>
          <BButton type="primary" html-type="submit" block :loading="submitting">提交申请</BButton>
        </div>
      </form>
    </BModal>
  </div>
</template>
