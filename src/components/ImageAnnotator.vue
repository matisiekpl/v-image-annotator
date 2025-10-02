<template>
  <div class="annotator-wrapper" ref="wrapperRef">
    <div class="stage-rounded">
      <div class="absolute left-2 top-2 z-10 flex gap-2 min-w-[400px]">
        <Button
          type="button"
          :aria-pressed="addTextMode ? 'true' : 'false'"
          @click="toggleAddTextMode"
          :class="addTextMode ? 'brightness-75' : ''"
          variant="outline"
          size="xs"
        >
          <TextCursor class="h-4 w-4" />
          Insert Text
        </Button>
        <Button
          type="button"
          :aria-pressed="drawMode ? 'true' : 'false'"
          @click="toggleDrawMode"
          :class="drawMode ? 'brightness-75' : ''"
          variant="outline"
          size="xs"
          >
          <LineSquiggle class="h-4 w-4" />
          Free Draw
        </Button>
        <label class="h-7 inline-flex items-center rounded-md border border-input bg-background px-1.5 py-1 text-sm text-foreground shadow-sm">
          <span class="sr-only">Color</span>
          <input type="color" :value="drawPickerColor" @input="onDrawColorInput($event)" @change="onDrawColorChangeCommit" class="h-6 w-8 border-0 p-0 bg-transparent cursor-pointer" />
        </label>
        <Button
          type="button"
          @click="handleUndo"
          :disabled="!canUndo"
          variant="outline"
          size="xs"
        >
          <Undo class="h-4 w-4" />
        
        </Button>
        <Button
          type="button"
          @click="handleRedo"
          :disabled="!canRedo"
          variant="outline"
          size="xs"
        >
          <Redo class="h-4 w-4" />

        </Button>
      </div>
      <v-stage
        ref="stageRef"
        :config="{ width: stageWidth, height: stageHeight }"
        @mousedown="handleStageMouseDown"
        @touchstart="handleStageMouseDown"
        @mousemove="handleStageMouseMove"
        @mouseup="handleStageMouseUp"
        @touchmove="handleStageMouseMove"
        @touchend="handleStageMouseUp"
      >
        <v-layer>
          <v-image :config="{ image: imageObj }"></v-image>
        </v-layer>
        <v-layer ref="textLayerRef">
          <v-line
            v-for="item in lines"
            :key="item.id"
            :ref="el => setDrawNodeRef(item.id, el)"
            :config="{
              x: item.x || 0,
              y: item.y || 0,
              points: item.points,
              stroke: item.stroke,
              strokeWidth: item.strokeWidth,
              tension: 0.5,
              lineCap: 'round',
              lineJoin: 'round',
              draggable: true,
              name: 'draw-node'
            }"
            @click="() => toggleSelectDraw(item.id)"
            @tap="() => toggleSelectDraw(item.id)"
            @dragend="(e) => handleDrawDragEnd(item.id, e)"
          />
          <v-text
            v-for="item in texts"
            :key="item.id"
            :ref="el => setTextNodeRef(item.id, el)"
            :config="{
              text: item.text,
              x: item.x,
              y: item.y,
              fontSize: item.fontSize,
              draggable: true,
              width: item.width,
              name: 'text-node',
              visible: !(isEditing && editingId === item.id),
              fill: item.fill || '#111827',
              dragBoundFunc: function(pos) {
                const iw = imageWidth.value || stageWidth
                const ih = imageHeight.value || stageHeight
                const w = Math.max(0, this.width())
                const h = Math.max(0, this.height())
                const minX = 0
                const maxX = Math.max(0, iw - w)
                const minY = 0
                const maxY = Math.max(0, ih - h)
                let nx = Math.min(Math.max(minX, pos.x), maxX)
                let ny = Math.min(Math.max(minY, pos.y), maxY)
                return { x: nx, y: ny }
              },
            }"
            @click="() => toggleSelectText(item.id)"
            @tap="() => toggleSelectText(item.id)"
            @dblclick="() => handleTextDblClick(item.id)"
            @dbltap="() => handleTextDblClick(item.id)"
            @transform="() => handleTransform(item.id)"
            @dragend="(e) => handleDragEnd(item.id, e)"
          />
          <v-transformer
            v-if="selectedId && !isEditing"
            ref="transformerRef"
          />
        </v-layer>
      </v-stage>
    </div>
    <div v-if="showTooltip" :style="{ position: 'absolute', left: tooltipX + 'px', top: tooltipY + 'px', transform: 'translate(-50%, -10%)' }" class="pointer-events-none">
      <div class="relative pointer-events-auto flex items-center gap-2 rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-gray-300">
        <div class="group relative">
          <button
            type="button"
            @click="deleteSelected"
            class="inline-flex items-center rounded p-1.5 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Trash class="h-4 w-4" />
          </button>
          <div class="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity" role="tooltip" :style="{ whiteSpace: 'nowrap', minWidth: '60px', textAlign: 'center' }">
            Delete
          </div>
        </div>
        <div v-if="isSelectedText" class="h-4 w-px bg-gray-200" />
        <div v-if="isSelectedText" class="group relative">
          <button
            type="button"
            @click="adjustFontSize(-2)"
            class="inline-flex items-center rounded p-1.5 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Minus class="h-4 w-4" />
          </button>
          <div class="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity" role="tooltip" :style="{ whiteSpace: 'nowrap', minWidth: '120px', textAlign: 'center' }">
            Decrease font size
          </div>
        </div>
        <div v-if="isSelectedText" class="group relative">
          <button
            type="button"
            @click="adjustFontSize(2)"
            class="inline-flex items-center rounded p-1.5 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Plus class="h-4 w-4" />
          </button>
          <div class="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity" role="tooltip" :style="{ whiteSpace: 'nowrap', minWidth: '120px', textAlign: 'center' }">
            Increase font size
          </div>
        </div>
        <div class="h-4 w-px bg-gray-200" />
        <label class="inline-flex items-center rounded p-1.5 text-sm text-gray-700 hover:bg-gray-100 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-400 cursor-pointer">
          <span class="sr-only">Text color</span>
          <input type="color" :value="currentColor" @input="onColorInput($event)" @change="onColorChangeCommit" class="h-4 w-6 border-0 p-0 bg-transparent cursor-pointer" />
        </label>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { useManualRefHistory } from '@vueuse/core'
