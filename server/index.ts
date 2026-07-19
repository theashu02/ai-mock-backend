import { Elysia, t } from 'elysia'

export const app = new Elysia({ prefix: '/api' })
  .get('/', () => 'Welcome to AI Mock Backend API')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .post('/generate', ({ body }) => {
    // This is a mock implementation.
    // Here you would integrate with your AI provider.
    return {
      success: true,
      message: 'AI Mock generated successfully',
      promptReceived: body.prompt
    }
  }, {
    body: t.Object({
      prompt: t.String()
    })
  })

export type App = typeof app
