import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 招待情報を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '招待が見つかりません' },
        { status: 404 }
      );
    }

    // 有効期限チェック
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'この招待は期限切れです' },
        { status: 410 }
      );
    }

    // 既に承諾済みチェック
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'この招待は既に承諾されています' },
        { status: 400 }
      );
    }

    // 招待者情報を取得
    const inviter = await prisma.user.findFirst({
      where: { organizationId: invitation.organizationId, role: 'admin' },
      select: { name: true },
    });

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        organizationName: invitation.organization.name,
        role: invitation.role,
        inviterName: inviter?.name || 'チームメンバー',
      },
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    return NextResponse.json(
      { error: '招待情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