import Konva from 'konva'
import { Trash, Plus, Minus, TextCursor, LineSquiggle, Undo, Redo } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

Konva._fixTextRendering = true

const stageWidth = 800
const stageHeight = 600

const imageObj = ref(null)
const imageWidth = ref(800)
const imageHeight = ref(600)
const imageCanvas = ref(null)
let imageCtx = null

const stageRef = ref(null)
const wrapperRef = ref(null)
const textLayerRef = ref(null)
const transformerRef = ref(null)

const addTextMode = ref(false)
const drawMode = ref(false)
const isDrawing = ref(false)
const lines = ref([])
const texts = ref([])
const drawActiveColor = ref('#df4b26')
const selectedId = ref(null)
const isEditing = ref(false)
const editingId = ref(null)
const prevSelectedId = ref(null)

const textNodeRefs = new Map()
const drawNodeRefs = new Map()

const isRestoring = ref(false)
const historyState = ref({ texts: [], lines: [] })

watch([texts, lines], () => {
  if (isRestoring.value) return
  historyState.value = { texts: texts.value, lines: lines.value }
}, { deep: true })

const { undo, redo, canUndo, canRedo, commit } = useManualRefHistory(historyState, { capacity: 100, clone: true })

function commitState() {
  historyState.value = { texts: texts.value, lines: lines.value }
  commit()
}

function load(file) {
  if (!file) return
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    imageObj.value = img
    const w = img.naturalWidth || img.width || stageWidth
    const h = img.naturalHeight || img.height || stageHeight
    imageWidth.value = w
    imageHeight.value = h
    const stage = stageRef.value?.getNode?.()
    if (stage) stage.size({ width: w, height: h })
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, w, h)
    imageCanvas.value = canvas
    imageCtx = ctx
    URL.revokeObjectURL(url)
  }
  img.src = url
}

