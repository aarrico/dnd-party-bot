import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  schema: join(__dirname, 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL || '',
  },
})
