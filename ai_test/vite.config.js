import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    antv: ['@antv/x6'],
                    utils: ['./src/utils/flow.ts', './src/utils/storage.ts', './src/utils/preview.ts']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@/types': resolve(__dirname, 'src/types'),
            '@/components': resolve(__dirname, 'src/components'),
            '@/features': resolve(__dirname, 'src/features'),
            '@/utils': resolve(__dirname, 'src/utils'),
            '@/hooks': resolve(__dirname, 'src/hooks'),
            '@/pages': resolve(__dirname, 'src/pages')
        }
    }
});
