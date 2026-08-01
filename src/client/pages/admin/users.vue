<script setup lang="ts">
import type { UserStatus, UserRole } from '~/types'
import { userApi } from '~/utils/api'
import { formatDate } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()
const { success, error: errorToast } = useToast()

const page = ref(Number(route.query.page) || 1)
const roleFilter = ref<'ALL' | UserRole>((route.query.role as any) || 'ALL')
const statusFilter = ref<'ALL' | UserStatus>((route.query.status as any) || 'ALL')

const query = computed(() => ({
  page: page.value,
  pageSize: 20,
  role: roleFilter.value === 'ALL' ? undefined : roleFilter.value,
  status: statusFilter.value === 'ALL' ? undefined : statusFilter.value
}))

const { data, pending, refresh } = await useAsyncData(
  () => `admin-users-${page.value}-${roleFilter.value}-${statusFilter.value}`,
  () => userApi.list(query.value),
  { watch: [page, roleFilter, statusFilter] }
)

const list = computed(() => data.value?.list || [])
const totalPages = computed(() => data.value?.pagination.totalPages || 0)

function changePage(p: number) {
  page.value = p
}

async function handleRoleChange(user: any, role: UserRole) {
  try {
    await userApi.updateRole(user.id, role)
    success('角色已更新')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

async function handleBan(user: any) {
  const ok = await confirm({
    title: '封禁用户',
    message: `确认封禁用户「${user.username}」？封禁后该用户无法登录和发言。`,
    confirmText: '封禁',
    danger: true
  })
  if (!ok) return
  try {
    await userApi.ban(user.id)
    success('用户已封禁')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

async function handleUnban(user: any) {
  try {
    await userApi.unban(user.id)
    success('用户已解封')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

async function handleResetPassword(user: any) {
  const ok = await confirm({
    title: '重置密码',
    message: `确认重置用户「${user.username}」的密码？重置后将生成随机密码。`,
    confirmText: '重置'
  })
  if (!ok) return
  try {
    await userApi.resetPassword(user.id)
    success('密码已重置')
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

const columns = [
  { key: 'username', title: '用户名' },
  { key: 'email', title: '邮箱', hideOnMobile: true },
  { key: 'role', title: '角色' },
  { key: 'articleCount', title: '文章数', hideOnTablet: true },
  { key: 'commentCount', title: '评论数', hideOnTablet: true },
  { key: 'createdAt', title: '注册时间', hideOnTablet: true },
  { key: 'status', title: '状态' },
  { key: 'actions', title: '操作', align: 'right' as const }
]

useHead({ title: '用户管理 - hdochub admin' })
</script>

<template>
  <div>
    <div class="mb-6 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">用户管理</h1>
    </div>

    <!-- 筛选 -->
    <div class="mb-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-0">
        <span class="font-mono text-tiny font-bold mr-2">角色:</span>
        <select
          v-model="roleFilter"
          class="border-2 border-black bg-white px-2 py-1 font-mono text-tiny"
          @change="page = 1"
        >
          <option value="ALL">全部</option>
          <option value="ADMIN">管理员</option>
          <option value="USER">用户</option>
        </select>
      </div>
      <div class="flex items-center gap-0">
        <span class="font-mono text-tiny font-bold mr-2">状态:</span>
        <select
          v-model="statusFilter"
          class="border-2 border-black bg-white px-2 py-1 font-mono text-tiny"
          @change="page = 1"
        >
          <option value="ALL">全部</option>
          <option value="NORMAL">正常</option>
          <option value="BANNED">封禁</option>
        </select>
      </div>
    </div>

    <BTable :columns="columns" :data="list" :loading="pending">
      <template #username="{ row }">
        <span class="font-mono text-small font-bold">{{ row.username }}</span>
      </template>
      <template #email="{ row }">
        <span class="font-mono text-tiny">{{ row.email }}</span>
      </template>
      <template #role="{ row }">
        <span v-if="row.role === 'ADMIN'" class="badge-published">管理员</span>
        <span v-else class="badge">用户</span>
      </template>
      <template #articleCount="{ row }">{{ row.articleCount || 0 }}</template>
      <template #commentCount="{ row }">{{ row.commentCount || 0 }}</template>
      <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #status="{ row }">
        <BBadge :status="row.status" />
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <button
            v-if="row.role !== 'ADMIN'"
            class="btn-text !text-tiny"
            @click="handleRoleChange(row, 'ADMIN')"
          >
            升级管理员
          </button>
          <button
            v-else
            class="btn-text !text-tiny"
            @click="handleRoleChange(row, 'USER')"
          >
            降级
          </button>
          <button v-if="row.status === 'NORMAL'" class="btn-text !text-tiny !text-red" @click="handleBan(row)">封禁</button>
          <button v-else class="btn-text !text-tiny" @click="handleUnban(row)">解封</button>
          <button class="btn-text !text-tiny" @click="handleResetPassword(row)">重置密码</button>
        </div>
      </template>
    </BTable>

    <div class="mt-4 flex justify-center">
      <BPagination :page="page" :total-pages="totalPages" @change="changePage" />
    </div>
  </div>
</template>
