import { Prisma } from "@prisma/client";
import { getOrgId } from "./request-context";

const TENANT_SCOPED_MODELS = new Set<string>([
  "Role",
  "Department",
  "Team",
  "TeamDepartment",
  "Employee",
  "SalaryHistory",
  "Customer",
  "TaskTemplate",
  "Task",
  "TimeLog",
  "OfficeTime",
  "TemplateSuggestion",
  "EstimateFlag",
  "SalarySummary",
  "Payment",
  "Leave",
  "Message",
  "MessageAuditLog",
  "PasswordVault",
  "VaultAccessLog",
  "WorkRule",
  "UserSession",
  "UserActivity",
  "AnomalyAlert",
  "SystemLabel",
]);

const NULLABLE_ORG_MODELS = new Set<string>(["ApiAccessLog", "AuditLog"]);

function shouldFilter(model: string): boolean {
  return TENANT_SCOPED_MODELS.has(model) || NULLABLE_ORG_MODELS.has(model);
}

function withWhereFilter<A extends { where?: any }>(args: A, orgId: string): A {
  return { ...args, where: { ...(args.where ?? {}), organizationId: orgId } } as A;
}

function withDataInject<A extends { data?: any }>(args: A, orgId: string): A {
  const data = args.data;
  if (Array.isArray(data)) {
    return {
      ...args,
      data: data.map((row: any) =>
        row?.organizationId ? row : { ...row, organizationId: orgId },
      ),
    } as A;
  }
  if (data && !data.organizationId) {
    return { ...args, data: { ...data, organizationId: orgId } } as A;
  }
  return args;
}

export function createTenantExtension() {
  return Prisma.defineExtension({
    name: "tenant",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async findFirst({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async findFirstOrThrow({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async count({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async aggregate({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async groupBy({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async create({ model, args, query }) {
          const orgId = getOrgId();
          console.log("[tenant-ext] create", model, "orgId=", orgId, "shouldFilter=", shouldFilter(model));
          return query(orgId && shouldFilter(model) ? withDataInject(args, orgId) : args);
        },
        async createMany({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withDataInject(args, orgId) : args);
        },
        async updateMany({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async deleteMany({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
      },
    },
  });
}
