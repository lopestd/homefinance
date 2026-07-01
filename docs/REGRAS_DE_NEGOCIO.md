# Regras de Negocio

## 1. Autenticacao e Sessao

### Cadastro e senha

- Usuario possui nome, email, senha, status ativo e metadados de login.
- Email deve ser unico.
- Senha deve ter:
  - 8 a 128 caracteres;
  - letra maiuscula;
  - letra minuscula;
  - numero;
  - caractere especial.
- Senha e armazenada como hash Argon2id.

### Login

- Login exige email e senha.
- Tentativas invalidas retornam erro generico de credenciais.
- Login cria uma sessao ativa no banco.
- O token retornado e JWT, mas a sessao tambem e validada pelo hash do token no banco.

### Sessao

- Toda rota funcional exige token Bearer valido.
- Sessao comum usa expiracao curta.
- Opcao "lembrar de mim" permite sessao mais longa, respeitando limite absoluto.
- Verificacao de sessao pode renovar token quando permitido.
- Logout inativa a sessao atual.
- Troca de senha inativa sessoes antigas.

## 2. Orcamentos

- Orcamento representa um periodo de controle, normalmente um ano.
- Cada orcamento possui meses habilitados.
- Receitas, despesas, cartoes, limites, faturas e lancamentos devem apontar para o orcamento correto.
- O sistema tenta selecionar o orcamento do ano corrente; se nao existir, usa o primeiro disponivel.
- Orcamento com lancamentos vinculados nao deve ser excluido pela interface.
- Um mes so deve aparecer em filtros se estiver habilitado no orcamento.

## 3. Saldo Inicial e Saldo Acumulado

- Saldo inicial e definido por usuario, orcamento e ano.
- Saldo inicial pode ser positivo, zero ou negativo.
- Saldo acumulado considera apenas:
  - receitas com status `Recebido`;
  - despesas com status `Pago`.
- Formula mensal:

```text
saldo_final = saldo_inicial_do_mes + receitas_recebidas - despesas_pagas
```

- O saldo final de um mes vira saldo inicial do proximo mes.
- Lancamentos pendentes nao entram no saldo real, mas entram em previsoes e relatorios de planejado.

## 4. Categorias

- Categoria possui tipo `RECEITA` ou `DESPESA`.
- Receita deve usar categoria do tipo `RECEITA`.
- Despesa e lancamento de cartao devem usar categoria do tipo `DESPESA`.
- Nao deve haver duas categorias com mesmo nome e mesmo tipo para o usuario.
- Categoria vinculada a receita, despesa ou cartao nao deve ser excluida pela interface.
- Categoria `Bancos/Cartoes` pode ser criada automaticamente para despesas tecnicas de fatura.

## 5. Modelos Pre-Definidos

### Gastos pre-definidos

- Representam descricoes reutilizaveis para despesas e lancamentos de cartao.
- Sempre possuem categoria de despesa.
- Na tela de lancamento, a lista de gastos pre-definidos e filtrada pela categoria selecionada.

### Receitas pre-definidas

- Representam descricoes reutilizaveis para receitas.
- Podem ser marcadas como recorrentes.
- Servem para acelerar preenchimento, mas nao substituem a regra do tipo de recorrencia do lancamento.

## 6. Receitas

### Status

- `Pendente`: receita prevista, ainda nao recebida.
- `Recebido`: receita efetivamente recebida.

### Tipos

- `EVENTUAL`: uma receita unica no mes de referencia.
- `FIXO`: receita recorrente nos meses selecionados.
- `PARCELADO`: receita dividida em parcelas.

### Criacao

- Receita eventual cria um unico registro.
- Receita fixa com multiplos meses cria registros em lote conforme meses selecionados.
- Receita parcelada cria uma entrada por parcela, com controle de parcela atual e total.
- Receita nova inicia como `Pendente`, salvo quando o formulario permitir status especifico.

### Edicao

- Editar receita deve atualizar o registro existente.
- Alterar valor e status na mesma operacao deve continuar sendo um unico update.
- Edicao nao deve duplicar registro antigo.
- Receita eventual ou parcelada nao deve preservar meses recorrentes ocultos.
- Receita fixa pode preservar meses removidos apenas quando houver remocao explicita de meses recorrentes.

### Impactos

- Receita `Recebido` afeta saldo acumulado.
- Receita `Pendente` afeta totais previstos/lancados.
- Relatorios usam status para separar previsto de realizado.

## 7. Despesas

### Status

- `Pendente`: despesa prevista, ainda nao paga.
- `Pago`: despesa efetivamente paga.

### Tipos

- `EVENTUAL`: uma despesa unica no mes de referencia.
- `FIXO`: despesa recorrente nos meses selecionados.
- `PARCELADO`: despesa dividida em parcelas.

### Criacao e edicao

- Despesa eventual cria um unico registro.
- Despesa fixa com multiplos meses cria registros em lote.
- Despesa parcelada cria uma entrada por parcela.
- Edicao deve atualizar o registro existente.
- Ao editar meses recorrentes, o sistema pode preservar meses removidos em novo registro quando a regra de recorrencia exigir.

