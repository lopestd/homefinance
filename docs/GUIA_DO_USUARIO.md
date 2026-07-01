# Guia do Usuario - HomeFinance

Este guia explica como usar o HomeFinance para controlar orcamento domestico,
receitas, despesas, cartoes, faturas, dashboard e relatorios.

## 1. Acesso

### Entrar

1. Abra o sistema.
2. Informe email e senha.
3. Marque "Lembrar de mim" se quiser manter a sessao ativa por mais tempo.
4. Clique em "Entrar".

### Sair

Use o botao "Sair" no rodape da barra lateral.

### Senha

A senha deve ter:

- no minimo 8 caracteres;
- letra maiuscula;
- letra minuscula;
- numero;
- caractere especial.

## 2. Configuracoes

Configure esta area antes de lancar movimentacoes.

### 2.1 Periodos do orcamento

Use para cadastrar o periodo de controle financeiro, normalmente um ano.

Campos:

- identificacao do periodo;
- meses que fazem parte do periodo.

Regras:

- receitas, despesas, cartoes e relatorios dependem do orcamento;
- meses nao selecionados nao aparecem nos filtros daquele orcamento;
- periodo com lancamentos vinculados nao deve ser excluido.

### 2.2 Saldo inicial

Use para informar quanto existia em conta no inicio do periodo.

Campos:

- periodo;
- ano;
- saldo inicial.

Esse valor e usado no saldo acumulado:

```text
saldo final = saldo inicial + receitas recebidas - despesas pagas
```

### 2.3 Cartoes

Use para cadastrar cartoes de credito.

Campos:

- nome do cartao;
- limite/valor alocado.

O limite cadastrado pode ser ajustado depois por mes na tela Cartoes.

Cartao com lancamentos vinculados nao deve ser excluido.

### 2.4 Categorias

Use para classificar receitas e despesas.

Tipos:

- Receita;
- Despesa.

Regras:

- receitas usam categorias de receita;
- despesas e cartoes usam categorias de despesa;
- nao cadastre categorias duplicadas com mesmo nome e tipo;
- categoria vinculada a lancamentos nao deve ser excluida.

### 2.5 Gastos pre-definidos

Use para cadastrar descricoes frequentes de despesas e compras no cartao.

Cada gasto pre-definido possui:

- descricao;
- categoria de despesa.

Na hora do lancamento, o sistema mostra apenas gastos da categoria selecionada.

### 2.6 Receitas pre-definidas

Use para cadastrar descricoes frequentes de receitas.

Campos:

- descricao;
- indicador de recorrencia.

Esse cadastro ajuda no preenchimento, mas o tipo real do lancamento e definido
no formulario de Receita.

## 3. Receitas

Use a tela Receitas para registrar entradas de dinheiro.

### Filtros

- Orcamento;
- Mes.

### Resumo

A tela mostra:

- total lancado;
- total recebido;
- valor pendente.

### Status

- `Pendente`: valor previsto, ainda nao recebido.
- `Recebido`: valor recebido, entra no saldo acumulado.

### Tipos de receita

| Tipo | Quando usar | O que o sistema gera |
|---|---|---|
| Eventual | Receita que acontece uma vez. | Um unico lancamento no mes escolhido. |
| Fixo | Receita recorrente, de mesmo valor e descricao, que deve aparecer em meses selecionados. | Um lancamento separado para cada mes marcado. |
| Parcelado | Receita recebida em partes, com quantidade definida de parcelas. | Um lancamento por parcela, em meses sequenciais, com valor dividido entre as parcelas. |

Detalhes importantes:

- `Fixo` deve ser usado quando a receita se repete por competencia, por exemplo
  um recebimento mensal previsivel.
- Ao criar uma receita fixa, marque exatamente os meses em que ela deve
  aparecer. O sistema cria uma receita independente para cada mes.
- `Parcelado` deve ser usado quando um mesmo valor total sera recebido em mais
  de uma parte.
- Ao criar uma receita parcelada, informe a quantidade de parcelas. O sistema
  divide o valor total, identifica cada parcela na descricao e distribui as
  parcelas a partir do mes inicial.
- Editar ou alterar status de uma parcela ou ocorrencia fixa altera somente o
  registro selecionado.

### Criar receita

1. Clique em "Nova receita".
2. Escolha categoria.
3. Escolha descricao pre-definida ou marque "Informar manualmente".
4. Informe complemento, valor, data, tipo, mes e status.
5. Salve.

### Editar receita

1. Clique no icone de edicao.
2. Altere os campos necessarios.
3. Salve.

