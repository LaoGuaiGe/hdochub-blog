<script setup lang="ts">
import type { Comment } from '~/types'
import { commentApi } from '~/utils/api'
import { formatNumber } from '~/utils/format'

interface Props {
  articleSlug: string
  comments: Comment[]
  loading?: boolean
  isLoggedIn: boolean
  currentUserId?: number
  isAdmin?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
}>()

const { success, error: errorToast } = useToast()
const { confirm } = useConfirm()

const newComment = ref('')
const submitting = ref(false)

async function submitComment() {
  if (!props.isLoggedIn) {
    await navigateTo('/login')
    return
  }
  if (!newComment.value.trim()) {
    errorToast('评论内容不能为空')
    return
  }
  submitting.value = true
  try {
    await commentApi.create(props.articleSlug, { content: newComment.value })
    newComment.value = ''
    success('评论发表成功')
    emit('refresh')
  } catch (err: any) {
    errorToast(err.message || '评论失败')
  } finally {
    submitting.value = false
  }
}

async function handleReply(targetComment: Comment) {
  submitting.value = true
  try {
    await commentApi.create(props.articleSlug, {
      content: targetComment.content,
      parentId: targetComment.id
    })
    success('回复成功')
    emit('refresh')
  } catch (err: any) {
    errorToast(err.message || '回复失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(comment: Comment) {
  const ok = await confirm({
    title: '删除评论',
    message: '确认删除该评论？删除后不可恢复。',
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await commentApi.delete(comment.id)
    success('评论已删除')
    emit('refresh')
  } catch (err: any) {
    errorToast(err.message || '删除失败')
  }
}
</script>

<template>
  <div>
    <h3 class="border-b-2 border-black bg-violet px-4 py-2 font-mono text-small font-bold uppercase text-black">
      评论 COMMENTS ({{ formatNumber(comments.length) }})
    </h3>
    <div class="p-6">

    <!-- 评论输入框 -->
    <div class="mb-6">
      <div v-if="!isLoggedIn" class="border-2 border-black bg-ink-100 p-4 text-center">
        <p class="font-mono text-small text-ink-700">登录后才能发表评论</p>
        <NuxtLink to="/login" class="btn-text mt-2 inline-block">前往登录 →</NuxtLink>
      </div>
      <div v-else>
        <BTextarea
          v-model="newComment"
          :rows="4"
          placeholder="输入评论，支持基础 Markdown（加粗、代码、链接）..."
          help="评论内容 1-500 字符"
        />
        <div class="mt-2 flex justify-end">
          <BButton :loading="submitting" @click="submitComment">发表评论</BButton>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-if="loading" class="py-8 text-center">
      <BLoading text="LOADING" />
    </div>
    <div v-else-if="comments.length === 0" class="py-8">
      <BEmpty title="NO COMMENTS" description="还没有评论，来说两句吧" />
    </div>
    <div v-else class="space-y-4">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :is-author="comment.authorId === currentUserId"
        :is-admin="isAdmin"
        @reply="handleReply"
        @delete="handleDelete"
      />
      </div>
    </div>
  </div>
</template>
