import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// テンプレートから契約書を生成
export async function POST(
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

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'テンプレートが見つかりません' }, { status: 404 });
    }

    // 非公開テンプレートは所属組織のものだけアクセス可能
    if (!template.isPublic && template.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { counterparty, counterpartyId, variables, notes } = body;

    if (!counterparty) {
      return NextResponse.json({ error: '契約相手は必須です' }, { status: 400 });
    }

    // 取引先IDが指定されている場合、存在確認
    if (counterpartyId) {
      const counterpartyRef = await prisma.counterparty.findFirst({
        where: {
          id: counterpartyId,
          organizationId: user.organizationId,
        },
      });
      if (!counterpartyRef) {
        return NextResponse.json({ error: '取引先が見つかりません' }, { status: 404 });
      }
    }

    // テンプレートの変数を置換
    let content = template.content;
    const templateVariables = template.variables as Array<{
      name: string;
      label: string;
    }> | null;

    // 変数を置換
    if (variables && templateVariables) {
      for (const v of templateVariables) {
        const value = variables[v.name] || '';
        // {{変数名}} 形式で置換
        content = content.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), value);
      }
    }

    // 基本的な変数を置換
    content = content.replace(/\{\{counterparty\}\}/g, counterparty);
    content = content.replace(/\{\{date\}\}/g, new Date().toLocaleDateString('ja-JP'));

    // 契約書タイトルを生成
    const contractTitle = `${counterparty}との${template.title}`;

    // 契約書を作成
    const contract = await prisma.contract.create({
      data: {
        organizationId: user.organizationId,
        uploadedBy: userId,
        fileName: `${contractTitle}.html`,
        filePath: `templates/${template.id}/${Date.now()}.html`, // テンプレートからの生成を示すパス
        fileSize: Buffer.byteLength(content, 'utf-8'),
        fileType: 'text/html',
        contractType: template.category,
        contractTitle,
        counterparty,
        counterpartyId: counterpartyId || null,
        status: 'draft',
        editedContent: content,
      },
    });

    // テンプレートの使用回数を更新
    await prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        title: contract.contractTitle,
      },
    });
  } catch (error) {
    console.error('Template generate API error:', error);
    return NextResponse.json({ error: '契約書の生成に失敗しました' }, { status: 500 });
  }
}
