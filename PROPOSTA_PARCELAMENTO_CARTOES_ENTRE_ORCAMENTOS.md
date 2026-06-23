# Proposta: Parcelamento de Cartoes Entre Orcamentos

## Objetivo

Permitir que lancamentos parcelados em Cartoes atravessem orcamentos anuais ja cadastrados.

Exemplo esperado:

```text
Parcela 1/3: Dezembro/2026, orcamento 2026
Parcela 2/3: Janeiro/2027, orcamento 2027
Parcela 3/3: Fevereiro/2027, orcamento 2027
```

Esta alteracao deve ficar restrita ao fluxo de criacao de lancamentos parcelados em Cartoes.

## Restricoes Obrigatorias

- Nao alterar o modelo de dados.
- Nao alterar os fluxos de Receitas.
- Nao alterar os fluxos de Despesas.
- Nao alterar os lancamentos Eventuais em Cartoes.
- Nao alterar os lancamentos Fixos em Cartoes.
- Nao quebrar o comportamento atual de exibicao de faturas.
- Nao alterar o conceito de `data` como data real escolhida no calendario.
- Manter `mesReferencia` como mes da fatura.
- Garantir atomicidade nas gravacoes.
- Se qualquer parcela nao puder ser validada, nenhuma parcela deve ser gravada.
- Se a sincronizacao de despesas de fatura fizer parte da operacao, ela deve ocorrer na mesma transacao da criacao das parcelas.

## Premissas

- Os orcamentos seguem o formato anual atual.
- O campo visual `label` do orcamento representa o ano, por exemplo `2026`, `2027`, `2028`.
- A tabela de lancamentos de cartao ja possui `orcamento_id`.
- O payload de lancamento de cartao ja aceita `orcamentoId`.
- Portanto, nao e necessario alterar schema, tabela ou modelo de dados.

## Problema Atual

O parcelamento em Cartoes considera apenas os meses disponiveis do orcamento atualmente selecionado.

O fluxo atual:

- usa `effectiveOrcamentoId` para todos os lancamentos criados;
- calcula os proximos meses dentro de `mesesDisponiveis`;
- usa retorno circular ao inicio da lista de meses;
- nao procura o orcamento do ano seguinte;
- nao aborta a operacao quando o parcelamento ultrapassa os meses disponiveis.

Esse comportamento impede parcelamentos como Dezembro/2026, Janeiro/2027 e Fevereiro/2027.

## Regra Funcional Esperada

Ao salvar um lancamento parcelado em Cartoes:

1. A primeira parcela deve usar o mes da fatura selecionado no formulario.
2. As proximas parcelas devem avancar mes a mes.
3. Ao passar de Dezembro, o sistema deve buscar o orcamento do ano seguinte.
4. O orcamento seguinte deve existir.
5. O mes da parcela deve existir dentro de `orcamento.meses`.
6. Cada parcela deve ser criada com seu proprio `orcamentoId`.
7. Todas as parcelas devem preservar a mesma `data` escolhida no calendario.
8. Cada parcela deve possuir `mesReferencia` correspondente ao mes da fatura daquela parcela.
9. Se qualquer parcela nao puder ser resolvida, a operacao deve ser abortada antes de chamar a API.

## Exemplo de Resolucao

Entrada:

```text
Orcamento selecionado: 2026
Mes inicial: Dezembro
Quantidade de parcelas: 3
Data escolhida no calendario: 2026-12-10
```

Saida esperada:

```text
Parcela 1/3:
  orcamentoId: id do orcamento 2026
  mesReferencia: Dezembro
  data: 2026-12-10

Parcela 2/3:
  orcamentoId: id do orcamento 2027
  mesReferencia: Janeiro
  data: 2026-12-10

Parcela 3/3:
  orcamentoId: id do orcamento 2027
  mesReferencia: Fevereiro
  data: 2026-12-10
```

## Regra de Falha

Se o orcamento necessario nao existir, ou se o mes necessario nao estiver disponivel no orcamento encontrado, o sistema deve exibir alerta em modal e abortar a operacao.

Mensagem sugerida:

```text
Nao foi possivel criar o parcelamento.
As parcelas ultrapassam os meses disponiveis nos orcamentos cadastrados.
Crie o orcamento seguinte antes de registrar este lancamento.
```

Nessa situacao:

- nenhum lancamento deve ser criado;
- nenhuma despesa de fatura deve ser criada ou atualizada;
- o modal de cadastro deve permanecer aberto;
- o usuario deve poder corrigir a quantidade de parcelas ou criar o orcamento necessario.

## Regras de Frontend

### Resolver parcelas antes de salvar

Criar uma funcao de resolucao de parcelas exclusiva para Cartoes parcelados.

Entrada minima:

- lista de `orcamentos`;
- `effectiveOrcamentoId`;
- `form.mesReferencia`;
- `form.qtdParcelas`;
- `form.data`.

Saida esperada:

```js
[
  {
    orcamentoId,
    mesReferencia,
    parcela,
    totalParcelas
  }
]
```

Regras:

- ordenar ou localizar orcamentos pelo ano numerico do `label`;
- iniciar no ano do orcamento selecionado;
- avancar mes a mes;
- quando o mes ultrapassar Dezembro, incrementar o ano;
- buscar orcamento com `label` igual ao ano calculado;
- validar que `mesReferencia` pertence a `orcamento.meses`;
- retornar erro se qualquer parcela nao puder ser resolvida.

### Montagem dos lancamentos

Cada parcela deve ser montada com:

```js
{
  orcamentoId: parcelaResolvida.orcamentoId,
  cartaoId: effectiveCartaoId,
  descricao: `${descricao} (${numeroParcela}/${totalParcelas})`,
  complemento,
  valor: valorParcela,
  data: form.data,
  mesReferencia: parcelaResolvida.mesReferencia,
  categoriaId,
  tipoRecorrencia: "PARCELADO",
  parcela: numeroParcela,
  totalParcelas,
  meses: []
}
```

### Payload para API

O mapper de payload de Cartoes deve aceitar `orcamentoId` vindo do proprio lancamento.

Regra:

```js
orcamentoId: lancamento.orcamentoId || effectiveOrcamentoId
```

Isso mantem compatibilidade com os fluxos atuais e permite que parcelas atravessem orcamentos.

### Escopo do ajuste no frontend

Alterar apenas o bloco de criacao de `PARCELADO` em Cartoes.

Nao alterar:

- criacao eventual;
- edicao de lancamento existente;
- lancamento fixo;
- fechamento ou reabertura de fatura;
- filtros;
- exibicao de cards de fatura;
- paginas de Despesas;
- paginas de Receitas.

## Regras de Backend

### Validacao de data

O backend deve continuar exigindo que `data` esteja em formato valido:

```text
YYYY-MM-DD
```

Porem, a data nao deve ser usada para validar o ano do orcamento.

Motivo:

- `data` representa a data real escolhida no calendario;
- `mesReferencia` representa o mes da fatura;
- em parcelamentos entre orcamentos, uma compra feita em 2026 pode gerar parcelas em faturas de 2027.

### Validacao de orcamento e mes

Para cada lancamento de cartao:

- `orcamentoId` deve pertencer ao usuario autenticado;
- `mesReferencia` deve existir em `orcamento_meses` para aquele `orcamentoId`;
- `cartaoId` deve pertencer ao usuario;
- `categoriaId` deve pertencer ao usuario.

Validacao correta:

```text
usuario + orcamentoId + mesReferencia
```

Validacao que deve ser removida ou ajustada:

```text
ano extraido de data == ano do orcamento
```

## Atomicidade

### Regra minima

A criacao das parcelas deve ocorrer em lote dentro de uma unica transacao no backend.

Se qualquer parcela falhar:

- rollback total;
- nenhuma parcela persistida;
- resposta de erro para o frontend.

### Regra recomendada

Criar um endpoint especifico para parcelamento de Cartoes, por exemplo:

```text
POST /api/lancamentos-cartao/parcelamento
```

Esse endpoint deve executar em uma unica transacao:

