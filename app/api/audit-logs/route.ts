import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 管理者のみアクセス可能
    if (user.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 監査ログを取得
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: user.organizationId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt,
        user: log.user?.name || log.user?.email || 'システム',
        action: log.action,
        category: log.resourceType === 'contract' ? 'contract' : 'system',
        target: log.resourceType + (log.resourceId ? `: ${log.resourceId}` : ''),
        details: `${log.action} - ${log.resourceType}`,
        ipAddress: log.ipAddress || '-',
        result: 'success',
      })),
    });
  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ error: '監査ログの取得に失敗しました' }, { status: 500 });
  }
}
