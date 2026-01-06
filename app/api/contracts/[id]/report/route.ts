import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// リスクレベルの色
const riskColors: Record<string, [number, number, number]> = {
  high: [220, 38, 38], // red
  medium: [234, 179, 8], // yellow
  low: [34, 197, 94], // green
};

// リスクレベルの日本語ラベル
const riskLabels: Record<string, string> = {
  high: 'High Risk',
  medium: 'Medium Risk',
  low: 'Low Risk',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await params;

    // 契約書とレビュー結果を取得
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            riskItems: {
              orderBy: [{ riskLevel: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
        uploadedByUser: {
          select: { name: true, email: true },
        },
        organization: {
          select: { name: true },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    }

    // PDFを生成
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // ヘッダー
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Contract Analysis Report', 20, 28);

    // 基本情報セクション
    yPos = 55;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Contract Information', 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    const contractInfo = [
      ['Title', contract.contractTitle || 'Untitled'],
      ['Type', contract.contractType || 'Not specified'],
      ['Counterparty', contract.counterparty || 'Not specified'],
      ['Created', new Date(contract.createdAt).toLocaleDateString('en-US')],
      ['Status', contract.status],
      ['Organization', contract.organization.name],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: contractInfo,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 100 },
      },
      margin: { left: 20 },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    // リスクサマリー
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Risk Summary', 20, yPos);

    yPos += 10;

    if (contract.review) {
      // 総合スコア
      const score = contract.review.overallScore || 0;
      const riskLevel = contract.review.riskLevel;

      // スコア表示
      doc.setFontSize(12);
      doc.text(`Overall Score: ${score}/100`, 20, yPos);

      // リスクレベルバッジ
      const color = riskColors[riskLevel] || [128, 128, 128];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(100, yPos - 6, 40, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(riskLabels[riskLevel] || riskLevel, 103, yPos);

      yPos += 15;

      // リスク統計
      const riskCounts = {
        high: contract.review.riskItems.filter((r) => r.riskLevel === 'high').length,
        medium: contract.review.riskItems.filter((r) => r.riskLevel === 'medium').length,
        low: contract.review.riskItems.filter((r) => r.riskLevel === 'low').length,
      };

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`High Risk Items: ${riskCounts.high}`, 20, yPos);
      doc.text(`Medium Risk Items: ${riskCounts.medium}`, 80, yPos);
      doc.text(`Low Risk Items: ${riskCounts.low}`, 150, yPos);

      yPos += 20;

      // リスク詳細テーブル
      if (contract.review.riskItems.length > 0) {
        doc.setFontSize(16);
        doc.text('Risk Details', 20, yPos);
        yPos += 10;

        const riskData = contract.review.riskItems.map((item, index) => [
          (index + 1).toString(),
          item.riskType || 'N/A',
          item.riskLevel.toUpperCase(),
          (item.originalText || '').substring(0, 50) + (item.originalText && item.originalText.length > 50 ? '...' : ''),
          item.userAction || 'pending',
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Type', 'Level', 'Description', 'Status']],
          body: riskData,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [30, 64, 175] },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 30 },
            2: { cellWidth: 20 },
            3: { cellWidth: 80 },
            4: { cellWidth: 25 },
          },
          margin: { left: 20, right: 20 },
          didParseCell: (data) => {
            if (data.column.index === 2 && data.section === 'body') {
              const level = data.cell.raw?.toString().toLowerCase();
              if (level && riskColors[level]) {
                data.cell.styles.textColor = riskColors[level];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          },
        });

        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // 新しいページが必要な場合
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // 推奨事項
      const acceptedItems = contract.review.riskItems.filter((r) => r.userAction === 'accepted');
      const pendingItems = contract.review.riskItems.filter((r) => r.userAction === 'pending');

      doc.setFontSize(16);
      doc.text('Recommendations', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      if (pendingItems.length > 0) {
        doc.text(`- ${pendingItems.length} risk item(s) require review and decision`, 25, yPos);
        yPos += 6;
      }

      if (acceptedItems.length > 0) {
        doc.text(`- ${acceptedItems.length} suggested modification(s) have been accepted`, 25, yPos);
        yPos += 6;
      }

      if (riskCounts.high > 0) {
        doc.text('- High priority: Address all high-risk items before signing', 25, yPos);
        yPos += 6;
      }

      doc.text('- Consider legal review for complex clauses', 25, yPos);
      yPos += 15;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No analysis data available for this contract.', 20, yPos);
      yPos += 20;
    }

    // フッター
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated by ContractGuard | ${new Date().toLocaleDateString('en-US')} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // PDFをバイナリとして出力
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const fileName = `${contract.contractTitle || 'contract'}_report.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { error: 'レポートの生成に失敗しました' },
      { status: 500 }
    );
  }
}
