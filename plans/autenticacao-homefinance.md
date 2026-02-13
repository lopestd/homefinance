# Especificação de Autenticação - HomeFinance

## 1. Visão Geral

Este documento especifica a implementação de um sistema de autenticação simples baseado em **email e senha** para o sistema HomeFinance, incluindo medidas de segurança para proteger contra invasões.

### 1.1 Escopo
- Autenticação de usuários via email + senha
- Proteção de dados financeiros do usuário
- Prevenção contra ataques comuns de autenticação
- Gerenciamento de sessões seguro

---

## 2. Modelo de Dados

### 2.1 Tabela `usuarios` (PostgreSQL)

```sql
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    nome VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    tentativas_login INTEGER DEFAULT 0,
    bloqueado_ate TIMESTAMP,
    ultimo_login TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices
CREATE INDEX idx_usuarios_email ON usuarios(LOWER(email));
CREATE UNIQUE INDEX idx_usuarios_email_unique ON usuarios(LOWER(email));
```

### 2.2 Tabela `sessoes` (Opcional - para invalidação de tokens)

```sql
CREATE TABLE sessoes (
    id_sessao SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    dispositivo VARCHAR(255),
    ip_origem VARCHAR(45),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT fk_sessao_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE INDEX idx_sessoes_token ON sessoes(token_hash);
CREATE INDEX idx_sessoes_usuario ON sessoes(id_usuario);
```

### 2.3 Tabela `audit_log` (Rastreabilidade)

```sql
CREATE TABLE audit_log (
    id_log SERIAL PRIMARY KEY,
    id_usuario INTEGER,
    acao VARCHAR(50) NOT NULL,
    detalhes JSONB,
    ip_origem VARCHAR(45),
    user_agent VARCHAR(500),
    data_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

CREATE INDEX idx_audit_usuario ON audit_log(id_usuario);
CREATE INDEX idx_audit_data ON audit_log(data_evento);
```

---

## 3. Requisitos de Segurança

### 3.1 Senhas

| Requisito | Especificação |
|-----------|---------------|
| Comprimento mínimo | 8 caracteres |
| Comprimento máximo | 128 caracteres |
| Complexidade | Pelo menos 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial |
| Algoritmo de hash | Argon2id (preferencial) ou bcrypt com custo 12+ |
| Salt | Único por usuário, 32 bytes aleatórios |

**Exemplo de validação de senha:**
```javascript
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;
```

### 3.2 Proteção contra Ataques

#### 3.2.1 Brute Force / Password Guessing
- **Rate limiting**: Máximo 5 tentativas por 15 minutos por IP
- **Account lockout**: Após 5 falhas, bloquear conta por 30 minutos
- **Delay progressivo**: Aumentar tempo de resposta a cada falha

#### 3.2.2 SQL Injection
- Usar **prepared statements** / parâmetros vinculados
- Nunca concatenar entrada do usuário em queries
- Validar e sanitizar todos os inputs

#### 3.2.3 XSS (Cross-Site Scripting)
- **Content Security Policy (CSP)** header
- Sanitização de outputs no frontend
- Cookies com **HttpOnly** e **Secure** quando utilizados

#### 3.2.4 CSRF (Cross-Site Request Forgery)
- Necessário apenas quando o token for armazenado em cookie
- Validar header `Origin` ou `Referer` quando aplicável
- SameSite cookie attribute quando aplicável

#### 3.2.5 Session Hijacking
- Regenerar ID de sessão após login
- Vincular sessão ao IP e User-Agent
- Timeout de sessão: 30 minutos de inatividade
- Logout automático após 24 horas

#### 3.2.6 Man-in-the-Middle
- **HTTPS obrigatório** (TLS 1.2+)
- HSTS header (HTTP Strict Transport Security)
- Secure cookies

---

## 4. Fluxo de Autenticação

