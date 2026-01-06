'use client';

import * as React from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  Chip,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  CreditCard as BillingIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [tabValue, setTabValue] = React.useState(0);
  const [success, setSuccess] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  // プロフィール設定 - Clerkユーザーデータで初期化
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');

  // 組織設定
  const [orgName, setOrgName] = React.useState('');
  const [orgAddress, setOrgAddress] = React.useState('');
  const [orgEmail, setOrgEmail] = React.useState('');
  const [orgRepresentative, setOrgRepresentative] = React.useState('');
  const [orgRepTitle, setOrgRepTitle] = React.useState('');
  const [orgLoading, setOrgLoading] = React.useState(false);
  const [orgSaving, setOrgSaving] = React.useState(false);

  // 通知設定
  const [emailNotif, setEmailNotif] = React.useState(true);
  const [riskAlertNotif, setRiskAlertNotif] = React.useState(true);
  const [weeklyReportNotif, setWeeklyReportNotif] = React.useState(false);

  // Clerkユーザーデータを反映
  React.useEffect(() => {
    if (isLoaded && user) {
      setName(user.fullName || '');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
      setPhone(user.primaryPhoneNumber?.phoneNumber || '');
    }
  }, [isLoaded, user]);

  // 組織情報を取得
  const fetchOrganization = async () => {
    try {
      setOrgLoading(true);
      const response = await fetch('/api/organization');
      if (response.ok) {
        const data = await response.json();
        setOrgName(data.organization.name || '');
        setOrgAddress(data.organization.companyAddress || '');
        setOrgRepresentative(data.organization.companyRepresentative || '');
        setOrgRepTitle(data.organization.companyRepTitle || '');
        setOrgEmail(data.organization.billingEmail || '');
      }
    } catch (err) {
      console.error('Failed to fetch organization:', err);
    } finally {
      setOrgLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrganization();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await user.update({
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
      });
      setSuccess('プロフィールを更新しました');
    } catch {
      setSuccess('プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    try {
      setOrgSaving(true);
      const response = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          companyAddress: orgAddress,
          companyRepresentative: orgRepresentative,
          companyRepTitle: orgRepTitle,
          billingEmail: orgEmail,
        }),
      });
      if (response.ok) {
        setSuccess('組織情報を更新しました');
      } else {
        const data = await response.json();
        setSuccess(data.error || '組織情報の更新に失敗しました');
      }
    } catch {
      setSuccess('組織情報の更新に失敗しました');
    } finally {
      setOrgSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    setSuccess('通知設定を更新しました');
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          設定
        </Typography>
        <Typography variant="body2" color="text.secondary">
          アカウントと組織の設定管理
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' },
          }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label="プロフィール" />
          <Tab icon={<BusinessIcon />} iconPosition="start" label="組織情報" />
          <Tab icon={<BillingIcon />} iconPosition="start" label="プランと請求" />
          <Tab icon={<NotificationIcon />} iconPosition="start" label="通知設定" />
        </Tabs>

        {/* プロフィール */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            {!isLoaded ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                <Skeleton variant="circular" width={80} height={80} />
                <Box>
                  <Skeleton variant="text" width={100} height={32} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                <Avatar
                  src={user?.imageUrl}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'black',
                    fontSize: '2rem',
                    fontWeight: 600,
                  }}
                >
                  {name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    プロフィール画像の変更はClerkダッシュボードから行えます
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'grid', gap: 3 }}>
              <TextField label="氏名" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
              <TextField label="メールアドレス" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField label="電話番号" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                パスワード変更
              </Typography>
              <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
                <TextField label="現在のパスワード" type="password" fullWidth />
                <TextField label="新しいパスワード" type="password" fullWidth />
                <TextField label="新しいパスワード（確認）" type="password" fullWidth />
              </Box>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSaveProfile}
                disabled={saving}
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  px: 4,
                  '&:hover': { bgcolor: 'grey.800' },
                }}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* 組織情報 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            {orgLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={56} />
                ))}
              </Box>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  署名欄の自動生成に使用されます。正確な情報を入力してください。
                </Alert>
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <TextField
                    label="組織名・法人名"
                    fullWidth
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="株式会社サンプル"
                  />
                  <TextField
                    label="住所"
                    fullWidth
                    multiline
                    rows={2}
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    placeholder="東京都渋谷区神宮前1-1-1 サンプルビル3F"
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
                    <TextField
                      label="代表者肩書"
                      fullWidth
                      value={orgRepTitle}
                      onChange={(e) => setOrgRepTitle(e.target.value)}
                      placeholder="代表取締役"
                    />
                    <TextField
                      label="代表者名"
                      fullWidth
                      value={orgRepresentative}
                      onChange={(e) => setOrgRepresentative(e.target.value)}
                      placeholder="山田 太郎"
                    />
                  </Box>
                  <TextField
                    label="請求先メールアドレス"
                    type="email"
                    fullWidth
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                  />
                </Box>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveOrganization}
                    disabled={orgSaving}
                    sx={{
                      bgcolor: 'black',
                      color: 'white',
                      px: 4,
                      '&:hover': { bgcolor: 'grey.800' },
                    }}
                  >
                    {orgSaving ? '保存中...' : '保存'}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </TabPanel>

        {/* プランと請求 */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    現在のプラン
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label="Free プラン" sx={{ bgcolor: 'grey.100', fontWeight: 600 }} />
                    <Typography variant="body2" color="text.secondary">
                      無料
                    </Typography>
                  </Box>
                </Box>
                <Button
                  component={Link}
                  href="/settings/billing"
                  variant="outlined"
                  sx={{ borderColor: 'grey.300', color: 'black' }}
                >
                  プラン変更
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="契約書レビュー" secondary="月10件まで" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="ストレージ" secondary="1GB" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="チームメンバー" secondary="1人まで" />
                </ListItem>
              </List>
            </Paper>

            <Alert severity="info" sx={{ mb: 3 }}>
              より多くの契約書をレビューするには、プランをアップグレードしてください。
            </Alert>

            <Button
              component={Link}
              href="/settings/billing"
              variant="contained"
              fullWidth
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              料金プランと請求設定を見る
            </Button>
          </Box>
        </TabPanel>

        {/* 通知設定 */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              メール通知
            </Typography>
            <List>
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemText
                  primary="すべての通知を受け取る"
                  secondary="契約書レビュー完了、リスク検出などの通知"
                />
                <Switch checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
              </ListItem>
              <Divider />
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemText
                  primary="高リスク検出アラート"
                  secondary="致命的または高リスクが検出された際の緊急通知"
                />
                <Switch checked={riskAlertNotif} onChange={(e) => setRiskAlertNotif(e.target.checked)} />
              </ListItem>
              <Divider />
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemText
                  primary="週次レポート"
                  secondary="週に1回、契約書レビューのサマリーを受信"
                />
                <Switch checked={weeklyReportNotif} onChange={(e) => setWeeklyReportNotif(e.target.checked)} />
              </ListItem>
            </List>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSaveNotifications}
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  px: 4,
                  '&:hover': { bgcolor: 'grey.800' },
                }}
              >
                保存
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}
