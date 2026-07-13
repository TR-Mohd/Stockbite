--
-- PostgreSQL database dump
--

\restrict tXOiUZHV7c0RVraOqyWXh3uiaotHtdGO3DYrcYW8hClhjybhr6BogigxwEO5r2i

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_cashier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaction_items DROP CONSTRAINT IF EXISTS transaction_items_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaction_items DROP CONSTRAINT IF EXISTS transaction_items_menu_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaction_item_modifiers DROP CONSTRAINT IF EXISTS transaction_item_modifiers_transaction_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaction_item_modifiers DROP CONSTRAINT IF EXISTS transaction_item_modifiers_modifier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS shifts_cashier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recipes DROP CONSTRAINT IF EXISTS recipes_menu_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recipes DROP CONSTRAINT IF EXISTS recipes_ingredient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_ingredient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.modifier_recipes DROP CONSTRAINT IF EXISTS modifier_recipes_modifier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.modifier_recipes DROP CONSTRAINT IF EXISTS modifier_recipes_ingredient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.item_modifiers DROP CONSTRAINT IF EXISTS item_modifiers_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.item_modifier_groups DROP CONSTRAINT IF EXISTS item_modifier_groups_menu_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ingredients DROP CONSTRAINT IF EXISTS ingredients_preferred_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS fk_po_sent_by;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS fk_po_created_by;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.transaction_items DROP CONSTRAINT IF EXISTS transaction_items_pkey;
ALTER TABLE IF EXISTS ONLY public.transaction_item_modifiers DROP CONSTRAINT IF EXISTS transaction_item_modifiers_pkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS shifts_pkey;
ALTER TABLE IF EXISTS ONLY public.recipes DROP CONSTRAINT IF EXISTS recipes_pkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.modifier_recipes DROP CONSTRAINT IF EXISTS modifier_recipes_pkey;
ALTER TABLE IF EXISTS ONLY public.menu_items DROP CONSTRAINT IF EXISTS menu_items_pkey;
ALTER TABLE IF EXISTS ONLY public.item_modifiers DROP CONSTRAINT IF EXISTS item_modifiers_pkey;
ALTER TABLE IF EXISTS ONLY public.item_modifier_groups DROP CONSTRAINT IF EXISTS item_modifier_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.ingredients DROP CONSTRAINT IF EXISTS ingredients_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.alembic_version DROP CONSTRAINT IF EXISTS alembic_version_pkc;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.transaction_items;
DROP TABLE IF EXISTS public.transaction_item_modifiers;
DROP TABLE IF EXISTS public.suppliers;
DROP TABLE IF EXISTS public.shifts;
DROP TABLE IF EXISTS public.recipes;
DROP TABLE IF EXISTS public.purchase_orders;
DROP TABLE IF EXISTS public.modifier_recipes;
DROP TABLE IF EXISTS public.menu_items;
DROP TABLE IF EXISTS public.item_modifiers;
DROP TABLE IF EXISTS public.item_modifier_groups;
DROP TABLE IF EXISTS public.ingredients;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.alembic_version;
DROP TYPE IF EXISTS public.statusenum;
DROP TYPE IF EXISTS public.roleenum;
DROP TYPE IF EXISTS public.postatusenum;
DROP TYPE IF EXISTS public.paymentmethodenum;
DROP TYPE IF EXISTS public.ordertypeenum;
--
-- Name: ordertypeenum; Type: TYPE; Schema: public; Owner: stockbite_user
--

CREATE TYPE public.ordertypeenum AS ENUM (
    'Dine-In',
    'Takeaway'
);


ALTER TYPE public.ordertypeenum OWNER TO stockbite_user;

--
-- Name: paymentmethodenum; Type: TYPE; Schema: public; Owner: stockbite_user
--

CREATE TYPE public.paymentmethodenum AS ENUM (
    'Cash',
    'QRIS'
);


ALTER TYPE public.paymentmethodenum OWNER TO stockbite_user;

--
-- Name: postatusenum; Type: TYPE; Schema: public; Owner: stockbite_user
--

CREATE TYPE public.postatusenum AS ENUM (
    'Draft',
    'Sent',
    'Received',
    'Cancelled',
    'Partially Received',
    'Over-Received'
);


ALTER TYPE public.postatusenum OWNER TO stockbite_user;

--
-- Name: roleenum; Type: TYPE; Schema: public; Owner: stockbite_user
--

CREATE TYPE public.roleenum AS ENUM (
    'Manager',
    'Cashier',
    'Warehouse'
);


ALTER TYPE public.roleenum OWNER TO stockbite_user;

--
-- Name: statusenum; Type: TYPE; Schema: public; Owner: stockbite_user
--

CREATE TYPE public.statusenum AS ENUM (
    'Completed',
    'Voided'
);


ALTER TYPE public.statusenum OWNER TO stockbite_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO stockbite_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.audit_logs (
    id character varying NOT NULL,
    "timestamp" timestamp without time zone,
    user_id character varying,
    action character varying NOT NULL,
    resource character varying NOT NULL,
    outcome character varying NOT NULL,
    details json
);


ALTER TABLE public.audit_logs OWNER TO stockbite_user;

--
-- Name: ingredients; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.ingredients (
    id character varying NOT NULL,
    name character varying NOT NULL,
    stock_level numeric(10,3),
    unit character varying NOT NULL,
    reorder_point numeric(10,3),
    last_updated timestamp without time zone,
    preferred_supplier_id character varying,
    version_id integer NOT NULL,
    category character varying,
    unit_cost numeric(10,2)
);


ALTER TABLE public.ingredients OWNER TO stockbite_user;

--
-- Name: item_modifier_groups; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.item_modifier_groups (
    id character varying NOT NULL,
    menu_item_id character varying NOT NULL,
    name character varying NOT NULL,
    is_required boolean,
    min_selections integer,
    max_selections integer
);


ALTER TABLE public.item_modifier_groups OWNER TO stockbite_user;

--
-- Name: item_modifiers; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.item_modifiers (
    id character varying NOT NULL,
    group_id character varying NOT NULL,
    name character varying NOT NULL,
    price_adjustment double precision
);


ALTER TABLE public.item_modifiers OWNER TO stockbite_user;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.menu_items (
    id character varying NOT NULL,
    name character varying NOT NULL,
    price double precision NOT NULL,
    category character varying NOT NULL,
    image character varying,
    is_active boolean
);


ALTER TABLE public.menu_items OWNER TO stockbite_user;

--
-- Name: modifier_recipes; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.modifier_recipes (
    id character varying NOT NULL,
    modifier_id character varying,
    ingredient_id character varying,
    quantity numeric(10,3) NOT NULL
);


ALTER TABLE public.modifier_recipes OWNER TO stockbite_user;

--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.purchase_orders (
    id character varying NOT NULL,
    supplier_id character varying,
    ingredient_id character varying,
    current_stock numeric(10,3) NOT NULL,
    reorder_point numeric(10,3) NOT NULL,
    suggested_quantity numeric(10,3) NOT NULL,
    date timestamp without time zone,
    status public.postatusenum,
    notes character varying,
    created_by_id character varying,
    sent_by_id character varying,
    cancelled_reason character varying,
    actual_received_quantity numeric(10,3)
);


ALTER TABLE public.purchase_orders OWNER TO stockbite_user;

--
-- Name: recipes; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.recipes (
    id character varying NOT NULL,
    menu_item_id character varying,
    ingredient_id character varying,
    quantity numeric(10,3) NOT NULL
);


ALTER TABLE public.recipes OWNER TO stockbite_user;

--
-- Name: shifts; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.shifts (
    id character varying NOT NULL,
    cashier_id character varying,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    total_transactions integer,
    total_revenue double precision
);


ALTER TABLE public.shifts OWNER TO stockbite_user;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.suppliers (
    id character varying NOT NULL,
    name character varying NOT NULL,
    specialization character varying,
    phone character varying,
    email character varying,
    address character varying,
    contact_person character varying,
    is_active boolean,
    region character varying
);


ALTER TABLE public.suppliers OWNER TO stockbite_user;

--
-- Name: transaction_item_modifiers; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.transaction_item_modifiers (
    id character varying NOT NULL,
    transaction_item_id character varying NOT NULL,
    modifier_id character varying NOT NULL,
    price_at_time double precision NOT NULL,
    cogs_per_unit double precision DEFAULT '0'::double precision NOT NULL
);


ALTER TABLE public.transaction_item_modifiers OWNER TO stockbite_user;

--
-- Name: transaction_items; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.transaction_items (
    id character varying NOT NULL,
    transaction_id character varying,
    menu_item_id character varying,
    quantity integer NOT NULL,
    notes character varying,
    price_at_time double precision NOT NULL,
    cogs_per_unit double precision DEFAULT '0'::double precision NOT NULL
);


ALTER TABLE public.transaction_items OWNER TO stockbite_user;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.transactions (
    id character varying NOT NULL,
    total_amount double precision NOT NULL,
    payment_method public.paymentmethodenum NOT NULL,
    amount_tendered double precision,
    change double precision,
    "timestamp" timestamp without time zone,
    cashier_id character varying,
    status public.statusenum,
    order_type public.ordertypeenum DEFAULT 'Takeaway'::public.ordertypeenum NOT NULL,
    routing_number character varying,
    whatsapp character varying,
    email character varying,
    subtotal double precision DEFAULT '0'::double precision NOT NULL,
    tax double precision DEFAULT '0'::double precision NOT NULL
);


ALTER TABLE public.transactions OWNER TO stockbite_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: stockbite_user
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    name character varying NOT NULL,
    role public.roleenum NOT NULL,
    hashed_password character varying NOT NULL,
    is_active boolean,
    username character varying,
    phone_number character varying,
    email character varying,
    hashed_pin character varying
);