### 4.1 Diagrama de Sequência - Login

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Entra email/senha
    F->>F: Valida formato inputs
    F->>B: POST /api/auth/login
    Note over B: Rate limit check por IP
    B->>DB: Busca usuario por email
    DB-->>B: Dados do usuario
    Note over B: Verifica se conta bloqueada
    B->>B: Verifica senha com Argon2id
    alt Senha incorreta
        B->>DB: Incrementa tentativas
        B-->>F: 401 Unauthorized
        F-->>U: Credenciais invalidas
    else Senha correta
        B->>DB: Reseta tentativas, atualiza ultimo_login
        B->>B: Gera JWT token
        B->>DB: Registra sessao e audit log
        B-->>F: 200 OK + token
        F->>F: Armazena token e envia via Authorization Bearer
        F-->>U: Redireciona para dashboard
    end
```

### 4.2 Diagrama de Sequência - Logout

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Clica em Sair
    F->>B: POST /api/auth/logout
    B->>B: Valida token JWT
    B->>DB: Invalida sessao
    B->>DB: Registra audit log
    B-->>F: 200 OK
    F->>F: Remove token armazenado
    F-->>U: Redireciona para login
```

---

## 5. APIs e Endpoints

### 5.1 POST `/api/auth/login`

**Request:**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "SenhaSegura@123",
  "lembrar": false
}
```

**Response (Sucesso - 200):**
```json
{
  "sucesso": true,
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "usuario@exemplo.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiraEm": "2026-02-10T18:00:00Z"
}
```

**Response (Erro - 401):**
```json
{
  "sucesso": false,
  "erro": "CREDENCIAIS_INVALIDAS",
  "mensagem": "Email ou senha incorretos"
}
```

**Response (Bloqueado - 423):**
```json
{
  "sucesso": false,
  "erro": "CONTA_BLOQUEADA",
  "mensagem": "Conta temporariamente bloqueada. Tente novamente em 28 minutos"
}
```

### 5.2 POST `/api/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "sucesso": true,
  "mensagem": "Logout realizado com sucesso"
}
```

### 5.3 POST `/api/auth/registrar`

**Request:**
```json
{
  "nome": "João Silva",
  "email": "usuario@exemplo.com",
  "senha": "SenhaSegura@123",
  "confirmarSenha": "SenhaSegura@123"
}
```

**Response (201):**
```json
{
  "sucesso": true,
  "mensagem": "Conta criada com sucesso. Verifique seu email."
}
```

### 5.4 GET `/api/auth/verificar`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "valido": true,
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "usuario@exemplo.com"
  }
}
```

### 5.5 POST `/api/auth/alterar-senha`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request:**
```json
{
  "senhaAtual": "SenhaAntiga@123",
  "novaSenha": "NovaSenha@456",
  "confirmarNovaSenha": "NovaSenha@456"
}
```

---

## 6. Middleware de Autenticação

### 6.1 Estrutura do Token JWT

```javascript
const jwtPayload = {
  sub: 1,              // ID do usuário
  email: "usuario@exemplo.com",
  iat: 1707504000,     // Issued at
  exp: 1707590400,     // Expiration
  jti: "unique-token-id" // JWT ID para revogação
};
```

### 6.2 Headers de Segurança (Helmet)

```javascript
// Headers HTTP recomendados
{
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

### 6.3 Variáveis de ambiente

- `JWT_SECRET` (obrigatório)
- `JWT_EXPIRES_MIN` (minutos de expiração da sessão)
- `JWT_MAX_HOURS` (limite máximo absoluto da sessão)

---

## 7. Frontend - Tela de Login

### 7.1 Componentes Necessários

1. **LoginPage.jsx** - Página de login
2. **RegisterPage.jsx** - Página de registro
3. **AuthContext.jsx** - Contexto de autenticação
4. **PrivateRoute.jsx** - HOC para rotas protegidas
5. **useAuth.js** - Hook de autenticação

### 7.2 Estrutura da Tela de Login

```
┌─────────────────────────────────────────┐
│           HomeFinance                    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Email                          │   │
│  │  [________________________]     │   │
│  │                                 │   │
│  │  Senha                          │   │
│  │  [________________________] 👁️  │   │
│  │                                 │   │
│  │  ☐ Lembrar de mim              │   │
│  │                                 │   │
│  │  [        ENTRAR        ]       │   │
│  │                                 │   │
│  │  Esqueceu a senha?              │   │
│  │                                 │   │
│  │  ─────────────────────────      │   │
│  │  Não tem conta? Criar conta     │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 7.3 Validações no Frontend

