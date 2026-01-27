import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

function normalizeBase(base: string): string {
  if (base === '.' || base === './') return './'
  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`
  return base
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const explicitBase = process.env.VITE_BASE

  const base =
    mode === 'production'
      ? normalizeBase(explicitBase ?? './')
      : '/'

  return {
    base,
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
    },
  }
})
