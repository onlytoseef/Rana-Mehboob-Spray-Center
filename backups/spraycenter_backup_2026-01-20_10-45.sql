--
-- PostgreSQL database dump
--

\restrict KaDgdMdkM4ClH7bWop4rKd6J8cF3GQnefmbLczsx7ylBDGo2xjLGJiGCSFyfqTb

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(50),
    ledger_balance numeric(12,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: import_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_invoices (
    id integer NOT NULL,
    supplier_id integer,
    invoice_no character varying(100),
    type character varying(20) DEFAULT 'cash'::character varying,
    total_amount numeric(12,2) DEFAULT 0.00,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.import_invoices OWNER TO postgres;

--
-- Name: import_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.import_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_invoices_id_seq OWNER TO postgres;

--
-- Name: import_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.import_invoices_id_seq OWNED BY public.import_invoices.id;


--
-- Name: import_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_items (
    id integer NOT NULL,
    import_invoice_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    batch_id integer
);


ALTER TABLE public.import_items OWNER TO postgres;

--
-- Name: import_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.import_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_items_id_seq OWNER TO postgres;

--
-- Name: import_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.import_items_id_seq OWNED BY public.import_items.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
    reference_id integer,
    partner_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    method character varying(50) DEFAULT 'cash'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: product_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_batches (
    batch_id integer NOT NULL,
    product_id integer,
    batch_number character varying(100) NOT NULL,
    expiry_date date,
    quantity integer DEFAULT 0,
    import_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_batches OWNER TO postgres;

--
-- Name: product_batches_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_batches_batch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_batches_batch_id_seq OWNER TO postgres;

--
-- Name: product_batches_batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_batches_batch_id_seq OWNED BY public.product_batches.batch_id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100),
    unit character varying(50),
    opening_stock integer DEFAULT 0,
    opening_cost numeric(10,2) DEFAULT 0.00,
    current_stock integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: return_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_items (
    id integer NOT NULL,
    return_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    batch_id integer
);


ALTER TABLE public.return_items OWNER TO postgres;

--
-- Name: return_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.return_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.return_items_id_seq OWNER TO postgres;

--
-- Name: return_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.return_items_id_seq OWNED BY public.return_items.id;


--
-- Name: returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.returns (
    id integer NOT NULL,
    return_no character varying(20) NOT NULL,
    return_type character varying(20) NOT NULL,
    invoice_id integer NOT NULL,
    party_id integer NOT NULL,
    total_amount numeric(12,2) DEFAULT 0,
    reason character varying(50),
    refund_type character varying(20) DEFAULT 'credit'::character varying,
    notes text,
    status character varying(20) DEFAULT 'completed'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT returns_return_type_check CHECK (((return_type)::text = ANY ((ARRAY['customer'::character varying, 'supplier'::character varying])::text[])))
);


ALTER TABLE public.returns OWNER TO postgres;

--
-- Name: returns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.returns_id_seq OWNER TO postgres;

--
-- Name: returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.returns_id_seq OWNED BY public.returns.id;


--
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_invoices (
    id integer NOT NULL,
    customer_id integer,
    invoice_no character varying(100),
    type character varying(20) DEFAULT 'cash'::character varying,
    total_amount numeric(12,2) DEFAULT 0.00,
    discount_percent numeric(5,2) DEFAULT 0.00,
    discount_amount numeric(12,2) DEFAULT 0.00,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sales_invoices OWNER TO postgres;

--
-- Name: sales_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_invoices_id_seq OWNER TO postgres;

--
-- Name: sales_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_invoices_id_seq OWNED BY public.sales_invoices.id;


--
-- Name: sales_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_items (
    id integer NOT NULL,
    invoice_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    batch_id integer
);


ALTER TABLE public.sales_items OWNER TO postgres;

--
-- Name: sales_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_items_id_seq OWNER TO postgres;

--
-- Name: sales_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_items_id_seq OWNED BY public.sales_items.id;


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id integer NOT NULL,
    product_id integer,
    quantity integer NOT NULL,
    type character varying(50) NOT NULL,
    reference_type character varying(50),
    reference_id integer,
    date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_movements_id_seq OWNER TO postgres;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_movements_id_seq OWNED BY public.stock_movements.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(50),
    currency character varying(10) DEFAULT 'PKR'::character varying,
    ledger_balance numeric(12,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: import_invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_invoices ALTER COLUMN id SET DEFAULT nextval('public.import_invoices_id_seq'::regclass);


--
-- Name: import_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_items ALTER COLUMN id SET DEFAULT nextval('public.import_items_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: product_batches batch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches ALTER COLUMN batch_id SET DEFAULT nextval('public.product_batches_batch_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: return_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_items ALTER COLUMN id SET DEFAULT nextval('public.return_items_id_seq'::regclass);


--
-- Name: returns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns ALTER COLUMN id SET DEFAULT nextval('public.returns_id_seq'::regclass);


--
-- Name: sales_invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices ALTER COLUMN id SET DEFAULT nextval('public.sales_invoices_id_seq'::regclass);


--
-- Name: sales_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_items ALTER COLUMN id SET DEFAULT nextval('public.sales_items_id_seq'::regclass);


--
-- Name: stock_movements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN id SET DEFAULT nextval('public.stock_movements_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, created_at) FROM stdin;
1	Mineral	2026-01-06 16:42:30.534435
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, phone, ledger_balance, created_at) FROM stdin;
1	Rashid Ali	000	0.00	2026-01-06 16:54:42.454678
2	Toseef	000	100.00	2026-01-06 16:55:43.278005
\.


--
-- Data for Name: import_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_invoices (id, supplier_id, invoice_no, type, total_amount, status, created_at) FROM stdin;
1	1	IMP-20260106-0001	cash	1000.00	finalized	2026-01-06 16:52:02.737541
2	2	IMP-20260106-0002	credit	1000.00	finalized	2026-01-06 16:52:09.075182
3	3	IMP-20260107-0001	cash	18000.00	finalized	2026-01-07 07:24:02.620812
4	1	IMP-20260108-0001	cash	50.00	finalized	2026-01-08 17:23:55.100393
\.


--
-- Data for Name: import_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_items (id, import_invoice_id, product_id, quantity, unit_price, total_price, batch_id) FROM stdin;
1	1	1	10	100.00	1000.00	\N
2	2	2	10	100.00	1000.00	\N
3	3	3	5	100.00	500.00	\N
4	3	2	5	3500.00	17500.00	\N
5	4	1	5	10.00	50.00	1
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, type, reference_id, partner_id, amount, method, created_at, notes) FROM stdin;
1	customer	\N	2	200.00	cash	2026-01-06 17:00:57.881115	\N
2	supplier	\N	2	500.00	cash	2026-01-06 17:01:30.765296	\N
3	customer	\N	2	200.00	cash	2026-01-07 07:29:30.823811	\N
\.


--
-- Data for Name: product_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_batches (batch_id, product_id, batch_number, expiry_date, quantity, import_id, created_at) FROM stdin;
1	1	5	2026-01-30	5	4	2026-01-08 17:24:13.097012
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, category, unit, opening_stock, opening_cost, current_stock, created_at) FROM stdin;
3	NPK	Mineral	NO.	0	0.00	5	2026-01-07 07:22:22.768102
2	Zinc	Mineral	NO	0	0.00	10	2026-01-06 16:43:05.018116
1	Sulfur	Mineral	NO	0	0.00	10	2026-01-06 16:42:40.480621
\.


--
-- Data for Name: return_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_items (id, return_id, product_id, quantity, unit_price, total_price, created_at, batch_id) FROM stdin;
\.


--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returns (id, return_no, return_type, invoice_id, party_id, total_amount, reason, refund_type, notes, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sales_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_invoices (id, customer_id, invoice_no, type, total_amount, discount_percent, discount_amount, status, created_at) FROM stdin;
1	1	\N	cash	500.00	0.00	0.00	finalized	2026-01-06 16:54:42.601653
2	2	\N	credit	500.00	0.00	0.00	finalized	2026-01-06 16:55:43.310165
\.


--
-- Data for Name: sales_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_items (id, invoice_id, product_id, quantity, unit_price, total_price, batch_id) FROM stdin;
1	1	1	5	100.00	500.00	\N
2	2	2	5	100.00	500.00	\N
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, product_id, quantity, type, reference_type, reference_id, date) FROM stdin;
1	1	10	in	import	1	2026-01-06 16:52:31.102806
2	2	10	in	import	2	2026-01-06 16:52:50.113388
3	1	5	out	sale	1	2026-01-06 16:54:42.601653
4	2	5	out	sale	2	2026-01-06 16:55:43.310165
5	3	5	in	import	3	2026-01-07 07:25:39.492511
6	2	5	in	import	3	2026-01-07 07:25:39.492511
7	1	5	in	import	4	2026-01-08 17:24:17.447875
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, name, phone, currency, ledger_balance, created_at) FROM stdin;
1	Cash Supplier	000	PKR	0.00	2026-01-06 16:50:53.076029
2	Credit Supplier	000	PKR	500.00	2026-01-06 16:51:02.391466
3	Innova	00000	PKR	0.00	2026-01-07 07:22:42.056846
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, created_at) FROM stdin;
1	Tayyab	tayyab@gmail.com	$2b$10$lTIzrNo4af5MY3AxTXcNK.RaRgOKoWzmScQiezQUUeG8.2Y9zSOda	2026-01-06 11:44:08.6549
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 2, true);


