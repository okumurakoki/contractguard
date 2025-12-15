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
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactElement;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

function KpiCard({ title, value, subtitle, icon }: KpiCardProps) {
  // 白黒基調に統一
  const colorStyles = {
    iconBg: '#000000',
    iconColor: '#ffffff',
    borderColor: '#000000',
  };

  return (
    <Card
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'grey.200',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderColor: colorStyles.borderColor,
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
            <Typography
              variant="h3"
              component="div"
              fontWeight={700}
              sx={{ mb: 0.5, color: 'text.primary' }}
            >
              {value}
            </Typography>
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
              bgcolor: colorStyles.iconBg,
              color: colorStyles.iconColor,
              border: '1px solid',
              borderColor: colorStyles.iconColor + '20',
            }}
          >
            {React.cloneElement(icon as React.ReactElement<{ sx?: object }>, { sx: { fontSize: 28 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
          ダッシュボード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          契約書の管理状況を一目で確認
        </Typography>
      </Box>

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
          value={24}
          icon={<DescriptionIcon />}
          color="primary"
        />
        <KpiCard
          title="今月のレビュー"
          value={7}
          subtitle="上限: 10件"
          icon={<AssignmentIcon />}
          color="success"
        />
        <KpiCard
          title="高リスク契約"
          value={3}
          icon={<WarningIcon />}
          color="error"
        />
        <KpiCard
          title="期限30日以内"
          value={5}
          icon={<ScheduleIcon />}
          color="warning"
        />
      </Box>

      {/* 月次利用状況 */}
      <Card
        sx={{
          mb: 5,
          border: '1px solid',
          borderColor: 'grey.200',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 3 }}>
            今月の利用状況
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              レビュー数
            </Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              7 / 10件
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={70}
            sx={{
              height: 10,
              borderRadius: 2,
              bgcolor: 'grey.100',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'black',
                borderRadius: 2,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            あと3件レビュー可能です
          </Typography>
        </CardContent>
      </Card>

      {/* 要注意契約 */}
      <Card
        sx={{
          border: '1px solid',
          borderColor: 'grey.200',
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 3 }}>
            要注意契約
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
              },
              gap: 2,
            }}
          >
            {[
              {
                id: '1',
                title: '業務委託契約書_ABC株式会社',
                counterparty: 'ABC株式会社',
                type: '業務委託契約',
                expiry: '2025-12-15',
                riskLevel: 'high',
                riskCount: 5,
              },
              {
                id: '2',
                title: 'NDA_XYZ社',
                counterparty: 'XYZ社',
                type: '秘密保持契約',
                expiry: '2025-12-20',
                riskLevel: 'medium',
                riskCount: 3,
              },
            ].map((contract) => (
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
                    borderColor: 'black',
                    boxShadow: 2,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                  <Chip
                    label={contract.riskLevel === 'high' ? '高リスク' : '中リスク'}
                    size="small"
                    sx={{
                      bgcolor: contract.riskLevel === 'high' ? 'black' : 'grey.700',
                      color: 'white',
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {contract.counterparty}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'grey.200' }}>
                  <Chip label={contract.type} size="small" variant="outlined" />
                  <Typography variant="caption" color="text.secondary">
                    期限: {contract.expiry}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
