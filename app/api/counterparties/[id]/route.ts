import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 取引先を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const counterparty = await prisma.counterparty.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!counterparty) {
      return NextResponse.json({ error: '取引先が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ counterparty });
  } catch (error) {
    console.error('Counterparty GET error:', error);
    return NextResponse.json({ error: '取引先の取得に失敗しました' }, { status: 500 });
  }
}

// 取引先を更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 取引先の存在確認
    const existing = await prisma.counterparty.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: '取引先が見つかりません' }, { status: 404 });
    }

    const body = await request.json();
    const { name, shortName, address, representative, repTitle, email, phone, category, notes } = body;

    const counterparty = await prisma.counterparty.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(shortName !== undefined && { shortName }),
        ...(address !== undefined && { address }),
        ...(representative !== undefined && { representative }),
        ...(repTitle !== undefined && { repTitle }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(category !== undefined && { category }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ counterparty });
  } catch (error) {
    console.error('Counterparty PATCH error:', error);
    return NextResponse.json({ error: '取引先の更新に失敗しました' }, { status: 500 });
  }
}

// 取引先を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 取引先の存在確認
    const existing = await prisma.counterparty.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: '取引先が見つかりません' }, { status: 404 });
    }

    await prisma.counterparty.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Counterparty DELETE error:', error);
    return NextResponse.json({ error: '取引先の削除に失敗しました' }, { status: 500 });
  }
}
