<script setup lang="ts">
import type { ArticleStatus, CommentStatus, UserStatus, UserRole } from '~/types'

interface Props {
  status?: ArticleStatus | CommentStatus | UserStatus
  type?: string
  text?: string
}

const props = defineProps<Props>()

const { label, cls } = computed(() => {
  if (props.text && props.type) {
    const map: Record<string, string> = {
      published: 'badge-published',
      draft: 'badge-draft',
      offline: 'badge-offline',
      pending: 'badge-pending',
      approved: 'badge-approved',
      deleted: 'badge-deleted',
      normal: 'badge-published',
      banned: 'badge-danger'
    }
    return { label: props.text, cls: map[props.type] || 'badge' }
  }
  const status = props.status
  switch (status) {
    case 'PUBLISHED':
    case 'APPROVED':
    case 'NORMAL':
      return { label: '已发布', cls: 'badge-published' }
    case 'DRAFT':
      return { label: '草稿', cls: 'badge-draft' }
    case 'OFFLINE':
      return { label: '已下架', cls: 'badge-offline' }
    case 'PENDING':
      return { label: '待审核', cls: 'badge-pending' }
    case 'DELETED':
      return { label: '已删除', cls: 'badge-deleted' }
    case 'BANNED':
      return { label: '封禁', cls: 'badge-danger' }
    default:
      return { label: props.text || '-', cls: 'badge' }
  }
}).value
</script>

<template>
  <span :class="cls">{{ label }}</span>
</template>