### Despesas tecnicas de cartao

- Faturas de cartao geram despesas tecnicas com descricao:

```text
Fatura do cartão <nome do cartão>
```

- Essas despesas representam o valor da fatura dentro do fluxo de despesas.
- Despesa tecnica de fatura so pode ser marcada como `Pago` quando a fatura do cartao estiver fechada.
- Despesa tecnica nao deve ser excluida se ainda houver lancamentos de cartao vinculados.

### Impactos

- Despesa `Pago` afeta saldo acumulado.
- Despesa `Pendente` afeta totais previstos/lancados.
- Despesas tecnicas permitem que faturas entrem no Dashboard e nos Relatorios.

## 8. Cartoes de Credito

### Cartao

- Cartao possui nome, limite padrao, status ativo e usuario.
- Limite mensal pode variar por orcamento e mes.
- Cartao com lancamentos vinculados nao deve ser excluido pela interface.

### Lancamentos

- Lancamento pertence a cartao, orcamento, categoria, data e mes de fatura.
- Tipos:
  - `EVENTUAL`;
  - `FIXO`;
  - `PARCELADO`.
- Movimento de debito aumenta a fatura.
- Movimento de credito reduz a fatura.
- Credito e identificado por valor negativo ou descricao com tag tecnica `[CREDITO]`.

### Data

- Lancamento parcelado mantem a data original da compra em todas as parcelas.
- Lancamento fixo deve ter data ajustada para o mesmo mes da fatura, preservando o dia quando possivel.
- Se o dia original nao existir no mes da fatura, usa o ultimo dia valido do mes.

### Parcelamento entre orcamentos

- Parcelamento calcula parcelas a partir do orcamento inicial, mes inicial e quantidade de parcelas.
- Cada parcela deve cair em um orcamento existente para o ano correspondente.
- O mes da parcela deve existir no orcamento de destino.
- Nao pode criar parcela em fatura fechada.
- Criacao do parcelamento deve ser transacional.
- O valor total deve ser distribuido entre parcelas; diferencas de arredondamento devem ficar na ultima parcela.

### Faturas

- Fatura fechada e identificada por:

```text
cartao_id + orcamento_id + mes
```

- Fatura fechada bloqueia criacao, edicao e exclusao de lancamentos naquele mes.
- Fatura fechada pode ser reaberta se a despesa tecnica correspondente ainda nao estiver paga.
- O status de fatura nao deve ser avaliado apenas por mes, pois o mesmo mes pode existir em orcamentos diferentes.

### Sincronizacao com despesas

- Ao criar, editar, excluir lancamento ou alterar limite/fatura, o sistema sincroniza a despesa tecnica da fatura.
- Se a fatura tem valor positivo, a despesa tecnica deve existir ou ser atualizada.
- Se a fatura fica zerada, a despesa tecnica pode ser removida.
- Fatura aberta pode projetar valor pela regra de limite/consumo usada no frontend.
- Fatura fechada registra valor final da fatura.

## 9. Dashboard

- Dashboard trabalha com orcamento e mes selecionados.
- Mostra:
  - saldo atual;
  - resultado do mes;
  - saldo previsto;
  - receitas previstas x recebidas;
  - despesas previstas x pagas;
  - maiores categorias;
  - resumo de cartoes;
  - resumo anual.
- Valores realizados dependem de status:
  - receita `Recebido`;
  - despesa `Pago`.
- Valores previstos usam lancamentos existentes, independentemente do status.
- Usuario pode ocultar/mostrar valores financeiros.

## 10. Relatorios

- Relatorios trabalham por orcamento, intervalo de meses e visao mensal/acumulada.
- Abas:
  - `Visao Geral`;
  - `Fluxo`;
  - `Categorias`;
  - `Gastos`;
  - `Cartoes`.
- Fluxo mensal usa receitas recebidas, despesas pagas e saldo acumulado oficial.
- Categorias e Gastos usam base canonica de eventos de despesa.
- Despesas tecnicas de fatura podem ser conciliadas com lancamentos de cartao.
- Fatura sem composicao de cartao no periodo deve aparecer como nao conciliada.
- Cartoes mostram limite, fixo, parcelado, eventual, creditos, liquido, utilizacao e situacao.

## 11. Pendencias de Meses Anteriores

- Ao carregar o sistema, a interface pode listar receitas e despesas pendentes dos ultimos meses.
- Itens ja recebidos/pagos nao entram nessa lista.
- A lista usa orcamento, ano e meses anteriores em relacao a data atual.

## 12. Regras Transversais

- Toda operacao deve respeitar o usuario autenticado.
- Validacoes criticas devem existir no backend.
- Frontend pode bloquear acoes para melhorar experiencia, mas nao deve ser a unica barreira.
- Operacoes compostas devem usar transacao quando afetarem varias tabelas.
- Alteracoes em Cartoes devem ser avaliadas tambem em Despesas, Dashboard e Relatorios.
