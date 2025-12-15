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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  History as HistoryIcon,
  Visibility as ViewIcon,
  Restore as RestoreIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ContractEditor = dynamic(() => import('@/components/editor/ContractEditor'), {
  ssr: false,
});

interface RiskItem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  location: string;
  suggestion: string;
}

interface Version {
  id: string;
  version: number;
  date: string;
  author: string;
  description: string;
  changes: string[];
  isCurrent: boolean;
}

const mockVersions: Version[] = [
  {
    id: 'v4',
    version: 4,
    date: '2024-01-15 14:30',
    author: '山田太郎',
    description: '損害賠償条項の上限額を追加',
    changes: ['第10条の損害賠償額の上限を契約金額の100%と明記', '文言の微調整'],
    isCurrent: true,
  },
  {
    id: 'v3',
    version: 3,
    date: '2024-01-10 10:15',
    author: '佐藤花子',
    description: '知的財産権の帰属を明確化',
    changes: ['第8条に知的財産権の帰属条項を追加', '成果物の定義を明確化'],
    isCurrent: false,
  },
  {
    id: 'v2',
    version: 2,
    date: '2024-01-05 16:45',
    author: '山田太郎',
    description: '支払条件の遅延損害金を追加',
    changes: ['第7条に年14.6%の遅延損害金を設定', '支払期日を明確化'],
    isCurrent: false,
  },
  {
    id: 'v1',
    version: 1,
    date: '2024-01-01 09:00',
    author: '山田太郎',
    description: '初版作成',
    changes: ['契約書の初版を作成'],
    isCurrent: false,
  },
];

