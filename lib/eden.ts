import { treaty } from '@elysia/eden'
import type { App } from '@/server/index'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use Vercel URL
  return 'http://localhost:3000' // dev SSR should use localhost
}

// eden treaty provides end-to-end type safety for your Elysia API
export const api = treaty<App>(getBaseUrl())
