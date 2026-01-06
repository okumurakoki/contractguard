import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, CONTRACTS_BUCKET } from '@/lib/supabase';
import { createAuditLog, getRequestInfo } from '@/lib/audit';

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
        counterpartyRef: true,
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
    const { contractTitle, contractType, counterparty, counterpartyId, ourPosition, expiryDate, tags, folderId, editedContent } = body;

    // 既存の契約書を取得
    const existingContract = await prisma.contract.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      select: {
        editedContent: true,
        currentVersion: true,
      },
    });

    if (!existingContract) {
      return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    }

    // editedContentが変更された場合のみバージョンを作成
    if (editedContent !== undefined && editedContent !== existingContract.editedContent) {
      const newVersionNumber = (existingContract.currentVersion || 0) + 1;

      await prisma.$transaction([
        prisma.contractVersion.create({
          data: {
            contractId: id,
            versionNumber: newVersionNumber,
            content: editedContent,
            createdBy: userId,
            changesSummary: '編集内容を保存',
          },
        }),
        prisma.contract.update({
          where: { id },
          data: {
            currentVersion: newVersionNumber,
            editedContent,
            ...(contractTitle && { contractTitle }),
            ...(contractType && { contractType }),
            ...(counterparty !== undefined && { counterparty }),
            ...(counterpartyId !== undefined && { counterpartyId: counterpartyId || null }),
            ...(ourPosition !== undefined && { ourPosition: ourPosition || null }),
            ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
            ...(tags && { tags }),
            ...(folderId !== undefined && { folderId }),
          },
        }),
      ]);
    } else {
      // editedContent以外のフィールドのみ更新
      await prisma.contract.updateMany({
        where: {
          id,
          organizationId: user.organizationId,
        },
        data: {
          ...(contractTitle && { contractTitle }),
          ...(contractType && { contractType }),
          ...(counterparty !== undefined && { counterparty }),
          ...(counterpartyId !== undefined && { counterpartyId: counterpartyId || null }),
          ...(ourPosition !== undefined && { ourPosition: ourPosition || null }),
          ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
          ...(tags && { tags }),
          ...(folderId !== undefined && { folderId }),
          ...(editedContent !== undefined && { editedContent }),
        },
      });
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

    // 監査ログを記録
    const { ipAddress, userAgent } = getRequestInfo(request);
    await createAuditLog({
      organizationId: user.organizationId,
      userId,
      action: 'delete',
      resourceType: 'contract',
      resourceId: id,
      ipAddress,
      userAgent,
      metadata: { fileName: contract.fileName },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contract error:', error);
    return NextResponse.json({ error: '契約書の削除に失敗しました' }, { status: 500 });
  }
}