ALTER TABLE public.users OWNER TO stockbite_user;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.alembic_version (version_num) FROM stdin;
a5d4310456d7
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.audit_logs (id, "timestamp", user_id, action, resource, outcome, details) FROM stdin;
24e6956b-dc6a-4614-bfb7-e642cd0ffe53	2026-06-30 05:16:16.097513	EMP-MGR-26100	login	auth	success	\N
f65f31c5-f783-4710-b1d1-9460c83f920e	2026-06-30 05:16:25.237113	EMP-MGR-26100	login	auth	success	\N
09fad9cb-3f8d-4931-bb20-01ed594c92f3	2026-06-30 05:22:02.960587	EMP-CSH-26101	login	auth	success	\N
a64b80bf-b85b-4629-b924-a60183da9e51	2026-06-30 05:22:18.101581	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
9a92372b-fd4b-40f6-a71b-b61d2f8ed5fb	2026-06-30 05:22:33.538427	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
5f4097c6-3c7e-4e25-b195-0496324927e4	2026-06-30 05:22:40.914254	EMP-MGR-26100	login	auth	success	\N
0e88610e-4a72-4b2f-bc76-f2702eee6297	2026-06-30 07:27:40.442101	EMP-MGR-26100	login	auth	success	\N
7715b88b-83da-4236-9cb4-09345ec1efce	2026-06-30 07:28:11.017706	EMP-MGR-26100	login	auth	success	\N
bbcc0a79-43e9-48ce-adb7-9f7f81c27439	2026-06-30 07:28:54.488838	EMP-MGR-26100	login	auth	success	\N
cf33c536-980b-472b-84ce-a9c960110503	2026-06-30 07:29:19.116292	EMP-WHS-26103	login	auth	success	\N
dc0257c3-2d3f-4d96-8691-04d7cad19905	2026-06-30 07:33:01.826236	EMP-WHS-26103	login	auth	success	\N
52818faf-6359-43f5-a764-0276a1a05dc5	2026-06-30 07:36:41.686922	EMP-WHS-26103	login	auth	success	\N
bbed0058-338d-4d6e-b197-dd535e0427ee	2026-06-30 08:11:46.331412	EMP-MGR-26100	login	auth	success	\N
b71ae4ce-eaec-4f28-8737-1338d482b1c7	2026-06-30 08:27:21.402645	EMP-WHS-26103	login	auth	success	\N
eb95bd4f-1b1f-42b8-9eb4-c038913f4b6a	2026-06-30 08:35:08.669463	EMP-MGR-26100	login	auth	success	\N
7a2519ba-ef0e-421a-a249-97b29de19f15	2026-06-30 08:35:54.203287	EMP-CSH-26101	login	auth	success	\N
7dc8e3e6-7877-4fdb-97e6-17d7cce9163f	2026-07-01 04:43:18.174619	EMP-CSH-26101	login	auth	success	\N
51ac4a3c-020b-42c6-ac5e-0d875e574fbb	2026-07-01 04:43:21.72048	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
b52af1d5-562a-47e1-bc2b-bdeef0fb3041	2026-07-01 06:01:55.733121	EMP-MGR-26100	login	auth	success	\N
943c034e-316d-4f1a-949b-e3d7be479e50	2026-07-01 06:05:47.480098	EMP-WHS-26103	login	auth	success	\N
b964c819-8337-4757-b884-cf2b7369db1f	2026-07-01 06:08:23.533582	EMP-MGR-26100	login	auth	success	\N
3e020f37-d0af-482f-9b61-b38acabbbb73	2026-07-01 06:13:43.958762	EMP-CSH-26101	login	auth	success	\N
b21558ca-1900-41cd-a638-d949a81461d6	2026-07-01 06:14:54.91056	EMP-CSH-26101	login	auth	success	\N
7b148a14-149a-4f34-b4da-3b099154a786	2026-07-01 06:22:23.800342	EMP-CSH-26101	login	auth	success	\N
ded6656a-a9b4-419f-952f-6d2503338e72	2026-07-01 08:10:39.971156	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
2612fb7f-0476-4073-9f9a-a2e665b01e54	2026-07-01 08:10:46.24186	EMP-CSH-26101	login	auth	success	\N
3c101f38-2e46-4b08-95ee-62178866cc92	2026-07-01 08:13:28.19857	EMP-CSH-26101	login	auth	success	\N
9ef2deaa-ecee-437b-809c-e9b38e36623d	2026-07-01 08:14:14.097741	EMP-CSH-26101	login	auth	success	\N
83eaffe2-38a8-428a-99b8-2b7e71017b81	2026-07-01 08:14:14.140508	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
1cfc07b8-fb7e-4ab1-8085-bc74590dc3a3	2026-07-01 08:14:58.067236	EMP-CSH-26101	login	auth	success	\N
8dd77ed4-384f-40cf-b069-ad3d1f4faef7	2026-07-01 09:15:20.161956	EMP-CSH-26101	login	auth	success	\N
ca8147c2-3099-4d3d-a51b-31b0ca8e5650	2026-07-01 09:15:53.384638	EMP-CSH-26101	login	auth	success	\N
4aea08e4-d2de-49ab-8b57-6ceb72e71b0e	2026-07-01 09:16:16.676368	EMP-MGR-26100	login	auth	success	\N
da5d36ce-8123-48a8-a9c2-8f49ba95977c	2026-07-01 09:18:41.499712	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
b58a24d4-aa7a-48e5-8379-c01321bf5c4f	2026-07-01 09:18:54.179336	EMP-MGR-26100	login	auth	success	\N
a4a5bdbd-67aa-465a-961d-3899d7772355	2026-07-01 09:29:41.018545	EMP-MGR-26100	login	auth	success	\N
be57181b-1d5b-4749-9ccd-1cbd89ae876e	2026-07-01 09:30:53.368029	EMP-MGR-26100	login	auth	success	\N
b8d37b54-69f4-4471-b079-1215e716f2e4	2026-07-01 09:40:35.732715	EMP-MGR-26100	login	auth	success	\N
5d59c1e3-fb9e-4d8d-8f9d-84489287615f	2026-07-01 16:29:52.808511	EMP-CSH-26101	login	auth	success	\N
d085e74d-2fe2-496e-90ac-24bbc3080c2d	2026-07-01 16:31:20.391366	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
709651bf-8358-4036-9169-2650d6914946	2026-07-01 16:31:28.595326	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
b4e57086-9258-46a9-acf0-f7c6d78fe882	2026-07-01 16:31:43.189187	EMP-MGR-26100	login	auth	success	\N
165ae6e1-ec27-4175-ad71-86eb070de9d1	2026-07-02 09:16:10.401419	EMP-MGR-26100	login	auth	success	\N
669a12f6-5d2b-4d72-bc58-bb3bf134b5f2	2026-07-02 09:16:23.368425	EMP-CSH-26101	login	auth	success	\N
b29f8ad3-a2c1-42b3-9641-733f4aafda74	2026-07-02 09:17:18.969595	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
e0926e52-d14e-473c-b3e8-bf2480ec2ab5	2026-07-02 09:17:28.767239	EMP-MGR-26100	login	auth	success	\N
962b54a1-a159-4505-b3d7-b64a9f318b95	2026-07-02 09:51:46.506835	EMP-CSH-26101	login	auth	success	\N
cd4797a8-38ce-47da-aac0-77ed567bec84	2026-07-02 09:52:00.923379	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
87207606-9315-4c23-bd8f-df968b20382c	2026-07-02 09:52:08.347073	EMP-MGR-26100	login	auth	success	\N
e141bde8-fb33-444c-a8b6-adaaa5fbfa4a	2026-07-02 10:05:15.844698	EMP-CSH-26101	login	auth	success	\N
0d5731b1-ac9c-4e83-941d-723795ce2ee1	2026-07-02 10:17:54.017733	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
b0396a25-d597-4573-b76e-6e2bc15ae2fd	2026-07-02 10:18:07.280168	EMP-MGR-26100	login	auth	success	\N
3476cc65-96e5-45d4-8c1e-68e53c5f8c42	2026-07-03 11:06:48.095123	EMP-MGR-26100	login	auth	success	\N
1b24be88-178a-421a-a3ae-78cf3a4dcae5	2026-07-03 11:08:12.500265	EMP-CSH-26101	login	auth	success	\N
a631dbad-7db8-4fd5-90d8-63b1339e4dbe	2026-07-03 11:08:21.288389	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
8a467999-8dbe-444d-8166-c306cfb86cac	2026-07-03 11:08:56.945266	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
cc6fa8fd-b922-430a-81d4-670c17d450de	2026-07-03 11:09:04.311972	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
8fb7bacd-1734-4813-a052-03f5193b1dfa	2026-07-03 11:09:11.595152	EMP-MGR-26100	login	auth	success	\N
f595e39d-3b6b-46ca-bd3d-031baaf79036	2026-07-03 12:28:15.689251	EMP-MGR-26100	login	auth	success	\N
3ebd2e74-ff68-4903-b4ab-3c6e2f582fe8	2026-07-03 12:32:19.838983	EMP-MGR-26100	login	auth	success	\N
be8b2bb1-7658-4c6d-87e3-27f5cc7d98f1	2026-07-03 12:38:21.199714	EMP-MGR-26100	login	auth	success	\N
29c2bd42-9ebe-41cf-954e-37bcb3583271	2026-07-03 12:44:55.735881	EMP-MGR-26100	login	auth	success	\N
c270772c-7d1f-4f1d-9128-19b4414fc84d	2026-07-04 12:10:37.268457	EMP-MGR-26100	login	auth	success	\N
de68c533-7aed-4e91-bab7-20052fa68cea	2026-07-04 12:15:55.2141	EMP-MGR-26100	login	auth	success	\N
d919d8a3-3820-4a94-a509-ddf3f282458b	2026-07-04 12:16:13.623817	EMP-MGR-26100	login	auth	success	\N
fa9f92b4-3ff6-43ab-9e89-3c9a299e7cd9	2026-07-04 12:17:56.157299	964bbddd-bac1-45e4-b14b-92f46e270e99	login	auth	success	\N
29657d45-69b0-4a6e-b21f-ba1794d67a9f	2026-07-04 12:18:07.288516	EMP-MGR-26100	login	auth	success	\N
6b79be9e-63e2-4abc-b404-5b1b6d1bbb84	2026-07-04 12:18:16.26268	36709b4e-d93e-4c38-b58f-ada472f0274a	login	auth	success	\N
7770bd19-0460-4c91-a166-3272698ee706	2026-07-04 12:19:49.362567	964bbddd-bac1-45e4-b14b-92f46e270e99	login	auth	success	\N
0f829b00-83c4-4c82-820f-41105346a5fe	2026-07-04 12:29:28.133075	EMP-CSH-26101	login	auth	success	\N
488cc79a-8131-4fd5-93f4-8f1e9df94a5c	2026-07-04 12:31:10.343807	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
1f560df7-9474-4843-990e-4f787d3afaad	2026-07-04 17:55:55.887794	EMP-CSH-26101	login	auth	success	\N
be835856-5b40-4334-bf8c-3a5a91ea61f4	2026-07-04 17:56:46.302622	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
6824ddf0-337c-4f69-ae04-f6bf25858a56	2026-07-04 17:57:08.814764	EMP-MGR-26100	login	auth	success	\N
d8854185-25f9-430a-884d-dd6045e3338d	2026-07-04 18:15:03.11372	EMP-WHS-26103	login	auth	success	\N
49d3baa9-34a0-45e6-a256-e0b79977590a	2026-07-04 18:37:08.381197	EMP-WHS-26103	login	auth	success	\N
dba4f24c-c37b-48bb-b86f-6eb5115f27fb	2026-07-04 18:37:47.228429	EMP-MGR-26100	login	auth	success	\N
59f61350-e0fa-49f1-937c-b54da09b1c1c	2026-07-04 18:40:16.637588	EMP-WHS-26103	login	auth	success	\N
baf2b803-17ce-4303-8f9e-d3c19d5bec6e	2026-07-04 18:43:13.857637	962ca898-2bac-4d9a-8fa3-150524c94840	login	auth	success	\N
693e3f49-522f-47e3-81c5-1c4ac0a81b2c	2026-07-04 18:43:25.477872	EMP-MGR-26100	login	auth	success	\N
e0293375-9f8a-4fab-b584-dcf593a2f4ac	2026-07-04 18:43:34.7523	90f0c120-fe16-49dc-909a-71ba772f46c1	login	auth	success	\N
d3641cd2-3068-4110-bb5c-1436ac939141	2026-07-04 18:43:51.045113	EMP-CSH-26101	login	auth	success	\N
70e75b15-f78f-4010-8cb6-0ff4745fa33b	2026-07-04 18:44:06.573386	ff8876fc-e8fe-4c1e-96d6-11fff6e453a1	login	auth	success	\N
c11ab3c9-ef8f-492a-af7d-7d2a85cfaadc	2026-07-04 18:44:10.331448	EMP-WHS-26103	login	auth	success	\N
c02e6122-05cf-4125-a456-179977ec3a27	2026-07-04 18:46:23.038916	ff8876fc-e8fe-4c1e-96d6-11fff6e453a1	login	auth	success	\N
e76cf8d8-4310-4b68-bbd4-ce9c90efc960	2026-07-04 18:46:47.356684	ff8876fc-e8fe-4c1e-96d6-11fff6e453a1	login	auth	success	\N
db7c44a8-54c7-4820-8780-51d7eb76a0a4	2026-07-04 18:47:02.038818	ff8876fc-e8fe-4c1e-96d6-11fff6e453a1	login	auth	success	\N
a3717b38-3e86-49ef-8a01-b6bd897e08e8	2026-07-04 18:49:26.292299	ff8876fc-e8fe-4c1e-96d6-11fff6e453a1	login	auth	success	\N
ad69958f-ba16-4ac1-815b-9089a663d8a7	2026-07-04 18:49:51.746996	ff8876fc-e8fe-4c1e-96d6-11fff6e453a1	login	auth	success	\N
2faf167d-e63f-4495-8b55-a5a6cee4d804	2026-07-04 18:50:20.426167	ff8876fc-e8fe-4c1e-96d6-11fff6e453a1	login	auth	success	\N
a8ebc0aa-ac7d-45a0-ba2e-3e931559be05	2026-07-04 18:51:19.688568	ff8876fc-e8fe-4c1e-96d6-11fff6e453a1	login	auth	success	\N
6fea14b4-9859-4243-9c0b-dad4df3f3142	2026-07-04 18:55:05.781366	d2737b29-20e0-46fc-9232-7c904c11ea37	login	auth	success	\N
f6ee82c5-7290-4ce1-9cc4-7387bfcdf6bb	2026-07-04 18:55:20.979788	EMP-MGR-26100	login	auth	success	\N
3c8497e4-cc52-41d2-af1a-5a86383c05b5	2026-07-04 18:55:30.154637	94a6d193-35fa-4317-ad43-121740bfc291	login	auth	success	\N
c5715adf-1460-47fe-a5e7-bed1f722e358	2026-07-04 19:40:08.715308	EMP-CSH-26101	login	auth	success	\N
35ecc497-5eea-42e0-b9ab-750e220317b4	2026-07-04 19:45:59.481176	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
95573fb0-9c5a-49c7-8657-46cee0c9fa77	2026-07-04 19:46:13.429547	EMP-WHS-26103	login	auth	success	\N
1b19c472-3e46-4aba-83af-936279bba42d	2026-07-04 20:07:59.48076	EMP-MGR-26100	login	auth	success	\N
1a95595c-f57e-47ce-bce9-bc10918b13a4	2026-07-05 04:59:16.28463	EMP-MGR-26100	login	auth	success	\N
a87a573e-c4e7-4993-a3f3-83a5251ce696	2026-07-05 06:14:04.807571	EMP-MGR-26100	login	auth	success	\N
1426b59c-0a8a-49ec-9254-533d0388c659	2026-07-05 06:14:19.955319	EMP-MGR-26100	login	auth	success	\N
79c3dbc6-8ffd-4a12-8013-70098837dfd6	2026-07-05 06:14:47.700834	EMP-MGR-26100	login	auth	success	\N
21b86347-5865-439a-a4f7-763034862d03	2026-07-05 06:29:15.895306	EMP-MGR-26100	login	auth	success	\N
43d22ea1-55f3-4b7e-96a7-9fb7f07237a7	2026-07-05 12:24:25.37003	EMP-CSH-26101	login	auth	success	\N
f8a83045-fb13-42ad-b08f-14b90017373e	2026-07-05 12:24:35.348649	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
0f8c3957-24eb-498e-9ded-f0ae1ab6734e	2026-07-05 12:24:49.611296	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
99ffe4a6-e276-462f-93ac-db79c8dc7da8	2026-07-05 12:25:04.192884	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
df64d775-fa13-4ead-9769-d8485873e130	2026-07-05 12:25:13.576173	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
362d8ba7-a9dc-4830-b42c-4685bc589164	2026-07-05 12:25:35.52491	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
0ae40698-04c4-4863-bfa2-0edc3ce19e8a	2026-07-05 12:25:45.55259	EMP-MGR-26100	login	auth	success	\N
6cbfe1ca-d0fe-4d7c-897a-f0ca70a72c4b	2026-07-05 12:26:05.366197	EMP-MGR-26100	login	auth	success	\N
35ada4b5-7939-470d-9bcc-2a1f8ee20904	2026-07-05 12:30:28.06272	EMP-CSH-26101	login	auth	success	\N
131363cb-1de1-4afe-bd21-e6471c243bc0	2026-07-05 12:44:18.234848	EMP-MGR-26100	login	auth	success	\N
8120b8e9-8ca2-4d9b-81e7-cf2c399c90d4	2026-07-05 12:44:37.757604	EMP-CSH-26101	login	auth	success	\N
8d0bbb86-e83b-424b-88aa-2fda9f1d002c	2026-07-05 12:52:30.323448	EMP-MGR-26100	login	auth	success	\N
5b20276a-400a-4109-8546-6c9e0ae5f0a7	2026-07-05 12:54:18.066692	EMP-CSH-26101	login	auth	success	\N
d935b644-37e1-4522-a8ea-4448120f825a	2026-07-05 12:54:20.517038	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
9b3e020c-c380-486e-8049-c360c5ce5f5b	2026-07-05 12:54:24.804013	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
0b85faf9-7f04-481b-b9ef-63627726cec0	2026-07-05 12:54:27.618248	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
b067ff69-0139-4ffd-8822-7bc79f7101a8	2026-07-05 12:58:21.38745	EMP-CSH-26101	login	auth	success	\N
4db1131f-f6a8-4099-8674-ceebcbd57eb7	2026-07-05 12:59:35.713102	EMP-CSH-26101	login	auth	success	\N
ab87202d-54aa-4155-baa8-2250eb75bdf6	2026-07-05 13:00:40.867223	EMP-CSH-26101	login	auth	success	\N
29430a65-6e0e-4e65-9d60-bd92aa0ba4e0	2026-07-05 13:00:45.708201	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
10e283a8-6f67-4706-b722-9a0dda6489c3	2026-07-05 13:00:51.060992	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
bad6a20c-94bc-4a5e-96cc-5aa2b8866a29	2026-07-05 13:00:55.069872	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
0a2c69d9-0550-4acf-b687-09e2fe95c220	2026-07-05 13:00:58.208315	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
94635c8c-e1ba-4977-b5b9-b7ba404c2897	2026-07-05 13:01:02.79077	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
feea1943-84a8-468e-95f5-7936ab8ca1eb	2026-07-05 13:01:07.113672	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
62581db3-def1-490f-af3c-acc4073974d4	2026-07-05 13:01:12.768364	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
be6d00bc-a847-4a7b-8147-201727ecf9cc	2026-07-05 13:01:17.44422	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
a547a269-e622-40ed-bab4-ffd6ec1eb8dd	2026-07-05 13:01:21.523729	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
93172fd9-752f-407e-85f8-7fdbf8a73dcb	2026-07-05 13:01:23.939691	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
02937bf9-adc5-4e6f-a72d-3ca047114e56	2026-07-05 13:01:26.884038	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
54f06583-a32d-49c3-bd7b-a62c49961e48	2026-07-05 13:01:31.267804	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
11dbb143-39f3-45eb-ace6-71a3aaa18402	2026-07-05 13:01:36.21921	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
7afb9feb-92b1-4d87-bb2c-dadc23f826fe	2026-07-05 13:01:40.034688	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
15266937-1ed2-43fb-93ec-59488383c9e5	2026-07-05 13:01:44.906122	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
bf0cb811-6898-4c49-b8db-bbc63e460936	2026-07-05 13:01:48.294528	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
dbba32ab-9c29-41bf-be54-aafeea426b05	2026-07-05 13:01:54.675227	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
847855d5-9266-43c0-a021-86e8a2ecad35	2026-07-05 13:01:57.712894	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
fa7b14ff-c9f9-4201-80b7-cc9c91a5ed89	2026-07-05 13:04:31.92752	EMP-CSH-26101	login	auth	success	\N
24b9a7f3-fc67-4c49-b9fa-d6540b9e23d5	2026-07-05 13:04:34.690944	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
fa6d7b8f-da04-4b64-a06c-65d032481b03	2026-07-05 13:04:39.001809	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
12591d39-a044-4379-863e-a5e6ece0774c	2026-07-05 13:04:42.486727	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
db14755e-2e05-4a70-ac7b-0adc1e416555	2026-07-05 13:04:49.214134	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
9b1f23ae-3c2b-40a7-ac11-cbb450233764	2026-07-05 13:04:55.231518	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
0063eb27-c35b-45f7-bf2a-b58bfef5d167	2026-07-05 13:05:00.656923	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
6f5f4b68-2d62-485c-ac04-b130ef659914	2026-07-05 13:05:04.020115	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4a8681f9-a458-4e45-8c28-2ca4ae219b69	2026-07-05 13:05:08.116402	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
9aaa4084-a69d-42f3-bf63-cb7727d6e058	2026-07-05 13:05:12.937858	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
19a53930-f73b-471a-affc-82ed9ed23812	2026-07-05 13:05:17.762515	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
3f4b4173-f877-41e6-bd56-98c137e897ee	2026-07-05 13:05:22.000857	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
8b5002a1-93bf-43fd-ae62-c902209c8d8a	2026-07-05 13:05:26.054233	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4890bd2b-c12b-45b5-b58a-27e6771fe89b	2026-07-05 13:05:28.741946	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
27d73898-0ff0-456c-9862-bce09fc09db0	2026-07-05 13:05:32.440463	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
40b17097-50c6-46d0-8fda-03ed92fd956e	2026-07-05 13:05:37.324363	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
8fcf1fd0-d05c-46d5-9885-cad5805b2e8b	2026-07-05 13:05:41.226741	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
c29e7641-4716-4397-9b00-6d1a42a7c369	2026-07-05 13:05:45.026763	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
09ab0e44-a1ad-4c5b-8b7e-70b68cac2ea6	2026-07-05 13:05:51.779667	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
7a9452dc-1375-49a2-89bb-789c89149e8c	2026-07-05 13:05:55.186236	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
d4937e79-f1cd-4ef8-9ed6-88eafb2fe3e7	2026-07-05 13:06:01.21568	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
bc53f39c-77df-4589-a208-8b4e3098827b	2026-07-05 13:06:04.253383	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
168fd5c9-471b-4f5c-89ae-2c523ec16d40	2026-07-05 13:06:09.714767	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
1813a549-e996-43f6-857c-6484d55c0186	2026-07-05 13:06:17.553466	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
c2dba299-e969-412d-98b8-b0dba1a2fc5d	2026-07-05 13:06:23.034495	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
97c82019-1fd4-423d-a935-36e4a35bc86b	2026-07-05 13:06:26.637026	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
3031a426-6489-4173-ac63-4f2246d48e4c	2026-07-05 13:06:32.363929	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
23553bfe-68ee-4d06-83af-abcc053bb193	2026-07-05 13:06:38.002958	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
53a04cba-62e9-4115-aa94-acae6d23a3d8	2026-07-05 13:06:43.891505	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
ea7f8ea6-daa0-447d-aec5-86851fa19c78	2026-07-05 13:06:50.913396	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
23ceed50-703c-4fc6-8a0e-8cdd38a54bc1	2026-07-05 13:06:57.86546	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
3aba26ba-fe31-4eb1-8d36-5ac363ac7fdb	2026-07-05 13:07:01.21847	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
6792612b-f042-4fb1-90e1-2d0a21435d92	2026-07-05 13:07:07.657364	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4f39715a-4bdc-4b37-a380-b03b7b26a245	2026-07-05 13:07:14.27611	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
784d0637-4134-4776-b530-309603360e65	2026-07-05 13:07:20.842962	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
98c9998d-382e-49cd-87be-6e36311599bd	2026-07-05 13:07:25.097521	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
cc5ea50f-52b4-4f99-bffd-e82dbfec0a61	2026-07-05 13:07:29.314806	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
2e7ee596-52a4-4498-b6ec-74e76cb477d0	2026-07-05 13:07:34.091552	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4952805f-eecc-4ab0-9e41-c21232b59ba1	2026-07-05 13:07:39.957485	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
1d7fa66a-57a0-4288-800b-15673fc2db64	2026-07-05 13:07:44.459572	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
2806d7b5-f069-4b5d-9b69-a082907c45e3	2026-07-05 13:07:50.107989	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4e2f9da4-6120-406c-87f8-870316834cdb	2026-07-05 13:07:53.772538	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4162e24e-2bbb-4538-b4f3-409de66f5fb5	2026-07-05 13:07:58.799576	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
0210392f-9b6d-4dac-a52d-0ebee04d2338	2026-07-05 13:08:04.698361	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
13a430ca-6338-4fb0-8909-fbc588e73bbd	2026-07-05 13:08:11.025542	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
e775ebc1-c6b1-4f9a-91c0-9487a0ef9e07	2026-07-05 13:08:15.52531	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
cfa6a341-b31a-4f5b-ba89-6d5239243c32	2026-07-05 13:08:18.847159	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
d34046dd-57a8-41d5-aac5-b4c10562cb74	2026-07-05 13:08:21.899824	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
04390d2c-82e9-4896-b887-1e1866e1f115	2026-07-05 13:08:26.791803	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
7615f4de-78cd-4b9e-b335-e9ac1bb3a223	2026-07-05 13:08:29.969388	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
be872cf5-a825-40f9-9ca0-74e06d622fb7	2026-07-05 13:08:35.267201	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
896af48a-b919-4ba9-9b6c-fe4e43fc0036	2026-07-05 13:17:50.747631	EMP-CSH-26101	login	auth	success	\N
cfb10587-fc43-43fe-adcb-ee5d6ed8433a	2026-07-05 13:17:52.655817	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
7be5c75d-6771-4b2a-a0eb-381b7ea2dd44	2026-07-05 13:20:36.538878	EMP-MGR-26100	login	auth	success	\N
504ed430-7619-41fb-9834-2edce67423da	2026-07-05 13:20:51.811338	EMP-MGR-26100	login	auth	success	\N
07d7c5d0-145c-49ae-bee6-80ce719ea95b	2026-07-05 13:21:11.270263	EMP-MGR-26100	login	auth	success	\N
d422d98d-7c44-4ef5-9196-1bf9b8b50fb5	2026-07-05 13:43:19.136252	EMP-MGR-26100	login	auth	success	\N
c8a4b342-d65f-425d-9cf8-8563c0165f1b	2026-07-05 13:44:09.109399	d89039f9-72aa-4b1a-92ef-39694c03a0b0	login	auth	success	\N
8c6f4b7c-b2f9-4a27-a3fe-aa00d6960f51	2026-07-05 13:44:24.195886	EMP-MGR-26100	login	auth	success	\N
93c691c4-2d9e-4d80-b32e-16c6fe1acaef	2026-07-05 13:44:33.181598	15c1b318-f08c-48bb-970f-0571934f8a7e	login	auth	success	\N
334eb31c-4d93-4004-beab-5a19b5d3ab19	2026-07-05 14:08:17.659958	EMP-MGR-26100	login	auth	success	\N
ccb40acd-04d1-4093-a8ad-ba05db7aab3d	2026-07-05 14:11:11.158876	EMP-CSH-26101	login	auth	success	\N
6c37b978-22cf-4d99-88fa-a0b0db1f4887	2026-07-05 14:11:14.276668	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
0b8db813-072f-4c2d-b303-682e6521750d	2026-07-05 14:11:17.913478	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
fef4a7de-6a0b-47da-8b55-694f463cebc7	2026-07-05 14:11:21.418109	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
e911ceb3-257c-4d9f-82b6-97508ab554b2	2026-07-05 14:11:28.511042	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
243689e4-4a1f-453f-ba28-cd9bdbabe565	2026-07-05 14:11:33.455393	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
3aecd44c-6ef7-4c69-81c1-6e2a9d2fa1e3	2026-07-05 14:11:37.431691	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
5603643c-cb31-460b-9b64-6a295b2e1c9b	2026-07-05 14:11:41.254153	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
3b409db4-8f62-4ad9-b2cd-6c61fa341a32	2026-07-05 14:11:46.159603	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
0ed217b4-6d17-42e3-be7b-828a3eb56095	2026-07-05 14:11:50.973135	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
b8242161-84e6-40d8-a534-696ad7a97211	2026-07-05 14:11:55.771748	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
c9054020-e63d-477b-a7b7-5258104b74e3	2026-07-05 14:11:59.521411	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
3a91ffd5-f4c5-4834-ac41-ec9b8de64926	2026-07-05 14:12:03.36882	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
04dd57cc-ee24-4e0b-8f5e-4316fc2642b3	2026-07-05 14:12:05.769093	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4725a32c-22fa-4bc7-b375-072b4391c457	2026-07-05 14:12:08.982878	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
5e4c5f35-a6bb-4e6f-9896-32cc689af8e4	2026-07-05 14:12:13.584226	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
018e7db9-7e1f-49fc-991e-2964c4422dce	2026-07-05 14:12:17.217344	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
5093d792-5c3d-4698-97ec-9f8a7d6bc219	2026-07-05 14:12:21.323295	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
889bd98a-8016-403e-bed8-6576c54b807c	2026-07-05 14:12:26.25248	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
ded661bd-bc1f-4583-8b47-a1a7cc8ed00c	2026-07-05 14:12:29.762262	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
219e3953-6f57-4e77-b88b-b61695d2d565	2026-07-05 14:12:35.284785	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
8ab970b8-bb91-4395-a7f8-51d4fde70885	2026-07-05 14:12:37.769701	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
68c6c6c4-1da3-429b-a8aa-a79b5182ac0f	2026-07-05 14:12:42.237418	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
1774418d-30af-4095-9abc-df2f934220fc	2026-07-05 14:12:48.315565	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
89c93876-0e32-4d19-b288-ba1966eae022	2026-07-05 14:12:54.23102	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4688ded6-7b1e-4a7c-a8e5-c2df351e49ec	2026-07-05 14:12:57.868069	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
9895f8d5-c3a3-4df3-8085-4dbc38f68c2e	2026-07-05 14:13:03.037208	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
06c6982f-f417-40ad-8332-a2eb009f36fc	2026-07-05 14:13:09.208622	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
6a6ee3a2-f241-4541-8545-b751d9ae435c	2026-07-05 14:13:14.76696	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4ae46b5e-def1-4aa8-87ce-b7dc5db86617	2026-07-05 14:13:22.3033	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
2d31bff5-7881-47b2-a07f-62e8eedfe05a	2026-07-05 14:13:29.290177	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
f0dc8a62-3c46-408a-a122-f0e3d8cbac02	2026-07-05 14:13:32.65097	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
d5e08564-7dff-4b84-8cd2-1cc49c28e5b4	2026-07-05 14:13:39.349735	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
42fad321-359c-4b4d-9b4a-770689980c27	2026-07-05 14:13:46.17492	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
7523e5ed-fdab-4f86-980f-d45624f449e6	2026-07-05 14:13:52.498547	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
b03069ab-9270-479e-bd0b-31c29c77f7cc	2026-07-05 14:13:56.45791	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
207f76d8-7bd2-4401-bff4-4cacc8203774	2026-07-05 14:14:01.102516	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
16089482-ac73-4628-add9-711fc6800d20	2026-07-05 14:14:06.375603	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
c5568654-3620-42c5-91c3-c3776429eff0	2026-07-05 14:14:12.048683	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
f102c636-16c8-48aa-b6e4-4275b46ca8c2	2026-07-05 14:14:15.978228	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
36f48767-46e5-4641-a81b-ab24f0abf4d6	2026-07-05 14:14:20.582058	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
8bf740a3-8a70-42b5-8933-ddbfd4354b31	2026-07-05 14:14:23.340254	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
b210ae28-0fb6-48c8-a0a5-d5f4e5485bdd	2026-07-05 14:14:28.367312	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
cece9291-cb50-4888-8e33-07cfc6eb2461	2026-07-05 14:14:33.738753	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
1244347d-8f61-448b-807f-9ba8d244a19c	2026-07-05 14:14:40.81752	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4aa2e9e4-fbc2-4df2-b9e5-272a60fa037b	2026-07-05 14:14:45.287703	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
fabc71b6-fa72-4f85-847c-0adbee52f872	2026-07-05 14:14:49.186173	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
5e6e28ef-3394-4678-b363-6669388aedb2	2026-07-05 14:14:53.572737	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
9c4305c7-8550-4b63-afdd-987e4ac2330b	2026-07-05 14:14:58.479676	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
28c7b298-1876-4695-8660-a909b1d4da56	2026-07-05 14:15:01.155863	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
8686f8e8-7471-4c1f-b5ea-5e36b86a30a6	2026-07-05 14:15:06.518387	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
93c58781-75a0-49b5-acbc-febf670e4116	2026-07-06 04:51:32.735703	EMP-MGR-26100	login	auth	success	\N
568e3919-90ca-4b7f-8fcc-0c2b38f5f2d4	2026-07-06 11:15:28.240242	EMP-MGR-26100	login	auth	success	\N
f778381e-1cf6-499f-819e-5c0fdec509ea	2026-07-06 12:03:30.382065	EMP-MGR-26102	login	auth	success	\N
7c2551a2-528a-44f2-8b0b-eafe2f2463b6	2026-07-06 12:07:10.233739	EMP-MGR-26100	login	auth	success	\N
be52290c-5bf7-4f25-9684-f26305d7c1e1	2026-07-06 12:09:10.103584	EMP-MGR-26102	login	auth	success	\N
f12d8251-08fa-4826-abe0-7b27a7372cae	2026-07-06 12:14:35.476028	EMP-MGR-26102	login	auth	success	\N
a41ae97e-a253-4ab0-8ef2-b1f8b0875a65	2026-07-06 12:15:06.599151	EMP-MGR-26102	login	auth	success	\N
bdadab32-5b10-4c71-9dad-14e96f8760ab	2026-07-06 12:16:33.695316	EMP-MGR-26102	login	auth	success	\N
dafd7473-95ac-40fd-a4f9-224206de041b	2026-07-06 14:51:43.213332	EMP-MGR-26102	login	auth	success	\N
3bb22958-4ecc-42b3-8d69-11fb6113be70	2026-07-06 14:51:50.753951	EMP-MGR-26102	login	auth	success	\N
0cc67579-f185-4ccb-a0a8-908a8213c619	2026-07-06 14:57:56.819319	EMP-MGR-26102	login	auth	success	\N
46b63ae7-bc43-4e09-b2db-2535f9dd47bf	2026-07-06 14:58:05.920803	EMP-MGR-26102	login	auth	success	\N
dfb25041-3d1f-4e85-a9d6-3a0155894c7a	2026-07-06 15:02:01.357054	EMP-MGR-26100	login	auth	success	\N
c5a007d9-97e9-43cf-9693-6c821a46122b	2026-07-06 15:03:01.435045	EMP-MGR-26102	login	auth	success	\N
282ea9ee-270a-45a3-a1e0-30f999223bc8	2026-07-06 15:03:10.618339	EMP-MGR-26102	login	auth	success	\N
0fb75702-7519-414f-a3cd-3aa93fa8e15f	2026-07-06 15:51:46.87434	EMP-MGR-26102	login	auth	success	\N
555c79fb-fba6-494a-932f-1dc06ff850e8	2026-07-06 15:53:54.045298	EMP-MGR-26102	login	auth	success	\N
5bff4d8e-37c4-4d98-b49b-e26ce1cca13b	2026-07-06 15:54:03.237889	EMP-MGR-26102	login	auth	success	\N
4eeceb4f-4f61-4c59-80a9-b8db8aaeceec	2026-07-06 15:56:07.397621	EMP-MGR-26100	login	auth	success	\N
0fe73fe7-b05c-4b4a-90b7-12a337d94e18	2026-07-06 16:03:35.330263	EMP-MGR-26102	login	auth	success	\N
d69ae488-2c1d-420b-987c-7bb1d31c6d99	2026-07-06 16:04:03.09398	EMP-MGR-26102	login	auth	success	\N
3177b653-0253-46a4-8189-46e3997b8261	2026-07-06 16:16:06.648364	EMP-MGR-26102	login	auth	success	\N
92b97e6d-92a4-4466-8ca3-58b5523dabec	2026-07-06 16:16:38.45995	EMP-MGR-26102	login	auth	success	\N
4ac4ce57-50b5-48bb-b458-7ccfdbdf93f0	2026-07-06 16:17:25.483708	EMP-MGR-26102	login	auth	success	\N
f3b8c9c9-f73b-4286-9407-19b6918f47a4	2026-07-07 04:29:14.829489	EMP-CSH-26101	login	auth	success	\N
f44dfbaa-fdcd-42d7-b396-e638d058089c	2026-07-07 04:29:15.179576	EMP-MGR-26102	login	auth	success	\N
1b671399-d39f-4b28-a655-3f24b97fa438	2026-07-07 04:49:43.15645	EMP-MGR-26100	login	auth	success	\N
22acedd2-b018-4d38-b1dc-0a71bc8e7a92	2026-07-07 04:50:52.903405	EMP-MGR-26100	login	auth	success	\N
86c01887-b9ad-4ac6-a476-3b061d9e7478	2026-07-07 04:52:04.78224	EMP-MGR-26100	login	auth	success	\N
6e02a0cd-9bce-4172-92fc-1b406241866f	2026-07-07 04:52:14.074219	bf375e9c-e011-4595-92b8-5650e6b28738	login	auth	success	\N
28f20d2e-d0eb-47e4-b528-8ee054f1d478	2026-07-07 06:30:24.657714	EMP-MGR-26100	login	auth	success	\N
848c5c3a-5996-4ab7-bf96-fdad9c542988	2026-07-07 06:31:32.29242	EMP-MGR-26100	login	auth	success	\N
1251201f-287f-4ea6-89b5-48fe0dc5c628	2026-07-07 06:32:33.832459	EMP-MGR-26100	login	auth	success	\N
42c5ae23-2c02-4158-80da-751d42c8d9a3	2026-07-07 06:39:51.395647	EMP-MGR-26100	login	auth	success	\N
95a83d23-5426-402d-8fc8-1714b739f00c	2026-07-07 06:50:57.072882	EMP-MGR-26100	login	auth	success	\N
3b272790-ee1b-49ac-836f-f59dc92019da	2026-07-07 13:35:52.035316	EMP-MGR-26100	login	auth	success	\N
03aea4dc-90dd-4312-bab3-2711d912a403	2026-07-08 02:14:15.076065	EMP-MGR-26100	login	auth	success	\N
31eb42d2-880b-4726-bdef-a53669cd3e57	2026-07-08 02:14:43.033992	EMP-MGR-26100	Create Ingredient	Ingredient:Tomato Paste	Success	\N
4ec45706-c73e-44ef-a86d-c938f046662e	2026-07-08 02:15:02.892992	EMP-WHS-26103	login	auth	success	\N
43393e0f-047f-47b5-8856-53465e4166d3	2026-07-08 02:38:23.641052	0c31e10e-a94f-4749-ac74-e69decedcc4f	login	auth	success	\N
acc98529-a91a-4b91-b922-200eca38e628	2026-07-08 02:39:24.420801	0c31e10e-a94f-4749-ac74-e69decedcc4f	login	auth	success	\N
43fc5546-241f-4cff-8d0b-454ca4a95183	2026-07-08 02:40:27.067164	0c31e10e-a94f-4749-ac74-e69decedcc4f	login	auth	success	\N
cb75991a-da35-4efd-b6db-e7faa7c76ccd	2026-07-08 02:44:36.257813	0c31e10e-a94f-4749-ac74-e69decedcc4f	login	auth	success	\N
9b1f02d4-99f2-4cab-a1f9-18cfd6ae5472	2026-07-08 02:49:28.338959	0c31e10e-a94f-4749-ac74-e69decedcc4f	login	auth	success	\N
d12c8490-a051-4994-af1a-b8000de65345	2026-07-08 02:50:34.543197	0c31e10e-a94f-4749-ac74-e69decedcc4f	login	auth	success	\N
cea2849b-d329-4f02-8fd5-f5ab3ffe66a3	2026-07-08 02:56:12.517949	EMP-WHS-26103	login	auth	success	\N
24272d2d-a8d8-46d5-888e-b5345a85dcc7	2026-07-08 02:56:20.282457	EMP-WHS-26103	Stock Adjustment	Ingredient:Tomato Paste	Success	\N
851b5686-790e-4f6e-baae-bf73911d9729	2026-07-08 02:56:20.368806	EMP-WHS-26103	Stock Adjustment	Ingredient:Tomato Paste	Success	\N
1a3955b8-189f-461c-825d-f155a611ac45	2026-07-08 02:56:20.392371	EMP-WHS-26103	Update Ingredient	Ingredient:Tomato Paste	Success	\N
25696bfb-e3e1-428f-b7f1-b992d4d1c0db	2026-07-08 02:58:11.354081	EMP-WHS-26103	login	auth	success	\N
072e0c3d-034c-47fd-8a82-c3b0f6992541	2026-07-08 02:58:18.914126	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	\N
d346d3d8-6558-4d68-9a4a-2e9d90cb76db	2026-07-08 02:58:18.943212	EMP-WHS-26103	Update Ingredient	Ingredient:Tortilla Wraps	Success	\N
d1084b39-9f95-452c-a373-6b30bd40406b	2026-07-08 02:58:21.013245	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	\N
9ebd8281-d224-4101-a583-53075b41fe25	2026-07-08 02:58:50.067343	EMP-WHS-26103	login	auth	success	\N
a98df699-c783-403a-aaca-e641b98ee6b2	2026-07-08 02:58:57.603014	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	\N
08ddab44-9223-4cd7-9770-e5042f027707	2026-07-08 02:58:57.691347	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	\N
f1539944-a229-4eb7-b191-db05dba60b65	2026-07-08 02:59:39.224086	EMP-WHS-26103	login	auth	success	\N
05154177-8ff5-4d23-9b24-c3a834b318b9	2026-07-08 02:59:46.800586	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	\N
18e6e15f-e081-4b7b-a16e-63af571d3609	2026-07-08 02:59:46.902062	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	\N
b105eeba-4b0d-4ad0-96a9-b738c567f91b	2026-07-08 03:00:41.020458	EMP-WHS-26103	login	auth	success	\N
f3b14de6-e655-4c8b-9fd3-de78ef883ee6	2026-07-08 03:00:48.598651	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	\N
92f94c4f-8a33-47ae-b3fa-cb363be47e2c	2026-07-08 03:00:48.684124	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	\N
4ab8b555-56a5-4d01-bbe7-f2a1a652cfa1	2026-07-08 03:01:31.81386	EMP-WHS-26103	login	auth	success	\N
20b13c72-9fe1-4d28-8121-beced732913b	2026-07-08 03:01:31.839878	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	\N
e99f907c-7fcf-464e-a853-65f442c78873	2026-07-08 03:01:34.118106	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	\N
09dce695-548c-423a-9642-f9917e954870	2026-07-08 03:01:50.09444	EMP-WHS-26103	login	auth	success	\N
594d7ea5-5dc1-4491-ab9d-61683aa32a11	2026-07-08 03:01:50.121695	EMP-WHS-26103	Stock Adjustment	Ingredient:Tomatoes	Success	\N
9189764e-83ad-44d5-8128-a68c2ce73686	2026-07-08 03:02:40.328382	EMP-WHS-26103	login	auth	success	\N
0c7917b1-35ce-4e8e-b7a5-51504f1d7ef0	2026-07-08 03:02:40.364966	EMP-WHS-26103	Stock Adjustment	Ingredient:Standard Black Tea	Success	\N
5f36c65d-bbf1-40b5-a32e-3caf39cea200	2026-07-08 03:02:42.632301	EMP-WHS-26103	Stock Adjustment	Ingredient:Standard Black Tea	Success	\N
1404cc2d-b47d-4114-aad2-a3a6e7c2a1ce	2026-07-08 04:06:20.298392	EMP-WHS-26103	login	auth	success	\N
52c7c021-6528-404f-a720-cf60c057b9fb	2026-07-08 04:14:54.778424	EMP-WHS-26103	Stock Adjustment	Ingredient:Milo Powder	Success	\N
f94b9a31-3267-4d1c-b886-cd6383ef8b64	2026-07-08 04:18:20.458581	EMP-WHS-26103	login	auth	success	\N
c11086c1-99ba-4f98-8ac1-3d6b216e0272	2026-07-08 04:35:35.599485	EMP-MGR-26100	login	auth	success	\N
91afc858-8ec9-4ce6-a894-1a711886d606	2026-07-08 04:41:43.996567	EMP-WHS-26103	login	auth	success	\N
2de0a61e-132c-47ad-9359-8ba33895b27f	2026-07-08 04:48:56.033655	EMP-WHS-26103	Draft PO	PO to SUP-DPS-26100	Success	\N
5d4e2f0b-eb62-410f-833b-d9ebff5a462f	2026-07-08 04:52:56.690051	EMP-MGR-26100	login	auth	success	\N
35f30807-46df-4405-9481-df8397155fdd	2026-07-08 04:53:17.425897	EMP-WHS-26103	login	auth	success	\N
cd76d814-81f2-4ec7-8d5d-ce90893a30ea	2026-07-08 05:01:54.826173	EMP-WHS-26103	Stock Adjustment	Ingredient:Chicken Eggs (Telur)	Success	\N
dc39631d-a034-47d5-94a3-1d2b9d188ed4	2026-07-08 05:13:28.838819	EMP-WHS-26103	login	auth	success	\N
1ea446b4-12d9-4fea-80fa-7c581c581309	2026-07-08 05:14:01.324098	EMP-WHS-26103	login	auth	success	\N
8c0cadc6-a9fe-4530-8089-72a01efcb334	2026-07-08 05:18:22.148356	EMP-MGR-26100	login	auth	success	\N
78d7346b-6f3f-4bb8-81f3-6928816834ed	2026-07-08 05:40:37.642385	EMP-WHS-26103	login	auth	success	\N
957fc0cd-298b-4571-ae6e-48cf31fb638e	2026-07-08 05:44:43.346011	EMP-MGR-26100	login	auth	success	\N
33965e6b-ef51-43e3-b635-a257d59fa4a3	2026-07-08 05:44:53.967013	EMP-WHS-26103	login	auth	success	\N
bc4b42d4-501c-4de3-81f9-8ac960506353	2026-07-08 05:45:17.82951	EMP-MGR-26100	login	auth	success	\N
c06a7ea8-71c9-4eec-a8c8-93b2de3e12a6	2026-07-08 05:51:40.218603	EMP-MGR-26100	login	auth	success	\N
494f8a04-0927-4e29-9c35-0c00ff76d3fb	2026-07-08 05:53:42.103051	EMP-WHS-26103	login	auth	success	\N
f6fd67aa-4f89-40af-abe1-15f8fded6467	2026-07-08 05:55:53.815419	EMP-CSH-26101	login	auth	success	\N
32289837-d744-4535-9f2c-3ca887ea4dd4	2026-07-08 05:56:16.581192	EMP-CSH-26101	login	auth	success	\N
d93de0d0-c231-4c18-8f15-ebcd83f13584	2026-07-08 05:56:46.396815	EMP-CSH-26101	login	auth	success	\N
9493e415-9463-4b29-9c42-ac1d4563b784	2026-07-08 06:03:44.127897	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
0c697b60-b4e9-41eb-a969-37605faa9803	2026-07-08 06:03:58.816911	EMP-WHS-26103	login	auth	success	\N
32ca5b2e-14dc-4f1d-9152-eb56027e77b2	2026-07-08 06:04:23.188758	EMP-CSH-26101	login	auth	success	\N
dd1fb944-6f5b-4e20-9c5d-d691fcb3d785	2026-07-08 06:04:48.483276	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
4792fcb5-aec2-435c-9b87-53a135af23ee	2026-07-08 06:04:56.636415	EMP-WHS-26103	login	auth	success	\N
92425286-cf55-4a5d-867b-54d6ea907506	2026-07-08 06:05:22.03325	EMP-CSH-26101	login	auth	success	\N
cdbcb864-31e3-4aa8-9ee3-f784e8c6d8c2	2026-07-08 06:05:50.181749	EMP-MGR-26100	login	auth	success	\N
841499b5-adf9-43b3-bc24-ae6b9ba92fa1	2026-07-08 06:06:01.443769	EMP-WHS-26103	login	auth	success	\N
1f06b606-7663-465d-b33b-a9d21ac0f654	2026-07-08 06:08:11.151036	EMP-CSH-26101	login	auth	success	\N
324af95a-d291-4942-8112-c728c827e648	2026-07-08 06:24:38.167361	EMP-MGR-26100	login	auth	success	\N
1932a38f-22e2-4842-ad0b-da4df15a179a	2026-07-08 06:29:26.935295	EMP-WHS-26103	login	auth	success	\N
15f4c518-676f-419d-9ae4-5a479221451e	2026-07-08 06:29:56.788423	EMP-WHS-26103	Draft PO	PO to SUP-DPS-26100	Success	\N
697d746b-ecb0-41bf-bc09-9622d86c9ce8	2026-07-08 06:30:43.745878	EMP-WHS-26103	Stock Adjustment	Ingredient:Burger Buns	Success	\N
73d214b9-31d9-4518-9590-cdb32fb4ff59	2026-07-08 06:31:25.101267	EMP-WHS-26103	Stock Adjustment	Ingredient:Burger Buns	Success	\N
2c9c3074-368e-4ac3-9d38-ea5e31e62791	2026-07-08 06:31:42.604861	EMP-WHS-26103	Draft PO	PO to SUP-DPS-26100	Success	\N
3f59c87a-8cf2-4824-88bb-9679df663c30	2026-07-08 06:35:05.809645	EMP-WHS-26103	Stock Adjustment	Ingredient:Condensed Milk	Success	\N
3a540c5d-0463-4b5a-9c1e-c75a7531418c	2026-07-08 06:35:12.757118	EMP-WHS-26103	Stock Adjustment	Ingredient:Instant Noodles (Indomie)	Success	\N
7ada95d7-2b33-46dd-a81e-bba3b06f53bc	2026-07-08 06:37:57.166088	EMP-CSH-26101	login	auth	success	\N
48eff32a-d1a3-42d4-bea6-ec8f50a69191	2026-07-08 06:38:34.992339	EMP-MGR-26100	login	auth	success	\N
1a38a22f-6def-468e-a2b4-82bc13caaad6	2026-07-08 06:38:57.996951	EMP-WHS-26103	login	auth	success	\N
f670e597-81c9-4869-8c78-699144365420	2026-07-08 06:43:58.909717	EMP-MGR-26100	login	auth	success	\N
81197d9b-ce11-4259-be40-207cb4312b58	2026-07-08 06:53:39.767595	EMP-CSH-26101	login	auth	success	\N
de2c6a40-9d5a-4422-a5d9-19d1fed1bc24	2026-07-08 06:54:37.201173	EMP-CSH-26101	Transaction Checkout	POS	Success	\N
de516c64-51a4-4a2d-81aa-10a82cb64792	2026-07-08 07:08:29.102685	EMP-CSH-26101	login	auth	success	\N
917bb4d3-c54d-4aa3-b090-cb80ccf3f325	2026-07-08 07:11:59.615019	EMP-WHS-26103	login	auth	success	\N
e40e43c0-6792-4c18-9eae-2c62f0373289	2026-07-08 07:14:37.08969	EMP-WHS-26103	Draft PO	PO to SUP-DPS-26100	Success	\N
0f314c46-2802-42e0-912a-683f24b56baf	2026-07-08 07:15:10.960719	EMP-WHS-26103	Bulk Receive	Ingredient:Condensed Milk	Success	\N
76de25fe-04ea-474b-aa6f-dbdce8792514	2026-07-08 07:16:42.918111	EMP-MGR-26100	login	auth	success	\N
37330db7-5ad8-4fc2-b37d-76053e8dc5b4	2026-07-08 10:39:01.547124	EMP-WHS-26103	login	auth	success	\N
e60ab0e5-ef23-4736-b389-babf2dadd0dd	2026-07-08 10:39:07.024044	EMP-WHS-26103	Stock Adjustment	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 0.0, "new_stock": 999.0, "delta": 999.0, "reason": "Physical count correction"}
6cb8e5fc-f210-4b04-96c9-83d9692204f9	2026-07-08 10:39:07.055408	EMP-WHS-26103	Update Ingredient	Ingredient:Instant Noodles (Indomie)	Success	\N
f429a77f-7799-4634-af34-89ef3322d506	2026-07-08 10:39:09.074003	EMP-WHS-26103	Stock Adjustment	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 999.0, "new_stock": 1000.0, "delta": 1.0, "reason": "API_Background"}
35ebc207-b41a-47e5-b19c-d64b35914e30	2026-07-08 10:48:31.265803	EMP-WHS-26103	login	auth	success	\N
f7dfb23f-1b7f-4df2-88c2-6fd37455f096	2026-07-08 10:48:36.917793	EMP-WHS-26103	Stock Adjustment	Ingredient:Burger Buns	Success	{"old_stock": 5.0, "new_stock": 999.0, "delta": 994.0, "reason": "Physical count correction"}
f77c4d53-d2de-4bc7-a62a-d074787d7d1d	2026-07-08 10:48:36.94577	EMP-WHS-26103	Update Ingredient	Ingredient:Burger Buns	Success	\N
f4db909d-8402-4798-bafe-33ff02794d41	2026-07-08 10:48:39.212094	EMP-WHS-26103	Stock Adjustment	Ingredient:Burger Buns	Success	{"old_stock": 999.0, "new_stock": 1000.0, "delta": 1.0, "reason": "API_Background"}
753a8f79-f3ef-4ddc-9fbd-01348fce65d5	2026-07-08 10:48:39.441994	EMP-WHS-26103	Stock Adjustment	Ingredient:Burger Buns	Success	{"old_stock": 1000.0, "new_stock": 1001.0, "delta": 1.0, "reason": "API_Background"}
180cbd05-e7de-44fc-90fd-2710f455f4d1	2026-07-08 10:48:39.463791	EMP-WHS-26103	Stock Adjustment	Ingredient:Burger Buns	Success	{"old_stock": 1001.0, "new_stock": 1002.0, "delta": 1.0, "reason": "API_Background"}
ecc41a85-5852-4b77-b0db-169a4aec0123	2026-07-08 12:07:30.797847	EMP-WHS-26103	login	auth	success	\N
18306471-c444-45dc-8898-d8e86a8b40a4	2026-07-08 12:07:30.841609	EMP-WHS-26103	Stock Adjustment	Ingredient:Sugar	Success	{"old_stock": 98.21999999999994, "new_stock": 99.21999999999994, "delta": 1.0, "reason": "API_Background"}
e9020cd7-52ca-4e7d-9259-c9911d1b9334	2026-07-08 12:07:31.096906	EMP-WHS-26103	Stock Adjustment	Ingredient:Sugar	Success	{"old_stock": 99.21999999999994, "new_stock": 98.21999999999994, "delta": -1.0, "reason": "Physical count correction"}
44d2d559-f721-4739-9697-7b514c2b5363	2026-07-08 15:28:04.970868	EMP-WHS-26103	login	auth	success	\N
a0bacf95-2119-4734-81c7-599e94fe0751	2026-07-08 15:28:05.01592	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 93.20000000000007, "new_stock": 94.20000000000007, "delta": 1.0, "reason": "Race0"}
e83fd1f8-23d8-4337-8a48-e6250215ac18	2026-07-08 15:28:05.324032	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 94.20000000000007, "new_stock": 95.20000000000007, "delta": 1.0, "reason": "Race1"}
dfed5045-63cb-4664-af0a-b71c876b788d	2026-07-08 15:28:05.638872	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 95.20000000000007, "new_stock": 96.20000000000007, "delta": 1.0, "reason": "Race22"}
c866d717-60de-4428-a6c1-5e02a37354a9	2026-07-08 15:28:05.659108	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 96.20000000000007, "new_stock": 97.20000000000007, "delta": 1.0, "reason": "Race21"}
b053eaa1-ead6-4c08-bc07-aff80c8b59c3	2026-07-08 15:28:05.678883	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 97.20000000000007, "new_stock": 98.20000000000007, "delta": 1.0, "reason": "Race13"}
b7a44ef0-f4a2-4a8e-a9cb-13b46b941b8e	2026-07-08 15:28:05.723729	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 98.20000000000007, "new_stock": 99.20000000000007, "delta": 1.0, "reason": "Race7"}
3835c944-78c5-4a31-ad4d-f5346bcac3f7	2026-07-08 15:28:05.825281	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 100.20000000000007, "new_stock": 101.20000000000007, "delta": 1.0, "reason": "Race40"}
2b48e6d4-8c4e-4c03-8d39-c9d252948c35	2026-07-08 15:28:05.781483	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 99.20000000000007, "new_stock": 100.20000000000007, "delta": 1.0, "reason": "Race25"}
8aadd044-fc75-43ce-8dff-1241e12a8a1b	2026-07-08 15:28:05.867794	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 101.20000000000007, "new_stock": 102.20000000000007, "delta": 1.0, "reason": "Race16"}
80463686-c89b-4cf8-bc0a-68517bc308ed	2026-07-09 07:09:43.383804	EMP-WHS-26103	login	auth	success	\N
3a9da402-6990-4b83-9085-c4c7ecc814f3	2026-07-09 07:26:56.509948	EMP-WHS-26103	login	auth	success	\N
ba651931-42c6-44e3-8ddb-3861f8148f4c	2026-07-09 07:45:21.012974	EMP-WHS-26103	login	auth	success	\N
b1ae23a6-08c2-4ea5-8b05-4dc9f71eafff	2026-07-09 07:52:27.360519	EMP-MGR-26100	login	auth	success	\N
1761cf6f-1cf1-42ef-8ed5-220598df1c6f	2026-07-09 07:53:31.196711	EMP-WHS-26103	login	auth	success	\N
051e9093-5001-4fce-8cb5-6d07e36236ac	2026-07-09 07:55:35.700651	EMP-MGR-26100	login	auth	success	\N
2fad1464-314f-4be0-af82-a5a2fdc29572	2026-07-09 07:57:29.975076	EMP-WHS-26103	login	auth	success	\N
da88b8ea-d6b8-4146-b4f7-8a92ab43e9d4	2026-07-09 08:00:10.505638	EMP-WHS-26103	login	auth	success	\N
b9e087bf-f84e-4921-96bd-e1e61f5a1e7a	2026-07-09 08:03:02.770742	EMP-MGR-26100	login	auth	success	\N
6570e2fa-6fe0-4ccf-bd25-a747ad10cab7	2026-07-09 08:03:48.172144	EMP-WHS-26103	login	auth	success	\N
381e38b6-4b24-4c22-8c4b-0b0218270bca	2026-07-10 11:44:42.981583	EMP-MGR-26100	login	auth	success	\N
237e6598-9b07-43ca-b04c-f5f890bcdfc7	2026-07-10 11:46:53.042329	EMP-MGR-26100	login	auth	success	\N
23ab2741-6a65-4c80-9862-5b42950dda0f	2026-07-10 11:58:17.979044	EMP-MGR-26100	login	auth	success	\N
f5f8246c-c780-4dea-b09d-28677e7a93d0	2026-07-10 11:58:45.262907	EMP-WHS-26103	login	auth	success	\N
114629f4-8bab-4667-817c-8b6d954e9fe5	2026-07-11 07:04:35.957858	EMP-WHS-26103	login	auth	success	\N
0ad9c30b-d589-41d5-a13b-5eaeb01fdeb9	2026-07-11 07:10:26.049862	EMP-WHS-26103	login	auth	success	\N
09f4d691-fc95-4d4e-8e94-22df895ffc5d	2026-07-11 07:16:13.836183	EMP-MGR-26100	login	auth	success	\N
3ec41eea-a2c6-413f-b743-fd5315e3e78f	2026-07-11 09:17:11.498942	EMP-MGR-26100	Send PO	PO:2906ca87-5bc8-42c3-ad94-9a82a2bdd92e	Success	{"status_from": "Draft", "status_to": "Sent"}
321a2b9b-8bd3-4dc3-9d23-21c02e1084c4	2026-07-11 09:29:50.47331	EMP-MGR-26100	login	auth	success	\N
c94cfa9b-0c71-4403-b7d4-13cb76d52e51	2026-07-11 14:11:25.538559	EMP-WHS-26103	Stock Adjustment	Ingredient:Fresh Milk (Susu Cair)	Success	{"old_stock": 102.20000000000007, "new_stock": 5.0, "delta": -97.20000000000007, "reason": "Damaged in storage"}
63b0def9-2088-4166-bdf2-1faf39ec3af7	2026-07-11 14:12:49.557177	EMP-WHS-26103	Draft PO	PO to SUP-DPS-26101	Success	\N
bc9ac89d-7fb1-4e69-932c-666aa4b43f93	2026-07-11 14:13:26.06717	EMP-MGR-26100	Send PO	PO:PO-2607-001	Success	{"status_from": "Draft", "status_to": "Sent"}
86147cca-2c34-449e-bb36-69bb11f3e9eb	2026-07-11 14:17:11.82478	EMP-MGR-26100	Send PO	PO:5333a6d6-7a60-41f7-8b29-b7fed1e53f21	Success	{"status_from": "Draft", "status_to": "Sent"}
01bda0d2-3fd9-42a8-8e4f-d153f192c73c	2026-07-11 14:17:51.846206	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	{"old_stock": 999.0, "new_stock": 0.0, "delta": -999.0, "reason": "Damaged in storage"}
d029827a-15ca-4a4c-97e1-fe4d277cf8c8	2026-07-11 14:20:26.080365	EMP-MGR-26100	Send PO	PO:aa53196f-c91c-4b34-bab1-55d14adf2d0a	Success	{"status_from": "Draft", "status_to": "Sent"}
d421afac-4720-4de3-accf-8bb7abe46c2b	2026-07-11 14:22:40.548917	EMP-MGR-26100	Cancel PO	PO:aa53196f-c91c-4b34-bab1-55d14adf2d0a	Success	{"reason": "No"}
598b28f4-4060-44d4-83ae-86df09f8f8bc	2026-07-11 14:23:23.711585	EMP-MGR-26100	Send PO	PO:7b28504b-dafe-41a0-a2e3-f8aa30615c55	Success	{"status_from": "Draft", "status_to": "Sent"}
e068d1a8-7ceb-4081-8df9-3ebfc190ba28	2026-07-11 15:38:32.016275	EMP-WHS-26103	login	auth	success	\N
43ff6a7b-7e0c-4f93-b889-86c3b49639f1	2026-07-11 15:50:29.958909	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	{"old_stock": 0.0, "new_stock": 3.0, "delta": 3.0, "reason": "Physical count correction"}
04a00d3b-129b-4df6-95c2-bac935604cbc	2026-07-11 15:51:00.34972	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	{"old_stock": 3.0, "new_stock": 6.0, "delta": 3.0, "reason": "Physical count correction"}
1b5012f7-c773-478c-9905-9deac9d44f50	2026-07-11 15:51:24.382992	EMP-WHS-26103	Stock Adjustment	Ingredient:Tortilla Wraps	Success	{"old_stock": 6.0, "new_stock": 12.0, "delta": 6.0, "reason": "Physical count correction"}
ad94cef5-9832-4579-bb40-c424ae2c42d1	2026-07-11 16:18:31.923422	EMP-MGR-26100	login	auth	success	\N
97bc10ba-712a-4166-89aa-8a455cb4d0dd	2026-07-11 16:18:45.120969	EMP-MGR-26104	login	auth	success	\N
140b2a39-8677-49bb-9029-a1975b416d55	2026-07-12 01:59:40.404347	EMP-WHS-26103	login	auth	success	\N
6272566b-559a-4c95-9e8f-48cec92f4047	2026-07-12 02:09:09.45792	EMP-MGR-26100	login	auth	success	\N
ac2f6885-ae31-4a7c-9f2b-04509f3db13b	2026-07-12 02:09:24.458145	EMP-MGR-26104	login	auth	success	\N
5555a47c-ba4e-4f64-9fb6-44f0f1206fba	2026-07-12 02:12:10.994436	EMP-MGR-26100	login	auth	success	\N
15fe16ce-39b0-448d-baf1-5dfad3501c5a	2026-07-12 02:12:26.031047	EMP-MGR-26104	login	auth	success	\N
be248d07-4141-4723-bc56-a310903dbf1d	2026-07-12 02:18:22.491208	EMP-WHS-26103	login	auth	success	\N
e70714b6-f0e3-4f63-8673-0e9d1d1a3026	2026-07-12 11:00:00.862375	EMP-WHS-26103	login	auth	success	\N
8fa15b63-98bd-437a-b7ec-677b6a00567c	2026-07-12 13:08:54.360726	EMP-MGR-26100	login	auth	success	\N
1366c56c-1c7d-4d4f-abde-be112ef875bf	2026-07-12 13:11:57.840202	EMP-WHS-26103	login	auth	success	\N
44e14b98-8f58-4dcf-b087-b377fa91e39d	2026-07-12 13:55:53.77754	EMP-MGR-26100	login	auth	success	\N
d74c132c-fa55-47d3-868f-a2f456b12503	2026-07-12 13:56:30.926694	EMP-MGR-26100	login	auth	success	\N
0f76eda7-a226-43f6-a945-04088790b69a	2026-07-12 14:24:11.963958	EMP-WHS-26103	Stock Adjustment	Ingredient:Burger Buns	Success	{"old_stock": 42.0, "new_stock": 20.0, "delta": -22.0, "reason": "Physical count correction"}
b8b20405-19ad-47b8-8784-0acbcff6c059	2026-07-12 14:32:11.286143	EMP-CSH-26101	login	auth	success	\N
b4e73b3c-fe62-430a-b886-6f2d2c3b29ca	2026-07-12 14:32:26.320942	EMP-CSH-26101	login	auth	success	\N
d34941a1-6fd5-400c-a7f8-bc1d5eef96ab	2026-07-12 14:32:33.421162	EMP-MGR-26100	login	auth	success	\N
7a104160-3df6-4d5e-9205-5eac929a1b92	2026-07-12 14:58:44.107854	EMP-WHS-26103	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 20.0, "new_stock": 24.0, "delta": 4.0, "reason": "PO Received (ID: PO-2607-001)"}
c3d092c6-4d38-4b39-9767-2266d03ee3bb	2026-07-12 14:58:03.131482	EMP-WHS-26103	Draft PO	PO to SUP-JKT-26102	Success	\N
9fd007ca-7482-4c27-a978-d437e2434553	2026-07-12 14:58:38.917496	EMP-MGR-26100	Send PO	PO:PO-2607-001	Success	{"status_from": "Draft", "status_to": "Sent"}
186c0c1e-2a1d-4108-9c62-dd6b7a65f457	2026-07-12 14:58:47.271226	EMP-WHS-26103	Undo Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 24.0, "new_stock": 20.0, "delta": -4.0, "reason": "PO Receipt Undone (ID: PO-2607-001)"}
6c8ac060-9dd4-4482-b6bb-b99e429b1f0e	2026-07-12 23:45:17.102551	EMP-MGR-26100	login	auth	success	\N
fc0a9b5b-29af-4c31-859d-62c00d937e01	2026-07-12 23:53:45.110706	EMP-MGR-26100	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 20.0, "new_stock": 24.0, "delta": 4.0, "reason": "PO Received (ID: PO-2607-001)"}
9c3f999c-e12a-44bd-82e6-3bb1d10fe251	2026-07-12 23:54:28.058386	EMP-MGR-26100	Undo Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 24.0, "new_stock": 20.0, "delta": -4.0, "reason": "PO Receipt Undone (ID: PO-2607-001)"}
42d98b08-5e7c-4615-bb86-aa08c9e1a37c	2026-07-12 23:54:51.403039	EMP-MGR-26100	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 20.0, "new_stock": 24.0, "delta": 4.0, "reason": "PO Received (ID: PO-2607-001)"}
00d56574-a72e-4cd4-82e9-734e5e16000f	2026-07-12 23:54:53.940526	EMP-MGR-26100	Undo Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 24.0, "new_stock": 20.0, "delta": -4.0, "reason": "PO Receipt Undone (ID: PO-2607-001)"}
1c3dd10a-4833-4585-acc7-5d5b4fb9cba7	2026-07-13 00:19:56.699499	EMP-MGR-26100	login	auth	success	\N
90346b9b-9ba1-43ed-b2e7-a846bc0a693a	2026-07-13 00:51:53.32368	EMP-MGR-26100	Receive PO	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 68.0, "new_stock": 78.0, "delta": 10.0, "reason": "PO Received (ID: PO-TEST-1)"}
b45b1849-bca4-4874-bae6-8782ef9fec65	2026-07-13 00:52:45.860567	EMP-MGR-26100	Receive PO	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 78.0, "new_stock": 98.0, "delta": 20.0, "reason": "PO Received (ID: PO-TEST-2)"}
24540461-1a40-4730-9ad0-4125d5e56d38	2026-07-13 00:55:01.691965	EMP-MGR-26100	Undo Receive PO	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 98.0, "new_stock": 88.0, "delta": -10.0, "reason": "PO Receipt Undone (ID: PO-TEST-1)"}
6555d4ea-10ba-4250-aa06-a921019be3a4	2026-07-13 00:55:04.024164	EMP-MGR-26100	Undo Receive PO	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 88.0, "new_stock": 68.0, "delta": -20.0, "reason": "PO Receipt Undone (ID: PO-TEST-2)"}
8cb56759-e250-44b6-93b5-45fb86dab257	2026-07-13 00:55:34.57637	EMP-MGR-26100	Receive PO	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 68.0, "new_stock": 83.0, "delta": 15.0, "reason": "PO Received (ID: PO-TEST-1)"}
3e1dc2fa-d7ff-4c18-ae58-fd271844c539	2026-07-13 00:55:45.38819	EMP-MGR-26100	Receive PO	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 83.0, "new_stock": 103.0, "delta": 20.0, "reason": "PO Received (ID: PO-TEST-2)"}
f601c460-6d60-4976-b7d9-f4a125704e94	2026-07-13 00:55:53.711436	EMP-MGR-26100	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 20.0, "new_stock": 22.0, "delta": 2.0, "reason": "PO Received (ID: PO-2607-001)"}
b858050e-6b12-466a-b500-795193069e16	2026-07-13 01:28:33.523596	EMP-WHS-26103	login	auth	success	\N
185212ee-2727-4681-a1bb-98451296a8d4	2026-07-13 01:57:36.521019	EMP-MGR-26100	login	auth	success	\N
943a52be-7d6d-4ec6-94e9-1c2a105fc0af	2026-07-13 01:58:31.545966	EMP-WHS-26103	login	auth	success	\N
f3b5964d-56b2-4793-94d7-9f1b4a06d1f1	2026-07-13 02:03:59.639123	EMP-WHS-26103	login	auth	success	\N
268c2a74-cea3-4bd8-b9b5-fe57f280e951	2026-07-13 02:17:37.254297	EMP-MGR-26100	login	auth	success	\N
8d41a343-aad7-4eb9-aedc-cb14bf5a9a62	2026-07-13 02:18:21.548489	EMP-WHS-26103	login	auth	success	\N
e7138be8-6afa-453a-abca-b683bc8210ef	2026-07-13 02:37:30.643264	EMP-MGR-26100	login	auth	success	\N
75580377-03d3-4045-98d8-f16fc0a87725	2026-07-13 04:56:17.67815	EMP-WHS-26103	Undo Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 22.0, "new_stock": 20.0, "delta": -2.0, "reason": "PO Receipt Undone (ID: PO-2607-001)"}
1e177822-98f1-445e-9fff-74c3f9f15586	2026-07-13 04:56:31.213134	EMP-WHS-26103	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 20.0, "new_stock": 21.0, "delta": 1.0, "reason": "PO Received (ID: PO-2607-001)"}
20009d2b-fb22-4907-99b6-c5e6958e2fac	2026-07-13 04:56:38.766787	EMP-WHS-26103	Undo Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 21.0, "new_stock": 20.0, "delta": -1.0, "reason": "PO Receipt Undone (ID: PO-2607-001)"}
dee10398-b629-431c-a0b9-750c2c22e930	2026-07-13 04:56:41.413375	EMP-WHS-26103	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 20.0, "new_stock": 24.0, "delta": 4.0, "reason": "PO Received (ID: PO-2607-001)"}
7740f11c-59d0-49ed-8212-2e97addab8e5	2026-07-13 04:56:50.976881	EMP-WHS-26103	Undo Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 24.0, "new_stock": 20.0, "delta": -4.0, "reason": "PO Receipt Undone (ID: PO-2607-001)"}
8471a9c8-86f3-4f87-b85c-3fe9857a8229	2026-07-13 04:56:59.118058	EMP-WHS-26103	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 20.0, "new_stock": 26.0, "delta": 6.0, "reason": "PO Received (ID: PO-2607-001)"}
4a1b7844-9a4d-4cca-b18e-388a9b8e5e9b	2026-07-13 04:57:09.063679	EMP-WHS-26103	Undo Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 26.0, "new_stock": 20.0, "delta": -6.0, "reason": "PO Receipt Undone (ID: PO-2607-001)"}
5cc125b5-b349-47a9-bd0e-80b46e0f7bc3	2026-07-13 04:57:27.759538	EMP-WHS-26103	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 20.0, "new_stock": 23.99, "delta": 3.99, "reason": "PO Received (ID: PO-2607-001)"}
a100756e-c4cb-46c9-a97a-86957105ab85	2026-07-13 04:57:55.439927	EMP-WHS-26103	Undo Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 23.99, "new_stock": 20.0, "delta": -3.99, "reason": "PO Receipt Undone (ID: PO-2607-001)"}
157d67fa-53f0-4ef7-9e17-39f2881d7bce	2026-07-13 04:57:57.054401	EMP-WHS-26103	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 20.0, "new_stock": 24.0, "delta": 4.0, "reason": "PO Received (ID: PO-2607-001)"}
b21350b9-0aa7-4433-8a07-fc9bd021b87f	2026-07-13 05:17:33.805856	EMP-WHS-26103	Undo Receive PO	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 103.0, "new_stock": 83.0, "delta": -20.0, "reason": "PO Receipt Undone (ID: PO-TEST-2)"}
0250798f-75a5-4d2f-bf96-9231536c2f5f	2026-07-13 11:43:10.206359	EMP-MGR-26100	login	auth	success	\N
b6ed8429-533d-4555-9330-6aeab079aec4	2026-07-13 11:45:13.885358	EMP-WHS-26103	login	auth	success	\N
d4e1629e-eed8-4b67-8437-ee3db9eb4867	2026-07-13 12:09:45.206723	EMP-MGR-26102	login	auth	success	\N
6f4cfa96-6120-4fe8-88f3-c6b705b5cc6b	2026-07-13 12:12:07.810932	EMP-MGR-26102	login	auth	success	\N
83f744a9-6e4a-447d-9108-25f931e9a56f	2026-07-13 12:13:06.99014	EMP-MGR-26102	login	auth	success	\N
7cf8102a-1a60-4a3b-8e1c-d5178b8857e0	2026-07-13 12:13:42.608985	EMP-MGR-26102	login	auth	success	\N
e4fdb8b9-aab8-4f0a-a4bf-0c8cc23f3663	2026-07-13 12:21:29.898506	EMP-WHS-26103	Stock Adjustment	Ingredient:Burger Buns	Success	{"old_stock": 24.0, "new_stock": 3.0, "delta": -21.0, "reason": "Physical count correction"}
5b256d9d-7ee6-4073-8866-ce976ccf21bc	2026-07-13 12:25:22.800397	EMP-WHS-26103	Draft PO	PO to SUP-JKT-26102	Success	\N
45375902-10ae-4c60-a9d2-06425b64fd12	2026-07-13 12:29:11.351799	EMP-MGR-26100	Receive PO	Ingredient:Instant Noodles (Indomie)	Success	{"old_stock": 83.0, "new_stock": 99.0, "delta": 16.0, "reason": "PO Received (ID: PO-TEST-2)"}
6af98262-9c32-421c-a7b6-9bf4730b6778	2026-07-13 12:31:37.720863	EMP-WHS-26103	Stock Adjustment	Ingredient:Onions (Bawang Bombay)	Success	{"old_stock": 4.2, "new_stock": 0.0, "delta": -4.2, "reason": "Physical count correction"}
ab06eb46-a0a5-46b8-96fc-bf3018f9ef61	2026-07-13 12:14:22.882576	EMP-WHS-26103	login	auth	success	\N
3a9dfedc-fdba-4c04-afdb-ae2819136bd6	2026-07-13 12:16:06.035804	EMP-WHS-26103	login	auth	success	\N
e0ea4e5c-d6b0-4df9-8dc0-288d235b1e64	2026-07-13 12:28:51.504779	EMP-MGR-26100	login	auth	success	\N
9ad1b29c-7f02-4cb6-af69-5cde860b9871	2026-07-13 12:29:30.531679	EMP-MGR-26100	Send PO	PO:PO-2607-002	Success	{"status_from": "Draft", "status_to": "Sent"}
ae84e492-2908-409d-9958-165784d0ad07	2026-07-13 12:30:27.413478	EMP-WHS-26103	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 3.0, "new_stock": 24.0, "delta": 21.0, "reason": "PO Received (ID: PO-2607-002)"}
a0e18679-c0d4-4def-8324-17505eaa729b	2026-07-13 12:30:44.20597	EMP-WHS-26103	Draft PO	PO to SUP-JKT-26102	Success	\N
a2956d14-07b4-4d0b-bce9-1e28aef69072	2026-07-13 12:30:52.840135	EMP-MGR-26100	Send PO	PO:PO-2607-003	Success	{"status_from": "Draft", "status_to": "Sent"}
28c0f2ae-1522-432f-9a40-a85c5fa239cb	2026-07-13 12:30:56.786309	EMP-MGR-26100	Receive PO	Ingredient:Burger Buns	Success	{"old_stock": 24.0, "new_stock": 48.0, "delta": 24.0, "reason": "PO Received (ID: PO-2607-003)"}
7b8fe0ed-d382-4679-960b-4655f6bd4efe	2026-07-13 12:31:25.143673	EMP-WHS-26103	Stock Adjustment	Ingredient:Chicken Breast Fillet	Success	{"old_stock": 18.4, "new_stock": 3.65, "delta": -14.75, "reason": "Physical count correction"}
72b387cc-5be4-4ce5-91bb-da96bd68dfc2	2026-07-13 12:37:27.55362	EMP-MGR-26100	Send PO	PO:PO-2607-004	Success	{"status_from": "Draft", "status_to": "Sent"}
c6b7e384-46d7-4a5b-b9f3-f03ae41d631e	2026-07-13 12:40:06.890103	EMP-MGR-26100	Cancel PO	PO:PO-2607-004	Success	{"reason": "Drafted the wrong Item"}
b53c0bad-e2b4-47f7-b436-6ce2f644b85b	2026-07-13 12:37:16.377821	EMP-WHS-26103	Draft PO	PO to SUP-JKT-26102	Success	\N
7f92d2ff-e44c-4458-bb61-47a18b116463	2026-07-13 12:44:46.110885	EMP-MGR-26100	login	auth	success	\N
cd8f2290-d0b2-4c12-8385-4d2bd4c3a00a	2026-07-13 12:44:57.775153	EMP-CSH-26101	login	auth	success	\N
cc56ef07-fa1b-4a28-b8d0-e70e31ed8c8b	2026-07-13 12:49:05.909051	EMP-CSH-26101	login	auth	success	\N
1902d2d5-ac1d-40f5-8ce6-8e9b78e765b0	2026-07-13 12:49:41.747805	EMP-CSH-26101	login	auth	success	\N
246b9710-7a67-4c7a-a637-77caab32d0ae	2026-07-13 13:44:57.005547	EMP-MGR-26100	login	auth	success	\N
\.


