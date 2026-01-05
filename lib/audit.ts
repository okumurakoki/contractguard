import { prisma } from '@/lib/prisma';

type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'download'
  | 'analyze'
  | 'invite'
  | 'accept_invite'
  | 'login'
  | 'logout';

type ResourceType =
  | 'contract'
  | 'template'
  | 'folder'
  | 'user'
  | 'organization'
  | 'invitation'
  | 'subscription';

interface AuditLogParams {
  organizationId: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog({
  organizationId,
  userId,
  action,
  resourceType,
  resourceId,
  ipAddress,
  userAgent,
  metadata,
}: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        resourceType,
        resourceId: resourceId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // 監査ログの失敗はメイン処理を止めない
    console.error('Failed to create audit log:', error);
  }
}

// リクエストからIP・UserAgentを取得するヘルパー
export function getRequestInfo(request: Request): {
  ipAddress: string | undefined;
  userAgent: string | undefined;
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  return { ipAddress, userAgent };
}
