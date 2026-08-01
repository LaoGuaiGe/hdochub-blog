<script setup lang="ts">
import type { ArticlePayload, Article, Category, Tag } from '~/types'
import { articleApi, categoryApi, tagApi, uploadApi } from '~/utils/api'
import { countWords } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { success, error: errorToast } = useToast()

const editSlug = computed(() => (route.query.slug as string) || null)
const isEdit = computed(() => !!editSlug.value)

const form = reactive<ArticlePayload>({
  title: '',
  content: '',
  categoryId: 0,
  tags: [],
  coverImage: null,
  excerpt: '',
  status: 'DRAFT'
})

const errors = reactive({
  title: '',
  content: '',
  categoryId: ''
})

const { data: categories } = await useAsyncData('editor-categories', () => categoryApi.list())
const { data: tags } = await useAsyncData('editor-tags', () => tagApi.list())

const tagInput = ref('')
const showMeta = ref(true)
const submitting = ref(false)
const coverUrlInput = ref('')

const wordCount = computed(() => countWords(form.content))

const categoryOptions = computed(() => {
  return (categories.value || []).map(c => ({ label: c.name, value: c.id }))
})

// 编辑模式：加载文章（使用 slug 而非 ID，与后端 GET /articles/:slug 一致）
const editArticle = ref<Article | null>(null)
if (isEdit.value) {
  const { data: article, error } = await useAsyncData(
    () => `edit-article-${editSlug.value}`,
    () => articleApi.detail(editSlug.value!)
  )
  if (error.value || !article.value) {
    throw createError({ statusCode: 404, statusMessage: '文章不存在', fatal: true })
  }
  editArticle.value = article.value
  watch(article, (val) => {
    if (val) {
      editArticle.value = val
      form.title = val.title
      form.content = val.content
      form.categoryId = val.categoryId
      form.tags = val.tags.map(t => t.name)
      form.coverImage = val.coverImage
      form.excerpt = val.excerpt
      form.status = val.status === 'DELETED' ? 'DRAFT' : val.status
      if (val.coverImage) coverUrlInput.value = val.coverImage
    }
  }, { immediate: true })
}

function addTag(name: string) {
  name = name.trim()
  if (!name) return
  if (form.tags.includes(name)) {
    tagInput.value = ''
    return
  }
  if (form.tags.length >= 10) {
    errorToast('每篇文章最多 10 个标签')
    return
  }
  form.tags.push(name)
  tagInput.value = ''
}

function removeTag(idx: number) {
  form.tags.splice(idx, 1)
}

function onTagInputEnter() {
  addTag(tagInput.value)
}

function selectExistingTag(tag: Tag) {
  addTag(tag.name)
}

function applyCoverUrl() {
  form.coverImage = coverUrlInput.value || null
}

async function handleUploadCover(file: File) {
  try {
    const res = await uploadApi.image(file)
    form.coverImage = res.url
    coverUrlInput.value = res.url
    success('封面上传成功')
  } catch (err: any) {
    errorToast(err.message || '上传失败')
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleUploadCover(target.files[0])
  }
}

function validate(): boolean {
  errors.title = ''
  errors.content = ''
  errors.categoryId = ''
  let valid = true
  if (!form.title.trim()) {
    errors.title = '请输入标题'
    valid = false
  } else if (form.title.length > 100) {
    errors.title = '标题不能超过 100 字符'
    valid = false
  }
  if (!form.content.trim() || form.content.trim().length < 10) {
    errors.content = '正文至少 10 字符'
    valid = false
  }
  if (!form.categoryId) {
    errors.categoryId = '请选择分类'
    valid = false
  }
  return valid
}