1. validar todas as parcelas;
2. validar todos os orcamentos;
3. validar todos os meses de referencia;
4. inserir todos os lancamentos de cartao;
5. sincronizar as despesas de fatura dos meses/orcamentos afetados, se essa sincronizacao fizer parte do fluxo;
6. confirmar tudo junto.

Se qualquer etapa falhar:

- rollback total;
- nenhum lancamento gravado;
- nenhuma despesa de fatura criada ou alterada.

### Observacao sobre o fluxo atual

Hoje, a criacao dos lancamentos e a sincronizacao de despesas ocorrem em etapas separadas.

Isso nao garante atomicidade completa, porque os lancamentos podem ser salvos e a sincronizacao posterior pode falhar.

Para atender plenamente a restricao de atomicidade, a sincronizacao relacionada ao parcelamento deve ser movida para o backend ou encapsulada em uma operacao transacional unica.

## Criterios de Aceite

### Cenario 1: parcelamento dentro do mesmo orcamento

Dado:

- orcamento 2026 existe;
- meses Marco, Abril e Maio existem;
- usuario cria parcelamento 3x iniciando em Marco/2026.

Esperado:

- criar 3 lancamentos;
- todos com `orcamentoId` de 2026;
- meses Marco, Abril e Maio;
- mesma data escolhida no calendario;
- nenhuma funcionalidade atual quebrada.

### Cenario 2: parcelamento atravessando orcamento

Dado:

- orcamento 2026 existe com Dezembro;
- orcamento 2027 existe com Janeiro e Fevereiro;
- usuario cria parcelamento 3x iniciando em Dezembro/2026.

Esperado:

- parcela 1 em Dezembro/2026;
- parcela 2 em Janeiro/2027;
- parcela 3 em Fevereiro/2027;
- todas preservam a mesma data escolhida no calendario;
- operacao confirmada somente se todas forem gravadas.

### Cenario 3: orcamento seguinte inexistente

Dado:

- orcamento 2026 existe;
- orcamento 2027 nao existe;
- usuario cria parcelamento iniciando em Dezembro/2026 com mais de 1 parcela.

Esperado:

- exibir modal de alerta;
- abortar antes de chamar API;
- nao gravar nenhum lancamento;
- nao sincronizar nenhuma despesa.

### Cenario 4: mes ausente no orcamento seguinte

Dado:

- orcamento 2027 existe;
- Janeiro nao esta em `orcamento.meses`;
- parcelamento precisa criar parcela em Janeiro/2027.

Esperado:

- exibir modal de alerta;
- abortar antes de chamar API;
- nao gravar nenhum lancamento.

### Cenario 5: falha backend durante lote

Dado:

- frontend envia lote de parcelas;
- uma das parcelas falha na validacao backend.

Esperado:

- rollback total;
- nenhuma parcela persistida;
- frontend exibe erro;
- estado local deve ser recarregado a partir da API quando necessario.

## Riscos e Cuidados

- Nao usar operador circular `%` para meses do parcelamento entre orcamentos.
- Nao inferir orcamento pelo ano da `data`.
- Nao alterar `data` para o mes da fatura.
- Nao alterar comportamento de faturas ja fechadas.
- Nao permitir salvar parcialmente.
- Nao depender apenas de validacao frontend; backend deve validar novamente.
- Nao alterar o modelo de dados sem necessidade.

## Arquivos Provavelmente Impactados

Frontend:

```text
frontend/src/pages/CartaoPage.jsx
```

Backend:

```text
backend/src/services/batchCreateService.js
backend/src/controllers/lancamentosCartaoController.js
backend/src/routes/lancamentosCartaoRoutes.js
```

Opcional, se a sincronizacao transacional de despesas for movida para backend:

```text
backend/src/services/despesasService.js
backend/src/repositories/despesasRepository.js
backend/src/repositories/configRepository.js
```

## Fora de Escopo

- Alterar o cadastro de orcamentos.
- Alterar o cadastro de cartoes.
- Alterar lancamentos fixos.
- Alterar lancamentos eventuais.
- Alterar Receitas.
- Alterar Despesas, exceto se estritamente necessario para sincronizacao atomica da fatura originada pelo parcelamento.
- Alterar schema do banco.
- Alterar regras de exibicao das faturas.
