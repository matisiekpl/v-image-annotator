import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import {resolve} from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "ImageAnnotator",
            fileName: "image-annotator",
        },
        rollupOptions: {
            external: ["vue"],
            output: {
                globals: {
                    vue: "Vue",
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
})
