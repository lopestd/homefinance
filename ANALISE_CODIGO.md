# Análise de Código - HomeFinance

**Data da Análise:** 14/02/2026  
**Versão do Documento:** 1.0  
**Escopo:** Backend, Frontend e Configurações (.env)

---

## Sumário Executivo

Esta análise identificou **12 achados** distribuídos entre código de debug remanescente, configurações hardcoded, exposição de credenciais sensíveis e práticas que necessitam melhoria. Os achados foram classificados por severidade: **Crítico (2)**, **Alto (2)**, **Médio (4)** e **Baixo (4)**.

---

## 1. Achados Críticos

### 1.1 Credenciais de Produção Expostas no Arquivo .env

**Severidade:** CRÍTICO  
**Arquivo:** [`.env`](.env)  
**Linhas:** 1-8

**Descrição:**  
O arquivo `.env` contém credenciais reais de banco de dados de produção:
- Host do banco de dados: `pgadmin4.esteiraweb.com.br`
- Porta: `5434`
- Nome do banco: `dsadb`
- Usuário: `dsa`
- Senha: `dsa1010`
- JWT Secret: `teste@2026!$`

**Risco:**  
Exposição total das credenciais do banco de dados e segredo JWT. Qualquer pessoa com acesso ao repositório pode:
- Acessar o banco de dados de produção
- Ler, modificar ou excluir dados
- Forjar tokens JWT de autenticação