Ao editar, o sistema deve alterar o registro existente. Ele nao deve duplicar a
receita antiga.

### Marcar como recebida

Use o botao de status na tabela para alternar entre `Pendente` e `Recebido`.

### Excluir receita

Use o icone de lixeira e confirme a exclusao.

## 4. Despesas

Use a tela Despesas para registrar saidas de dinheiro.

### Filtros

- Orcamento;
- Mes.

### Resumo

A tela mostra:

- total lancado;
- total pago;
- valor pendente.

### Status

- `Pendente`: valor previsto, ainda nao pago.
- `Pago`: valor pago, entra no saldo acumulado.

### Tipos de despesa

| Tipo | Quando usar | O que o sistema gera |
|---|---|---|
| Eventual | Despesa que acontece uma vez. | Um unico lancamento no mes escolhido. |
| Fixo | Despesa recorrente, de mesmo valor e descricao, que deve aparecer em meses selecionados. | Um lancamento separado para cada mes marcado. |
| Parcelado | Despesa assumida em parcelas, com quantidade definida. | Um lancamento por parcela, em meses sequenciais, com valor dividido entre as parcelas. |

Detalhes importantes:

- `Fixo` deve ser usado para compromissos que se repetem, como mensalidades,
  assinaturas ou contas recorrentes.
- Ao criar uma despesa fixa, marque os meses em que ela deve existir. O sistema
  cria despesas independentes para esses meses.
- `Parcelado` deve ser usado quando a compra ou compromisso financeiro foi
  dividido em parcelas.
- Ao criar uma despesa parcelada, informe o valor total e a quantidade de
  parcelas. O sistema cria as parcelas em sequencia a partir do mes inicial.
- Cada parcela ou ocorrencia fixa pode ter status proprio. Marcar uma como
  `Pago` nao marca automaticamente as demais.

### Criar despesa

1. Clique em "Nova despesa".
2. Escolha categoria.
3. Escolha gasto pre-definido ou marque "Informar manualmente".
4. Informe complemento, valor, data, tipo, mes e status.
5. Salve.

### Editar despesa

Use o icone de edicao na tabela, altere os dados e salve.

### Marcar como paga

Use o botao de status na tabela.

Regra especial:

- despesa de fatura de cartao so pode ser marcada como paga quando a fatura do
  cartao estiver fechada.

### Excluir despesa

Use o icone de lixeira e confirme.

Regra especial:

- despesa gerada por fatura de cartao nao deve ser excluida enquanto houver
  lancamentos naquela fatura.

## 5. Cartoes

Use a tela Cartoes para controlar compras e faturas.

### Filtros

- Orcamento;
- Mes da fatura;
- Cartao.

### Resumo

A tela mostra:

- limite do mes;
- valor da fatura atual;
- saldo disponivel;
- status da fatura.

### Movimento

| Movimento | Efeito |
|---|---|
| Debito | Aumenta a fatura. |
| Credito | Reduz a fatura. |

Creditos representam estornos ou reembolsos.

### Tipos de lancamento

| Tipo | Quando usar | O que o sistema gera |
|---|---|---|
| Eventual | Compra unica na fatura selecionada. | Um lancamento na fatura do mes escolhido. |
| Fixo | Compra recorrente que deve aparecer em faturas selecionadas, como assinatura mensal. | Um lancamento separado em cada fatura marcada. |
| Parcelado | Compra dividida em parcelas na fatura do cartao. | Uma parcela por fatura, em meses sequenciais, podendo atravessar orcamentos. |

Detalhes importantes:

- `Fixo` em Cartoes representa uma cobranca recorrente em faturas mensais.
- Para lancamento fixo, cada fatura recebe um lancamento proprio. A data do
  lancamento acompanha o mes da fatura, preservando o dia informado quando o mes
  permite.
- `Parcelado` em Cartoes representa uma unica compra dividida em parcelas.
- Para parcelamento, todas as parcelas mantem a data original da compra, mesmo
  quando aparecem em faturas de meses diferentes.
- Se o parcelamento passar para outro ano, o sistema deve usar o orcamento do
  ano correspondente.
- O sistema nao deve criar lancamento fixo ou parcelado em fatura fechada.

### Criar lancamento

1. Selecione orcamento, mes e cartao.
2. Clique em "Novo lancamento".
3. Informe categoria, descricao, movimento, valor, data e tipo.
4. Salve.

### Parcelamento

Ao criar compra parcelada:

