import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// 署名欄HTMLを生成
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

    // 契約書と取引先情報を取得
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        counterpartyRef: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    }

    // 組織情報を取得
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: '組織情報が見つかりません' }, { status: 404 });
    }

    // 甲と乙の情報を決定
    const ourPosition = contract.ourPosition || 'kou'; // デフォルトは甲

    const ourInfo = {
      name: organization.name,
      address: organization.companyAddress || '',
      representative: organization.companyRepresentative || '',
      repTitle: organization.companyRepTitle || '代表取締役',
    };

    const counterpartyInfo = contract.counterpartyRef ? {
      name: contract.counterpartyRef.name,
      address: contract.counterpartyRef.address || '',
      representative: contract.counterpartyRef.representative || '',
      repTitle: contract.counterpartyRef.repTitle || '代表取締役',
    } : {
      name: contract.counterparty || '（取引先名）',
      address: '',
      representative: '',
      repTitle: '代表取締役',
    };

    const kouInfo = ourPosition === 'kou' ? ourInfo : counterpartyInfo;
    const otsuInfo = ourPosition === 'kou' ? counterpartyInfo : ourInfo;

    // 現在の日付
    const today = new Date();
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    // 署名欄HTMLを生成
    const signatureHtml = `
<div class="signature-section" style="margin-top: 40px; page-break-inside: avoid;">
  <p style="text-align: center; margin-bottom: 30px;">本契約の成立を証するため、本書2通を作成し、甲乙記名押印の上、各1通を保有する。</p>

  <p style="text-align: center; margin-bottom: 30px;">${dateStr}</p>

  <div style="display: flex; justify-content: space-between; gap: 40px;">
    <div style="flex: 1; border: 1px solid #ccc; padding: 20px;">
      <p style="font-weight: bold; margin-bottom: 15px;">甲</p>
      <p style="margin-bottom: 8px;">住所：${kouInfo.address || '＿＿＿＿＿＿＿＿＿＿＿＿＿＿'}</p>
      <p style="margin-bottom: 8px;">会社名：${kouInfo.name}</p>
      <p style="margin-bottom: 8px;">${kouInfo.repTitle}：${kouInfo.representative || '＿＿＿＿＿＿'}</p>
      <p style="text-align: right; margin-top: 20px;">印</p>
    </div>

    <div style="flex: 1; border: 1px solid #ccc; padding: 20px;">
      <p style="font-weight: bold; margin-bottom: 15px;">乙</p>
      <p style="margin-bottom: 8px;">住所：${otsuInfo.address || '＿＿＿＿＿＿＿＿＿＿＿＿＿＿'}</p>
      <p style="margin-bottom: 8px;">会社名：${otsuInfo.name}</p>
      <p style="margin-bottom: 8px;">${otsuInfo.repTitle}：${otsuInfo.representative || '＿＿＿＿＿＿'}</p>
      <p style="text-align: right; margin-top: 20px;">印</p>
    </div>
  </div>
</div>
`;

    return NextResponse.json({
      signatureHtml,
      kouInfo,
      otsuInfo,
      ourPosition,
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json({ error: '署名欄の生成に失敗しました' }, { status: 500 });
  }
}
