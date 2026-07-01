-- Postcheck - cartao_faturas_fechadas por orcamento

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'admhomefinance'
      AND table_name = 'cartao_faturas_fechadas'
      AND column_name = 'orcamento_id'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'Coluna obrigatoria cartao_faturas_fechadas.orcamento_id nao encontrada.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM admhomefinance.cartao_faturas_fechadas
    WHERE orcamento_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Existem faturas fechadas com orcamento_id nulo.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'admhomefinance.cartao_faturas_fechadas'::regclass
      AND conname = 'cartao_faturas_fechadas_pkey'
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (cartao_id, orcamento_id, mes)'
  ) THEN
    RAISE EXCEPTION 'PK esperada PRIMARY KEY (cartao_id, orcamento_id, mes) nao encontrada.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'admhomefinance.cartao_faturas_fechadas'::regclass
      AND conname = 'cartao_faturas_fechadas_orcamento_id_fkey'
  ) THEN
    RAISE EXCEPTION 'FK cartao_faturas_fechadas_orcamento_id_fkey nao encontrada.';
  END IF;
END $$;

SELECT
  f.id_usuario,
  f.cartao_id,
  c.nome AS cartao_nome,
  f.orcamento_id,
  o.ano,
  f.mes
FROM admhomefinance.cartao_faturas_fechadas f
JOIN admhomefinance.cartoes c
  ON c.id = f.cartao_id
JOIN admhomefinance.orcamentos o
  ON o.id = f.orcamento_id
ORDER BY f.id_usuario, f.cartao_id, f.orcamento_id, f.mes;

SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'admhomefinance.cartao_faturas_fechadas'::regclass
ORDER BY conname;
