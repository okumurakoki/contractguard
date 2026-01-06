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
  Select,
  FormControl,
  InputLabel,
  MenuItem,
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
  Business as BusinessIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ContractEditor = dynamic(() => import('@/components/editor/ContractEditor'), {
  ssr: false,
});

interface RiskItem {
  id: string;
  riskType: string;
  riskLevel: 'high' | 'medium' | 'low';
  articleNumber: number | null;    // 条項番号（第X条のX）
  paragraphNumber: number | null;  // 項番号
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

interface Counterparty {
  id: string;
  name: string;
  shortName: string | null;
  address: string | null;
  representative: string | null;
  repTitle: string | null;
}

interface ContractData {
  id: string;
  fileName: string;
  contractTitle: string | null;
  contractType: string | null;
  counterparty: string | null;
  counterpartyId: string | null;
  counterpartyRef: Counterparty | null;
  ourPosition: string | null;
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
  const [viewMode, setViewMode] = React.useState<'pdf' | 'edit'>('pdf'); // PDFビュー or テキスト編集
  const [editorInstance, setEditorInstance] = React.useState<any>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
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

  // 取引先・設定
  const [counterparties, setCounterparties] = React.useState<Counterparty[]>([]);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [selectedCounterpartyId, setSelectedCounterpartyId] = React.useState<string>('');
  const [selectedOurPosition, setSelectedOurPosition] = React.useState<string>('');
  const [savingSettings, setSavingSettings] = React.useState(false);

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

  // 編集モードに切り替える際のテキスト抽出
  const handleSwitchToEdit = async () => {
    if (contract?.editedContent) {
      // 既存のeditedContentがあればそれを使用
      setEditContent(contract.editedContent);
      setViewMode('edit');
    } else {
      // なければPDFからテキストを抽出
      const success = await extractText();
      if (success) {
        setViewMode('edit');
      }
    }
  };

  // 取引先一覧を取得
  const fetchCounterparties = async () => {
    try {
      const response = await fetch('/api/counterparties');
      if (response.ok) {
        const data = await response.json();
        setCounterparties(data.counterparties || []);
      }
    } catch (err) {
      console.error('Failed to fetch counterparties:', err);
    }
  };

  // 設定ダイアログを開く
  const handleOpenSettings = () => {
    setSelectedCounterpartyId(contract?.counterpartyId || '');
    setSelectedOurPosition(contract?.ourPosition || '');
    fetchCounterparties();
    setSettingsOpen(true);
  };

