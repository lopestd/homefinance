# Modelo de Dados - HomeFinance (PostgreSQL)

Este documento descreve o modelo de dados relacional para a migração do sistema HomeFinance de armazenamento em arquivo (JSON) para banco de dados PostgreSQL.

## Visão Geral

O modelo foi normalizado para garantir integridade referencial e escalabilidade. A estrutura baseia-se nos módulos de negócio existentes (`orcamento`, `receita`, `despesa`, `cartao`).

## Diagrama de Entidades e Relacionamentos (ER)

### Entidades Principais

1.  **orcamentos**: Define o ano fiscal.
2.  **orcamento_meses**: Subdivisão mensal de um orçamento.
3.  **categorias**: Classificação de receitas e despesas.
4.  **receitas**: Entradas financeiras.
5.  **despesas**: Saídas financeiras.
6.  **cartoes**: Cartões de crédito.
7.  **cartao_meses**: Ciclos mensais (faturas) de cada cartão.
8.  **cartao_lancamentos**: Compras/lançamentos dentro de uma fatura de cartão.
9.  **tipos_receita**: Tipos pré-definidos de receita.
10. **gastos_predefinidos**: Modelos de despesas frequentes.

### Relacionamentos

*   `orcamentos` (1) -> (N) `orcamento_meses`
*   `orcamento_meses` (1) -> (N) `receitas`
*   `orcamento_meses` (1) -> (N) `despesas`
*   `orcamento_meses` (1) -> (N) `cartao_meses` (Define o mês de competência da fatura)
*   `categorias` (1) -> (N) `receitas`
*   `categorias` (1) -> (N) `despesas`
*   `categorias` (1) -> (N) `gastos_predefinidos`
*   `cartoes` (1) -> (N) `cartao_meses`
*   `cartao_meses` (1) -> (N) `cartao_lancamentos`

## Definição das Tabelas

### 1. orcamentos
Armazena os orçamentos anuais.

| Campo | Tipo | Descrição |
|---|---|---|
| id_orcamento | SERIAL (PK) | Identificador único |
| ano | INTEGER | Ano do orçamento (ex: 2026) |
| ativo | BOOLEAN | Se é o orçamento atual |
| data_criacao | TIMESTAMP | Data de criação |

### 2. orcamento_meses
Meses associados a um orçamento.

| Campo | Tipo | Descrição |
|---|---|---|
| id_orcamento_mes | SERIAL (PK) | Identificador único |
| id_orcamento | INTEGER (FK) | Referência ao orçamento |
| mes | INTEGER | Número do mês (1-12) |

### 3. categorias
Categorias para classificação.

| Campo | Tipo | Descrição |
|---|---|---|
| id_categoria | SERIAL (PK) | Identificador único |
| nome | VARCHAR(100) | Nome da categoria |
| tipo | VARCHAR(20) | 'RECEITA' ou 'DESPESA' |
| ativo | BOOLEAN | Se está ativa para uso |

### 4. tipos_receita
Tipos auxiliares para receitas (ex: Salário, Extra).

| Campo | Tipo | Descrição |
|---|---|---|
| id_tipo_receita | SERIAL (PK) | Identificador único |
| descricao | VARCHAR(100) | Descrição do tipo |

### 5. gastos_predefinidos
Templates para despesas recorrentes/comuns.

| Campo | Tipo | Descrição |
|---|---|---|
| id_gasto_predefinido | SERIAL (PK) | Identificador único |
| id_categoria | INTEGER (FK) | Categoria padrão |
| descricao | VARCHAR(100) | Descrição do gasto |
| ativo | BOOLEAN | Se está ativo |

### 6. receitas
Lançamentos de receitas.

| Campo | Tipo | Descrição |
|---|---|---|
| id_receita | SERIAL (PK) | Identificador único |
| id_orcamento | INTEGER (FK) | Orçamento pai |
| id_orcamento_mes | INTEGER (FK) | Mês de competência |
| id_categoria | INTEGER (FK) | Categoria |
| id_tipo_receita | INTEGER (FK) | Tipo opcional |
| descricao | VARCHAR(255) | Descrição da receita |
| valor | DECIMAL(15,2) | Valor monetário |
| recebida | BOOLEAN | Status (Recebida ou não) |

### 7. despesas
Lançamentos de despesas (conta corrente/dinheiro).

| Campo | Tipo | Descrição |
|---|---|---|
| id_despesa | SERIAL (PK) | Identificador único |
| id_orcamento | INTEGER (FK) | Orçamento pai |
| id_orcamento_mes | INTEGER (FK) | Mês de competência |
| id_categoria | INTEGER (FK) | Categoria |
| id_gasto_predefinido | INTEGER (FK) | Origem (opcional) |
| descricao | VARCHAR(255) | Descrição da despesa |
| valor | DECIMAL(15,2) | Valor monetário |
| paga | BOOLEAN | Status (Paga ou não) |
| tipo_recorrencia | VARCHAR(50) | Ex: 'FIXO', 'PARCELADO', 'UNICO' |
| qtd_parcelas | INTEGER | Quantidade total de parcelas (se aplicável) |

### 8. cartoes
Cadastro de cartões de crédito.

| Campo | Tipo | Descrição |
|---|---|---|
| id_cartao | SERIAL (PK) | Identificador único |
| descricao | VARCHAR(100) | Nome do cartão (ex: Nubank) |
| ativo | BOOLEAN | Se está ativo |

### 9. cartao_meses
Representa a fatura de um cartão em um mês específico.

| Campo | Tipo | Descrição |
|---|---|---|
| id_cartao_mes | SERIAL (PK) | Identificador único |
| id_cartao | INTEGER (FK) | Cartão |
| id_orcamento_mes | INTEGER (FK) | Mês de referência da fatura |

### 10. cartao_lancamentos
Compras realizadas no cartão.

| Campo | Tipo | Descrição |
|---|---|---|
| id_cartao_lancamento | SERIAL (PK) | Identificador único |
| id_cartao_mes | INTEGER (FK) | Fatura de referência |
| descricao | VARCHAR(255) | Descrição da compra |
| valor | DECIMAL(15,2) | Valor da compra |
| tipo | VARCHAR(50) | 'CORRENTE', 'PARCELADO', 'RECORRENTE' |
| paga | BOOLEAN | Se foi conciliado/pago |

## Estratégia de Migração

O sistema atual utiliza um arquivo `store.json` com identificadores baseados em strings (ex: `cat-1`, `orc-123`) e uma estrutura denormalizada em `frontendConfig`. A migração exigirá:

1.  Criação das tabelas (script `create_tables.sql`).
2.  Script de carga (ETL) que lerá o `store.json`.
3.  Conversão de IDs string para IDs numéricos (mantendo um mapa de `old_id` -> `new_id` durante a migração para resolver chaves estrangeiras).
4.  Inserção nas tabelas normalizadas.
