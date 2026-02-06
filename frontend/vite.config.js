import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storePath = path.resolve(__dirname, '..', 'data', 'store.json')

const createEmptyStore = () => ({
  meta: {
    version: 1,
    lastIds: {
      orcamento: 0,
      orcamentoMes: 0,
      categoria: 0,
      gastoPredefinido: 0,
      tipoReceita: 0,
      receita: 0,
      despesa: 0,
      cartao: 0,
      cartaoMes: 0,
      cartaoLancamento: 0,
    },
  },
  orcamentos: [],
  orcamentoMeses: [],
  categorias: [],
  gastosPredefinidos: [],
  tiposReceita: [],
  receitas: [],
  despesas: [],
  cartoes: [],
  cartaoMeses: [],
  cartaoLancamentos: [],
  frontendConfig: {
    categorias: [],
    gastosPredefinidos: [],
    tiposReceita: [],
    orcamentos: [],
    receitas: [],
    despesas: [],
    cartoes: [],
    lancamentosCartao: [],
  },
})

const normalizeConfig = (input) => ({
  categorias: Array.isArray(input?.categorias) ? input.categorias : [],
  gastosPredefinidos: Array.isArray(input?.gastosPredefinidos) ? input.gastosPredefinidos : [],
  tiposReceita: Array.isArray(input?.tiposReceita) ? input.tiposReceita : [],
  orcamentos: Array.isArray(input?.orcamentos) ? input.orcamentos : [],
  receitas: Array.isArray(input?.receitas) ? input.receitas : [],
  despesas: Array.isArray(input?.despesas) ? input.despesas : [],
  cartoes: Array.isArray(input?.cartoes) ? input.cartoes : [],
  lancamentosCartao: Array.isArray(input?.lancamentosCartao) ? input.lancamentosCartao : [],
})

const normalizeStore = (store) => {
  const base = createEmptyStore()
  const merged = { ...base, ...store }
  merged.meta = store?.meta ?? base.meta
  merged.frontendConfig = normalizeConfig(store?.frontendConfig)
  return merged
}

const readStore = async () => {
  try {
    const raw = await fs.readFile(storePath, 'utf-8')
    return normalizeStore(JSON.parse(raw))
  } catch (error) {
    if (error?.code === 'ENOENT') {
      const empty = createEmptyStore()
      await writeStore(empty)
      return empty
    }
    throw error
  }
}

const writeStore = async (store) => {
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf-8')
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      if (!data) return resolve({})
      try {
        resolve(JSON.parse(data))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })

const configStoragePlugin = () => ({
  name: 'config-storage',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = req.url ? req.url.split('?')[0] : ''
      if (pathname !== '/api/config') return next()
      try {
        if (req.method === 'GET') {
          const store = await readStore()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(store.frontendConfig))
          return
        }
        if (req.method === 'PUT') {
          const body = await readBody(req)
          const store = await readStore()
          store.frontendConfig = normalizeConfig(body)
          await writeStore(store)
          res.statusCode = 204
          res.end()
          return
        }
        res.statusCode = 405
        res.end()
      } catch {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ message: 'Erro ao persistir configuração.' }))
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    configStoragePlugin(),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
})
