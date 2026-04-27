-- Migração simplificada de limites de cartão por orçamento (produção)
-- Escopo fixo:
--   id_usuario = 2
--   orcamento_id ano 2026 = 382

BEGIN;

ALTER TABLE admhomefinance.cartao_limites_mensais
  ADD COLUMN IF NOT EXISTS orcamento_id bigint;

-- Garante que o orçamento informado realmente é do usuário e do ano esperado.
DO $$
DECLARE
  v_ok bigint;
BEGIN
  SELECT COUNT(*)
    INTO v_ok
  FROM admhomefinance.orcamentos
  WHERE id = 382
    AND id_usuario = 2
    AND ano = 2026;

  IF v_ok <> 1 THEN
    RAISE EXCEPTION 'Orçamento inválido para a migração: esperado id=382, id_usuario=2, ano=2026.';
  END IF;
END $$;

-- Regra de produção: todos os limites do usuário 2 passam a usar orçamento 382.
UPDATE admhomefinance.cartao_limites_mensais
   SET orcamento_id = 382
 WHERE id_usuario = 2
   AND orcamento_id IS DISTINCT FROM 382;

DO $$
DECLARE
  v_inconsistentes bigint;
BEGIN
  SELECT COUNT(*)
    INTO v_inconsistentes
  FROM admhomefinance.cartao_limites_mensais
  WHERE id_usuario = 2
    AND (orcamento_id IS NULL OR orcamento_id <> 382);

  IF v_inconsistentes > 0 THEN
    RAISE EXCEPTION 'Ainda existem % limites do usuário 2 fora do orçamento 382.', v_inconsistentes;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cartao_limites_mensais_orcamento_id_fkey'
      AND conrelid = 'admhomefinance.cartao_limites_mensais'::regclass
  ) THEN
    ALTER TABLE admhomefinance.cartao_limites_mensais
      ADD CONSTRAINT cartao_limites_mensais_orcamento_id_fkey
      FOREIGN KEY (orcamento_id)
      REFERENCES admhomefinance.orcamentos(id)
      NOT VALID;
  END IF;
END $$;

ALTER TABLE admhomefinance.cartao_limites_mensais
  VALIDATE CONSTRAINT cartao_limites_mensais_orcamento_id_fkey;

COMMIT;

-- Ajuste de PK para suportar limites por orçamento.
ALTER TABLE admhomefinance.cartao_limites_mensais
  DROP CONSTRAINT IF EXISTS cartao_limites_mensais_pkey;

ALTER TABLE admhomefinance.cartao_limites_mensais
  ADD CONSTRAINT cartao_limites_mensais_pkey PRIMARY KEY (cartao_id, orcamento_id, mes);

DO $$
DECLARE
  v_nulls bigint;
BEGIN
  SELECT COUNT(*)
    INTO v_nulls
  FROM admhomefinance.cartao_limites_mensais
  WHERE orcamento_id IS NULL;

  IF v_nulls > 0 THEN
    RAISE EXCEPTION 'Migração abortada: % limites ainda sem orcamento_id.', v_nulls;
  END IF;
END $$;

ALTER TABLE admhomefinance.cartao_limites_mensais
  ALTER COLUMN orcamento_id SET NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cartao_limites_orcamento_id
  ON admhomefinance.cartao_limites_mensais (orcamento_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cartao_limites_usuario_orcamento_mes
  ON admhomefinance.cartao_limites_mensais (id_usuario, orcamento_id, mes);
