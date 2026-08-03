<script setup lang="ts">
import type { Comment } from '~/types'
import { timeAgo } from '~/utils/format'
import { renderMarkdownHtml } from '~/utils/markdown'

interface Props {
  comment: Comment
  isAuthor?: boolean
  isAdmin?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  reply: [comment: Comment]
  delete: [comment: Comment]
}>()

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

const contentHtml = computed(() => renderMarkdownHtml(props.comment.content || ''))
</script>

<template>
  <div class="border-2 border-black bg-white">
    <div class="flex items-start gap-3 p-4">
      <BAvatar :src="comment.authorAvatar" :name="comment.authorName" :size="32" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="font-mono text-small font-bold">{{ comment.authorName }}</span>
          <span v-if="comment.replyTo" class="font-mono text-tiny text-ink-500">
            回复 @{{ comment.replyTo.name }}
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
            v-if="isAuthor || isAdmin"
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
    <div v-if="comment.children && comment.children.length" class="border-t-2 border-black bg-ink-100 p-2">
      <div class="border-l-4 border-black pl-2 space-y-2">
        <CommentItem
          v-for="child in comment.children"
          :key="child.id"
          :comment="child"
          :is-author="isAuthor"
          :is-admin="isAdmin"
          @reply="emit('reply', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </div>
  </div>
</template>
