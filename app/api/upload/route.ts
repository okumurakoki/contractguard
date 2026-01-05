import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, CONTRACTS_BUCKET } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getRequestInfo } from '@/lib/audit';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contractName = formData.get('contractName') as string;
    const contractType = formData.get('contractType') as string;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 });
    }

    // ファイルをバッファに変換
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user.organizationId}/${fileName}`;

    // Supabase Storageにアップロード
    const { error: uploadError } = await supabaseAdmin.storage
      .from(CONTRACTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'ファイルのアップロードに失敗しました' }, { status: 500 });
    }

    // データベースに契約書を登録
    const contract = await prisma.contract.create({
      data: {
        organizationId: user.organizationId,
        uploadedBy: userId,
        fileName: file.name,
        filePath: filePath,
        fileSize: file.size,
        fileType: file.type,
        contractTitle: contractName,
        contractType: contractType,
        folderId: folderId || null,
        status: 'analyzing',
      },
    });

    // 監査ログを記録
    const { ipAddress, userAgent } = getRequestInfo(request);
    await createAuditLog({
      organizationId: user.organizationId,
      userId,
      action: 'create',
      resourceType: 'contract',
      resourceId: contract.id,
      ipAddress,
      userAgent,
      metadata: { fileName: file.name, contractType },
    });

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        fileName: contract.fileName,
        status: contract.status,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}
