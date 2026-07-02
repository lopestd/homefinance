# AppHomeFinance

Esta pasta concentra os planos e a base do aplicativo Android nativo do HomeFinance.

## Decisao tecnica inicial

- Plataforma: Android nativo.
- Linguagem: Kotlin.
- Interface: Jetpack Compose com Material 3.
- Persistencia: arquivo local privado do app usando Room sobre SQLite, sem PostgreSQL, sem backend remoto e sem consumo de dados de armazenamento externo.
- Seguranca local: credenciais e sessao dentro do dispositivo, com hash de senha, salt, armazenamento privado e suporte futuro a criptografia/biometria.

O arquivo SQLite do Room e um arquivo local do proprio aplicativo, armazenado no sandbox Android. Ele preserva a modelagem relacional atual com chaves, indices, migracoes e transacoes, mas elimina a dependencia de banco externo.

## Documentos

- `planos/01-plano-modelagem-dados-local.md`: plano para criar e manter a modelagem de dados atual no armazenamento local do app.
- `planos/02-plano-app-mobile-android.md`: plano do aplicativo Android, arquitetura e paridade funcional com a versao web mobile.
- `planos/03-estrategia-implementacao.md`: estrategia de abordagem, fases, entregaveis, riscos e criterios de aceite.
- `docs/README.md`: regra de organizacao da documentacao propria do APP.
- `docs/modelagem-local-alvo.md`: resumo do schema local alvo com todas as tabelas atuais e ajustes das migracoes recentes.

## Estrutura atual

```text
AppHomeFinance/
  app/
    src/
      main/
        kotlin/
        assets/
        res/
      test/
  docs/
  planos/
```

O bootstrap Android ja foi iniciado com Gradle Kotlin DSL e modulo `app` em `AppHomeFinance/app`.

## Implementacao ja entregue

- Fluxo de autenticacao local persistente: criar conta, login, logout e restauracao de sessao.
- Persistencia local com Room no arquivo `homefinance_local.db` para:
  - `usuarios` e `sessoes`;
  - `orcamentos`, `orcamento_meses`, `saldo_inicial_orcamento`;
  - `categorias`, `gastos_predefinidos`, `tipos_receita`;
  - `receitas`, `receitas_meses`, `despesas`, `despesas_meses`;
  - `cartoes`, `cartao_limites_mensais`, `cartao_faturas_fechadas`;
  - `lancamentos_cartao`, `lancamentos_cartao_meses`;
  - tabelas auxiliares/compatibilidade `audit_log`, `cartao_meses` e `cartao_lancamentos`.
- Fluxo financeiro funcional em app nativo:
  - Dashboard com saldo inicial, totais de receitas, despesas e saldo.
  - Cadastro e listagem de receitas com status, mes, data, recorrencia fixa e parcelamento.
  - Cadastro e listagem de despesas com status, mes, data, recorrencia fixa e parcelamento.
  - Configuracoes locais para orcamentos, categorias, saldo inicial, modelos pre-definidos e cartoes.
  - Controle local de cartoes com limite mensal, debito, credito, fatura aberta/fechada e despesa tecnica sincronizada.
  - Relatorio local por categoria e resumo de cartoes/faturas.
- Camadas ativas: `core`, `data`, `domain`, `feature`, `navigation`.
