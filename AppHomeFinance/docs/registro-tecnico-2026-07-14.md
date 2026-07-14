# Registro técnico do APP HomeFinance

Data: 2026-07-14

## Escopo verificado

Foi analisado o projeto Android em `AppHomeFinance`, incluindo arquitetura, interface, regras financeiras, Room/SQLite, autenticação, backup, build e testes. A análise foi apenas de leitura; o build de depuração e os cinco testes unitários existentes foram executados com sucesso no estado analisado.

## Estado confirmado

- O APP é Android nativo, local-first, com Kotlin, Jetpack Compose, Room/SQLite, Material 3 e armazenamento sem dependência de rede.
- Estão implementados fluxos para perfil local, orçamentos, categorias, receitas, despesas, cartões, relatórios básicos, configurações e backup manual.
- O banco Room possui schema exportado e migrations explícitas até a versão 3. Valores financeiros são mantidos em centavos (`Long`) e operações de cartão usam transações.

## Riscos técnicos registrados

1. A entrada atual é seleção de perfil local, e não autenticação por senha: a criação não solicita senha e o repositório grava hash e salt constantes. Não deve ser tratada como proteção de dados.
2. O backup manual é JSON legível e o backup automático Android está habilitado sem exclusões explícitas. A restauração remove a base antes de reinserir os dados, devendo ser endurecida antes de distribuição.
3. O schema Room atual só declara chave estrangeira para sessão/usuário. Relações financeiras e tabelas auxiliares não possuem FKs/cascades, exigindo validação explícita nas regras de exclusão.
4. A tela `HomeScreen` concentra as áreas financeiras e de configuração. Hilt, DataStore e atualização reativa por `Flow`, previstos nos planos, não estão ativos na implementação atual.
5. A cobertura automatizada atual é limitada a cinco testes unitários; faltam testes de Room, migração, backup/restauração, autenticação e interface.

## Decisão: exclusão de itens de configuração

Foi adotado o comportamento equivalente ao projeto WEB, com a validação realizada no repositório local do APP para não depender somente da interface.

### Itens disponíveis para exclusão

- Orçamentos;
- Categorias;
- Gastos pré-definidos;
- Receitas pré-definidas;
- Cartões.

Toda ação requer confirmação na interface. Quando houver vínculo com lançamentos, a exclusão é negada e o APP informa que o item está vinculado a lançamentos.

### Vínculos bloqueadores verificados

| Item | Lançamentos que bloqueiam a exclusão |
| --- | --- |
| Orçamento | `receitas.orcamento_id`, `despesas.orcamento_id`/`fatura_orcamento_id` e `lancamentos_cartao.orcamento_id` |
| Categoria | `receitas.categoria_id`, `despesas.categoria_id` e `lancamentos_cartao.categoria_id` |
| Cartão | `lancamentos_cartao.cartao_id` e a despesa técnica de fatura em `despesas.fatura_cartao_id` |

Orçamentos e cartões sem lançamentos vinculados são removidos junto com seus dados auxiliares de configuração (meses, saldo inicial, limites e faturas fechadas), sem alterar qualquer lançamento.

### Itens pré-definidos

Gastos e receitas pré-definidos não possuem um ID de origem gravado em receitas, despesas ou lançamentos de cartão. O formulário copia apenas descrição — e, para gasto, categoria — para o lançamento. Portanto, não existe vínculo rastreável que permita bloquear a exclusão com precisão sem alterar a modelagem e criar migration.

Para manter a compatibilidade com o WEB e não ampliar o escopo, a exclusão desses dois itens é lógica: o item é marcado como inativo e deixa de ser exibido para novos lançamentos; lançamentos existentes não são alterados. Comparação textual não é usada como substituto de vínculo, pois geraria falsos bloqueios.

## Critérios de aceite desta decisão

1. Cada um dos cinco grupos apresenta ação de exclusão e confirmação.
2. Orçamento, categoria ou cartão com lançamento vinculado não pode ser excluído e apresenta alerta claro.
3. Orçamento, categoria ou cartão sem lançamento vinculado é excluído sem remover lançamentos.
4. Gasto e receita pré-definidos deixam de aparecer nas opções para novos lançamentos após exclusão lógica.
5. Build e testes unitários existentes continuam aprovados.