function dataURLToUint8Array(dataURL) {
  const parts = (dataURL || '').split(',')
  if (parts.length < 2) return new Uint8Array()
  const base64 = parts[1]
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function exportImage() {
  const stage = stageRef.value?.getNode?.()
  if (!stage) return new Uint8Array()
  const dataURL = stage.toDataURL({ mimeType: 'image/png', pixelRatio: 1 })
  return dataURLToUint8Array(dataURL)
}

defineExpose({ load, export: exportImage })

function handleUndo() {
  if (!canUndo.value) return
  undo()
  isRestoring.value = true
  const snap = historyState.value
  texts.value = snap.texts || []
  lines.value = snap.lines || []
  isRestoring.value = false
  selectedId.value = null
  isDrawing.value = false
  addTextMode.value = false
  drawMode.value = false
}

function handleRedo() {
  if (!canRedo.value) return
  redo()
  isRestoring.value = true
  const snap = historyState.value
  texts.value = snap.texts || []
  lines.value = snap.lines || []
  isRestoring.value = false
  selectedId.value = null
  isDrawing.value = false
  addTextMode.value = false
  drawMode.value = false

}

function setTextNodeRef(id, el) {
  if (el) textNodeRefs.set(id, el)
}

function setDrawNodeRef(id, el) {
  if (el) drawNodeRefs.set(id, el)
}

function toggleAddTextMode() {
  addTextMode.value = !addTextMode.value
  if (addTextMode.value) {
    drawMode.value = false
  }
}

function toggleDrawMode() {
  drawMode.value = !drawMode.value
}

function toggleSelectText(id) {
  if (selectedId.value === id) {
    selectedId.value = null
  } else {
    selectedId.value = id
  }
}

function toggleSelectDraw(id) {
  if (selectedId.value === id) {
    selectedId.value = null
  } else {
    selectedId.value = id
  }
}

function handleStageMouseDown(e) {
  if (addTextMode.value) {
    return
  }

  if (drawMode.value) {
    const stage = stageRef.value.getNode()
    const pos = stage.getPointerPosition()
    const id = 'd_' + Date.now()
    const newLine = {
      id,
      x: 0,
      y: 0,
      points: [pos.x, pos.y],
      stroke: drawActiveColor.value,
      strokeWidth: 5,
    }
    lines.value = lines.value.concat([newLine])
    isDrawing.value = true
    return
  }

  const target = e.target
  const stage = stageRef.value.getNode()
  const isStage = target === stage
  const isImage = typeof target.getClassName === 'function' && target.getClassName() === 'Image'
  const isTransformerHandle =
    target.getParent &&
    typeof target.getParent === 'function' &&
    target.getParent() &&
    typeof target.getParent().getClassName === 'function' &&
    target.getParent().getClassName() === 'Transformer'
  const isText = typeof target.name === 'function' && target.name() === 'text-node'

  if (isStage || isImage) {
    selectedId.value = null
  } else if (!isText && !isTransformerHandle) {
    selectedId.value = null
  }
}

function handleStageMouseMove(e) {
  if (!isDrawing.value) return
  const stage = e.target.getStage()
  const point = stage.getPointerPosition()
  if (!lines.value.length) return
  const last = lines.value[lines.value.length - 1]
  const updated = { ...last, points: last.points.concat([point.x, point.y]) }
  lines.value = lines.value.slice(0, lines.value.length - 1).concat([updated])
}

function handleStageMouseUp() {
  if (addTextMode.value) {
    const stage = stageRef.value.getNode()
    const pos = stage.getPointerPosition()
    const id = 't_' + Date.now()
    const fillColor = getContrastingColorAt(pos.x, pos.y)
    const newItem = {
      id,
      text: '',
      x: Math.min(Math.max(0, pos.x), Math.max(0, (imageWidth.value || stageWidth) - 200)),
      y: Math.min(Math.max(0, pos.y), Math.max(0, (imageHeight.value || stageHeight) - 24)),
      fontSize: 20,
      width: 200,
      fill: fillColor,
    }
    texts.value = texts.value.concat([newItem])
    addTextMode.value = false
    selectedId.value = id
    nextTick(() => {
      const nodeComp = textNodeRefs.get(id)
      if (nodeComp && transformerRef.value) {
        const transformer = transformerRef.value.getNode()
        transformer.nodes([nodeComp.getNode()])
        transformer.getLayer().batchDraw()
      }
      const raf = window.requestAnimationFrame || function(cb){ return setTimeout(cb, 0) }
      raf(() => {
        handleTextDblClick(id)
      })
    })
    return
  }
  if (!isDrawing.value) return
  isDrawing.value = false
  commitState()
}

function handleTransform(id) {
  const nodeComp = textNodeRefs.get(id)
  if (!nodeComp) return
  const node = nodeComp.getNode()
  const scaleX = node.scaleX()
  const newWidth = Math.max(30, node.width() * scaleX)
  const idx = texts.value.findIndex(t => t.id === id)
  if (idx !== -1) {
    const updated = { ...texts.value[idx], width: newWidth }
    texts.value = texts.value.slice(0, idx).concat([updated]).concat(texts.value.slice(idx + 1))
  }
  node.width(newWidth)
  node.scaleX(1)
  updateTooltipPosition()
  commitState()
}

function handleDragEnd(id, e) {
  const node = e.target
  const iw = imageWidth.value || stageWidth
  const ih = imageHeight.value || stageHeight
  const w = Math.max(0, node.width())
  const h = Math.max(0, node.height())
  const raw = node.position()
  const x = Math.min(Math.max(0, raw.x), Math.max(0, iw - w))
  const y = Math.min(Math.max(0, raw.y), Math.max(0, ih - h))
  node.position({ x, y })
  const idx = texts.value.findIndex(t => t.id === id)
  if (idx !== -1) {
    const updated = { ...texts.value[idx], x, y }
    texts.value = texts.value.slice(0, idx).concat([updated]).concat(texts.value.slice(idx + 1))
  }
  updateTooltipPosition()
  commit()
}

function handleDrawDragEnd(id, e) {
  const node = e.target
  const pos = node.position()
  const idx = lines.value.findIndex(l => l.id === id)
  if (idx !== -1) {
    const updated = { ...lines.value[idx], x: pos.x, y: pos.y }
    lines.value = lines.value.slice(0, idx).concat([updated]).concat(lines.value.slice(idx + 1))
    commitState()
  }
}

function handleTextDblClick(id) {
  const nodeComp = textNodeRefs.get(id)
  if (!nodeComp) return
  const textNodeKonva = nodeComp.getNode()
  const stage = textNodeKonva.getStage()
  const textPosition = textNodeKonva.absolutePosition()
  const stageBox = stage.container().getBoundingClientRect()

  const areaPosition = {
    x: stageBox.left + textPosition.x,
    y: stageBox.top + textPosition.y,
  }

  const textarea = document.createElement('textarea')
  document.body.appendChild(textarea)

  textarea.value = textNodeKonva.text()
  textarea.style.position = 'absolute'
  textarea.style.top = areaPosition.y + 'px'
  textarea.style.left = areaPosition.x + 'px'
  textarea.style.width = textNodeKonva.width() - textNodeKonva.padding() * 2 + 'px'
  textarea.style.height = textNodeKonva.height() - textNodeKonva.padding() * 2 + 5 + 'px'
  textarea.style.fontSize = textNodeKonva.fontSize() + 'px'
  textarea.style.border = 'none'
  textarea.style.padding = '0px'
  textarea.style.margin = '0px'
  textarea.style.overflow = 'hidden'
  textarea.style.background = 'none'
  textarea.style.outline = 'none'
  textarea.style.resize = 'none'
  textarea.style.lineHeight = textNodeKonva.lineHeight()
  textarea.style.fontFamily = textNodeKonva.fontFamily()
  textarea.style.transformOrigin = 'left top'
  textarea.style.textAlign = textNodeKonva.align()
  textarea.style.color = textNodeKonva.fill()

  const rotation = textNodeKonva.rotation()
  let transform = ''
  if (rotation) {
    transform += 'rotateZ(' + rotation + 'deg)'
  }
  textarea.style.transform = transform

  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 3 + 'px'

  isEditing.value = true
  editingId.value = id
  textarea.focus()

  function removeTextarea() {
    if (textarea.parentNode) textarea.parentNode.removeChild(textarea)
    window.removeEventListener('click', handleOutsideClick)
    window.removeEventListener('touchstart', handleOutsideClick)
    isEditing.value = false
    editingId.value = null
  }

  function setTextareaWidth(newWidth) {
    if (!newWidth) {
      newWidth = (textNodeKonva.placeholder?.length || 0) * textNodeKonva.fontSize()
    }
    textarea.style.width = newWidth + 'px'
  }

  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      const idx = texts.value.findIndex(t => t.id === id)
      if (idx !== -1) {
        const updated = { ...texts.value[idx], text: textarea.value }
        texts.value = texts.value.slice(0, idx).concat([updated]).concat(texts.value.slice(idx + 1))
      }
      removeTextarea()
      commitState()
    }
    if (e.key === 'Escape') {
      removeTextarea()
      commitState()
    }
  })

  textarea.addEventListener('keydown', function () {
    const scale = textNodeKonva.getAbsoluteScale().x
    setTextareaWidth(textNodeKonva.width() * scale)
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + textNodeKonva.fontSize() + 'px'
  })

  function handleOutsideClick(e) {
    if (e.target !== textarea) {
      const idx = texts.value.findIndex(t => t.id === id)
      if (idx !== -1) {
        const updated = { ...texts.value[idx], text: textarea.value }
        texts.value = texts.value.slice(0, idx).concat([updated]).concat(texts.value.slice(idx + 1))
      }
      removeTextarea()
      commitState()
    }
  }
  setTimeout(() => {
    window.addEventListener('click', handleOutsideClick)
    window.addEventListener('touchstart', handleOutsideClick)
  })
}

