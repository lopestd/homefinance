# Especificacao - Backup e Restore

## Objetivo

Criar uma funcionalidade de Backup e Restore no AppHomeFinance para permitir que o usuario gere uma copia de seguranca completa dos dados locais do APP e consiga restaurar esses dados posteriormente, inclusive em outro dispositivo ou nova instalacao.

## Local da Funcionalidade

A funcionalidade deve ser disponibilizada em:

`Mais > Backup e Restauracao`

A tela deve conter duas acoes principais:

- `Gerar backup`
- `Restaurar backup`

## Backup

Ao acionar `Gerar backup`, o APP deve exportar todas as informacoes registradas no banco local.

O backup deve incluir:

- Usuarios locais
- Sessoes, se aplicavel
- Orcamentos
- Meses dos orcamentos
- Saldo inicial
- Categorias
- Receitas
- Despesas
- Cartoes
- Limites mensais dos cartoes
- Lancamentos de cartao
- Faturas fechadas
- Gastos pre-definidos
- Receitas pre-definidas
- Dados auxiliares necessarios para manter integridade

## Formato do Arquivo

O backup deve ser gerado em arquivo local, preferencialmente em formato JSON estruturado e versionado.

Nome sugerido:

`homefinance-backup-AAAA-MM-DD-HHMM.json`

Estrutura sugerida:

```json
{
  "app": "AppHomeFinance",
  "backupVersion": 1,
  "createdAt": "2026-07-01T10:30:00",
  "databaseVersion": 1,
  "data": {}
}
```

## Regras do Backup

- O backup deve conter todos os dados necessarios para reconstruir o banco local.
- O arquivo nao deve depender do usuario atualmente logado.
- O sistema deve exibir mensagem curta de sucesso ou erro.
- Sempre que possivel, usar o seletor nativo do Android para o usuario escolher onde salvar o arquivo.
- O backup deve preservar IDs internos para manter os relacionamentos entre tabelas.

## Restore

Ao acionar `Restaurar backup`, o APP deve permitir selecionar um arquivo de backup valido.

Antes de restaurar, o sistema deve exibir uma confirmacao clara:

`A restauracao substituirá os dados locais atuais. Deseja continuar?`

Acoes da confirmacao:

- `Cancelar`
- `Restaurar`

## Regras do Restore

- Qualquer usuario deve conseguir restaurar um backup.
- A restauracao deve substituir os dados locais atuais pelos dados do arquivo.
- A operacao deve ocorrer em transacao unica sempre que possivel.
- Se ocorrer erro, o banco atual nao deve ficar parcialmente restaurado.
- Ao terminar a restauracao com sucesso, o APP deve:
  - Encerrar qualquer sessao atual.
  - Redirecionar obrigatoriamente para a tela de login.
  - Exibir mensagem curta, por exemplo: `Backup restaurado. Faca login novamente.`

## Validacoes

Antes de restaurar, o APP deve validar:

- Se o arquivo e um JSON valido.
- Se `app == "AppHomeFinance"`.
- Se `backupVersion` e suportada.
- Se existem secoes obrigatorias no arquivo.
- Se o arquivo e compativel com a versao atual do APP.

Arquivos invalidos ou incompativeis devem ser rejeitados com mensagem clara.

## Fluxo de Backup

1. Usuario acessa `Mais > Backup e Restauracao`.
2. Usuario toca em `Gerar backup`.
3. Usuario escolhe o local para salvar.
4. APP exporta os dados locais.
5. APP informa sucesso ou erro.

## Fluxo de Restore

1. Usuario acessa `Mais > Backup e Restauracao`.
2. Usuario toca em `Restaurar backup`.
3. Usuario seleciona o arquivo.
4. APP valida o arquivo.
5. APP solicita confirmacao.
6. Usuario confirma a restauracao.
7. APP substitui os dados locais.
8. APP encerra a sessao atual.
9. APP redireciona para a tela de login.

## Criterios de Aceite

- Backup exporta todos os dados locais relevantes.
- Restore reconstrói os dados mantendo relacionamentos.
- Restore pode ser executado por qualquer usuario.
- Apos restore, o APP sempre volta para login.
- Dados nao ficam parcialmente restaurados em caso de erro.
- Funcionalidade fica disponivel em `Mais`.
- Mensagens de sucesso e erro sao claras e curtas.

