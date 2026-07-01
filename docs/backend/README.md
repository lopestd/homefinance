# Backend

## 1. Visao Geral

Backend Node.js com Express e PostgreSQL.

Responsabilidades:

- autenticar usuarios;
- proteger rotas por token;
- carregar configuracao consolidada;
- persistir configuracoes;
- gerenciar receitas;
- gerenciar despesas;
- gerenciar lancamentos de cartao;
- criar parcelamentos entre orcamentos;
- sincronizar faturas de cartao com despesas;
- calcular saldo acumulado.

## 2. Estrutura

| Caminho | Responsabilidade |
|---|---|
| `backend/server.js` | Inicializa servidor e porta. |
| `backend/src/config/app.js` | Configura Express, CORS, Helmet, JSON, rate limit, rotas e frontend estatico. |
| `backend/src/config/authConfig.js` | Configura JWT, expiracao e regra de senha. |
| `backend/src/routes` | Define rotas HTTP. |
| `backend/src/controllers` | Trata request/response e status HTTP. |
| `backend/src/services` | Regras de negocio, validacoes e transacoes. |
| `backend/src/repositories` | Acesso SQL ao PostgreSQL. |
| `backend/src/storage/db.js` | Pool PostgreSQL. |
| `backend/src/validators/schemas.js` | Validacoes Joi de configuracao. |

## 3. Camadas Internas

| Camada | Papel | Regra de manutencao |
|---|---|---|
| Rotas | Expor os endpoints HTTP e aplicar autenticacao. | Nao deve conter regra de negocio. |
| Controllers | Ler parametros, chamar servicos e responder status HTTP. | Deve manter tratamento de entrada/saida simples. |
| Services | Concentrar regra de negocio, validacao composta e transacao. | Toda mudanca funcional deve passar por esta camada. |
| Repositories | Executar SQL e mapear registros do PostgreSQL. | Deve sempre filtrar por usuario quando o dado for do usuario. |
| Validators | Validar payloads estruturais reutilizaveis. | Validacoes de dominio continuam nos services. |
| Middlewares | Aplicar seguranca, autenticacao, rate limit e protecoes transversais. | Nao deve depender de regra especifica de uma tela. |

Arquivos principais:

| Arquivo | Papel |
|---|---|
| `authController.js` / `authService.js` / `authRepository.js` | Cadastro, login, sessao, troca de senha e auditoria. |
| `configController.js` / `configService.js` / `configRepository.js` | Configuracoes, orcamentos, cartoes, categorias e modelos pre-definidos. |
| `receitasController.js` / `batchCreateService.js` | Criacao, edicao, status, lote e exclusao de receitas. |
| `despesasController.js` / `despesasService.js` / `despesasRepository.js` | Criacao, edicao, status, lote e exclusao de despesas. |
| `lancamentosCartaoController.js` / `batchCreateService.js` | Lancamentos, fixos, parcelados, faturas e sincronizacao com despesas. |
| `saldoController.js` / `saldoService.js` / `saldoRepository.js` | Saldo inicial e saldo acumulado por orcamento. |

## 4. Configuracao de Ambiente

Variaveis principais:

| Variavel | Uso |
|---|---|
| `PORT` | Porta HTTP do backend. |
| `DB_HOST` | Host PostgreSQL. |
| `DB_PORT` | Porta PostgreSQL. |
| `DB_NAME` | Nome do banco. |
| `DB_USER` | Usuario do banco. |
| `DB_PASS` | Senha do banco. |
| `JWT_SECRET` | Chave para assinar tokens. |
| `JWT_EXPIRES_MIN` | Expiracao curta da sessao. |
| `JWT_MAX_HOURS` | Limite absoluto da sessao. |
| `ALLOWED_ORIGINS` | Origens permitidas no CORS. |
| `PAYLOAD_LIMIT` | Limite de payload JSON. |

Nao documentar valores reais dessas variaveis.

## 5. Middleware e Seguranca

- `helmet`: headers de seguranca.
- `cors`: restringe origens permitidas.
- `express.json`: leitura de payload JSON.
- `apiLimiter`: limita chamadas gerais em `/api`.
- `authLimiter`: limita tentativas de login.
- `authenticate`: valida Bearer token, sessao ativa e usuario.

Regra: controllers de negocio devem usar `authenticate`.

## 6. Rotas

### Autenticacao - `/api/auth`

| Metodo | Rota | Entrada | Saida |
|---|---|---|---|
| `POST` | `/registrar` | nome, email, senha, confirmarSenha | usuario criado ou erro. |
| `POST` | `/login` | email, senha, lembrar | token, usuario e expiracao. |
| `POST` | `/logout` | token autenticado | sessao inativada. |
| `GET` | `/verificar` | token autenticado | usuario valido e possivel token renovado. |
| `POST` | `/alterar-senha` | senhaAtual, novaSenha, confirmarNovaSenha | senha alterada e sessoes antigas inativadas. |

