--
-- PostgreSQL database dump
--

\restrict aMetdS8XNFaI4doUbqai8GiCZIg7kcRSZXHtfhQd4vgI8MpGRK9Dqdy3ys5cpl9

-- Dumped from database version 16.13 (Homebrew)
-- Dumped by pg_dump version 16.13 (Homebrew)

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

--
-- Name: ApprovalStatus; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."ApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ApprovalStatus" OWNER TO "lan.dt1";

--
-- Name: CustomerStatus; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."CustomerStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PROSPECT'
);


ALTER TYPE public."CustomerStatus" OWNER TO "lan.dt1";

--
-- Name: EmployeeStatus; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."EmployeeStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PROBATION'
);


ALTER TYPE public."EmployeeStatus" OWNER TO "lan.dt1";

--
-- Name: LeaveType; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."LeaveType" AS ENUM (
    'VACATION',
    'HOLIDAY',
    'ILLNESS',
    'OTHER'
);


ALTER TYPE public."LeaveType" OWNER TO "lan.dt1";

--
-- Name: MessageChannel; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."MessageChannel" AS ENUM (
    'EMAIL',
    'SLACK',
    'PHONE',
    'ZALO',
    'CHAT',
    'OTHER'
);


ALTER TYPE public."MessageChannel" OWNER TO "lan.dt1";

--
-- Name: MessageStatus; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."MessageStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'CLOSED'
);


ALTER TYPE public."MessageStatus" OWNER TO "lan.dt1";

--
-- Name: MessageValue; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."MessageValue" AS ENUM (
    'A',
    'B',
    'C'
);


ALTER TYPE public."MessageValue" OWNER TO "lan.dt1";

--
-- Name: PayType; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."PayType" AS ENUM (
    'HOURLY',
    'MONTHLY',
    'CONTRACT'
);


ALTER TYPE public."PayType" OWNER TO "lan.dt1";

--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."PaymentType" AS ENUM (
    'SALARY',
    'BONUS',
    'ADVANCE',
    'DEDUCTION',
    'OTHER'
);


ALTER TYPE public."PaymentType" OWNER TO "lan.dt1";

--
-- Name: Priority; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."Priority" AS ENUM (
    'CRITICAL',
    'HIGH',
    'NORMAL',
    'LOW'
);


ALTER TYPE public."Priority" OWNER TO "lan.dt1";

--
-- Name: TimeCheckType; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."TimeCheckType" AS ENUM (
    'INCREASE',
    'DECREASE'
);


ALTER TYPE public."TimeCheckType" OWNER TO "lan.dt1";

--
-- Name: VaultScope; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."VaultScope" AS ENUM (
    'COMPANY',
    'CUSTOMER'
);


ALTER TYPE public."VaultScope" OWNER TO "lan.dt1";

--
-- Name: WorkStatus; Type: TYPE; Schema: public; Owner: lan.dt1
--

CREATE TYPE public."WorkStatus" AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'BLOCKED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."WorkStatus" OWNER TO "lan.dt1";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public."Role" (
    id integer NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    color text,
    description text,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Role" OWNER TO "lan.dt1";

--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_id_seq" OWNER TO "lan.dt1";

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    "tableName" text NOT NULL,
    "recordId" integer,
    action text NOT NULL,
    "oldData" jsonb,
    "newData" jsonb,
    "changedById" integer,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text
);


ALTER TABLE public.audit_log OWNER TO "lan.dt1";

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO "lan.dt1";

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    "custId" text,
    "customerName" text,
    "businessName" text,
    "contactPerson" text,
    phone text,
    email text,
    address text,
    city text,
    plz text,
    website text,
    "vatTaxId" text,
    "preferredLanguage" text,
    status public."CustomerStatus" DEFAULT 'ACTIVE'::public."CustomerStatus" NOT NULL,
    "responsibleStaffId" integer,
    "lastContactDate" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.customers OWNER TO "lan.dt1";

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO "lan.dt1";

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    code text,
    description text,
    "headId" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.departments OWNER TO "lan.dt1";

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO "lan.dt1";

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    "employeeCode" text,
    "fullName" text NOT NULL,
    "avatarUrl" text,
    department text,
    "roleId" integer NOT NULL,
    company text,
    "emailCompany" text NOT NULL,
    "emailGoogle" text,
    "emailPrivate" text,
    "mobileCompany" text,
    "payType" public."PayType" DEFAULT 'HOURLY'::public."PayType" NOT NULL,
    "hourlyRate" numeric(10,2),
    "monthlySalary" numeric(10,2),
    "maxHoursMonth" integer DEFAULT 160 NOT NULL,
    "bonusMPct" numeric(5,2) DEFAULT 0 NOT NULL,
    "bonusAPct" numeric(5,2) DEFAULT 0 NOT NULL,
    "bonusTPct" numeric(5,2) DEFAULT 0 NOT NULL,
    "driveLink1" text,
    "driveLink2" text,
    "driveLink3" text,
    "driveLink4" text,
    "startDate" timestamp(3) without time zone,
    "managerId" integer,
    status public."EmployeeStatus" DEFAULT 'ACTIVE'::public."EmployeeStatus" NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "departmentId" integer,
    "teamId" integer
);


