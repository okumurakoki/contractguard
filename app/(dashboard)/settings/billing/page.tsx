'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Check as CheckIcon,
  CreditCard as CreditCardIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    contracts: number | 'unlimited';
    storage: string;
    users: number | 'unlimited';
    aiAnalysis: number | 'unlimited';
  };
  popular?: boolean;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl: string;
}

const plans: Plan[] = [
  {
    id: 'lite',
    name: 'Liteプラン',
    price: 0,
    interval: 'month',
    features: [
      '契約書アップロード（月10件まで）',
      '基本的なリスク分析',
      'PDFエクスポート',
      '1ユーザー',
    ],
    limits: {
      contracts: 10,
      storage: '1GB',
      users: 1,
      aiAnalysis: 10,
    },
  },
  {
    id: 'standard',
    name: 'Standardプラン',
    price: 9800,
    interval: 'month',
    features: [
      '契約書アップロード（月100件まで）',
      '高度なリスク分析',
      'バージョン管理',
      '契約書比較機能',
      'リマインダー機能',
      '3ユーザーまで',
      'メールサポート',
    ],
    limits: {
      contracts: 100,
      storage: '10GB',
      users: 3,
      aiAnalysis: 100,
    },
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premiumプラン',
    price: 29800,
    interval: 'month',
    features: [
      '契約書アップロード（無制限）',
      '最高度なリスク分析',
      'すべてのStandard機能',
      'Word編集機能',
      '監査ログ',
      'カスタムテンプレート',
      '無制限ユーザー',
      '優先サポート',
      'API連携',
    ],
    limits: {
      contracts: 'unlimited',
      storage: '100GB',
      users: 'unlimited',
      aiAnalysis: 'unlimited',
    },
  },
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = React.useState<string>('lite');
  const [loading, setLoading] = React.useState(true);
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);

  React.useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/billing');
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.planType || 'lite');
          setPaymentMethods(data.paymentMethods || []);
          setInvoices(data.invoices || []);
        }
      } catch {
        // エラー時はデフォルト値を使用
      } finally {
        setLoading(false);
      }
    };
    fetchBillingData();

    // URL パラメータをチェック
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccess('プランのアップグレードが完了しました');
    }
  }, []);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);
  const [success, setSuccess] = React.useState('');

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlan(plan);
    setUpgradeDialogOpen(true);
  };

  const [upgrading, setUpgrading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;

    setUpgrading(true);
    setError('');

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: selectedPlan.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'アップグレードに失敗しました');
        return;
      }

      // Stripe Checkoutにリダイレクト
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('アップグレードに失敗しました');
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'ポータルの作成に失敗しました');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('ポータルの作成に失敗しました');
    }
  };

  const handleAddCard = () => {
    // Stripeの支払い方法追加はPortal経由で行う
    handleManageBilling();
  };

  const getStatusChip = (status: string) => {
    const config = {
      paid: { label: '支払い済み', color: 'success' as const },
      pending: { label: '保留中', color: 'warning' as const },
      failed: { label: '失敗', color: 'error' as const },
    };
    const { label, color } = config[status as keyof typeof config];
    return <Chip label={label} color={color} size="small" />;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          料金プランと支払い設定
        </Typography>
        <Typography variant="body2" color="text.secondary">
          プランの変更や支払い方法の管理
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 現在のプラン */}
      <Paper sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          現在のプラン
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {plans.find((p) => p.id === currentPlan)?.name || 'Liteプラン'}
              </Typography>
              <Chip label="現在のプラン" color="primary" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              次回更新日: 2024-02-01
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={700}>
            ¥{plans.find((p) => p.id === currentPlan)?.price.toLocaleString() || '0'}
            <Typography component="span" variant="body2" color="text.secondary">
              /月
            </Typography>
          </Typography>
        </Box>
      </Paper>

      {/* プラン一覧 */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        プランを選択
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        {plans.map((plan) => (
          <Card
            key={plan.id}
            sx={{
              border: '2px solid',
              borderColor: plan.popular ? 'black' : 'grey.200',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {plan.popular && (
              <Chip
                label="人気"
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: 'black',
                  color: 'white',
                  fontWeight: 700,
                }}
              />
            )}
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {plan.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                <Typography variant="h3" fontWeight={700}>
                  ¥{plan.price.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  /月
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" fontWeight={600} gutterBottom>
                機能
              </Typography>
              <List disablePadding>
                {plan.features.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <CheckIcon sx={{ fontSize: 20, color: 'success.main', mr: 1 }} />
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" fontWeight={600} gutterBottom>
                制限
              </Typography>
              <List disablePadding>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={`契約書: ${plan.limits.contracts === 'unlimited' ? '無制限' : `${plan.limits.contracts}件/月`}`}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={`ストレージ: ${plan.limits.storage}`}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={`ユーザー: ${plan.limits.users === 'unlimited' ? '無制限' : `${plan.limits.users}人`}`}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              </List>
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              {plan.id === currentPlan ? (
                <Button fullWidth variant="outlined" disabled>
                  現在のプラン
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant={plan.popular ? 'contained' : 'outlined'}
                  onClick={() => handleUpgrade(plan)}
                  sx={
                    plan.popular
                      ? {
                          bgcolor: 'black',
                          color: 'white',
                          '&:hover': { bgcolor: 'grey.800' },
                        }
                      : {
                          borderColor: 'grey.300',
                          color: 'black',
                          '&:hover': { borderColor: 'black' },
                        }
                  }
                >
                  {plan.price > (plans.find((p) => p.id === currentPlan)?.price || 0)
                    ? 'アップグレード'
                    : 'ダウングレード'}
                </Button>
              )}
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* 支払い方法 */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        支払い方法
      </Typography>
      <Paper sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'grey.200' }}>
        {paymentMethods.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              支払い方法が登録されていません
            </Typography>
            <Button
              variant="contained"
              startIcon={<CreditCardIcon />}
              onClick={handleAddCard}
              sx={{ mt: 2, bgcolor: 'black', color: 'white', '&:hover': { bgcolor: 'grey.800' } }}
            >
              支払い方法を追加
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              {paymentMethods.map((method) => (
                <Box
                  key={method.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CreditCardIcon sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {method.brand} •••• {method.last4}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        有効期限: {method.expiryMonth}/{method.expiryYear}
                      </Typography>
                    </Box>
                    {method.isDefault && (
                      <Chip label="デフォルト" size="small" sx={{ bgcolor: 'black', color: 'white' }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" sx={{ borderColor: 'grey.300', color: 'black' }}>
                      編集
                    </Button>
                    <Button size="small" variant="outlined" color="error">
                      削除
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
            <Button
              variant="outlined"
              startIcon={<CreditCardIcon />}
              onClick={handleAddCard}
              sx={{ borderColor: 'grey.300', color: 'black', '&:hover': { borderColor: 'black' } }}
            >
              別の支払い方法を追加
            </Button>
          </>
        )}
      </Paper>

      {/* 請求履歴 */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        請求履歴
      </Typography>
      <Paper sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>日付</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>内容</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>金額</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ステータス</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      請求履歴がありません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2">{invoice.date}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{invoice.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        ¥{invoice.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(invoice.status)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        sx={{ color: 'black' }}
                      >
                        領収書
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* アップグレードダイアログ */}
      <Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>プラン変更の確認</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                {selectedPlan.price > (plans.find((p) => p.id === currentPlan)?.price || 0)
                  ? 'プランをアップグレードします。差額は日割り計算で請求されます。'
                  : 'プランをダウングレードします。変更は次回の更新日から適用されます。'}
              </Alert>

              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    現在のプラン
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {plans.find((p) => p.id === currentPlan)?.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    変更後のプラン
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {selectedPlan.name}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    月額料金
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    ¥{selectedPlan.price.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUpgradeDialogOpen(false)} sx={{ color: 'grey.600' }} disabled={upgrading}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirmUpgrade}
            variant="contained"
            disabled={upgrading}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            {upgrading ? '処理中...' : '変更を確定'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
