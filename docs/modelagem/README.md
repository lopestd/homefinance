# Modelagem de Dados

## 1. Referencia Oficial

O schema principal e `admhomefinance`.

Snapshots versionados:

| Arquivo | Papel |
|---|---|
| `database/schema/2026-06-29_001_latest.sql` | Modelo atual do banco. |
| `database/schema/2026-06-29_000_pre_cartao_faturas_orcamento.sql` | Modelo anterior a fatura fechada por orcamento. |

Esta documentacao explica o modelo. O DDL completo deve ser consultado nos
snapshots acima.

## 2. Conceitos Gerais

- O sistema e multiusuario.
- A maioria das tabelas de negocio possui `id_usuario`.
- Meses sao persistidos numericamente de 1 a 12.
- No frontend/API, meses sao apresentados por nome em portugues.
- Receitas e despesas separam valor previsto de valor realizado por status.
- Cartoes sincronizam suas faturas com despesas tecnicas.

## 3. Tipos Enumerados

| Enum | Valores | Uso |
|---|---|---|
| `categoria_tipo` | `RECEITA`, `DESPESA` | Diferencia categorias. |
| `receita_status` | `Pendente`, `Recebido` | Status de receita. |
| `despesa_status` | `Pendente`, `Pago` | Status de despesa. |
| `recorrencia_tipo` | `EVENTUAL`, `FIXO`, `PARCELADO`, `RECORRENTE`, `CORRENTE` | Tipo de recorrencia. |

Observacao: o sistema web atual usa principalmente `EVENTUAL`, `FIXO` e
`PARCELADO`.

## 4. Tabelas por Dominio

### Autenticacao e auditoria

| Tabela | Responsabilidade | Campos principais |
|---|---|---|
| `usuarios` | Usuarios do sistema. | email, senha_hash, salt, nome, ativo, tentativas_login, bloqueado_ate. |
| `sessoes` | Sessoes autenticadas. | id_usuario, token_hash, data_criacao, data_expiracao, ativa. |
| `audit_log` | Eventos auditaveis. | id_usuario, acao, detalhes, ip_origem, user_agent, data_evento. |

### Configuracao

| Tabela | Responsabilidade | Campos principais |
|---|---|---|
| `orcamentos` | Periodos/anos de controle. | ano, ativo, id_usuario. |
| `orcamento_meses` | Meses habilitados em cada orcamento. | orcamento_id, mes, id_usuario. |
| `categorias` | Categorias de receita/despesa. | nome, tipo, ativa, id_usuario. |
| `gastos_predefinidos` | Modelos de despesa/cartao. | categoria_id, descricao, ativo, id_usuario. |
| `tipos_receita` | Modelos de receita. | descricao, recorrente, ativo, id_usuario. |
| `saldo_inicial_orcamento` | Saldo inicial por periodo. | id_usuario, orcamento_id, ano, saldo_inicial. |

### Receitas

| Tabela | Responsabilidade | Campos principais |
|---|---|---|
| `receitas` | Lancamentos de entrada. | orcamento_id, categoria_id, descricao, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas. |
| `receitas_meses` | Meses recorrentes/adicionais da receita. | receita_id, mes, id_usuario. |

### Despesas

| Tabela | Responsabilidade | Campos principais |
|---|---|---|
| `despesas` | Lancamentos de saida. | orcamento_id, categoria_id, descricao, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas. |
| `despesas_meses` | Meses recorrentes/adicionais da despesa. | despesa_id, mes, id_usuario. |

### Cartoes

| Tabela | Responsabilidade | Campos principais |
|---|---|---|
| `cartoes` | Cadastro de cartoes. | nome, limite, ativo, id_usuario. |
| `cartao_limites_mensais` | Limite por cartao, orcamento e mes. | cartao_id, orcamento_id, mes, limite, id_usuario. |
| `cartao_faturas_fechadas` | Status de fechamento da fatura. | cartao_id, orcamento_id, mes, id_usuario. |
| `lancamentos_cartao` | Compras, parcelas, fixos e creditos. | cartao_id, orcamento_id, categoria_id, descricao, valor, data, mes_referencia, tipo_recorrencia, parcela_atual, total_parcelas. |
| `lancamentos_cartao_meses` | Meses recorrentes/adicionais do lancamento de cartao. | lancamento_id, mes, id_usuario. |

### Estrutura legada

| Tabela | Observacao |
|---|---|
| `cartao_meses` | Estrutura antiga de relacao cartao/mes. |
| `cartao_lancamentos` | Estrutura antiga de lancamentos por cartao_mes. |