### Configuracao - `/api/config`

| Metodo | Rota | Uso |
|---|---|---|
| `GET` | `/` | Carrega configuracao consolidada do usuario. |
| `PUT` | `/` | Salva configuracao completa ou parcial. |
| `GET` | `/categorias` | Lista categorias. |
| `POST` | `/categorias` | Cria categoria. |
| `PUT` | `/categorias/:id` | Atualiza categoria. |
| `DELETE` | `/categorias/:id` | Inativa/remove categoria. |
| `GET` | `/gastos-predefinidos` | Lista gastos pre-definidos. |
| `POST` | `/gastos-predefinidos` | Cria gasto pre-definido. |
| `PUT` | `/gastos-predefinidos/:id` | Atualiza gasto pre-definido. |
| `DELETE` | `/gastos-predefinidos/:id` | Inativa/remove gasto pre-definido. |
| `GET` | `/tipos-receita` | Lista receitas pre-definidas. |
| `POST` | `/tipos-receita` | Cria receita pre-definida. |
| `PUT` | `/tipos-receita/:id` | Atualiza receita pre-definida. |
| `DELETE` | `/tipos-receita/:id` | Inativa/remove receita pre-definida. |

### Receitas - `/api`

| Metodo | Rota | Uso |
|---|---|---|
| `GET` | `/receitas` | Lista receitas. |
| `POST` | `/receitas` | Cria receita unica. |
| `POST` | `/receitas/lote` | Cria receitas em lote. |
| `PUT` | `/receitas/:id` | Atualiza receita. |
| `PUT` | `/receitas/:id/status` | Atualiza status. |
| `DELETE` | `/receitas/:id` | Exclui receita. |

### Despesas - `/api`

| Metodo | Rota | Uso |
|---|---|---|
| `GET` | `/despesas` | Lista despesas. |
| `POST` | `/despesas` | Cria despesa unica. |
| `POST` | `/despesas/lote` | Cria despesas em lote. |
| `PUT` | `/despesas/:id` | Atualiza despesa. |
| `PUT` | `/despesas/:id/status` | Atualiza status. |
| `DELETE` | `/despesas/:id` | Exclui despesa. |

### Cartoes - `/api`

| Metodo | Rota | Uso |
|---|---|---|
| `GET` | `/lancamentos-cartao` | Lista lancamentos de cartao. |
| `POST` | `/lancamentos-cartao` | Cria lancamento unico. |
| `POST` | `/lancamentos-cartao/lote` | Cria lancamentos em lote. |
| `POST` | `/lancamentos-cartao/parcelamento` | Cria parcelamento entre orcamentos. |
| `PUT` | `/lancamentos-cartao/:id` | Atualiza lancamento. |
| `DELETE` | `/lancamentos-cartao/:id` | Exclui lancamento. |

### Saldo - `/api`

| Metodo | Rota | Uso |
|---|---|---|
| `GET` | `/saldo-acumulado` | Calcula saldo por orcamento e ano. |
| `GET` | `/saldo-inicial-orcamento` | Lista saldos iniciais. |
| `PUT` | `/saldo-inicial-orcamento` | Cria ou atualiza saldo inicial. |

## 7. Servicos

### `authService`

Responsabilidades:

- normalizar email;
- validar senha forte;
- criar usuario;
- autenticar credenciais;
- gerar JWT;
- persistir sessao por hash do token;
- renovar token;
- validar sessao ativa;
- trocar senha;
- registrar eventos de auditoria.

Regras criticas:

- token sem sessao ativa deve ser recusado;
- sessao expirada deve ser inativada;
- troca de senha deve inativar sessoes antigas.

### `configService`

Responsabilidades:

- carregar payload consolidado da aplicacao;
- persistir configuracao parcial ou completa;
- salvar orcamentos e meses;
- salvar cartoes, limites e faturas;
- salvar receitas/despesas quando vierem por configuracao;
- expor CRUDs auxiliares de categoria, gastos e tipos de receita.

Regras criticas:

- operacoes compostas usam transacao;
- algumas operacoes usam lock por usuario;
- faturas fechadas devem ser salvas por cartao, orcamento e mes;
- payload legado de faturas/limites pode exigir compatibilidade.

### `batchCreateService`

Responsabilidades:

- validar payload de receita/despesa/lancamento;
- criar lotes;
- atualizar receita;
- atualizar status de receita;
- criar, atualizar e excluir lancamentos de cartao;
- criar parcelamento de cartao entre orcamentos;
- sincronizar despesas tecnicas de fatura.

Regras criticas:

- validar existencia de categoria, orcamento e cartao;
- validar orcamento do ano/mes de cada parcela;
- bloquear parcela em fatura fechada;
- usar transacao em operacoes compostas;
- usar lock por usuario onde ha risco de concorrencia.

