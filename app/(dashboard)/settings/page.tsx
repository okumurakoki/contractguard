'use client';

import * as React from 'react';
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
  const [tabValue, setTabValue] = React.useState(0);
  const [success, setSuccess] = React.useState('');

  // プロフィール設定
  const [name, setName] = React.useState('山田太郎');
  const [email, setEmail] = React.useState('yamada@example.com');
  const [phone, setPhone] = React.useState('090-1234-5678');

  // 組織設定
  const [orgName, setOrgName] = React.useState('株式会社サンプル');
  const [orgPostalCode, setOrgPostalCode] = React.useState('150-0001');
  const [orgAddress, setOrgAddress] = React.useState('東京都渋谷区神宮前1-1-1');
  const [orgPhone, setOrgPhone] = React.useState('03-1234-5678');
  const [orgEmail, setOrgEmail] = React.useState('info@example.com');
  const [orgRepresentative, setOrgRepresentative] = React.useState('山田太郎');
  const [orgWebsite, setOrgWebsite] = React.useState('https://example.com');

  // 通知設定
  const [emailNotif, setEmailNotif] = React.useState(true);
  const [riskAlertNotif, setRiskAlertNotif] = React.useState(true);
  const [weeklyReportNotif, setWeeklyReportNotif] = React.useState(false);

  const handleSaveProfile = () => {
    setSuccess('プロフィールを更新しました');
  };

  const handleSaveOrganization = () => {
    setSuccess('組織情報を更新しました');
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
              <Avatar
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
                <Button variant="outlined" size="small" sx={{ borderColor: 'grey.300', color: 'black', mr: 1 }}>
                  画像を変更
                </Button>
                <Button size="small" sx={{ color: 'error.main' }}>
                  削除
                </Button>
              </Box>
            </Box>

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

        {/* 組織情報 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Box sx={{ display: 'grid', gap: 3 }}>
              <TextField label="組織名・法人名" fullWidth required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              <TextField label="代表者名" fullWidth value={orgRepresentative} onChange={(e) => setOrgRepresentative(e.target.value)} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
                <TextField label="郵便番号" fullWidth value={orgPostalCode} onChange={(e) => setOrgPostalCode(e.target.value)} placeholder="150-0001" />
                <TextField label="都道府県・市区町村" fullWidth value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} />
              </Box>

              <TextField label="番地・建物名" fullWidth placeholder="神宮前1-1-1 サンプルビル3F" />

              <TextField label="電話番号" fullWidth value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} />
              <TextField label="メールアドレス" type="email" fullWidth value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} />
              <TextField label="ウェブサイト" type="url" fullWidth value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} placeholder="https://" />
            </Box>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSaveOrganization}
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
                    <Chip label="Liteプラン" sx={{ bgcolor: 'grey.100', fontWeight: 600 }} />
                    <Typography variant="body2" color="text.secondary">
                      ¥5,000/月
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  sx={{ borderColor: 'grey.300', color: 'black' }}
                >
                  プラン変更
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="契約書レビュー" secondary="月20件まで" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="ストレージ" secondary="10GB" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="チームメンバー" secondary="5人まで" />
                </ListItem>
              </List>
            </Paper>

            <Typography variant="h6" fontWeight={700} gutterBottom>
              お支払い方法
            </Typography>
            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    クレジットカード
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    **** **** **** 1234
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    有効期限: 12/25
                  </Typography>
                </Box>
                <Button size="small" sx={{ color: 'grey.700' }}>
                  変更
                </Button>
              </Box>
            </Paper>

            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 2 }}>
              請求履歴
            </Typography>
            <List sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
              <ListItem sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
                <ListItemText primary="2024年1月" secondary="¥5,000" />
                <Button size="small" sx={{ color: 'grey.700' }}>
                  ダウンロード
                </Button>
              </ListItem>
              <ListItem sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
                <ListItemText primary="2023年12月" secondary="¥5,000" />
                <Button size="small" sx={{ color: 'grey.700' }}>
                  ダウンロード
                </Button>
              </ListItem>
              <ListItem>
                <ListItemText primary="2023年11月" secondary="¥5,000" />
                <Button size="small" sx={{ color: 'grey.700' }}>
                  ダウンロード
                </Button>
              </ListItem>
            </List>
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
