'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as DownloadIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  Settings as SettingsIcon,
  Upload as UploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: 'contract' | 'user' | 'system' | 'security';
  target: string;
  details: string;
  ipAddress: string;
  result: 'success' | 'failed';
}

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:35:22',
    user: '山田太郎',
    action: '契約書アップロード',
    category: 'contract',
    target: '業務委託契約書_ABC社.pdf',
    details: '新規契約書をアップロードしました',
    ipAddress: '192.168.1.100',
    result: 'success',
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:30:15',
    user: '佐藤花子',
    action: '契約書編集',
    category: 'contract',
    target: '秘密保持契約_XYZ社',
    details: '第5条の内容を更新しました',
    ipAddress: '192.168.1.101',
    result: 'success',
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:25:08',
    user: '山田太郎',
    action: '契約書削除',
    category: 'contract',
    target: '旧契約書_2023.pdf',
    details: '期限切れ契約書を削除しました',
    ipAddress: '192.168.1.100',
    result: 'success',
  },
  {
    id: '4',
    timestamp: '2024-01-15 14:20:45',
    user: '佐藤花子',
    action: 'ユーザー追加',
    category: 'user',
    target: '鈴木一郎',
    details: '新規メンバーを追加しました（役割: メンバー）',
    ipAddress: '192.168.1.101',
    result: 'success',
  },
  {
    id: '5',
    timestamp: '2024-01-15 14:15:33',
    user: 'システム',
    action: 'リマインダー送信',
    category: 'system',
    target: '業務委託契約書_ABC社',
    details: '契約期限30日前の通知を送信しました',
    ipAddress: 'システム',
    result: 'success',
  },
  {
    id: '6',
    timestamp: '2024-01-15 14:10:12',
    user: '山田太郎',
    action: 'ログイン',
    category: 'security',
    target: 'ダッシュボード',
    details: 'ログインに成功しました',
    ipAddress: '192.168.1.100',
    result: 'success',
  },
  {
    id: '7',
    timestamp: '2024-01-15 14:05:28',
    user: '不明',
    action: 'ログイン試行',
    category: 'security',
    target: 'ログインページ',
    details: 'ログインに失敗しました（パスワード誤り）',
    ipAddress: '203.0.113.42',
    result: 'failed',
  },
  {
    id: '8',
    timestamp: '2024-01-15 14:00:55',
    user: '佐藤花子',
    action: '契約書共有',
    category: 'contract',
    target: '売買契約書_DEF社',
    details: '外部ユーザーに契約書を共有しました',
    ipAddress: '192.168.1.101',
    result: 'success',
  },
  {
    id: '9',
    timestamp: '2024-01-15 13:55:17',
    user: 'システム',
    action: 'バックアップ実行',
    category: 'system',
    target: '全データ',
    details: '定期バックアップを実行しました',
    ipAddress: 'システム',
    result: 'success',
  },
  {
    id: '10',
    timestamp: '2024-01-15 13:50:42',
    user: '山田太郎',
    action: '設定変更',
    category: 'system',
    target: 'リマインダー設定',
    details: '通知タイミングを30日前から60日前に変更しました',
    ipAddress: '192.168.1.100',
    result: 'success',
  },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterResult, setFilterResult] = React.useState('all');
  const [tabValue, setTabValue] = React.useState(0);
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);

  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedLog(null);
  };

  const handleExport = () => {
    const headers = ['日時', 'ユーザー', 'アクション', 'カテゴリ', '対象', '詳細', 'IPアドレス', '結果'];
    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.user,
      log.action,
      log.category,
      log.target,
      log.details,
      log.ipAddress,
      log.result === 'success' ? '成功' : '失敗',
    ]);

    const csvContent =
      '\uFEFF' + // BOM for Excel UTF-8 support
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `監査ログ_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contract':
        return <DocumentIcon sx={{ fontSize: 18 }} />;
      case 'user':
        return <PersonIcon sx={{ fontSize: 18 }} />;
      case 'system':
        return <SettingsIcon sx={{ fontSize: 18 }} />;
      case 'security':
        return <SecurityIcon sx={{ fontSize: 18 }} />;
      default:
        return <DocumentIcon sx={{ fontSize: 18 }} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'contract':
        return '契約書';
      case 'user':
        return 'ユーザー';
      case 'system':
        return 'システム';
      case 'security':
        return 'セキュリティ';
      default:
        return '';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contract':
        return 'primary';
      case 'user':
        return 'info';
      case 'system':
        return 'default';
      case 'security':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;
    const matchesResult = filterResult === 'all' || log.result === filterResult;
    const matchesTab =
      tabValue === 0 ||
      (tabValue === 1 && log.category === 'contract') ||
      (tabValue === 2 && log.category === 'security') ||
      (tabValue === 3 && log.result === 'failed');
    return matchesSearch && matchesCategory && matchesResult && matchesTab;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            監査ログ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            システムの操作履歴とセキュリティイベントを確認
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          sx={{
            borderColor: 'grey.300',
            color: 'black',
            '&:hover': { borderColor: 'black', bgcolor: 'grey.50' },
          }}
        >
          CSVエクスポート
        </Button>
      </Box>

      {/* フィルター */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
          <TextField
            placeholder="ユーザー、アクション、対象で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <FormControl size="small">
            <InputLabel>カテゴリ</InputLabel>
            <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} label="カテゴリ">
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="contract">契約書</MenuItem>
              <MenuItem value="user">ユーザー</MenuItem>
              <MenuItem value="system">システム</MenuItem>
              <MenuItem value="security">セキュリティ</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>結果</InputLabel>
            <Select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} label="結果">
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="success">成功</MenuItem>
              <MenuItem value="failed">失敗</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* タブ */}
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
          <Tab label={`すべて (${logs.length})`} />
          <Tab label={`契約書操作 (${logs.filter((l) => l.category === 'contract').length})`} />
          <Tab label={`セキュリティ (${logs.filter((l) => l.category === 'security').length})`} />
          <Tab label={`失敗 (${logs.filter((l) => l.result === 'failed').length})`} />
        </Tabs>

        {/* テーブル */}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>日時</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ユーザー</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>アクション</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>カテゴリ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>対象</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>結果</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      該当するログがありません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: 'grey.50' },
                      bgcolor: log.result === 'failed' ? 'error.50' : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {log.timestamp}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                        <Typography variant="body2">{log.user}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {log.action}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryLabel(log.category)}
                        size="small"
                        icon={getCategoryIcon(log.category)}
                        color={getCategoryColor(log.category) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.target}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.result === 'success' ? '成功' : '失敗'}
                        size="small"
                        color={log.result === 'success' ? 'success' : 'error'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDetail(log)}>
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>ログ詳細</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gap: 3 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    基本情報
                  </Typography>
                  <Paper variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, width: '30%' }}>日時</TableCell>
                          <TableCell>{selectedLog.timestamp}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>ユーザー</TableCell>
                          <TableCell>{selectedLog.user}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>アクション</TableCell>
                          <TableCell>{selectedLog.action}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>カテゴリ</TableCell>
                          <TableCell>
                            <Chip
                              label={getCategoryLabel(selectedLog.category)}
                              size="small"
                              icon={getCategoryIcon(selectedLog.category)}
                              color={getCategoryColor(selectedLog.category) as any}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>対象</TableCell>
                          <TableCell>{selectedLog.target}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>結果</TableCell>
                          <TableCell>
                            <Chip
                              label={selectedLog.result === 'success' ? '成功' : '失敗'}
                              size="small"
                              color={selectedLog.result === 'success' ? 'success' : 'error'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>IPアドレス</TableCell>
                          <TableCell>{selectedLog.ipAddress}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    詳細
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">{selectedLog.details}</Typography>
                  </Paper>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDetail} sx={{ color: 'grey.600' }}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
