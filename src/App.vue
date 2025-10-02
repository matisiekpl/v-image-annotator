<script setup lang="ts">
import { ref, onMounted } from 'vue'
// @ts-ignore
import ImageAnnotator from './components/ImageAnnotator.vue'

const annotatorRef = ref<any>(null)

onMounted(async () => {
  try {
    const res = await fetch('https://picsum.photos/1200/800', { mode: 'cors' })
    const blob = await res.blob()
    const file = new File([blob], 'picsum.jpg', { type: blob.type || 'image/jpeg' })
    annotatorRef.value?.load(file)
  } catch (_) {}
})

function onExport() {
  const bytes = annotatorRef.value?.export()
  if (!bytes || bytes.length === 0) return
  const blob = new Blob([bytes], { type: 'image/png' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `annotated-${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
</script>

<template>
 <div class="m-4">
  <button @click="onExport" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">Export PNG</button>
 </div>
 <ImageAnnotator ref="annotatorRef" class="m-4"/>
</template>
