import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 取引先一覧を取得
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

    const counterparties = await prisma.counterparty.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ counterparties });
  } catch (error) {
    console.error('Counterparties GET error:', error);
    return NextResponse.json({ error: '取引先の取得に失敗しました' }, { status: 500 });
  }
}

// 取引先を作成
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, shortName, address, representative, repTitle, email, phone, category, notes } = body;

    if (!name) {
      return NextResponse.json({ error: '会社名は必須です' }, { status: 400 });
    }

    const counterparty = await prisma.counterparty.create({
      data: {
        organizationId: user.organizationId,
        name,
        shortName,
        address,
        representative,
        repTitle,
        email,
        phone,
        category,
        notes,
      },
    });

    return NextResponse.json({ counterparty }, { status: 201 });
  } catch (error) {
    console.error('Counterparty POST error:', error);
    return NextResponse.json({ error: '取引先の作成に失敗しました' }, { status: 500 });
  }
}
