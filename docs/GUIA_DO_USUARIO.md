# Guia do Usuario — HomeFinance

Controle financeiro domestico simples e completo. Este guia ensina, passo a passo, como utilizar todas as funcionalidades do sistema.

---

## Sumario

1. [Primeiro Acesso](#1-primeiro-acesso)
2. [Configuracoes Iniciais](#2-configuracoes-iniciais)
   - [2.1 Criando um Periodo de Orcamento](#21-criando-um-periodo-de-orcamento)
   - [2.2 Definindo o Saldo Inicial](#22-definindo-o-saldo-inicial)
   - [2.3 Cadastrando Categorias](#23-cadastrando-categorias)
   - [2.4 Gastos Pre-definidos](#24-gastos-pre-definidos)
   - [2.5 Receitas Pre-definidas](#25-receitas-pre-definidas)
   - [2.6 Cartoes de Credito](#26-cartoes-de-credito)
3. [Registrando Receitas](#3-registrando-receitas)
4. [Registrando Despesas](#4-registrando-despesas)
5. [Gerenciando Cartoes de Credito](#5-gerenciando-cartoes-de-credito)
6. [Dashboard — Visao Geral Financeira](#6-dashboard--visao-geral-financeira)
7. [Relatorios — Analises Detalhadas](#7-relatorios--analises-detalhadas)
8. [Navegacao e Dicas](#8-navegacao-e-dicas)

---

## 1. Primeiro Acesso

### Criando sua conta

Ao abrir o HomeFinance pela primeira vez, voce vera a tela de login. Como ainda nao tem uma conta:

1. Peca ao administrador do sistema para criar seu usuario (e-mail e senha).
2. Na tela de login, preencha:
   - **Email** — seu e-mail cadastrado.
   - **Senha** — a senha definida no cadastro.
3. Marque **"Lembrar de mim"** se deseja manter a sessao ativa por mais tempo (24 horas em vez de 30 minutos).
4. Clique em **"Entrar"**.

> A senha deve ter no minimo 8 caracteres, incluindo letra maiuscula, minuscula, numero e caractere especial.

### Tela de login

| Campo | O que preencher |
|---|---|
| Email | Seu e-mail cadastrado (ex: `joao@email.com`) |
| Senha | Sua senha de acesso |
| Lembrar de mim | Marque para sessao longa (opcional) |

Se errar a senha, uma mensagem de erro aparecera em vermelho abaixo do formulario.

---

## 2. Configuracoes Iniciais

Antes de lancar qualquer receita ou despesa, e necessario configurar a estrutura do seu orcamento. Acesse a pagina **Configuracoes** clicando em **Configuracoes** na barra lateral (desktop) ou no menu inferior (mobile).

A pagina de configuracoes possui 6 paineis. Siga esta ordem:

### 2.1 Criando um Periodo de Orcamento

O periodo de orcamento define o intervalo de meses que voce deseja controlar. Normalmente, corresponde a um ano.

**Como criar:**

1. No painel **"Periodos do Orcamento"**, clique em **"+ Novo periodo"**.
2. Preencha o campo **"Identificacao"** com o nome do periodo (ex: `2026`).
3. Selecione os meses que farao parte do periodo clicando nos checkboxes:
   - Voce pode clicar em **"Selecionar todos"** para marcar os 12 meses.
   - Ou selecionar apenas alguns meses (ex: um semestre).
4. Clique em **"Salvar"**.

> **Importante:** O orcamento e a base de tudo. Sem pelo menos um periodo criado, voce nao conseguira lancar receitas, despesas ou configurar saldo inicial.

**Exemplo pratico:**

| Campo | Valor de exemplo |
|---|---|
| Identificacao | `2026` |
| Meses | Janeiro a Dezembro (todos) |

### 2.2 Definindo o Saldo Inicial

O saldo inicial representa quanto voce tem na conta bancaria no comeco do periodo.

**Como definir:**

1. No painel **"Saldo Inicial"**, clique em **"+ Novo saldo inicial"**.
2. Preencha:
   - **"Periodo"** — selecione o orcamento criado no passo anterior.
   - **"Ano"** — o ano correspondente (ex: `2026`).
   - **"Saldo Inicial"** — o valor em reais (ex: `5.000,00`).
3. Clique em **"Salvar"**.

> O saldo inicial pode ser negativo (ex: `-200,00`), caso sua conta esteja negativa.

**Como funciona:** O saldo inicial e o ponto de partida para o calculo do "Saldo Acumulado" no Dashboard. A cada mes, o sistema calcula: `Saldo anterior + Receitas recebidas - Despesas pagas = Saldo final`.

### 2.3 Cadastrando Categorias

Categorias organizam suas receitas e despesas em grupos. Existem dois tipos:

- **Despesa** — para categorizar gastos (ex: Alimentacao, Moradia, Transporte).
- **Receita** — para categorizar ganhos (ex: Salario, Freelance, Investimentos).

**Como criar:**

1. No painel **"Categorias"**, clique em **"+ Nova categoria"**.
2. Preencha:
   - **"Nome"** — nome da categoria (ex: `Alimentacao`).
   - **"Tipo"** — selecione "Despesa" ou "Receita".
3. Clique em **"Salvar"**.

**Exemplos sugeridos de categorias de despesa:**

| Nome | Tipo |
|---|---|
| Alimentacao | Despesa |
| Moradia | Despesa |
| Transporte | Despesa |
| Saude | Despesa |
| Educacao | Despesa |
| Lazer | Despesa |
| Vestuario | Despesa |
| Servicos | Despesa |

**Exemplos sugeridos de categorias de receita:**

| Nome | Tipo |
|---|---|
| Salario | Receita |
| Freelance | Receita |
| Investimentos | Receita |
| Renda Extra | Receita |

> Nao e possivel criar duas categorias com o mesmo nome e mesmo tipo. O sistema impede duplicatas automaticamente.

### 2.4 Gastos Pre-definidos

Gastos pre-definidos sao descricoes de despesas que voce usa com frequencia. Eles agilizam o lancamento de despesas e de transacoes no cartao.

**Como criar:**

1. No painel **"Gastos Pre-definidos"**, clique em **"+ Novo gasto"**.
2. Preencha:
   - **"Descricao"** — nome do gasto (ex: `Aluguel`, `Supermercado`, `Netflix`).
   - **"Categoria"** — selecione uma categoria de despesa ja cadastrada.
3. Clique em **"Salvar"**.

**Exemplos:**

| Descricao | Categoria |
|---|---|
| Aluguel | Moradia |
| Condominio | Moradia |
| Supermercado | Alimentacao |
| Netflix | Lazer |
| Plano de Saude | Saude |
| Combustivel | Transporte |

### 2.5 Receitas Pre-definidas

Receitas pre-definidas funcionam como os gastos pre-definidos, mas para receitas.

**Como criar:**

1. No painel **"Receitas Pre-definidas"**, clique em **"+ Nova receita"**.
2. Preencha:
   - **"Descricao"** — nome da receita (ex: `Salario`, `Freelance`).
   - **"Recorrente"** — selecione "Sim" se a receita se repete todo mes, ou "Nao" se for eventual.
3. Clique em **"Salvar"**.

### 2.6 Cartoes de Credito

Cadastre seus cartoes de credito para controlar faturas e gastos.

**Como criar:**

1. No painel **"Cartoes de Credito"**, clique em **"+ Novo cartao"**.
2. Preencha:
   - **"Nome do Cartao"** — nome identificador (ex: `Nubank`, `Inter`, `C6`).
   - **"Limite / Valor Alocado"** — o limite do cartao (ex: `5.000,00`).
3. Clique em **"Salvar"**.

> O limite informado aqui e o valor padrao. Voce podera ajustar o limite de cada mes individualmente na pagina de Cartoes.

---

## 3. Registrando Receitas

Apos concluir as configuracoes iniciais, voce esta pronto para lancar suas receitas. Acesse a pagina **Receitas** pela barra lateral ou menu inferior.

### Filtros superiores

No topo da pagina, existem dois filtros:

| Filtro | Funcao |
|---|---|
| **Orcamento** | Seleciona o periodo de orcamento |
| **Mes** | Seleciona o mes dentro do periodo |

O sistema seleciona automaticamente o primeiro orcamento e o mes atual.

### Cards de resumo

Abaixo dos filtros, tres cards mostram:

- **Total Lancado** — soma de todas as receitas do mes selecionado.
- **Total Recebido** — soma das receitas com status "Recebido" (em verde).
- **Pendente** — diferenca entre lancado e recebido (em amarelo se > 0).

### Criando uma nova receita

Clique em **"+ Nova receita"** para abrir o formulario.

#### Campos do formulario

| Campo | O que preencher | Obrigatorio? |
|---|---|---|
| Categoria | Selecione uma categoria de receita | Sim |
| Descricao | Escolha uma receita pre-definida ou digite manualmente | Sim |
| Complemento | Informacao adicional (ex: "Referente a marco") | Nao |
| Valor (R$) | Valor da receita (ex: `5.000,00`) | Sim |
| Data | Data do recebimento | Sim |
| Tipo de gasto | Eventual, Fixo ou Parcelado | Sim |
| Mes inicial | Mes de referencia da receita | Sim |
| No de parcelas | Numero de parcelas (so aparece se Tipo = Parcelado) | Condicional |
| Meses Recorrentes | Meses em que a receita se repete (so aparece se Tipo = Fixo) | Condicional |
| Status | Pendente ou Recebido | Sim |

#### Tipos de receita (campo "Tipo de gasto")

**Eventual** — Receita unica, que ocorre apenas no mes selecionado.

> Exemplo: Um_freelance pontual em marco.

**Fixo** — Receita que se repete em varios meses. Ao selecionar "Fixo", aparecera uma grade de checkboxes com os meses do orcamento. Marque todos os meses em que a receita se repete.

> Exemplo: Salario mensal de janeiro a dezembro.

**Parcelado** — Receita dividida em parcelas. Ao selecionar "Parcelado", aparecera o campo "No de parcelas". O sistema criara automaticamente uma entrada para cada parcela, com a descricao no formato `(1/12)`, `(2/12)`, etc.

> Exemplo: Venda parcelada em 3x de R$ 1.000,00.

#### Descricao: pre-definida vs manual

Se voce cadastrou receitas pre-definidas (na Configuracao), elas aparecerao como opcoes em um dropdown. Se nenhuma opcao se encaixar, marque o checkbox **"Informar manualmente"** para digitar livremente.

### Editando uma receita

1. Na tabela, localize a receita desejada.
2. Clique no icone de edicao (lapis).
3. Altere os campos necessarios no formulario.
4. Clique em **"Salvar"**.

### Alterando o status (Pendente <-> Recebido)

Na tabela, cada receita possui um botao de status:
- Clique no botao verde (check) para marcar como **Recebido**.
- Clique no botao vermelho (X) para voltar para **Pendente**.

> Isso permite controlar quais receitas ja foram efetivamente recebidas na sua conta bancaria.

### Excluindo uma receita

1. Clique no icone de lixeira na linha da receita.
2. Confirme a exclusao no dialogo que aparece.

### Filtros da tabela

Acima de cada coluna da tabela, ha campos de filtro:

| Coluna | Tipo de filtro |
|---|---|
| Data | Seletor de data |
| Descricao | Campo de texto (busca parcial) |
| Categoria | Dropdown com as categorias |
| Valor | Campo numerico |
| Status | Dropdown: Pendente / Recebido |

Voce tambem pode ordenar clicando no cabecalho da coluna (setas para cima/baixo indicam a ordenacao atual). Se tiver filtros ativos, aparecera um botao **"Limpar todos"**.

---

## 4. Registrando Despesas

A pagina de **Despesas** funciona de forma muito similar a de Receitas. Acesse-a pela barra lateral ou menu inferior.

### Filtros superiores e Cards de resumo

Mesma logica da pagina de Receitas:
- **Total Lancado** — soma de todas as despesas do mes.
- **Total Pago** — soma das despesas com status "Pago" (em verde).

### Criando uma nova despesa

Clique em **"+ Nova despesa"** para abrir o formulario.

#### Campos do formulario

| Campo | O que preencher | Obrigatorio? |
|---|---|---|
| Categoria | Selecione uma categoria de despesa | Sim |
| Descricao | Escolha um gasto pre-definido ou digite manualmente | Sim |
| Complemento | Informacao adicional | Nao |
| Valor (R$) | Valor da despesa | Sim |
| Data | Data da despesa | Sim |
| Tipo de gasto | Eventual, Fixo ou Parcelado | Sim |
| Mes inicial | Mes de referencia | Sim |
| No de parcelas | Numero de parcelas (so para Parcelado) | Condicional |
| Meses Recorrentes | Meses de recorrencia (so para Fixo) | Condicional |
| Status | Pendente ou Pago | Sim |

#### Tipos de despesa

Mesma logica das receitas:

- **Eventual** — despesa unica.
- **Fixo** — despesa recorrente em varios meses.
- **Parcelado** — despesa dividida em N parcelas.

### Regras especiais de despesas

**Despesas vinculadas a fatura de cartao:**
- Despesas com descricao iniciada em "Fatura do cartao" sao criadas automaticamente pela pagina de Cartoes.
- Essas despesas nao podem ser marcadas como "Pago" se a fatura do cartao estiver aberta.
- Elas nao podem ser excluidas se o cartao tiver lancamentos naquele mes.

### Editando, excluindo e filtrando

O funcionamento e identico ao da pagina de Receitas. Utilize os icones na tabela para editar ou excluir, e os filtros acima das colunas para buscar despesas especificas.

---

## 5. Gerenciando Cartoes de Credito

A pagina de **Cartoes** permite controlar os lancamentos e faturas dos seus cartoes de credito cadastrados. Acesse-a pela barra lateral ou menu inferior.

### Filtros superiores

| Filtro | Funcao |
|---|---|
| **Cartao** | Seleciona qual cartao visualizar |
| **Mes** | Seleciona o mes da fatura |

> Se a fatura do mes atual estiver fechada, o sistema automaticamente seleciona o proximo mes aberto.

### Cards de resumo (4 cards)

| Card | O que mostra |
|---|---|
| **Limite do Cartao** | Limite do mes selecionado. Clique no icone de lapis para editar o limite individual do mes. |
| **Fatura Atual** | Total liquido da fatura: Fixo + Parcelado + Eventual - Creditos |
| **Disponivel** | Limite menos Fatura Atual (verde se positivo, vermelho se negativo) |
| **Status** | "Aberta" ou "Fechada" com botao para alternar |

### Criando um lancamento

Clique em **"+ Novo lancamento"** para abrir o formulario.

> Lancamentos so podem ser criados se a fatura do mes estiver **aberta**.

#### Campos do formulario

| Campo | O que preencher | Obrigatorio? |
|---|---|---|
| Categoria | Selecione uma categoria de despesa | Sim |
| Descricao | Escolha um gasto pre-definido ou digite manualmente | Sim |
| Complemento | Informacao adicional | Nao |
| Movimento | Debito (compra) ou Credito (estorno/reembolso) | Sim |
| Valor (R$) | Valor do lancamento | Sim |
| Data | Data da compra | Sim |
| Tipo de gasto | Eventual, Fixo ou Parcelado | Sim |
| Mes da fatura | Mes de referencia da fatura | Sim |
| No Parcelas | Numero de parcelas (so para Parcelado e Debito) | Condicional |
| Meses Recorrentes | Meses de recorrencia (so para Fixo e Debito) | Condicional |

#### Movimento: Debito vs Credito

- **Debito (compra)** — um gasto normal no cartao. Todos os tipos de recorrencia estao disponiveis.
- **Credito (estorno/reembolso)** — um valor que volta para o cartao. O tipo e automaticamente definido como "Eventual".

> Lancamentos de credito aparecem com a tag `[CREDITO]` na descricao e reduzem o total da fatura.

### Fechando e reabrindo faturas

- Clique em **"Fechar Fatura"** para fechar a fatura do mes. Isso bloqueia a edicao e criacao de lancamentos.
- Clique em **"Reabrir Fatura"** para desbloquear. Porem, nao e possivel reabrir se a despesa vinculada ja foi marcada como "Pago".

### Editando o limite mensal

1. Clique no icone de lapis no card **"Limite do Cartao"**.
2. Digite o novo limite para o mes.
3. Clique em **"Salvar"**.

> A alteracao afeta apenas o mes selecionado, sem modificar o limite padrao dos outros meses.

### Resumo Mensal das Faturas

Na parte inferior da pagina, existe uma secao chamada **"Resumo Mensal das Faturas"** com um card para cada mes do orcamento. Cada card mostra:

| Informacao | Descricao |
|---|---|
| Limite | Limite daquele mes |
| Fixo | Soma dos lancamentos fixos |
| Parcelado | Soma dos lancamentos parcelados |
| Eventual | Soma dos lancamentos eventuais |
| Creditos | Soma dos creditos/estornos |
| Saldo | Limite - Total da Fatura (verde/vermelho) |
| Valor Fatura | Total liquido da fatura |
| Barra de progresso | Percentual de uso do limite |

Cores da barra de progresso:
- **Verde** — uso ate 50% do limite.
- **Amarelo** — uso entre 50% e 80%.
- **Vermelho** — uso acima de 80%.

### Vinculo automatico com Despesas

Sempre que voce cria, edita ou exclui um lancamento no cartao, o sistema automaticamente cria, atualiza ou exclui uma despesa correspondente chamada **"Fatura do cartao [Nome do Cartao]"** na pagina de Despesas. Isso garante que o total da fatura apareca tambem no Dashboard e nos Relatorios.

---

## 6. Dashboard — Visao Geral Financeira

O **Dashboard** e a pagina inicial do sistema. Ele apresenta um panorama completo das suas financas.

### Filtros

| Filtro | Funcao |
|---|---|
| **Orcamento** | Seleciona o periodo de orcamento |
| **Mes** | Seleciona o mes de referencia |

### Card "Saldo do Mes"

Mostra o resultado financeiro do mes selecionado:

| Indicador | Calculo |
|---|---|
| **Valor principal** | Receitas recebidas - Despesas pagas |
| **Receitas** | Total de receitas recebidas no mes |
| **Despesas** | Total de despesas pagas no mes |
| **Saldo anterior** | Saldo acumulado do mes anterior |
| **Previsto** | Receitas lancadas - Despesas lancadas |
| **Consolidado** | Saldo anterior + Previsto |

Uma seta indica a tendencia: para cima (positivo) ou para baixo (negativo).

### Card "Saldo Acumulado (Em Conta)"

Mostra o saldo real em conta, acumulado ate o mes selecionado:

| Indicador | Descricao |
|---|---|
| **Saldo Inicial** | Saldo configurado nas Configuracoes |
| **Receitas Recebidas** | Total recebido acumulado (verde) |
| **Despesas Pagas** | Total pago acumulado (vermelho) |
| **Saldo Final** | Saldo inicial + Receitas - Despesas |

### Cards de Receitas e Despesas

Dois cards com grafico de rosca mostram:
- **Previsto** (lancado) vs **Realizado** (recebido/pago).
- Barra de progresso com percentual.
- Diferenca entre previsto e realizado.

### Top 5 — Categorias

Dois graficos de barras horizontais mostram as 5 maiores categorias:
- **Top 5 Despesas** — categorias com maior gasto.
- **Top 5 Receitas** — categorias com maior receita.

### Gastos por Cartao

Para cada cartao cadastrado, aparece um card mostrando:
- Total gasto no mes.
- Limite e saldo disponivel.
- Top 5 maiores gastos individuais no cartao.

### Resumo Anual

Tres cards resumem o ano inteiro:
- **Receitas do Ano** — previsto e recebido.
- **Despesas do Ano** — previsto e pago.
- **Saldo Anual** — previsto e realizado (verde/vermelho).

---

## 7. Relatorios — Analises Detalhadas

A pagina de **Relatorios** oferece analises avancadas com graficos e tabelas. Acesse-a pela barra lateral.

### Filtros

| Filtro | Funcao |
|---|---|
| **Orcamento** | Seleciona o periodo de orcamento |
| **Inicio** | Mes inicial do intervalo |
| **Fim** | Mes final do intervalo |
| **Visao** | "Mensal" (um mes) ou "Acumulada" (intervalo completo) |

Abaixo dos filtros, ha 5 abas de analise:

### Aba "Resumo"

- **Card "Saldo do Periodo"** — resultado financeiro do intervalo selecionado.
- **4 indicadores**: Total Receitas, Total Despesas, Variacao Receitas (%), Variacao Despesas (%).
- **Grafico de barras**: Comparativo Previsto x Realizado.

### Aba "Evolucao"

- **Grafico de area**: Evolucao mensal com tres linhas:
  - Receitas (verde)
  - Despesas (vermelho)
  - Saldo Acumulado (azul)
- **Tabela detalhada**: Para cada mes, mostra:
  - Receitas previstas e recebidas.
  - Despesas previstas e pagas.
  - Saldo do mes e acumulado (colorido: verde positivo, vermelho negativo).

### Aba "Categorias"

- **2 graficos de pizza**: Despesas por categoria (top 5) e Receitas por categoria (top 5).
- **Secao expansivel** "Ver todas as categorias de despesas": Tabela completa com colunas:
  - Categoria
  - Previsto
  - Pago
  - Diferenca (verde/vermelho)

### Aba "Cartoes"

- **2 indicadores**: Total utilizado e Total alocado.
- **Tabela com 8 colunas**: Cartao, Mes, Alocado, Fixo/Parcelado, Gastos, Total, Saldo, Status (Aberta/Fechada).

### Aba "Analise"

Esta aba oferece insights automaticos:

**Gastos Recorrentes Ocultos** (se encontrados):
- Lista despesas que aparecem em varios meses mas nao estao marcadas como "Fixo".
- Ajuda a identificar gastos regulares que voce esqueceu de categorizar como recorrentes.

**Insights automaticos:**
- Se as receitas superaram o previsto: percentual acima do esperado.
- Se as despesas ficaram abaixo do previsto: percentual economizado.
- Qual e a maior categoria de despesa e seu valor.
- Alerta de saldo positivo ou negativo.

**Secao expansivel** "Ver todos os gastos por descricao":
- Tabela com todas as descricoes de despesa ordenadas por frequencia:
  - Descricao, Ocorrencias, Previsto, Pago, Media.

---

## 8. Navegacao e Dicas

### Navegacao Desktop

No computador, use a **barra lateral** a esquerda para navegar entre as paginas:

| Pagina | Icone | Atalho |
|---|---|---|
| Dashboard | Grafico | `#dashboard` |
| Receitas | Moeda | `#receitas` |
| Despesas | Conta | `#despesas` |
| Cartoes | Cartao | `#cartao` |
| Relatorios | Lista | `#relatorios` |
| Configuracoes | Engrenagem | `#configuracoes` |

No rodape da barra lateral, voce vera seu nome, e-mail e o botao **"Sair"** para encerrar a sessao.

### Navegacao Mobile

Em telas menores (celulares e tablets), a barra lateral e substituida por:
- **Botao de menu** (tres linhas) no cabecalho para abrir a barra lateral.
- **Barra de navegacao inferior** com acesso rapido a: Dashboard, Receitas, Despesas e Cartoes.

> Ao abrir o menu lateral no mobile, um fundo escuro aparece. Clique nele para fechar o menu.

### Dicas uteis

1. **Comece sempre pelas Configuracoes** — sem orcamento e categorias, nao e possivel lancar nada.

2. **Use gastos pre-definidos** — eles aceleram o lancamento de despesas e cartoes, evitando digitacao repetida.

3. **Marque receitas como "Recebido" e despesas como "Pago"** — so os itens com status atualizado influenciam o Saldo Acumulado real no Dashboard.

4. **Feche as faturas do cartao** — apos conferir todos os lancamentos de um mes, feche a fatura para evitar alteracoes acidentais.

5. **Verifique a aba "Analise" nos Relatorios** — ela revela gastos recorrentes que voce pode ter esquecido de marcar como fixos.

6. **Ajuste limites mensais dos cartoes** — se um mes tiver gastos extras, aumente o limite individual na pagina de Cartoes sem afetar os outros meses.

7. **Tipos de recorrencia**:
   - Use **Fixo** para gastos que se repetem com o mesmo valor (aluguel, streaming, plano de saude).
   - Use **Parcelado** para compras divididas em parcelas.
   - Use **Eventual** para gastos unicos ou irregulares.

8. **Sessao segura** — Se nao marcar "Lembrar de mim", sua sessao expira em 30 minutos de inatividade. Marque essa opcao para manter a sessao ativa por ate 24 horas.

---

## Resumo do Fluxo Recomendado

```
1. Configuracoes
   |-- Criar Periodo de Orcamento (ex: 2026)
   |-- Definir Saldo Inicial (ex: R$ 5.000,00)
   |-- Cadastrar Categorias (Alimentacao, Moradia, Salario...)
   |-- Cadastrar Gastos Pre-definidos (Aluguel, Supermercado...)
   |-- Cadastrar Receitas Pre-definidas (Salario, Freelance...)
   |-- Cadastrar Cartoes de Credito (Nubank, Inter...)
   |
2. Receitas
   |-- Lancar receitas do mes (Salario, Renda Extra...)
   |-- Marcar como "Recebido" ao receber
   |
3. Despesas
   |-- Lancar despesas do mes (Aluguel, Contas...)
   |-- Marcar como "Pago" ao pagar
   |
4. Cartoes
   |-- Lancar compras no cartao
   |-- Acompanhar fatura e limite
   |-- Fechar fatura apos conferencia
   |
5. Dashboard
   |-- Acompanhar saldo do mes e acumulado
   |-- Ver top gastos e receitas
   |
6. Relatorios
   |-- Analisar evolucao mensal
   |-- Ver categorias e insights
```

---

> HomeFinance — Controle financeiro simples para o dia a dia.
