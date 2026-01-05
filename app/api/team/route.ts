import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendInvitationEmail } from '@/lib/email';

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

    // 組織のメンバー一覧を取得
    const members = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'asc' },
    });

    // 招待中のユーザー一覧を取得（未承諾かつ期限切れでない）
    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: user.organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 組織のプラン情報を取得（メンバー上限）
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { planType: true },
    });

    const planLimits: Record<string, number> = {
      lite: 1,
      standard: 3,
      premium: 10,
      enterprise: 9999,
    };

    const maxMembers = planLimits[organization?.planType || 'lite'] || 1;

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        status: 'active',
        joinedAt: m.createdAt,
        avatar: undefined,
      })),
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: 'invited',
        createdAt: inv.createdAt,
      })),
      maxMembers,
      currentCount: members.length + invitations.length,
    });
  } catch (error) {
    console.error('Team API error:', error);
    return NextResponse.json({ error: 'チーム情報の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'メールアドレスと権限は必須です' }, { status: 400 });
    }

    // 既存メンバーチェック
    const existingMember = await prisma.user.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 400 });
    }

    // 既存招待チェック
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'このメールアドレスには既に招待を送信済みです' }, { status: 400 });
    }

    // 招待トークンを生成
    const token = crypto.randomUUID();

    // 組織名を取得
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    });

    // 招待を作成
    const invitation = await prisma.invitation.create({
      data: {
        organizationId: user.organizationId,
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
      },
    });

    // 招待メールを送信
    const emailResult = await sendInvitationEmail({
      to: email,
      inviterName: user.name || 'チームメンバー',
      organizationName: organization?.name || 'ContractGuard',
      token,
      role,
    });

    if (!emailResult.success) {
      console.warn('Invitation email failed:', emailResult.error);
      // メール送信失敗してもDBには保存済みなので続行
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
      },
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error('Invitation API error:', error);
    return NextResponse.json({ error: '招待の送信に失敗しました' }, { status: 500 });
  }
}