--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.ingredients (id, name, stock_level, unit, reorder_point, last_updated, preferred_supplier_id, version_id, category, unit_cost) FROM stdin;
02777011-f9d9-4459-8328-b43400cb5baf	Fresh Milk (Susu Cair)	15.600	Liter	6.000	2026-07-04 20:05:41.427818	\N	47	Dairy/Egg	20000.00
e443b717-46ee-47b4-8a3e-574600849a88	Tortilla Wraps	86.000	pcs	40.000	2026-07-04 20:05:41.410451	\N	50	Bakery	5000.00
8cda5c89-7fbd-4596-ab49-a13d5bbec5e3	Chicken Eggs (Telur)	112.000	pcs	45.000	2026-07-04 20:05:41.4088	\N	44	Dairy/Egg	2000.00
4b77e0a3-b56b-4352-a66a-b08267215538	Lettuce	1.300	kg	1.000	2026-07-04 20:05:41.417503	\N	53	Produce	20000.00
418bee62-b24e-4252-9613-2210e6b02260	Condensed Milk	14.300	kg	5.000	2026-07-04 20:05:41.428692	\N	84	Dairy/Egg	30000.00
3dbb96b8-4aaa-451f-82e6-ac315fbf1c00	Evaporated Milk	12.800	kg	5.000	2026-07-04 20:05:41.429544	\N	57	Dairy/Egg	45000.00
0d100dd2-972d-4c7e-b637-80cd95e70287	Cheddar Cheese (Block)	3.500	kg	2.000	2026-07-04 20:05:41.411286	\N	41	Dairy/Egg	120000.00
c8af9f51-97a6-4e0a-a816-ad4e310a01a9	Ground Beef (Daging Giling)	6.200	kg	3.000	2026-07-04 20:05:41.405164	\N	17	Meat	128000.00
e205517d-01f8-4f17-8548-9396964037e9	Peeled Shrimp (Udang Kupas)	3.700	kg	2.000	2026-07-04 20:05:41.406205	\N	30	Seafood	120000.00
507a078f-824e-47d0-8854-bb3607be50d8	Tomatoes	1.600	kg	1.000	2026-07-04 20:05:41.416754	\N	54	Produce	15000.00
e76f9b56-5948-4a63-9199-d9d543249238	Fresh Lemons	1.400	kg	1.000	2026-07-04 20:05:41.42577	\N	24	Produce	30000.00
024d3875-5ba1-4f76-b473-05f7c963ebec	Fresh Oranges (Jeruk Peras)	3.800	kg	2.000	2026-07-04 20:05:41.42677	\N	28	Produce	20000.00
ee132261-ed39-4b4e-a189-c82e8ff64e97	Sweet Soy Sauce (Kecap Manis)	8.200	Liter	3.000	2026-07-04 20:05:41.415192	\N	57	Sauce/Condiment	30000.00
511a4fde-08d5-4251-a9bf-720b6b9f2ccf	Mayonnaise	5.400	kg	2.000	2026-07-04 20:05:41.412243	\N	55	Sauce/Condiment	30000.00
3bac67f1-4ec6-454c-acd4-da5fe784c159	Peanut Sauce Base (Kacang)	4.600	kg	2.000	2026-07-04 20:05:41.41596	\N	20	Sauce/Condiment	30000.00
8d98c2be-d8a0-4789-9d3d-dd73e645b7ee	Milo Powder	4.500	kg	2.000	2026-07-04 20:05:41.424204	\N	36	Beverage	80000.00
e0f7b7df-5bd8-4769-a1cd-1012aab6d997	Standard Black Tea	2.600	kg	1.000	2026-07-04 20:05:41.425004	\N	46	Beverage	50000.00
520e68bf-b834-457d-86b4-e9f621db1af7	Thai Green Tea Mix	2.800	kg	1.000	2026-07-04 20:05:41.423396	\N	19	Beverage	150000.00
ec97bf0c-0ef6-4304-a09b-7aa572377243	Thai Tea Mix (Leaves)	3.100	kg	1.000	2026-07-04 20:05:41.422623	\N	29	Beverage	150000.00
62595ef5-4977-48e7-9afe-cec2aceccce7	Instant Noodles (Indomie)	99.000	pcs	30.000	2026-07-04 20:05:41.407124	\N	37	Dry Goods	5000.00
7cbd611d-b847-43a8-bb14-f3946638e6ea	Burger Buns	48.000	pcs	24.000	2026-07-04 20:05:41.409649	\N	45	Bakery	5000.00
46ca4ee3-1d16-44ec-ae51-94b9e6aecfe1	Chicken Breast Fillet	3.650	kg	15.000	2026-07-04 20:05:41.403059	\N	77	Meat	65000.00
e0c35b54-eb79-4975-a28e-ff653451ce80	Onions (Bawang Bombay)	0.000	kg	2.000	2026-07-04 20:05:41.418336	\N	53	Produce	30000.00
31aae9df-a523-44e7-b3e4-95e3c53f189c	White Rice (Beras)	38.500	kg	10.000	2026-07-04 20:05:41.407999	\N	23	Dry Goods	15000.00
fa9cb6df-5f48-4d28-b9d8-f7e17e7b6b4c	Sugar	18.200	kg	5.000	2026-07-04 20:05:41.430436	\N	50	Dry Goods	17000.00
ccf28b51-7a2d-4131-9653-10f7e8fc2a8f	Salt	21.500	kg	5.000	2026-07-04 20:05:41.420136	\N	1	Dry Goods	10000.00
bc2b3e0c-dc31-442f-80f0-a3e591ca25bd	Chili Powder (Bubuk Cabai)	3.400	kg	1.000	2026-07-04 20:05:41.421799	\N	31	Dry Goods	80000.00
e3fbff25-d999-485c-9b04-a37a66f39bb7	Butter	4.100	kg	2.000	2026-07-04 20:05:41.413507	\N	23	Dairy/Egg	80000.00
e37651a4-2a60-46fd-b3c7-24087d1dd8eb	Garlic (Bawang Putih)	1.800	kg	1.000	2026-07-04 20:05:41.419118	\N	38	Produce	40000.00
4106c519-b2c2-4491-8fde-caa9cd29eee8	Pickles (Acar Timun)	2.400	kg	1.000	2026-07-04 20:05:41.421006	\N	15	Produce	11100.00
5ab68c4b-47bc-4030-bf4c-2d232e392def	Ketchup / Chili Sauce	6.700	Liter	2.000	2026-07-04 20:05:41.414365	\N	17	Sauce/Condiment	25000.00
a2f56a80-b42a-4a94-b239-b1e6e920e6d7	Tomato Paste	8.500	kg	2.000	2026-07-08 02:14:43.039701	\N	4	Uncategorized	5000.00
\.