- informe o valor total da compra;
- informe a quantidade de parcelas;
- escolha a fatura inicial;
- a primeira parcela entra na fatura inicial;
- as proximas parcelas seguem as faturas dos meses seguintes;
- se o parcelamento atravessar ano, o sistema usa o orcamento do ano seguinte;
- a compra nao pode ser criada se alguma fatura de destino estiver fechada;
- todas as parcelas mantem a data original da compra;
- cada parcela fica identificada com sua posicao, como `1/3`, `2/3` e `3/3`.

### Lancamento fixo

Ao criar lancamento fixo:

- selecione os meses recorrentes;
- o sistema cria um lancamento independente em cada fatura selecionada;
- cada lancamento usa data no mesmo mes da fatura;
- o dia original e preservado quando existir no mes;
- se o dia original nao existir em algum mes, o sistema deve ajustar para uma
  data valida naquele mes;
- alterar ou excluir uma ocorrencia fixa deve afetar apenas o lancamento
  selecionado, exceto quando a tela indicar outra acao.

### Fechar fatura

Feche a fatura quando todos os lancamentos do mes estiverem conferidos.

Fatura fechada:

- bloqueia novos lancamentos;
- bloqueia edicao;
- bloqueia exclusao;
- permite pagar a despesa tecnica correspondente em Despesas.

### Reabrir fatura

E possivel reabrir fatura quando a despesa tecnica correspondente ainda nao foi
marcada como paga.

Se a despesa tecnica estiver paga, primeiro volte a despesa para pendente.

### Limite mensal

O limite pode ser alterado por mes. Essa alteracao afeta apenas o mes
selecionado do cartao/orcamento.

### Resumo mensal

A parte inferior mostra, por mes:

- limite;
- fixos;
- parcelados;
- eventuais;
- creditos;
- saldo;
- valor da fatura;
- percentual de utilizacao;
- status aberta/fechada.

## 6. Dashboard

Use o Dashboard para acompanhar o resumo do mes.

Ele mostra:

- saldo atual;
- resultado do mes;
- saldo previsto;
- receitas previstas e recebidas;
- despesas previstas e pagas;
- top categorias;
- cartoes;
- resumo anual.

Conceitos:

- previsto considera lancamentos cadastrados;
- realizado considera receitas recebidas e despesas pagas;
- saldo acumulado vem do saldo inicial mais movimentacoes realizadas.

Use o botao de visualizacao para ocultar ou mostrar valores.

## 7. Relatorios

Use Relatorios para analises detalhadas.

### Filtros

- Orcamento;
- Inicio;
- Fim;
- Visao: mensal ou acumulada.

### Abas

| Aba | Conteudo |
|---|---|
| Visao Geral | Saldo, comparativos e pontos de atencao. |
| Fluxo | Evolucao mensal, receitas, despesas e saldo acumulado. |
| Categorias | Gastos e receitas agrupados por categoria. |
| Gastos | Detalhamento por categoria, descricao, origem e conciliacao. |
| Cartoes | Limites, faturas, creditos, liquido, utilizacao e status. |

### Conciliacao de faturas

Relatorios tentam conciliar despesas tecnicas de fatura com os lancamentos do
cartao.

Quando nao houver composicao de cartao para a fatura, o item aparece como nao
conciliado.

## 8. Pendencias de meses anteriores

Ao entrar no sistema, pode aparecer uma lista de pendencias recentes.

Ela mostra:

- receitas ainda pendentes;
- despesas ainda pendentes;
- itens dos ultimos meses.

Use essa lista para revisar o que faltou marcar como recebido ou pago.

## 9. Filtros e ordenacao de tabelas

Telas de Receita, Despesa e Cartao possuem filtros por coluna.

Voce pode filtrar por:

- data;
- descricao;
- categoria;
- valor;
- status ou tipo.

Tambem e possivel ordenar colunas e limpar filtros ativos.

## 10. Mobile

Em telas menores:

- a barra lateral vira menu;
- existe barra inferior para acesso rapido;
- ao trocar de pagina, a tela volta ao topo.

## 11. Boas praticas

- Configure orcamentos, categorias e cartoes antes de lancar movimentacoes.
- Use categorias consistentes.
- Marque receita como recebida somente quando o dinheiro entrar.
- Marque despesa como paga somente quando o pagamento for feito.
- Confira lancamentos antes de fechar fatura.
- Nao pague fatura em Despesas antes de fechar a fatura em Cartoes.
- Revise Dashboard e Relatorios antes de encerrar o mes.
- Use creditos no cartao para estornos e reembolsos.
