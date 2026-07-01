-- Precheck - cartao_faturas_fechadas por orcamento
-- Objetivo: listar faturas atuais e sugerir o backfill de orcamento_id.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'admhomefinance'
      AND table_name = 'cartao_faturas_fechadas'
  ) THEN
    RAISE EXCEPTION 'Tabela admhomefinance.cartao_faturas_fechadas nao encontrada.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'admhomefinance'
      AND table_name = 'cartao_faturas_fechadas'
      AND column_name = 'orcamento_id'
  ) THEN
    RAISE EXCEPTION 'cartao_faturas_fechadas.orcamento_id ja existe. Nao execute esta migration novamente.';
  END IF;
END $$;

SELECT 'faturas_fechadas_atuais' AS secao;

SELECT
  f.id_usuario,
  u.email,
  u.nome AS usuario_nome,
  f.cartao_id,
  c.nome AS cartao_nome,
  f.mes
FROM admhomefinance.cartao_faturas_fechadas f
JOIN admhomefinance.usuarios u
  ON u.id_usuario = f.id_usuario
JOIN admhomefinance.cartoes c
  ON c.id = f.cartao_id
ORDER BY f.id_usuario, f.cartao_id, f.mes;

SELECT 'orcamentos_dos_usuarios' AS secao;

SELECT
  o.id AS orcamento_id,
  o.id_usuario,
  u.email,
  o.ano,
  o.ativo
FROM admhomefinance.orcamentos o
JOIN admhomefinance.usuarios u
  ON u.id_usuario = o.id_usuario
WHERE EXISTS (
  SELECT 1
  FROM admhomefinance.cartao_faturas_fechadas f
  WHERE f.id_usuario = o.id_usuario
)
ORDER BY o.id_usuario, o.ano, o.id;

SELECT 'backfill_sugerido' AS secao;

WITH candidatos AS (
  SELECT
    f.id_usuario,
    u.email,
    f.cartao_id,
    c.nome AS cartao_nome,
    f.mes,
    array_remove(array_agg(DISTINCT lc.orcamento_id ORDER BY lc.orcamento_id), NULL)
      AS orcamentos_por_lancamento,
    array_remove(array_agg(DISTINCT clm.orcamento_id ORDER BY clm.orcamento_id), NULL)
      AS orcamentos_por_limite
  FROM admhomefinance.cartao_faturas_fechadas f
  JOIN admhomefinance.usuarios u
    ON u.id_usuario = f.id_usuario
  JOIN admhomefinance.cartoes c
    ON c.id = f.cartao_id
  LEFT JOIN admhomefinance.lancamentos_cartao lc
    ON lc.id_usuario = f.id_usuario
   AND lc.cartao_id = f.cartao_id
   AND lc.mes_referencia = f.mes
  LEFT JOIN admhomefinance.cartao_limites_mensais clm
    ON clm.id_usuario = f.id_usuario
   AND clm.cartao_id = f.cartao_id
   AND clm.mes = f.mes
  GROUP BY f.id_usuario, u.email, f.cartao_id, c.nome, f.mes
),
decisao AS (
  SELECT
    *,
    CASE
      WHEN cardinality(orcamentos_por_lancamento) = 1
        THEN orcamentos_por_lancamento[1]
      WHEN cardinality(orcamentos_por_lancamento) = 0
       AND cardinality(orcamentos_por_limite) = 1
        THEN orcamentos_por_limite[1]
      ELSE NULL
    END AS orcamento_id_sugerido
  FROM candidatos
)
SELECT
  id_usuario,
  email,
  cartao_id,
  cartao_nome,
  mes,
  orcamentos_por_lancamento,
  orcamentos_por_limite,
  orcamento_id_sugerido,
  CASE
    WHEN orcamento_id_sugerido IS NULL THEN 'REVISAR'
    ELSE 'OK'
  END AS status,
  CASE
    WHEN orcamento_id_sugerido IS NOT NULL THEN format(
      'UPDATE admhomefinance.cartao_faturas_fechadas SET orcamento_id = %s WHERE id_usuario = %s AND cartao_id = %s AND mes = %s;',
      orcamento_id_sugerido,
      id_usuario,
      cartao_id,
      mes
    )
  END AS update_sugerido
FROM decisao
ORDER BY id_usuario, cartao_id, mes;
