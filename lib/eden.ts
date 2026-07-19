import { treaty } from '@elysia/eden'
import type { App } from '@/server/index'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export const api = treaty<App>(getBaseUrl())
