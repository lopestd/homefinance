# Frontend

## 1. Visao Geral

Frontend React com Vite.

Responsabilidades:

- autenticar usuario;
- gerenciar sessao no navegador;
- carregar dados iniciais;
- manter estado global em `App.jsx`;
- renderizar paginas de negocio;
- chamar APIs por dominio;
- aplicar bloqueios de interface;
- exibir dashboard e relatorios.

## 2. Estrutura

| Caminho | Papel |
|---|---|
| `frontend/src/App.jsx` | Shell, navegacao, carga inicial, estado raiz e pendencias. |
| `frontend/src/pages` | Paginas funcionais. |
| `frontend/src/services` | Clientes HTTP. |
| `frontend/src/hooks` | Estado e calculos reutilizaveis. |
| `frontend/src/components` | Dialogos, tabelas, graficos e componentes compartilhados. |
| `frontend/src/styles` | Estilos globais, layout, paginas, dashboard, graficos e responsividade. |
| `frontend/src/utils/appUtils.js` | Meses, moeda, token local e utilitarios. |

## 3. Estado Raiz

`App.jsx` mantem:

- usuario autenticado;
- token;
- categorias;
- gastos pre-definidos;
- tipos de receita;
- receitas;
- despesas;
- orcamentos;
- cartoes;
- lancamentos de cartao;
- orcamento selecionado;
- pagina ativa;
- estado mobile;
- modal de pendencias.

Ao autenticar, `loadConfigFromApi` carrega o conjunto inicial de dados.

## 4. Navegacao

A navegacao usa hash:

| Hash | Pagina |
|---|---|
| `#dashboard` | Dashboard |
| `#receitas` | Receitas |
| `#despesas` | Despesas |
| `#cartao` | Cartoes |
| `#relatorios` | Relatorios |
| `#configuracoes` | Configuracoes |

Em desktop, a navegacao fica na sidebar. Em mobile, ha menu lateral e barra
inferior com atalhos principais.

## 5. Autenticacao

Arquivo principal: `hooks/useAuth.js`.

Fluxo:

1. Le token do `localStorage`.
2. Configura header `Authorization` no Axios.
3. Valida token com `/auth/verificar`.
4. Renova token quando backend retorna novo token.
5. Monitora atividade do usuario para renovacao inteligente.
6. Em logout, limpa token e estado local.

Tratamento global:

- `services/api.js` intercepta HTTP 401;
- token local e removido;
- aplicacao volta para login.

## 6. Services HTTP

| Arquivo | Responsabilidade |
|---|---|
| `api.js` | Axios base `/api` e tratamento global de 401. |
| `configApi.js` | Configuracao consolidada, categorias, gastos e tipos de receita. |
| `receitasApi.js` | CRUD de receitas. |
| `despesasApi.js` | CRUD de despesas. |
| `lancamentosCartaoApi.js` | CRUD de lancamentos e parcelamento de cartao. |
| `saldoApi.js` | Saldo acumulado e saldo inicial. |

`persistPartialConfigToApi` usa debounce para salvar alteracoes parciais de
configuracao. Quando `immediate` e usado, envia imediatamente.

## 7. Paginas

### Dashboard

Arquivo: `pages/DashboardPage.jsx`.

Mostra:

- saldo atual em conta;
- resultado do mes;
- saldo previsto;
- receitas previstas x recebidas;
- despesas previstas x pagas;
- top categorias;
- cards de cartao;
- resumo anual.

Regras:

- Usa status de receitas/despesas para separar previsto e realizado.
- Usa `useSaldoAcumulado` para saldo oficial.
- Cartoes consideram debitos e creditos.
- Possui acao de ocultar/mostrar valores financeiros.

### Receitas

Arquivo: `pages/ReceitasPage.jsx`.

Funcionalidades:

- filtro por orcamento e mes;
- cards de total lancado, recebido e pendente;
- tabela com filtros por coluna;
- criacao;
- edicao;
- exclusao;
- alternancia de status.

Regras:

- Categoria deve ser de receita.
- Descricao pode vir de receita pre-definida ou ser manual.
- `EVENTUAL` cria uma receita unica.
- `FIXO` pode criar registros para multiplos meses.
- `PARCELADO` cria uma receita por parcela.
- Edicao de receita existente deve atualizar o registro, nao duplicar.
- Receitas eventuais/parceladas nao devem manter meses recorrentes ocultos.

### Despesas

Arquivo: `pages/DespesasPage.jsx`.

Funcionalidades:

- filtro por orcamento e mes;
- cards de total lancado, pago e pendente;
- tabela com filtros por coluna;
- criacao;
- edicao;
- exclusao;
- alternancia de status.