const tooltipX = ref(0)
const tooltipY = ref(0)
const showTooltip = computed(() => !!selectedId.value && !isEditing.value)
const isSelectedText = computed(() => {
  const id = selectedId.value
  if (!id) return false
  return texts.value.some(t => t.id === id)
})
const drawPickerColor = computed(() => drawActiveColor.value)
const currentColor = computed(() => {
  const id = selectedId.value
  if (!id) return '#111827'
  const t = texts.value.find(t => t.id === id)
  return t?.fill || '#111827'
})

function updateTooltipPosition() {
  const id = selectedId.value
  if (!id) return
  const nodeComp = textNodeRefs.get(id) || drawNodeRefs.get(id)
  if (!nodeComp) return
  const node = nodeComp.getNode()
  const rect = node.getClientRect()
  tooltipX.value = rect.x + rect.width / 2
  tooltipY.value = rect.y
}

function deleteSelected() {
  const id = selectedId.value
  if (!id) return
  const tIdx = texts.value.findIndex(t => t.id === id)
  if (tIdx !== -1) {
    texts.value = texts.value.slice(0, tIdx).concat(texts.value.slice(tIdx + 1))
  }
  const lIdx = lines.value.findIndex(l => l.id === id)
  if (lIdx !== -1) {
    lines.value = lines.value.slice(0, lIdx).concat(lines.value.slice(lIdx + 1))
  }
  selectedId.value = null
  commitState()
}