const mockRisks: RiskItem[] = [
  {
    id: '1',
    severity: 'critical',
    category: '損害賠償',
    title: '損害賠償額の上限が明記されていません',
    description:
      '契約書第6条において、損害賠償の条項が記載されていますが、賠償額の上限が「契約金額の100%」と記載があるものの、具体的な金額が不明確です。',
    location: '第6条 損害賠償',
    suggestion: 'ただし、損害賠償の上限額は、月額報酬の12ヶ月分を上限とする。',
  },
  {
    id: '2',
    severity: 'high',
    category: '契約期間',
    title: '自動更新条項と解約条件が未設定',
    description:
      '契約書第2条の契約期間において、契約終了後の自動更新条項や中途解約条件について記載がありません。柔軟な契約終了が困難になる可能性があります。',
    location: '第2条 契約期間',
    suggestion: '本契約は、期間満了の3ヶ月前までに甲または乙のいずれかから書面による解約の申し出がない場合、同一条件にて1年間自動更新されるものとし、以後も同様とする。',
  },
  {
    id: '3',
    severity: 'high',
    category: '知的財産権',
    title: '知的財産権の範囲が限定的です',
    description: '第5条において知的財産権は甲に帰属すると記載がありますが、従業員や下請けが作成した成果物、既存の知的財産の取り扱いが不明確です。',
    location: '第5条 知的財産権',
    suggestion: '乙の従業員または下請業者が作成した成果物を含め、本契約に基づき作成されたすべての成果物の知的財産権は甲に帰属する。ただし、本契約締結前に乙が保有していた知的財産権はこの限りではない。',
  },
  {
    id: '4',
    severity: 'medium',
    category: '支払条件',
    title: '支払遅延時のペナルティが未設定',
    description: '契約書第3条の報酬および支払条件において、支払遅延時の遅延損害金について記載がありません。',
    location: '第3条 報酬および支払条件',
    suggestion: '甲が支払期日までに報酬を支払わない場合、乙は甲に対し、支払期日の翌日から支払済みまで年14.6%の割合による遅延損害金を請求することができる。',
  },
  {
    id: '5',
    severity: 'medium',
    category: '秘密保持',
    title: '秘密保持期間が無期限です',
    description: '第4条の秘密保持において、秘密保持義務の期間が明記されておらず、契約終了後も無期限に継続する可能性があります。',
    location: '第4条 秘密保持',
    suggestion: '本条に定める秘密保持義務は、本契約終了後5年間継続するものとする。',
  },
  {
    id: '6',
    severity: 'low',
    category: '業務内容',
    title: '業務範囲の変更手続きが不明確',
    description: '第1条の業務内容において、業務範囲の変更や追加が発生した場合の手続きや承認プロセスが記載されていません。',
    location: '第1条 業務内容',
    suggestion: '前項の業務内容に変更が生じる場合は、甲乙協議の上、書面により変更契約を締結するものとする。',
  },
];

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params.id as string;
  const [versionDialogOpen, setVersionDialogOpen] = React.useState(false);
  const [selectedVersion, setSelectedVersion] = React.useState<Version | null>(null);
  const [success, setSuccess] = React.useState('');
  const [editMode, setEditMode] = React.useState(false);
  const [editorInstance, setEditorInstance] = React.useState<any>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [appliedRisks, setAppliedRisks] = React.useState<string[]>([]); // 反映済みのリスクIDリスト
  const ITEMS_PER_PAGE = 3; // 1ページあたりのリスク項目数
  const [editContent, setEditContent] = React.useState(`
    <h2>業務委託契約書</h2>
    <p>株式会社ABC（以下「甲」という。）と株式会社XYZ（以下「乙」という。）は、以下のとおり業務委託契約（以下「本契約」という。）を締結する。</p>
    <h3>第1条（業務内容）</h3>
    <p>甲は、乙に対し、以下の業務を委託し、乙はこれを受託する。</p>
    <ol><li>Webアプリケーションの開発業務</li><li>システムの保守・運用業務</li></ol>
    <h3>第2条（契約期間）</h3>
    <p>本契約の有効期間は、2024年1月1日から2025年12月31日までとする。</p>
    <h3>第3条（報酬および支払条件）</h3>
    <p>甲は乙に対し、業務の対価として、月額50万円（税別）を支払うものとする。</p>
    <h3>第4条（秘密保持）</h3>
    <p>甲および乙は、本契約の履行により知り得た相手方の秘密情報を第三者に開示してはならない。</p>
    <h3>第5条（知的財産権）</h3>
    <p>本契約に基づき作成された成果物の知的財産権は、甲に帰属する。</p>
    <h3>第6条（損害賠償）</h3>
    <p>甲または乙が本契約に違反し、相手方に損害を与えた場合、その損害を賠償するものとする。ただし、損害賠償の上限額は、契約金額の100%とする。</p>
    <h3>第7条（契約の解除）</h3>
    <p>甲または乙は、相手方が本契約に違反し、相当の期間を定めて催告したにもかかわらず、その違反が是正されない場合、本契約を解除することができる。</p>
    <h3>第8条（協議事項）</h3>
    <p>本契約に定めのない事項または本契約の解釈に疑義が生じた場合は、甲乙協議の上、誠意をもって解決するものとする。</p>
    <p style="margin-top: 3em;">以上、本契約の成立を証するため、本書2通を作成し、甲乙各1通を保有する。</p>
    <p style="margin-top: 2em; text-align: right;">2024年1月1日</p>
    <p style="margin-top: 2em;">甲：株式会社ABC<br/>代表取締役　山田太郎</p>
    <p style="margin-top: 1em;">乙：株式会社XYZ<br/>代表取締役　佐藤花子</p>
  `);

  const handleOpenVersionDialog = (version: Version) => {
    setSelectedVersion(version);
    setVersionDialogOpen(true);
  };

  const handleCloseVersionDialog = () => {
    setVersionDialogOpen(false);
    setSelectedVersion(null);
  };

  const handleRestoreVersion = () => {
    if (!selectedVersion) return;
    setSuccess(`バージョン${selectedVersion.version}に復元しました`);
    handleCloseVersionDialog();
  };

  const handleToggleEditMode = () => {
    if (editMode) {
      // 編集モードを終了する時に保存
      setSuccess('契約書を保存しました');
    }
    setEditMode(!editMode);
  };

  const handleContentChange = (content: string) => {
    setEditContent(content);
  };

  const handleApplySuggestion = (risk: RiskItem) => {
    // 編集モードに切り替え
    if (!editMode) {
      setEditMode(true);
    }

    // エディタインスタンスが利用可能になるまで待機
    setTimeout(() => {
      if (!editorInstance) {
        setSuccess('エディタの準備ができていません。しばらくお待ちください。');
        return;
      }

      // 該当箇所を見つけて提案を追加
      const locationMatch = risk.location.match(/第(\d+)条/);
      if (locationMatch) {
        const articleNumber = locationMatch[1];

        // 現在のHTMLを取得
        const currentHtml = editorInstance.getHTML();

        // 該当する条項を検索（例：第6条）
        const articleRegex = new RegExp(`(<h3[^>]*>第${articleNumber}条[^<]*<\\/h3>)((?:(?!<h3).)*?)(?=<h3|$)`, 's');
        const match = currentHtml.match(articleRegex);

        if (match) {
          const articleContent = match[2];

          // 特定のケースに応じた処理
          let updatedHtml;

          // 第6条の場合：既存の「ただし」以降を削除マークして新しい文を追加
          if (articleNumber === '6' && risk.id === '1') {
            updatedHtml = currentHtml.replace(
              articleRegex,
              (fullMatch: string, heading: string, content: string) => {
                const newContent = content.replace(
                  /(ただし、損害賠償の上限額は、契約金額の100%とする。)/,
                  '<del class="track-deletion">$1</del>'
                );
                return `${heading}${newContent}<p><ins class="track-insertion">${risk.suggestion}</ins></p>`;
              }
            );
          } else {
            // その他の場合：該当箇所の後に提案を追加
            updatedHtml = currentHtml.replace(
              articleRegex,
              `$1$2<p><ins class="track-insertion">${risk.suggestion}</ins></p>`
            );
          }

          // エディタの内容を更新
          editorInstance.commands.setContent(updatedHtml);

          // リスクを反映済みリストに追加
          setAppliedRisks([...appliedRisks, risk.id]);
          setSuccess(`${risk.location}に提案を追加しました。不要な部分は取り消し線で表示されています。`);
        } else {
          // 条項が見つからない場合は末尾に追加
          editorInstance
            .chain()
            .focus('end')
            .insertContent('<p></p>')
            .insertContent(`<p><ins class="track-insertion">${risk.suggestion}</ins></p>`)
            .run();

          // リスクを反映済みリストに追加
          setAppliedRisks([...appliedRisks, risk.id]);
          setSuccess(`${risk.location}の提案を契約書の末尾に追加しました。`);
        }
      }
    }, 100);
  };

  const getSeverityConfig = (severity: string) => {
    const config = {
      critical: {
        label: '致命的',
        color: 'error' as const,
        icon: <ErrorIcon />,
        bgcolor: 'error.light',
        textColor: 'error.dark',
      },
      high: {
        label: '高',
        color: 'error' as const,
        icon: <WarningIcon />,
        bgcolor: 'warning.light',
        textColor: 'warning.dark',
      },
      medium: {
        label: '中',
        color: 'warning' as const,
        icon: <InfoIcon />,
        bgcolor: 'info.light',
        textColor: 'info.dark',
      },
      low: {
        label: '低',
        color: 'info' as const,
        icon: <CheckIcon />,
        bgcolor: 'success.light',
        textColor: 'success.dark',
      },
    };
    return config[severity as keyof typeof config];
  };

  // 反映済みのリスクを除外
  const activeRisks = mockRisks.filter((risk) => !appliedRisks.includes(risk.id));

  const riskSummary = {
    critical: activeRisks.filter((r) => r.severity === 'critical').length,
    high: activeRisks.filter((r) => r.severity === 'high').length,
    medium: activeRisks.filter((r) => r.severity === 'medium').length,
    low: activeRisks.filter((r) => r.severity === 'low').length,
  };

  const totalScore = 100 - (riskSummary.critical * 25 + riskSummary.high * 15 + riskSummary.medium * 8 + riskSummary.low * 3);

  // ページネーション計算
  const totalPages = Math.ceil(activeRisks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRisks = activeRisks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
                業務委託契約書_ABC社
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  業務委託契約
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  2024-01-15
                </Typography>
                <Chip label="分析完了" color="success" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                <Chip
                  label={`v${mockVersions.find(v => v.isCurrent)?.version || 1}`}
                  size="small"
                  sx={{ bgcolor: 'black', color: 'white', fontWeight: 600, height: 20, fontSize: '0.7rem' }}
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
                  startIcon={<EditIcon />}
                  onClick={handleToggleEditMode}
                  sx={{
                    bgcolor: '#1e40af',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#1e3a8a' },
                  }}
                >
                  編集
                </Button>
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* 左側: 契約書内容（固定スクロール） */}
        <Box
          sx={{
            position: 'sticky',
            top: 96,
            alignSelf: 'start',
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'hidden',
          }}
        >
          {/* 契約書内容 / エディタ */}
          {editMode ? (
            <Box sx={{ maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
              <ContractEditor
                content={editContent}
                onChange={handleContentChange}
                onEditorReady={setEditorInstance}
              />
            </Box>
          ) : (
            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PdfIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>
                  契約書内容
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  '& h2': {
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    mb: 2,
                  },
                  '& h3': {
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    mt: 3,
                    mb: 1,
                  },
                  '& p': {
                    mb: 1.5,
                    lineHeight: 1.8,
                  },
                  '& ol, & ul': {
                    pl: 3,
                    mb: 1.5,
                  },
                  '& li': {
                    mb: 0.5,
                  },
                  '& del.track-deletion': {
                    textDecoration: 'line-through',
                    color: '#991b1b',
                    backgroundColor: '#fef2f2',
                  },
                  '& ins.track-insertion': {
                    textDecoration: 'underline',
                    textDecorationColor: '#166534',
                    textDecorationStyle: 'solid',
                    backgroundColor: '#f0fdf4',
                  },
                }}
                dangerouslySetInnerHTML={{ __html: editContent }}
              />
            </Paper>
          )}
        </Box>

        {/* 右側: リスク項目とサマリー */}
        <Box>
          {/* 総合リスクスコア */}
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              総合リスクスコア
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h2" fontWeight={700} color={totalScore >= 70 ? 'success.main' : totalScore >= 50 ? 'warning.main' : 'error.main'}>
                {totalScore}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                / 100点
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalScore}
              sx={{
                height: 12,
                borderRadius: 2,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: totalScore >= 70 ? 'success.main' : totalScore >= 50 ? 'warning.main' : 'error.main',
                },
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {totalScore >= 70
                ? '契約内容は良好です。一部の項目について確認をお勧めします。'
                : totalScore >= 50
                ? '中程度のリスクが検出されています。重要な項目を確認してください。'
                : '高リスクの項目が複数検出されています。専門家への相談を強く推奨します。'}
            </Typography>
          </Paper>

          {/* リスクサマリー */}
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', mb: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              リスク内訳
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List disablePadding>
              <ListItem sx={{ px: 0, py: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    mr: 2,
                  }}
                />
                <ListItemText
                  primary="致命的"
                  secondary={`${riskSummary.critical}件`}
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'warning.main',
                    mr: 2,
                  }}
                />
                <ListItemText
                  primary="高リスク"
                  secondary={`${riskSummary.high}件`}
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'info.main',
                    mr: 2,
                  }}
                />
                <ListItemText
                  primary="中リスク"
                  secondary={`${riskSummary.medium}件`}
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    mr: 2,
                  }}
                />
                <ListItemText
                  primary="低リスク"
                  secondary={`${riskSummary.low}件`}
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                />
              </ListItem>
            </List>

          </Paper>

          {/* リスク項目詳細 */}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            {currentRisks.map((risk) => {
              const config = getSeverityConfig(risk.severity);
              return (
                <Card
                  key={risk.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderLeft: '4px solid',
                    borderLeftColor: config.textColor,
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                      <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }} />
                      <Chip label={risk.category} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Box>
                    <Typography variant="body2" fontWeight={700} gutterBottom>
                      {risk.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      {risk.description}
                    </Typography>

                    <Box
                      sx={{
                        bgcolor: 'grey.50',
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        mb: 1.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                        該当箇所
                      </Typography>
                      <Typography variant="caption">
                        {risk.location}
                      </Typography>
                    </Box>

                    <Alert severity="info" icon={<InfoIcon />} sx={{ py: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                        推奨される対応
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                        {risk.suggestion}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => handleApplySuggestion(risk)}
                        sx={{
                          bgcolor: '#1e40af',
                          color: 'white',
                          fontSize: '0.75rem',
                          py: 0.75,
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': { bgcolor: '#1e3a8a' },
                        }}
                      >
                        提案を反映
                      </Button>
                    </Alert>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

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

          {/* バージョン履歴 */}
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', position: 'sticky', top: 20 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <HistoryIcon sx={{ fontSize: 24 }} />
              <Typography variant="h6" fontWeight={700}>
                バージョン履歴
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <List disablePadding>
              {mockVersions.map((version, index) => (
                <React.Fragment key={version.id}>
                  <ListItem
                    sx={{
                      px: 0,
                      py: 2,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'grey.50' },
                    }}
                    onClick={() => handleOpenVersionDialog(version)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={700}>
                          v{version.version}
                        </Typography>
                        {version.isCurrent && (
                          <Chip label="現在" size="small" sx={{ bgcolor: 'black', color: 'white', height: 20, fontSize: '0.7rem' }} />
                        )}
                      </Box>
                      <IconButton size="small" sx={{ color: 'grey.600' }}>
                        <ViewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {version.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                      <Typography variant="caption" color="text.secondary">
                        {version.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {version.date}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < mockVersions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>

      {/* バージョン詳細ダイアログ */}
      <Dialog open={versionDialogOpen} onClose={handleCloseVersionDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          バージョン {selectedVersion?.version} の詳細
        </DialogTitle>
        <DialogContent>
          {selectedVersion && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gap: 3 }}>
                {/* バージョン情報 */}
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    基本情報
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, width: '30%' }}>バージョン</TableCell>
                          <TableCell>v{selectedVersion.version}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>更新日時</TableCell>
                          <TableCell>{selectedVersion.date}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>更新者</TableCell>
                          <TableCell>{selectedVersion.author}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>説明</TableCell>
                          <TableCell>{selectedVersion.description}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* 変更内容 */}
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    変更内容
                  </Typography>
                  <List disablePadding>
                    {selectedVersion.changes.map((change, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: 'black',
                            mr: 1.5,
                          }}
                        />
                        <ListItemText
                          primary={change}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {!selectedVersion.isCurrent && (
                  <Alert severity="warning">
                    このバージョンに復元すると、現在のバージョン（v{mockVersions.find(v => v.isCurrent)?.version}）の内容は新しいバージョンとして保存されます。
                  </Alert>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseVersionDialog} sx={{ color: 'grey.600' }}>
            閉じる
          </Button>
          {selectedVersion && !selectedVersion.isCurrent && (
            <Button
              onClick={handleRestoreVersion}
              variant="contained"
              startIcon={<RestoreIcon />}
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              このバージョンに復元
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
