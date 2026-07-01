-- Rollback 2026-06-29_001
-- Retorna cartao_faturas_fechadas ao modelo anterior: cartao_id + mes.
-- Use somente se for necessario desfazer a migration 2026-06-29_001.

BEGIN;

LOCK TABLE admhomefinance.cartao_faturas_fechadas IN ACCESS EXCLUSIVE MODE;

DROP INDEX IF EXISTS admhomefinance.idx_cartao_faturas_usuario_orcamento;

ALTER TABLE admhomefinance.cartao_faturas_fechadas
DROP CONSTRAINT IF EXISTS cartao_faturas_fechadas_orcamento_id_fkey;

ALTER TABLE admhomefinance.cartao_faturas_fechadas
DROP CONSTRAINT IF EXISTS cartao_faturas_fechadas_pkey;

ALTER TABLE admhomefinance.cartao_faturas_fechadas
DROP COLUMN IF EXISTS orcamento_id;

ALTER TABLE admhomefinance.cartao_faturas_fechadas
ADD CONSTRAINT cartao_faturas_fechadas_pkey
PRIMARY KEY (cartao_id, mes);

COMMIT;