function onDrawColorInput(e) {
  const color = e.target.value
  const id = selectedId.value
  const lIdx = id ? lines.value.findIndex(l => l.id === id) : -1
  if (lIdx !== -1) {
    const updated = { ...lines.value[lIdx], stroke: color }
    lines.value = lines.value.slice(0, lIdx).concat([updated]).concat(lines.value.slice(lIdx + 1))
    const nodeComp = drawNodeRefs.get(id)
    if (nodeComp) {
      nodeComp.getNode().stroke(color)
      nodeComp.getNode().getLayer().batchDraw()
    }
    return
  }
  drawActiveColor.value = color
}

function onDrawColorChangeCommit() {
  if (selectedId.value && lines.value.some(l => l.id === selectedId.value)) commitState()
}

function onColorInput(e) {
  const color = e.target.value
  const id = selectedId.value
  const idx = id ? texts.value.findIndex(t => t.id === id) : -1
  if (idx !== -1) {
    const updated = { ...texts.value[idx], fill: color }
    texts.value = texts.value.slice(0, idx).concat([updated]).concat(texts.value.slice(idx + 1))
    const nodeComp = textNodeRefs.get(id)
    if (nodeComp) {
      const node = nodeComp.getNode()
      node.fill(color)
      node.getLayer().batchDraw()
    }
  }
}

function onColorChangeCommit() {
  if (selectedId.value && texts.value.some(t => t.id === selectedId.value)) commitState()
}

function adjustFontSize(delta) {
  const id = selectedId.value
  if (!id) return
  const idx = texts.value.findIndex(t => t.id === id)
  if (idx === -1) return
  const current = texts.value[idx]
  const minSize = 10
  const maxSize = 96
  const nextSize = Math.min(maxSize, Math.max(minSize, current.fontSize + delta))
  if (nextSize === current.fontSize) return
  const updated = { ...current, fontSize: nextSize }
  texts.value = texts.value.slice(0, idx).concat([updated]).concat(texts.value.slice(idx + 1))
  const nodeComp = textNodeRefs.get(id)
  if (nodeComp) {
    const node = nodeComp.getNode()
    node.fontSize(nextSize)
    node.getLayer().batchDraw()
    updateTooltipPosition()
  }
  commitState()
}