**Recomendação Negocial:**  
1. Rotacionar imediatamente todas as credenciais expostas
2. Utilizar gerenciador de segredos (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
3. Criar arquivo `.env.example` com estrutura template (sem valores reais)

**Recomendação Técnica:**
```bash
# 1. Remover credenciais do controle de versão
git rm --cached .env

# 2. Criar template
cp .env .env.example
# Editar .env.example removendo valores sensíveis

# 3. Adicionar ao .gitignore (já existe, mas verificar se está funcionando)
```

---

### 1.2 Código de Debug/Diagnóstico em Produção

**Severidade:** CRÍTICO  
**Arquivo:** [`backend/src/services/configService.js`](backend/src/services/configService.js)  
**Linhas:** 110-115, 136-140, 161-165, 358-359, 394-395, 428-429

**Descrição:**  
Múltiplos statements `console.log` com prefixo `[DIAGNOSTIC]` foram identificados, claramente inseridos para depuração de problemas com conversão de datas:

```javascript
// Linhas 110-115
if (row.data) {
  console.log('[DIAGNOSTIC] Receita ID:', row.id, '- Original date from DB:', row.data, '- Type:', typeof row.data);
  console.log('[DIAGNOSTIC] Receita ID:', row.id, '- toISOString():', row.data.toISOString());
  console.log('[DIAGNOSTIC] Receita ID:', row.id, '- Final date string:', row.data.toISOString().slice(0, 10));
}
```

**Risco:**  
- Exposição de estrutura interna de dados nos logs
- Poluição dos logs de produção
- Possível vazamento de IDs e datas de registros
- Impacto na performance

**Recomendação Negocial:**  
Remover todo código de diagnóstico antes de deploy em produção. Implementar processo de code review para evitar commits de código de debug.

**Recomendação Técnica:**
```javascript
// REMOVER todas as ocorrências como:
console.log('[DIAGNOSTIC] ...');

// Substituir por sistema de logging adequado se necessário:
// Exemplo com winston ou pino:
logger.debug('Date conversion', { id: row.id, type: typeof row.data });
```

---

## 2. Achados de Alta Severidade

### 2.1 JWT Secret Fraco

**Severidade:** ALTO  
**Arquivo:** [`.env`](.env)  
**Linha:** 6

**Descrição:**  
O segredo JWT `teste@2026!$` aparenta ser um valor de teste/desenvolvimento, sendo previsível e fraco.

**Risco:**  
Tokens JWT podem ser forjados por atacantes que consigam adivinhar ou descobrir o segredo, permitindo:
- Impersonação de usuários
- Elevação de privilégios
- Bypass de autenticação

**Recomendação Negocial:**  
Gerar segredo JWT criptograficamente seguro com no mínimo 256 bits (32 bytes).

**Recomendação Técnica:**
```bash
# Gerar novo segredo seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou usando openssl
openssl rand -hex 64
```

---

### 2.2 Porta do Servidor Hardcoded

**Severidade:** ALTO  
**Arquivo:** [`backend/server.js`](backend/server.js)  
**Linha:** 5

**Descrição:**  
A porta do servidor está hardcoded como `3000`:

```javascript
const PORT = 3000;
```

**Risco:**  
- Inflexibilidade para deploy em diferentes ambientes
- Conflitos com outros serviços
- Dificuldade para orquestração em containers

**Recomendação Negocial:**  
Utilizar variável de ambiente para configuração de porta, permitindo flexibilidade entre ambientes.

**Recomendação Técnica:**
```javascript
const PORT = process.env.PORT || 3000;
```

---

## 3. Achados de Média Severidade

### 3.1 URL do Backend Hardcoded no Frontend

**Severidade:** MÉDIO  
**Arquivo:** [`frontend/vite.config.js`](frontend/vite.config.js)  
**Linha:** 18

**Descrição:**  
A URL do backend está hardcoded no proxy do Vite:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

**Risco:**  
- Configuração inflexível para diferentes ambientes
- Necessidade de alteração de código para deploy

**Recomendação Negocial:**  
Utilizar variáveis de ambiente do Vite para configurar o proxy dinamicamente.

**Recomendação Técnica:**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

---

### 3.2 Console.error em Controladores

**Severidade:** MÉDIO  
**Arquivo:** [`backend/src/controllers/configController.js`](backend/src/controllers/configController.js)  
**Linhas:** 8, 18, 28, 46, 67, 80, 90, 105, 127, 140, 150, 167, 188, 201

**Descrição:**  
Múltiplos usos de `console.error` para logging de erros:

```javascript
console.error("GET /api/config failed", error);
```

**Risco:**  
- Logs não estruturados dificultam análise e monitoramento
- Sem níveis de log adequados
- Sem rotação de logs
- Dificulta integração com ferramentas de observabilidade

**Recomendação Negocial:**  
Implementar biblioteca de logging estruturado com níveis (debug, info, warn, error) e formatação JSON.

**Recomendação Técnica:**
```javascript
// Instalar winston ou pino
// npm install winston

const logger = require('../utils/logger');

// Substituir console.error por:
logger.error('GET /api/config failed', { 
  error: error.message, 
  stack: error.stack,
  userId: req.user?.id 
});
```

---

### 3.3 Porta do Frontend Hardcoded

**Severidade:** MÉDIO  
**Arquivo:** [`frontend/vite.config.js`](frontend/vite.config.js)  
**Linha:** 14

**Descrição:**  
A porta do servidor de desenvolvimento Vite está hardcoded:

```javascript
server: {
  port: 5173,
  strictPort: true,
}
```

**Risco:**  
- Conflitos com outros serviços
- Infraestrutura menos flexível

**Recomendação Negocial:**  
Permitir configuração via variável de ambiente.

**Recomendação Técnica:**
```javascript
server: {
  port: parseInt(process.env.FRONTEND_PORT || '5173'),
  strictPort: true,
}
```

---

### 3.4 Ausência de Validação de Entrada Robusta

**Severidade:** MÉDIO  
**Arquivos:** [`backend/src/controllers/configController.js`](backend/src/controllers/configController.js)  
**Múltiplas linhas**

**Descrição:**  
A validação de entrada nos controladores é mínima, verificando apenas se campos obrigatórios existem:

```javascript
const nome = req.body?.nome?.trim();
const tipo = req.body?.tipo;
if (!nome || !tipo) {
  return res.status(400).json({ error: "Dados inválidos" });
}
```

**Risco:**  
- Possibilidade de injection attacks
- Dados malformados podem causar erros
- Falta de sanitização de entrada

**Recomendação Negocial:**  
Implementar validação de esquema usando bibliotecas como Joi, Zod ou express-validator.

**Recomendação Técnica:**
```javascript
// Usando Joi
const Joi = require('joi');

const categoriaSchema = Joi.object({
  nome: Joi.string().trim().min(1).max(100).required(),
  tipo: Joi.string().valid('DESPESA', 'RECEITA').required()
});

const { error, value } = categoriaSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

---

## 4. Achados de Baixa Severidade

### 4.1 Duplicação de Constantes de Meses

**Severidade:** BAIXO  
**Arquivos:** 
- [`backend/src/utils/backendUtils.js`](backend/src/utils/backendUtils.js) - Linhas 3-16
- [`frontend/src/utils/appUtils.js`](frontend/src/utils/appUtils.js) - Linhas 1-4
- [`frontend/src/pages/CartaoPage.jsx`](frontend/src/pages/CartaoPage.jsx) - Linhas 87-90
- [`frontend/src/pages/ConfiguracoesPage.jsx`](frontend/src/pages/ConfiguracoesPage.jsx) - Linhas 39-42

**Descrição:**  
O array de meses está duplicado em múltiplos arquivos:

```javascript
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
```

**Risco:**  
- Inconsistência se houver alterações
- Violação do princípio DRY (Don't Repeat Yourself)

**Recomendação Negocial:**  
Centralizar constantes em local único e importar onde necessário.

**Recomendação Técnica:**
```javascript
// Criar frontend/src/constants/index.js
export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Importar nos demais arquivos
import { MONTHS } from '../constants';
```

---

### 4.2 Tratamento de Erros Genérico

**Severidade:** BAIXO  
**Arquivo:** [`backend/src/controllers/authController.js`](backend/src/controllers/authController.js)  
**Linhas:** 7-9, 16-18, 29-31, 51-53

**Descrição:**  
O tratamento de erros retorna mensagens genéricas sem detalhes:

```javascript
} catch (error) {
  return res.status(500).json({ sucesso: false, erro: "ERRO_INTERNO" });
}
```

**Risco:**  
- Dificulta debugging em produção
- Usuário não tem informação útil

**Recomendação Negocial:**  
Implementar tratamento de erros diferenciado com logging adequado e mensagens mais descritivas (sem expor detalhes internos).

**Recomendação Técnica:**
```javascript
} catch (error) {
  logger.error('Auth controller error', { 
    action: 'login', 
    error: error.message,
    stack: error.stack 
  });
  
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ 
      sucesso: false, 
      erro: "ERRO_INTERNO",
      detalhe: error.message 
    });
  }
  
  return res.status(500).json({ 
    sucesso: false, 
    erro: "ERRO_INTERNO",
    mensagem: "Ocorreu um erro inesperado. Tente novamente." 
  });
}
```

---

### 4.3 Ausência de Rate Limiting Geral

**Severidade:** BAIXO  
**Arquivo:** [`backend/src/routes/configRoutes.js`](backend/src/routes/configRoutes.js)

**Descrição:**  
O rate limiting está implementado apenas para rotas de autenticação (`authLimiter`), mas não para as rotas de configuração.

**Risco:**  
- Rotas de API sem proteção contra abuso
- Possibilidade de DoS em endpoints de configuração

**Recomendação Negocial:**  
Estender rate limiting para todas as rotas da API com limites apropriados.

**Recomendação Técnica:**
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas requisições. Tente novamente mais tarde."
  }
});

// Aplicar a todas as rotas
router.use(apiLimiter);
```

