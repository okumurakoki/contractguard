import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, CONTRACTS_BUCKET } from '@/lib/supabase';

// 契約書詳細取得
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

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        review: {
          include: {
            riskItems: true,
          },
        },
        folder: true,
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    }

    // 署名付きURLを生成（1時間有効）
    const { data: signedUrl } = await supabaseAdmin.storage
      .from(CONTRACTS_BUCKET)
      .createSignedUrl(contract.filePath, 3600);

    return NextResponse.json({
      contract: {
        ...contract,
        fileUrl: signedUrl?.signedUrl,
      },
    });
  } catch (error) {
    console.error('Get contract error:', error);
    return NextResponse.json({ error: '契約書の取得に失敗しました' }, { status: 500 });
  }
}

// 契約書更新
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

    const body = await request.json();
    const { contractTitle, contractType, counterparty, expiryDate, tags, folderId } = body;

    const contract = await prisma.contract.updateMany({
      where: {
        id,
        organizationId: user.organizationId,
      },
      data: {
        ...(contractTitle && { contractTitle }),
        ...(contractType && { contractType }),
        ...(counterparty !== undefined && { counterparty }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(tags && { tags }),
        ...(folderId !== undefined && { folderId }),
      },
    });

    if (contract.count === 0) {
      return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update contract error:', error);
    return NextResponse.json({ error: '契約書の更新に失敗しました' }, { status: 500 });
  }
}

// 契約書削除
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

    // 契約書を取得
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    }

    // Storageからファイルを削除
    await supabaseAdmin.storage
      .from(CONTRACTS_BUCKET)
      .remove([contract.filePath]);

    // データベースから削除
    await prisma.contract.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contract error:', error);
    return NextResponse.json({ error: '契約書の削除に失敗しました' }, { status: 500 });
  }
}
