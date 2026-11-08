<script setup lang="ts">
import type { Comment } from '~/types'
import { timeAgo } from '~/utils/format'
import { renderMarkdownHtml } from '~/utils/markdown'

interface Props {
  comment: Comment
  isAuthor?: boolean
  currentUserId?: number
  isAdmin?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  reply: [comment: Comment]
  delete: [comment: Comment]
}>()

const replies = computed(() => props.comment.replies || props.comment.children || [])
const authorName = computed(() => props.comment.user?.nickname || props.comment.user?.username || props.comment.authorName)
const replyToName = computed(() => props.comment.replyToUser?.nickname || props.comment.replyToUser?.username || props.comment.replyTo?.name)
const ownsComment = computed(() => props.currentUserId != null ? (props.comment.user?.id ?? props.comment.authorId) === props.currentUserId : !!props.isAuthor)
const replyMode = ref(false)
const replyContent = ref('')

function startReply() {
  replyMode.value = true
}

function cancelReply() {
  replyMode.value = false
  replyContent.value = ''
}

function submitReply() {
  if (!replyContent.value.trim()) return
  emit('reply', { ...props.comment, content: replyContent.value })
  cancelReply()
}

const contentHtml = computed(() => renderMarkdownHtml(props.comment.content || '', false))
</script>

<template>
  <div class="border-2 border-black bg-white">
    <div class="flex items-start gap-3 p-4">
      <BAvatar :src="comment.user?.avatar || comment.authorAvatar" :name="authorName" :size="32" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="font-mono text-small font-bold">{{ authorName }}</span>
          <span v-if="replyToName" class="font-mono text-tiny text-ink-500">
            回复 @{{ replyToName }}
          </span>
          <span class="font-mono text-tiny text-ink-500">· {{ timeAgo(comment.createdAt) }}</span>
        </div>
        <div class="prose-brutal text-small" v-html="contentHtml" />

        <div class="mt-2 flex items-center gap-4">
          <button
            class="font-mono text-tiny font-bold uppercase border-b-2 border-transparent hover:border-black transition-all duration-fast ease-linear"
            @click="startReply"
          >
            回复
          </button>
          <button
            v-if="ownsComment || isAdmin"
            class="font-mono text-tiny font-bold uppercase text-red border-b-2 border-transparent hover:border-red transition-all duration-fast ease-linear"
            @click="emit('delete', comment)"
          >
            删除
          </button>
        </div>

        <!-- 回复输入框 -->
        <div v-if="replyMode" class="mt-3">
          <BTextarea
            v-model="replyContent"
            :rows="2"
            placeholder="回复评论..."
          />
          <div class="mt-2 flex gap-2">
            <BButton size="small" @click="submitReply">回复</BButton>
            <BButton size="small" type="secondary" @click="cancelReply">取消</BButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 子回复 -->
    <div v-if="replies.length" class="border-t-2 border-black bg-ink-100 p-2">
      <div class="border-l-4 border-black pl-2 space-y-2">
        <CommentItem
          v-for="child in replies"
          :key="child.id"
          :comment="child"
          :current-user-id="currentUserId"
          :is-admin="isAdmin"
          @reply="emit('reply', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </div>
  </div>
</template>
