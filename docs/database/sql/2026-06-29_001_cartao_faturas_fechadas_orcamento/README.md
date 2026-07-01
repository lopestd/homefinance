# Faturas fechadas por orcamento

Escopo: alterar somente `admhomefinance.cartao_faturas_fechadas`.

Chave nova:

```text
cartao_id + orcamento_id + mes
```

`admhomefinance.lancamentos_cartao` nao deve ser alterada.

## Ordem pratica

1. Rode `01_precheck.sql` em copia do banco de producao.
2. Use a saida `backfill_sugerido` para revisar qual `orcamento_id` entra em
   cada fatura fechada.
3. Preencha o bloco `BLOCO DE BACKFILL` do `02_migration_dml_ddl.sql` com os
   `UPDATEs` gerados/revisados a partir do `01_precheck.sql`.
4. Rode `02_migration_dml_ddl.sql`.
5. Rode `03_postcheck.sql`.
6. Teste no sistema:
   - Janeiro/2026 fechado nao bloqueia Janeiro/2027;
   - fechamento e reabertura usam `cartao_id + orcamento_id + mes`;
   - parcelamento entre orcamentos respeita a fatura fechada do orcamento/mes
     de cada parcela.

## Backfill

O backfill depende dos dados do ambiente alvo. Nao manter usuario, email,
cartao ou orcamento reais neste documento.

Use o `01_precheck.sql` para gerar a sugestao e revise manualmente antes de
executar a migration.

## Rollback

Se a migration ja comitou, rode `04_rollback.sql`.
