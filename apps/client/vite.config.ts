import { defineConfig } from 'vite';

export default defineConfig({ build: { target: 'esnext',manifest:true,rollupOptions:{output:{manualChunks(id){if(id.includes('node_modules'))return id.includes('/three/')?'engine':'network';}}} }, optimizeDeps: { esbuildOptions: { target: 'esnext' } } });
