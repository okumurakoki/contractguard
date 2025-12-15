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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import Link from 'next/link';

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
  review?: {
    riskLevel: string | null;
    overallScore: number | null;
  } | null;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];
  const [contracts, setContracts] = React.useState<(ContractData | null)[]>([null, null]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchContracts = async () => {
      if (ids.length !== 2) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
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
      } catch (err) {
        setError('契約書の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [ids.join(',')]);

  if (ids.length !== 2) {
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

  const [contract1, contract2] = contracts;

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

  return (
    <>
      {/* サマリー */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {renderContractCard(contract1, '契約書 A')}
          {renderContractCard(contract2, '契約書 B')}
        </Box>
      </Paper>

      {/* 比較テーブル */}
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
                  bgcolor: item.value1 !== item.value2 ? 'warning.50' : 'transparent',
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
                  bgcolor: item.value1 !== item.value2 ? 'warning.50' : 'transparent',
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

      {/* 詳細比較の案内 */}
      <Alert severity="info">
        詳細な条項ごとの比較機能は今後のアップデートで追加予定です。
        現在は基本情報の比較のみ対応しています。
      </Alert>
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
          2つの契約書の情報を比較
        </Typography>
      </Box>

      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
        <CompareContent />
      </Suspense>
    </Box>
  );
}
