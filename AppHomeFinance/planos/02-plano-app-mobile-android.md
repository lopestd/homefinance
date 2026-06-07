# Plano 2 - App Mobile Android HomeFinance

Data: 2026-05-02

## Objetivo

Criar um aplicativo Android do HomeFinance com as mesmas funcionalidades da versao web mobile atual, usando armazenamento local no proprio dispositivo e mantendo a arquitetura por dominios, telas e servicos adaptada para Android nativo.

## Tecnologia recomendada

- Linguagem: Kotlin.
- UI: Jetpack Compose com Material 3.
- Arquitetura de tela: Navigation Compose, ViewModel e StateFlow.
- Persistencia local: Room/SQLite em arquivo privado do app.
- Preferencias locais: Jetpack DataStore.
- Concorrencia: Kotlin Coroutines.
- Injecao de dependencias: Hilt.
- Testes: JUnit, Room testing, Robolectric quando necessario, Compose UI Test.
- Compatibilidade: `minSdk` 23 ou superior, `targetSdk` mais recente disponivel no projeto.

Kotlin e Jetpack Compose sao tecnologias modernas, amplamente usadas no mercado Android e mantidas pelo ecossistema oficial. Room preserva a modelagem relacional atual como arquivo local e evita a necessidade de banco externo.

## Paridade com a versao web mobile atual

A versao web atual possui:

- Login e sessao.
- Dashboard.
- Receitas.
- Despesas.
- Cartoes.
- Relatorios.
- Configuracoes.
- Modal de pendencias dos dois meses anteriores.
- Persistencia via API para PostgreSQL.

O app deve manter as mesmas areas funcionais, trocando API/backend remoto por repositorios locais.

## Mapeamento arquitetural

| Web atual | Android proposto |
| --- | --- |
| `frontend/src/App.jsx` | `MainActivity`, `HomeFinanceApp`, `AppNavHost` |
| Paginas React | Features Compose: `dashboard`, `receitas`, `despesas`, `cartao`, `relatorios`, `configuracoes`, `auth` |
| Hooks React | `ViewModel` + `StateFlow` |
| `services/*Api.js` | `Repository` local + use cases |
| `backend/src/services` | Camada `domain/usecase` |
| `backend/src/repositories` | Camada `data/local/dao` e `data/repository` |
| Joi validators | Validadores Kotlin |
| CSS mobile | Tema Compose, componentes reutilizaveis e responsividade Android |

## Estrutura de codigo proposta

```text
com.homefinance.app
  core/
    database/
    model/
    security/
    ui/
    util/
    validation/
  data/
    local/
      dao/
      entity/
      migration/
    repository/
  domain/
    usecase/
  feature/
    auth/
    dashboard/
    receitas/
    despesas/
    cartao/
    relatorios/
    configuracoes/
  navigation/
```

## Telas e funcionalidades

### Auth e conta local

- Criar conta local no arquivo de dados.
- Login local por email e senha.
- Logout.
- Troca de senha.
- Bloqueio temporario por tentativas falhas.
- Sessao local lembrada no dispositivo.
- Opcional futuro: desbloqueio por biometria.

### Dashboard

- Visao consolidada por orçamento selecionado.
- KPIs de receitas, despesas, saldo e cartoes.
- Graficos equivalentes aos atuais.
- Saldo acumulado considerando `saldo_inicial_orcamento`, receitas recebidas e despesas pagas.
- Aviso de pendencias dos dois meses anteriores.

### Receitas

- Listar, filtrar e ordenar receitas.
- Criar receita eventual.
- Criar receitas fixas/recorrentes em lote.
- Criar receitas parceladas.
- Editar receita.
- Alternar status entre `Pendente` e `Recebido`.
- Excluir receita.
- Respeitar meses, parcelas, orçamento, categoria e data.

### Despesas