```javascript
const validacoes = {
  email: {
    required: "Email é obrigatório",
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    mensagem: "Email inválido"
  },
  senha: {
    required: "Senha é obrigatória",
    minLength: { value: 8, message: "Mínimo 8 caracteres" }
  }
};
```

---

## 8. Dependências Necessárias

### 8.1 Backend (Node.js)

```json
{
  "dependencies": {
    "argon2": "^0.31.0",
    "jsonwebtoken": "^9.0.0",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.5"
  }
}
```

### 8.2 Frontend (React)

```json
{
  "dependencies": {
    "react-router-dom": "^6.0.0",
    "react-hook-form": "^7.0.0",
    "axios": "^1.6.0"
  }
}
```

---

## 9. Arquitetura de Autenticação

### 9.1 Diagrama de Componentes

```mermaid
flowchart TB
    subgraph Frontend
        LP[LoginPage]
        RP[RegisterPage]
        AC[AuthContext]
        PR[PrivateRoute]
    end
    
    subgraph Backend
        AUTH[authService.js]
        USER[usuarioService.js]
        MW[authMiddleware.js]
        RL[rateLimiter.js]
    end
    
    subgraph Database
        UT[usuarios]
        ST[sessoes]
        AT[audit_log]
    end
    
    LP -->|POST /api/auth/login| RL
    RL --> AUTH
    AUTH --> UT
    AUTH --> ST
    AUTH --> AT
    
    PR -->|GET /api/auth/verificar| MW
    MW --> AUTH
    
    AC -->|Armazena token| LP
    AC -->|Verifica auth| PR
```

---

## 10. Checklist de Implementação

### Backend
- [ ] Criar tabela `usuarios` no banco
- [ ] Criar tabela `sessoes` no banco
- [ ] Criar tabela `audit_log` no banco
- [ ] Implementar `usuarioService.js` (CRUD de usuários)
- [ ] Implementar `authService.js` (login, logout, registro)
- [ ] Implementar hash de senha com Argon2id
- [ ] Implementar geração/validação de JWT
- [ ] Implementar middleware de autenticação
- [ ] Implementar rate limiting
- [ ] Configurar headers de segurança (Helmet)
- [ ] Implementar CSRF protection
- [ ] Criar rotas de autenticação

### Frontend
- [ ] Criar `AuthContext.jsx`
- [ ] Criar `LoginPage.jsx`
- [ ] Criar `RegisterPage.jsx`
- [ ] Criar `PrivateRoute.jsx`
- [ ] Criar hook `useAuth.js`
- [ ] Implementar interceptadores Axios para token
- [ ] Proteger rotas existentes
- [ ] Adicionar botão de logout no header

### Testes
- [ ] Testes unitários para authService
- [ ] Testes de integração para rotas de auth
- [ ] Testes de segurança (penetration testing básico)

---

## 11. Considerações Adicionais

### 11.1 Multi-usuário
O sistema atual não possui conceito de usuário. Após implementar autenticação, será necessário:
- Adicionar `id_usuario` em todas as tabelas existentes
- Modificar todas as queries para filtrar por usuário
- Migrar dados existentes para um usuário padrão

### 11.2 Recuperação de Senha (Futuro)
Para uma implementação completa, considerar:
- Envio de email com link de recuperação
- Tokens de uso único com expiração
- Perguntas de segurança (opcional)

### 11.3 Autenticação em Dois Fatores (Futuro)
Para maior segurança:
- TOTP (Google Authenticator, Authy)
- SMS como fallback
- Backup codes

---

## 12. Próximos Passos

1. **Aprovar especificação** com o usuário
2. **Criar scripts SQL** para as novas tabelas
3. **Implementar backend** (services, middleware, rotas)
4. **Implementar frontend** (páginas, contexto, proteção)
5. **Testar** fluxo completo
6. **Documentar** uso da API
