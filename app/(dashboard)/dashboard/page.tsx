'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Paper,
  LinearProgress,
  Skeleton,
  Button,
  IconButton,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface DashboardData {
  stats: {
    totalContracts: number;
    monthlyReviews: number;
    highRiskContracts: number;
    expiringContracts: number;
  };
  attentionContracts: {
    id: string;
    title: string;
    counterparty: string | null;
    contractType: string | null;
    expiryDate: string | null;
    riskLevel: string;
    riskCount: number;
  }[];
  recentContracts: {
    id: string;
    title: string;
    contractType: string | null;
    status: string;
    riskLevel: string | null;
    createdAt: string;
  }[];
  plan: {
    name: string;
    monthlyLimit: number;
    monthlyUsed: number;
  };
}

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactElement;
  loading?: boolean;
  href?: string;
}

function KpiCard({ title, value, subtitle, icon, loading, href }: KpiCardProps) {
  const content = (
    <Card
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'grey.200',
        boxShadow: 'none',
        cursor: href ? 'pointer' : 'default',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderColor: '#000000',
        },
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={60} height={48} />
            ) : (
              <Typography
                variant="h3"
                component="div"
                fontWeight={700}
                sx={{ mb: 0.5, color: 'text.primary' }}
              >
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              bgcolor: '#000000',
              color: '#ffffff',
            }}
          >
            {React.cloneElement(icon as React.ReactElement<{ sx?: object }>, { sx: { fontSize: 28 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getRiskLevelLabel(level: string | null) {
  switch (level) {
    case 'high':
      return '高リスク';
    case 'medium':
      return '中リスク';
    case 'low':
      return '低リスク';
    default:
      return '未分析';
  }
}

function getRiskLevelColor(level: string | null) {
  switch (level) {
    case 'high':
      return { bg: '#000000', color: '#ffffff' };
    case 'medium':
      return { bg: '#71717a', color: '#ffffff' };
    case 'low':
      return { bg: '#e4e4e7', color: '#18181b' };
    default:
      return { bg: '#f4f4f5', color: '#71717a' };
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'uploaded':
      return 'アップロード済';
    case 'analyzing':
      return '分析中';
    case 'reviewed':
      return 'レビュー完了';
    case 'approved':
      return '承認済';
    default:
      return status;
  }
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDashboard = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const usagePercentage = data
    ? Math.min((data.plan.monthlyUsed / data.plan.monthlyLimit) * 100, 100)
    : 0;

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
            ダッシュボード
          </Typography>
          <Typography variant="body2" color="text.secondary">
            契約書の管理状況を一目で確認
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={fetchDashboard}
            disabled={loading}
            sx={{
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 1,
            }}
          >
            <RefreshIcon />
          </IconButton>
          <Button
            component={Link}
            href="/upload"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#000000',
              color: '#ffffff',
              '&:hover': { bgcolor: '#1f2937' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            契約書をアップロード
          </Button>
        </Box>
      </Box>

      {error && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* KPIカード */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
          mb: 5,
        }}
      >
        <KpiCard
          title="契約書総数"
          value={data?.stats.totalContracts ?? 0}
          icon={<DescriptionIcon />}
          loading={loading}
          href="/contracts"
        />
        <KpiCard
          title="今月のレビュー"
          value={data?.stats.monthlyReviews ?? 0}
          subtitle={`上限: ${data?.plan.monthlyLimit ?? 10}件`}
          icon={<AssignmentIcon />}
          loading={loading}
        />
        <KpiCard
          title="高リスク契約"
          value={data?.stats.highRiskContracts ?? 0}
          icon={<WarningIcon />}
          loading={loading}
          href="/contracts?risk=high"
        />
        <KpiCard
          title="期限30日以内"
          value={data?.stats.expiringContracts ?? 0}
          icon={<ScheduleIcon />}
          loading={loading}
        />
      </Box>

      {/* 月次利用状況 */}
      <Card
        sx={{
          mb: 5,
          border: '1px solid',
          borderColor: 'grey.200',
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              今月の利用状況
            </Typography>
            <Chip
              label={data?.plan.name === 'free' ? 'Free プラン' : data?.plan.name}
              size="small"
              sx={{ bgcolor: '#f4f4f5', fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              レビュー数
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} />
            ) : (
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {data?.plan.monthlyUsed ?? 0} / {data?.plan.monthlyLimit ?? 10}件
              </Typography>
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={usagePercentage}
            sx={{
              height: 10,
              borderRadius: 2,
              bgcolor: 'grey.100',
              '& .MuiLinearProgress-bar': {
                bgcolor: usagePercentage >= 90 ? '#dc2626' : '#000000',
                borderRadius: 2,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              あと{Math.max((data?.plan.monthlyLimit ?? 10) - (data?.plan.monthlyUsed ?? 0), 0)}件レビュー可能です
            </Typography>
            {data?.plan.name === 'free' && (
              <Button
                component={Link}
                href="/settings/billing"
                size="small"
                sx={{
                  color: '#000000',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#f4f4f5' },
                }}
              >
                アップグレード →
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* 2カラムレイアウト */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* 要注意契約 */}
        <Card
          sx={{
            border: '1px solid',
            borderColor: 'grey.200',
            boxShadow: 'none',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                要注意契約
              </Typography>
              <Button
                component={Link}
                href="/contracts?risk=high,medium"
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  color: '#71717a',
                  textTransform: 'none',
                  '&:hover': { color: '#000000' },
                }}
              >
                すべて見る
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1, 2].map((i) => (
                  <Skeleton key={i} variant="rounded" height={120} />
                ))}
              </Box>
            ) : data?.attentionContracts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <WarningIcon sx={{ fontSize: 48, color: '#e4e4e7', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  要注意の契約はありません
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data?.attentionContracts.map((contract) => {
                  const riskColor = getRiskLevelColor(contract.riskLevel);
                  return (
                    <Paper
                      key={contract.id}
                      component={Link}
                      href={`/contracts/${contract.id}`}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 1.5,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#000000',
                          boxShadow: 2,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                        <Chip
                          label={getRiskLevelLabel(contract.riskLevel)}
                          size="small"
                          sx={{
                            bgcolor: riskColor.bg,
                            color: riskColor.color,
                            fontWeight: 600,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {contract.riskCount}件のリスク
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
                        {contract.title}
                      </Typography>
                      {contract.counterparty && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {contract.counterparty}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'grey.200' }}>
                        {contract.contractType && (
                          <Chip label={contract.contractType} size="small" variant="outlined" />
                        )}
                        {contract.expiryDate && (
                          <Typography variant="caption" color="text.secondary">
                            期限: {formatDate(contract.expiryDate)}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* 最近の契約書 */}
        <Card
          sx={{
            border: '1px solid',
            borderColor: 'grey.200',
            boxShadow: 'none',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                最近の契約書
              </Typography>
              <Button
                component={Link}
                href="/contracts"
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  color: '#71717a',
                  textTransform: 'none',
                  '&:hover': { color: '#000000' },
                }}
              >
                すべて見る
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rounded" height={56} />
                ))}
              </Box>
            ) : data?.recentContracts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DescriptionIcon sx={{ fontSize: 48, color: '#e4e4e7', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  契約書がまだありません
                </Typography>
                <Button
                  component={Link}
                  href="/upload"
                  variant="outlined"
                  sx={{
                    borderColor: '#000000',
                    color: '#000000',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#f4f4f5', borderColor: '#000000' },
                  }}
                >
                  最初の契約書をアップロード
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {data?.recentContracts.map((contract, index) => {
                  const riskColor = getRiskLevelColor(contract.riskLevel);
                  return (
                    <Box
                      key={contract.id}
                      component={Link}
                      href={`/contracts/${contract.id}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1.5,
                        px: 1,
                        borderBottom: index < (data?.recentContracts.length ?? 0) - 1 ? '1px solid' : 'none',
                        borderColor: 'grey.100',
                        textDecoration: 'none',
                        borderRadius: 1,
                        '&:hover': { bgcolor: '#f4f4f5' },
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.primary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {contract.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {contract.contractType || '未分類'} • {formatDate(contract.createdAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                        <Chip
                          label={getStatusLabel(contract.status)}
                          size="small"
                          sx={{
                            bgcolor: '#f4f4f5',
                            color: '#71717a',
                            fontSize: '0.7rem',
                            height: 24,
                          }}
                        />
                        {contract.riskLevel && (
                          <Chip
                            label={getRiskLevelLabel(contract.riskLevel)}
                            size="small"
                            sx={{
                              bgcolor: riskColor.bg,
                              color: riskColor.color,
                              fontSize: '0.7rem',
                              height: 24,
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
