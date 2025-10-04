<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isHeic, heicTo } from 'heic-to'
// @ts-ignore
import ImageAnnotator from './components/ImageAnnotator.vue'
import type {ImageAnnotatorManager} from "@/components/imageAnnotator.ts";

const annotatorRef = ref<ImageAnnotatorManager | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('https://picsum.photos/800/400', { mode: 'cors' })
    const blob = await res.blob()
    const file = new File([blob], 'picsum.jpg', { type: blob.type || 'image/jpeg' })
    annotatorRef.value?.load(file)
  } catch (_) {}
})

function onSelectPhoto() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  try {
    let toLoad: File = file
    const looksHeicByType = file.type === 'image/heic' || file.type === 'image/heif'
    const looksHeicByName = /\.heic$|\.heif$/i.test(file.name)
    if (looksHeicByType || looksHeicByName || await isHeic(file)) {
      const pngBlob = await heicTo({ blob: file, type: 'image/png', quality: 0.92 })
      const newName = file.name.replace(/\.(heic|heif)$/i, '.png') || `${Date.now()}.png`
      toLoad = new File([pngBlob], newName, { type: 'image/png' })
    }
    await annotatorRef.value?.load(toLoad)
  } finally {
    target.value = ''
  }
}

function onExport() {
  const bytes = annotatorRef.value?.export()
  if (!bytes || bytes.length === 0) return
  const blob = new Blob([bytes as any], { type: 'image/png' })
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
  <button @click="onSelectPhoto" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm mr-2">Select Photo</button>
  <button @click="onExport" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">Export PNG</button>
  <input ref="fileInput" type="file" accept="image/*,.heic,.heif" class="hidden" @change="onFileChange" />
 </div>
 <div class="m-4">
  <ImageAnnotator ref="annotatorRef" />
 </div>
</template>
