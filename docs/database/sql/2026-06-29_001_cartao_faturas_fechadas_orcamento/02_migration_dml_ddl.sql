-- Migration 2026-06-29_001
-- Objetivo: diferenciar fatura fechada por cartao + orcamento + mes.
-- Escopo: somente admhomefinance.cartao_faturas_fechadas.
-- Nao altera admhomefinance.lancamentos_cartao.

BEGIN;

LOCK TABLE admhomefinance.cartao_faturas_fechadas IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'admhomefinance'
      AND table_name = 'cartao_faturas_fechadas'
      AND column_name = 'orcamento_id'
  ) THEN
    RAISE EXCEPTION 'cartao_faturas_fechadas.orcamento_id ja existe. Migration abortada.';
  END IF;

  IF to_regclass('admhomefinance.bkp_cartao_faturas_fechadas_20260629_001') IS NOT NULL THEN
    RAISE EXCEPTION 'Backup admhomefinance.bkp_cartao_faturas_fechadas_20260629_001 ja existe. Verifique antes de continuar.';
  END IF;
END $$;

CREATE TABLE admhomefinance.bkp_cartao_faturas_fechadas_20260629_001 AS
SELECT *
FROM admhomefinance.cartao_faturas_fechadas;

ALTER TABLE admhomefinance.cartao_faturas_fechadas
ADD COLUMN orcamento_id bigint;

-- BLOCO DE BACKFILL.
-- Preencher com os UPDATEs revisados a partir da saida backfill_sugerido do
-- 01_precheck.sql.
--
-- Modelo:
-- UPDATE admhomefinance.cartao_faturas_fechadas
-- SET orcamento_id = <orcamento_id>
-- WHERE id_usuario = <id_usuario>
--   AND cartao_id = <cartao_id>
--   AND mes IN (<meses>);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM admhomefinance.cartao_faturas_fechadas
    WHERE orcamento_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Existem faturas fechadas sem orcamento_id. Complete o DML de backfill antes de aplicar as constraints.';
  END IF;
END $$;

ALTER TABLE admhomefinance.cartao_faturas_fechadas
ALTER COLUMN orcamento_id SET NOT NULL;

ALTER TABLE admhomefinance.cartao_faturas_fechadas
DROP CONSTRAINT cartao_faturas_fechadas_pkey;

ALTER TABLE admhomefinance.cartao_faturas_fechadas
ADD CONSTRAINT cartao_faturas_fechadas_pkey
PRIMARY KEY (cartao_id, orcamento_id, mes);

ALTER TABLE admhomefinance.cartao_faturas_fechadas
ADD CONSTRAINT cartao_faturas_fechadas_orcamento_id_fkey
FOREIGN KEY (orcamento_id)
REFERENCES admhomefinance.orcamentos(id)
ON DELETE CASCADE;

CREATE INDEX idx_cartao_faturas_usuario_orcamento
ON admhomefinance.cartao_faturas_fechadas (id_usuario, cartao_id, orcamento_id);

COMMIT;