--
-- Data for Name: item_modifier_groups; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.item_modifier_groups (id, menu_item_id, name, is_required, min_selections, max_selections) FROM stdin;
ae833b8d-7b01-47a1-bb8d-36461f382e35	d25c9bed-2282-465f-a2c7-8276b70d84d3	Heat Level	t	1	1
e6f65c45-28c1-4010-a029-446f5dcd5069	7737aeca-f083-435b-b6ea-2c7fe84a9446	Add-ons	f	0	2
72403b10-f230-410d-bda5-5cf14051f299	09d12952-1666-47c4-9426-72a9c037ea6b	Heat Level	t	1	1
7018e236-3198-4c94-8c66-5c6b6dabfc52	5aba7510-d851-4dbe-8f83-c1998ae0d45a	Sauce Type	t	1	1
f3c670d5-fa91-4da7-8b2d-8707cb47d72f	f075657c-1c80-49db-97dd-895f2568fdd0	Ice Level	t	1	1
20ab1564-7cc7-47dd-83d3-ac1cd7ae6235	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	Ice Level	t	1	1
033485ae-c82a-4cce-aa27-782330ae2be2	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	Ice Level	t	1	1
f6cb5f5e-bd4f-4452-be59-2d066056a296	319f823a-80e3-4cf4-88f9-0a83e67e52da	Ice Level	t	1	1
814dc397-acfa-4bd8-a436-e71bb875e4d8	c6f605e4-b32a-4362-9434-ebe486b5667e	Ice Level	t	1	1
d25ce4de-4617-4acf-88f5-bf287c8d449b	714a5a19-3113-4a73-8a43-d46baf2ec8e2	Ice Level	t	1	1
\.