--
-- Name: import_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.import_invoices_id_seq', 4, true);


--
-- Name: import_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.import_items_id_seq', 5, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 3, true);


--
-- Name: product_batches_batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_batches_batch_id_seq', 1, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 3, true);


--
-- Name: return_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.return_items_id_seq', 1, false);


--
-- Name: returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.returns_id_seq', 1, false);


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_invoices_id_seq', 2, true);


--
-- Name: sales_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_items_id_seq', 2, true);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 7, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: import_invoices import_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_invoices
    ADD CONSTRAINT import_invoices_pkey PRIMARY KEY (id);


--
-- Name: import_items import_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_items
    ADD CONSTRAINT import_items_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: product_batches product_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_pkey PRIMARY KEY (batch_id);


--
-- Name: product_batches product_batches_product_id_batch_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_product_id_batch_number_key UNIQUE (product_id, batch_number);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: return_items return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_pkey PRIMARY KEY (id);


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- Name: returns returns_return_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_return_no_key UNIQUE (return_no);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


--
-- Name: sales_items sales_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_product_batches_batch_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_batches_batch_number ON public.product_batches USING btree (batch_number);


--
-- Name: idx_product_batches_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_batches_product_id ON public.product_batches USING btree (product_id);


--
-- Name: idx_return_items_return; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_return_items_return ON public.return_items USING btree (return_id);


