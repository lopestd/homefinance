# Plano 3 - Estrategia de Implementacao do App

Data: 2026-05-02

## Abordagem geral

Implementar o app por fatias verticais pequenas, sempre preservando dados locais e paridade com a versao web. A primeira meta nao deve ser redesenhar a experiencia, mas criar uma base Android confiavel que leia, grave e calcule os mesmos dominios financeiros.

## Fase 0 - Consolidacao da modelagem

Entregaveis:

- Confirmar schema alvo do app com as migracoes de 2026-04-26 aplicadas.
- Atualizar um documento de schema em `AppHomeFinance/docs`.
- Decidir `minSdk`, `targetSdk`, nome do pacote e nome do arquivo local.
- Definir politica de criptografia local.

Criterio de pronto:

- Lista final de tabelas, campos, chaves e indices aprovada.
- Divergencias do JSON antigo resolvidas no documento alvo.

## Fase 1 - Bootstrap Android

Entregaveis:

- Projeto Gradle Android em `AppHomeFinance/app`.
- Kotlin, Compose, Material 3, Navigation, Hilt, Room e DataStore configurados.
- Tema visual inicial do HomeFinance.
- Estrutura de pacotes conforme o plano do app.

Criterio de pronto:

- Build Android executa.
- Tela inicial simples abre em emulador/dispositivo.
- Testes basicos rodam.

## Fase 2 - Persistencia local e migracoes

Entregaveis:

- Entidades Room para todas as tabelas atuais.
- DAOs por contexto.
- Migrations versionadas.
- Testes de integridade e migracao.
- Repositorio base para carregar agregado equivalente ao `/api/config`.

Criterio de pronto:

- O app cria `homefinance_local.db`.
- O schema local contem todas as entidades.
- Operacoes transacionais funcionam sem rede.

## Fase 3 - Auth local e criacao de conta

Entregaveis:

- Tela de criar conta local.
- Tela de login local.
- Repositorio de usuario/sessao.
- Hash de senha com salt.
- Bloqueio por tentativas.
- Logout e troca de senha.

Criterio de pronto:

- Instalacao limpa permite criar conta.
- Usuario criado consegue entrar e sair.
- Sessoes antigas podem ser invalidadas.

## Fase 4 - Configuracoes primeiro

Motivo: as demais areas dependem de orçamento, categorias, cartoes, gastos e tipos.

Entregaveis:

- CRUD local de orçamentos e meses.
- CRUD local de categorias.
- CRUD local de gastos predefinidos.
- CRUD local de tipos de receita.
- CRUD local de cartoes e limites mensais.
- Saldo inicial por orçamento/ano.

Criterio de pronto:

- Um usuario consegue preparar a base financeira sem internet.
- Dados persistem apos reiniciar o app.

## Fase 5 - Receitas e despesas

Entregaveis:

- Telas de listagem, filtro, criacao, edicao, status e exclusao.
- Criacao em lote para fixos/recorrentes.
- Criacao parcelada.
- Validadores locais equivalentes.
- Testes de use cases principais.

Criterio de pronto:

- Receitas e despesas ficam funcionais com os mesmos campos da web.
- Status e recorrencias atualizam dashboard/relatorios locais.

## Fase 6 - Cartoes

Entregaveis:

- Tela de cartoes.
- Lancamentos de cartao eventuais, fixos e parcelados.
- Limites mensais por orçamento/mes.
- Faturas fechadas.
- Sincronizacao da despesa de fatura quando aplicavel.

Criterio de pronto:

- Lancamentos de cartao respeitam orçamento, categoria, cartao, mes e data.
- Fechamento de fatura mantem despesa correspondente coerente.

## Fase 7 - Dashboard e relatorios

Entregaveis:

- Dashboard com KPIs e graficos.
- Calculo de saldo acumulado.
- Modal de pendencias dos dois meses anteriores.
- Relatorios equivalentes aos atuais.

Criterio de pronto:

- Totais conferem com consultas locais.
- Relatorios e dashboard reagem a mudancas de dados.

## Fase 8 - Hardening e entrega

Entregaveis:

- Testes de regressao.
- Revisao de performance em base com muitos lancamentos.
- Revisao de acessibilidade.
- Revisao de seguranca local.
- Backup/exportacao manual, se entrar no escopo.
- Documentacao de uso e manutencao.

Criterio de pronto:

- App funciona offline do inicio ao fim.
- Nao ha chamadas obrigatorias de rede.
- Dados persistem, migram e sao recuperaveis.

## Ordem recomendada de implementacao

1. Criar projeto Android.
2. Criar schema local completo.
3. Criar conta/login local.
4. Criar configuracoes.
5. Criar receitas e despesas.
6. Criar cartoes.
7. Criar dashboard e relatorios.
8. Endurecer testes, migracoes e seguranca.

## Riscos e mitigacoes

| Risco | Mitigacao |
| --- | --- |
| JSON de modelagem antigo nao reflete migracoes recentes | Usar codigo backend e SQL de 2026-04-26 como fonte complementar. |
| Perda de dados por migracao local incorreta | Testes de migracao e proibicao de migracao destrutiva em producao. |
| Divergencia funcional entre web e app | Recriar primeiro os agregados e use cases equivalentes aos endpoints atuais. |
| Regras de cartao/fatura ficarem inconsistentes | Implementar cartao depois de receitas/despesas e cobrir sincronizacao com testes. |
| Segurança local insuficiente | Hash com salt, sessao local, bloqueio por tentativas e avaliacao de criptografia do arquivo. |
| UI muito diferente da web mobile | Mapear paginas atuais para features Compose antes de redesenhar componentes. |

## Checklist de pronto por funcionalidade

- Tem entidade Room.
- Tem DAO.
- Tem repositorio.
- Tem use case.
- Tem validacao.
- Tem ViewModel.
- Tem tela Compose.
- Tem teste de regra principal.
- Tem teste de persistencia quando houver gravacao.
- Nao chama API externa.

## Estrategia de manutencao futura

- Toda mudanca de modelagem deve nascer com migration local.
- Toda mudanca funcional deve atualizar o use case correspondente.
- Evitar duplicar regras em telas.
- Preferir agregados de leitura para dashboard/relatorios.
- Manter documentos de `AppHomeFinance/planos` como referencia viva durante a implementacao.