--
-- Data for Name: item_modifiers; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.item_modifiers (id, group_id, name, price_adjustment) FROM stdin;
9cf9a7e4-8eb4-4213-b74c-f1db391d90e3	ae833b8d-7b01-47a1-bb8d-36461f382e35	Level 6	0
7f4bc3b8-3bcd-46b1-a01b-0888ea768652	ae833b8d-7b01-47a1-bb8d-36461f382e35	Level 8	0
c34183bc-6490-4f3a-a916-7a36584fae39	e6f65c45-28c1-4010-a029-446f5dcd5069	Extra Garlic Sauce	3000
05123849-2096-412d-b06c-368015b9b981	e6f65c45-28c1-4010-a029-446f5dcd5069	Extra Pickles	2000
80fdacd9-f8ad-4cb2-bfb1-1bdad9ca02c0	72403b10-f230-410d-bda5-5cf14051f299	Not Spicy	0
f147b55a-1ea0-4143-b726-fb61a7134b0f	72403b10-f230-410d-bda5-5cf14051f299	Medium	0
9ef43383-7367-4f13-be3f-47c121b47411	72403b10-f230-410d-bda5-5cf14051f299	Very Spicy	0
6cd3db54-c161-4007-a74f-73600c034d81	7018e236-3198-4c94-8c66-5c6b6dabfc52	Peanut Sauce	0
826ddb68-4325-4829-90f5-9d5ac43dad73	7018e236-3198-4c94-8c66-5c6b6dabfc52	Sweet Soy Sauce	0
4c9b45ee-16e1-49e5-93ef-1bf344ea99ad	f3c670d5-fa91-4da7-8b2d-8707cb47d72f	Normal Ice	0
c029bb83-434b-4e5f-9d1f-47e34aab4a02	f3c670d5-fa91-4da7-8b2d-8707cb47d72f	Less Ice	0
bb90e249-5f83-4274-933b-70efc553175d	f3c670d5-fa91-4da7-8b2d-8707cb47d72f	No Ice	0
ba200fa6-34e9-4065-9aa8-05dce61f65fb	20ab1564-7cc7-47dd-83d3-ac1cd7ae6235	Normal Ice	0
59cd3c69-79a8-45cc-b45c-3b1e6c91f2a4	20ab1564-7cc7-47dd-83d3-ac1cd7ae6235	Less Ice	0
080cf5c9-972d-4403-89e3-c5fa9148bc89	20ab1564-7cc7-47dd-83d3-ac1cd7ae6235	No Ice	0
0d7228b5-e578-4eeb-b7c9-8ec5b28b48da	033485ae-c82a-4cce-aa27-782330ae2be2	Normal Ice	0
89e90b4f-7763-4acd-a12d-7c9953232629	033485ae-c82a-4cce-aa27-782330ae2be2	Less Ice	0
adac8c9e-d7ed-407f-ab1c-bdb6c6b9457d	033485ae-c82a-4cce-aa27-782330ae2be2	No Ice	0
223120a6-a9da-446a-8292-38fab4ad6c06	f6cb5f5e-bd4f-4452-be59-2d066056a296	Normal Ice	0
08817d1f-dfb8-46fb-8e10-2795c2f56894	f6cb5f5e-bd4f-4452-be59-2d066056a296	Less Ice	0
2dd1113a-71bd-4eeb-9f75-7524f5b1a888	f6cb5f5e-bd4f-4452-be59-2d066056a296	No Ice	0
e594d5ef-00ce-4590-a4b2-13d465337b2e	814dc397-acfa-4bd8-a436-e71bb875e4d8	Normal Ice	0
b7a845d1-e9dd-4d0e-98eb-a25806a9e2c0	814dc397-acfa-4bd8-a436-e71bb875e4d8	Less Ice	0
29a3efc0-7f7d-4c94-9169-b221b5d7620e	814dc397-acfa-4bd8-a436-e71bb875e4d8	No Ice	0
d22eac3c-b101-4625-8b00-a0306d6549c9	d25ce4de-4617-4acf-88f5-bf287c8d449b	Normal Ice	0
4d4b0fd3-02b9-4bcb-bf08-63dfe63780e4	d25ce4de-4617-4acf-88f5-bf287c8d449b	Less Ice	0
4aa1892b-1d06-4907-850b-0eb44466afca	d25ce4de-4617-4acf-88f5-bf287c8d449b	No Ice	0
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.menu_items (id, name, price, category, image, is_active) FROM stdin;
d25c9bed-2282-465f-a2c7-8276b70d84d3	Spicy Indonesian Noodle	15000	Foods	\N	t
7737aeca-f083-435b-b6ea-2c7fe84a9446	Chicken Shawarma	25000	Foods	\N	t
5e1e5adc-6ea3-4431-8703-b47790a67940	Triple Whopper Jr with Cheese	45000	Foods	\N	t
09d12952-1666-47c4-9426-72a9c037ea6b	Nasi Goreng Spesial	20000	Foods	\N	t
5aba7510-d851-4dbe-8f83-c1998ae0d45a	Sate Ayam (10 pcs)	25000	Foods	\N	t
f075657c-1c80-49db-97dd-895f2568fdd0	Thai Tea	10000	Beverage	\N	t
5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	Thai Green Tea	12000	Beverage	\N	t
319f823a-80e3-4cf4-88f9-0a83e67e52da	Teh Tarik	10000	Beverage	\N	t
c6f605e4-b32a-4362-9434-ebe486b5667e	Es Jeruk	12000	Beverage	\N	t
714a5a19-3113-4a73-8a43-d46baf2ec8e2	Iced Lemon Tea	15000	Beverage	\N	t
089a4740-7bc6-497d-b97b-768c5cdbef20	Udang Keju	20000	Foods	\N	t
b4c11d3a-440c-4adc-9f58-bff6c6acd55f	Milo	10000	Beverage	\N	t
\.


--
-- Data for Name: modifier_recipes; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.modifier_recipes (id, modifier_id, ingredient_id, quantity) FROM stdin;
6387724d-c730-4dc5-a29b-d44907fd286a	9cf9a7e4-8eb4-4213-b74c-f1db391d90e3	bc2b3e0c-dc31-442f-80f0-a3e591ca25bd	0.002
fd38dbd4-5e94-452e-bf3d-20adeeb85c52	7f4bc3b8-3bcd-46b1-a01b-0888ea768652	bc2b3e0c-dc31-442f-80f0-a3e591ca25bd	0.005
f4f94b14-bc4e-43c5-8e21-24bf44e04e48	c34183bc-6490-4f3a-a916-7a36584fae39	511a4fde-08d5-4251-a9bf-720b6b9f2ccf	0.027
9a051f57-fb2a-471a-a223-4a05c162f369	c34183bc-6490-4f3a-a916-7a36584fae39	e37651a4-2a60-46fd-b3c7-24087d1dd8eb	0.003
0ca6f1bb-7b70-4f38-aabe-13aa793bab73	05123849-2096-412d-b06c-368015b9b981	4106c519-b2c2-4491-8fde-caa9cd29eee8	0.030
7a53ed77-60a9-45a4-a5ab-448e4caf1d5e	f147b55a-1ea0-4143-b726-fb61a7134b0f	bc2b3e0c-dc31-442f-80f0-a3e591ca25bd	0.002
507c90bf-ebe2-41b7-aeaf-0ab090e88431	9ef43383-7367-4f13-be3f-47c121b47411	bc2b3e0c-dc31-442f-80f0-a3e591ca25bd	0.005
4aeb4b5a-83e4-48cf-ae27-e0f881f5d1f0	6cd3db54-c161-4007-a74f-73600c034d81	3bac67f1-4ec6-454c-acd4-da5fe784c159	0.050
480e3078-008c-451a-ba85-cc6dc395bb08	826ddb68-4325-4829-90f5-9d5ac43dad73	ee132261-ed39-4b4e-a189-c82e8ff64e97	0.030
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.purchase_orders (id, supplier_id, ingredient_id, current_stock, reorder_point, suggested_quantity, date, status, notes, created_by_id, sent_by_id, cancelled_reason, actual_received_quantity) FROM stdin;
PO-2607-003	SUP-JKT-26102	7cbd611d-b847-43a8-bb14-f3946638e6ea	24.000	24.000	24.000	2026-07-13 12:30:44.212414	Received	Saved as draft	EMP-WHS-26103	EMP-MGR-26100	\N	24.000
PO-2607-004	SUP-JKT-26102	46ca4ee3-1d16-44ec-ae51-94b9e6aecfe1	3.650	15.000	26.350	2026-07-13 12:37:16.38407	Cancelled	Saved as draft	EMP-WHS-26103	EMP-MGR-26100	Drafted the wrong Item	\N
PO-2607-001	SUP-JKT-26102	7cbd611d-b847-43a8-bb14-f3946638e6ea	20.000	24.000	4.000	2026-07-11 22:59:57.115743	Received	Saved as draft	EMP-WHS-26103	EMP-MGR-26100	\N	4.000
PO-2607-002	SUP-JKT-26102	7cbd611d-b847-43a8-bb14-f3946638e6ea	3.000	24.000	21.000	2026-07-13 12:25:22.854827	Received	Saved as draft	EMP-WHS-26103	EMP-MGR-26100	\N	21.000
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.recipes (id, menu_item_id, ingredient_id, quantity) FROM stdin;
f226b2cb-a7e9-44c2-84ce-daa96b508636	089a4740-7bc6-497d-b97b-768c5cdbef20	e205517d-01f8-4f17-8548-9396964037e9	0.050
b0d53371-2a28-4518-914f-c34356006587	089a4740-7bc6-497d-b97b-768c5cdbef20	46ca4ee3-1d16-44ec-ae51-94b9e6aecfe1	0.050
7e56b645-475c-40f6-a845-6e6623d2de70	089a4740-7bc6-497d-b97b-768c5cdbef20	0d100dd2-972d-4c7e-b637-80cd95e70287	0.020
33e68b15-bf3d-4d28-a837-f05f17da797c	089a4740-7bc6-497d-b97b-768c5cdbef20	511a4fde-08d5-4251-a9bf-720b6b9f2ccf	0.010
38bc727c-e484-49f4-996b-42d1b68ca72d	d25c9bed-2282-465f-a2c7-8276b70d84d3	62595ef5-4977-48e7-9afe-cec2aceccce7	1.000
631c48e0-cadd-4773-9777-5f2bc05d8db5	d25c9bed-2282-465f-a2c7-8276b70d84d3	8cda5c89-7fbd-4596-ab49-a13d5bbec5e3	1.000
d486944f-8332-42d7-b9cb-e76c460a8d88	d25c9bed-2282-465f-a2c7-8276b70d84d3	ee132261-ed39-4b4e-a189-c82e8ff64e97	0.020
ba82cd9f-0a44-400b-bf7f-2d982b960c6a	d25c9bed-2282-465f-a2c7-8276b70d84d3	e37651a4-2a60-46fd-b3c7-24087d1dd8eb	0.010
4a9d715f-1bb4-4381-82ce-7e2ab3af2a16	7737aeca-f083-435b-b6ea-2c7fe84a9446	46ca4ee3-1d16-44ec-ae51-94b9e6aecfe1	0.150
0cb021db-a72b-4f08-ace7-45d692c83b9b	7737aeca-f083-435b-b6ea-2c7fe84a9446	e443b717-46ee-47b4-8a3e-574600849a88	1.000
dc20bf9c-5c93-443e-bd11-0ca57007769a	7737aeca-f083-435b-b6ea-2c7fe84a9446	4b77e0a3-b56b-4352-a66a-b08267215538	0.020
09fd2d75-7b3a-4d62-8c4a-6e018715a1ee	7737aeca-f083-435b-b6ea-2c7fe84a9446	507a078f-824e-47d0-8854-bb3607be50d8	0.020
b321d830-8d72-49f5-8672-8211185527f1	7737aeca-f083-435b-b6ea-2c7fe84a9446	511a4fde-08d5-4251-a9bf-720b6b9f2ccf	0.020
af0c1ace-add7-4454-afbb-7a2e4f394da5	5e1e5adc-6ea3-4431-8703-b47790a67940	7cbd611d-b847-43a8-bb14-f3946638e6ea	1.000
5bdcfcbd-0852-46af-b3c7-2099230216f2	5e1e5adc-6ea3-4431-8703-b47790a67940	c8af9f51-97a6-4e0a-a816-ad4e310a01a9	0.150
a70769b9-0c93-4395-b73e-8d6cb9a05458	5e1e5adc-6ea3-4431-8703-b47790a67940	0d100dd2-972d-4c7e-b637-80cd95e70287	0.020
a1b2d939-aaad-49ee-bc9d-b59e806204a9	5e1e5adc-6ea3-4431-8703-b47790a67940	4b77e0a3-b56b-4352-a66a-b08267215538	0.020
7e58836c-4ab3-4ee0-8496-b2247ddbd70c	5e1e5adc-6ea3-4431-8703-b47790a67940	507a078f-824e-47d0-8854-bb3607be50d8	0.020
ad9de245-6a0c-4932-b210-336cec981f4a	5e1e5adc-6ea3-4431-8703-b47790a67940	5ab68c4b-47bc-4030-bf4c-2d232e392def	0.020
bfaa5ca0-455d-45b0-b451-7430f07f1470	09d12952-1666-47c4-9426-72a9c037ea6b	31aae9df-a523-44e7-b3e4-95e3c53f189c	0.200
8d5db1eb-c894-4dc9-90ff-92733d40ebdc	09d12952-1666-47c4-9426-72a9c037ea6b	46ca4ee3-1d16-44ec-ae51-94b9e6aecfe1	0.080
77e32e6d-9a8b-402a-8091-fd08acd9355a	09d12952-1666-47c4-9426-72a9c037ea6b	8cda5c89-7fbd-4596-ab49-a13d5bbec5e3	1.000
f40de44d-8f3c-498f-88f8-94bb810bcf8a	09d12952-1666-47c4-9426-72a9c037ea6b	ee132261-ed39-4b4e-a189-c82e8ff64e97	0.030
0d15c8f0-a5d9-417e-b2c7-2a92fccbfebf	09d12952-1666-47c4-9426-72a9c037ea6b	e0c35b54-eb79-4975-a28e-ff653451ce80	0.020
bbe50047-1eae-456d-ac67-bf673c946040	09d12952-1666-47c4-9426-72a9c037ea6b	e3fbff25-d999-485c-9b04-a37a66f39bb7	0.010
adb020a8-eb53-444d-9dfd-6db993ddaeb1	5aba7510-d851-4dbe-8f83-c1998ae0d45a	46ca4ee3-1d16-44ec-ae51-94b9e6aecfe1	0.200
cc611b44-ffcd-44cb-a4c2-2e6cd3e6ba18	5aba7510-d851-4dbe-8f83-c1998ae0d45a	e0c35b54-eb79-4975-a28e-ff653451ce80	0.020
04597b81-58e6-49af-b087-6ab6cdd559af	f075657c-1c80-49db-97dd-895f2568fdd0	ec97bf0c-0ef6-4304-a09b-7aa572377243	0.020
a1d39935-a734-4eb6-88df-1e7a0b2d33b5	f075657c-1c80-49db-97dd-895f2568fdd0	3dbb96b8-4aaa-451f-82e6-ac315fbf1c00	0.050
65fe0c2d-057b-41d1-bdb6-4381233b6259	f075657c-1c80-49db-97dd-895f2568fdd0	418bee62-b24e-4252-9613-2210e6b02260	0.030
0732d7ae-e6fc-431d-9a9d-e129d35b6db2	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	520e68bf-b834-457d-86b4-e9f621db1af7	0.020
043a9999-75cc-4258-a686-d05992259ed7	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	3dbb96b8-4aaa-451f-82e6-ac315fbf1c00	0.050
726507ec-56c0-4f5c-aab9-398090ca6101	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	418bee62-b24e-4252-9613-2210e6b02260	0.030
0d248a6e-717f-4098-8956-096ec67f6c8f	319f823a-80e3-4cf4-88f9-0a83e67e52da	e0f7b7df-5bd8-4769-a1cd-1012aab6d997	0.010
48763d20-61b8-4eae-84d1-b88f913c8479	319f823a-80e3-4cf4-88f9-0a83e67e52da	418bee62-b24e-4252-9613-2210e6b02260	0.040
84348b9f-fbcd-4167-9c9e-d0e93b57f142	319f823a-80e3-4cf4-88f9-0a83e67e52da	3dbb96b8-4aaa-451f-82e6-ac315fbf1c00	0.020
214e943c-d56a-4079-bd1a-c974bb02e2fb	c6f605e4-b32a-4362-9434-ebe486b5667e	024d3875-5ba1-4f76-b473-05f7c963ebec	0.200
3f02733b-d906-48aa-8e9e-1f9e0e7f05ab	c6f605e4-b32a-4362-9434-ebe486b5667e	fa9cb6df-5f48-4d28-b9d8-f7e17e7b6b4c	0.020
c1bfb267-5c7a-4ca9-9944-e58d0b2f1518	714a5a19-3113-4a73-8a43-d46baf2ec8e2	e0f7b7df-5bd8-4769-a1cd-1012aab6d997	0.010
9bbb8351-1296-4398-91eb-b51101fe8cd2	714a5a19-3113-4a73-8a43-d46baf2ec8e2	e76f9b56-5948-4a63-9199-d9d543249238	0.050
531cce8d-7677-433a-bc04-10eec71ee150	714a5a19-3113-4a73-8a43-d46baf2ec8e2	fa9cb6df-5f48-4d28-b9d8-f7e17e7b6b4c	0.020
2e2c9570-f815-4b2e-934a-fdde14d3dc27	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	8d98c2be-d8a0-4789-9d3d-dd73e645b7ee	0.040
0f95f0d7-d6db-4691-b39f-6322e7a26f47	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	02777011-f9d9-4459-8328-b43400cb5baf	0.100
39cf62a7-8f09-4d3f-be07-497ad99422d2	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	418bee62-b24e-4252-9613-2210e6b02260	0.020
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.shifts (id, cashier_id, start_time, end_time, total_transactions, total_revenue) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.suppliers (id, name, specialization, phone, email, address, contact_person, is_active, region) FROM stdin;
SUP-BDO-26100	Bandung Dairy Co.	dairy & milk	+62 22 1234-5678	siti@bandungdairy.com	Jl. Braga No. 10	Siti Aminah	t	BDO
SUP-DPS-26101	Bali Organic Farms	fresh vegetables & fruits	+62 819-1122-3344	wayan@baliorganic.com	Jl. Raya Ubud	Wayan Koster	t	DPS
SUP-NAT-26103	Indofood Sukses Makmur	dry goods & staples	+62 21 8765-4321	rina@indofood.com	Sudirman Plaza	Rina Melati	t	NAT
SUP-SBY-26104	Surabaya Meat Packers Int.	poultry & meat	+62 813-9876-5432	agus@sby-meat.com	Jl. Pemuda No. 5	Agus Wijaya	t	SBY
SUP-JKT-26102	Jakarta Central Provisions	fresh produce	+62 812-3456-7890	budi@jktprovisions.com	Jl. Sudirman No. 1	Budi Santoso	t	JKT
\.


