import app from './app.js'
import { env } from './config/env.js'

app.listen(env.port, () => {
  console.log(`Billing API running on http://localhost:${env.port}`)
  console.log(`Health: http://localhost:${env.port}/api/health`)
})
