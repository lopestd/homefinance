# Runbook Produção - Orçamento em Cartões

## Parâmetros fixos deste runbook

- `id_usuario` produção: `2`
- `orcamento_id` ano 2026 produção: `382`

## Ordem de execução

1. `01_precheck` (somente leitura)
2. `02_migrate_backfill_lancamentos_cartao_orcamento_id`
3. `04_migrate_cartao_limites_orcamento_id`
4. Deploy backend/frontend (já ajustados para `orcamento_id`)
5. `03_enforce_not_null_lancamentos_cartao_orcamento_id`
6. `01_precheck` novamente para conferência final

## Comandos

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/sql/2026-04-26_01_precheck_lancamentos_cartao_orcamento_id.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/sql/2026-04-26_02_migrate_backfill_lancamentos_cartao_orcamento_id.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/sql/2026-04-26_04_migrate_cartao_limites_orcamento_id.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/sql/2026-04-26_03_enforce_not_null_lancamentos_cartao_orcamento_id.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/sql/2026-04-26_01_precheck_lancamentos_cartao_orcamento_id.sql
```

## Resultado esperado no precheck final

- `lancamentos_2026_fora_orcamento_382 = 0`
- `limites_fora_orcamento_382 = 0`
