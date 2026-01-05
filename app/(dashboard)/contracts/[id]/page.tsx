'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  CircularProgress,
  Drawer,
  ListItemButton,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  FileDownload as DownloadIcon,
  Share as ShareIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Description as PdfIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { findBestMatch, findByPrefix, debugMatch } from '@/lib/utils/textMatching';

const ContractEditor = dynamic(() => import('@/components/editor/ContractEditor'), {
  ssr: false,
});

interface RiskItem {
  id: string;
  riskType: string;
  riskLevel: 'high' | 'medium' | 'low';
  sectionTitle: string | null;
  originalText: string | null;
  suggestedText: string | null;
  reason: string | null;
  legalBasis: string | null;
  userAction: string;
}

interface ContractReview {
  id: string;
  riskLevel: string;
  overallScore: number | null;
  risks: any;
  checklist: any;
  riskItems: RiskItem[];
}

interface ContractData {
  id: string;
  fileName: string;
  contractTitle: string | null;
  contractType: string | null;
  counterparty: string | null;
  createdAt: string;
  expiryDate: string | null;
  status: string;
  tags: string[];
  fileUrl: string | null;
  editedContent: string | null;
  review: ContractReview | null;
  uploadedByUser: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ContractVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  changesSummary: string | null;
}

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params.id as string;

  // データ取得状態
  const [contract, setContract] = React.useState<ContractData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // UI状態
  const [success, setSuccess] = React.useState('');
  const [editMode, setEditMode] = React.useState(false);
  const [editorInstance, setEditorInstance] = React.useState<any>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [appliedRisks, setAppliedRisks] = React.useState<string[]>([]);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const ITEMS_PER_PAGE = 3;
  const [editContent, setEditContent] = React.useState('');

  // バージョン履歴
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [versions, setVersions] = React.useState<ContractVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = React.useState(false);
  const [restoringVersion, setRestoringVersion] = React.useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = React.useState<ContractVersion | null>(null);
  const [previewContent, setPreviewContent] = React.useState<string | null>(null);

  // 契約書データを取得
  const fetchContract = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/contracts/${contractId}`);
      if (!response.ok) {
        throw new Error('契約書の取得に失敗しました');
      }
      const data = await response.json();
      setContract(data.contract);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  React.useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  // バージョン履歴を取得
  const fetchVersions = async () => {
    try {
      setLoadingVersions(true);
      const response = await fetch(`/api/contracts/${contractId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  // 履歴パネルを開く
  const handleOpenHistory = () => {
    setHistoryOpen(true);
    fetchVersions();
  };

  // バージョンをプレビュー
  const handlePreviewVersion = async (version: ContractVersion) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/versions/${version.id}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewVersion(version);
        setPreviewContent(data.version.content);
      }
    } catch (err) {
      console.error('Failed to fetch version content:', err);
    }
  };

  // バージョンを復元
  const handleRestoreVersion = async (versionId: string) => {
    try {
      setRestoringVersion(versionId);
      const response = await fetch(`/api/contracts/${contractId}/versions/${versionId}`, {
        method: 'POST',
      });
      if (response.ok) {
        setSuccess('バージョンを復元しました');
        setHistoryOpen(false);
        setPreviewVersion(null);
        setPreviewContent(null);
        fetchContract();
      } else {
        setError('復元に失敗しました');
      }
    } catch (err) {
      setError('復元に失敗しました');
    } finally {
      setRestoringVersion(null);
    }
  };

  // AI分析を実行
  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const response = await fetch(`/api/contracts/${contractId}/analyze`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('分析に失敗しました');
      }
      setSuccess('AI分析が完了しました');
      fetchContract(); // データを再取得
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析に失敗しました');
    } finally {
      setAnalyzing(false);
    }
  };

  // テキスト抽出
  const extractText = async () => {
    try {
      setExtracting(true);
      setError(null);
      console.log('Extracting text for contract:', contractId);
      const response = await fetch(`/api/contracts/${contractId}/extract`);
      console.log('Extract response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Extract error:', errorData);
        throw new Error(errorData.details || 'テキスト抽出に失敗しました');
      }
      const data = await response.json();
      console.log('Extract data:', data);
      if (data.success) {
        setEditContent(data.html);
        return true;
      } else {
        setError(data.error || 'テキストを抽出できませんでした');
        return false;
      }
    } catch (err) {
      console.error('Extract catch error:', err);
      setError(err instanceof Error ? err.message : 'テキスト抽出に失敗しました');
      return false;
    } finally {
      setExtracting(false);
    }
  };

  // 変更追跡の状態変換関数
  const confirmChanges = (content: string): string => {
    return content.replace(/track-pending/g, 'track-confirmed');
  };

  const finalizeChanges = (content: string): string => {
    return content.replace(/track-confirmed/g, 'track-finalized');
  };

  const handleToggleEditMode = async () => {
    if (editMode) {
      // 編集内容を保存（pending → confirmed に変換）
      const confirmedContent = confirmChanges(editContent);
      try {
        const response = await fetch(`/api/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ editedContent: confirmedContent }),
        });
        if (response.ok) {
          setSuccess('契約書を保存しました');
          // contractのeditedContentを更新
          setContract(prev => prev ? { ...prev, editedContent: confirmedContent } : prev);
          setEditContent(confirmedContent);
        } else {
          setError('保存に失敗しました');
        }
      } catch {
        setError('保存に失敗しました');
      }
      setEditMode(false);
    } else {
      // 編集モードに入る - 保存済みの内容があればそれを使う（confirmed → finalized に変換）
      if (contract?.editedContent) {
        const finalizedContent = finalizeChanges(contract.editedContent);
        setEditContent(finalizedContent);
        setEditMode(true);
      } else {
        // なければPDFからテキストを抽出
        const success = await extractText();
        if (success) {
          setEditMode(true);
        }
      }
    }
  };

  const handleContentChange = (content: string) => {
    setEditContent(content);
  };

  // リスクの修正案を反映（修正後テキストで直接置換）
  const handleApplySuggestion = (riskId: string, originalText: string, suggestedText: string, riskType?: string) => {
    // 既に反映済みの場合は何もしない
    if (appliedRisks.includes(riskId)) return;

    // 署名セクションの開始位置を検出
    const findSignatureSectionStart = (content: string): number => {
      // 署名セクションのパターン
      const signaturePatterns = [
        /本契約[のに]?[（(]?成立[）)]?[のを]?証[するとし]/,
        /以上[、,]?本契約/,
        /本契約締結の証として/,
        /<div[^>]*class="signature-section"/,
        /令和\d+年\d+月\d+日/,
        /甲\s*[：:]\s*住所/,
        /甲\s*住所/,
      ];

      let earliestPos = content.length;
      for (const pattern of signaturePatterns) {
        const match = content.match(pattern);
        if (match && match.index !== undefined && match.index < earliestPos) {
          // HTMLタグの開始位置を見つける
          const beforeMatch = content.substring(0, match.index);
          const lastTagStart = beforeMatch.lastIndexOf('<');
          earliestPos = lastTagStart !== -1 ? lastTagStart : match.index;
        }
      }
      return earliestPos;
    };

    // ハイライト付きで置換テキストを生成
    const wrapWithHighlight = (text: string, isNew: boolean = false) => {
      if (isNew) {
        return `<ins class="track-insertion track-pending" style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding-left: 8px; display: block; margin: 8px 0;">${text}</ins>`;
      }
      return `<mark class="ai-suggestion" style="background-color: #fef08a; border-bottom: 2px solid #eab308;">${text}</mark>`;
    };

    const applyToContent = (content: string): { success: boolean; newContent: string } => {
      const signatureStart = findSignatureSectionStart(content);

      // デバッグ用：マッチング情報を出力
      if (process.env.NODE_ENV === 'development') {
        console.log('=== Apply Suggestion Debug ===');
        console.log('Original Text:', originalText.substring(0, 50) + '...');
        console.log('Suggested Text:', suggestedText.substring(0, 50) + '...');
      }

      // 1. ファジーマッチングで最適な箇所を見つける（類似度70%以上）
      const bestMatch = findBestMatch(content, originalText, 70);

      if (bestMatch) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Found match with ${bestMatch.similarity}% similarity`);
          console.log('Matched text:', bestMatch.innerText.substring(0, 50) + '...');
        }

        const highlighted = wrapWithHighlight(suggestedText);
        const newContent = content.substring(0, bestMatch.startIndex) +
          bestMatch.tag.replace(bestMatch.innerText, highlighted) +
          content.substring(bestMatch.endIndex);

        return { success: true, newContent };
      }

      // 2. 前方一致でフォールバック検索（先頭15文字、類似度80%以上）
      const prefixMatch = findByPrefix(content, originalText, 15, 80);

      if (prefixMatch) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Found prefix match with ${prefixMatch.similarity}% similarity`);
        }

        const highlighted = wrapWithHighlight(suggestedText);
        const newContent = content.substring(0, prefixMatch.startIndex) +
          prefixMatch.tag.replace(prefixMatch.innerText, highlighted) +
          content.substring(prefixMatch.endIndex);

        return { success: true, newContent };
      }

      // デバッグ情報を出力
      if (process.env.NODE_ENV === 'development') {
        console.warn('No match found. Falling back to adding new article.');
        debugMatch(content.substring(0, 200), originalText);
      }

      // 4. 条項が欠如している場合（新規追加）- 署名セクションの前に挿入
      const h3Matches = [...content.matchAll(/<h3[^>]*>第(\d+)条[^<]*<\/h3>/g)];

      // 署名セクションより前の条項のみをフィルタ
      const articlesBeforeSignature = h3Matches.filter(m => (m.index || 0) < signatureStart);

      // 関連する条項を探す（riskTypeに基づいて）
      const findRelatedArticleIndex = (): number => {
        if (!riskType) return -1;

        const keywords: Record<string, string[]> = {
          '損害賠償': ['損害', '賠償', '責任', '補償'],
          '契約解除': ['解除', '解約', '終了'],
          '知的財産': ['知的財産', '著作権', '特許', '成果物'],
          '秘密保持': ['秘密', '機密', '守秘'],
          '競業避止': ['競業', '競合'],
          '支払': ['報酬', '支払', '対価', '代金'],
        };

        let relatedKeywords: string[] = [];
        for (const [key, kws] of Object.entries(keywords)) {
          if (riskType.includes(key)) {
            relatedKeywords = kws;
            break;
          }
        }

        for (let i = 0; i < articlesBeforeSignature.length; i++) {
          const matchText = articlesBeforeSignature[i][0];
          if (relatedKeywords.some(kw => matchText.includes(kw))) {
            return i;
          }
        }
        return -1;
      };

      if (articlesBeforeSignature.length > 0) {
        // 最後の条項の番号を取得（署名セクション直前の条項）
        const lastArticle = articlesBeforeSignature[articlesBeforeSignature.length - 1];
        const lastArticleNum = parseInt(lastArticle[1]);
        const newArticleNum = lastArticleNum + 1;

        // 新しい条項を作成（ハイライト付き）
        const newArticleContent = `<h3>第${newArticleNum}条（${riskType || '追加条項'}）</h3>\n<p>${suggestedText}</p>`;
        const newArticle = `\n${wrapWithHighlight(newArticleContent, true)}\n`;

        // 最後の条項の終了位置を見つける（次のh3または署名セクションの前）
        const lastArticleStart = lastArticle.index!;
        const afterLastArticle = content.substring(lastArticleStart + lastArticle[0].length);

        // 次のh3タグを探す
        const nextH3InContent = afterLastArticle.match(/<h3[^>]*>/);
        let insertPos: number;

        if (nextH3InContent && nextH3InContent.index !== undefined) {
          // 次のh3の前に挿入
          insertPos = lastArticleStart + lastArticle[0].length + nextH3InContent.index;
        } else {
          // 署名セクションの前に挿入
          insertPos = signatureStart;
        }

        // 署名セクションより前であることを確認
        insertPos = Math.min(insertPos, signatureStart);

        // 挿入位置の直前で最後の</p>を探す
        const sectionContent = content.substring(lastArticleStart, insertPos);
        const lastPClose = sectionContent.lastIndexOf('</p>');
        if (lastPClose !== -1) {
          insertPos = lastArticleStart + lastPClose + 4;
        }

        const newContent = content.substring(0, insertPos) + newArticle + content.substring(insertPos);
        return { success: true, newContent };
      }

      // 5. h3が全くない場合は署名セクションの前に追加（第1条として）
      const newArticle = wrapWithHighlight(
        `<h3>第1条（${riskType || '追加条項'}）</h3>\n<p>${suggestedText}</p>`,
        true
      );
      const insertPos = signatureStart < content.length ? signatureStart : content.length;
      return { success: true, newContent: content.substring(0, insertPos) + '\n' + newArticle + '\n' + content.substring(insertPos) };
    };

    // 反映済みリストに追加
    setAppliedRisks(prev => [...prev, riskId]);

    if (!editContent) {
      extractText().then((success) => {
        if (success) {
          setEditMode(true);
          setTimeout(() => {
            setEditContent((prev) => {
              const result = applyToContent(prev);
              setSuccess('修正を反映しました（黄色ハイライト部分）');
              return result.newContent;
            });
          }, 100);
        }
      });
    } else {
      const result = applyToContent(editContent);
      setEditContent(result.newContent);
      setEditMode(true);
      setSuccess('修正を反映しました（黄色ハイライト部分）');
    }
  };

  // PDFエクスポート（html2pdf.js使用）
  const handleExportPdf = async () => {
    if (!editContent) return;

    try {
      // html2pdf.jsを動的にインポート
      const html2pdf = (await import('html2pdf.js')).default;

      // PDF用のコンテナを作成
      const element = document.createElement('div');
      element.innerHTML = editContent;
      element.style.fontFamily = '"Yu Mincho", "Hiragino Mincho ProN", "MS PMincho", serif';
      element.style.fontSize = '12pt';
      element.style.lineHeight = '1.8';
      element.style.color = '#000';
      element.style.padding = '20mm';
      element.style.maxWidth = '170mm';

      // 変更追跡のスタイルをPDF用に調整（track-finalized は通常表示）
      const style = document.createElement('style');
      style.textContent = `
        h1 { font-size: 16pt; text-align: center; margin-bottom: 2em; }
        h3 { font-size: 12pt; font-weight: bold; margin-top: 1.5em; }
        p { text-align: justify; margin: 0.8em 0; text-indent: 1em; }
        .track-finalized { background-color: transparent !important; border-left: none !important; }
        del.track-deletion.track-finalized { text-decoration: line-through; opacity: 0.5; }
        ins.track-insertion.track-finalized { text-decoration: none; }
        .signature-section { margin-top: 3em; border-top: 1px solid #ccc; padding-top: 2em; }
      `;
      element.appendChild(style);

      const opt = {
        margin: 10,
        filename: `${contract?.contractTitle || '契約書'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(element).save();
      setSuccess('PDFをダウンロードしました');
    } catch (err) {
      console.error('PDF export error:', err);
      setError('PDF出力に失敗しました');
    }
  };

  const getSeverityConfig = (severity: string) => {
    const config = {
      high: {
        label: '高',
        color: 'error' as const,
        icon: <WarningIcon />,
        bgcolor: 'warning.light',
        textColor: 'error.main',
      },
      medium: {
        label: '中',
        color: 'warning' as const,
        icon: <InfoIcon />,
        bgcolor: 'info.light',
        textColor: 'warning.main',
      },
      low: {
        label: '低',
        color: 'info' as const,
        icon: <CheckIcon />,
        bgcolor: 'success.light',
        textColor: 'success.main',
      },
    };
    return config[severity as keyof typeof config] || config.low;
  };

  // 反映済みのリスクを除外
  const riskItems = contract?.review?.riskItems || [];
  const activeRisks = riskItems.filter((risk) => !appliedRisks.includes(risk.id));

  const riskSummary = {
    high: activeRisks.filter((r) => r.riskLevel === 'high').length,
    medium: activeRisks.filter((r) => r.riskLevel === 'medium').length,
    low: activeRisks.filter((r) => r.riskLevel === 'low').length,
  };

  // スコアを動的に計算（リスクを修正するとスコアが上がる）
  const baseScore = contract?.review?.overallScore || 0;
  const totalRiskCount = riskItems.length;
  const appliedCount = appliedRisks.length;

  // リスク1件修正ごとにスコアが改善（最大100点まで）
  const scoreImprovement = totalRiskCount > 0
    ? Math.round(((100 - baseScore) * appliedCount) / totalRiskCount)
    : 0;
  const totalScore = Math.min(100, baseScore + scoreImprovement);

  // ページネーション計算
  const totalPages = Math.ceil(activeRisks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRisks = activeRisks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // ローディング状態
  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
          <Skeleton variant="rectangular" height={600} />
          <Box>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={300} />
          </Box>
        </Box>
      </Box>
    );
  }

  // エラー状態
  if (error || !contract) {
    return (
      <Box>
        <IconButton component={Link} href="/contracts" size="small" sx={{ mb: 2 }}>
          <BackIcon />
        </IconButton>
        <Alert severity="error">{error || '契約書が見つかりません'}</Alert>
      </Box>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return { label: '分析完了', color: 'success' as const };
      case 'analyzing': return { label: '分析中', color: 'warning' as const };
      default: return { label: status, color: 'default' as const };
    }
  };

  const statusConfig = getStatusLabel(contract.status);

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton component={Link} href="/contracts" size="small">
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {contract.contractTitle || contract.fileName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {contract.contractType || '未分類'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(contract.createdAt).toLocaleDateString('ja-JP')}
                </Typography>
                <Chip
                  label={statusConfig.label}
                  color={statusConfig.color}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editMode ? (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleToggleEditMode}
                  sx={{
                    bgcolor: '#1e40af',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#1e3a8a' },
                  }}
                >
                  保存
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CancelIcon />}
                  onClick={() => setEditMode(false)}
                  sx={{
                    borderColor: '#d1d5db',
                    color: '#4b5563',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#9ca3af',
                      bgcolor: '#f9fafb'
                    }
                  }}
                >
                  キャンセル
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={extracting ? <CircularProgress size={16} color="inherit" /> : <EditIcon />}
                  onClick={handleToggleEditMode}
                  disabled={extracting}
                  sx={{
                    bgcolor: '#1e40af',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#1e3a8a' },
                  }}
                >
                  {extracting ? 'テキスト抽出中...' : '編集'}
                </Button>
                <Tooltip title="履歴を表示">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<HistoryIcon />}
                    onClick={handleOpenHistory}
                    sx={{
                      borderColor: '#d1d5db',
                      color: '#4b5563',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#9ca3af',
                        bgcolor: '#f9fafb'
                      }
                    }}
                  >
                    履歴
                  </Button>
                </Tooltip>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ShareIcon />}
                  sx={{
                    borderColor: '#d1d5db',
                    color: '#4b5563',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#9ca3af',
                      bgcolor: '#f9fafb'
                    }
                  }}
                >
                  共有
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderColor: '#d1d5db',
                    color: '#4b5563',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#9ca3af',
                      bgcolor: '#f9fafb'
                    }
                  }}
                >
                  ダウンロード
                </Button>
              </>
            )}
          </Box>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mt: 1 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* 左側: 契約書内容 */}
        <Box
          sx={{
            flex: sidebarCollapsed ? 1 : { xs: 1, lg: 2 },
            position: editMode ? 'relative' : 'sticky',
            top: editMode ? 0 : 96,
            alignSelf: 'start',
            maxHeight: editMode ? 'none' : 'calc(100vh - 120px)',
            overflow: 'hidden',
            transition: 'flex 0.3s ease',
          }}
        >
          {/* 契約書内容 - PDFビューア / エディタ */}
          <Paper sx={{ p: 0, border: '1px solid', borderColor: 'grey.200', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PdfIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="subtitle2" fontWeight={700}>
                {editMode ? '契約書を編集' : '契約書内容'}
              </Typography>
              {editMode && (
                <>
                  <Chip
                    label="編集中"
                    size="small"
                    sx={{
                      bgcolor: '#dbeafe',
                      color: '#1e40af',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                      onClick={handleExportPdf}
                      sx={{
                        fontSize: '0.75rem',
                        py: 0.5,
                        borderColor: 'grey.300',
                        color: 'grey.700',
                        '&:hover': {
                          borderColor: 'grey.400',
                          bgcolor: 'grey.50',
                        },
                      }}
                    >
                      PDF出力
                    </Button>
                  </Box>
                </>
              )}
            </Box>
            {editMode ? (
              <Box sx={{ overflowX: 'hidden' }}>
                <ContractEditor
                  content={editContent}
                  onChange={handleContentChange}
                  onEditorReady={setEditorInstance}
                  contractId={contractId}
                />
              </Box>
            ) : contract.editedContent ? (
              // 編集済みコンテンツがある場合はそれを表示
              <Box
                sx={{
                  p: 4,
                  bgcolor: 'white',
                  height: 'calc(100vh - 200px)',
                  minHeight: '600px',
                  overflowY: 'auto',
                  fontFamily: '"Noto Sans JP", sans-serif',
                  fontSize: '14px',
                  lineHeight: 1.8,
                  '& h3': { fontWeight: 700, mt: 3, mb: 1 },
                  '& p': { mb: 1 },
                  '& del.track-deletion': {
                    textDecoration: 'line-through',
                    color: '#dc2626',
                    bgcolor: '#fef2f2',
                  },
                  '& ins.track-insertion': {
                    textDecoration: 'underline',
                    color: '#16a34a',
                    bgcolor: '#f0fdf4',
                  },
                }}
                dangerouslySetInnerHTML={{ __html: contract.editedContent }}
              />
            ) : contract.fileUrl ? (
              <Box
                sx={{
                  width: '100%',
                  height: 'calc(100vh - 200px)',
                  minHeight: '600px',
                }}
              >
                <iframe
                  src={contract.fileUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  title="契約書PDF"
                />
              </Box>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <PdfIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  PDFファイルを読み込めませんでした
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* 折りたたみ時の展開ボタン */}
        {sidebarCollapsed && (
          <Box
            sx={{
              position: 'fixed',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 100,
            }}
          >
            <IconButton
              onClick={() => setSidebarCollapsed(false)}
              sx={{
                bgcolor: '#1e40af',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '&:hover': { bgcolor: '#1e3a8a' },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        )}

        {/* 右側: リスク項目とサマリー（折りたたみ可能） */}
        <Box
          sx={{
            flex: { xs: 0, lg: 1 },
            display: sidebarCollapsed ? 'none' : { xs: 'none', lg: 'block' },
            transition: 'all 0.3s ease',
            position: 'sticky',
            top: 16,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}
        >
          {/* サイドバー折りたたみボタン */}
          <IconButton
            onClick={() => setSidebarCollapsed(true)}
            size="small"
            sx={{
              position: 'absolute',
              left: -16,
              top: 8,
              zIndex: 10,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'grey.300',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: 'grey.50' },
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>

          {/* 総合リスクスコア - コンパクト版 */}
          <Paper
            sx={{
              p: 0,
              border: '1px solid',
              borderColor: 'grey.200',
              mb: 2,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                {/* 円形スコアゲージ */}
                <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={80}
                    thickness={5}
                    sx={{ color: 'grey.200' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={totalScore}
                    size={80}
                    thickness={5}
                    sx={{
                      position: 'absolute',
                      left: 0,
                      color: totalScore >= 70 ? '#22c55e' : totalScore >= 50 ? '#f59e0b' : '#ef4444',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{
                        color: totalScore >= 70 ? '#22c55e' : totalScore >= 50 ? '#f59e0b' : '#ef4444',
                        lineHeight: 1,
                      }}
                    >
                      {totalScore}
                    </Typography>
                    {scoreImprovement > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#22c55e',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                        }}
                      >
                        +{scoreImprovement}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* テキスト情報 */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      総合スコア
                    </Typography>
                    {appliedCount > 0 && (
                      <Chip
                        size="small"
                        label={`${appliedCount}件修正済`}
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: '#dcfce7',
                          color: '#166534',
                        }}
                      />
                    )}
                    <Chip
                      size="small"
                      label={totalScore >= 70 ? '良好' : totalScore >= 50 ? '注意' : '要確認'}
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: totalScore >= 70 ? '#f0fdf4' : totalScore >= 50 ? '#fffbeb' : '#fef2f2',
                        color: totalScore >= 70 ? '#166534' : totalScore >= 50 ? '#92400e' : '#991b1b',
                        border: '1px solid',
                        borderColor: totalScore >= 70 ? '#bbf7d0' : totalScore >= 50 ? '#fde68a' : '#fecaca',
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
                    {totalScore >= 70
                      ? '契約内容は良好です'
                      : totalScore >= 50
                      ? '重要な項目を確認してください'
                      : '専門家への相談を推奨します'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* リスク内訳 - コンパクト版 */}
          <Paper
            sx={{
              p: 0,
              border: '1px solid',
              borderColor: 'grey.200',
              mb: 2,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ px: 2, py: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                リスク内訳
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', p: 1.5, gap: 1 }}>
              {/* 高リスク */}
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: riskSummary.high > 0 ? '#fef2f2' : '#fafafa',
                  border: '1px solid',
                  borderColor: riskSummary.high > 0 ? '#fecaca' : 'grey.200',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" fontWeight={700} color={riskSummary.high > 0 ? '#ef4444' : 'text.secondary'}>
                  {riskSummary.high}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  高
                </Typography>
              </Box>
              {/* 中リスク */}
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: riskSummary.medium > 0 ? '#fffbeb' : '#fafafa',
                  border: '1px solid',
                  borderColor: riskSummary.medium > 0 ? '#fde68a' : 'grey.200',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" fontWeight={700} color={riskSummary.medium > 0 ? '#f59e0b' : 'text.secondary'}>
                  {riskSummary.medium}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  中
                </Typography>
              </Box>
              {/* 低リスク */}
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: riskSummary.low > 0 ? '#f0fdf4' : '#fafafa',
                  border: '1px solid',
                  borderColor: riskSummary.low > 0 ? '#bbf7d0' : 'grey.200',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" fontWeight={700} color={riskSummary.low > 0 ? '#22c55e' : 'text.secondary'}>
                  {riskSummary.low}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  低
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* リスク項目詳細 */}
          {contract.status === 'analyzing' ? (
            <Paper sx={{ p: 4, border: '1px solid', borderColor: 'grey.200', textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                AI分析
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                契約書をAIで分析してリスクを検出します
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleAnalyze}
                disabled={analyzing}
                startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  px: 4,
                  '&:hover': { bgcolor: 'grey.800' },
                }}
              >
                {analyzing ? '分析中...' : 'AI分析を開始'}
              </Button>
            </Paper>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  検出されたリスク ({activeRisks.length}件)
                </Typography>
                {totalPages > 1 && (
                  <Typography variant="body2" color="text.secondary">
                    {currentPage} / {totalPages} ページ
                  </Typography>
                )}
              </Box>
              {activeRisks.length === 0 ? (
                <Paper sx={{ p: 4, border: '1px solid', borderColor: 'grey.200', textAlign: 'center', mb: 3 }}>
                  <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="body1" fontWeight={600}>
                    リスクは検出されませんでした
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    この契約書には重大なリスクは見つかりませんでした
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                  {currentRisks.map((risk) => {
                    const config = getSeverityConfig(risk.riskLevel);
                    const severityDot = {
                      high: '#ef4444',
                      medium: '#f59e0b',
                      low: '#22c55e',
                    }[risk.riskLevel] || '#6b7280';

                    return (
                      <Paper
                        key={risk.id}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          borderRadius: 2,
                          transition: 'box-shadow 0.2s, border-color 0.2s',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            borderColor: 'grey.300',
                          },
                        }}
                      >
                        {/* ヘッダー */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: severityDot,
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1a1a1a' }}>
                              {risk.sectionTitle || risk.riskType}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: risk.riskLevel === 'high' ? '#fef2f2' : risk.riskLevel === 'medium' ? '#fffbeb' : '#f0fdf4',
                              color: risk.riskLevel === 'high' ? '#dc2626' : risk.riskLevel === 'medium' ? '#d97706' : '#16a34a',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          >
                            {config.label}リスク
                          </Typography>
                        </Box>

                        {/* 説明 */}
                        {risk.reason && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                            {risk.reason}
                          </Typography>
                        )}

                        {/* 原文と修正案 */}
                        {(risk.originalText || risk.suggestedText) && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                            {risk.originalText && (
                              <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Box sx={{ width: 3, bgcolor: '#e5e7eb', borderRadius: 1, flexShrink: 0 }} />
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                                    現在の記載
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#4b5563', fontSize: '0.8rem' }}>
                                    {risk.originalText}
                                  </Typography>
                                </Box>
                              </Box>
                            )}

                            {risk.suggestedText && (
                              <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Box sx={{ width: 3, bgcolor: '#22c55e', borderRadius: 1, flexShrink: 0 }} />
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                                    修正案
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#1a1a1a', fontSize: '0.8rem' }}>
                                    {risk.suggestedText}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* フッター：法的根拠と反映ボタン */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            pt: 1.5,
                            borderTop: '1px solid',
                            borderColor: 'grey.100',
                          }}
                        >
                          {risk.legalBasis ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <InfoIcon sx={{ fontSize: 14, color: 'grey.400' }} />
                              <Typography variant="caption" color="text.secondary">
                                {risk.legalBasis}
                              </Typography>
                            </Box>
                          ) : (
                            <Box />
                          )}

                          {risk.suggestedText && risk.originalText && !appliedRisks.includes(risk.id) && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleApplySuggestion(risk.id, risk.originalText!, risk.suggestedText!, risk.riskType)}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                borderColor: 'grey.300',
                                color: 'grey.700',
                                '&:hover': {
                                  borderColor: '#1e40af',
                                  color: '#1e40af',
                                  bgcolor: '#eff6ff',
                                },
                              }}
                            >
                              反映する
                            </Button>
                          )}
                          {appliedRisks.includes(risk.id) && (
                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                              反映済み
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 3 }}>
              <IconButton
                size="small"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                sx={{
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  '&:hover': { bgcolor: 'grey.50' },
                  '&.Mui-disabled': { bgcolor: 'grey.100' },
                }}
              >
                <ChevronLeftIcon />
              </IconButton>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <IconButton
                  key={page}
                  size="small"
                  onClick={() => handlePageChange(page)}
                  sx={{
                    bgcolor: currentPage === page ? 'black' : 'white',
                    color: currentPage === page ? 'white' : 'black',
                    border: '1px solid',
                    borderColor: currentPage === page ? 'black' : 'grey.300',
                    minWidth: 36,
                    '&:hover': {
                      bgcolor: currentPage === page ? 'grey.800' : 'grey.50',
                    },
                  }}
                >
                  {page}
                </IconButton>
              ))}

              <IconButton
                size="small"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                sx={{
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  '&:hover': { bgcolor: 'grey.50' },
                  '&.Mui-disabled': { bgcolor: 'grey.100' },
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          )}

          {/* アクションボタン */}
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', mb: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{
                bgcolor: '#1e40af',
                color: 'white',
                py: 1.5,
                mb: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                '&:hover': { bgcolor: '#1e3a8a' },
              }}
            >
              弁護士に相談する
            </Button>

            <Button
              variant="outlined"
              fullWidth
              size="large"
              sx={{
                borderColor: '#d1d5db',
                color: '#4b5563',
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                '&:hover': {
                  borderColor: '#9ca3af',
                  bgcolor: '#f9fafb'
                }
              }}
            >
              レポートをエクスポート
            </Button>
          </Paper>

          {/* 契約書情報 */}
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              契約書情報
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">ファイル名</Typography>
                <Typography variant="body2">{contract.fileName}</Typography>
              </Box>
              {contract.counterparty && (
                <Box>
                  <Typography variant="caption" color="text.secondary">取引先</Typography>
                  <Typography variant="body2">{contract.counterparty}</Typography>
                </Box>
              )}
              {contract.expiryDate && (
                <Box>
                  <Typography variant="caption" color="text.secondary">有効期限</Typography>
                  <Typography variant="body2">{new Date(contract.expiryDate).toLocaleDateString('ja-JP')}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">アップロード者</Typography>
                <Typography variant="body2">{contract.uploadedByUser.name || contract.uploadedByUser.email}</Typography>
              </Box>
              {contract.tags && contract.tags.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>タグ</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {contract.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" sx={{ height: 24 }} />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* バージョン履歴 Drawer */}
      <Drawer
        anchor="right"
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setPreviewVersion(null);
          setPreviewContent(null);
        }}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              バージョン履歴
            </Typography>
            <IconButton onClick={() => setHistoryOpen(false)} size="small">
              <CancelIcon />
            </IconButton>
          </Box>

          {loadingVersions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : versions.length === 0 ? (
            <Alert severity="info">
              まだバージョン履歴がありません。編集内容を保存すると履歴が作成されます。
            </Alert>
          ) : (
            <List sx={{ p: 0 }}>
              {versions.map((version) => (
                <Paper
                  key={version.id}
                  sx={{
                    mb: 2,
                    border: '1px solid',
                    borderColor: previewVersion?.id === version.id ? 'primary.main' : 'grey.200',
                    overflow: 'hidden',
                  }}
                >
                  <ListItemButton
                    onClick={() => handlePreviewVersion(version)}
                    sx={{
                      bgcolor: previewVersion?.id === version.id ? 'primary.50' : 'transparent',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            バージョン {version.versionNumber}
                          </Typography>
                          {version.versionNumber === versions[0]?.versionNumber && (
                            <Chip label="最新" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            {new Date(version.createdAt).toLocaleString('ja-JP')}
                          </Typography>
                          {version.changesSummary && (
                            <Typography variant="caption" color="text.secondary" component="span">
                              {version.changesSummary}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItemButton>
                  {previewVersion?.id === version.id && (
                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50' }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={restoringVersion === version.id ? <CircularProgress size={16} color="inherit" /> : <RestoreIcon />}
                        onClick={() => handleRestoreVersion(version.id)}
                        disabled={restoringVersion !== null}
                        sx={{
                          bgcolor: '#1e40af',
                          '&:hover': { bgcolor: '#1e3a8a' },
                        }}
                      >
                        {restoringVersion === version.id ? '復元中...' : 'このバージョンに復元'}
                      </Button>
                    </Box>
                  )}
                </Paper>
              ))}
            </List>
          )}

          {previewContent && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                プレビュー
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  maxHeight: 300,
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  '& h3': { fontWeight: 700, mt: 2, mb: 1, fontSize: '13px' },
                  '& p': { mb: 1 },
                }}
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </Box>
          )}
        </Box>
      </Drawer>

    </Box>
  );
}
