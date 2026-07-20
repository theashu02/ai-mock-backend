import { app } from '@/server/index'
import { handleMockRequest } from '@/server/mock-api-service'

async function handle(request: Request) {
  const url = new URL(request.url)
  const mockPrefix = '/api/mock/'

  if (url.pathname.startsWith(mockPrefix)) {
    return handleMockRequest(request, url.pathname.slice(mockPrefix.length))
  }

  return app.handle(request)
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