### `despesasService`

Responsabilidades:

- listar despesas com categoria e meses;
- criar despesa unica;
- delegar lote ao servico de lote;
- atualizar despesa;
- atualizar status;
- excluir despesa.

Regras criticas:

- status valido: `Pendente` ou `Pago`;
- categoria e orcamento devem existir para o usuario;
- atualizacao recria vinculos de meses.

### `saldoService`

Responsabilidades:

- listar saldo inicial;
- atualizar saldo inicial;
- calcular saldo acumulado por mes.

Regras criticas:

- considerar apenas receitas recebidas;
- considerar apenas despesas pagas;
- respeitar meses habilitados no orcamento;
- carregar saldo final de um mes para o mes seguinte.

## 8. Contratos de Payload

Os exemplos abaixo sao estruturais e nao usam dados reais.

### Receita

| Campo | Tipo | Obrigatorio | Observacao |
|---|---|---|---|
| `orcamentoId` | number/string | Sim | Orcamento do usuario. |
| `mes` | string | Sim | Nome do mes de referencia. |
| `data` | string | Sim | Formato `YYYY-MM-DD`. |
| `categoriaId` | number/string | Sim | Categoria de receita. |
| `descricao` | string | Sim | Descricao principal. |
| `complemento` | string | Nao | Detalhe adicional. |
| `valor` | number/string | Sim | Valor positivo. |
| `tipoRecorrencia` | string | Sim | `EVENTUAL`, `FIXO` ou `PARCELADO`. |
| `qtdParcelas` | number/string | Condicional | Usado em parcelado. |
| `meses` | array | Nao | Meses recorrentes. |
| `status` | string | Sim | `Pendente` ou `Recebido`. |

### Despesa

Mesmo contrato de Receita, com categoria de despesa e status:

- `Pendente`;
- `Pago`.

### Lancamento de Cartao

| Campo | Tipo | Obrigatorio | Observacao |
|---|---|---|---|
| `orcamentoId` | number/string | Sim | Orcamento da fatura. |
| `cartaoId` | number/string | Sim | Cartao. |
| `categoriaId` | number/string | Sim | Categoria de despesa. |
| `descricao` | string | Sim | Descricao do lancamento. |
| `complemento` | string | Nao | Detalhe adicional. |
| `valor` | number/string | Sim | Valor positivo no payload. |
| `data` | string | Sim | Data da compra, formato `YYYY-MM-DD`. |
| `mesReferencia` | string | Sim | Mes da fatura. |
| `tipoRecorrencia` | string | Sim | `EVENTUAL`, `FIXO` ou `PARCELADO`. |
| `parcela` | number | Condicional | Parcela atual. |
| `totalParcelas` | number | Condicional | Total de parcelas. |
| `meses` | array | Nao | Meses recorrentes. |

### Parcelamento de Cartao

| Campo | Tipo | Obrigatorio | Observacao |
|---|---|---|---|
| `orcamentoInicialId` | number/string | Sim | Orcamento de partida. |
| `cartaoId` | number/string | Sim | Cartao. |
| `categoriaId` | number/string | Sim | Categoria de despesa. |
| `descricao` | string | Sim | Descricao base. |
| `complemento` | string | Nao | Detalhe adicional. |
| `valorTotal` | number/string | Sim | Valor total da compra. |
| `data` | string | Sim | Data original da compra. |
| `mesReferenciaInicial` | string | Sim | Primeira fatura. |
| `qtdParcelas` | number | Sim | Quantidade de parcelas. |

## 9. Respostas e Erros

- Criacao unica normalmente retorna `201`.
- Atualizacao/exclusao normalmente retorna `204`.
- Listagens retornam arrays.
- Erros de validacao retornam `400`.
- Recurso inexistente retorna `404`.
- Token ausente/invalido retorna `401`.
- Erros internos retornam `500`.

Mensagens internas detalhadas so devem ser expostas em ambiente de desenvolvimento.

## 10. Transacoes e Consistencia

Usar transacao quando a operacao:

- cria lote;
- altera registro e meses auxiliares;
- cria parcelamento;
- sincroniza fatura e despesa;
- altera varios registros de configuracao.

Ordem geral:

1. iniciar transacao;
2. adquirir lock por usuario quando necessario;
3. validar entidades;
4. executar DMLs;
5. confirmar transacao;
6. em erro, rollback.

## 11. Pontos de Atencao

- Nao usar dados de um usuario em operacao de outro.
- Nao consultar fatura fechada apenas por mes.
- Nao aceitar parcelamento sem orcamento de destino.
- Nao aceitar lancamento de cartao sem `orcamentoId`.
- Ao alterar payload de configuracao, revisar `configApi`, `configService` e snapshots.
- Ao alterar Cartoes, revisar Despesas, Dashboard e Relatorios.
