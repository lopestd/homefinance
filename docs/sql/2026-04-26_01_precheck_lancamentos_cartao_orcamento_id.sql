-- Precheck simplificado (produção)
-- Escopo fixo:
--   id_usuario = 2
--   orcamento_id ano 2026 = 382

SELECT
  (SELECT COUNT(*) FROM admhomefinance.lancamentos_cartao WHERE id_usuario = 2) AS total_lancamentos_cartao_user2,
  (SELECT COUNT(*) FROM admhomefinance.lancamentos_cartao WHERE id_usuario = 2 AND EXTRACT(YEAR FROM data)::int = 2026) AS total_lancamentos_2026_user2,
  (SELECT COUNT(*) FROM admhomefinance.lancamentos_cartao WHERE id_usuario = 2 AND EXTRACT(YEAR FROM data)::int = 2026 AND (orcamento_id IS NULL OR orcamento_id <> 382)) AS lancamentos_2026_fora_orcamento_382,
  (SELECT COUNT(*) FROM admhomefinance.cartao_limites_mensais WHERE id_usuario = 2) AS total_limites_cartao_user2,
  (SELECT COUNT(*) FROM admhomefinance.cartao_limites_mensais WHERE id_usuario = 2 AND (orcamento_id IS NULL OR orcamento_id <> 382)) AS limites_fora_orcamento_382;

-- Amostra de lançamentos fora da regra esperada (deve retornar 0 linhas)
SELECT
  id,
  id_usuario,
  orcamento_id,
  data,
  mes_referencia,
  descricao,
  valor
FROM admhomefinance.lancamentos_cartao
WHERE id_usuario = 2
  AND EXTRACT(YEAR FROM data)::int = 2026
  AND (orcamento_id IS NULL OR orcamento_id <> 382)
ORDER BY id
LIMIT 100;

-- Amostra de limites fora da regra esperada (deve retornar 0 linhas)
SELECT
  cartao_id,
  id_usuario,
  orcamento_id,
  mes,
  limite
FROM admhomefinance.cartao_limites_mensais
WHERE id_usuario = 2
  AND (orcamento_id IS NULL OR orcamento_id <> 382)
ORDER BY cartao_id, mes
LIMIT 100;
