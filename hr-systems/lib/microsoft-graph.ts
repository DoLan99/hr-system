import { prisma } from "@/lib/prisma";

const MS_GRAPH_BASE = "https://graph.microsoft.com/v1.0";

const CLIENT_ID = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;
const TENANT_ID = process.env.AZURE_TENANT_ID!;
const REDIRECT_URI = process.env.AZURE_REDIRECT_URI!;

export const MS_SCOPES = [
  "offline_access",
  "User.Read",
  "Files.ReadWrite.All",
  "Sites.ReadWrite.All",
].join(" ");

// ── OAuth2 helpers ──────────────────────────────────────────

export function getMsAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: MS_SCOPES,
    response_mode: "query",
    state,
  });
  return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<MsTokenResponse> {
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        scope: MS_SCOPES,
      }),
    },
  );
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<MsTokenResponse> {
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: MS_SCOPES,
      }),
    },
  );
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json();
}

// ── Token storage ───────────────────────────────────────────

export async function saveToken(orgId: string, token: MsTokenResponse) {
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);

  // Lấy thông tin user từ Graph
  let msUserId: string | undefined;
  let msUserEmail: string | undefined;
  let msUserName: string | undefined;
  try {
    const me = await graphGet<{ id: string; mail: string; displayName: string }>(
      token.access_token,
      "/me",
    );
    msUserId = me.id;
    msUserEmail = me.mail;
    msUserName = me.displayName;
  } catch {
    // không critical
  }

  await prisma.microsoftToken.upsert({
    where: { organizationId: orgId },
    create: {
      organizationId: orgId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
      scope: token.scope,
      msUserId,
      msUserEmail,
      msUserName,
    },
    update: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
      scope: token.scope,
      msUserId,
      msUserEmail,
      msUserName,
    },
  });
}

/** Lấy access token còn hạn; tự refresh nếu sắp hết hạn (< 5 phút). */
export async function getValidAccessToken(orgId: string): Promise<string> {
  const record = await prisma.microsoftToken.findUnique({
    where: { organizationId: orgId },
  });
  if (!record) throw new MsNotConnectedError();

  const fiveMin = 5 * 60 * 1000;
  if (record.expiresAt.getTime() - Date.now() > fiveMin) {
    return record.accessToken;
  }

  // Refresh
  const fresh = await refreshAccessToken(record.refreshToken);
  await saveToken(orgId, fresh);
  return fresh.access_token;
}

export async function disconnectToken(orgId: string) {
  await prisma.microsoftToken.deleteMany({ where: { organizationId: orgId } });
}

// ── Graph API fetch helpers ─────────────────────────────────

async function graphGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${MS_GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new GraphApiError(res.status, body);
  }
  return res.json();
}

async function graphPost<T>(
  accessToken: string,
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${MS_GRAPH_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new GraphApiError(res.status, errBody);
  }
  return res.json();
}

async function graphDelete(accessToken: string, path: string): Promise<void> {
  const res = await fetch(`${MS_GRAPH_BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new GraphApiError(res.status, await res.text());
}

// ── Drive operations ────────────────────────────────────────

export type DriveItem = {
  id: string;
  name: string;
  size?: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  "@microsoft.graph.downloadUrl"?: string;
  parentReference?: { id: string; path: string };
};

/** List children của thư mục. itemId = "root" để xem root. */
export async function listDriveItems(
  accessToken: string,
  itemId: string = "root",
): Promise<DriveItem[]> {
  const data = await graphGet<{ value: DriveItem[] }>(
    accessToken,
    `/me/drive/items/${itemId}/children?$select=id,name,size,createdDateTime,lastModifiedDateTime,webUrl,folder,file,parentReference&$orderby=name`,
  );
  return data.value;
}

export async function getDriveItem(
  accessToken: string,
  itemId: string,
): Promise<DriveItem> {
  return graphGet<DriveItem>(
    accessToken,
    `/me/drive/items/${itemId}?$select=id,name,size,createdDateTime,lastModifiedDateTime,webUrl,folder,file,parentReference,@microsoft.graph.downloadUrl`,
  );
}

export async function searchDriveItems(
  accessToken: string,
  query: string,
): Promise<DriveItem[]> {
  const data = await graphGet<{ value: DriveItem[] }>(
    accessToken,
    `/me/drive/root/search(q='${encodeURIComponent(query)}')?$select=id,name,size,createdDateTime,lastModifiedDateTime,webUrl,folder,file,parentReference`,
  );
  return data.value;
}

export async function createFolder(
  accessToken: string,
  parentId: string,
  name: string,
): Promise<DriveItem> {
  return graphPost<DriveItem>(accessToken, `/me/drive/items/${parentId}/children`, {
    name,
    folder: {},
    "@microsoft.graph.conflictBehavior": "rename",
  });
}

export async function deleteDriveItem(
  accessToken: string,
  itemId: string,
): Promise<void> {
  await graphDelete(accessToken, `/me/drive/items/${itemId}`);
}

export async function createSharingLink(
  accessToken: string,
  itemId: string,
  type: "view" | "edit" = "view",
  expirationHours: number = 24,
): Promise<{ link: { webUrl: string; type: string } }> {
  const expirationDateTime = new Date(
    Date.now() + expirationHours * 60 * 60 * 1000,
  ).toISOString();
  return graphPost(accessToken, `/me/drive/items/${itemId}/createLink`, {
    type,
    scope: "organization",
    expirationDateTime,
  });
}

/** Upload file nhỏ (< 4MB) dùng simple upload. */
export async function uploadSmallFile(
  accessToken: string,
  parentId: string,
  filename: string,
  content: ArrayBuffer,
  mimeType: string,
): Promise<DriveItem> {
  const res = await fetch(
    `${MS_GRAPH_BASE}/me/drive/items/${parentId}:/${encodeURIComponent(filename)}:/content`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
      },
      body: content,
    },
  );
  if (!res.ok) throw new GraphApiError(res.status, await res.text());
  return res.json();
}

/** Lấy embed URL để xem Office file trong trình duyệt (không cần license đặc biệt). */
export function getOfficeViewerUrl(downloadUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(downloadUrl)}`;
}

// ── Error types ─────────────────────────────────────────────

export class MsNotConnectedError extends Error {
  constructor() {
    super("Microsoft 365 chưa được kết nối cho tổ chức này");
    this.name = "MsNotConnectedError";
  }
}

export class GraphApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Graph API error ${status}: ${body}`);
    this.name = "GraphApiError";
  }
}

// ── Types ────────────────────────────────────────────────────

type MsTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
};
