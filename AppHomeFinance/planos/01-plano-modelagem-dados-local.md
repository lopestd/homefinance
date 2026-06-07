# Plano 1 - Modelagem de Dados Local do App HomeFinance

Data: 2026-05-02

## Objetivo

Criar e manter, dentro do app Android, toda a modelagem atual do HomeFinance em armazenamento local do proprio dispositivo. O app nao deve depender de PostgreSQL, servidor de API, servico de nuvem ou qualquer armazenamento externo para funcionar.

## Premissas

- O dado financeiro pertence ao dispositivo e fica no sandbox privado do app.
- A aplicacao deve funcionar totalmente offline.
- A modelagem atual deve ser preservada, com adaptacoes apenas para Android/local-first.
- O arquivo local principal sera `homefinance_local.db`, criado e migrado pelo Room/SQLite.
- `Room/SQLite` sera tratado como arquivo local embarcado, nao como banco externo.
- Exportacao/importacao de arquivo pode ser planejada no futuro, mas nao faz parte do fluxo obrigatorio do app.
- Todas as operacoes atuais que hoje passam por API e PostgreSQL serao executadas por repositorios locais.

## Fontes consideradas

- `docs/homefinance_modelagem_mobile.json`, gerado em 2026-04-03.
- `docs/sql/2026-04-26_02_migrate_backfill_lancamentos_cartao_orcamento_id.sql`.
- `docs/sql/2026-04-26_03_enforce_not_null_lancamentos_cartao_orcamento_id.sql`.
- `docs/sql/2026-04-26_04_migrate_cartao_limites_orcamento_id.sql`.
- Backend atual em `backend/src/repositories`, `backend/src/services` e `backend/src/routes`.
- Frontend atual em `frontend/src/App.jsx`, `frontend/src/pages`, `frontend/src/hooks` e `frontend/src/services`.

## Ajustes obrigatorios antes da codificacao

O JSON de modelagem foi gerado antes das migracoes de 2026-04-26. Portanto, a modelagem alvo do app deve aplicar a modelagem atual efetiva do codigo e das migracoes:

- `lancamentos_cartao` deve possuir `orcamento_id` obrigatorio.
- `lancamentos_cartao.orcamento_id` deve referenciar `orcamentos.id`.
- `cartao_limites_mensais` deve possuir `orcamento_id` obrigatorio.
- A chave primaria de `cartao_limites_mensais` deve ser `(cartao_id, orcamento_id, mes)`, nao apenas `(cartao_id, mes)`.
- `cartao_limites_mensais.orcamento_id` deve referenciar `orcamentos.id`.
- `saldo_inicial_orcamento` deve permanecer na modelagem local, pois ja e usado por dashboard/configuracoes.
- `cartao_meses` e `cartao_lancamentos` existem na modelagem historica. Devem ser mantidas como legado/modelo compatibilidade, mas a funcionalidade atual usa principalmente `lancamentos_cartao`.

## Enums da modelagem

| Enum | Valores |
| --- | --- |
| `categoria_tipo` | `RECEITA`, `DESPESA` |
| `despesa_status` | `Pendente`, `Pago` |
| `receita_status` | `Pendente`, `Recebido` |
| `recorrencia_tipo` | `EVENTUAL`, `FIXO`, `PARCELADO`, `RECORRENTE`, `CORRENTE` |

No app, estes enums devem ser classes Kotlin `enum class`, com conversores Room para persistencia textual.

## Contextos da modelagem atual

| Contexto | Tabelas |
| --- | --- |
| Identidade e acesso | `usuarios`, `sessoes`, `audit_log` |
| Configuracao financeira | `orcamentos`, `orcamento_meses`, `categorias`, `gastos_predefinidos`, `tipos_receita`, `saldo_inicial_orcamento` |
| Lancamentos de caixa | `receitas`, `receitas_meses`, `despesas`, `despesas_meses` |
| Cartoes de credito | `cartoes`, `cartao_limites_mensais`, `cartao_faturas_fechadas`, `cartao_meses`, `cartao_lancamentos`, `lancamentos_cartao`, `lancamentos_cartao_meses` |

## Entidades locais alvo

| Tabela | Chave primaria | Finalidade no app |
| --- | --- | --- |
| `usuarios` | `id_usuario` | Conta local, email, nome, senha hash, salt, estado de bloqueio e datas. |
| `sessoes` | `id_sessao` | Sessao local ativa, token local hash, dispositivo, validade e logout. |
| `audit_log` | `id_log` | Registro local de eventos importantes. |
| `orcamentos` | `id` | Orçamentos por ano e usuario. |
| `orcamento_meses` | `id` | Meses habilitados por orçamento. |
| `categorias` | `id` | Categorias de receita/despesa. |
| `gastos_predefinidos` | `id` | Descricoes frequentes por categoria. |
| `tipos_receita` | `id` | Tipos de receita e recorrencia. |
| `saldo_inicial_orcamento` | `id` | Saldo inicial por usuario, orçamento e ano. |
| `receitas` | `id` | Receitas avulsas, fixas, parceladas e recorrentes. |
| `receitas_meses` | `(receita_id, mes)` | Meses associados a uma receita. |
| `despesas` | `id` | Despesas avulsas, fixas, parceladas e recorrentes. |
| `despesas_meses` | `(despesa_id, mes)` | Meses associados a uma despesa. |
| `cartoes` | `id` | Cartoes de credito e limite base. |
| `cartao_limites_mensais` | `(cartao_id, orcamento_id, mes)` | Limites por cartao, orçamento e mes. |
| `cartao_faturas_fechadas` | `(cartao_id, mes)` | Meses de faturas fechadas por cartao. |
| `lancamentos_cartao` | `id` | Lancamentos atuais de cartao vinculados a orçamento, cartao e categoria. |
| `lancamentos_cartao_meses` | `(lancamento_id, mes)` | Meses associados a lancamentos de cartao. |
| `cartao_meses` | `id` | Estrutura historica de vinculo cartao/mes/orçamento. |
| `cartao_lancamentos` | `id` | Estrutura historica de lancamentos por `cartao_mes_id`. |