Regras:

- Categoria deve ser de despesa.
- Descricao pre-definida depende da categoria.
- `EVENTUAL`, `FIXO` e `PARCELADO` seguem regra parecida com Receitas.
- Despesa tecnica de fatura de cartao possui regra especial.
- Fatura aberta impede marcar despesa tecnica como paga.
- Despesa tecnica com lancamentos vinculados nao deve ser excluida.

### Cartoes

Arquivo: `pages/CartaoPage.jsx`.

Funcionalidades:

- filtro por orcamento, mes e cartao;
- limite mensal;
- fatura atual;
- saldo disponivel;
- status aberta/fechada;
- tabela de lancamentos;
- criacao e edicao de debitos;
- criacao de creditos;
- criacao de fixos;
- criacao de parcelamentos;
- resumo mensal das faturas.

Regras:

- Fatura fechada bloqueia criar, editar e excluir.
- Reabrir fatura e bloqueado quando a despesa tecnica esta paga.
- Credito recebe tag `[CREDITO]` e reduz total da fatura.
- Parcelamento usa endpoint dedicado para atravessar orcamentos.
- Fixos ajustam data para o mes da fatura.
- Parcelados mantem a data da compra.
- Toda alteracao relevante sincroniza a despesa tecnica da fatura.
- Limites mensais sao salvos por orcamento e mes.

### Relatorios

Arquivo: `pages/RelatoriosPage.jsx`.

Filtros:

- orcamento;
- mes inicial;
- mes final;
- visao mensal ou acumulada.

Abas:

| Aba | Conteudo |
|---|---|
| `Visao Geral` | Saldo realizado, previsto, top pontos de atencao e comparativo. |
| `Fluxo` | Evolucao mensal, receitas, despesas e saldo acumulado. |
| `Categorias` | Agregacao de gastos por categoria e receitas por categoria. |
| `Gastos` | Gastos agrupados por categoria/descricao, origem e conciliacao. |
| `Cartoes` | Limite, composicao da fatura, creditos, liquido, utilizacao e situacao. |

Regras:

- Base de gastos canonica evita dupla contagem de fatura e lancamento.
- Faturas tecnicas podem ser conciliadas com lancamentos de cartao.
- Relatorio mostra alertas de faturas nao conciliadas.
- Valores realizados usam status pago/recebido.

### Configuracoes

Arquivo: `pages/ConfiguracoesPage.jsx`.

Funcionalidades:

- periodos do orcamento;
- saldo inicial;
- cartoes;
- categorias;
- gastos pre-definidos;
- receitas pre-definidas.

Regras:

- Orcamento com vinculos nao deve ser excluido.
- Cartao com lancamentos nao deve ser excluido.
- Categoria vinculada nao deve ser excluida.
- Categoria duplicada por nome/tipo e bloqueada.
- Saldo inicial e salvo por API propria.
- Orcamentos e cartoes usam persistencia parcial.

## 8. Componentes e Hooks

| Item | Uso |
|---|---|
| `Modal` | Formularios e detalhes. |
| `AlertDialog` | Mensagens de erro/aviso. |
| `ConfirmDialog` | Confirmacao de exclusao. |
| `TableFilter` | Filtro e ordenacao por coluna. |
| `useTableFilters` | Estado de filtros e ordenacao. |
| `useSaldoAcumulado` | Consulta e atualizacao de saldo inicial/acumulado. |
| `useRelatorios` | Resolve meses e filtros dos relatorios. |
| `useAuth` | Sessao, token e login/logout. |

## 9. Pendencias de Meses Anteriores

`App.jsx` monta uma lista de receitas/despesas pendentes dos meses anteriores.

Regras:

- considera receitas nao recebidas;
- considera despesas nao pagas;
- cruza mes do item com ano do orcamento;
- evita duplicidades;
- exibe totais por tipo.

## 10. Responsividade

- Abaixo do breakpoint mobile, a sidebar vira menu acionado por botao.
- Ha barra inferior para paginas principais.
- Ao trocar pagina no mobile, a area de conteudo volta ao topo.
- O app ajusta uma variavel CSS de zoom baseada em `devicePixelRatio`.

## 11. Pontos de Atencao para Evolucao

- Ao mudar contrato de API, atualizar service e pagina.
- Ao mudar regra de status, revisar Dashboard e Relatorios.
- Ao mudar Cartoes, revisar sincronizacao com Despesas.
- Ao mudar fatura fechada, sempre considerar orcamento.
- Ao alterar recorrencia, revisar receitas, despesas, cartoes e relatorios.
- Evitar regra critica apenas no frontend.
