import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
    server: {
        port: 5173,
        hmr: {
            host: 'localhost',
        },
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: [
                        'react',
                        'react-dom',
                        'react-router-dom',
                    ],
                    charts: ['recharts'],
                    ui: ['sweetalert2'],
                    qrcode: ['html5-qrcode'],
                },
            },
        },
    },
});
