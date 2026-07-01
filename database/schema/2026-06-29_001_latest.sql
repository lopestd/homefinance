--
-- HomeFinance - modelo atual do schema admhomefinance
-- Versao: 2026-06-29_001_latest
-- Gerado em: 2026-06-29
-- Origem: pg_dump --schema-only --no-owner --no-privileges --schema=admhomefinance
--
-- Este arquivo representa o modelo vigente do banco.
-- Diferenca principal em relacao a versao 2026-06-29_000:
-- cartao_faturas_fechadas possui orcamento_id NOT NULL e chave primaria
-- (cartao_id, orcamento_id, mes).
-- Use como referencia principal de modelagem.
--

--
-- PostgreSQL database dump
--

\restrict JTFIbQB5OMPaJM8FBmbayp6thFAvdZN92KxS4e5wFAMEO1K4pKVpiCpGgD4Tux4

-- Dumped from database version 18.2 (Debian 18.2-1.pgdg13+1)
-- Dumped by pg_dump version 18.2 (Debian 18.2-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: admhomefinance; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA admhomefinance;


--
-- Name: categoria_tipo; Type: TYPE; Schema: admhomefinance; Owner: -
--

CREATE TYPE admhomefinance.categoria_tipo AS ENUM (
    'RECEITA',
    'DESPESA'
);


--
-- Name: despesa_status; Type: TYPE; Schema: admhomefinance; Owner: -
--

CREATE TYPE admhomefinance.despesa_status AS ENUM (
    'Pendente',
    'Pago'
);


--
-- Name: receita_status; Type: TYPE; Schema: admhomefinance; Owner: -
--

CREATE TYPE admhomefinance.receita_status AS ENUM (
    'Pendente',
    'Recebido'
);


--
-- Name: recorrencia_tipo; Type: TYPE; Schema: admhomefinance; Owner: -
--

CREATE TYPE admhomefinance.recorrencia_tipo AS ENUM (
    'EVENTUAL',
    'FIXO',
    'PARCELADO',
    'RECORRENTE',
    'CORRENTE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.audit_log (
    id_log bigint NOT NULL,
    id_usuario bigint,
    acao character varying(50) NOT NULL,
    detalhes jsonb,
    ip_origem character varying(45),
    user_agent character varying(500),
    data_evento timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: audit_log_id_log_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.audit_log_id_log_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_id_log_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.audit_log_id_log_seq OWNED BY admhomefinance.audit_log.id_log;


--
-- Name: cartao_faturas_fechadas; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.cartao_faturas_fechadas (
    cartao_id bigint NOT NULL,
    mes smallint NOT NULL,
    id_usuario bigint NOT NULL,
    orcamento_id bigint NOT NULL,
    CONSTRAINT cartao_faturas_fechadas_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


--
-- Name: cartao_lancamentos; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.cartao_lancamentos (
    id bigint NOT NULL,
    cartao_mes_id bigint NOT NULL,
    descricao text NOT NULL,
    valor numeric(12,2) NOT NULL,
    tipo_recorrencia admhomefinance.recorrencia_tipo NOT NULL,
    paga boolean DEFAULT false NOT NULL,
    id_usuario bigint NOT NULL,
    CONSTRAINT cartao_lancamentos_valor_check CHECK ((valor > (0)::numeric))
);


--
-- Name: cartao_lancamentos_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.cartao_lancamentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cartao_lancamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.cartao_lancamentos_id_seq OWNED BY admhomefinance.cartao_lancamentos.id;


--
-- Name: cartao_limites_mensais; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.cartao_limites_mensais (
    cartao_id bigint NOT NULL,
    mes smallint NOT NULL,
    limite numeric(12,2) NOT NULL,
    id_usuario bigint NOT NULL,
    orcamento_id bigint NOT NULL,
    CONSTRAINT cartao_limites_mensais_limite_check CHECK ((limite >= (0)::numeric)),
    CONSTRAINT cartao_limites_mensais_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


--
-- Name: cartao_meses; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.cartao_meses (
    id bigint NOT NULL,
    cartao_id bigint NOT NULL,
    orcamento_mes_id bigint NOT NULL,
    id_usuario bigint NOT NULL
);


--
-- Name: cartao_meses_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.cartao_meses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cartao_meses_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.cartao_meses_id_seq OWNED BY admhomefinance.cartao_meses.id;


--
-- Name: cartoes; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.cartoes (
    id bigint NOT NULL,
    nome text NOT NULL,
    limite numeric(12,2) DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    id_usuario bigint NOT NULL
);


--
-- Name: cartoes_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.cartoes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cartoes_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.cartoes_id_seq OWNED BY admhomefinance.cartoes.id;


--
-- Name: categorias; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.categorias (
    id bigint NOT NULL,
    nome text NOT NULL,
    tipo admhomefinance.categoria_tipo NOT NULL,
    ativa boolean DEFAULT true NOT NULL,
    id_usuario bigint NOT NULL
);


--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.categorias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.categorias_id_seq OWNED BY admhomefinance.categorias.id;


--
-- Name: despesas; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.despesas (
    id bigint NOT NULL,
    orcamento_id bigint NOT NULL,
    categoria_id bigint NOT NULL,
    descricao text NOT NULL,
    complemento text,
    valor numeric(12,2) NOT NULL,
    mes_referencia smallint NOT NULL,
    data date,
    status admhomefinance.despesa_status NOT NULL,
    tipo_recorrencia admhomefinance.recorrencia_tipo,
    parcela_atual smallint,
    total_parcelas smallint,
    id_usuario bigint NOT NULL,
    CONSTRAINT despesas_check CHECK (((parcela_atual IS NULL) OR (total_parcelas IS NULL) OR ((parcela_atual >= 1) AND (parcela_atual <= total_parcelas)))),
    CONSTRAINT despesas_mes_referencia_check CHECK (((mes_referencia >= 1) AND (mes_referencia <= 12))),
    CONSTRAINT despesas_valor_check CHECK ((valor > (0)::numeric))
);


--
-- Name: despesas_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.despesas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: despesas_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.despesas_id_seq OWNED BY admhomefinance.despesas.id;


--
-- Name: despesas_meses; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.despesas_meses (
    despesa_id bigint NOT NULL,
    mes smallint NOT NULL,
    id_usuario bigint NOT NULL,
    CONSTRAINT despesas_meses_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


--
-- Name: gastos_predefinidos; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.gastos_predefinidos (
    id bigint NOT NULL,
    categoria_id bigint NOT NULL,
    descricao text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    id_usuario bigint NOT NULL
);


--
-- Name: gastos_predefinidos_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.gastos_predefinidos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gastos_predefinidos_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.gastos_predefinidos_id_seq OWNED BY admhomefinance.gastos_predefinidos.id;


--
-- Name: lancamentos_cartao; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.lancamentos_cartao (
    id bigint NOT NULL,
    cartao_id bigint NOT NULL,
    categoria_id bigint NOT NULL,
    descricao text NOT NULL,
    complemento text,
    valor numeric(12,2) NOT NULL,
    data date NOT NULL,
    mes_referencia smallint NOT NULL,
    tipo_recorrencia admhomefinance.recorrencia_tipo NOT NULL,
    parcela_atual smallint,
    total_parcelas smallint,
    id_usuario bigint NOT NULL,
    orcamento_id bigint NOT NULL,
    CONSTRAINT lancamentos_cartao_check CHECK (((parcela_atual IS NULL) OR (total_parcelas IS NULL) OR ((parcela_atual >= 1) AND (parcela_atual <= total_parcelas)))),
    CONSTRAINT lancamentos_cartao_mes_referencia_check CHECK (((mes_referencia >= 1) AND (mes_referencia <= 12))),
    CONSTRAINT lancamentos_cartao_valor_check CHECK ((valor > (0)::numeric))
);


--
-- Name: lancamentos_cartao_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.lancamentos_cartao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lancamentos_cartao_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.lancamentos_cartao_id_seq OWNED BY admhomefinance.lancamentos_cartao.id;


--
-- Name: lancamentos_cartao_meses; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.lancamentos_cartao_meses (
    lancamento_id bigint NOT NULL,
    mes smallint NOT NULL,
    id_usuario bigint NOT NULL,
    CONSTRAINT lancamentos_cartao_meses_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


--
-- Name: orcamento_meses; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.orcamento_meses (
    id bigint NOT NULL,
    orcamento_id bigint NOT NULL,
    mes smallint NOT NULL,
    id_usuario bigint NOT NULL,
    CONSTRAINT orcamento_meses_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


--
-- Name: orcamento_meses_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.orcamento_meses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orcamento_meses_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.orcamento_meses_id_seq OWNED BY admhomefinance.orcamento_meses.id;


--
-- Name: orcamentos; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.orcamentos (
    id bigint NOT NULL,
    ano smallint NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp without time zone DEFAULT now(),
    id_usuario bigint NOT NULL
);


--
-- Name: orcamentos_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.orcamentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orcamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.orcamentos_id_seq OWNED BY admhomefinance.orcamentos.id;


--
-- Name: receitas; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.receitas (
    id bigint NOT NULL,
    orcamento_id bigint NOT NULL,
    categoria_id bigint NOT NULL,
    descricao text NOT NULL,
    complemento text,
    valor numeric(12,2) NOT NULL,
    mes_referencia smallint NOT NULL,
    data date,
    status admhomefinance.receita_status NOT NULL,
    tipo_recorrencia admhomefinance.recorrencia_tipo,
    parcela_atual smallint,
    total_parcelas smallint,
    id_usuario bigint NOT NULL,
    CONSTRAINT receitas_check CHECK (((parcela_atual IS NULL) OR (total_parcelas IS NULL) OR ((parcela_atual >= 1) AND (parcela_atual <= total_parcelas)))),
    CONSTRAINT receitas_mes_referencia_check CHECK (((mes_referencia >= 1) AND (mes_referencia <= 12))),
    CONSTRAINT receitas_valor_check CHECK ((valor > (0)::numeric))
);


--
-- Name: receitas_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.receitas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receitas_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.receitas_id_seq OWNED BY admhomefinance.receitas.id;


--
-- Name: receitas_meses; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.receitas_meses (
    receita_id bigint NOT NULL,
    mes smallint NOT NULL,
    id_usuario bigint NOT NULL,
    CONSTRAINT receitas_meses_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


--
-- Name: saldo_inicial_orcamento; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.saldo_inicial_orcamento (
    id integer NOT NULL,
    id_usuario integer NOT NULL,
    orcamento_id integer NOT NULL,
    ano integer NOT NULL,
    saldo_inicial numeric(15,2) DEFAULT 0 NOT NULL,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);


--
-- Name: saldo_inicial_orcamento_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.saldo_inicial_orcamento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: saldo_inicial_orcamento_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.saldo_inicial_orcamento_id_seq OWNED BY admhomefinance.saldo_inicial_orcamento.id;


--
-- Name: sessoes; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.sessoes (
    id_sessao bigint NOT NULL,
    id_usuario bigint NOT NULL,
    token_hash character varying(64) NOT NULL,
    dispositivo character varying(255),
    ip_origem character varying(45),
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_expiracao timestamp without time zone NOT NULL,
    ativa boolean DEFAULT true
);


--
-- Name: sessoes_id_sessao_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.sessoes_id_sessao_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessoes_id_sessao_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.sessoes_id_sessao_seq OWNED BY admhomefinance.sessoes.id_sessao;


--
-- Name: tipos_receita; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.tipos_receita (
    id bigint NOT NULL,
    descricao text NOT NULL,
    recorrente boolean DEFAULT false NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    id_usuario bigint NOT NULL
);


--
-- Name: tipos_receita_id_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.tipos_receita_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_receita_id_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.tipos_receita_id_seq OWNED BY admhomefinance.tipos_receita.id;


--
-- Name: usuarios; Type: TABLE; Schema: admhomefinance; Owner: -
--

CREATE TABLE admhomefinance.usuarios (
    id_usuario bigint NOT NULL,
    email character varying(255) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    salt character varying(64) NOT NULL,
    nome character varying(100),
    ativo boolean DEFAULT true,
    email_verificado boolean DEFAULT false,
    tentativas_login integer DEFAULT 0,
    bloqueado_ate timestamp without time zone,
    ultimo_login timestamp without time zone,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))
);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: admhomefinance; Owner: -
--

CREATE SEQUENCE admhomefinance.usuarios_id_usuario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: admhomefinance; Owner: -
--

ALTER SEQUENCE admhomefinance.usuarios_id_usuario_seq OWNED BY admhomefinance.usuarios.id_usuario;


--
-- Name: audit_log id_log; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.audit_log ALTER COLUMN id_log SET DEFAULT nextval('admhomefinance.audit_log_id_log_seq'::regclass);


--
-- Name: cartao_lancamentos id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_lancamentos ALTER COLUMN id SET DEFAULT nextval('admhomefinance.cartao_lancamentos_id_seq'::regclass);


--
-- Name: cartao_meses id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_meses ALTER COLUMN id SET DEFAULT nextval('admhomefinance.cartao_meses_id_seq'::regclass);


--
-- Name: cartoes id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartoes ALTER COLUMN id SET DEFAULT nextval('admhomefinance.cartoes_id_seq'::regclass);


--
-- Name: categorias id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.categorias ALTER COLUMN id SET DEFAULT nextval('admhomefinance.categorias_id_seq'::regclass);


--
-- Name: despesas id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.despesas ALTER COLUMN id SET DEFAULT nextval('admhomefinance.despesas_id_seq'::regclass);


--
-- Name: gastos_predefinidos id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.gastos_predefinidos ALTER COLUMN id SET DEFAULT nextval('admhomefinance.gastos_predefinidos_id_seq'::regclass);


--
-- Name: lancamentos_cartao id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.lancamentos_cartao ALTER COLUMN id SET DEFAULT nextval('admhomefinance.lancamentos_cartao_id_seq'::regclass);


--
-- Name: orcamento_meses id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.orcamento_meses ALTER COLUMN id SET DEFAULT nextval('admhomefinance.orcamento_meses_id_seq'::regclass);


--
-- Name: orcamentos id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.orcamentos ALTER COLUMN id SET DEFAULT nextval('admhomefinance.orcamentos_id_seq'::regclass);


--
-- Name: receitas id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.receitas ALTER COLUMN id SET DEFAULT nextval('admhomefinance.receitas_id_seq'::regclass);


--
-- Name: saldo_inicial_orcamento id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.saldo_inicial_orcamento ALTER COLUMN id SET DEFAULT nextval('admhomefinance.saldo_inicial_orcamento_id_seq'::regclass);


--
-- Name: sessoes id_sessao; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.sessoes ALTER COLUMN id_sessao SET DEFAULT nextval('admhomefinance.sessoes_id_sessao_seq'::regclass);


--
-- Name: tipos_receita id; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.tipos_receita ALTER COLUMN id SET DEFAULT nextval('admhomefinance.tipos_receita_id_seq'::regclass);


--
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('admhomefinance.usuarios_id_usuario_seq'::regclass);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id_log);


--
-- Name: cartao_faturas_fechadas cartao_faturas_fechadas_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_faturas_fechadas
    ADD CONSTRAINT cartao_faturas_fechadas_pkey PRIMARY KEY (cartao_id, orcamento_id, mes);


--
-- Name: cartao_lancamentos cartao_lancamentos_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_lancamentos
    ADD CONSTRAINT cartao_lancamentos_pkey PRIMARY KEY (id);


--
-- Name: cartao_limites_mensais cartao_limites_mensais_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_limites_mensais
    ADD CONSTRAINT cartao_limites_mensais_pkey PRIMARY KEY (cartao_id, orcamento_id, mes);


--
-- Name: cartao_meses cartao_meses_cartao_id_orcamento_mes_id_key; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_meses
    ADD CONSTRAINT cartao_meses_cartao_id_orcamento_mes_id_key UNIQUE (cartao_id, orcamento_mes_id);


--
-- Name: cartao_meses cartao_meses_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_meses
    ADD CONSTRAINT cartao_meses_pkey PRIMARY KEY (id);


--
-- Name: cartoes cartoes_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartoes
    ADD CONSTRAINT cartoes_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: despesas_meses despesas_meses_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.despesas_meses
    ADD CONSTRAINT despesas_meses_pkey PRIMARY KEY (despesa_id, mes);


--
-- Name: despesas despesas_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.despesas
    ADD CONSTRAINT despesas_pkey PRIMARY KEY (id);


--
-- Name: gastos_predefinidos gastos_predefinidos_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.gastos_predefinidos
    ADD CONSTRAINT gastos_predefinidos_pkey PRIMARY KEY (id);


--
-- Name: lancamentos_cartao_meses lancamentos_cartao_meses_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.lancamentos_cartao_meses
    ADD CONSTRAINT lancamentos_cartao_meses_pkey PRIMARY KEY (lancamento_id, mes);


--
-- Name: lancamentos_cartao lancamentos_cartao_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.lancamentos_cartao
    ADD CONSTRAINT lancamentos_cartao_pkey PRIMARY KEY (id);


--
-- Name: orcamento_meses orcamento_meses_orcamento_id_mes_key; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.orcamento_meses
    ADD CONSTRAINT orcamento_meses_orcamento_id_mes_key UNIQUE (orcamento_id, mes);


--
-- Name: orcamento_meses orcamento_meses_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.orcamento_meses
    ADD CONSTRAINT orcamento_meses_pkey PRIMARY KEY (id);


--
-- Name: orcamentos orcamentos_ano_key; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.orcamentos
    ADD CONSTRAINT orcamentos_ano_key UNIQUE (ano);


--
-- Name: orcamentos orcamentos_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.orcamentos
    ADD CONSTRAINT orcamentos_pkey PRIMARY KEY (id);


--
-- Name: receitas_meses receitas_meses_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.receitas_meses
    ADD CONSTRAINT receitas_meses_pkey PRIMARY KEY (receita_id, mes);


--
-- Name: receitas receitas_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.receitas
    ADD CONSTRAINT receitas_pkey PRIMARY KEY (id);


--
-- Name: saldo_inicial_orcamento saldo_inicial_orcamento_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.saldo_inicial_orcamento
    ADD CONSTRAINT saldo_inicial_orcamento_pkey PRIMARY KEY (id);


--
-- Name: sessoes sessoes_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.sessoes
    ADD CONSTRAINT sessoes_pkey PRIMARY KEY (id_sessao);


--
-- Name: tipos_receita tipos_receita_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.tipos_receita
    ADD CONSTRAINT tipos_receita_pkey PRIMARY KEY (id);


--
-- Name: saldo_inicial_orcamento unique_saldo_inicial; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.saldo_inicial_orcamento
    ADD CONSTRAINT unique_saldo_inicial UNIQUE (id_usuario, orcamento_id, ano);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: idx_audit_data; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_audit_data ON admhomefinance.audit_log USING btree (data_evento);


--
-- Name: idx_audit_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_audit_usuario ON admhomefinance.audit_log USING btree (id_usuario);


--
-- Name: idx_cartao_faturas_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_cartao_faturas_usuario ON admhomefinance.cartao_faturas_fechadas USING btree (id_usuario);


--
-- Name: idx_cartao_faturas_usuario_orcamento; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_cartao_faturas_usuario_orcamento ON admhomefinance.cartao_faturas_fechadas USING btree (id_usuario, cartao_id, orcamento_id);


--
-- Name: idx_cartao_lancamentos_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_cartao_lancamentos_usuario ON admhomefinance.cartao_lancamentos USING btree (id_usuario);


--
-- Name: idx_cartao_limites_orcamento_id; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_cartao_limites_orcamento_id ON admhomefinance.cartao_limites_mensais USING btree (orcamento_id);


--
-- Name: idx_cartao_limites_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_cartao_limites_usuario ON admhomefinance.cartao_limites_mensais USING btree (id_usuario);


--
-- Name: idx_cartao_limites_usuario_orcamento_mes; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_cartao_limites_usuario_orcamento_mes ON admhomefinance.cartao_limites_mensais USING btree (id_usuario, orcamento_id, mes);


--
-- Name: idx_cartao_meses_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_cartao_meses_usuario ON admhomefinance.cartao_meses USING btree (id_usuario);


--
-- Name: idx_cartoes_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_cartoes_usuario ON admhomefinance.cartoes USING btree (id_usuario);


--
-- Name: idx_categorias_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_categorias_usuario ON admhomefinance.categorias USING btree (id_usuario);


--
-- Name: idx_despesas_meses_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_despesas_meses_usuario ON admhomefinance.despesas_meses USING btree (id_usuario);


--
-- Name: idx_despesas_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_despesas_usuario ON admhomefinance.despesas USING btree (id_usuario);


--
-- Name: idx_gastos_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_gastos_usuario ON admhomefinance.gastos_predefinidos USING btree (id_usuario);


--
-- Name: idx_lancamentos_cartao_meses_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_lancamentos_cartao_meses_usuario ON admhomefinance.lancamentos_cartao_meses USING btree (id_usuario);


--
-- Name: idx_lancamentos_cartao_orcamento_id; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_lancamentos_cartao_orcamento_id ON admhomefinance.lancamentos_cartao USING btree (orcamento_id);


--
-- Name: idx_lancamentos_cartao_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_lancamentos_cartao_usuario ON admhomefinance.lancamentos_cartao USING btree (id_usuario);


--
-- Name: idx_lancamentos_cartao_usuario_orcamento_mes_cartao; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_lancamentos_cartao_usuario_orcamento_mes_cartao ON admhomefinance.lancamentos_cartao USING btree (id_usuario, orcamento_id, mes_referencia, cartao_id);


--
-- Name: idx_orcamento_meses_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_orcamento_meses_usuario ON admhomefinance.orcamento_meses USING btree (id_usuario);


--
-- Name: idx_orcamentos_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_orcamentos_usuario ON admhomefinance.orcamentos USING btree (id_usuario);


--
-- Name: idx_receitas_meses_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_receitas_meses_usuario ON admhomefinance.receitas_meses USING btree (id_usuario);


--
-- Name: idx_receitas_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_receitas_usuario ON admhomefinance.receitas USING btree (id_usuario);


--
-- Name: idx_saldo_inicial_ano; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_saldo_inicial_ano ON admhomefinance.saldo_inicial_orcamento USING btree (ano);


--
-- Name: idx_saldo_inicial_orcamento; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_saldo_inicial_orcamento ON admhomefinance.saldo_inicial_orcamento USING btree (orcamento_id);


--
-- Name: idx_saldo_inicial_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_saldo_inicial_usuario ON admhomefinance.saldo_inicial_orcamento USING btree (id_usuario);


--
-- Name: idx_sessoes_token; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_sessoes_token ON admhomefinance.sessoes USING btree (token_hash);


--
-- Name: idx_sessoes_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_sessoes_usuario ON admhomefinance.sessoes USING btree (id_usuario);


--
-- Name: idx_tipos_receita_usuario; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_tipos_receita_usuario ON admhomefinance.tipos_receita USING btree (id_usuario);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE INDEX idx_usuarios_email ON admhomefinance.usuarios USING btree (lower((email)::text));


--
-- Name: idx_usuarios_email_unique; Type: INDEX; Schema: admhomefinance; Owner: -
--

CREATE UNIQUE INDEX idx_usuarios_email_unique ON admhomefinance.usuarios USING btree (lower((email)::text));


--
-- Name: audit_log audit_log_id_usuario_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.audit_log
    ADD CONSTRAINT audit_log_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario) ON DELETE SET NULL;


--
-- Name: cartao_faturas_fechadas cartao_faturas_fechadas_cartao_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_faturas_fechadas
    ADD CONSTRAINT cartao_faturas_fechadas_cartao_id_fkey FOREIGN KEY (cartao_id) REFERENCES admhomefinance.cartoes(id) ON DELETE CASCADE;


--
-- Name: cartao_faturas_fechadas cartao_faturas_fechadas_orcamento_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_faturas_fechadas
    ADD CONSTRAINT cartao_faturas_fechadas_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES admhomefinance.orcamentos(id) ON DELETE CASCADE;


--
-- Name: cartao_lancamentos cartao_lancamentos_cartao_mes_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_lancamentos
    ADD CONSTRAINT cartao_lancamentos_cartao_mes_id_fkey FOREIGN KEY (cartao_mes_id) REFERENCES admhomefinance.cartao_meses(id) ON DELETE CASCADE;


--
-- Name: cartao_limites_mensais cartao_limites_mensais_cartao_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_limites_mensais
    ADD CONSTRAINT cartao_limites_mensais_cartao_id_fkey FOREIGN KEY (cartao_id) REFERENCES admhomefinance.cartoes(id) ON DELETE CASCADE;


--
-- Name: cartao_limites_mensais cartao_limites_mensais_orcamento_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_limites_mensais
    ADD CONSTRAINT cartao_limites_mensais_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES admhomefinance.orcamentos(id);


--
-- Name: cartao_meses cartao_meses_cartao_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_meses
    ADD CONSTRAINT cartao_meses_cartao_id_fkey FOREIGN KEY (cartao_id) REFERENCES admhomefinance.cartoes(id) ON DELETE CASCADE;


--
-- Name: cartao_meses cartao_meses_orcamento_mes_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_meses
    ADD CONSTRAINT cartao_meses_orcamento_mes_id_fkey FOREIGN KEY (orcamento_mes_id) REFERENCES admhomefinance.orcamento_meses(id) ON DELETE CASCADE;


--
-- Name: despesas despesas_categoria_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.despesas
    ADD CONSTRAINT despesas_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES admhomefinance.categorias(id);


--
-- Name: despesas_meses despesas_meses_despesa_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.despesas_meses
    ADD CONSTRAINT despesas_meses_despesa_id_fkey FOREIGN KEY (despesa_id) REFERENCES admhomefinance.despesas(id) ON DELETE CASCADE;


--
-- Name: despesas despesas_orcamento_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.despesas
    ADD CONSTRAINT despesas_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES admhomefinance.orcamentos(id);


--
-- Name: cartao_faturas_fechadas fk_cartao_faturas_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_faturas_fechadas
    ADD CONSTRAINT fk_cartao_faturas_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: cartao_lancamentos fk_cartao_lancamentos_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_lancamentos
    ADD CONSTRAINT fk_cartao_lancamentos_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: cartao_limites_mensais fk_cartao_limites_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_limites_mensais
    ADD CONSTRAINT fk_cartao_limites_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: cartao_meses fk_cartao_meses_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartao_meses
    ADD CONSTRAINT fk_cartao_meses_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: cartoes fk_cartoes_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.cartoes
    ADD CONSTRAINT fk_cartoes_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: categorias fk_categorias_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.categorias
    ADD CONSTRAINT fk_categorias_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: despesas_meses fk_despesas_meses_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.despesas_meses
    ADD CONSTRAINT fk_despesas_meses_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: despesas fk_despesas_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.despesas
    ADD CONSTRAINT fk_despesas_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: gastos_predefinidos fk_gastos_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.gastos_predefinidos
    ADD CONSTRAINT fk_gastos_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: lancamentos_cartao_meses fk_lancamentos_cartao_meses_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.lancamentos_cartao_meses
    ADD CONSTRAINT fk_lancamentos_cartao_meses_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: lancamentos_cartao fk_lancamentos_cartao_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.lancamentos_cartao
    ADD CONSTRAINT fk_lancamentos_cartao_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: orcamento_meses fk_orcamento_meses_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.orcamento_meses
    ADD CONSTRAINT fk_orcamento_meses_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: orcamentos fk_orcamentos_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.orcamentos
    ADD CONSTRAINT fk_orcamentos_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: receitas_meses fk_receitas_meses_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.receitas_meses
    ADD CONSTRAINT fk_receitas_meses_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: receitas fk_receitas_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.receitas
    ADD CONSTRAINT fk_receitas_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: tipos_receita fk_tipos_usuario; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.tipos_receita
    ADD CONSTRAINT fk_tipos_usuario FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario);


--
-- Name: gastos_predefinidos gastos_predefinidos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.gastos_predefinidos
    ADD CONSTRAINT gastos_predefinidos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES admhomefinance.categorias(id);


--
-- Name: lancamentos_cartao lancamentos_cartao_cartao_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.lancamentos_cartao
    ADD CONSTRAINT lancamentos_cartao_cartao_id_fkey FOREIGN KEY (cartao_id) REFERENCES admhomefinance.cartoes(id);


--
-- Name: lancamentos_cartao lancamentos_cartao_categoria_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.lancamentos_cartao
    ADD CONSTRAINT lancamentos_cartao_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES admhomefinance.categorias(id);


--
-- Name: lancamentos_cartao_meses lancamentos_cartao_meses_lancamento_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.lancamentos_cartao_meses
    ADD CONSTRAINT lancamentos_cartao_meses_lancamento_id_fkey FOREIGN KEY (lancamento_id) REFERENCES admhomefinance.lancamentos_cartao(id) ON DELETE CASCADE;


--
-- Name: lancamentos_cartao lancamentos_cartao_orcamento_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.lancamentos_cartao
    ADD CONSTRAINT lancamentos_cartao_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES admhomefinance.orcamentos(id);


--
-- Name: orcamento_meses orcamento_meses_orcamento_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.orcamento_meses
    ADD CONSTRAINT orcamento_meses_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES admhomefinance.orcamentos(id) ON DELETE CASCADE;


--
-- Name: receitas receitas_categoria_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.receitas
    ADD CONSTRAINT receitas_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES admhomefinance.categorias(id);


--
-- Name: receitas_meses receitas_meses_receita_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.receitas_meses
    ADD CONSTRAINT receitas_meses_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES admhomefinance.receitas(id) ON DELETE CASCADE;


--
-- Name: receitas receitas_orcamento_id_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.receitas
    ADD CONSTRAINT receitas_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES admhomefinance.orcamentos(id);


--
-- Name: sessoes sessoes_id_usuario_fkey; Type: FK CONSTRAINT; Schema: admhomefinance; Owner: -
--

ALTER TABLE ONLY admhomefinance.sessoes
    ADD CONSTRAINT sessoes_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES admhomefinance.usuarios(id_usuario) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict JTFIbQB5OMPaJM8FBmbayp6thFAvdZN92KxS4e5wFAMEO1K4pKVpiCpGgD4Tux4