  // 設定を保存
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counterpartyId: selectedCounterpartyId || null,
          ourPosition: selectedOurPosition || null,
        }),
      });
      if (response.ok) {
        setSuccess('設定を保存しました');
        setSettingsOpen(false);
        fetchContract();
      } else {
        setError('設定の保存に失敗しました');
      }
    } catch (err) {
      setError('設定の保存に失敗しました');
    } finally {
      setSavingSettings(false);
    }
  };

  // 署名欄を生成
  const [generatingSignature, setGeneratingSignature] = React.useState(false);
  const handleGenerateSignature = async () => {
    try {
      setGeneratingSignature(true);
      const response = await fetch(`/api/contracts/${contractId}/signature`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '署名欄の生成に失敗しました');
      }
      const data = await response.json();

      // エディタに署名欄を挿入（プレースホルダーがあれば置き換え）
      if (editorInstance) {
        let currentContent = editorInstance.getHTML();
        // プレースホルダーを削除
        currentContent = currentContent.replace(/<div class="signature-placeholder"[^>]*>[\s\S]*?<\/div>/g, '');
        // 既存の署名欄があれば削除
        currentContent = currentContent.replace(/<div class="signature-section"[^>]*>[\s\S]*?<\/div>/g, '');
        // 新しい署名欄を追加
        const newContent = currentContent.trim() + '\n' + data.signatureHtml;
        editorInstance.commands.setContent(newContent);
        setEditContent(newContent);
        setSuccess('署名欄を挿入しました');
      } else {
        // エディタがない場合はeditContentに直接追加
        let content = editContent;
        content = content.replace(/<div class="signature-placeholder"[^>]*>[\s\S]*?<\/div>/g, '');
        content = content.replace(/<div class="signature-section"[^>]*>[\s\S]*?<\/div>/g, '');
        setEditContent(content.trim() + '\n' + data.signatureHtml);
        setSuccess('署名欄を生成しました。編集モードで確認してください。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '署名欄の生成に失敗しました');
    } finally {
      setGeneratingSignature(false);
    }
  };

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

  // レポートをダウンロード
  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/report`);
      if (!response.ok) {
        throw new Error('レポートの生成に失敗しました');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract?.contractTitle || 'contract'}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccess('レポートをダウンロードしました');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'レポートのダウンロードに失敗しました');
    }
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

  // コンテンツを保存
  const handleSaveContent = async () => {
    const confirmedContent = confirmChanges(editContent);
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedContent: confirmedContent }),
      });
      if (response.ok) {
        setSuccess('契約書を保存しました');
        setContract(prev => prev ? { ...prev, editedContent: confirmedContent } : prev);
        setEditContent(confirmedContent);
      } else {
        setError('保存に失敗しました');
      }
    } catch {
      setError('保存に失敗しました');
    }
  };

  const handleContentChange = (content: string) => {
    setEditContent(content);
  };

  // リスクが適用済みかどうかをリアルタイムで判定
  const isRiskApplied = React.useCallback((risk: RiskItem): boolean => {
    if (!risk.suggestedText || !editContent) return false;
    // suggestedTextがコンテンツに含まれていれば適用済み
    return editContent.includes(risk.suggestedText);
  }, [editContent]);

  // リスクの修正案を反映（originalText→suggestedTextの部分置換）
  const handleApplySuggestion = (
    originalText: string,
    suggestedText: string
  ) => {
    // 既に反映済みの場合は何もしない（コンテンツに含まれている場合）
    if (editContent.includes(suggestedText)) return;

    // ハイライト付きで置換テキストを生成
    const wrapWithHighlight = (text: string) => {
      return `<mark class="ai-suggestion track-pending" style="background-color: #fef9c3; border-left: 3px solid #eab308; padding-left: 6px; display: inline;">${text}</mark>`;
    };

    // テキストを正規化（比較用）
    const normalizeForSearch = (text: string): string => {
      return text
        .replace(/\s+/g, '') // 全ての空白を削除
        .replace(/[。、．，]/g, '') // 句読点を削除
        .toLowerCase();
    };

    // HTMLからテキストを抽出
    const extractTextFromHtml = (html: string): string => {
      return html
        .replace(/<[^>]+>/g, '') // タグを削除
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
    };

    const applyToContent = (content: string): { success: boolean; newContent: string } => {
      // まず元のテキストを直接検索
      if (content.includes(originalText)) {
        const newContent = content.replace(
          originalText,
          wrapWithHighlight(suggestedText)
        );
        console.log('Direct replacement successful');
        return { success: true, newContent };
      }

      // 段落（<p>タグ）単位で検索
      const paragraphPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      let match;
      const normalizedOriginal = normalizeForSearch(originalText);

      while ((match = paragraphPattern.exec(content)) !== null) {
        const paragraphHtml = match[0];
        const paragraphText = extractTextFromHtml(match[1]);
        const normalizedParagraph = normalizeForSearch(paragraphText);

        // 正規化したテキストで比較
        if (normalizedParagraph.includes(normalizedOriginal)) {
          // この段落内でoriginalTextを探して置換
          // 元のテキストの最初と最後の数文字で位置を特定
          const originalChars = originalText.replace(/\s+/g, '');
          const firstChars = originalChars.substring(0, 10);
          const lastChars = originalChars.substring(originalChars.length - 10);

          // 段落内のテキストを置換
          const newParagraphContent = match[1].replace(
            new RegExp(`([^>]*)${escapeRegExp(firstChars.charAt(0))}[\\s\\S]*?${escapeRegExp(lastChars.charAt(lastChars.length - 1))}([^<]*)`, 'i'),
            (fullMatch) => {
              // 見つかった部分をハイライト付きで置換
              return wrapWithHighlight(suggestedText);
            }
          );

          // 置換が成功したか確認
          if (newParagraphContent !== match[1]) {
            const newContent = content.replace(paragraphHtml, `<p${match[0].match(/<p([^>]*)>/)?.[1] || ''}>${newParagraphContent}</p>`);
            console.log('Paragraph-based replacement successful');
            return { success: true, newContent };
          }
        }
      }

      // 最後の手段：正規化なしで部分一致を試みる
      // originalTextの最初の10文字と最後の10文字で検索
      const origTrimmed = originalText.trim();
      if (origTrimmed.length > 20) {
        const startText = origTrimmed.substring(0, 15);
        const endText = origTrimmed.substring(origTrimmed.length - 15);

        // 開始と終了テキストの間にあるテキストを置換
        const fuzzyPattern = new RegExp(
          `(${escapeRegExp(startText)}[\\s\\S]*?${escapeRegExp(endText)})`,
          'i'
        );
        const fuzzyMatch = content.match(fuzzyPattern);

        if (fuzzyMatch) {
          const newContent = content.replace(
            fuzzyMatch[1],
            wrapWithHighlight(suggestedText)
          );
          console.log('Fuzzy replacement successful');
          return { success: true, newContent };
        }
      }

      console.error('Could not find original text to replace');
      console.log('Original text:', originalText.substring(0, 50) + '...');
      return { success: false, newContent: content };
    };

    if (!editContent) {
      extractText().then((success) => {
        if (success) {
          setViewMode('edit');
          setTimeout(() => {
            setEditContent((prev) => {
              const result = applyToContent(prev);
              if (result.success) {
                setSuccess('修正を反映しました（黄色ハイライト部分）');
              } else {
                setError('該当テキストが見つかりませんでした');
              }
              return result.newContent;
            });
          }, 100);
        }
      });
    } else {
      const result = applyToContent(editContent);
      setEditContent(result.newContent);
      setViewMode('edit');
      if (result.success) {
        setSuccess('修正を反映しました（黄色ハイライト部分）');
      } else {
        setError('該当テキストが見つかりませんでした');
      }
    }
  };

  // 正規表現用エスケープ
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // PDFエクスポート（html2pdf.js使用）
  const handleExportPdf = async () => {
    if (!editContent) return;

    try {
      // html2pdf.jsを動的にインポート
      const html2pdf = (await import('html2pdf.js')).default;

      // PDF用にコンテンツを整形（AI提案のマークを削除）
      let pdfContent = editContent;

      // <mark>タグを削除して中のテキストだけ残す
      pdfContent = pdfContent.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '$1');

      // track-pending/confirmed クラスを削除
      pdfContent = pdfContent.replace(/\s*class="[^"]*track-[^"]*"/gi, '');
      pdfContent = pdfContent.replace(/\s*style="[^"]*background-color[^"]*"/gi, '');

      // PDF用のコンテナを作成
      const element = document.createElement('div');
      element.innerHTML = pdfContent;
      element.style.fontFamily = '"Yu Mincho", "Hiragino Mincho ProN", "MS PMincho", serif';
      element.style.fontSize = '12pt';
      element.style.lineHeight = '1.8';
      element.style.color = '#000';
      element.style.padding = '20mm';
      element.style.maxWidth = '170mm';

      // 変更追跡のスタイルをPDF用に調整
      const style = document.createElement('style');
      style.textContent = `
        h1 { font-size: 16pt; text-align: center; margin-bottom: 2em; }
        h3 { font-size: 12pt; font-weight: bold; margin-top: 1.5em; }
        p { text-align: justify; margin: 0.8em 0; text-indent: 1em; }
        mark { background-color: transparent !important; }
        .ai-suggestion { background-color: transparent !important; border-left: none !important; padding-left: 0 !important; }
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

  // 反映済みのリスクを除外（リアルタイム判定）
  const riskItems = contract?.review?.riskItems || [];
  const activeRisks = riskItems.filter((risk) => !isRiskApplied(risk));
  const appliedCount = riskItems.filter((risk) => isRiskApplied(risk)).length;

  const riskSummary = {
    high: activeRisks.filter((r) => r.riskLevel === 'high').length,
    medium: activeRisks.filter((r) => r.riskLevel === 'medium').length,
    low: activeRisks.filter((r) => r.riskLevel === 'low').length,
  };

  // スコアを動的に計算（リスクを修正するとスコアが上がる）
  const baseScore = contract?.review?.overallScore || 0;
  const totalRiskCount = riskItems.length;

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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* ビューモード切り替え */}
            <Box sx={{ display: 'flex', bgcolor: '#f4f4f5', borderRadius: 1, p: 0.5 }}>
              <Button
                size="small"
                onClick={() => setViewMode('pdf')}
                sx={{
                  px: 2,
                  py: 0.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderRadius: 0.5,
                  bgcolor: viewMode === 'pdf' ? 'white' : 'transparent',
                  color: viewMode === 'pdf' ? '#1e40af' : '#71717a',
                  boxShadow: viewMode === 'pdf' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': { bgcolor: viewMode === 'pdf' ? 'white' : '#e4e4e7' },
                }}
              >
                PDFビュー
              </Button>
              <Button
                size="small"
                onClick={handleSwitchToEdit}
                disabled={extracting}
                sx={{
                  px: 2,
                  py: 0.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderRadius: 0.5,
                  bgcolor: viewMode === 'edit' ? 'white' : 'transparent',
                  color: viewMode === 'edit' ? '#1e40af' : '#71717a',
                  boxShadow: viewMode === 'edit' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': { bgcolor: viewMode === 'edit' ? 'white' : '#e4e4e7' },
                }}
              >
                {extracting ? 'テキスト抽出中...' : '編集モード'}
              </Button>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* 編集モード用ボタン */}
            {viewMode === 'edit' && (
              <>
                <Tooltip title="取引先・自社情報から署名欄を自動生成">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={generatingSignature ? <CircularProgress size={16} color="inherit" /> : <BusinessIcon />}
                    onClick={handleGenerateSignature}
                    disabled={generatingSignature}
                    sx={{
                      borderColor: '#6366f1',
                      color: '#6366f1',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#4f46e5',
                        bgcolor: '#eef2ff'
                      }
                    }}
                  >
                    署名欄を生成
                  </Button>
                </Tooltip>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveContent}
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
              </>
            )}

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
            position: 'relative',
            alignSelf: 'start',
            overflow: 'hidden',
            transition: 'flex 0.3s ease',
          }}
        >
          {/* 契約書内容 - PDFビューア / エディタ */}
          <Paper sx={{ p: 0, border: '1px solid', borderColor: 'grey.200', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PdfIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="subtitle2" fontWeight={700}>
                {viewMode === 'edit' ? '契約書を編集' : '契約書プレビュー'}
              </Typography>
              {viewMode === 'edit' && (
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
            {extracting ? (
              // テキスト抽出中
              <Box
                sx={{
                  p: 4,
                  bgcolor: 'white',
                  height: 'calc(100vh - 200px)',
                  minHeight: '600px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  PDFからテキストを抽出しています...
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  しばらくお待ちください
                </Typography>
              </Box>
            ) : viewMode === 'pdf' ? (
              // PDFビュー
              contract.fileUrl ? (
                <Box
                  sx={{
                    height: 'calc(100vh - 200px)',
                    minHeight: '600px',
                    bgcolor: 'white',
                  }}
                >
                  <iframe
                    src={`${contract.fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    title="契約書PDF"
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    bgcolor: 'white',
                    height: 'calc(100vh - 200px)',
                    minHeight: '600px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PdfIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    PDFファイルがありません
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={handleSwitchToEdit}
                  >
                    編集モードで開く
                  </Button>
                </Box>
              )
            ) : (
              // 編集モード
              <Box sx={{ overflowX: 'hidden' }}>
                <ContractEditor
                  content={editContent || contract.editedContent || ''}
                  onChange={handleContentChange}
                  onEditorReady={setEditorInstance}
                  contractId={contractId}
                />
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

                          {risk.suggestedText && risk.originalText && !isRiskApplied(risk) && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleApplySuggestion(risk.originalText!, risk.suggestedText!)}
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
                          {isRiskApplied(risk) && (
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
              onClick={handleDownloadReport}
              startIcon={<DownloadIcon />}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                契約書情報
              </Typography>
              <Button
                size="small"
                startIcon={<BusinessIcon />}
                onClick={handleOpenSettings}
                sx={{ textTransform: 'none' }}
              >
                設定
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">ファイル名</Typography>
                <Typography variant="body2">{contract.fileName}</Typography>
              </Box>
              {(contract.counterpartyRef || contract.counterparty) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">取引先</Typography>
                  <Typography variant="body2">
                    {contract.counterpartyRef?.name || contract.counterparty}
                    {contract.counterpartyRef?.shortName && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({contract.counterpartyRef.shortName})
                      </Typography>
                    )}
                  </Typography>
                </Box>
              )}
              {contract.ourPosition && (
                <Box>
                  <Typography variant="caption" color="text.secondary">自社の立場</Typography>
                  <Chip
                    label={contract.ourPosition === 'kou' ? '甲' : '乙'}
                    size="small"
                    color={contract.ourPosition === 'kou' ? 'primary' : 'secondary'}
                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                  />
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

      {/* 契約書設定ダイアログ */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>契約書設定</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>取引先</InputLabel>
              <Select
                value={selectedCounterpartyId}
                label="取引先"
                onChange={(e) => setSelectedCounterpartyId(e.target.value)}
              >
                <MenuItem value="">未設定</MenuItem>
                {counterparties.map((cp) => (
                  <MenuItem key={cp.id} value={cp.id}>
                    {cp.name}
                    {cp.shortName && ` (${cp.shortName})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                取引先が登録されていない場合は、
                <Link href="/counterparties" style={{ color: '#1976d2' }}>取引先管理</Link>
                から登録してください。
              </Typography>
            </Box>
            <FormControl fullWidth>
              <InputLabel>自社の立場</InputLabel>
              <Select
                value={selectedOurPosition}
                label="自社の立場"
                onChange={(e) => setSelectedOurPosition(e.target.value)}
              >
                <MenuItem value="">未設定</MenuItem>
                <MenuItem value="kou">甲（主たる当事者・発注者側）</MenuItem>
                <MenuItem value="otsu">乙（従たる当事者・受注者側）</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mt: 1 }}>
              自社の立場を設定すると、署名欄の生成時に正しい順序で表示されます。
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleSaveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