Essas tabelas existem no schema atual, mas nao fazem parte do fluxo funcional
atual de Cartoes.

Uso atual verificado:

- nao ha `SELECT`, `INSERT` ou `UPDATE` de negocio no backend para essas tabelas;
- a unica referencia no backend e um `DELETE` em sincronizacao completa de
  configuracao, usado como limpeza/compatibilidade;
- o fluxo atual de lancamentos usa `lancamentos_cartao`;
- recorrencia auxiliar de lancamentos atuais usa `lancamentos_cartao_meses`;
- limites usam `cartao_limites_mensais`;
- fechamento de fatura usa `cartao_faturas_fechadas`.

## 5. Relacionamentos Principais

```text
usuarios
  -> orcamentos
  -> categorias
  -> receitas
  -> despesas
  -> cartoes
  -> lancamentos_cartao

orcamentos
  -> orcamento_meses
  -> receitas
  -> despesas
  -> cartao_limites_mensais
  -> cartao_faturas_fechadas
  -> lancamentos_cartao

cartoes
  -> cartao_limites_mensais
  -> cartao_faturas_fechadas
  -> lancamentos_cartao

receitas
  -> receitas_meses

despesas
  -> despesas_meses

lancamentos_cartao
  -> lancamentos_cartao_meses
```

## 6. Chaves e Constraints Relevantes

| Tabela | Regra |
|---|---|
| `cartao_faturas_fechadas` | PK `(cartao_id, orcamento_id, mes)`. |
| `cartao_limites_mensais` | Limite por cartao, orcamento e mes. |
| `orcamento_meses` | Mes deve ficar entre 1 e 12. |
| `receitas` | Valor positivo, mes entre 1 e 12, parcela valida quando preenchida. |
| `despesas` | Valor positivo, mes entre 1 e 12, parcela valida quando preenchida. |
| `lancamentos_cartao` | Valor positivo, mes entre 1 e 12, parcela valida quando preenchida. |
| `saldo_inicial_orcamento` | Registro por usuario, orcamento e ano. |

## 7. Modelo Atual de Fatura Fechada

No modelo atual, fatura fechada depende de:

```text
cartao_id + orcamento_id + mes
```

Motivo: o mesmo mes existe em anos/orcamentos diferentes. Janeiro de um ano nao
pode bloquear Janeiro de outro ano.

Impactos:

- APIs devem enviar/considerar `orcamento_id`.
- Frontend deve consultar fatura por cartao, orcamento e mes.
- Scripts e relatorios nao devem agrupar fatura fechada apenas por mes.

## 8. Mes de Referencia x Meses Recorrentes

Receitas, despesas e lancamentos de cartao possuem:

- `mes_referencia`: mes principal do registro;
- tabela auxiliar de meses: usada para recorrencia ou exibicao em multiplos meses.

Cuidados:

- Evento eventual normalmente nao precisa de tabela auxiliar.
- Parcelas normalmente sao registros separados.
- Fixos podem ser registros separados ou usar meses recorrentes conforme fluxo.
- Ao editar, nao assumir que ausencia de meses no formulario significa remocao intencional sem validar o tipo.

## 9. Despesa Tecnica de Fatura

O modulo Cartoes gera despesa tecnica em `despesas` para refletir a fatura no
fluxo financeiro.

Padrao de descricao:

```text
Fatura do cartão <nome do cartão>
```

Essa despesa:

- permite que a fatura entre em Dashboard e Relatorios;
- usa categoria de despesa, preferencialmente `Bancos/Cartoes`;
- deve ser atualizada quando lancamentos, limite ou status de fatura mudam;
- deve ser paga somente apos fechamento da fatura.

## 10. Saldo Acumulado

Fonte:

- `saldo_inicial_orcamento`;
- `receitas` com status `Recebido`;
- `despesas` com status `Pago`.

O calculo percorre os meses do orcamento em ordem e carrega o saldo final para o
mes seguinte.

## 11. Cuidados para Migracoes

- Criar snapshot novo quando o modelo vigente mudar.
- Preservar snapshot anterior relevante.
- Validar dados antes e depois de DDL.
- Evitar DDL manual sem script revisado.
- Em bases existentes, testar primeiro fora de producao.
- Para faturas fechadas, validar:
  - nenhum `orcamento_id` nulo;
  - nenhuma duplicidade em `(cartao_id, orcamento_id, mes)`.
