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
  review: ContractReview | null;
  uploadedByUser: {
    id: string;
    name: string | null;
    email: string;
  };
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
  const ITEMS_PER_PAGE = 3;
  const [editContent, setEditContent] = React.useState('');

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

  const handleToggleEditMode = () => {
    if (editMode) {
      setSuccess('契約書を保存しました');
    }
    setEditMode(!editMode);
  };

  const handleContentChange = (content: string) => {
    setEditContent(content);
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

  const totalScore = contract?.review?.overallScore || 0;

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
                            <Chip label={risk.riskType} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                          </Box>
                          {risk.sectionTitle && (
                            <Typography variant="body2" fontWeight={700} gutterBottom>
                              {risk.sectionTitle}
                            </Typography>
                          )}
                          {risk.reason && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                              {risk.reason}
                            </Typography>
                          )}

                          {risk.originalText && (
                            <Box
                              sx={{
                                bgcolor: 'error.50',
                                p: 1.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'error.200',
                                mb: 1.5,
                              }}
                            >
                              <Typography variant="caption" color="error.main" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                                元の文言
                              </Typography>
                              <Typography variant="caption">
                                {risk.originalText}
                              </Typography>
                            </Box>
                          )}

                          {risk.suggestedText && (
                            <Box
                              sx={{
                                bgcolor: 'success.50',
                                p: 1.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'success.200',
                                mb: 1.5,
                              }}
                            >
                              <Typography variant="caption" color="success.main" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                                推奨される修正
                              </Typography>
                              <Typography variant="caption">
                                {risk.suggestedText}
                              </Typography>
                            </Box>
                          )}

                          {risk.legalBasis && (
                            <Alert severity="info" icon={<InfoIcon />} sx={{ py: 0.5 }}>
                              <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                                法的根拠
                              </Typography>
                              <Typography variant="caption">
                                {risk.legalBasis}
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
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

    </Box>
  );
}