--
-- Data for Name: transaction_item_modifiers; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.transaction_item_modifiers (id, transaction_item_id, modifier_id, price_at_time, cogs_per_unit) FROM stdin;
b8b21aee-d27a-4ece-b6e5-c783a98b3a93	fce73f33-7384-4cc1-8254-df8f7845c9be	7f4bc3b8-3bcd-46b1-a01b-0888ea768652	0	400
2f3f55ae-0413-449d-a29b-99f7737c0e03	6a163d33-1b1a-403e-846a-7e2179250b4d	adac8c9e-d7ed-407f-ab1c-bdb6c6b9457d	0	0
7723bb43-a3d7-442a-89fd-b04f7dc015f7	ac86cb92-68b7-40e3-bbe8-174530fed6c2	d22eac3c-b101-4625-8b00-a0306d6549c9	0	0
8838136a-bebf-4f83-a7c8-c526ab4a9852	3b674dd7-a5d5-4815-b7fd-c1dee94b7483	223120a6-a9da-446a-8292-38fab4ad6c06	0	0
548a420e-a411-4c55-9797-97d71fbcbf63	2262722c-9902-4a51-b30b-f5981ddef634	6cd3db54-c161-4007-a74f-73600c034d81	0	1500
ee217fe6-90a1-48b4-aa9e-d8444e466976	3c746493-39fb-466a-bd2b-786a94c1c859	4aa1892b-1d06-4907-850b-0eb44466afca	0	0
63b73603-914c-4dbc-ab3c-6bb82942c50f	c4e8f1e0-1138-47da-a7a8-50f25a2307b9	bb90e249-5f83-4274-933b-70efc553175d	0	0
6e935d74-56db-4449-b036-83f5373df91b	3a256cc1-1490-4239-bdc5-ba54d0133641	826ddb68-4325-4829-90f5-9d5ac43dad73	0	900
f7d1458c-8ea3-482b-b3ad-3d50de56c694	96e852e7-8d2a-43f0-a561-ed7bba8bf0a4	05123849-2096-412d-b06c-368015b9b981	2000	333
eefa79bb-f874-4f87-90f2-a6542c690558	4a4cfbbd-4879-4318-954c-255eca21224e	223120a6-a9da-446a-8292-38fab4ad6c06	0	0
3d30580b-0705-427e-bbdf-c4b05ebf2a8b	d2d4b550-f8bf-4a57-95ad-a664f467fd4d	ba200fa6-34e9-4065-9aa8-05dce61f65fb	0	0
2898e15d-a8a7-4cbf-82a6-8f8617330cc6	6cacab0e-b877-4caf-9834-6e56fe483a04	4d4b0fd3-02b9-4bcb-bf08-63dfe63780e4	0	0
80080c9a-6db1-447e-8fc4-cb8852fc2762	6f3fa489-0a2f-4596-96cb-bfbdc5227a85	59cd3c69-79a8-45cc-b45c-3b1e6c91f2a4	0	0
fe192d56-3b51-4ab8-a7f9-7f041d20583e	71917f08-266f-452f-805f-c2469510a648	9cf9a7e4-8eb4-4213-b74c-f1db391d90e3	0	160
500cdef5-6130-44f8-9d2f-fa3e6664bc71	03dd3d74-cad1-421e-9995-2c3b63d9bada	c34183bc-6490-4f3a-a916-7a36584fae39	3000	930
55ce74d9-b714-47fb-b8df-991c684a4cd5	8c6975bd-804f-4b88-aeab-5f209613ef6c	adac8c9e-d7ed-407f-ab1c-bdb6c6b9457d	0	0
26f9013a-cda5-4e5b-bd03-4c67b230ba67	177530a8-8dd9-475b-9960-d6827be7ff66	826ddb68-4325-4829-90f5-9d5ac43dad73	0	900
3fbfe56b-7be8-488a-8a17-bc57871604b2	d9c04ba7-eb45-4aeb-9c2c-f7c02a6d8723	c34183bc-6490-4f3a-a916-7a36584fae39	3000	930
2f44f83c-48dd-4a3e-abdc-1de631d0df48	a59c9709-89dd-41ad-8f41-cdac699e6f2a	89e90b4f-7763-4acd-a12d-7c9953232629	0	0
4c674a4f-2aa9-4fb0-a52e-fa952930b15c	6ed6fb72-58e1-4a04-ba65-9166faf13a51	b7a845d1-e9dd-4d0e-98eb-a25806a9e2c0	0	0
3db48e99-ad14-4324-a464-7d8cf9b0fbf4	2f79ba60-c13c-472e-931b-86c3f5393258	80fdacd9-f8ad-4cb2-bfb1-1bdad9ca02c0	0	0
27f2f423-9dd6-4825-bb35-d860c6db3253	04ace044-58ae-4477-bfe3-2611738ef0b1	f147b55a-1ea0-4143-b726-fb61a7134b0f	0	160
4f0e62c3-c757-42ff-8cc6-f0c525e3bc69	1e749c66-4bb9-4197-997e-3695b2fe74b9	c029bb83-434b-4e5f-9d1f-47e34aab4a02	0	0
3cf6b9c2-c1db-4e00-8d2f-9fc216ed095a	7a9a1a7f-be51-4cf9-b05c-daf315935d2e	7f4bc3b8-3bcd-46b1-a01b-0888ea768652	0	400
50c6160d-37fe-4cff-a53e-01567ed867aa	5954a624-e69b-48ed-b22a-09e2170b33ea	9ef43383-7367-4f13-be3f-47c121b47411	0	400
a6800c27-5a63-459a-b1a9-b20eb6dcb130	ea4dfdd7-77ab-4ae7-b331-7c5ffb68a880	7f4bc3b8-3bcd-46b1-a01b-0888ea768652	0	400
e0d373cb-414b-4959-959b-0b73ff1e7e98	c8c8daf3-4715-49af-9608-070f591b0d04	e594d5ef-00ce-4590-a4b2-13d465337b2e	0	0
94e12ee4-342a-4b34-89b0-e034d7114000	fb8f49d3-3bc0-41cd-b014-a515686fa847	29a3efc0-7f7d-4c94-9169-b221b5d7620e	0	0
4f49106d-c326-4aa2-a3b0-811308158183	679c8e27-e40f-4f1e-bdb5-c2c75dd7ec33	89e90b4f-7763-4acd-a12d-7c9953232629	0	0
97ee18ab-1ca2-4470-9c79-dec8226eb1f8	ddcd8dc5-fb13-4b67-b423-e40d67c9f0f2	e594d5ef-00ce-4590-a4b2-13d465337b2e	0	0
13fba045-7a01-41ec-ba68-e2b19a66b4a1	aaa67525-361a-49eb-b8ba-d3176844b31f	89e90b4f-7763-4acd-a12d-7c9953232629	0	0
9fd52360-a6a6-4b5c-9ccd-4b7d4e5556e3	726f1858-5d70-4e8c-bc8d-97ee667a84c3	c34183bc-6490-4f3a-a916-7a36584fae39	3000	930
018c433b-b1e3-4ad3-bc78-8251ee69bcbb	f83233d1-6f1f-4743-b886-b8612902f49f	4d4b0fd3-02b9-4bcb-bf08-63dfe63780e4	0	0
049db28c-704c-4613-904f-d28833455bc8	c22e33e0-18eb-48f8-947b-21c5f5481516	4d4b0fd3-02b9-4bcb-bf08-63dfe63780e4	0	0
ceea4ffe-4698-4cc9-b5b8-5cfa7f015411	9bcfb6d1-f33b-461c-8ed3-bc23f1b2ad78	6cd3db54-c161-4007-a74f-73600c034d81	0	1500
05224b6b-4d26-4837-b656-a284e25dc219	59bcb7c6-8524-49dc-8f6e-af22347a414b	7f4bc3b8-3bcd-46b1-a01b-0888ea768652	0	400
b1a51c93-2b3d-41d3-a42e-fd9e13fa207c	fcdf97a6-aa82-471d-aea0-ce04c75e647b	05123849-2096-412d-b06c-368015b9b981	2000	333
26204a42-02e1-4f14-8861-73be68d5aa22	3ccdfaf3-0c35-43e4-b0cb-de3298a6b135	c029bb83-434b-4e5f-9d1f-47e34aab4a02	0	0
6017a2cb-e6a2-44e9-8e39-86cc1825add3	a6757c4f-1615-4df3-ae23-d285fd651c7f	6cd3db54-c161-4007-a74f-73600c034d81	0	1500
812c123e-1478-47f3-ab25-e01d48df8aec	1951e277-cbda-48f9-a7a0-230ea1699eb3	adac8c9e-d7ed-407f-ab1c-bdb6c6b9457d	0	0
2c7d3863-89bc-4dce-aded-47ef4153e1e2	8b80454e-9d0b-42ac-9c6d-03ad1593bf47	80fdacd9-f8ad-4cb2-bfb1-1bdad9ca02c0	0	0
dce7402e-776b-4414-9b8c-08adfea5bfd0	35f704e5-aad1-4aba-be4c-9495aa373036	0d7228b5-e578-4eeb-b7c9-8ec5b28b48da	0	0
e130e2a6-a608-48f7-a4b9-2007ffe205c2	9f24c867-0711-4326-b308-5379571e7a71	ba200fa6-34e9-4065-9aa8-05dce61f65fb	0	0
8b113b12-9f86-44fe-9239-76165888dcce	1984de12-aa2c-4c21-b8df-804c5510cf30	4d4b0fd3-02b9-4bcb-bf08-63dfe63780e4	0	0
7f8bfd4e-e925-4a61-95f4-17b55682a948	1463989f-fdf1-47a7-929b-8f2343988f50	2dd1113a-71bd-4eeb-9f75-7524f5b1a888	0	0
96b71afd-32d3-4d01-a3fb-cf2576c447d2	d4c12431-ed5c-42f0-a394-1ea0bda89e76	9cf9a7e4-8eb4-4213-b74c-f1db391d90e3	0	160
a35173a9-ebad-4bc0-b0aa-24a83640109c	56a2c1ec-d3b4-41fe-b5f1-42fe07c5db6c	4c9b45ee-16e1-49e5-93ef-1bf344ea99ad	0	0
0d74ba31-f155-4b54-bec1-00d8fb9e296f	a4f2225d-e7e6-417a-b6e3-a6bf5158501f	08817d1f-dfb8-46fb-8e10-2795c2f56894	0	0
169b8558-1693-47a1-9423-43fdafe57f11	2cea986d-bd7e-4a40-9ea7-2975b5087748	826ddb68-4325-4829-90f5-9d5ac43dad73	0	900
add54829-1447-4815-bc95-abc767da0eee	e6d98d3a-117e-4053-b3cf-ef0de3c517d2	4c9b45ee-16e1-49e5-93ef-1bf344ea99ad	0	0
8120e366-5a25-4b1d-9846-68519891d465	1ec98c48-6865-43d6-877e-6e68e1915487	ba200fa6-34e9-4065-9aa8-05dce61f65fb	0	0
7186e303-84ad-4849-9025-362e18a29a1c	9fd75cb9-9b70-4361-a92c-2f1133adfc37	89e90b4f-7763-4acd-a12d-7c9953232629	0	0
c2e3e39a-0a0e-465c-b2c0-d26fb8ad19b6	6e7ba02f-90a8-485c-9452-a92eaaf2549a	d22eac3c-b101-4625-8b00-a0306d6549c9	0	0
60a44134-a579-4426-93ed-776b13096276	631ede9e-f5ab-4057-9f5a-785d1885a693	80fdacd9-f8ad-4cb2-bfb1-1bdad9ca02c0	0	0
0364d52a-6759-4187-9604-cff996ceda48	2f7b474b-26e0-43c2-a955-f588049bca5a	89e90b4f-7763-4acd-a12d-7c9953232629	0	0
8f1e6237-11f6-49bf-a88b-aa9c0ba40c76	7e903f6f-573d-40de-95ed-c38791edc91e	9cf9a7e4-8eb4-4213-b74c-f1db391d90e3	0	160
0127a664-0e6d-4e1e-8481-92a4e4179dd6	bf53c3b5-20c5-441a-af39-3e6749e0a4a9	2dd1113a-71bd-4eeb-9f75-7524f5b1a888	0	0
a217f545-cd9e-47a4-a675-2faf9b733a93	f23727cb-bf4a-4a5f-8f81-0b4e39c91b6f	9ef43383-7367-4f13-be3f-47c121b47411	0	400
76183e48-e6dc-4330-8f50-56c9b9d5c743	f6c87cc5-8cdd-4255-b061-b51309ff61ac	05123849-2096-412d-b06c-368015b9b981	2000	333
9f4c7929-1864-468e-9253-780c9635d3b1	5c0e6ef5-8864-4dc1-881a-bfbd4f180435	59cd3c69-79a8-45cc-b45c-3b1e6c91f2a4	0	0
0587aa64-d3d6-452e-b6fc-5dbe9025219d	10498273-6ab2-42b3-9a63-5a519350b90a	6cd3db54-c161-4007-a74f-73600c034d81	0	1500
bea58280-1cf6-45cd-b60a-9f6baf94748e	c9854fa1-7550-4ea7-a6a8-87f04fd52b27	f147b55a-1ea0-4143-b726-fb61a7134b0f	0	160
f83a8f35-9b7b-4e8f-b96f-f0a05746cea8	d4165731-b17c-44f5-bac3-5d006b576fbf	4aa1892b-1d06-4907-850b-0eb44466afca	0	0
37106c2f-cf7a-44ee-8453-3597ef9d106c	06f466bc-7d45-4a24-9a3b-f739b0b04708	e594d5ef-00ce-4590-a4b2-13d465337b2e	0	0
01f70ea4-df10-4fbd-9233-70574d66b064	11fcec4e-4029-4fbe-9c1e-ca87555ab5ba	7f4bc3b8-3bcd-46b1-a01b-0888ea768652	0	400
77b078b0-1584-4a48-b203-a11c256485e9	b2fa22f8-af81-4b2d-b418-0ff367e7502f	89e90b4f-7763-4acd-a12d-7c9953232629	0	0
48ee1389-6027-4331-8600-71092ee8d7a5	76a87b59-36ff-41a7-8eb9-485dcab0375e	bb90e249-5f83-4274-933b-70efc553175d	0	0
24dc399e-f465-4065-8294-a0e5e5de5c99	cf3330ac-d462-431a-8f33-02a4fc89be40	4aa1892b-1d06-4907-850b-0eb44466afca	0	0
39477cad-be6f-44c3-a9f4-d89568b9a3bf	364ebec8-1aea-4d4a-ba2f-2e3f52efd637	4c9b45ee-16e1-49e5-93ef-1bf344ea99ad	0	0
48ec1866-319e-4550-aec8-282aeb864b61	b29be337-6e10-4eec-b31a-05100754c1d1	6cd3db54-c161-4007-a74f-73600c034d81	0	1500
def75478-857e-402d-a00d-a86fbe2d7f71	e69fff80-6da0-4d77-8344-feb0ef16fb6c	bb90e249-5f83-4274-933b-70efc553175d	0	0
73d952e1-7b18-41c7-b38d-85da9e2a7fdd	dd5c731d-9654-461e-8d53-08cc9af04924	89e90b4f-7763-4acd-a12d-7c9953232629	0	0
80071f59-f21b-4e8e-aa54-70db18938989	8cc9d21b-7496-4dbb-aadf-261c8aaf1d43	c34183bc-6490-4f3a-a916-7a36584fae39	3000	930
b9be9187-139a-4fb3-98c9-be3484d8c1bc	7714b38f-a5f3-4d9e-9d9a-652b1ebc0a2a	c34183bc-6490-4f3a-a916-7a36584fae39	3000	930
18876fc0-4364-45f9-90a0-d442be7c9940	dc7152ad-5446-4253-ad7f-c9f676ccb646	b7a845d1-e9dd-4d0e-98eb-a25806a9e2c0	0	0
4aab84f1-66e3-47f6-ab0f-7de56cc406dc	cd21b2bb-53d7-4ce4-8281-b780a9ed38ae	05123849-2096-412d-b06c-368015b9b981	2000	333
9228c437-4d0d-4c67-9543-3e9d194c359f	78fbe09c-c3d7-4693-a719-95cd3c286a5b	08817d1f-dfb8-46fb-8e10-2795c2f56894	0	0
42ad0156-a2af-4a56-9260-33866001bd8d	98dc2349-a731-475d-ac97-c42d2edb9ec4	b7a845d1-e9dd-4d0e-98eb-a25806a9e2c0	0	0
d4e1bd6d-0133-4cdc-83c7-db1309fada1c	828d41f9-a8cb-47c2-9b47-0b0fc913772e	2dd1113a-71bd-4eeb-9f75-7524f5b1a888	0	0
aaf3edaf-0c7d-487e-b126-435d7f21aa98	c22795cd-2632-4635-b02f-eb653d663669	59cd3c69-79a8-45cc-b45c-3b1e6c91f2a4	0	0
2c9dfc65-d56b-47fb-bd83-50b3c44acab3	e0b80373-d130-4bdc-b7c7-1100a2b5124d	080cf5c9-972d-4403-89e3-c5fa9148bc89	0	0
ecdac72b-c7d0-4b20-b2c0-d0171353290b	23bd828c-9214-450a-a745-08459ff366ac	b7a845d1-e9dd-4d0e-98eb-a25806a9e2c0	0	0
264eae2f-bd50-497b-b8b1-7dd85ddbaf72	3f55c4a7-58a6-4bf8-9fc4-d10130ae04b2	05123849-2096-412d-b06c-368015b9b981	2000	333
785bdad2-78be-415f-bfda-297c1655f3eb	1ab5cc21-2c62-4e43-8e3c-cbf9a45332ff	80fdacd9-f8ad-4cb2-bfb1-1bdad9ca02c0	0	0
0f2e6c1d-3265-4850-a439-1999a397b136	8fae7219-df76-4ba7-ba81-7487ff7cdb7b	826ddb68-4325-4829-90f5-9d5ac43dad73	0	900
1e17543c-13e7-4241-aa42-91c6cd1c69ee	38042047-b68a-4783-bbc7-21fa7bc70b0a	bb90e249-5f83-4274-933b-70efc553175d	0	0
795098d0-979e-4c0d-a333-093da4d5eab2	8e4190b8-cfa8-4b55-a17d-555c7678ccfe	08817d1f-dfb8-46fb-8e10-2795c2f56894	0	0
c9ef3834-b3d9-4fc2-ab3c-1fa8c0cbffcb	c0a75202-92b5-4a54-8758-fc827914c217	c34183bc-6490-4f3a-a916-7a36584fae39	3000	930
a5cb19c7-f783-4a04-896b-cb0035a76958	3225d944-69dc-4802-905a-d4c16277656b	80fdacd9-f8ad-4cb2-bfb1-1bdad9ca02c0	0	0
1268a3af-15b7-4ab9-bc9b-e23284c2caed	a8b5c27e-292e-442d-9ab3-40384617dc26	6cd3db54-c161-4007-a74f-73600c034d81	0	1500
27a413cc-7073-41e2-bd11-28d09513e823	3bb3d893-c2d3-4b14-8688-b872cd91f4ec	05123849-2096-412d-b06c-368015b9b981	2000	333
03703417-47e5-4dbf-ab47-d11efd617967	6bfbfcbe-f7c4-48af-a144-26896f14ca90	9cf9a7e4-8eb4-4213-b74c-f1db391d90e3	0	160
faf8cbcb-6953-4240-aade-a98dafef01c9	323e4363-f191-4e9a-b4fe-3513ce6b6c79	b7a845d1-e9dd-4d0e-98eb-a25806a9e2c0	0	0
af8b7388-0868-4da2-87b6-645058640a84	9b88511c-c06f-4f78-a5bb-cf6cb9d475d7	6cd3db54-c161-4007-a74f-73600c034d81	0	1500
432b4316-fb5a-42e9-8c41-e86dcfef8b32	6e3aada8-4ed6-4591-b991-7dde13a03d81	08817d1f-dfb8-46fb-8e10-2795c2f56894	0	0
06c1e43d-e7d7-48c3-ba22-98c0fb6dde36	551e475a-de17-48d9-8d76-dd1374de34c1	bb90e249-5f83-4274-933b-70efc553175d	0	0
74ef7960-740b-4ad3-8d7c-85f55f4ebb97	f7d27910-3f87-4830-aaea-74c52672755f	826ddb68-4325-4829-90f5-9d5ac43dad73	0	900
e5382e24-e837-4113-bc39-0dfeb990f1ba	f7ae9644-9d4a-4d3c-8282-154c847a4263	adac8c9e-d7ed-407f-ab1c-bdb6c6b9457d	0	0
164c7b8d-3321-49e5-b927-330b0812fd58	b10439ea-9893-40bf-946b-808dd16513e2	e594d5ef-00ce-4590-a4b2-13d465337b2e	0	0
1c45945f-77f4-4bf3-a2cb-6126fcbcbd95	e17360aa-21bb-4a88-852c-7550cdad1b69	adac8c9e-d7ed-407f-ab1c-bdb6c6b9457d	0	0
dc1dd994-f9c0-4c88-990c-544cb6cdec65	e2545132-68e6-4b09-a95e-d59fae557801	826ddb68-4325-4829-90f5-9d5ac43dad73	0	900
84992750-0f6d-4832-8c85-1eccef8cfd32	cb2f12fb-4cc3-4b32-93a7-29feac9fc923	c029bb83-434b-4e5f-9d1f-47e34aab4a02	0	0
f87d7d75-db19-479d-912d-e16e8973deb4	e4719f8d-8075-4229-a07c-2105d47be7d4	e594d5ef-00ce-4590-a4b2-13d465337b2e	0	0
1580d31a-b001-4d48-9b87-ba37d2338179	bc9469a2-d544-4745-9140-4680e16196ba	c029bb83-434b-4e5f-9d1f-47e34aab4a02	0	0
66a9c164-89bf-481f-9c33-3cf765d3a572	8635f01c-ca74-4f0f-8f5f-037ce6c84802	29a3efc0-7f7d-4c94-9169-b221b5d7620e	0	0
ab62c1cf-a97a-41c8-a91c-6667866a8a95	19656fb4-dfda-4dda-af42-52d7486782c0	89e90b4f-7763-4acd-a12d-7c9953232629	0	0
232fa03e-e2df-47a4-8f39-2204d26ae39b	3fb39b37-86a2-4d5b-b350-1cd2732af81b	c34183bc-6490-4f3a-a916-7a36584fae39	3000	930
\.


