# HomeFinance - Documentacao Tecnica e Negocial

Esta pasta descreve o funcionamento do HomeFinance Web para manutencao,
homologacao e evolucao do sistema.

## Estrutura

| Documento | Objetivo |
|---|---|
| `REGRAS_DE_NEGOCIO.md` | Regras funcionais consolidadas por modulo. |
| `modelagem/README.md` | Modelo de dados, tabelas, relacionamentos e impactos. |
| `backend/README.md` | Arquitetura da API, rotas, servicos, contratos e validacoes. |
| `frontend/README.md` | Arquitetura da interface, paginas, estado, fluxos e componentes. |
| `GUIA_DO_USUARIO.md` | Guia operacional para uso do sistema. |

## Visao do Produto

O HomeFinance e um sistema de controle financeiro domestico. Ele organiza:

- periodos de orcamento;
- saldo inicial;
- receitas;
- despesas;
- cartoes de credito;
- faturas;
- dashboard financeiro;
- relatorios gerenciais.

O sistema trabalha por usuario autenticado. Cada usuario possui seus proprios
orcamentos, categorias, lancamentos, cartoes, saldos e sessoes.

## Modulos Funcionais

| Modulo | Finalidade |
|---|---|
| Autenticacao | Login, sessao, renovacao de token, logout e troca de senha. |
| Configuracoes | Orcamentos, meses, saldo inicial, categorias, modelos e cartoes. |
| Receitas | Controle de entradas previstas e recebidas. |
| Despesas | Controle de saidas previstas e pagas. |
| Cartoes | Controle de compras, creditos, faturas e parcelamentos. |
| Dashboard | Resumo financeiro mensal e anual. |
| Relatorios | Analise detalhada por fluxo, categorias, gastos e cartoes. |

## Fluxo Recomendado de Uso

1. Criar usuario e autenticar.
2. Criar orcamento e meses do periodo.
3. Cadastrar saldo inicial.
4. Cadastrar categorias.
5. Cadastrar gastos e receitas pre-definidas.
6. Cadastrar cartoes.
7. Lancar receitas, despesas e compras no cartao.
8. Fechar faturas conferidas.
9. Marcar receitas recebidas e despesas pagas.
10. Acompanhar Dashboard e Relatorios.

## Fontes de Verdade

| Assunto | Fonte |
|---|---|
| Regras negociais | `docs/REGRAS_DE_NEGOCIO.md` |
| Contratos de API | `docs/backend/README.md` |
| Comportamento de interface | `docs/frontend/README.md` |
| Modelo de dados vigente | `database/schema/2026-06-29_001_latest.sql` |
| Modelo anterior relevante | `database/schema/2026-06-29_000_pre_cartao_faturas_orcamento.sql` |

## Cuidados Gerais de Evolucao

- Validacao critica deve existir no backend, mesmo quando tambem existir no frontend.
- Toda consulta de negocio deve respeitar `id_usuario`.
- Alteracoes em Cartoes normalmente impactam Despesas, Dashboard e Relatorios.
- Alteracoes em status de Receita/Despesa impactam saldo acumulado.
- Alteracoes de modelo devem atualizar o snapshot `database/schema/*_latest.sql`.
- Evitar exemplos com dados reais em documentacao tecnica; usar nomes de campo,
  placeholders ou exemplos anonimizados.
