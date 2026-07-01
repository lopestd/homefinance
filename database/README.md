# HomeFinance Database

Documentacao simples da modelagem do schema `admhomefinance`.

## Modelos versionados

- `schema/2026-06-29_001_latest.sql`: modelo atual, usado como referencia principal.
- `schema/2026-06-29_000_pre_cartao_faturas_orcamento.sql`: modelo anterior a mudanca de faturas fechadas por orcamento.

O arquivo com sufixo `latest` sempre representa o modelo vigente do banco.

## Mudanca entre as versoes

A diferenca relevante entre os dois modelos esta em
`admhomefinance.cartao_faturas_fechadas`.

Modelo anterior:

- colunas principais: `cartao_id`, `mes`, `id_usuario`;
- chave primaria: `(cartao_id, mes)`;
- nao diferenciava a fatura fechada por orcamento.

Modelo atual (`latest`):

- adiciona `orcamento_id bigint NOT NULL`;
- chave primaria: `(cartao_id, orcamento_id, mes)`;
- FK `orcamento_id -> admhomefinance.orcamentos(id)`;
- indice auxiliar `(id_usuario, cartao_id, orcamento_id)`.

## Observacoes de modelagem

- `orcamentos` representa o ano de referencia.
- `orcamento_meses` define os meses disponiveis em cada orcamento.
- `lancamentos_cartao` ja possui `orcamento_id` e continua sem alteracao
  estrutural nesta mudanca.
- `cartao_limites_mensais` tambem trabalha por `cartao_id`, `orcamento_id` e
  `mes`.
- `cartao_faturas_fechadas` deve ser consultada por `cartao_id`,
  `orcamento_id` e `mes`, nunca apenas por mes.

## Regra de manutencao

Manter nesta pasta apenas:

- esta documentacao de modelagem;
- o modelo atual marcado como `latest`;
- o modelo anterior necessario para comparacao historica.

Scripts temporarios de execucao, validacao ou rollback nao devem permanecer em
`database` quando deixarem de ser a referencia oficial da modelagem.
