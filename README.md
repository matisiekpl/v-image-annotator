# v-image-annotator

> Vue Component that allows to annotate images by text or free-drawn lines.

![screenshot.png](screenshot.png)

### Install

```bash
npm install --save v-image-annotator
# or
yarn add v-image-annotator
```

### Usage

```vue
<script setup lang="ts">
    import { ref } from 'vue';
    import { ImageAnnotatorManager, ImageAnnotator } from "v-image-annotator";
    
    const annotatorRef = ref<ImageAnnotatorManager>(null);
    
    function load(file: File) {
        annotatorRef.value?.load(file);
    }
    
    function render() {
        const bytes = annotatorRef.value?.export();
        return bytes;
    }
</script>

<template>
    <ImageAnnotator ref="annotatorRef"/>
</template>
```