watch(selectedId, async (id) => {
  await nextTick()
  const transformer = transformerRef.value?.getNode?.()
  if (!transformer) return
  if (prevSelectedId.value && textNodeRefs.has(prevSelectedId.value)) {
    const prevNode = textNodeRefs.get(prevSelectedId.value).getNode()
    prevNode.off('dragmove')
    prevNode.off('transform')
  }
  if (prevSelectedId.value && drawNodeRefs.has(prevSelectedId.value)) {
    const prevNode = drawNodeRefs.get(prevSelectedId.value).getNode()
    prevNode.off('dragmove')
    prevNode.off('transform')
  }
  if (id && textNodeRefs.has(id)) {
    const node = textNodeRefs.get(id).getNode()
    transformer.nodes([node])
    transformer.enabledAnchors(['middle-left', 'middle-right'])
    transformer.rotateEnabled(false)
    transformer.boundBoxFunc(function(oldBox, newBox) {
      const iw = imageWidth.value || stageWidth
      const minWidth = 30
      let x = newBox.x
      let width = newBox.width
      if (x < 0) {
        const right = newBox.x + newBox.width
        x = 0
        width = Math.max(minWidth, Math.min(right, iw))
      }
      const rightEdge = x + width
      if (rightEdge > iw) {
        width = Math.max(minWidth, iw - x)
      }
      width = Math.max(minWidth, width)
      return { ...newBox, x, width }
    })
    transformer.getLayer().batchDraw()
    node.on('dragmove', updateTooltipPosition)
    node.on('transform', updateTooltipPosition)
    updateTooltipPosition()
  } else if (id && drawNodeRefs.has(id)) {
    const node = drawNodeRefs.get(id).getNode()
    transformer.nodes([node])
    transformer.enabledAnchors(['top-left','top-center','top-right','middle-left','middle-right','bottom-left','bottom-center','bottom-right'])
    transformer.rotateEnabled(false)
    transformer.boundBoxFunc(null)
    transformer.getLayer().batchDraw()
    node.on('dragmove', updateTooltipPosition)
    node.on('transform', updateTooltipPosition)
    updateTooltipPosition()
  } else {
    transformer.nodes([])
    transformer.getLayer()?.batchDraw()
  }
  prevSelectedId.value = id || null
})


function getContrastingColorAt(x, y) {
  if (!imageCtx || !imageCanvas.value) return '#111827'
  const half = 4
  const ix = Math.max(0, Math.min(Math.floor(x), (imageCanvas.value.width - 1)))
  const iy = Math.max(0, Math.min(Math.floor(y), (imageCanvas.value.height - 1)))
  const sx = Math.max(0, ix - half)
  const sy = Math.max(0, iy - half)
  const ex = Math.min(imageCanvas.value.width, ix + half)
  const ey = Math.min(imageCanvas.value.height, iy + half)
  const w = Math.max(1, ex - sx)
  const h = Math.max(1, ey - sy)
  let data
  try {
    data = imageCtx.getImageData(sx, sy, w, h).data
  } catch (err) {
    return '#111827'
  }
  let sum = 0
  let count = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a === 0) continue
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sum += luminance
    count += 1
  }
  const avg = count > 0 ? sum / count : 255
  return avg < 128 ? '#ffffff' : '#111827'
}

function isEditableTarget(el) {
  if (!el) return false
  const tag = (el.tagName || '').toUpperCase()
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  return !!el.isContentEditable
}

function onKeyDown(e) {
  const isDeleteKey = e.key === 'Delete' || e.key === 'Backspace'
  if (isDeleteKey && !isEditing.value && selectedId.value && !isEditableTarget(e.target)) {
    e.preventDefault()
    deleteSelected()
    return
  }
  const inEditable = isEditableTarget(e.target) || isEditing.value
  const meta = e.metaKey || e.ctrlKey
  const key = (e.key || '').toLowerCase()
  if (meta && key === 'z' && !inEditable) {
    e.preventDefault()
    if (e.shiftKey) handleRedo()
    else handleUndo()
  } else if (meta && key === 'y' && !inEditable) {
    e.preventDefault()
    handleRedo()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.annotator-wrapper {
  position: relative;
  display: inline-block;
}
.stage-rounded {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  width: fit-content;
}
</style>
