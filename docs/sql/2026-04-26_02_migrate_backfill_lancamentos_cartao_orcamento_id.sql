-- Migração simplificada (produção)
-- Escopo fixo:
--   id_usuario = 2
--   orcamento_id ano 2026 = 382

BEGIN;

ALTER TABLE admhomefinance.lancamentos_cartao
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

-- Regra de produção: lançamentos de cartão de 2026 do usuário 2 devem ficar no orçamento 382.
UPDATE admhomefinance.lancamentos_cartao
   SET orcamento_id = 382
 WHERE id_usuario = 2
   AND EXTRACT(YEAR FROM data)::int = 2026
   AND orcamento_id IS DISTINCT FROM 382;

DO $$
DECLARE
  v_inconsistentes bigint;
BEGIN
  SELECT COUNT(*)
    INTO v_inconsistentes
  FROM admhomefinance.lancamentos_cartao
  WHERE id_usuario = 2
    AND EXTRACT(YEAR FROM data)::int = 2026
    AND (orcamento_id IS NULL OR orcamento_id <> 382);

  IF v_inconsistentes > 0 THEN
    RAISE EXCEPTION 'Ainda existem % lançamentos 2026 do usuário 2 fora do orçamento 382.', v_inconsistentes;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lancamentos_cartao_orcamento_id_fkey'
      AND conrelid = 'admhomefinance.lancamentos_cartao'::regclass
  ) THEN
    ALTER TABLE admhomefinance.lancamentos_cartao
      ADD CONSTRAINT lancamentos_cartao_orcamento_id_fkey
      FOREIGN KEY (orcamento_id)
      REFERENCES admhomefinance.orcamentos(id)
      NOT VALID;
  END IF;
END $$;

ALTER TABLE admhomefinance.lancamentos_cartao
  VALIDATE CONSTRAINT lancamentos_cartao_orcamento_id_fkey;

COMMIT;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lancamentos_cartao_orcamento_id
  ON admhomefinance.lancamentos_cartao (orcamento_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lancamentos_cartao_usuario_orcamento_mes_cartao
  ON admhomefinance.lancamentos_cartao (id_usuario, orcamento_id, mes_referencia, cartao_id);