## Regras de relacionamento principais

- Todas as tabelas de dominio financeiro devem manter `id_usuario`.
- `sessoes`, `orcamentos`, `categorias`, `cartoes`, `receitas`, `despesas`, `lancamentos_cartao`, `saldo_inicial_orcamento` e tabelas auxiliares devem filtrar sempre pelo usuario ativo.
- Exclusoes em cascata devem ser reproduzidas no Room quando a relacao atual usa `ON DELETE CASCADE`.
- Exclusoes logicas devem ser preservadas onde existem campos `ativo` ou `ativa`.
- `receitas`, `despesas` e `lancamentos_cartao` devem validar valor positivo, mes entre 1 e 12 e coerencia de parcelas.
- `lancamentos_cartao` deve validar que `orcamento_id` corresponde ao ano da data e ao mes de referencia.
- `cartao_limites_mensais` deve validar limite maior ou igual a zero e vinculo ao orçamento.

## Arquivo local e disponibilidade dos dados

O armazenamento local deve ser composto por:

- `homefinance_local.db`: arquivo principal Room/SQLite, privado do app.
- `homefinance_preferences.pb`: DataStore para preferencia ativa, usuario selecionado, bloqueio de sessao e configuracoes locais.
- `homefinance_schema.json`: snapshot de schema gerado durante build/testes, para revisao de migracoes.

Nenhum dado funcional deve ser buscado em API externa. As camadas que hoje chamam `/api` devem ser substituidas por repositorios locais.

## Criacao de conta local

A versao web tem `registrar` no backend, mas a tela web atual usa apenas login. O app deve modelar a criacao de conta local como funcionalidade propria:

1. Primeira abertura sem usuario local:
   - mostrar tela "Criar conta";
   - coletar nome, email e senha;
   - validar email e forca minima da senha;
   - gerar `salt`;
   - salvar `senha_hash` com algoritmo local estavel;
   - criar `usuarios`;
   - criar uma sessao local em `sessoes`;
   - criar log em `audit_log`.

2. Abertura com usuarios existentes:
   - mostrar login local;
   - autenticar contra `usuarios.senha_hash`;
   - atualizar `tentativas_login`, `bloqueado_ate` e `ultimo_login`;
   - criar ou renovar sessao local.

3. Multiplas contas:
   - como a modelagem ja possui `id_usuario` em todas as tabelas, o app pode suportar mais de uma conta local no mesmo dispositivo;
   - a interface pode iniciar com uma conta e evoluir para selecao de usuario.

4. Troca de senha:
   - manter `alterar_senha` como caso de uso local;
   - invalidar sessoes antigas do usuario.

## Estrategia de migracao e versionamento

- Criar `AppDatabase` com `version = 1` contendo o schema alvo ja ajustado pelas migracoes de 2026-04-26.
- Manter uma tabela ou entidade `schema_metadata` com:
  - versao do schema;
  - data de criacao do arquivo;
  - data da ultima migracao;
  - versao do app que criou/migrou o arquivo.
- A cada alteracao de modelagem:
  - atualizar entidades Room;
  - criar `Migration(n, n+1)`;
  - adicionar teste de migracao;
  - atualizar este plano ou documento de schema em `AppHomeFinance/docs`.
- Nao usar `fallbackToDestructiveMigration` em builds de producao.

## Equivalencia com o backend atual

| Backend atual | App Android local |
| --- | --- |
| `storage/db.js` com `pg.Pool` | `RoomDatabase` local |
| `repositories/*Repository.js` | DAOs Room e repositorios Kotlin |
| `services/configService.js` | `ConfigRepository` + use cases |
| `services/batchCreateService.js` | Use cases transacionais locais |
| `validators/schemas.js` | Validadores Kotlin por formulario/use case |
| JWT e tabela `sessoes` | Sessao local privada com token/hash interno |
| `auditRepository` | `AuditRepository` local |

## Modelo agregado para a UI

A UI mobile deve receber um agregado equivalente ao retorno atual de `/api/config`:

- `categorias`
- `gastosPredefinidos`
- `tiposReceita`
- `orcamentos`
- `cartoes`
- `receitas`
- `despesas`
- `lancamentosCartao`
- `saldosIniciais`

Esse agregado deve ser construido por repositorios locais, usando `Flow`/`StateFlow` para atualizar as telas automaticamente.

## Manutencao continua

- Manter a modelagem local como fonte de verdade do app.
- Sincronizar toda alteracao futura da versao web com uma migracao local correspondente.
- Criar testes para:
  - criacao de conta;
  - login/logout local;
  - CRUD de categorias, gastos, tipos de receita, orçamentos e cartoes;
  - CRUD de receitas, despesas e lançamentos de cartao;
  - recorrencias, parcelas e meses;
  - calculo de saldo acumulado;
  - migracoes sem perda de dados.
- Revisar indices sempre que relatorios e dashboard crescerem em volume.

## Entregaveis deste plano

- Schema Room completo em Kotlin.
- Migrations versionadas.
- Repositorios locais equivalentes aos repositorios atuais.
- Documento de schema atualizado em `AppHomeFinance/docs`.
- Testes de migracao e integridade.
