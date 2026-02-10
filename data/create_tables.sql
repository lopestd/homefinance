-- Script de Criação do Banco de Dados HomeFinance
-- Dialeto: PostgreSQL

-- 1. Orçamentos
CREATE TABLE orcamentos (
    id_orcamento SERIAL PRIMARY KEY,
    ano INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Orçamento Meses (Subdivisão mensal)
CREATE TABLE orcamento_meses (
    id_orcamento_mes SERIAL PRIMARY KEY,
    id_orcamento INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    CONSTRAINT fk_orcamento FOREIGN KEY (id_orcamento) REFERENCES orcamentos(id_orcamento) ON DELETE CASCADE
);

-- 3. Categorias
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
    ativo BOOLEAN DEFAULT TRUE
);

-- 4. Tipos de Receita
CREATE TABLE tipos_receita (
    id_tipo_receita SERIAL PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL
);

-- 5. Gastos Pré-definidos
CREATE TABLE gastos_predefinidos (
    id_gasto_predefinido SERIAL PRIMARY KEY,
    id_categoria INTEGER NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_gasto_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- 6. Receitas
CREATE TABLE receitas (
    id_receita SERIAL PRIMARY KEY,
    id_orcamento INTEGER NOT NULL,
    id_orcamento_mes INTEGER NOT NULL,
    id_categoria INTEGER NOT NULL,
    id_tipo_receita INTEGER,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    recebida BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_receita_orcamento FOREIGN KEY (id_orcamento) REFERENCES orcamentos(id_orcamento) ON DELETE CASCADE,
    CONSTRAINT fk_receita_mes FOREIGN KEY (id_orcamento_mes) REFERENCES orcamento_meses(id_orcamento_mes) ON DELETE CASCADE,
    CONSTRAINT fk_receita_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    CONSTRAINT fk_receita_tipo FOREIGN KEY (id_tipo_receita) REFERENCES tipos_receita(id_tipo_receita)
);

-- 7. Despesas
CREATE TABLE despesas (
    id_despesa SERIAL PRIMARY KEY,
    id_orcamento INTEGER NOT NULL,
    id_orcamento_mes INTEGER NOT NULL,
    id_categoria INTEGER NOT NULL,
    id_gasto_predefinido INTEGER,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    paga BOOLEAN DEFAULT FALSE,
    tipo_recorrencia VARCHAR(50), -- 'FIXO', 'PARCELADO', 'UNICO'
    qtd_parcelas INTEGER,
    CONSTRAINT fk_despesa_orcamento FOREIGN KEY (id_orcamento) REFERENCES orcamentos(id_orcamento) ON DELETE CASCADE,
    CONSTRAINT fk_despesa_mes FOREIGN KEY (id_orcamento_mes) REFERENCES orcamento_meses(id_orcamento_mes) ON DELETE CASCADE,
    CONSTRAINT fk_despesa_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    CONSTRAINT fk_despesa_gasto FOREIGN KEY (id_gasto_predefinido) REFERENCES gastos_predefinidos(id_gasto_predefinido)
);

-- 8. Cartões
CREATE TABLE cartoes (
    id_cartao SERIAL PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- 9. Cartão Meses (Faturas)
CREATE TABLE cartao_meses (
    id_cartao_mes SERIAL PRIMARY KEY,
    id_cartao INTEGER NOT NULL,
    id_orcamento_mes INTEGER NOT NULL,
    CONSTRAINT fk_cartao_mes_cartao FOREIGN KEY (id_cartao) REFERENCES cartoes(id_cartao) ON DELETE CASCADE,
    CONSTRAINT fk_cartao_mes_orcamento FOREIGN KEY (id_orcamento_mes) REFERENCES orcamento_meses(id_orcamento_mes) ON DELETE CASCADE
);

-- 10. Cartão Lançamentos (Compras)
CREATE TABLE cartao_lancamentos (
    id_cartao_lancamento SERIAL PRIMARY KEY,
    id_cartao_mes INTEGER NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'CORRENTE', 'PARCELADO', 'RECORRENTE'
    paga BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_lancamento_fatura FOREIGN KEY (id_cartao_mes) REFERENCES cartao_meses(id_cartao_mes) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_receitas_mes ON receitas(id_orcamento_mes);
CREATE INDEX idx_despesas_mes ON despesas(id_orcamento_mes);
CREATE INDEX idx_cartao_lancamentos_fatura ON cartao_lancamentos(id_cartao_mes);
