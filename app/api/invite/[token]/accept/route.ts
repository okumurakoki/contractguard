import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 招待を承諾
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { userId } = await auth();
    const { token } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 401 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
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

    // 既存ユーザーかチェック
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      // 既に別の組織に所属している場合はエラー
      if (existingUser.organizationId !== invitation.organizationId) {
        return NextResponse.json(
          { error: '既に別の組織に所属しています' },
          { status: 400 }
        );
      }
    }

    // トランザクションで処理
    await prisma.$transaction(async (tx) => {
      if (existingUser) {
        // 既存ユーザーの権限を更新
        await tx.user.update({
          where: { id: userId },
          data: {
            role: invitation.role,
          },
        });
      } else {
        // 新規ユーザーを作成
        await tx.user.create({
          data: {
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || invitation.email,
            name: clerkUser.firstName
              ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
              : invitation.email.split('@')[0],
            role: invitation.role,
            organizationId: invitation.organizationId,
          },
        });
      }

      // 招待を承諾済みに更新
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    });

    return NextResponse.json({
      success: true,
      organizationName: invitation.organization.name,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: '招待の承諾に失敗しました' },
      { status: 500 }
    );
  }
}
