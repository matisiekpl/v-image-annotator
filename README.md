# v-image-annotator

> Vue Component that allows to annotate images by text or free-drawn lines.

<img width="1392" height="881" alt="screenshot" src="https://github.com/user-attachments/assets/f14d0950-77d2-49d5-a678-b887ef437ade" />

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
