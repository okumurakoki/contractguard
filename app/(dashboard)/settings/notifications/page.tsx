'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  DesktopWindows as BrowserIcon,
  Analytics as AnalyticsIcon,
  Gavel as LawyerIcon,
  Event as EventIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  requestNotificationPermission,
  getNotificationPermission,
  showNotification,
} from '@/lib/notifications/browser';

interface NotificationSettings {
  emailEnabled: boolean;
  browserEnabled: boolean;
  analysisComplete: boolean;
  highRiskAlert: boolean;
  consultationReminder: boolean;
  expiryReminder: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = React.useState<NotificationSettings>({
    emailEnabled: true,
    browserEnabled: false,
    analysisComplete: true,
    highRiskAlert: true,
    consultationReminder: true,
    expiryReminder: true,
  });
  const [browserPermission, setBrowserPermission] = React.useState<string>('default');
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  // ブラウザ通知の許可状態を取得
  React.useEffect(() => {
    const permission = getNotificationPermission();
    setBrowserPermission(permission);

    // ローカルストレージから設定を読み込む
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse notification settings:', e);
      }
    }
  }, []);

  // ブラウザ通知の許可をリクエスト
  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setBrowserPermission(permission);

    if (permission === 'granted') {
      setSettings((prev) => ({ ...prev, browserEnabled: true }));
      setSuccess('ブラウザ通知が有効になりました');

      // テスト通知を表示
      showNotification({
        title: 'ContractGuard',
        body: 'ブラウザ通知が正常に設定されました！',
      });
    } else if (permission === 'denied') {
      setError('ブラウザ通知がブロックされています。ブラウザの設定から許可してください。');
    }
  };

  // 設定を保存
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // ローカルストレージに保存
      localStorage.setItem('notificationSettings', JSON.stringify(settings));

      // サーバーにも保存（API実装後）
      // await fetch('/api/settings/notifications', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings),
      // });

      setSuccess('設定を保存しました');
    } catch (err) {
      setError('設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 設定を変更
  const handleChange = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const permissionStatus = () => {
    switch (browserPermission) {
      case 'granted':
        return <Chip label="許可済み" color="success" size="small" />;
      case 'denied':
        return <Chip label="ブロック中" color="error" size="small" />;
      case 'unsupported':
        return <Chip label="非対応" color="default" size="small" />;
      default:
        return <Chip label="未設定" color="warning" size="small" />;
    }
  };

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#1a2332' }}>
          通知設定
        </Typography>
        <Typography variant="body1" color="text.secondary">
          メール通知とブラウザ通知の設定を管理します
        </Typography>
      </Box>

      {/* メッセージ */}
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

      {/* 通知チャネル */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          通知チャネル
        </Typography>
        <Divider sx={{ my: 2 }} />

        <List>
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText
              primary="メール通知"
              secondary="重要な通知をメールで受け取ります"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.emailEnabled}
                onChange={() => handleChange('emailEnabled')}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <BrowserIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  ブラウザ通知
                  {permissionStatus()}
                </Box>
              }
              secondary="デスクトップ通知をリアルタイムで受け取ります"
            />
            <ListItemSecondaryAction>
              {browserPermission === 'granted' ? (
                <Switch
                  checked={settings.browserEnabled}
                  onChange={() => handleChange('browserEnabled')}
                />
              ) : browserPermission === 'unsupported' ? (
                <Typography variant="body2" color="text.secondary">
                  非対応
                </Typography>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleRequestPermission}
                >
                  許可する
                </Button>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      {/* 通知タイプ */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          通知タイプ
        </Typography>
        <Divider sx={{ my: 2 }} />

        <List>
          <ListItem>
            <ListItemIcon>
              <AnalyticsIcon />
            </ListItemIcon>
            <ListItemText
              primary="AI分析完了通知"
              secondary="契約書のAI分析が完了したときに通知します"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.analysisComplete}
                onChange={() => handleChange('analysisComplete')}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <WarningIcon sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText
              primary="高リスクアラート"
              secondary="高リスク項目が検出されたときに即座に通知します"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.highRiskAlert}
                onChange={() => handleChange('highRiskAlert')}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <LawyerIcon />
            </ListItemIcon>
            <ListItemText
              primary="弁護士相談リマインダー"
              secondary="予約した相談の前日にリマインダーを送信します"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.consultationReminder}
                onChange={() => handleChange('consultationReminder')}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <EventIcon />
            </ListItemIcon>
            <ListItemText
              primary="契約書有効期限リマインダー"
              secondary="契約書の有効期限が近づいたときに通知します"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.expiryReminder}
                onChange={() => handleChange('expiryReminder')}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      {/* 保存ボタン */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: '#1e40af',
            '&:hover': { bgcolor: '#1e3a8a' },
          }}
        >
          {saving ? '保存中...' : '設定を保存'}
        </Button>
      </Box>
    </Box>
  );
}
