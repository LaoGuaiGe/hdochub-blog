<script setup lang="ts">
const { confirmState, handleConfirm, handleCancel } = useConfirm()
</script>

<template>
  <BModal
    :visible="confirmState.visible"
    :title="confirmState.options.title"
    :width="400"
    @close="handleCancel"
  >
    <p class="font-mono text-body-ui">{{ confirmState.options.message }}</p>
    <div class="mt-6 flex justify-end gap-2">
      <BButton type="secondary" @click="handleCancel">
        {{ confirmState.options.cancelText }}
      </BButton>
      <BButton :type="confirmState.options.danger ? 'danger' : 'primary'" @click="handleConfirm">
        {{ confirmState.options.confirmText }}
      </BButton>
    </div>
  </BModal>
</template>
