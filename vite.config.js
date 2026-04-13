import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL ?? '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor':  ['three', '@react-three/fiber', '@react-three/drei'],
          'react-vendor':  ['react', 'react-dom'],
          'motion-vendor': ['framer-motion'],
          'gsap-vendor':   ['gsap'],
          'lottie-vendor': ['@lottiefiles/react-lottie-player'],
        },
      },
    },
    // Don't modulepreload three-vendor — GardenScene is lazy, so preloading Three.js
    // on every page load wastes 928KB of bandwidth before it's needed.
    // It will still load on demand when GardenScene mounts.
    modulePreload: {
      resolveDependencies: (_, deps) =>
        deps.filter(dep => !dep.includes('three-vendor')),
    },
    chunkSizeWarningLimit: 700,
  },
})
