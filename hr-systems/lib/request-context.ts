import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
  actorId: number | null;
  clerkUserId: string | null;
  organizationId: string | null;
  sessionId: string | null;
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
  endpoint: string;
  method: string;
}

// Use globalThis to ensure a single AsyncLocalStorage instance across all
// webpack bundles. Without this, Webpack may bundle request-context.ts in
// multiple chunks (route handler bundle vs lib bundle), each getting its
// own AsyncLocalStorage instance, breaking context propagation.
const globalForCtx = globalThis as unknown as {
  __requestContextStorage?: AsyncLocalStorage<RequestContext>;
};

const storage =
  globalForCtx.__requestContextStorage ?? new AsyncLocalStorage<RequestContext>();

if (!globalForCtx.__requestContextStorage) {
  globalForCtx.__requestContextStorage = storage;
}

export function getRequestContext(): RequestContext | null {
  return storage.getStore() ?? null;
}

export function runWithContext<T>(ctx: RequestContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn);
}

export function getActorId(): number | null {
  return getRequestContext()?.actorId ?? null;
}

export function getOrgId(): string | null {
  return getRequestContext()?.organizationId ?? null;
}

export function getClerkUserId(): string | null {
  return getRequestContext()?.clerkUserId ?? null;
}
