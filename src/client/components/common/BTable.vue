<script setup lang="ts" generic="T extends Record<string, any>">
interface Column {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  hideOnMobile?: boolean
  hideOnTablet?: boolean
}

interface Props {
  columns: Column[]
  data: T[]
  rowKey?: string
  selectable?: boolean
  selectedKeys?: (string | number)[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  selectable: false,
  selectedKeys: () => []
})

const emit = defineEmits<{
  rowClick: [row: T]
  selectChange: [keys: (string | number)[]]
}>()

const internalSelected = ref<(string | number)[]>([...props.selectedKeys])

watch(() => props.selectedKeys, (val) => {
  internalSelected.value = [...val]
})

const allChecked = computed(() => {
  return props.data.length > 0 && props.data.every(row => internalSelected.value.includes(row[props.rowKey]))
})

const indeterminate = computed(() => {
  const checked = props.data.filter(row => internalSelected.value.includes(row[props.rowKey])).length
  return checked > 0 && checked < props.data.length
})

function toggleAll() {
  if (allChecked.value) {
    internalSelected.value = internalSelected.value.filter(k => !props.data.some(r => r[props.rowKey] === k))
  } else {
    internalSelected.value = [...new Set([...internalSelected.value, ...props.data.map(r => r[props.rowKey])])]
  }
  emit('selectChange', internalSelected.value)
}

function toggleRow(row: T) {
  const key = row[props.rowKey]
  const idx = internalSelected.value.indexOf(key)
  if (idx > -1) {
    internalSelected.value.splice(idx, 1)
  } else {
    internalSelected.value.push(key)
  }
  emit('selectChange', internalSelected.value)
}

function isChecked(row: T): boolean {
  return internalSelected.value.includes(row[props.rowKey])
}

const alignClass = (align?: string) => {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}
</script>

<template>
  <div class="table-wrapper">
    <table class="brutal-table">
      <thead>
        <tr>
          <th v-if="selectable" class="w-10">
            <span
              class="inline-flex h-5 w-5 items-center justify-center border-2 border-white"
              :class="{ 'bg-white': allChecked || indeterminate }"
              @click="toggleAll"
            >
              <span v-if="allChecked" class="text-black text-tiny font-bold">✓</span>
              <span v-else-if="indeterminate" class="text-black text-tiny">-</span>
            </span>
          </th>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="{ width: col.width }"
            :class="[alignClass(col.align), { 'hidden md:table-cell': col.hideOnMobile, 'hidden lg:table-cell': col.hideOnTablet }]"
          >
            {{ col.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="text-center">
            <span class="loading-dots">LOADING</span>
          </td>
        </tr>
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="text-center text-ink-500">
            NO RESULTS
          </td>
        </tr>
        <template v-else>
          <tr v-for="row in data" :key="row[rowKey]">
            <td v-if="selectable">
              <span
                class="inline-flex h-5 w-5 cursor-pointer items-center justify-center border-2 border-black"
                :class="{ 'bg-black': isChecked(row) }"
                @click="toggleRow(row)"
              >
                <span v-if="isChecked(row)" class="text-yellow text-tiny font-bold">✓</span>
              </span>
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[alignClass(col.align), { 'hidden md:table-cell': col.hideOnMobile, 'hidden lg:table-cell': col.hideOnTablet }]"
            >
              <slot :name="col.key" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