- Listar, filtrar e ordenar despesas.
- Criar despesa eventual.
- Criar despesas fixas/recorrentes em lote.
- Criar despesas parceladas.
- Editar despesa.
- Alternar status entre `Pendente` e `Pago`.
- Excluir despesa.
- Criar categoria de despesa durante o lancamento, como na web.
- Respeitar gastos predefinidos.

### Cartoes

- Listar cartoes.
- Gerenciar limite base, limites mensais por orçamento/mes e faturas fechadas.
- Criar, editar e excluir lancamentos de cartao.
- Criar lancamentos eventuais, fixos e parcelados.
- Fechar fatura por mes.
- Sincronizar despesa correspondente da fatura quando aplicavel, mantendo a regra atual da web.

### Relatorios

- Manter os relatorios atuais por orçamento, mes, categoria, status e cartao.
- Apresentar totais, comparativos e conciliacoes.
- Usar consultas locais otimizadas e agregacoes em repositorios/use cases.

### Configuracoes

- Orçamentos e meses.
- Cartoes.
- Categorias.
- Gastos predefinidos.
- Tipos de receita.
- Saldo inicial por orçamento/ano.
- Futuro opcional: exportar/importar arquivo local.

## Fluxo de dados local

1. Tela dispara uma acao do usuario.
2. `ViewModel` valida entrada e chama use case.
3. Use case executa regra de negocio em transacao.
4. Repositorio local grava no Room.
5. DAOs emitem atualizacao via `Flow`.
6. UI Compose atualiza automaticamente.

Esse fluxo substitui `axios` e endpoints HTTP por acesso local e reativo.

## Adaptacoes necessarias da arquitetura web

- Remover dependencia de `axios`, JWT remoto, Express e PostgreSQL.
- Preservar a forma agregada dos dados usada pelas telas para reduzir risco de divergencia funcional.
- Transformar `persistPartialConfigToApi` em `persistPartialConfigLocal`.
- Transformar endpoints como `/receitas/lote` em use cases locais de lote.
- Transformar o tratamento de 401 em bloqueio/expiracao de sessao local.
- Substituir `window.location.hash` por Navigation Compose.
- Substituir CSS por componentes Compose responsivos.

## Compatibilidade com dispositivos modernos e legados

- Definir `minSdk 23` para cobrir dispositivos legados ainda viaveis.
- Usar Compose e Material 3 com componentes responsivos.
- Evitar APIs exclusivas de versoes recentes sem fallback.
- Usar coroutines e Room, que possuem boa compatibilidade.
- Manter dados em armazenamento interno, sem depender de permissao de armazenamento externo.
- Projetar telas para celulares pequenos, celulares grandes e tablets.

## Seguranca e privacidade

- Dados financeiros ficam privados no app.
- Senha local com hash e salt.
- Sessao local invalidavel.
- Limitar tentativas de login.
- Nao enviar telemetria financeira.
- Nao solicitar permissao de internet para a primeira versao local-only, salvo necessidade tecnica futura.
- Avaliar criptografia do arquivo local antes de publicacao. Se a dependencia for aprovada, usar SQLCipher ou biblioteca equivalente estavel.

## Testes principais

- Testes de entidades e DAOs Room.
- Testes de migracao.
- Testes de validadores.
- Testes de use cases de receita, despesa, cartao, configuracao e saldo.
- Testes de ViewModel.
- Testes Compose dos fluxos principais:
  - criar conta;
  - login;
  - criar orçamento;
  - criar categoria;
  - criar receita;
  - criar despesa;
  - criar cartao;
  - criar lancamento de cartao;
  - fechar fatura;
  - consultar dashboard e relatorios.

## Criterios de aceite

- O app abre e funciona sem rede.
- Criar conta local funciona em instalacao limpa.
- Login/logout local funciona.
- Todas as telas principais existem e carregam dados locais.
- Receitas, despesas, cartoes, relatorios, dashboard e configuracoes mantem paridade funcional com a web.
- Nenhum fluxo obrigatorio chama API externa.
- Migracoes locais sao testadas.
- Dados persistem apos fechar e reabrir o app.
