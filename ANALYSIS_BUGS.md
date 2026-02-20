# Análise de Bugs Críticos - HomeFinance

## Resumo Executivo
Esta análise detalha as causas raízes de três bugs críticos reportados na aplicação HomeFinance: um bug destrutivo de perda de dados e dois bugs de duplicação de dados causados por condições de corrida (race conditions).

## Diagnóstico Técnico

### Bug-1: Perda de Dados em Cartões (Destrutivo)
**Sintoma:** Ao realizar alterações de limite nas faturas do cartão de crédito, o sistema deleta todos os lançamentos em todas as faturas, mantendo apenas os valores de limite.

**Causa Raiz:**
A função `saveConfig` no backend (`src/services/configService.js`) implementa uma estratégia de persistência baseada em "Limpeza Total e Re-inserção" (Full Replacement) para atualizações parciais.
1.  O frontend envia um payload parcial contendo apenas a lista de `cartoes` atualizada (com novos limites).
2.  O backend identifica a presença da chave `cartoes` e executa `configRepository.clearCartoes(client, userId)`.
3.  A função `clearCartoes` executa `DELETE FROM cartoes...`. Devido à integridade referencial do banco de dados (Foreign Keys com `ON DELETE CASCADE`), a exclusão dos cartões provoca a exclusão em cascata de todos os registros na tabela `lancamentos_cartao` vinculados a eles.
4.  O backend então insere os cartões novamente. Como o payload original não continha a lista de `lancamentosCartao`, esses dados não são restaurados, resultando em perda permanente.

### Bug-2 e Bug-3: Duplicação de Dados (Despesas e Receitas)
**Sintoma:** Alterações rápidas e sequenciais (ex: editar limite repetidamente, ou alterar valor e status em rápida sucessão) causam duplicação exponencial de registros nas telas de Despesas e Receitas.

**Causa Raiz:**
O backend não implementa controle de concorrência (Locking) para as operações de escrita do usuário. A estratégia de persistência é, novamente, "Deletar Tudo -> Inserir Tudo".
Quando múltiplas requisições HTTP chegam quase simultaneamente (Condição de Corrida):
1.  **Requisição A** inicia a transação e apaga os dados existentes (`DELETE`).
2.  **Requisição B** inicia a transação e tenta apagar os dados (encontra a tabela vazia ou em estado intermediário).
3.  **Requisição A** insere seus dados (`INSERT`).
4.  **Requisição B** insere seus dados (`INSERT`).
5.  Ambas as transações são commitadas.

Como não há bloqueio, ambas as requisições conseguem inserir seus conjuntos de dados. O resultado é a duplicação dos registros. O "loop" mencionado ocorre quando o frontend reage a essas mudanças e envia novas atualizações, ou quando o usuário continua clicando, exacerbando a condição de corrida.

## Recomendações de Correção (Resumo)

Para resolver esses problemas de forma definitiva e profissional, recomenda-se:

1.  **Backend - Controle de Concorrência:** Implementar um mecanismo de Lock (ex: `pg_advisory_xact_lock`) no início da transação de salvamento para garantir que apenas uma requisição por usuário seja processada por vez.
2.  **Backend - Estratégia de Upsert:** Abandonar a estratégia de "Delete All" para atualizações. Utilizar comandos `UPDATE` para registros existentes e `INSERT` apenas para novos, preservando a integridade dos IDs e dos dados filhos (como lançamentos de cartão).
3.  **Frontend - Debounce:** Implementar limitação de taxa (debounce) nas ações do usuário para evitar o envio de múltiplas requisições idênticas em curto intervalo de tempo.
