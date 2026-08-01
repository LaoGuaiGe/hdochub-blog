<script setup lang="ts">
import { userApi, uploadApi } from '~/utils/api'
import { getInitial } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { success, error: errorToast } = useToast()
const authStore = useAuthStore()

const { data: profile, pending, refresh } = await useAsyncData('user-profile', () => userApi.profile())

const form = reactive({
  nickname: '',
  bio: '',
  avatar: '' as string | null
})

const avatarUrlInput = ref('')

watch(profile, (val) => {
  if (val) {
    form.nickname = val.nickname || ''
    form.bio = val.bio || ''
    form.avatar = val.avatar
    avatarUrlInput.value = val.avatar || ''
  }
}, { immediate: true })

// 修改密码
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordErrors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const changingPassword = ref(false)

async function saveProfile() {
  try {
    await userApi.updateProfile({
      nickname: form.nickname,
      bio: form.bio,
      avatar: form.avatar
    })
    success('资料已保存')
    refresh()
    authStore.refreshUser()
  } catch (err: any) {
    errorToast(err.message || '保存失败')
  }
}

function applyAvatarUrl() {
  form.avatar = avatarUrlInput.value || null
}

async function handleUploadAvatar(file: File) {
  try {
    const res = await uploadApi.image(file)
    form.avatar = res.url
    avatarUrlInput.value = res.url
    success('头像上传成功')
  } catch (err: any) {
    errorToast(err.message || '上传失败')
  }
}

function onAvatarFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleUploadAvatar(target.files[0])
  }
}

function validatePassword(): boolean {
  passwordErrors.oldPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''
  let valid = true
  if (!passwordForm.oldPassword) {
    passwordErrors.oldPassword = '请输入原密码'
    valid = false
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 8 || passwordForm.newPassword.length > 32) {
    passwordErrors.newPassword = '新密码 8-32 字符'
    valid = false
  } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
    passwordErrors.newPassword = '需包含字母与数字'
    valid = false
  }
  if (passwordForm.confirmPassword !== passwordForm.newPassword) {
    passwordErrors.confirmPassword = '两次密码不一致'
    valid = false
  }
  return valid
}

async function changePassword() {
  if (!validatePassword()) return
  changingPassword.value = true
  try {
    await userApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    })
    success('密码已修改')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    errorToast(err.message || '修改失败')
  } finally {
    changingPassword.value = false
  }
}

useHead({ title: '个人资料 - hdochub' })
</script>

<template>
  <div>
    <div class="mb-6 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">个人资料</h1>
    </div>

    <div v-if="pending" class="border-2 border-black p-6">
      <BLoading text="LOADING" full />
    </div>
    <div v-else class="space-y-6 max-w-2xl">
      <!-- 基本信息 -->
      <div class="border-2 border-black bg-white">
        <div class="border-b-2 border-black bg-black px-4 py-2">
          <p class="font-mono text-small font-bold uppercase text-white">基本信息</p>
        </div>
        <div class="p-4 space-y-4">
          <!-- 头像 -->
          <div>
            <label class="label">头像</label>
            <div class="flex items-center gap-4">
              <div class="avatar" style="width: 64px; height: 64px; font-size: 24px;">
                <img v-if="form.avatar" :src="form.avatar" alt="avatar" class="h-full w-full object-cover">
                <span v-else>{{ getInitial(form.nickname || profile?.username || '?') }}</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex gap-2">
                  <input
                    v-model="avatarUrlInput"
                    type="text"
                    placeholder="填写头像外链 URL"
                    class="input"
                  >
                  <button type="button" class="btn-secondary !py-2" @click="applyAvatarUrl">应用</button>
                </div>
                <label class="btn-secondary !py-1 !px-3 !text-tiny cursor-pointer inline-block">
                  上传图片
                  <input type="file" accept="image/*" class="hidden" @change="onAvatarFileChange">
                </label>
              </div>
            </div>
          </div>

          <BInput v-model="form.nickname" label="昵称" placeholder="1-20 字符" maxlength="20" />
          <BTextarea v-model="form.bio" label="个人简介" placeholder="展示在用户主页，最多 200 字符" :rows="3" maxlength="200" />

          <div class="flex justify-end">
            <BButton type="primary" @click="saveProfile">保存</BButton>
          </div>
        </div>
      </div>

      <!-- 修改密码 -->
      <div class="border-2 border-black bg-white">
        <div class="border-b-2 border-black bg-black px-4 py-2">
          <p class="font-mono text-small font-bold uppercase text-white">修改密码</p>
        </div>
        <div class="p-4 space-y-4" @submit.prevent="changePassword">
          <BInput
            v-model="passwordForm.oldPassword"
            type="password"
            label="原密码"
            required
            :error="passwordErrors.oldPassword"
            autocomplete="current-password"
          />
          <BInput
            v-model="passwordForm.newPassword"
            type="password"
            label="新密码"
            required
            placeholder="8-32字符，含字母与数字"
            :error="passwordErrors.newPassword"
            autocomplete="new-password"
          />
          <BInput
            v-model="passwordForm.confirmPassword"
            type="password"
            label="确认新密码"
            required
            :error="passwordErrors.confirmPassword"
            autocomplete="new-password"
          />
          <div class="flex justify-end">
            <BButton type="primary" :loading="changingPassword" @click="changePassword">修改密码</BButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
