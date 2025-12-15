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
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  Checkbox,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Notifications as NotificationIcon,
  NotificationsActive as NotificationActiveIcon,
  CloudDownload as ExportIcon,
  LocalOffer as TagIcon,
  Close as CloseIcon,
  CompareArrows as CompareIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Contract {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'analyzing' | 'completed' | 'archived';
  riskLevel: 'high' | 'medium' | 'low' | null;
  riskCount: number;
  expiryDate?: string;
  reminderEnabled?: boolean;
  reminderDays?: number;
  tags?: string[];
  counterparty?: string;
}

// APIレスポンスをUIの形式に変換
function mapApiContractToUi(apiContract: {
  id: string;
  contractTitle: string | null;
  fileName: string;
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
}): Contract {
  return {
    id: apiContract.id,
    name: apiContract.contractTitle || apiContract.fileName,
    type: apiContract.contractType || '未分類',
    uploadDate: new Date(apiContract.createdAt).toLocaleDateString('ja-JP'),
    status: apiContract.status as Contract['status'],
    riskLevel: apiContract.review?.riskLevel as Contract['riskLevel'] || null,
    riskCount: 0, // TODO: APIでリスク数を返す
    expiryDate: apiContract.expiryDate ? new Date(apiContract.expiryDate).toLocaleDateString('ja-JP') : undefined,
    tags: apiContract.tags || [],
    counterparty: apiContract.counterparty || undefined,
  };
}

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 契約書一覧を取得
  const fetchContracts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/contracts');
      if (!response.ok) {
        throw new Error('契約書一覧の取得に失敗しました');
      }
      const data = await response.json();
      setContracts(data.contracts.map(mapApiContractToUi));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedContract, setSelectedContract] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState('all');
  const [filterRisk, setFilterRisk] = React.useState('all');
  const [tabValue, setTabValue] = React.useState(0);
  const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
  const [editingReminder, setEditingReminder] = React.useState<Contract | null>(null);
  const [reminderEnabled, setReminderEnabled] = React.useState(false);
  const [reminderDays, setReminderDays] = React.useState('30');
  const [expiryDate, setExpiryDate] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [tagDialogOpen, setTagDialogOpen] = React.useState(false);
  const [editingTags, setEditingTags] = React.useState<Contract | null>(null);
  const [currentTags, setCurrentTags] = React.useState<string[]>([]);
  const [newTag, setNewTag] = React.useState('');
  const [compareMode, setCompareMode] = React.useState(false);
  const [selectedForCompare, setSelectedForCompare] = React.useState<string[]>([]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, contractId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedContract(contractId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContract(null);
  };

  const handleDelete = async () => {
    if (selectedContract) {
      try {
        const response = await fetch(`/api/contracts/${selectedContract}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('削除に失敗しました');
        }
        setContracts(contracts.filter((c) => c.id !== selectedContract));
        setSuccess('契約書を削除しました');
      } catch (err) {
        setError(err instanceof Error ? err.message : '削除に失敗しました');
      }
    }
    handleMenuClose();
  };

  const handleOpenReminderDialog = (contract: Contract) => {
    setEditingReminder(contract);
    setExpiryDate(contract.expiryDate || '');
    setReminderEnabled(contract.reminderEnabled || false);
    setReminderDays(contract.reminderDays?.toString() || '30');
    setReminderDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseReminderDialog = () => {
    setReminderDialogOpen(false);
    setEditingReminder(null);
    setExpiryDate('');
    setReminderEnabled(false);
    setReminderDays('30');
  };

  const handleSaveReminder = () => {
    if (!editingReminder) return;

    setContracts(
      contracts.map((c) =>
        c.id === editingReminder.id
          ? {
              ...c,
              expiryDate: expiryDate || undefined,
              reminderEnabled,
              reminderDays: reminderEnabled ? parseInt(reminderDays) : undefined,
            }
          : c
      )
    );

    setSuccess('リマインダー設定を保存しました');
    handleCloseReminderDialog();
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryChip = (expiryDate: string, reminderEnabled?: boolean) => {
    const daysLeft = getDaysUntilExpiry(expiryDate);

    if (daysLeft < 0) {
      return (
        <Chip
          label="期限切れ"
          size="small"
          sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 600 }}
        />
      );
    } else if (daysLeft <= 30) {
      return (
        <Chip
          label={`あと${daysLeft}日`}
          size="small"
          icon={reminderEnabled ? <NotificationActiveIcon /> : <WarningIcon />}
          sx={{ bgcolor: 'warning.main', color: 'white', fontWeight: 600 }}
        />
      );
    } else if (daysLeft <= 90) {
      return (
        <Chip
          label={`あと${daysLeft}日`}
          size="small"
          icon={reminderEnabled ? <NotificationActiveIcon /> : undefined}
          color="warning"
          variant="outlined"
        />
      );
    } else {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {expiryDate}
          {reminderEnabled && <NotificationActiveIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
        </Typography>
      );
    }
  };

  const handleExportCSV = () => {
    const headers = ['契約書名', '種類', 'アップロード日', '有効期限', 'ステータス', 'リスクレベル', 'リスク数'];
    const rows = filteredContracts.map((c) => [
      c.name,
      c.type,
      c.uploadDate,
      c.expiryDate || '',
      c.status === 'completed' ? '分析完了' : c.status === 'analyzing' ? '分析中' : 'アーカイブ済',
      c.riskLevel === 'high' ? '高' : c.riskLevel === 'medium' ? '中' : '低',
      c.riskCount.toString(),
    ]);

    const csvContent =
      '\uFEFF' + // BOM for Excel UTF-8 support
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `契約書一覧_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess('CSVファイルをエクスポートしました');
    setExportMenuAnchor(null);
  };

  const handleExportExcel = () => {
    // Excel形式でのエクスポート（簡易版：TSVとして保存）
    const headers = ['契約書名', '種類', 'アップロード日', '有効期限', 'ステータス', 'リスクレベル', 'リスク数'];
    const rows = filteredContracts.map((c) => [
      c.name,
      c.type,
      c.uploadDate,
      c.expiryDate || '',
      c.status === 'completed' ? '分析完了' : c.status === 'analyzing' ? '分析中' : 'アーカイブ済',
      c.riskLevel === 'high' ? '高' : c.riskLevel === 'medium' ? '中' : '低',
      c.riskCount.toString(),
    ]);

    const tsvContent = '\uFEFF' + [headers, ...rows].map((row) => row.join('\t')).join('\n');

    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `契約書一覧_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess('Excelファイルをエクスポートしました');
    setExportMenuAnchor(null);
  };

  const handleOpenTagDialog = (contract: Contract) => {
    setEditingTags(contract);
    setCurrentTags(contract.tags || []);
    setNewTag('');
    setTagDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseTagDialog = () => {
    setTagDialogOpen(false);
    setEditingTags(null);
    setCurrentTags([]);
    setNewTag('');
  };

  const handleAddTag = () => {
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      setCurrentTags([...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setCurrentTags(currentTags.filter((t) => t !== tag));
  };

  const handleSaveTags = () => {
    if (!editingTags) return;

    setContracts(
      contracts.map((c) =>
        c.id === editingTags.id
          ? { ...c, tags: currentTags }
          : c
      )
    );

    setSuccess('タグを更新しました');
    handleCloseTagDialog();
  };

  const handleToggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedForCompare([]);
  };

  const handleToggleSelectForCompare = (contractId: string) => {
    if (selectedForCompare.includes(contractId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== contractId));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, contractId]);
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2) {
      router.push(`/contracts/compare?ids=${selectedForCompare.join(',')}`);
    }
  };

  const getRiskChip = (level: string, count: number) => {
    const config = {
      high: { label: `高リスク (${count})`, color: 'error' as const, icon: <ErrorIcon sx={{ fontSize: 16 }} /> },
      medium: {
        label: `中リスク (${count})`,
        color: 'warning' as const,
        icon: <WarningIcon sx={{ fontSize: 16 }} />,
      },
      low: { label: `低リスク (${count})`, color: 'success' as const, icon: <CheckIcon sx={{ fontSize: 16 }} /> },
    };
    const { label, color, icon } = config[level as keyof typeof config];
    return <Chip label={label} color={color} size="small" icon={icon} sx={{ fontWeight: 600 }} />;
  };

  const getStatusChip = (status: string) => {
    const config = {
      completed: { label: '分析完了', color: 'success' as const },
      analyzing: { label: '分析中', color: 'warning' as const },
      archived: { label: 'アーカイブ済', color: 'default' as const },
    };
    const { label, color } = config[status as keyof typeof config] || { label: status, color: 'default' as const };
    return <Chip label={label} color={color} size="small" variant="outlined" />;
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = contract.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || contract.type === filterType;
    const matchesRisk = filterRisk === 'all' || contract.riskLevel === filterRisk;
    const matchesTab =
      tabValue === 0 || (tabValue === 1 && contract.status === 'completed') || (tabValue === 2 && contract.status === 'analyzing');
    return matchesSearch && matchesType && matchesRisk && matchesTab;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            契約書一覧
          </Typography>
          <Typography variant="body2" color="text.secondary">
            アップロードした契約書とレビュー結果を管理
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={compareMode ? 'contained' : 'outlined'}
            startIcon={<CompareIcon />}
            onClick={handleToggleCompareMode}
            sx={{
              borderColor: 'grey.300',
              color: compareMode ? 'white' : 'black',
              bgcolor: compareMode ? 'black' : 'transparent',
              '&:hover': {
                borderColor: 'black',
                bgcolor: compareMode ? 'grey.800' : 'grey.50',
              },
            }}
          >
            比較モード
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            sx={{
              borderColor: 'grey.300',
              color: 'black',
              '&:hover': { borderColor: 'black', bgcolor: 'grey.50' },
            }}
          >
            エクスポート
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {compareMode && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleCompare}
              disabled={selectedForCompare.length !== 2}
              sx={{ fontWeight: 600 }}
            >
              比較する
            </Button>
          }
        >
          比較する契約書を2つ選択してください ({selectedForCompare.length}/2)
        </Alert>
      )}

      {/* フィルター */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
          <TextField
            placeholder="契約書名で検索"
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
            <InputLabel>契約書の種類</InputLabel>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} label="契約書の種類">
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="業務委託契約">業務委託契約</MenuItem>
              <MenuItem value="秘密保持契約">秘密保持契約</MenuItem>
              <MenuItem value="売買契約">売買契約</MenuItem>
              <MenuItem value="賃貸借契約">賃貸借契約</MenuItem>
              <MenuItem value="雇用契約">雇用契約</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>リスクレベル</InputLabel>
            <Select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} label="リスクレベル">
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="high">高リスク</MenuItem>
              <MenuItem value="medium">中リスク</MenuItem>
              <MenuItem value="low">低リスク</MenuItem>
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
          <Tab label={`すべて (${contracts.length})`} />
          <Tab label={`分析完了 (${contracts.filter((c) => c.status === 'completed').length})`} />
          <Tab label={`分析中 (${contracts.filter((c) => c.status === 'analyzing').length})`} />
        </Tabs>

        {/* テーブル */}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                {compareMode && <TableCell sx={{ fontWeight: 700, width: 50 }}>選択</TableCell>}
                <TableCell sx={{ fontWeight: 700 }}>契約書名</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>種類</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>アップロード日</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>有効期限</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ステータス</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>リスク評価</TableCell>
                {!compareMode && (
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    操作
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // ローディングスケルトン
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {compareMode && <TableCell><Skeleton variant="rectangular" width={24} height={24} /></TableCell>}
                    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={100} height={24} /></TableCell>
                    {!compareMode && <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>}
                  </TableRow>
                ))
              ) : filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={compareMode ? 7 : 8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {contracts.length === 0 ? '契約書がまだありません' : '該当する契約書がありません'}
                      </Typography>
                      {contracts.length === 0 && (
                        <Button
                          component={Link}
                          href="/upload"
                          variant="contained"
                          startIcon={<AddIcon />}
                          sx={{
                            bgcolor: 'black',
                            color: 'white',
                            '&:hover': { bgcolor: 'grey.800' },
                          }}
                        >
                          契約書をアップロード
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <TableRow
                    key={contract.id}
                    hover
                    onClick={() => compareMode && handleToggleSelectForCompare(contract.id)}
                    sx={{
                      cursor: compareMode ? 'pointer' : 'default',
                      '&:hover': { bgcolor: 'grey.50' },
                      bgcolor: selectedForCompare.includes(contract.id) ? 'primary.50' : 'inherit',
                    }}
                  >
                    {compareMode && (
                      <TableCell>
                        <Checkbox
                          checked={selectedForCompare.includes(contract.id)}
                          onChange={() => handleToggleSelectForCompare(contract.id)}
                          disabled={!selectedForCompare.includes(contract.id) && selectedForCompare.length >= 2}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {contract.name}
                      </Typography>
                      {contract.tags && contract.tags.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          {contract.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              icon={<TagIcon sx={{ fontSize: 14 }} />}
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: 'grey.100',
                                '& .MuiChip-icon': { ml: 0.5 },
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {contract.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {contract.uploadDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {contract.expiryDate ? (
                        getExpiryChip(contract.expiryDate, contract.reminderEnabled)
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          未設定
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(contract.status)}</TableCell>
                    <TableCell>
                      {contract.status === 'completed' && contract.riskLevel ? getRiskChip(contract.riskLevel, contract.riskCount) : '-'}
                    </TableCell>
                    {!compareMode && (
                      <TableCell align="right">
                        <IconButton
                          component={Link}
                          href={`/contracts/${contract.id}`}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, contract.id)}>
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* メニュー */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            const contract = contracts.find((c) => c.id === selectedContract);
            if (contract) handleOpenReminderDialog(contract);
          }}
        >
          <NotificationIcon sx={{ mr: 1, fontSize: 20 }} />
          リマインダー設定
        </MenuItem>
        <MenuItem
          onClick={() => {
            const contract = contracts.find((c) => c.id === selectedContract);
            if (contract) handleOpenTagDialog(contract);
          }}
        >
          <TagIcon sx={{ mr: 1, fontSize: 20 }} />
          タグ編集
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          ダウンロード
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          削除
        </MenuItem>
      </Menu>

      {/* エクスポートメニュー */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={handleExportCSV}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          CSV形式でエクスポート
        </MenuItem>
        <MenuItem onClick={handleExportExcel}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          Excel形式でエクスポート
        </MenuItem>
      </Menu>

      {/* リマインダー設定ダイアログ */}
      <Dialog open={reminderDialogOpen} onClose={handleCloseReminderDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>契約更新リマインダー設定</DialogTitle>
        <DialogContent>
          {editingReminder && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                契約書: <strong>{editingReminder.name}</strong>
              </Typography>

              <Box sx={{ display: 'grid', gap: 3 }}>
                <TextField
                  label="有効期限"
                  type="date"
                  fullWidth
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="契約の有効期限を設定してください"
                />

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={reminderEnabled}
                        onChange={(e) => setReminderEnabled(e.target.checked)}
                      />
                    }
                    label="リマインダーを有効にする"
                  />

                  {reminderEnabled && (
                    <Box sx={{ mt: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>通知タイミング</InputLabel>
                        <Select
                          value={reminderDays}
                          onChange={(e) => setReminderDays(e.target.value)}
                          label="通知タイミング"
                        >
                          <MenuItem value="7">7日前</MenuItem>
                          <MenuItem value="14">14日前</MenuItem>
                          <MenuItem value="30">30日前</MenuItem>
                          <MenuItem value="60">60日前</MenuItem>
                          <MenuItem value="90">90日前</MenuItem>
                        </Select>
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        有効期限の{reminderDays}日前にメール通知を送信します
                      </Typography>
                    </Box>
                  )}
                </Box>

                {expiryDate && (
                  <Alert severity="info">
                    有効期限: {expiryDate}
                    {reminderEnabled && ` • ${reminderDays}日前に通知`}
                  </Alert>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseReminderDialog} sx={{ color: 'grey.600' }}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveReminder}
            variant="contained"
            disabled={!expiryDate}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* タグ編集ダイアログ */}
      <Dialog open={tagDialogOpen} onClose={handleCloseTagDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>タグ編集</DialogTitle>
        <DialogContent>
          {editingTags && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                契約書: <strong>{editingTags.name}</strong>
              </Typography>

              <Box sx={{ display: 'grid', gap: 3 }}>
                {/* 現在のタグ表示 */}
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    現在のタグ
                  </Typography>
                  {currentTags.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      タグが設定されていません
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {currentTags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          icon={<TagIcon sx={{ fontSize: 14 }} />}
                          onDelete={() => handleRemoveTag(tag)}
                          deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            bgcolor: 'grey.100',
                            '& .MuiChip-deleteIcon': {
                              color: 'grey.600',
                              '&:hover': { color: 'error.main' },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* 新しいタグを追加 */}
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    タグを追加
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      placeholder="タグ名を入力"
                      size="small"
                      fullWidth
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddTag}
                      disabled={!newTag.trim() || currentTags.includes(newTag.trim())}
                      sx={{
                        borderColor: 'grey.300',
                        color: 'black',
                        '&:hover': { borderColor: 'black' },
                      }}
                    >
                      追加
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Enterキーでも追加できます
                  </Typography>
                </Box>

                <Alert severity="info">
                  タグを使用して契約書を分類・整理できます。例: 「重要」「長期契約」「NDA」など
                </Alert>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseTagDialog} sx={{ color: 'grey.600' }}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveTags}
            variant="contained"
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
