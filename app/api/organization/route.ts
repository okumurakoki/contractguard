import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 組織情報を取得
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

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        companyAddress: true,
        companyRepresentative: true,
        companyRepTitle: true,
        billingEmail: true,
        planType: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: '組織が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Organization GET error:', error);
    return NextResponse.json({ error: '組織情報の取得に失敗しました' }, { status: 500 });
  }
}

// 組織情報を更新
export async function PATCH(request: NextRequest) {
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

    // 管理者権限チェック
    if (user.role !== 'admin') {
      return NextResponse.json({ error: '組織情報の編集には管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const { name, companyAddress, companyRepresentative, companyRepTitle, billingEmail } = body;

    const organization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        ...(name !== undefined && { name }),
        ...(companyAddress !== undefined && { companyAddress }),
        ...(companyRepresentative !== undefined && { companyRepresentative }),
        ...(companyRepTitle !== undefined && { companyRepTitle }),
        ...(billingEmail !== undefined && { billingEmail }),
      },
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Organization PATCH error:', error);
    return NextResponse.json({ error: '組織情報の更新に失敗しました' }, { status: 500 });
  }
}