ALTER TABLE public.employees OWNER TO "lan.dt1";

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO "lan.dt1";

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: leaves; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.leaves (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "employeeId" integer NOT NULL,
    type public."LeaveType" NOT NULL,
    "requestedHours" numeric(5,2) NOT NULL,
    reason text,
    "evidenceLink" text,
    status public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    "approvedHours" numeric(5,2),
    "approvalNote" text,
    "approvedById" integer,
    "approvedAt" timestamp(3) without time zone,
    money numeric(10,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.leaves OWNER TO "lan.dt1";

--
-- Name: leaves_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.leaves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leaves_id_seq OWNER TO "lan.dt1";

--
-- Name: leaves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.leaves_id_seq OWNED BY public.leaves.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "time" timestamp(3) without time zone,
    channel public."MessageChannel",
    "customerId" integer,
    subject text,
    "messageSummary" text,
    "actionRequired" text,
    "assignedToId" integer,
    "dueDate" timestamp(3) without time zone,
    status public."MessageStatus" DEFAULT 'OPEN'::public."MessageStatus" NOT NULL,
    "linkFile" text,
    "followUpNote" text,
    "closedDate" timestamp(3) without time zone,
    tags text,
    "valueType" public."MessageValue",
    "companyAnswer" text,
    "supportTime" integer,
    "benefitTime" integer,
    "netTime" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO "lan.dt1";

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO "lan.dt1";

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: missing_tasks; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.missing_tasks (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "employeeId" integer NOT NULL,
    "taskName" text NOT NULL,
    description text,
    quantity integer DEFAULT 1 NOT NULL,
    "timeAllotted" integer,
    "videoLink" text NOT NULL,
    "videoDuration" integer,
    "dateRecorded" timestamp(3) without time zone,
    "reasonNote" text,
    status public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    "approvedTime" integer,
    "bonusTime" integer DEFAULT 0 NOT NULL,
    "reviewedById" integer,
    "decisionNote" text,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.missing_tasks OWNER TO "lan.dt1";

--
-- Name: missing_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.missing_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.missing_tasks_id_seq OWNER TO "lan.dt1";

--
-- Name: missing_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.missing_tasks_id_seq OWNED BY public.missing_tasks.id;


--
-- Name: office_time; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.office_time (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "employeeId" integer NOT NULL,
    "startWork1" timestamp(3) without time zone,
    "startLunch" timestamp(3) without time zone,
    "startWork2" timestamp(3) without time zone,
    "startAfternoonBreak" timestamp(3) without time zone,
    "startWork3" timestamp(3) without time zone,
    "endWorkday" timestamp(3) without time zone,
    "workReportTotal" integer DEFAULT 0 NOT NULL,
    "actualWorked" integer,
    delta integer,
    explanation text,
    "approvalStatus" public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    "approvedById" integer,
    "approvedDelta" integer,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.office_time OWNER TO "lan.dt1";

--
-- Name: office_time_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.office_time_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.office_time_id_seq OWNER TO "lan.dt1";

--
-- Name: office_time_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.office_time_id_seq OWNED BY public.office_time.id;


--
-- Name: password_vault; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.password_vault (
    id integer NOT NULL,
    scope public."VaultScope" NOT NULL,
    "entityName" text,
    "customerId" integer,
    "serviceApp" text,
    "loginUrl" text,
    username text,
    "emailUsed" text,
    "passwordEncrypted" text NOT NULL,
    "twoFaMethod" text,
    "twoFaBackup" text,
    "ownerId" integer,
    "createdDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastUpdated" timestamp(3) without time zone NOT NULL,
    "rotationDays" integer,
    notes text
);


ALTER TABLE public.password_vault OWNER TO "lan.dt1";

--
-- Name: password_vault_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.password_vault_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_vault_id_seq OWNER TO "lan.dt1";

--
-- Name: password_vault_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.password_vault_id_seq OWNED BY public.password_vault.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "employeeId" integer NOT NULL,
    type public."PaymentType" NOT NULL,
    amount numeric(10,2) NOT NULL,
    notes text,
    "summaryMonth" integer,
    "summaryYear" integer,
    "createdById" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payments OWNER TO "lan.dt1";

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO "lan.dt1";

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: salary_history; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.salary_history (
    id integer NOT NULL,
    "employeeId" integer NOT NULL,
    field text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "changedById" integer NOT NULL,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.salary_history OWNER TO "lan.dt1";

--
-- Name: salary_history_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.salary_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_history_id_seq OWNER TO "lan.dt1";

--
-- Name: salary_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.salary_history_id_seq OWNED BY public.salary_history.id;


--
-- Name: salary_summary; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.salary_summary (
    id integer NOT NULL,
    "employeeId" integer NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "creditedHours" numeric(8,2) DEFAULT 0 NOT NULL,
    "workHoursReal" numeric(8,2) DEFAULT 0 NOT NULL,
    "learnHours" numeric(8,2) DEFAULT 0 NOT NULL,
    "deltaHours" numeric(8,2) DEFAULT 0 NOT NULL,
    "salaryCalc" numeric(10,2) DEFAULT 0 NOT NULL,
    "bonusCalc" numeric(10,2) DEFAULT 0 NOT NULL,
    "totalCalc" numeric(10,2) DEFAULT 0 NOT NULL,
    "salaryPaid" numeric(10,2) DEFAULT 0 NOT NULL,
    "bonusPaid" numeric(10,2) DEFAULT 0 NOT NULL,
    "moneyReceived" numeric(10,2) DEFAULT 0 NOT NULL,
    "deltaMoney" numeric(10,2) DEFAULT 0 NOT NULL,
    "scoreWorkSpeed" numeric(5,2),
    "scoreQuality" numeric(5,2),
    "scoreLearning" numeric(5,2),
    "scoreDeadlines" numeric(5,2),
    "scoreInitiative" numeric(5,2),
    "totalScore" numeric(5,2),
    "totalTasks" integer DEFAULT 0 NOT NULL,
    "completedTasks" integer DEFAULT 0 NOT NULL,
    "openTasks" integer DEFAULT 0 NOT NULL,
    "overdueTasks" integer DEFAULT 0 NOT NULL,
    "totalActualTimeH" numeric(8,2) DEFAULT 0 NOT NULL,
    "completionRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "confirmedById" integer,
    "confirmedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.salary_summary OWNER TO "lan.dt1";

--
-- Name: salary_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.salary_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_summary_id_seq OWNER TO "lan.dt1";

--
-- Name: salary_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.salary_summary_id_seq OWNED BY public.salary_summary.id;


--
-- Name: task_library; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.task_library (
    id integer NOT NULL,
    "taskId" text NOT NULL,
    "taskName" text NOT NULL,
    description text,
    "stdTime" integer NOT NULL,
    department text,
    "linkTemplate" text,
    note1 text,
    note2 text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.task_library OWNER TO "lan.dt1";

--
-- Name: task_library_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.task_library_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_library_id_seq OWNER TO "lan.dt1";

--
-- Name: task_library_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.task_library_id_seq OWNED BY public.task_library.id;


--
-- Name: team_departments; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.team_departments (
    "teamId" integer NOT NULL,
    "departmentId" integer NOT NULL
);


ALTER TABLE public.team_departments OWNER TO "lan.dt1";

--
-- Name: teams; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name text NOT NULL,
    code text,
    "leadId" integer,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.teams OWNER TO "lan.dt1";

--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_id_seq OWNER TO "lan.dt1";

--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: time_checks; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.time_checks (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "employeeId" integer NOT NULL,
    "taskId" text,
    "currentStdTime" integer NOT NULL,
    "actualTime" integer NOT NULL,
    "proposedStdTime" integer NOT NULL,
    difference integer,
    reason text,
    "videoLink" text NOT NULL,
    "videoDuration" integer,
    "timeCheckType" public."TimeCheckType",
    status public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    "reviewedById" integer,
    "decisionNote" text,
    "approvedTime" integer,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.time_checks OWNER TO "lan.dt1";

--
-- Name: time_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.time_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_checks_id_seq OWNER TO "lan.dt1";

--
-- Name: time_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.time_checks_id_seq OWNED BY public.time_checks.id;


--
-- Name: vault_access_log; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.vault_access_log (
    id integer NOT NULL,
    "vaultId" integer NOT NULL,
    "accessedById" integer NOT NULL,
    "accessedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    action text
);


ALTER TABLE public.vault_access_log OWNER TO "lan.dt1";

--
-- Name: vault_access_log_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.vault_access_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vault_access_log_id_seq OWNER TO "lan.dt1";

--
-- Name: vault_access_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.vault_access_log_id_seq OWNED BY public.vault_access_log.id;


--
-- Name: work_list; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.work_list (
    id integer NOT NULL,
    "wlId" text NOT NULL,
    "dateAssigned" timestamp(3) without time zone NOT NULL,
    title text NOT NULL,
    description text,
    "customerId" integer,
    "assignedToId" integer NOT NULL,
    "assignedById" integer NOT NULL,
    priority public."Priority" DEFAULT 'NORMAL'::public."Priority" NOT NULL,
    "dueDate" timestamp(3) without time zone,
    status public."WorkStatus" DEFAULT 'NOT_STARTED'::public."WorkStatus" NOT NULL,
    "progressPct" integer DEFAULT 0 NOT NULL,
    "lastUpdate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reasonNextAction" text,
    "totalActualTime" integer DEFAULT 0 NOT NULL,
    "completedDate" timestamp(3) without time zone,
    "isOverdue" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category text,
    "testerId" integer,
    "linkTemplate" text,
    note1 text,
    note2 text,
    "stdTime" integer,
    "taskCode" text
);


ALTER TABLE public.work_list OWNER TO "lan.dt1";

--
-- Name: work_list_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.work_list_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_list_id_seq OWNER TO "lan.dt1";

--
-- Name: work_list_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.work_list_id_seq OWNED BY public.work_list.id;


--
-- Name: work_reports; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.work_reports (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "employeeId" integer NOT NULL,
    "taskId" text,
    quantity integer DEFAULT 1 NOT NULL,
    "taskName" text,
    description text,
    "stdTime" integer,
    "actualTime" integer NOT NULL,
    delta integer,
    "creditedTime" integer,
    "completionPct" integer DEFAULT 100 NOT NULL,
    "stdTimeIssue" boolean DEFAULT false NOT NULL,
    "videoCount" integer DEFAULT 0 NOT NULL,
    "videoDuration" integer DEFAULT 0 NOT NULL,
    "videoLink" text,
    note text,
    link text,
    link2 text,
    link3 text,
    link4 text,
    "wlId" text,
    "customerId" integer,
    rating integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.work_reports OWNER TO "lan.dt1";

--
-- Name: work_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.work_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_reports_id_seq OWNER TO "lan.dt1";

--
-- Name: work_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.work_reports_id_seq OWNED BY public.work_reports.id;


--
-- Name: work_rules; Type: TABLE; Schema: public; Owner: lan.dt1
--

CREATE TABLE public.work_rules (
    id integer NOT NULL,
    "ruleNo" integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "effectiveDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.work_rules OWNER TO "lan.dt1";

--
-- Name: work_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: lan.dt1
--

CREATE SEQUENCE public.work_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_rules_id_seq OWNER TO "lan.dt1";

--
-- Name: work_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lan.dt1
--

ALTER SEQUENCE public.work_rules_id_seq OWNED BY public.work_rules.id;


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: leaves id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.leaves ALTER COLUMN id SET DEFAULT nextval('public.leaves_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: missing_tasks id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.missing_tasks ALTER COLUMN id SET DEFAULT nextval('public.missing_tasks_id_seq'::regclass);


--
-- Name: office_time id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.office_time ALTER COLUMN id SET DEFAULT nextval('public.office_time_id_seq'::regclass);


--
-- Name: password_vault id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.password_vault ALTER COLUMN id SET DEFAULT nextval('public.password_vault_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: salary_history id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.salary_history ALTER COLUMN id SET DEFAULT nextval('public.salary_history_id_seq'::regclass);


--
-- Name: salary_summary id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.salary_summary ALTER COLUMN id SET DEFAULT nextval('public.salary_summary_id_seq'::regclass);


--
-- Name: task_library id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.task_library ALTER COLUMN id SET DEFAULT nextval('public.task_library_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: time_checks id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.time_checks ALTER COLUMN id SET DEFAULT nextval('public.time_checks_id_seq'::regclass);


--
-- Name: vault_access_log id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.vault_access_log ALTER COLUMN id SET DEFAULT nextval('public.vault_access_log_id_seq'::regclass);


--
-- Name: work_list id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_list ALTER COLUMN id SET DEFAULT nextval('public.work_list_id_seq'::regclass);


--
-- Name: work_reports id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_reports ALTER COLUMN id SET DEFAULT nextval('public.work_reports_id_seq'::regclass);


--
-- Name: work_rules id; Type: DEFAULT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_rules ALTER COLUMN id SET DEFAULT nextval('public.work_rules_id_seq'::regclass);


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public."Role" (id, name, label, permissions, "createdAt", color, description, "updatedAt") FROM stdin;
1	MANAGER	Manager	{"salary": {"read": true, "scope": "team"}, "workList": {"read": true, "scope": "team", "create": true, "update": true}, "employees": {"read": true, "scope": "team"}, "officeTime": {"read": true, "scope": "team", "approve": true}, "workReport": {"read": true, "scope": "team", "approve": true}}	2026-05-06 07:05:26.498	\N	\N	2026-05-07 10:49:59.965
2	SUPER_ADMIN	Super Admin	{"all": true}	2026-05-06 07:05:26.498	\N	\N	2026-05-07 10:49:59.965
4	TEAM_LEAD	Team Lead	{"workList": {"read": true, "scope": "team", "create": true, "update": true}, "timeCheck": {"scope": "team", "approve": true}, "workReport": {"read": true, "scope": "team", "approve": true}, "missingTasks": {"scope": "team", "approve": true}}	2026-05-06 07:05:26.498	\N	\N	2026-05-07 10:49:59.965
6	HR	HR	{"leave": {"read": true, "create": true, "update": true, "approve": true}, "employees": {"read": true, "create": true, "update": true}}	2026-05-06 07:05:26.498	\N	\N	2026-05-07 10:49:59.965
7	ADMIN	Admin	{"salary": {"read": true, "create": true, "delete": false, "update": true}, "workList": {"read": true, "create": true, "delete": true, "update": true}, "employees": {"read": true, "create": true, "delete": false, "update": true}, "officeTime": {"read": true, "create": true, "approve": true}, "workReport": {"read": true, "create": true, "update": true, "approve": true}}	2026-05-06 07:05:26.498	\N	\N	2026-05-07 10:49:59.965
5	EMPLOYEE	Nhân viên	{"leave": true, "roles": false, "vault": true, "summary": true, "messages": true, "payments": false, "customers": false, "dashboard": true, "employees": false, "work_list": true, "time_check": true, "work_rules": true, "departments": false, "office_time": true, "work_report": true, "task_library": true, "missing_tasks": true}	2026-05-06 07:05:26.498	\N	\N	2026-05-07 07:40:22.75
3	ACCOUNTANT	Kế toán	{"leave": true, "roles": false, "vault": true, "summary": true, "messages": true, "payments": true, "customers": false, "dashboard": true, "employees": true, "work_list": true, "time_check": true, "work_rules": false, "departments": false, "office_time": true, "work_report": true, "task_library": true, "missing_tasks": true}	2026-05-06 07:05:26.498	\N	\N	2026-05-07 07:41:00.08
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.audit_log (id, "tableName", "recordId", action, "oldData", "newData", "changedById", "changedAt", "ipAddress") FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.customers (id, "custId", "customerName", "businessName", "contactPerson", phone, email, address, city, plz, website, "vatTaxId", "preferredLanguage", status, "responsibleStaffId", "lastContactDate", notes, "createdAt") FROM stdin;
1	C001	Anna Schmidt	Ht-nails.com	Anna Schmidt	+49 123 456 789	anna@ht-nails.com	\N	München	80333	\N	\N	German	ACTIVE	3	2026-04-17 00:00:00	Dự án ht-nails.com — trang web nail salon	2026-05-06 07:05:26.663
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.departments (id, name, code, description, "headId", "isActive", "createdAt", "updatedAt") FROM stdin;
1	Phòng IT	DEV	\N	3	t	2026-05-07 04:16:39.54	2026-05-07 04:16:39.54
2	Phòng marketing	MARK	\N	1	t	2026-05-07 04:17:08.451	2026-05-07 04:17:08.451
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.employees (id, "employeeCode", "fullName", "avatarUrl", department, "roleId", company, "emailCompany", "emailGoogle", "emailPrivate", "mobileCompany", "payType", "hourlyRate", "monthlySalary", "maxHoursMonth", "bonusMPct", "bonusAPct", "bonusTPct", "driveLink1", "driveLink2", "driveLink3", "driveLink4", "startDate", "managerId", status, "passwordHash", "createdAt", "updatedAt", "departmentId", "teamId") FROM stdin;
1	EMP001	Admin Hệ Thống	\N	Management	7	Hung IT/GM	admin@hung-it-solutions.com	\N	\N	\N	MONTHLY	\N	3000.00	160	0.00	0.00	0.00	\N	\N	\N	\N	2023-01-01 00:00:00	\N	ACTIVE	$2b$10$pEreKifuqBDdQ9mooM9O9OunQ0u3KEgzm/EMUacQa6DtJXZagX0ZC	2026-05-06 07:05:26.616	2026-05-06 07:05:26.616	\N	\N
2	EMP002	Lê Văn Quản	\N	Dev	1	Hung IT/GM	manager@hung-it-solutions.com	\N	\N	\N	HOURLY	15.00	\N	180	0.00	0.00	0.00	\N	\N	\N	\N	2023-03-01 00:00:00	1	ACTIVE	$2b$10$pEreKifuqBDdQ9mooM9O9OunQ0u3KEgzm/EMUacQa6DtJXZagX0ZC	2026-05-06 07:05:26.624	2026-05-06 07:05:26.624	\N	\N
4	EMP008	Nguyễn Văn An	\N	Dev	5	Hung IT/GM	nv2@hung-it-solutions.com	\N	\N	\N	HOURLY	12.00	\N	160	0.00	0.00	0.00	\N	\N	\N	\N	2024-06-01 00:00:00	3	ACTIVE	$2b$10$pEreKifuqBDdQ9mooM9O9OunQ0u3KEgzm/EMUacQa6DtJXZagX0ZC	2026-05-06 07:05:26.628	2026-05-06 07:05:26.628	\N	\N
3	EMP015	Đỗ Lan	\N	Dev & Team Lead	4	Hung IT/GM	lanit@hung-it-solutions.com	lanit@hung-it-solutions.com	\N	0387990180	HOURLY	10.00	\N	160	0.00	0.00	0.00	https://drive.google.com/drive/folders/1gtU3qlcFI3aMBTz2z80ioSKTDObCLAxx	https://drive.google.com/drive/folders/1mFbEs13a5YOUaSOAh2gZI0RXJ38N9y98	\N	\N	2024-01-01 00:00:00	3	ACTIVE	$2b$10$pEreKifuqBDdQ9mooM9O9OunQ0u3KEgzm/EMUacQa6DtJXZagX0ZC	2026-05-06 07:05:26.626	2026-05-07 04:48:38.192	1	1
5	LAN1	Hà Thế Huynh	\N	\N	5	Hung IT	huynh@hung-it-solutions.com	huynh@hung-it-solutions.com	\N	0368397810	HOURLY	8.00	\N	160	0.00	0.00	0.00	\N	\N	\N	\N	2025-02-10 00:00:00	3	ACTIVE	$2b$10$QH7iUxtMxK6/N6E1dvQbPuHe3WsWryB8XXbZJvxKaQ2cnl3.N8L/W	2026-05-07 07:30:54.68	2026-05-07 07:34:10.752	1	1
\.


--
-- Data for Name: leaves; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.leaves (id, date, "employeeId", type, "requestedHours", reason, "evidenceLink", status, "approvedHours", "approvalNote", "approvedById", "approvedAt", money, "createdAt") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.messages (id, date, "time", channel, "customerId", subject, "messageSummary", "actionRequired", "assignedToId", "dueDate", status, "linkFile", "followUpNote", "closedDate", tags, "valueType", "companyAnswer", "supportTime", "benefitTime", "netTime", "createdAt") FROM stdin;
\.


--
-- Data for Name: missing_tasks; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.missing_tasks (id, date, "employeeId", "taskName", description, quantity, "timeAllotted", "videoLink", "videoDuration", "dateRecorded", "reasonNote", status, "approvedTime", "bonusTime", "reviewedById", "decisionNote", "reviewedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: office_time; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.office_time (id, date, "employeeId", "startWork1", "startLunch", "startWork2", "startAfternoonBreak", "startWork3", "endWorkday", "workReportTotal", "actualWorked", delta, explanation, "approvalStatus", "approvedById", "approvedDelta", "approvedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: password_vault; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.password_vault (id, scope, "entityName", "customerId", "serviceApp", "loginUrl", username, "emailUsed", "passwordEncrypted", "twoFaMethod", "twoFaBackup", "ownerId", "createdDate", "lastUpdated", "rotationDays", notes) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.payments (id, date, "employeeId", type, amount, notes, "summaryMonth", "summaryYear", "createdById", "createdAt") FROM stdin;
\.


--
-- Data for Name: salary_history; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.salary_history (id, "employeeId", field, "oldValue", "newValue", "changedById", "changedAt") FROM stdin;
\.


--
-- Data for Name: salary_summary; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.salary_summary (id, "employeeId", month, year, "creditedHours", "workHoursReal", "learnHours", "deltaHours", "salaryCalc", "bonusCalc", "totalCalc", "salaryPaid", "bonusPaid", "moneyReceived", "deltaMoney", "scoreWorkSpeed", "scoreQuality", "scoreLearning", "scoreDeadlines", "scoreInitiative", "totalScore", "totalTasks", "completedTasks", "openTasks", "overdueTasks", "totalActualTimeH", "completionRate", "confirmedById", "confirmedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: task_library; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.task_library (id, "taskId", "taskName", description, "stdTime", department, "linkTemplate", note1, note2, "isActive", "createdAt") FROM stdin;
1	DEV01	Tiếp nhận yêu cầu	Nhận yêu cầu từ khách hàng, chủ doanh nghiệp hoặc bộ phận nội bộ	1	Dev	\N	\N	\N	t	2026-05-06 07:05:26.63
2	DEV02	Làm rõ yêu cầu	Hỏi lại những điểm chưa rõ, xác định mục tiêu thật sự của chức năng/dự án	1	Dev	\N	\N	\N	t	2026-05-06 07:05:26.633
3	DEV03	Phân tích nghiệp vụ	Chuyển yêu cầu kinh doanh thành yêu cầu kỹ thuật dễ hiểu cho lập trình viên	1	Dev	\N	\N	\N	t	2026-05-06 07:05:26.634
4	DEV04	Xác định phạm vi công việc	Chốt việc nào làm, việc nào chưa làm, tránh mở rộng ngoài kế hoạch	1	Dev	\N	\N	\N	t	2026-05-06 07:05:26.635
5	DEV05	Chia nhỏ task	Tách dự án lớn thành các đầu việc nhỏ, rõ ràng, có thể giao cho từng người	1	Dev	\N	\N	\N	t	2026-05-06 07:05:26.636
6	DEV06	Ước lượng thời gian	Dự tính thời gian hoàn thành từng task, xác định việc gấp và việc có thể để sau	1	Dev	\N	\N	\N	t	2026-05-06 07:05:26.637
7	DEV07	Phân công công việc	Giao task cho lập trình viên phù hợp với năng lực, kinh nghiệm và thời gian	1	Dev	\N	\N	\N	t	2026-05-06 07:05:26.639
8	DEV08	Theo dõi tiến độ	Kiểm tra task đang làm, task bị kẹt, task đã xong, task cần hỗ trợ	1	Dev	\N	\N	\N	t	2026-05-06 07:05:26.639
9	DEV09	Kiểm tra chất lượng đầu ra	Xem chức năng có chạy đúng, giao diện có ổn, dữ liệu có chính xác không	1	Dev	\N	\N	\N	t	2026-05-06 07:05:26.64
10	DEV10	Viết code chức năng	Lập trình theo spec, đảm bảo đúng logic nghiệp vụ	60	Dev	\N	\N	\N	t	2026-05-06 07:05:26.641
11	DEV11	Review code	Đọc và kiểm tra code của người khác, đưa ra nhận xét cải thiện	30	Dev	\N	\N	\N	t	2026-05-06 07:05:26.642
12	DEV12	Fix bug	Tìm nguyên nhân và sửa lỗi được báo cáo	30	Dev	\N	\N	\N	t	2026-05-06 07:05:26.643
13	DEV13	Viết test	Tạo unit test, integration test cho code đã viết	30	Dev	\N	\N	\N	t	2026-05-06 07:05:26.644
14	DEV14	Deploy lên staging	Đưa code lên môi trường staging để kiểm thử	30	Dev	\N	\N	\N	t	2026-05-06 07:05:26.645
15	DEV15	Deploy lên production	Đưa code lên môi trường production sau khi đã test xong	60	Dev	\N	\N	\N	t	2026-05-06 07:05:26.646
16	DEV16	Viết tài liệu kỹ thuật	Ghi lại cách hoạt động, cấu trúc, hướng dẫn sử dụng API/module	30	Dev	\N	\N	\N	t	2026-05-06 07:05:26.647
17	ADM01	Họp nội bộ	Tham gia cuộc họp nhóm hoặc công ty	60	Admin	\N	\N	\N	t	2026-05-06 07:05:26.648
18	ADM02	Báo cáo tiến độ	Cập nhật tình trạng công việc cho quản lý hoặc khách hàng	15	Admin	\N	\N	\N	t	2026-05-06 07:05:26.65
19	ADM03	Xử lý email công việc	Đọc, trả lời, phân loại email liên quan đến dự án	15	Admin	\N	\N	\N	t	2026-05-06 07:05:26.651
20	1001	Học & Tìm hiểu	Tự học, nghiên cứu công nghệ mới hoặc kiến thức liên quan đến công việc. BẮT BUỘC: link tài liệu + note tóm tắt + video minh họa	60	All	\N	\N	\N	t	2026-05-06 07:05:26.652
21	2001	Việc mới (chưa có trong Task Library)	Công việc phát sinh chưa có Task ID. Quantity = số phút thực hiện. BẮT BUỘC: video + link tài liệu + note	1	All	\N	\N	\N	t	2026-05-06 07:05:26.661
22	2002	Việc mới dạng 2	Tương tự 2001 cho các công việc nhóm 2. BẮT BUỘC: video + link tài liệu	1	All	\N	\N	\N	t	2026-05-06 07:05:26.662
23	DEV110	Tìm hiểu hướng phát triển trang vietnam-work.com	- Viết lại bản kế hoạch\n- Dự định cho sự phát triển	120	Dev				t	2026-05-07 08:15:13.743
\.


--
-- Data for Name: team_departments; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.team_departments ("teamId", "departmentId") FROM stdin;
1	1
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.teams (id, name, code, "leadId", description, "isActive", "createdAt", "updatedAt") FROM stdin;
1	Teams của Lan	LAN	3	\N	t	2026-05-07 04:17:52.565	2026-05-07 04:17:52.565
\.


--
-- Data for Name: time_checks; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.time_checks (id, date, "employeeId", "taskId", "currentStdTime", "actualTime", "proposedStdTime", difference, reason, "videoLink", "videoDuration", "timeCheckType", status, "reviewedById", "decisionNote", "approvedTime", "reviewedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: vault_access_log; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.vault_access_log (id, "vaultId", "accessedById", "accessedAt", action) FROM stdin;
\.


--
-- Data for Name: work_list; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.work_list (id, "wlId", "dateAssigned", title, description, "customerId", "assignedToId", "assignedById", priority, "dueDate", status, "progressPct", "lastUpdate", "reasonNextAction", "totalActualTime", "completedDate", "isOverdue", "createdAt", category, "testerId", "linkTemplate", note1, note2, "stdTime", "taskCode") FROM stdin;
1	WL-0001	2026-05-01 00:00:00	Thiết kế giao diện trang chủ Ht-nails	Thiết kế và code giao diện trang chủ theo mockup đã duyệt	1	3	2	HIGH	2026-05-15 00:00:00	IN_PROGRESS	60	2026-05-06 07:05:26.668	\N	0	\N	f	2026-05-06 07:05:26.668	\N	\N	\N	\N	\N	\N	\N
3	WL-0003	2026-05-03 00:00:00	Viết tài liệu hướng dẫn sử dụng	Hướng dẫn cho khách hàng cách dùng trang admin	\N	3	2	NORMAL	2026-05-20 00:00:00	NOT_STARTED	0	2026-05-06 07:05:26.678	\N	0	\N	f	2026-05-06 07:05:26.678	\N	\N	\N	\N	\N	\N	\N
2	WL-0002	2026-05-02 00:00:00	Fix bug form đặt lịch	Form booking không gửi được email xác nhận	1	4	3	CRITICAL	2026-05-07 00:00:00	IN_PROGRESS	80	2026-05-06 07:05:26.672	\N	0	\N	t	2026-05-06 07:05:26.672	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: work_reports; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.work_reports (id, date, "employeeId", "taskId", quantity, "taskName", description, "stdTime", "actualTime", delta, "creditedTime", "completionPct", "stdTimeIssue", "videoCount", "videoDuration", "videoLink", note, link, link2, link3, link4, "wlId", "customerId", rating, "createdAt") FROM stdin;
\.


--
-- Data for Name: work_rules; Type: TABLE DATA; Schema: public; Owner: lan.dt1
--

COPY public.work_rules (id, "ruleNo", title, description, "effectiveDate", "createdAt", "updatedAt") FROM stdin;
1	1	Báo cáo công việc cuối ngày	Vào cuối ngày làm việc, nếu trong ngày có phát sinh công việc, vui lòng gửi báo cáo công việc (HR_SYS) để công ty tiện theo dõi và hỗ trợ khi cần. Mỗi task phải có đủ thông tin để người khác hiểu và kiểm tra lại.	\N	2026-05-06 07:05:26.682	2026-05-06 07:05:26.682
2	2	Ưu tiên sử dụng công cụ hỗ trợ	Công ty khuyến khích nhân viên sử dụng các công cụ hỗ trợ phù hợp nhằm tiết kiệm thời gian và nâng cao chất lượng công việc (AI, speech-to-text, ...).	\N	2026-05-06 07:05:26.683	2026-05-06 07:05:26.683
3	3	Quy trình xin hỗ trợ: Tự tra cứu → AI → hỏi đồng nghiệp	Trước khi hỏi đồng nghiệp: (a) Tự tra cứu trong hệ thống, (b) Thử dùng AI để tự giải quyết, (c) Nếu vẫn cần hỏi: gửi câu hỏi kèm link + screenshot + video.	\N	2026-05-06 07:05:26.684	2026-05-06 07:05:26.684
4	4	Tách biệt thông tin cá nhân và công việc	Không sử dụng thông tin cá nhân (email, tài khoản riêng) cho công việc của công ty.	\N	2026-05-06 07:05:26.684	2026-05-06 07:05:26.684
5	5	Quản lý tài khoản & mật khẩu rõ ràng	Các tài khoản tạo cho công ty cần được lưu đầy đủ trong tab Password. Các tài khoản tạo cho khách hàng cần được lưu trong tab riêng của từng khách hàng.	\N	2026-05-06 07:05:26.685	2026-05-06 07:05:26.685
6	6	Về chênh lệch thời gian thực tế	Nếu Actual time > Standard time: bắt buộc quay màn hình kèm audio giải thích, rồi đưa vào Time Check for Tasks để xem xét điều chỉnh std time.	\N	2026-05-06 07:05:26.685	2026-05-06 07:05:26.685
7	7	Duyệt thời gian làm việc & chi phí	Công ty giữ quyền xem xét và duyệt lại thời gian làm việc, cũng như các khoản chi phí hoặc mức lương liên quan, nhằm đảm bảo tính công bằng và thống nhất.	\N	2026-05-06 07:05:26.686	2026-05-06 07:05:26.686
\.


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public."Role_id_seq"', 7, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.departments_id_seq', 2, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.employees_id_seq', 5, true);


--
-- Name: leaves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.leaves_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: missing_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.missing_tasks_id_seq', 1, false);


--
-- Name: office_time_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.office_time_id_seq', 1, false);


--
-- Name: password_vault_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.password_vault_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: salary_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.salary_history_id_seq', 1, false);


--
-- Name: salary_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.salary_summary_id_seq', 1, false);


--
-- Name: task_library_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.task_library_id_seq', 23, true);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.teams_id_seq', 1, true);


--
-- Name: time_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.time_checks_id_seq', 1, false);


--
-- Name: vault_access_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.vault_access_log_id_seq', 1, false);


--
-- Name: work_list_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.work_list_id_seq', 3, true);


--
-- Name: work_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.work_reports_id_seq', 1, false);


--
-- Name: work_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lan.dt1
--

SELECT pg_catalog.setval('public.work_rules_id_seq', 7, true);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: leaves leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: missing_tasks missing_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.missing_tasks
    ADD CONSTRAINT missing_tasks_pkey PRIMARY KEY (id);


--
-- Name: office_time office_time_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.office_time
    ADD CONSTRAINT office_time_pkey PRIMARY KEY (id);


--
-- Name: password_vault password_vault_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.password_vault
    ADD CONSTRAINT password_vault_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: salary_history salary_history_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.salary_history
    ADD CONSTRAINT salary_history_pkey PRIMARY KEY (id);


--
-- Name: salary_summary salary_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.salary_summary
    ADD CONSTRAINT salary_summary_pkey PRIMARY KEY (id);


--
-- Name: task_library task_library_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.task_library
    ADD CONSTRAINT task_library_pkey PRIMARY KEY (id);


--
-- Name: team_departments team_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.team_departments
    ADD CONSTRAINT team_departments_pkey PRIMARY KEY ("teamId", "departmentId");


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: time_checks time_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.time_checks
    ADD CONSTRAINT time_checks_pkey PRIMARY KEY (id);


--
-- Name: vault_access_log vault_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.vault_access_log
    ADD CONSTRAINT vault_access_log_pkey PRIMARY KEY (id);


--
-- Name: work_list work_list_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_list
    ADD CONSTRAINT work_list_pkey PRIMARY KEY (id);


--
-- Name: work_reports work_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_reports
    ADD CONSTRAINT work_reports_pkey PRIMARY KEY (id);


--
-- Name: work_rules work_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_rules
    ADD CONSTRAINT work_rules_pkey PRIMARY KEY (id);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: customers_custId_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX "customers_custId_key" ON public.customers USING btree ("custId");


--
-- Name: departments_code_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX departments_code_key ON public.departments USING btree (code);


--
-- Name: departments_name_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX departments_name_key ON public.departments USING btree (name);


--
-- Name: employees_emailCompany_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX "employees_emailCompany_key" ON public.employees USING btree ("emailCompany");


--
-- Name: employees_employeeCode_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX "employees_employeeCode_key" ON public.employees USING btree ("employeeCode");


--
-- Name: office_time_date_employeeId_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX "office_time_date_employeeId_key" ON public.office_time USING btree (date, "employeeId");


--
-- Name: salary_summary_employeeId_month_year_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX "salary_summary_employeeId_month_year_key" ON public.salary_summary USING btree ("employeeId", month, year);


--
-- Name: task_library_taskId_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX "task_library_taskId_key" ON public.task_library USING btree ("taskId");


--
-- Name: teams_name_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX teams_name_key ON public.teams USING btree (name);


--
-- Name: work_list_wlId_key; Type: INDEX; Schema: public; Owner: lan.dt1
--

CREATE UNIQUE INDEX "work_list_wlId_key" ON public.work_list USING btree ("wlId");


--
-- Name: audit_log audit_log_changedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT "audit_log_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_responsibleStaffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_responsibleStaffId_fkey" FOREIGN KEY ("responsibleStaffId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_headId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_headId_fkey" FOREIGN KEY ("headId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "employees_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employees employees_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "employees_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leaves leaves_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT "leaves_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leaves leaves_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT "leaves_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: messages messages_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: missing_tasks missing_tasks_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.missing_tasks
    ADD CONSTRAINT "missing_tasks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: missing_tasks missing_tasks_reviewedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.missing_tasks
    ADD CONSTRAINT "missing_tasks_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: office_time office_time_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.office_time
    ADD CONSTRAINT "office_time_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: office_time office_time_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.office_time
    ADD CONSTRAINT "office_time_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: password_vault password_vault_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.password_vault
    ADD CONSTRAINT "password_vault_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: password_vault password_vault_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.password_vault
    ADD CONSTRAINT "password_vault_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salary_history salary_history_changedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.salary_history
    ADD CONSTRAINT "salary_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salary_history salary_history_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.salary_history
    ADD CONSTRAINT "salary_history_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: salary_summary salary_summary_confirmedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.salary_summary
    ADD CONSTRAINT "salary_summary_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salary_summary salary_summary_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.salary_summary
    ADD CONSTRAINT "salary_summary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: team_departments team_departments_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.team_departments
    ADD CONSTRAINT "team_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_departments team_departments_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.team_departments
    ADD CONSTRAINT "team_departments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teams teams_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "teams_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: time_checks time_checks_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.time_checks
    ADD CONSTRAINT "time_checks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: time_checks time_checks_reviewedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.time_checks
    ADD CONSTRAINT "time_checks_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: time_checks time_checks_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.time_checks
    ADD CONSTRAINT "time_checks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.task_library("taskId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vault_access_log vault_access_log_accessedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.vault_access_log
    ADD CONSTRAINT "vault_access_log_accessedById_fkey" FOREIGN KEY ("accessedById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vault_access_log vault_access_log_vaultId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.vault_access_log
    ADD CONSTRAINT "vault_access_log_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES public.password_vault(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_list work_list_assignedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_list
    ADD CONSTRAINT "work_list_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_list work_list_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_list
    ADD CONSTRAINT "work_list_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_list work_list_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_list
    ADD CONSTRAINT "work_list_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: work_list work_list_testerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_list
    ADD CONSTRAINT "work_list_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: work_reports work_reports_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_reports
    ADD CONSTRAINT "work_reports_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: work_reports work_reports_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_reports
    ADD CONSTRAINT "work_reports_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_reports work_reports_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_reports
    ADD CONSTRAINT "work_reports_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.task_library("taskId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: work_reports work_reports_wlId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lan.dt1
--

ALTER TABLE ONLY public.work_reports
    ADD CONSTRAINT "work_reports_wlId_fkey" FOREIGN KEY ("wlId") REFERENCES public.work_list("wlId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict aMetdS8XNFaI4doUbqai8GiCZIg7kcRSZXHtfhQd4vgI8MpGRK9Dqdy3ys5cpl9

