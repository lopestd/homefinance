# Análise do Modelo de Dados

## Visão Geral
Esta análise compara o modelo de dados atual presente no arquivo `data/store.json` (utilizado pelo Frontend) com o modelo de dados definido nos módulos de backend (`src/modules/*.js`).

## 1. Modelo de Dados Atual (Frontend / store.json)
O arquivo `store.json` reflete a estrutura utilizada pela aplicação React (Frontend).

*   **Convenção de Nomes:** camelCase
*   **Identificadores:** Strings baseadas em timestamp (ex: `orc-1770208001125`)
*   **Estrutura Principal:**
    *   `orcamentos`: Lista de orçamentos.
    *   `receitas`: Lista de receitas.
    *   `despesas`: Lista de despesas.
    *   `categorias`: Lista de categorias.
    *   `cartoes`: Lista de cartões.

### Entidades Principais (Exemplo)

#### Receita
```json
{
  "id": "rec-1770256269979-preserved",
  "orcamentoId": "orc-1770208001125",
  "mes": "Março",
  "categoriaId": "cat-1770170333095",
  "descricao": "Salário",
  "valor": "300",
  "tipoRecorrencia": "FIXO",
  "status": "Pendente",
  "categoria": "Rendimentos"
}
```

#### Despesa
```json
{
  "id": "desp-1770254985814-preserved",
  "orcamentoId": "orc-1770208001125",
  "mes": "Maio",
  "categoriaId": "cat-1",
  "descricao": "Financiamento imobiliário",
  "valor": "1500",
  "tipoRecorrencia": "FIXO",
  "status": "Pendente",
  "categoria": "Imóvel"
}
```

## 2. Modelo de Dados dos Módulos (Backend / src/modules)
Os módulos de backend definem um modelo relacional normalizado, preparado para persistência em arquivo ou banco de dados.

*   **Convenção de Nomes:** snake_case
*   **Identificadores:** Inteiros (sequenciais)
*   **Estrutura Principal:**
    *   Normalização de Mês: Introdução da entidade `orcamentoMeses` para relacionar orçamento e mês.
    *   Chaves Estrangeiras: Uso explícito de IDs relacionais (ex: `id_orcamento`, `id_categoria`).

### Entidades Principais

#### Receitas (`src/modules/receitas.js`)
*   `id_receita`: Integer (PK)
*   `id_orcamento`: Integer (FK)
*   `id_orcamento_mes`: Integer (FK -> `orcamentoMeses`)
*   `id_categoria`: Integer (FK)
*   `id_tipo_receita`: Integer (Nullable)
*   `descricao`: String
*   `valor`: Number
*   `recebida`: Boolean

#### Despesas (`src/modules/despesas.js`)
*   `id_despesa`: Integer (PK)
*   `id_orcamento`: Integer (FK)
*   `id_orcamento_mes`: Integer (FK)
*   `id_categoria`: Integer (FK)
*   `descricao`: String
*   `valor`: Number
*   `paga`: Boolean
*   `tipo_recorrencia`: String ("EVENTUAL", "FIXO", "PARCELADO")

#### Orçamento Mês (`src/modules/orcamento.js`)
*   `id_orcamento_mes`: Integer (PK)
*   `id_orcamento`: Integer (FK)
*   `mes`: Integer (1-12)

## 3. Comparativo e Discrepâncias

| Característica | Frontend / store.json | Backend Modules |
| :--- | :--- | :--- |
| **Case Style** | `camelCase` (ex: `orcamentoId`) | `snake_case` (ex: `id_orcamento`) |
| **IDs** | Strings (Timestamp) | Inteiros (Sequencial) |
| **Datas/Meses** | String ("Março", "Janeiro") | Integer (1-12) |
| **Relacionamento Mês** | Campo `mes` direto na entidade | Entidade intermediária `orcamentoMeses` |
| **Tipagem Valor** | String ("300") | Number (300) |
| **Status** | String ("Pendente", "Pago") | Boolean (`recebida`, `paga`) |

## Conclusão
Existe uma divergência completa entre o modelo de dados atual (em uso pelo Frontend e persistido no `store.json`) e o modelo esperado pelos módulos de Backend.

Para unificar o sistema, será necessário:
1.  **Migração de Dados:** Converter o `store.json` atual para o formato normalizado (snake_case, IDs inteiros).
2.  **Adaptação do Frontend:** Ajustar o Frontend para consumir/enviar o formato normalizado OU criar uma camada de adaptação (Adapter/Serializer) na API/Backend.
3.  **Refatoração:** Os módulos de backend não conseguirão ler o arquivo `store.json` atual sem erros, pois esperam propriedades inexistentes.