---

### 4.4 Comentários de Código Remanescentes

**Severidade:** BAIXO  
**Arquivo:** [`backend/src/services/configService.js`](backend/src/services/configService.js)  
**Linhas:** 110, 136, 161, 358, 394, 428

**Descrição:**  
Comentários indicando código de diagnóstico:

```javascript
// DIAGNOSTIC LOG: Check date conversion
// DIAGNOSTIC LOG: Check date being saved
```

**Risco:**  
- Código "morto" na aplicação
- Indica falta de limpeza antes do commit

**Recomendação Negocial:**  
Remover todos os comentários de debug e código relacionado.

**Recomendação Técnica:**
```javascript
// REMOVER completamente linhas com:
// DIAGNOSTIC LOG: ...
```

---

## 5. Resumo de Achados

| ID | Achado | Severidade | Arquivo | Status |
|----|--------|------------|---------|--------|
| 1.1 | Credenciais expostas no .env | CRÍTICO | .env | Pendente |
| 1.2 | Código de debug em produção | CRÍTICO | configService.js | Pendente |
| 2.1 | JWT Secret fraco | ALTO | .env | Pendente |
| 2.2 | Porta hardcoded | ALTO | server.js | Pendente |
| 3.1 | URL backend hardcoded | MÉDIO | vite.config.js | Pendente |
| 3.2 | Console.error em controladores | MÉDIO | configController.js | Pendente |
| 3.3 | Porta frontend hardcoded | MÉDIO | vite.config.js | Pendente |
| 3.4 | Validação de entrada fraca | MÉDIO | configController.js | Pendente |
| 4.1 | Duplicação de constantes | BAIXO | Múltiplos | Pendente |
| 4.2 | Tratamento de erros genérico | BAIXO | authController.js | Pendente |
| 4.3 | Rate limiting parcial | BAIXO | configRoutes.js | Pendente |
| 4.4 | Comentários de debug | BAIXO | configService.js | Pendente |

---

## 6. Plano de Ação Recomendado

### Imediato (0-7 dias)
1. **Rotacionar todas as credenciais** do arquivo .env
2. **Remover código de diagnóstico** do configService.js
3. **Gerar novo JWT Secret** seguro

### Curto Prazo (7-30 dias)
4. Implementar variáveis de ambiente para portas e URLs
5. Implementar sistema de logging estruturado
6. Adicionar validação de entrada com Joi/Zod

### Médio Prazo (30-60 dias)
7. Refatorar constantes duplicadas
8. Estender rate limiting para todas as rotas
9. Melhorar tratamento de erros

### Longo Prazo (60+ dias)
10. Implementar gerenciador de segredos
11. Configurar pipeline de CI/CD com validação de código de debug

---

## 7. Conclusão

A aplicação HomeFinance apresenta uma arquitetura sólida com separação adequada de responsabilidades. No entanto, foram identificados pontos críticos de segurança relacionados à exposição de credenciais e código de debug remanescente que necessitam atenção imediata.

A implementação das recomendações propostas elevará significativamente o nível de segurança e manutenibilidade do código, preparando a aplicação para ambientes de produção com maior confiabilidade.

---

**Documento gerado por:** Análise automatizada de código  
**Revisão recomendada:** Equipe de desenvolvimento e segurança
