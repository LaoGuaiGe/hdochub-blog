<script setup lang="ts">
import type { LoginPayload } from '~/types'
import { authApi } from '~/utils/api'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { login } = useAuth()
const { success, error: errorToast } = useToast()

const form = reactive<LoginPayload>({
  account: '',
  password: '',
  remember: false
})

const errors = reactive({
  account: '',
  password: ''
})
const submitting = ref(false)

function validate(): boolean {
  errors.account = ''
  errors.password = ''
  if (!form.account.trim()) {
    errors.account = '请输入用户名或邮箱'
  }
  if (!form.password) {
    errors.password = '请输入密码'
  }
  return !errors.account && !errors.password
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const result = await authApi.login(form)
    await login(result.token, result.user, form.remember)
    success('登录成功')
    const redirect = route.query.redirect as string
    if (redirect) {
      await navigateTo(redirect)
    } else if (result.user.role === 'ADMIN' || result.user.role === 'SUPER_ADMIN') {
      await navigateTo('/admin')
    } else {
      await navigateTo('/dashboard')
    }
  } catch (err: any) {
    errorToast(err.message || '登录失败')
  } finally {
    submitting.value = false
  }
}

useHead({ title: '登录 - hdochub' })
</script>

<template>
  <div class="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
    <div class="w-full max-w-[400px]">
      <div class="border-2 border-black bg-white">
        <!-- 标题栏 -->
        <div class="bg-black px-6 py-3">
          <h1 class="font-mono text-h4 font-bold uppercase text-white">LOGIN / 登录</h1>
        </div>

        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <BInput
            v-model="form.account"
            label="用户名 / 邮箱"
            required
            placeholder="输入用户名或邮箱"
            :error="errors.account"
            autocomplete="username"
          />

          <BInput
            v-model="form.password"
            type="password"
            label="密码"
            required
            placeholder="输入密码"
            :error="errors.password"
            autocomplete="current-password"
          />

          <div class="flex items-center justify-between">
            <BCheckbox v-model="form.remember" label="记住我" />
            <NuxtLink to="/login" class="btn-text" @click.prevent="errorToast('请联系管理员重置密码')">忘记密码?</NuxtLink>
          </div>

          <BButton type="primary" html-type="submit" block :loading="submitting">
            登录
          </BButton>

          <p class="text-center font-mono text-small">
            没有账号？
            <NuxtLink to="/register" class="btn-text">注册</NuxtLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