--
-- Data for Name: transaction_items; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.transaction_items (id, transaction_id, menu_item_id, quantity, notes, price_at_time, cogs_per_unit) FROM stdin;
fce73f33-7384-4cc1-8254-df8f7845c9be	8887a300-7df7-4d51-9bd3-96507494064a	d25c9bed-2282-465f-a2c7-8276b70d84d3	3		15000	6000
6a163d33-1b1a-403e-846a-7e2179250b4d	009c4190-c070-4c4f-806c-2cca3fae4ff2	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	3		10000	5800
ac86cb92-68b7-40e3-bbe8-174530fed6c2	009c4190-c070-4c4f-806c-2cca3fae4ff2	714a5a19-3113-4a73-8a43-d46baf2ec8e2	2		15000	2340
1be92126-e897-43a2-a19d-4eb361e1efe2	0bcf8496-298a-478d-b13b-3ab595dba294	089a4740-7bc6-497d-b97b-768c5cdbef20	2		20000	11950
125ef437-0b12-4c6d-a2e7-95edf70ac4eb	8af66600-7fd8-44d5-87c0-9171272909a0	7737aeca-f083-435b-b6ea-2c7fe84a9446	3		25000	13550
3b674dd7-a5d5-4815-b7fd-c1dee94b7483	8af66600-7fd8-44d5-87c0-9171272909a0	319f823a-80e3-4cf4-88f9-0a83e67e52da	3		10000	2600
2262722c-9902-4a51-b30b-f5981ddef634	8af66600-7fd8-44d5-87c0-9171272909a0	5aba7510-d851-4dbe-8f83-c1998ae0d45a	1		25000	13600
056bb2e8-4d2f-4229-9e4e-c9ab7736f29f	8af66600-7fd8-44d5-87c0-9171272909a0	089a4740-7bc6-497d-b97b-768c5cdbef20	2		20000	11950
6343e8cd-3031-41c5-bea5-15a75ab6596a	2b3a7672-36c5-4889-8c12-c22297861d8b	5e1e5adc-6ea3-4431-8703-b47790a67940	1		45000	25800
50d7b647-bb6a-47d9-b8ae-00c978312d3e	2b3a7672-36c5-4889-8c12-c22297861d8b	089a4740-7bc6-497d-b97b-768c5cdbef20	3		20000	11950
3c746493-39fb-466a-bd2b-786a94c1c859	2b3a7672-36c5-4889-8c12-c22297861d8b	714a5a19-3113-4a73-8a43-d46baf2ec8e2	2		15000	2340
c4e8f1e0-1138-47da-a7a8-50f25a2307b9	b5b3b243-6daf-4ef3-9988-9859384b8d27	f075657c-1c80-49db-97dd-895f2568fdd0	1		10000	6150
3a256cc1-1490-4239-bdc5-ba54d0133641	b5b3b243-6daf-4ef3-9988-9859384b8d27	5aba7510-d851-4dbe-8f83-c1998ae0d45a	3		25000	13600
96e852e7-8d2a-43f0-a561-ed7bba8bf0a4	b5b3b243-6daf-4ef3-9988-9859384b8d27	7737aeca-f083-435b-b6ea-2c7fe84a9446	1		25000	13550
4a4cfbbd-4879-4318-954c-255eca21224e	a6018067-4044-4815-bd6c-aafbb8eb737e	319f823a-80e3-4cf4-88f9-0a83e67e52da	1		10000	2600
d2d4b550-f8bf-4a57-95ad-a664f467fd4d	a6018067-4044-4815-bd6c-aafbb8eb737e	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	1		12000	6150
6cacab0e-b877-4caf-9834-6e56fe483a04	8ad9abb1-82da-413e-8f8a-4967c5773bc4	714a5a19-3113-4a73-8a43-d46baf2ec8e2	2		15000	2340
f8a80900-ca9c-4d64-ada6-4d2adff08d9e	8ad9abb1-82da-413e-8f8a-4967c5773bc4	089a4740-7bc6-497d-b97b-768c5cdbef20	1		20000	11950
892b5ebb-41b0-44ae-a9f4-498f1074cd1b	8ad9abb1-82da-413e-8f8a-4967c5773bc4	7737aeca-f083-435b-b6ea-2c7fe84a9446	2		25000	13550
6f3fa489-0a2f-4596-96cb-bfbdc5227a85	83b59399-7148-4b62-a4b3-54972ad7c2cc	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	2		12000	6150
71917f08-266f-452f-805f-c2469510a648	83b59399-7148-4b62-a4b3-54972ad7c2cc	d25c9bed-2282-465f-a2c7-8276b70d84d3	1		15000	6000
03dd3d74-cad1-421e-9995-2c3b63d9bada	83b59399-7148-4b62-a4b3-54972ad7c2cc	7737aeca-f083-435b-b6ea-2c7fe84a9446	1		25000	13550
8c6975bd-804f-4b88-aeab-5f209613ef6c	32104356-11b3-4e88-b401-7530b148c980	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	2		10000	5800
177530a8-8dd9-475b-9960-d6827be7ff66	32104356-11b3-4e88-b401-7530b148c980	5aba7510-d851-4dbe-8f83-c1998ae0d45a	3		25000	13600
d9c04ba7-eb45-4aeb-9c2c-f7c02a6d8723	3198aac9-7014-4666-a1ef-fb12ab6a00a7	7737aeca-f083-435b-b6ea-2c7fe84a9446	1		25000	13550
1b2a16d3-c5e1-4e1f-9d00-3ca0c506cead	3198aac9-7014-4666-a1ef-fb12ab6a00a7	089a4740-7bc6-497d-b97b-768c5cdbef20	1		20000	11950
a59c9709-89dd-41ad-8f41-cdac699e6f2a	6e0bf3e7-45ab-4ede-821a-6ac30877a6e2	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	3		10000	5800
6ed6fb72-58e1-4a04-ba65-9166faf13a51	6e0bf3e7-45ab-4ede-821a-6ac30877a6e2	c6f605e4-b32a-4362-9434-ebe486b5667e	1		12000	4340
2f79ba60-c13c-472e-931b-86c3f5393258	5ec5bbe6-4824-4d3f-bfc6-998022db49e8	09d12952-1666-47c4-9426-72a9c037ea6b	1		20000	12500
04ace044-58ae-4477-bfe3-2611738ef0b1	aa897be6-e36e-4df0-a130-75ec958f15f6	09d12952-1666-47c4-9426-72a9c037ea6b	1		20000	12500
1e749c66-4bb9-4197-997e-3695b2fe74b9	2def6ce5-f814-4a32-ad02-0538d9d263df	f075657c-1c80-49db-97dd-895f2568fdd0	2		10000	6150
7a9a1a7f-be51-4cf9-b05c-daf315935d2e	2def6ce5-f814-4a32-ad02-0538d9d263df	d25c9bed-2282-465f-a2c7-8276b70d84d3	2		15000	6000
5954a624-e69b-48ed-b22a-09e2170b33ea	799fe44d-1647-461a-afe6-e73affe6a683	09d12952-1666-47c4-9426-72a9c037ea6b	3		20000	12500
ea4dfdd7-77ab-4ae7-b331-7c5ffb68a880	799fe44d-1647-461a-afe6-e73affe6a683	d25c9bed-2282-465f-a2c7-8276b70d84d3	1		15000	6000
c8c8daf3-4715-49af-9608-070f591b0d04	799fe44d-1647-461a-afe6-e73affe6a683	c6f605e4-b32a-4362-9434-ebe486b5667e	1		12000	4340
fb8f49d3-3bc0-41cd-b014-a515686fa847	220c8f65-05e4-4f14-83c7-84fa50b77108	c6f605e4-b32a-4362-9434-ebe486b5667e	1		12000	4340
679c8e27-e40f-4f1e-bdb5-c2c75dd7ec33	220c8f65-05e4-4f14-83c7-84fa50b77108	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	1		10000	5800
ddcd8dc5-fb13-4b67-b423-e40d67c9f0f2	13a6ebe8-d85b-48de-9911-be35db8ce231	c6f605e4-b32a-4362-9434-ebe486b5667e	3		12000	4340
aaa67525-361a-49eb-b8ba-d3176844b31f	13a6ebe8-d85b-48de-9911-be35db8ce231	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	3		10000	5800
726f1858-5d70-4e8c-bc8d-97ee667a84c3	13a6ebe8-d85b-48de-9911-be35db8ce231	7737aeca-f083-435b-b6ea-2c7fe84a9446	1		25000	13550
f83233d1-6f1f-4743-b886-b8612902f49f	13a6ebe8-d85b-48de-9911-be35db8ce231	714a5a19-3113-4a73-8a43-d46baf2ec8e2	1		15000	2340
c22e33e0-18eb-48f8-947b-21c5f5481516	22f8a90a-823b-4aff-ad44-4ac851b28fe5	714a5a19-3113-4a73-8a43-d46baf2ec8e2	3		15000	2340
9bcfb6d1-f33b-461c-8ed3-bc23f1b2ad78	49d351a6-a185-4a05-890d-c6a55732ded5	5aba7510-d851-4dbe-8f83-c1998ae0d45a	2		25000	13600
59bcb7c6-8524-49dc-8f6e-af22347a414b	49d351a6-a185-4a05-890d-c6a55732ded5	d25c9bed-2282-465f-a2c7-8276b70d84d3	1		15000	6000
fcdf97a6-aa82-471d-aea0-ce04c75e647b	49d351a6-a185-4a05-890d-c6a55732ded5	7737aeca-f083-435b-b6ea-2c7fe84a9446	1		25000	13550
3ccdfaf3-0c35-43e4-b0cb-de3298a6b135	49d351a6-a185-4a05-890d-c6a55732ded5	f075657c-1c80-49db-97dd-895f2568fdd0	3		10000	6150
a6757c4f-1615-4df3-ae23-d285fd651c7f	d923a49f-b591-46da-823c-be1cc66e389a	5aba7510-d851-4dbe-8f83-c1998ae0d45a	2		25000	13600
1951e277-cbda-48f9-a7a0-230ea1699eb3	bb1b888e-63d4-45ff-9d9b-45b4fbe1c7bf	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	2		10000	5800
2456d5e1-357e-49e8-aca8-6e1778e64fae	bb1b888e-63d4-45ff-9d9b-45b4fbe1c7bf	089a4740-7bc6-497d-b97b-768c5cdbef20	3		20000	11950
8b80454e-9d0b-42ac-9c6d-03ad1593bf47	9ca9140c-d02a-4014-82fa-3669ad42d088	09d12952-1666-47c4-9426-72a9c037ea6b	2		20000	12500
35f704e5-aad1-4aba-be4c-9495aa373036	9ca9140c-d02a-4014-82fa-3669ad42d088	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	1		10000	5800
9f24c867-0711-4326-b308-5379571e7a71	9ca9140c-d02a-4014-82fa-3669ad42d088	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	3		12000	6150
f7e78ff3-94ee-4bb5-9b3f-f07759bf42ee	9ca9140c-d02a-4014-82fa-3669ad42d088	089a4740-7bc6-497d-b97b-768c5cdbef20	2		20000	11950
1984de12-aa2c-4c21-b8df-804c5510cf30	5346ec4e-9dc5-43d3-afbf-1843a41b0ad9	714a5a19-3113-4a73-8a43-d46baf2ec8e2	1		15000	2340
1463989f-fdf1-47a7-929b-8f2343988f50	5346ec4e-9dc5-43d3-afbf-1843a41b0ad9	319f823a-80e3-4cf4-88f9-0a83e67e52da	1		10000	2600
1fd997b9-c4b4-440f-8c79-92ede10258df	5346ec4e-9dc5-43d3-afbf-1843a41b0ad9	089a4740-7bc6-497d-b97b-768c5cdbef20	2		20000	11950
d4c12431-ed5c-42f0-a394-1ea0bda89e76	5346ec4e-9dc5-43d3-afbf-1843a41b0ad9	d25c9bed-2282-465f-a2c7-8276b70d84d3	1		15000	6000
56a2c1ec-d3b4-41fe-b5f1-42fe07c5db6c	c0f3a4c4-0f2c-43dc-a18e-c9cecf240068	f075657c-1c80-49db-97dd-895f2568fdd0	3		10000	6150
a4f2225d-e7e6-417a-b6e3-a6bf5158501f	0fddd3e6-ad3b-46f0-8a2d-8b49b1d98a4b	319f823a-80e3-4cf4-88f9-0a83e67e52da	2		10000	2600
2cea986d-bd7e-4a40-9ea7-2975b5087748	0fddd3e6-ad3b-46f0-8a2d-8b49b1d98a4b	5aba7510-d851-4dbe-8f83-c1998ae0d45a	3		25000	13600
e6d98d3a-117e-4053-b3cf-ef0de3c517d2	0fddd3e6-ad3b-46f0-8a2d-8b49b1d98a4b	f075657c-1c80-49db-97dd-895f2568fdd0	3		10000	6150
1ec98c48-6865-43d6-877e-6e68e1915487	06986ef5-55e6-4ac9-9567-c0a66c08f9c8	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	3		12000	6150
9fd75cb9-9b70-4361-a92c-2f1133adfc37	06986ef5-55e6-4ac9-9567-c0a66c08f9c8	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	3		10000	5800
6e7ba02f-90a8-485c-9452-a92eaaf2549a	06986ef5-55e6-4ac9-9567-c0a66c08f9c8	714a5a19-3113-4a73-8a43-d46baf2ec8e2	3		15000	2340
631ede9e-f5ab-4057-9f5a-785d1885a693	c66aa106-999b-42d6-b8e1-f5b06dfa1d33	09d12952-1666-47c4-9426-72a9c037ea6b	1		20000	12500
2f7b474b-26e0-43c2-a955-f588049bca5a	c66aa106-999b-42d6-b8e1-f5b06dfa1d33	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	1		10000	5800
6f5e3b19-063e-401b-a7da-94e551b33420	c66aa106-999b-42d6-b8e1-f5b06dfa1d33	5e1e5adc-6ea3-4431-8703-b47790a67940	3		45000	25800
7e903f6f-573d-40de-95ed-c38791edc91e	8fb410d4-098e-4640-86b9-ff8a5b50e29e	d25c9bed-2282-465f-a2c7-8276b70d84d3	2		15000	6000
bf53c3b5-20c5-441a-af39-3e6749e0a4a9	8fb410d4-098e-4640-86b9-ff8a5b50e29e	319f823a-80e3-4cf4-88f9-0a83e67e52da	2		10000	2600
f23727cb-bf4a-4a5f-8f81-0b4e39c91b6f	8fb410d4-098e-4640-86b9-ff8a5b50e29e	09d12952-1666-47c4-9426-72a9c037ea6b	3		20000	12500
f6c87cc5-8cdd-4255-b061-b51309ff61ac	8fb410d4-098e-4640-86b9-ff8a5b50e29e	7737aeca-f083-435b-b6ea-2c7fe84a9446	3		25000	13550
5c0e6ef5-8864-4dc1-881a-bfbd4f180435	30b6fc18-04f5-40ad-bf46-ceff7c99b34b	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	3		12000	6150
10498273-6ab2-42b3-9a63-5a519350b90a	30b6fc18-04f5-40ad-bf46-ceff7c99b34b	5aba7510-d851-4dbe-8f83-c1998ae0d45a	3		25000	13600
c9854fa1-7550-4ea7-a6a8-87f04fd52b27	30b6fc18-04f5-40ad-bf46-ceff7c99b34b	09d12952-1666-47c4-9426-72a9c037ea6b	2		20000	12500
d4165731-b17c-44f5-bac3-5d006b576fbf	30b6fc18-04f5-40ad-bf46-ceff7c99b34b	714a5a19-3113-4a73-8a43-d46baf2ec8e2	1		15000	2340
f0ef2740-d846-46b6-bc9e-014cf29fc437	091e76fe-d954-4aa3-b6ec-4b347bac8fd5	5e1e5adc-6ea3-4431-8703-b47790a67940	1		45000	25800
06f466bc-7d45-4a24-9a3b-f739b0b04708	0be5248f-561d-4bd3-9198-1e2f8fea06e4	c6f605e4-b32a-4362-9434-ebe486b5667e	2		12000	4340
11fcec4e-4029-4fbe-9c1e-ca87555ab5ba	0be5248f-561d-4bd3-9198-1e2f8fea06e4	d25c9bed-2282-465f-a2c7-8276b70d84d3	2		15000	6000
b2fa22f8-af81-4b2d-b418-0ff367e7502f	0be5248f-561d-4bd3-9198-1e2f8fea06e4	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	2		10000	5800
76a87b59-36ff-41a7-8eb9-485dcab0375e	0be5248f-561d-4bd3-9198-1e2f8fea06e4	f075657c-1c80-49db-97dd-895f2568fdd0	3		10000	6150
caafb58f-8e09-4495-ba46-3d646ede8d57	962aac5a-67bb-49f1-aaa1-8fb04d2331c0	089a4740-7bc6-497d-b97b-768c5cdbef20	2		20000	11950
cf3330ac-d462-431a-8f33-02a4fc89be40	962aac5a-67bb-49f1-aaa1-8fb04d2331c0	714a5a19-3113-4a73-8a43-d46baf2ec8e2	1		15000	2340
364ebec8-1aea-4d4a-ba2f-2e3f52efd637	962aac5a-67bb-49f1-aaa1-8fb04d2331c0	f075657c-1c80-49db-97dd-895f2568fdd0	3		10000	6150
a1ea6fbb-653f-48cc-8641-91250a5fc8bb	962aac5a-67bb-49f1-aaa1-8fb04d2331c0	5e1e5adc-6ea3-4431-8703-b47790a67940	2		45000	25800
b29be337-6e10-4eec-b31a-05100754c1d1	3fad80c4-b76a-4543-9666-c40bd9344796	5aba7510-d851-4dbe-8f83-c1998ae0d45a	2		25000	13600
e69fff80-6da0-4d77-8344-feb0ef16fb6c	3fad80c4-b76a-4543-9666-c40bd9344796	f075657c-1c80-49db-97dd-895f2568fdd0	3		10000	6150
dd5c731d-9654-461e-8d53-08cc9af04924	3fad80c4-b76a-4543-9666-c40bd9344796	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	1		10000	5800
8cc9d21b-7496-4dbb-aadf-261c8aaf1d43	3fad80c4-b76a-4543-9666-c40bd9344796	7737aeca-f083-435b-b6ea-2c7fe84a9446	1		25000	13550
69bb0d50-e62e-40cd-a394-19864c2cb9e1	f65a854a-a48d-4b97-9209-1ae47f2b2a51	5e1e5adc-6ea3-4431-8703-b47790a67940	2		45000	25800
7714b38f-a5f3-4d9e-9d9a-652b1ebc0a2a	5199936c-e3e9-4782-9f27-e8130331b816	7737aeca-f083-435b-b6ea-2c7fe84a9446	3		25000	13550
dc7152ad-5446-4253-ad7f-c9f676ccb646	5199936c-e3e9-4782-9f27-e8130331b816	c6f605e4-b32a-4362-9434-ebe486b5667e	3		12000	4340
cd21b2bb-53d7-4ce4-8281-b780a9ed38ae	0f393a47-bc15-44cb-871c-bd21d82e6021	7737aeca-f083-435b-b6ea-2c7fe84a9446	1		25000	13550
78fbe09c-c3d7-4693-a719-95cd3c286a5b	0f393a47-bc15-44cb-871c-bd21d82e6021	319f823a-80e3-4cf4-88f9-0a83e67e52da	1		10000	2600
8bee3967-9dff-480d-a6dc-ccb5c00b8a28	0f393a47-bc15-44cb-871c-bd21d82e6021	089a4740-7bc6-497d-b97b-768c5cdbef20	2		20000	11950
98dc2349-a731-475d-ac97-c42d2edb9ec4	ae827174-69e6-42f6-803c-3c98a88fcfba	c6f605e4-b32a-4362-9434-ebe486b5667e	2		12000	4340
828d41f9-a8cb-47c2-9b47-0b0fc913772e	ae827174-69e6-42f6-803c-3c98a88fcfba	319f823a-80e3-4cf4-88f9-0a83e67e52da	3		10000	2600
c22795cd-2632-4635-b02f-eb653d663669	ae827174-69e6-42f6-803c-3c98a88fcfba	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	2		12000	6150
e0b80373-d130-4bdc-b7c7-1100a2b5124d	7bb76bf9-169d-47b1-828f-bf0b52ac4065	5b1cc1a0-7d78-4fcb-a279-ad13a4db3ac1	3		12000	6150
23bd828c-9214-450a-a745-08459ff366ac	7bb76bf9-169d-47b1-828f-bf0b52ac4065	c6f605e4-b32a-4362-9434-ebe486b5667e	2		12000	4340
3f55c4a7-58a6-4bf8-9fc4-d10130ae04b2	691f716c-81ef-4deb-a113-bdbfde65b854	7737aeca-f083-435b-b6ea-2c7fe84a9446	3		25000	13550
1ab5cc21-2c62-4e43-8e3c-cbf9a45332ff	691f716c-81ef-4deb-a113-bdbfde65b854	09d12952-1666-47c4-9426-72a9c037ea6b	3		20000	12500
8fae7219-df76-4ba7-ba81-7487ff7cdb7b	2fabe2db-ecca-48f6-98cb-f0570c2a205b	5aba7510-d851-4dbe-8f83-c1998ae0d45a	1		25000	13600
38042047-b68a-4783-bbc7-21fa7bc70b0a	1e5ed7d3-d636-4cd2-877e-10cdd2bda034	f075657c-1c80-49db-97dd-895f2568fdd0	2		10000	6150
8e4190b8-cfa8-4b55-a17d-555c7678ccfe	1e5ed7d3-d636-4cd2-877e-10cdd2bda034	319f823a-80e3-4cf4-88f9-0a83e67e52da	2		10000	2600
a863b622-6a9c-42b1-8c01-1c6e1367e165	1e5ed7d3-d636-4cd2-877e-10cdd2bda034	089a4740-7bc6-497d-b97b-768c5cdbef20	2		20000	11950
c0a75202-92b5-4a54-8758-fc827914c217	7eeaa822-8db0-46bf-a94d-976e3726660c	7737aeca-f083-435b-b6ea-2c7fe84a9446	1		25000	13550
3225d944-69dc-4802-905a-d4c16277656b	7eeaa822-8db0-46bf-a94d-976e3726660c	09d12952-1666-47c4-9426-72a9c037ea6b	2		20000	12500
a8b5c27e-292e-442d-9ab3-40384617dc26	7eeaa822-8db0-46bf-a94d-976e3726660c	5aba7510-d851-4dbe-8f83-c1998ae0d45a	3		25000	13600
3bb3d893-c2d3-4b14-8688-b872cd91f4ec	b7eac8ff-de1a-4cc9-b1ef-6426107a4994	7737aeca-f083-435b-b6ea-2c7fe84a9446	2		25000	13550
6bfbfcbe-f7c4-48af-a144-26896f14ca90	b7eac8ff-de1a-4cc9-b1ef-6426107a4994	d25c9bed-2282-465f-a2c7-8276b70d84d3	2		15000	6000
323e4363-f191-4e9a-b4fe-3513ce6b6c79	b7eac8ff-de1a-4cc9-b1ef-6426107a4994	c6f605e4-b32a-4362-9434-ebe486b5667e	1		12000	4340
9b88511c-c06f-4f78-a5bb-cf6cb9d475d7	b7eac8ff-de1a-4cc9-b1ef-6426107a4994	5aba7510-d851-4dbe-8f83-c1998ae0d45a	2		25000	13600
6e3aada8-4ed6-4591-b991-7dde13a03d81	8e52a8f3-15b8-47a4-863f-9298234de866	319f823a-80e3-4cf4-88f9-0a83e67e52da	2		10000	2600
551e475a-de17-48d9-8d76-dd1374de34c1	8e52a8f3-15b8-47a4-863f-9298234de866	f075657c-1c80-49db-97dd-895f2568fdd0	2		10000	6150
c2dbaaf4-b90e-4106-8c69-64ce70310c08	196a1b32-3312-4075-8710-6fcf6d299b8c	5e1e5adc-6ea3-4431-8703-b47790a67940	1		45000	25800
f7d27910-3f87-4830-aaea-74c52672755f	f2942cc2-3507-41a4-a28b-0cbc501eea64	5aba7510-d851-4dbe-8f83-c1998ae0d45a	3		25000	13600
f7ae9644-9d4a-4d3c-8282-154c847a4263	f2942cc2-3507-41a4-a28b-0cbc501eea64	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	1		10000	5800
b10439ea-9893-40bf-946b-808dd16513e2	233300c8-fc4b-45d0-9213-ee87cf485614	c6f605e4-b32a-4362-9434-ebe486b5667e	2		12000	4340
e17360aa-21bb-4a88-852c-7550cdad1b69	233300c8-fc4b-45d0-9213-ee87cf485614	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	2		10000	5800
e2545132-68e6-4b09-a95e-d59fae557801	233300c8-fc4b-45d0-9213-ee87cf485614	5aba7510-d851-4dbe-8f83-c1998ae0d45a	2		25000	13600
cb2f12fb-4cc3-4b32-93a7-29feac9fc923	32b2f2fb-89f6-4092-9424-763972b008bd	f075657c-1c80-49db-97dd-895f2568fdd0	3		10000	6150
6f312629-2aec-4626-a533-454d976a32cf	03d552c8-986a-44af-b8b4-354a92636c98	5e1e5adc-6ea3-4431-8703-b47790a67940	3		45000	25800
e4719f8d-8075-4229-a07c-2105d47be7d4	03d552c8-986a-44af-b8b4-354a92636c98	c6f605e4-b32a-4362-9434-ebe486b5667e	2		12000	4340
bc9469a2-d544-4745-9140-4680e16196ba	03d552c8-986a-44af-b8b4-354a92636c98	f075657c-1c80-49db-97dd-895f2568fdd0	2		10000	6150
8635f01c-ca74-4f0f-8f5f-037ce6c84802	034cf8df-c090-440f-b3d3-20688ade79ab	c6f605e4-b32a-4362-9434-ebe486b5667e	1		12000	4340
19656fb4-dfda-4dda-af42-52d7486782c0	6fe0538b-36af-437e-af47-bb6bf9d0c45e	b4c11d3a-440c-4adc-9f58-bff6c6acd55f	5		10000	5800
3fb39b37-86a2-4d5b-b350-1cd2732af81b	c6d8dada-4ed5-46ae-872c-f8b4ef3cb057	7737aeca-f083-435b-b6ea-2c7fe84a9446	1		25000	16050
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.transactions (id, total_amount, payment_method, amount_tendered, change, "timestamp", cashier_id, status, order_type, routing_number, whatsapp, email, subtotal, tax) FROM stdin;
8887a300-7df7-4d51-9bd3-96507494064a	49950	QRIS	\N	0	2026-07-05 14:11:14.294788	EMP-CSH-26101	Completed	Dine-In	8	+62 89600133890	\N	45000	4950
009c4190-c070-4c4f-806c-2cca3fae4ff2	66600	Cash	70000	3400	2026-07-05 14:11:17.92541	EMP-CSH-26101	Completed	Takeaway	\N	+62 82654235116	\N	60000	6600
0bcf8496-298a-478d-b13b-3ab595dba294	44400	QRIS	\N	0	2026-07-05 14:11:21.429184	EMP-CSH-26101	Completed	Takeaway	\N	\N	bayu.saputra550@gmail.com	40000	4400
8af66600-7fd8-44d5-87c0-9171272909a0	188700	Cash	190000	1300	2026-07-05 14:11:28.531975	EMP-CSH-26101	Completed	Dine-In	28	\N	hadi.wijaya285@yahoo.com	170000	18700
2b3a7672-36c5-4889-8c12-c22297861d8b	149850	Cash	150000	150	2026-07-05 14:11:33.490725	EMP-CSH-26101	Completed	Dine-In	20	+62 82764835030	\N	135000	14850
b5b3b243-6daf-4ef3-9988-9859384b8d27	124320	QRIS	\N	0	2026-07-05 14:11:37.444823	EMP-CSH-26101	Completed	Takeaway	\N	+62 83884969653	\N	112000	12320
a6018067-4044-4815-bd6c-aafbb8eb737e	24420	QRIS	\N	0	2026-07-05 14:11:41.262078	EMP-CSH-26101	Completed	Dine-In	26	+62 86697848018	\N	22000	2420
8ad9abb1-82da-413e-8f8a-4967c5773bc4	111000	Cash	120000	9000	2026-07-05 14:11:46.179867	EMP-CSH-26101	Completed	Takeaway	\N	+62 84893252880	\N	100000	11000
83b59399-7148-4b62-a4b3-54972ad7c2cc	74370	QRIS	\N	0	2026-07-05 14:11:50.994309	EMP-CSH-26101	Completed	Takeaway	\N	+62 82782489638	\N	67000	7370
32104356-11b3-4e88-b401-7530b148c980	105450	Cash	110000	4550	2026-07-05 14:11:55.779398	EMP-CSH-26101	Completed	Takeaway	\N	\N	erik.nugroho124@gmail.com	95000	10450
3198aac9-7014-4666-a1ef-fb12ab6a00a7	53280	QRIS	\N	0	2026-07-05 14:11:59.534448	EMP-CSH-26101	Completed	Dine-In	23	+62 81051834738	\N	48000	5280
6e0bf3e7-45ab-4ede-821a-6ac30877a6e2	46620	Cash	50000	3380	2026-07-05 14:12:03.378201	EMP-CSH-26101	Completed	Takeaway	\N	+62 86566701065	\N	42000	4620
5ec5bbe6-4824-4d3f-bfc6-998022db49e8	22200	Cash	30000	7800	2026-07-05 14:12:05.779722	EMP-CSH-26101	Completed	Takeaway	\N	+62 84731781080	\N	20000	2200
aa897be6-e36e-4df0-a130-75ec958f15f6	22200	QRIS	\N	0	2026-07-05 14:12:08.996695	EMP-CSH-26101	Completed	Takeaway	\N	\N	putri.pratama925@gmail.com	20000	2200
2def6ce5-f814-4a32-ad02-0538d9d263df	55500	Cash	60000	4500	2026-07-05 14:12:13.603823	EMP-CSH-26101	Completed	Takeaway	\N	\N	yani.nugroho159@gmail.com	50000	5500
799fe44d-1647-461a-afe6-e73affe6a683	96570	QRIS	\N	0	2026-07-05 14:12:17.23559	EMP-CSH-26101	Completed	Takeaway	\N	+62 80812191361	\N	87000	9570
220c8f65-05e4-4f14-83c7-84fa50b77108	24420	Cash	30000	5580	2026-07-05 14:12:21.330269	EMP-CSH-26101	Completed	Takeaway	\N	+62 85346247510	\N	22000	2420
13a6ebe8-d85b-48de-9911-be35db8ce231	120990	Cash	130000	9010	2026-07-05 14:12:26.273337	EMP-CSH-26101	Completed	Takeaway	\N	\N	fajar.susanti627@outlook.com	109000	11990
22f8a90a-823b-4aff-ad44-4ac851b28fe5	49950	QRIS	\N	0	2026-07-05 14:12:29.768249	EMP-CSH-26101	Completed	Dine-In	29	+62 81824493534	\N	45000	4950
49d351a6-a185-4a05-890d-c6a55732ded5	135420	Cash	140000	4580	2026-07-05 14:12:35.301314	EMP-CSH-26101	Completed	Takeaway	\N	+62 81280598262	\N	122000	13420
d923a49f-b591-46da-823c-be1cc66e389a	55500	QRIS	\N	0	2026-07-05 14:12:37.776688	EMP-CSH-26101	Completed	Takeaway	\N	+62 85869232260	\N	50000	5500
bb1b888e-63d4-45ff-9d9b-45b4fbe1c7bf	88800	Cash	90000	1200	2026-07-05 14:12:42.246351	EMP-CSH-26101	Completed	Dine-In	9	\N	fajar.wijaya894@gmail.com	80000	8800
9ca9140c-d02a-4014-82fa-3669ad42d088	139860	QRIS	\N	0	2026-07-05 14:12:48.343414	EMP-CSH-26101	Completed	Takeaway	\N	\N	indah.wijaya360@outlook.com	126000	13860
5346ec4e-9dc5-43d3-afbf-1843a41b0ad9	88800	QRIS	\N	0	2026-07-05 14:12:54.242597	EMP-CSH-26101	Completed	Takeaway	\N	\N	lina.lestari621@outlook.com	80000	8800
c0f3a4c4-0f2c-43dc-a18e-c9cecf240068	33300	QRIS	\N	0	2026-07-05 14:12:57.872475	EMP-CSH-26101	Completed	Takeaway	\N	+62 88835615951	\N	30000	3300
0fddd3e6-ad3b-46f0-8a2d-8b49b1d98a4b	138750	Cash	140000	1250	2026-07-05 14:13:03.050107	EMP-CSH-26101	Completed	Dine-In	14	+62 89946804436	\N	125000	13750
06986ef5-55e6-4ac9-9567-c0a66c08f9c8	123210	Cash	130000	6790	2026-07-05 14:13:09.214864	EMP-CSH-26101	Completed	Dine-In	10	\N	rian.rahayu96@gmail.com	111000	12210
c66aa106-999b-42d6-b8e1-f5b06dfa1d33	183150	Cash	190000	6850	2026-07-05 14:13:14.791234	EMP-CSH-26101	Completed	Dine-In	15	+62 86763201632	\N	165000	18150
8fb410d4-098e-4640-86b9-ff8a5b50e29e	212010	Cash	220000	7990	2026-07-05 14:13:22.316297	EMP-CSH-26101	Completed	Takeaway	\N	\N	cahya.nugroho919@gmail.com	191000	21010
30b6fc18-04f5-40ad-bf46-ceff7c99b34b	184260	Cash	190000	5740	2026-07-05 14:13:29.310566	EMP-CSH-26101	Completed	Takeaway	\N	\N	hadi.santoso328@outlook.com	166000	18260
091e76fe-d954-4aa3-b6ec-4b347bac8fd5	49950	QRIS	\N	0	2026-07-05 14:13:32.662316	EMP-CSH-26101	Completed	Dine-In	13	+62 81665876036	\N	45000	4950
0be5248f-561d-4bd3-9198-1e2f8fea06e4	115440	Cash	120000	4560	2026-07-05 14:13:39.365547	EMP-CSH-26101	Completed	Dine-In	16	\N	hadi.santoso498@gmail.com	104000	11440
962aac5a-67bb-49f1-aaa1-8fb04d2331c0	194250	Cash	200000	5750	2026-07-05 14:13:46.198741	EMP-CSH-26101	Completed	Dine-In	3	+62 87204653755	\N	175000	19250
3fad80c4-b76a-4543-9666-c40bd9344796	130980	Cash	140000	9020	2026-07-05 14:13:52.509852	EMP-CSH-26101	Completed	Dine-In	8	+62 83271937452	\N	118000	12980
f65a854a-a48d-4b97-9209-1ae47f2b2a51	99900	Cash	100000	100	2026-07-05 14:13:56.469499	EMP-CSH-26101	Completed	Dine-In	19	\N	andi.santoso407@outlook.com	90000	9900
5199936c-e3e9-4782-9f27-e8130331b816	133200	Cash	140000	6800	2026-07-05 14:14:01.11644	EMP-CSH-26101	Completed	Dine-In	26	\N	tono.saputra546@yahoo.com	120000	13200
0f393a47-bc15-44cb-871c-bd21d82e6021	85470	QRIS	\N	0	2026-07-05 14:14:06.400496	EMP-CSH-26101	Completed	Takeaway	\N	\N	yani.kusuma181@outlook.com	77000	8470
ae827174-69e6-42f6-803c-3c98a88fcfba	86580	Cash	90000	3420	2026-07-05 14:14:12.05419	EMP-CSH-26101	Completed	Dine-In	27	\N	fitri.wijaya903@yahoo.com	78000	8580
7bb76bf9-169d-47b1-828f-bf0b52ac4065	66600	QRIS	\N	0	2026-07-05 14:14:15.988061	EMP-CSH-26101	Completed	Dine-In	16	+62 87354549480	\N	60000	6600
691f716c-81ef-4deb-a113-bdbfde65b854	156510	QRIS	\N	0	2026-07-05 14:14:20.595071	EMP-CSH-26101	Completed	Takeaway	\N	\N	vina.susanti812@gmail.com	141000	15510
2fabe2db-ecca-48f6-98cb-f0570c2a205b	27750	QRIS	\N	0	2026-07-05 14:14:23.351708	EMP-CSH-26101	Completed	Dine-In	10	\N	wahyu.rahayu485@outlook.com	25000	2750
1e5ed7d3-d636-4cd2-877e-10cdd2bda034	88800	Cash	90000	1200	2026-07-05 14:14:28.380048	EMP-CSH-26101	Completed	Takeaway	\N	+62 85182337498	\N	80000	8800
7eeaa822-8db0-46bf-a94d-976e3726660c	158730	Cash	160000	1270	2026-07-05 14:14:33.761863	EMP-CSH-26101	Completed	Takeaway	\N	\N	budi.saputra715@gmail.com	143000	15730
b7eac8ff-de1a-4cc9-b1ef-6426107a4994	162060	QRIS	\N	0	2026-07-05 14:14:40.831429	EMP-CSH-26101	Completed	Dine-In	13	+62 82294131869	\N	146000	16060
8e52a8f3-15b8-47a4-863f-9298234de866	44400	QRIS	\N	0	2026-07-05 14:14:45.293877	EMP-CSH-26101	Completed	Takeaway	\N	+62 89133412328	\N	40000	4400
196a1b32-3312-4075-8710-6fcf6d299b8c	49950	QRIS	\N	0	2026-07-05 14:14:49.200338	EMP-CSH-26101	Completed	Takeaway	\N	\N	oki.rahayu299@gmail.com	45000	4950
f2942cc2-3507-41a4-a28b-0cbc501eea64	94350	Cash	100000	5650	2026-07-05 14:14:53.582806	EMP-CSH-26101	Completed	Dine-In	30	+62 86183242102	\N	85000	9350
233300c8-fc4b-45d0-9213-ee87cf485614	104340	Cash	110000	5660	2026-07-05 14:14:58.493937	EMP-CSH-26101	Completed	Takeaway	\N	\N	rian.nugroho449@gmail.com	94000	10340
32b2f2fb-89f6-4092-9424-763972b008bd	33300	Cash	40000	6700	2026-07-05 14:15:01.162483	EMP-CSH-26101	Completed	Takeaway	\N	+62 89904902787	\N	30000	3300
03d552c8-986a-44af-b8b4-354a92636c98	198690	QRIS	\N	0	2026-07-05 14:15:06.537366	EMP-CSH-26101	Completed	Takeaway	\N	+62 82567468071	\N	179000	19690
034cf8df-c090-440f-b3d3-20688ade79ab	13320	QRIS	\N	0	2026-07-08 06:03:44.144873	EMP-CSH-26101	Completed	Takeaway	\N	\N	\N	12000	1320
6fe0538b-36af-437e-af47-bb6bf9d0c45e	55500	Cash	70000	14500	2026-07-08 06:04:48.488861	EMP-CSH-26101	Completed	Dine-In	24	\N	\N	50000	5500
c6d8dada-4ed5-46ae-872c-f8b4ef3cb057	31080	Cash	50000	18920	2026-07-08 06:54:37.218333	EMP-CSH-26101	Completed	Dine-In	30	\N	\N	28000	3080
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: stockbite_user
--