--
-- Name: idx_returns_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_returns_invoice ON public.returns USING btree (invoice_id);


--
-- Name: idx_returns_party; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_returns_party ON public.returns USING btree (party_id);


--
-- Name: idx_returns_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_returns_type ON public.returns USING btree (return_type);


--
-- Name: import_invoices import_invoices_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_invoices
    ADD CONSTRAINT import_invoices_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: import_items import_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_items
    ADD CONSTRAINT import_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.product_batches(batch_id) ON DELETE SET NULL;


--
-- Name: import_items import_items_import_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_items
    ADD CONSTRAINT import_items_import_invoice_id_fkey FOREIGN KEY (import_invoice_id) REFERENCES public.import_invoices(id) ON DELETE CASCADE;


--
-- Name: import_items import_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_items
    ADD CONSTRAINT import_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_batches product_batches_import_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_import_id_fkey FOREIGN KEY (import_id) REFERENCES public.import_invoices(id) ON DELETE SET NULL;


--
-- Name: product_batches product_batches_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: return_items return_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.product_batches(batch_id) ON DELETE SET NULL;


--
-- Name: return_items return_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: return_items return_items_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;


--
-- Name: sales_invoices sales_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales_items sales_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.product_batches(batch_id) ON DELETE SET NULL;


--
-- Name: sales_items sales_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales_invoices(id) ON DELETE CASCADE;


--
-- Name: sales_items sales_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- PostgreSQL database dump complete
--

\unrestrict KaDgdMdkM4ClH7bWop4rKd6J8cF3GQnefmbLczsx7ylBDGo2xjLGJiGCSFyfqTb

