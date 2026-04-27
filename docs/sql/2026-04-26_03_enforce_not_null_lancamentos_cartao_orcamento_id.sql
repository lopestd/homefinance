-- Enforce final simplificado
-- Escopo de validação de negócio: usuário 2 / orçamento 382 (ano 2026)

DO $$
DECLARE
  v_nulls bigint;
  v_inconsistentes_user2 bigint;
BEGIN
  SELECT COUNT(*)
    INTO v_nulls
  FROM admhomefinance.lancamentos_cartao
  WHERE orcamento_id IS NULL;

  IF v_nulls > 0 THEN
    RAISE EXCEPTION 'Enforce abortado: % lançamentos ainda estão com orcamento_id nulo.', v_nulls;
  END IF;

  SELECT COUNT(*)
    INTO v_inconsistentes_user2
  FROM admhomefinance.lancamentos_cartao
  WHERE id_usuario = 2
    AND EXTRACT(YEAR FROM data)::int = 2026
    AND orcamento_id <> 382;

  IF v_inconsistentes_user2 > 0 THEN
    RAISE EXCEPTION 'Enforce abortado: % lançamentos 2026 do usuário 2 não estão no orçamento 382.', v_inconsistentes_user2;
  END IF;
END $$;

ALTER TABLE admhomefinance.lancamentos_cartao
  ALTER COLUMN orcamento_id SET NOT NULL;