async function submit(status: 'DRAFT' | 'PUBLISHED') {
  form.status = status
  if (status === 'PUBLISHED' && !validate()) {
    errorToast('请补全必填项')
    return
  }
  if (status === 'DRAFT' && !form.title.trim()) {
    errorToast('请至少输入标题')
    return
  }
  submitting.value = true
  try {
    const payload = { ...form }
    if (isEdit.value && editArticle.value) {
      await articleApi.update(editArticle.value.id, payload)
      success(status === 'PUBLISHED' ? '文章已更新' : '草稿已保存')
    } else {
      const created = await articleApi.create(payload)
      success(status === 'PUBLISHED' ? '文章已发布' : '草稿已保存')
      router.replace(`/dashboard/editor?slug=${created.slug}`)
    }
  } catch (err: any) {
    errorToast(err.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

function preview() {
  if (!form.title.trim()) {
    errorToast('请先输入标题')
    return
  }
  sessionStorage.setItem('preview-article', JSON.stringify(form))
  window.open('/dashboard/preview', '_blank')
}

useHead({ title: isEdit.value ? '编辑文章 - hdochub' : '写文章 - hdochub' })
</script>

<template>
  <div>
    <!-- 顶部操作栏 -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2 border-2 border-black bg-white p-3">
      <div class="flex items-center gap-2">
        <NuxtLink to="/dashboard/posts" class="btn-secondary !py-1 !px-3 !text-tiny">← 返回列表</NuxtLink>
        <span class="font-mono text-small font-bold uppercase">{{ isEdit ? '编辑文章' : '写文章' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-secondary !py-1 !px-3 !text-tiny" @click="preview">预览</button>
        <button class="btn-secondary !py-1 !px-3 !text-tiny" :disabled="submitting" @click="submit('DRAFT')">保存草稿</button>
        <button class="btn-primary !py-1 !px-3 !text-tiny" :disabled="submitting" @click="submit('PUBLISHED')">
          {{ submitting ? 'SUBMITTING' : '发布' }}
        </button>
      </div>
    </div>

    <!-- 标题输入 -->
    <div class="mb-4">
      <input
        v-model="form.title"
        type="text"
        placeholder="输入文章标题..."
        class="w-full border-0 border-b-2 border-black bg-white px-2 py-3 font-mono text-h2 font-bold placeholder:text-ink-300 focus:outline-none focus:border-b-4"
        :class="{ '!border-red': errors.title }"
        maxlength="100"
      >
      <p v-if="errors.title" class="form-error">{{ errors.title }}</p>
    </div>

    <!-- Markdown 编辑器 -->
    <div class="mb-4">
      <MarkdownEditor v-model="form.content" :height="450" />
      <p v-if="errors.content" class="form-error">{{ errors.content }}</p>
      <p class="mt-1 font-mono text-tiny text-ink-500">{{ wordCount }} 字</p>
    </div>

    <!-- 元信息区 -->
    <div class="border-2 border-black bg-white">
      <button
        class="w-full flex items-center justify-between border-b-2 border-black bg-ink-100 px-4 py-2 font-mono text-small font-bold uppercase transition-all duration-fast ease-linear hover:bg-black hover:text-white"
        @click="showMeta = !showMeta"
      >
        <span>元信息 META</span>
        <span>{{ showMeta ? '▼' : '▶' }}</span>
      </button>
      <div v-show="showMeta" class="p-4 space-y-4">
        <!-- 分类 -->
        <BSelect
          v-model="form.categoryId"
          :options="categoryOptions"
          label="分类"
          required
          placeholder="选择分类"
          :error="errors.categoryId"
        />

        <!-- 标签 -->
        <div>
          <label class="label">标签</label>
          <div class="flex flex-wrap items-center gap-2 border-2 border-black p-2">
            <span
              v-for="(t, idx) in form.tags"
              :key="idx"
              class="tag-solid"
            >
              {{ t }}
              <button type="button" class="ml-1 hover:text-red" @click="removeTag(idx)">×</button>
            </span>
            <input
              v-model="tagInput"
              type="text"
              placeholder="输入标签后回车"
              class="flex-1 min-w-[120px] border-0 px-2 py-1 font-mono text-small focus:outline-none"
              @keyup.enter="onTagInputEnter"
            >
          </div>
          <div v-if="tags && tags.length" class="mt-2 flex flex-wrap gap-1">
            <span class="font-mono text-tiny text-ink-500">已有标签:</span>
            <button
              v-for="t in tags.slice(0, 15)"
              :key="t.id"
              type="button"
              class="tag"
              @click="selectExistingTag(t)"
            >
              {{ t.name }}
            </button>
          </div>
          <p class="form-help">每篇最多 10 个标签，每个标签 2-20 字符</p>
        </div>

        <!-- 封面图 -->
        <div>
          <label class="label">封面图</label>
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="coverUrlInput"
              type="text"
              placeholder="填写图片外链 URL"
              class="input flex-1 min-w-[200px]"
            >
            <button type="button" class="btn-secondary !py-2" @click="applyCoverUrl">应用</button>
            <label class="btn-secondary !py-2 cursor-pointer">
              上传图片
              <input type="file" accept="image/*" class="hidden" @change="onFileChange">
            </label>
          </div>
          <div v-if="form.coverImage" class="mt-2 border-2 border-black">
            <img :src="form.coverImage" alt="封面" class="w-full max-h-48 object-cover">
          </div>
        </div>

        <!-- 摘要 -->
        <BTextarea
          v-model="form.excerpt"
          label="摘要"
          placeholder="可选，留空自动取正文前 200 字"
          :rows="3"
        />
      </div>
    </div>
  </div>
</template>