COPY public.users (id, name, role, hashed_password, is_active, username, phone_number, email, hashed_pin) FROM stdin;
EMP-MGR-26104	test_std_mgr	Manager	$2b$12$7uuSwgOEUPBRAhV.sGCfHu6YHWr1Whubv5wBk3XsjNHkWpGSWVTBC	t	test_std_mgr	\N	\N	\N
EMP-MGR-26102	anita	Manager	$2b$12$4lU4gCCyb6GphafpKe/TqOQdirdA4dkQYAfzkYK0D/jSzAkq7av/m	t	anita			\N
EMP-WHS-26103	Abel tatararara Putra	Warehouse	$2b$12$EFUqElqvLvqRgiK/dei0WuDYZAsk1cS123kdtmTGPBW0biPTbbqdS	t	abel			\N
EMP-MGR-26100	mohammed	Manager	$2b$12$Lr6zVolUeq5SsQj5qkiumOj0FXy8FXBDQkFabYKQZzoUkg2qj2UNy	t	mohammed	\N	\N	\N
EMP-CSH-26104	djsf	Cashier	$2b$12$pto8.67RPjTmdCd4Uxz/3ud0BvAhdF64v5ahkn.C7XM/wtAIq3sEO	t	DAFFA			\N
EMP-CSH-26101	daffa	Cashier	$2b$12$ljg2JIKU2LMT028x9N751ex.FT3A0VjIXaZ0IvXFNV09PzVuF4GGm	t	daffa	\N	\N	\N
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- Name: item_modifier_groups item_modifier_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.item_modifier_groups
    ADD CONSTRAINT item_modifier_groups_pkey PRIMARY KEY (id);


--
-- Name: item_modifiers item_modifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.item_modifiers
    ADD CONSTRAINT item_modifiers_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: modifier_recipes modifier_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.modifier_recipes
    ADD CONSTRAINT modifier_recipes_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: transaction_item_modifiers transaction_item_modifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.transaction_item_modifiers
    ADD CONSTRAINT transaction_item_modifiers_pkey PRIMARY KEY (id);


--
-- Name: transaction_items transaction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders fk_po_created_by; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_po_created_by FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: purchase_orders fk_po_sent_by; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_po_sent_by FOREIGN KEY (sent_by_id) REFERENCES public.users(id);


--
-- Name: ingredients ingredients_preferred_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_preferred_supplier_id_fkey FOREIGN KEY (preferred_supplier_id) REFERENCES public.suppliers(id);


--
-- Name: item_modifier_groups item_modifier_groups_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.item_modifier_groups
    ADD CONSTRAINT item_modifier_groups_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- Name: item_modifiers item_modifiers_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.item_modifiers
    ADD CONSTRAINT item_modifiers_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.item_modifier_groups(id);


--
-- Name: modifier_recipes modifier_recipes_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.modifier_recipes
    ADD CONSTRAINT modifier_recipes_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);


--
-- Name: modifier_recipes modifier_recipes_modifier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.modifier_recipes
    ADD CONSTRAINT modifier_recipes_modifier_id_fkey FOREIGN KEY (modifier_id) REFERENCES public.item_modifiers(id);


--
-- Name: purchase_orders purchase_orders_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: recipes recipes_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);


--
-- Name: recipes recipes_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- Name: shifts shifts_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: transaction_item_modifiers transaction_item_modifiers_modifier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.transaction_item_modifiers
    ADD CONSTRAINT transaction_item_modifiers_modifier_id_fkey FOREIGN KEY (modifier_id) REFERENCES public.item_modifiers(id);


--
-- Name: transaction_item_modifiers transaction_item_modifiers_transaction_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.transaction_item_modifiers
    ADD CONSTRAINT transaction_item_modifiers_transaction_item_id_fkey FOREIGN KEY (transaction_item_id) REFERENCES public.transaction_items(id);


--
-- Name: transaction_items transaction_items_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- Name: transaction_items transaction_items_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);


--
-- Name: transactions transactions_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stockbite_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict tXOiUZHV7c0RVraOqyWXh3uiaotHtdGO3DYrcYW8hClhjybhr6BogigxwEO5r2i

