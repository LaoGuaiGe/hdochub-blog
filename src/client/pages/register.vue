<script setup lang="ts">
import type { RegisterPayload } from '~/types'
import { authApi, captchaApi } from '~/utils/api'
import { passwordStrength } from '~/utils/format'

definePageMeta({ layout: 'default' })

const { login } = useAuth()
const { success, error: errorToast } = useToast()

const form = reactive<RegisterPayload>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  captchaId: ''
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: ''
})
const submitting = ref(false)

const strength = computed(() => passwordStrength(form.password))

// 验证码
const captchaSvg = ref('')
async function refreshCaptcha() {
  try {
    const res = await captchaApi.get()
    captchaSvg.value = res.svg
    form.captchaId = res.captchaId
    form.captcha = ''
  } catch (err: any) {
    errorToast(err.message || '验证码加载失败')
  }
}
onMounted(refreshCaptcha)

function validateUsername(): boolean {
  if (!form.username) {
    errors.username = '请输入用户名'
  } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/.test(form.username)) {
    errors.username = '2-20字符，支持中文/字母/数字/下划线'
  } else {
    errors.username = ''
  }
  return !errors.username
}

function validateEmail(): boolean {
  if (!form.email) {
    errors.email = '请输入邮箱'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '邮箱格式不正确'
  } else {
    errors.email = ''
  }
  return !errors.email
}

function validatePassword(): boolean {
  if (!form.password) {
    errors.password = '请输入密码'
  } else if (form.password.length < 8 || form.password.length > 32) {
    errors.password = '密码长度 8-32 字符'
  } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
    errors.password = '密码需至少包含字母与数字'
  } else {
    errors.password = ''
  }
  return !errors.password
}

function validateConfirmPassword(): boolean {
  if (!form.confirmPassword) {
    errors.confirmPassword = '请再次输入密码'
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = '两次密码不一致'
  } else {
    errors.confirmPassword = ''
  }
  return !errors.confirmPassword
}

function validateCaptcha(): boolean {
  if (!form.captcha) {
    errors.captcha = '请输入验证码'
  } else {
    errors.captcha = ''
  }
  return !errors.captcha
}

function validate(): boolean {
  const v1 = validateUsername()
  const v2 = validateEmail()
  const v3 = validatePassword()
  const v4 = validateConfirmPassword()
  const v5 = validateCaptcha()
  return v1 && v2 && v3 && v4 && v5
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const result = await authApi.register(form)
    await login(result.token, result.user, false)
    success('注册成功，已自动登录')
    await navigateTo('/dashboard')
  } catch (err: any) {
    errorToast(err.message || '注册失败')
    refreshCaptcha()
  } finally {
    submitting.value = false
  }
}

useHead({ title: '注册 - hdochub' })
</script>

<template>
  <div class="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
    <div class="w-full max-w-[400px]">
      <div class="border-2 border-black bg-white">
        <!-- 标题栏 -->
        <div class="bg-black px-6 py-3">
          <h1 class="font-mono text-h4 font-bold uppercase text-white">REGISTER / 注册</h1>
        </div>

        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <BInput
            v-model="form.username"
            label="用户名"
            required
            placeholder="支持中文、字母、数字、下划线"
            :error="errors.username"
            help="2-20字符，支持中文/字母/数字/下划线"
            autocomplete="username"
            @blur="validateUsername"
          />

          <BInput
            v-model="form.email"
            type="email"
            label="邮箱"
            required
            placeholder="输入邮箱地址"
            :error="errors.email"
            autocomplete="email"
            @blur="validateEmail"
          />

          <div>
            <BInput
              v-model="form.password"
              type="password"
              label="密码"
              required
              placeholder="8-32字符，含字母与数字"
              :error="errors.password"
              help="8-32字符，至少包含字母与数字"
              autocomplete="new-password"
              @blur="validatePassword"
            />
            <!-- 密码强度 -->
            <div class="mt-2 flex items-center gap-1">
              <span
                v-for="i in 4"
                :key="i"
                class="h-3 w-8 border-2 border-black"
                :class="i <= strength ? 'bg-black' : 'bg-white'"
              />
              <span class="ml-2 font-mono text-tiny text-ink-500">
                {{ strength === 0 ? '' : strength <= 1 ? '弱' : strength <= 2 ? '中' : strength <= 3 ? '强' : '很强' }}
              </span>
            </div>
          </div>

          <BInput
            v-model="form.confirmPassword"
            type="password"
            label="确认密码"
            required
            placeholder="再次输入密码"
            :error="errors.confirmPassword"
            autocomplete="new-password"
            @blur="validateConfirmPassword"
          />

          <!-- 验证码 -->
          <div>
            <label class="label">图形验证码</label>
            <div class="flex items-stretch gap-2">
              <input
                v-model="form.captcha"
                type="text"
                placeholder="输入验证码"
                maxlength="4"
                autocomplete="off"
                class="input flex-1 uppercase"
                :class="{ 'input-error': errors.captcha }"
                @blur="validateCaptcha"
              >
              <button
                type="button"
                class="border-2 border-black bg-white px-2 transition-all duration-fast ease-linear hover:bg-yellow"
                style="height: 56px;"
                title="点击刷新验证码"
                @click="refreshCaptcha"
              >
                <div v-html="captchaSvg" class="h-full flex items-center" />
              </button>
            </div>
            <p v-if="errors.captcha" class="form-error">{{ errors.captcha }}</p>
            <p class="form-help">看不清？点击图片刷新</p>
          </div>

          <BButton type="primary" html-type="submit" block :loading="submitting">
            注册
          </BButton>

          <p class="text-center font-mono text-small">
            已有账号？
            <NuxtLink to="/login" class="btn-text">登录</NuxtLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
