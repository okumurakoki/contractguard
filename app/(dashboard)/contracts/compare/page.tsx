'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import DiffMatchPatch from 'diff-match-patch';

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
  editedContent: string | null;
  review?: {
    riskLevel: string | null;
    overallScore: number | null;
  } | null;
}

interface ContractVersion {
  id: string;
  versionNumber: number;
  content: string;
  createdAt: string;
  changesSummary: string | null;
}

// HTMLタグを除去してテキストのみ抽出
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// 差分を計算
function computeDiff(text1: string, text2: string) {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diffs);
  return diffs;
}

// 差分統計を計算
function computeDiffStats(diffs: [number, string][]) {
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const [type, text] of diffs) {
    const chars = text.length;
    if (type === 1) added += chars;
    else if (type === -1) removed += chars;
    else unchanged += chars;
  }

  return { added, removed, unchanged };
}

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];
  const contractId = searchParams.get('contract'); // バージョン比較用

  const [contracts, setContracts] = React.useState<(ContractData | null)[]>([null, null]);
  const [versions, setVersions] = React.useState<ContractVersion[]>([]);
  const [selectedVersions, setSelectedVersions] = React.useState<[string, string]>(['', '']);
  const [versionContents, setVersionContents] = React.useState<[string, string]>(['', '']);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tabValue, setTabValue] = React.useState(0);
  const [swapped, setSwapped] = React.useState(false);

  // 契約書を取得
  React.useEffect(() => {
    const fetchContracts = async () => {
      if (ids.length !== 2 && !contractId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (ids.length === 2) {
          // 2つの契約書を比較
          const responses = await Promise.all(
            ids.map((id) => fetch(`/api/contracts/${id}`))
          );

          const data = await Promise.all(
            responses.map(async (res) => {
              if (!res.ok) return null;
              const json = await res.json();
              return json.contract;
            })
          );

          setContracts(data);
        } else if (contractId) {
          // バージョン比較モード
          const [contractRes, versionsRes] = await Promise.all([
            fetch(`/api/contracts/${contractId}`),
            fetch(`/api/contracts/${contractId}/versions`),
          ]);

          if (contractRes.ok) {
            const contractData = await contractRes.json();
            setContracts([contractData.contract, null]);
          }

          if (versionsRes.ok) {
            const versionsData = await versionsRes.json();
            setVersions(versionsData.versions || []);
          }
        }
      } catch (err) {
        setError('契約書の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [ids.join(','), contractId]);

  // バージョンコンテンツを取得
  const fetchVersionContent = async (versionId: string, index: 0 | 1) => {
    if (!contractId || !versionId) return;

    try {
      const response = await fetch(`/api/contracts/${contractId}/versions/${versionId}`);
      if (response.ok) {
        const data = await response.json();
        setVersionContents((prev) => {
          const newContents = [...prev] as [string, string];
          newContents[index] = data.version.content;
          return newContents;
        });
      }
    } catch (err) {
      console.error('Failed to fetch version content:', err);
    }
  };

  // バージョン選択時
  const handleVersionSelect = (index: 0 | 1, versionId: string) => {
    setSelectedVersions((prev) => {
      const newVersions = [...prev] as [string, string];
      newVersions[index] = versionId;
      return newVersions;
    });
    fetchVersionContent(versionId, index);
  };

  if (!ids.length && !contractId) {
    return (
      <Alert severity="info">
        比較する契約書を2つ選択してください。契約書一覧ページの「比較モード」から選択できます。
      </Alert>
    );
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {[0, 1].map((i) => (
            <Box key={i}>
              <Skeleton variant="text" width={100} height={20} />
              <Skeleton variant="text" width="80%" height={32} />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Skeleton variant="rectangular" width={80} height={24} />
                <Skeleton variant="rectangular" width={100} height={24} />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const [contract1, contract2] = swapped ? [contracts[1], contracts[0]] : contracts;

  // バージョン比較モードの場合
  if (contractId && versions.length > 0) {
    const [content1, content2] = swapped ? [versionContents[1], versionContents[0]] : versionContents;
    const text1 = content1 ? stripHtml(content1) : '';
    const text2 = content2 ? stripHtml(content2) : '';
    const diffs = text1 && text2 ? computeDiff(text1, text2) : [];
    const stats = computeDiffStats(diffs);

    return (
      <>
        {/* バージョン選択 */}
        <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            バージョン比較
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 2, alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>比較元バージョン</InputLabel>
              <Select
                value={selectedVersions[0]}
                onChange={(e) => handleVersionSelect(0, e.target.value)}
                label="比較元バージョン"
              >
                {versions.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    v{v.versionNumber} - {new Date(v.createdAt).toLocaleDateString('ja-JP')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <IconButton onClick={() => setSwapped(!swapped)}>
              <SwapIcon />
            </IconButton>

            <FormControl fullWidth>
              <InputLabel>比較先バージョン</InputLabel>
              <Select
                value={selectedVersions[1]}
                onChange={(e) => handleVersionSelect(1, e.target.value)}
                label="比較先バージョン"
              >
                {versions.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    v{v.versionNumber} - {new Date(v.createdAt).toLocaleDateString('ja-JP')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* 差分統計 */}
        {diffs.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Chip
                icon={<AddIcon />}
                label={`追加: ${stats.added}文字`}
                sx={{ bgcolor: '#dcfce7', color: '#166534' }}
              />
              <Chip
                icon={<RemoveIcon />}
                label={`削除: ${stats.removed}文字`}
                sx={{ bgcolor: '#fee2e2', color: '#991b1b' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                変更なし: {stats.unchanged}文字
              </Typography>
            </Box>
          </Paper>
        )}

        {/* 差分表示 */}
        {diffs.length > 0 ? (
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              差分詳細
            </Typography>
            <Box
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {diffs.map(([type, text], index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor:
                      type === 1 ? '#dcfce7' : type === -1 ? '#fee2e2' : 'transparent',
                    textDecoration: type === -1 ? 'line-through' : 'none',
                    color: type === -1 ? '#991b1b' : type === 1 ? '#166534' : 'inherit',
                  }}
                >
                  {text}
                </span>
              ))}
            </Box>
          </Paper>
        ) : (
          <Alert severity="info">
            比較するバージョンを選択してください
          </Alert>
        )}
      </>
    );
  }

  // 契約書比較モード
  if (!contract1 || !contract2) {
    return <Alert severity="error">契約書が見つかりません</Alert>;
  }

  const getRiskIcon = (level: string | null) => {
    switch (level) {
      case 'high':
        return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
      case 'medium':
        return <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
      case 'low':
        return <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const getRiskLabel = (level: string | null) => {
    switch (level) {
      case 'high':
        return { label: '高リスク', color: 'error' as const };
      case 'medium':
        return { label: '中リスク', color: 'warning' as const };
      case 'low':
        return { label: '低リスク', color: 'success' as const };
      default:
        return { label: '未分析', color: 'default' as const };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const renderContractCard = (contract: ContractData, label: string) => {
    const riskConfig = getRiskLabel(contract.review?.riskLevel || null);
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {contract.contractTitle || contract.fileName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={contract.contractType || '未分類'} size="small" />
          <Chip label={formatDate(contract.createdAt)} size="small" variant="outlined" />
          <Chip
            label={riskConfig.label}
            color={riskConfig.color}
            size="small"
            icon={getRiskIcon(contract.review?.riskLevel || null) || undefined}
          />
        </Box>
        {contract.counterparty && (
          <Typography variant="body2" color="text.secondary">
            取引先: {contract.counterparty}
          </Typography>
        )}
        {contract.review?.overallScore !== null && contract.review?.overallScore !== undefined && (
          <Typography variant="body2" color="text.secondary">
            リスクスコア: {contract.review.overallScore}点
          </Typography>
        )}
      </Box>
    );
  };

  // 比較項目
  const compareItems = [
    {
      label: '契約種類',
      value1: contract1.contractType || '未設定',
      value2: contract2.contractType || '未設定',
    },
    {
      label: '取引先',
      value1: contract1.counterparty || '未設定',
      value2: contract2.counterparty || '未設定',
    },
    {
      label: 'アップロード日',
      value1: formatDate(contract1.createdAt),
      value2: formatDate(contract2.createdAt),
    },
    {
      label: '有効期限',
      value1: contract1.expiryDate ? formatDate(contract1.expiryDate) : '未設定',
      value2: contract2.expiryDate ? formatDate(contract2.expiryDate) : '未設定',
    },
    {
      label: 'リスクレベル',
      value1: getRiskLabel(contract1.review?.riskLevel || null).label,
      value2: getRiskLabel(contract2.review?.riskLevel || null).label,
    },
    {
      label: 'リスクスコア',
      value1: contract1.review?.overallScore !== null ? `${contract1.review?.overallScore}点` : '未分析',
      value2: contract2.review?.overallScore !== null ? `${contract2.review?.overallScore}点` : '未分析',
    },
  ];

  // コンテンツ差分
  const text1 = contract1.editedContent ? stripHtml(contract1.editedContent) : '';
  const text2 = contract2.editedContent ? stripHtml(contract2.editedContent) : '';
  const contentDiffs = text1 && text2 ? computeDiff(text1, text2) : [];
  const contentStats = computeDiffStats(contentDiffs);

  return (
    <>
      {/* サマリー */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button startIcon={<SwapIcon />} onClick={() => setSwapped(!swapped)} size="small">
            入れ替え
          </Button>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {renderContractCard(contract1, '契約書 A')}
          {renderContractCard(contract2, '契約書 B')}
        </Box>
      </Paper>

      {/* タブ */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="基本情報" />
        <Tab label="コンテンツ差分" />
      </Tabs>

      {/* 基本情報の比較 */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            基本情報の比較
          </Typography>
          <Paper sx={{ border: '1px solid', borderColor: 'grey.200', mb: 3 }}>
            {compareItems.map((item, index) => (
              <Box key={item.label}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', p: 2 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: item.value1 !== item.value2 ? '#fef3c7' : 'transparent',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {item.value1}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: item.value1 !== item.value2 ? '#fef3c7' : 'transparent',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {item.value2}
                  </Typography>
                </Box>
                {index < compareItems.length - 1 && <Divider />}
              </Box>
            ))}
          </Paper>
        </>
      )}

      {/* コンテンツ差分 */}
      {tabValue === 1 && (
        <>
          {contentDiffs.length > 0 ? (
            <>
              {/* 差分統計 */}
              <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Chip
                    icon={<AddIcon />}
                    label={`追加: ${contentStats.added}文字`}
                    sx={{ bgcolor: '#dcfce7', color: '#166534' }}
                  />
                  <Chip
                    icon={<RemoveIcon />}
                    label={`削除: ${contentStats.removed}文字`}
                    sx={{ bgcolor: '#fee2e2', color: '#991b1b' }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    変更なし: {contentStats.unchanged}文字
                  </Typography>
                </Box>
              </Paper>

              {/* 差分表示 */}
              <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  差分詳細
                </Typography>
                <Box
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '600px',
                    overflow: 'auto',
                  }}
                >
                  {contentDiffs.map(([type, text], index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor:
                          type === 1 ? '#dcfce7' : type === -1 ? '#fee2e2' : 'transparent',
                        textDecoration: type === -1 ? 'line-through' : 'none',
                        color: type === -1 ? '#991b1b' : type === 1 ? '#166534' : 'inherit',
                      }}
                    >
                      {text}
                    </span>
                  ))}
                </Box>
              </Paper>
            </>
          ) : (
            <Alert severity="info">
              契約書のコンテンツが取得できないため、差分を表示できません。
              両方の契約書にテキストコンテンツが必要です。
            </Alert>
          )}
        </>
      )}
    </>
  );
}

export default function ComparePage() {
  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <IconButton component={Link} href="/contracts" sx={{ mb: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          契約書比較
        </Typography>
        <Typography variant="body2" color="text.secondary">
          契約書の情報と内容を比較
        </Typography>
      </Box>

      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
        <CompareContent />
      </Suspense>
    </Box>
  );
}
