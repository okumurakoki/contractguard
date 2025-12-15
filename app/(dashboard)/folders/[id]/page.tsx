'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  FileDownload as DownloadIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface Contract {
  id: string;
  contractTitle: string | null;
  fileName: string;
  contractType: string | null;
  createdAt: string;
  status: 'analyzing' | 'completed' | 'archived';
  review?: {
    riskLevel: string | null;
    overallScore: number | null;
  } | null;
}

interface Folder {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  _count: {
    contracts: number;
  };
}

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;
  const [folder, setFolder] = React.useState<Folder | null>(null);
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedContract, setSelectedContract] = React.useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editFolderName, setEditFolderName] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const isUncategorized = folderId === 'uncategorized';
  const folderName = isUncategorized ? '未分類' : folder?.name || '';

  // データ取得
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // フォルダ情報を取得（未分類以外）
      if (!isUncategorized) {
        const folderResponse = await fetch(`/api/folders/${folderId}`);
        if (!folderResponse.ok) {
          throw new Error('フォルダが見つかりません');
        }
        const folderData = await folderResponse.json();
        setFolder(folderData.folder);
        setEditFolderName(folderData.folder.name);
      }

      // 契約書一覧を取得
      const contractsUrl = isUncategorized
        ? '/api/contracts'
        : `/api/contracts?folderId=${folderId}`;
      const contractsResponse = await fetch(contractsUrl);
      if (!contractsResponse.ok) {
        throw new Error('契約書の取得に失敗しました');
      }
      const contractsData = await contractsResponse.json();

      // 未分類の場合はfolderIdがnullのものだけフィルタ
      const filteredContracts = isUncategorized
        ? contractsData.contracts.filter((c: { folderId: string | null }) => !c.folderId)
        : contractsData.contracts;

      setContracts(filteredContracts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [folderId, isUncategorized]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditFolder = async () => {
    if (!editFolderName.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editFolderName }),
      });
      if (!response.ok) throw new Error('更新に失敗しました');
      await fetchData();
      setEditDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

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
        if (!response.ok) throw new Error('削除に失敗しました');
        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : '削除に失敗しました');
      }
    }
    handleMenuClose();
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
      archived: { label: 'アーカイブ', color: 'default' as const },
    };
    const statusConfig = config[status as keyof typeof config] || config.analyzing;
    return <Chip label={statusConfig.label} color={statusConfig.color} size="small" variant="outlined" />;
  };

  const filteredContracts = contracts.filter((contract) => {
    const name = contract.contractTitle || contract.fileName;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <Box>
        <IconButton component={Link} href="/folders" sx={{ mb: 2 }}>
          <BackIcon />
        </IconButton>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={100} height={24} sx={{ mb: 4 }} />
        <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
          <Skeleton variant="rectangular" height={40} />
        </Paper>
        <Paper sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'grey.100' }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          ))}
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <IconButton component={Link} href="/folders" sx={{ mb: 2 }}>
          <BackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {folderName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {contracts.length}件の契約書
            </Typography>
          </Box>
          {!isUncategorized && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
              sx={{ borderColor: 'grey.300', color: 'black' }}
            >
              フォルダ編集
            </Button>
          )}
        </Box>
      </Box>

      {/* 検索 */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
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
          fullWidth
        />
      </Paper>

      {/* 契約書一覧 */}
      <Paper sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>契約書名</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>種類</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>アップロード日</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ステータス</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>リスク評価</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      該当する契約書がありません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <TableRow
                    key={contract.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.50' },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {contract.contractTitle || contract.fileName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {contract.contractType || '未分類'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(contract.createdAt).toLocaleDateString('ja-JP')}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(contract.status)}</TableCell>
                    <TableCell>
                      {contract.status === 'completed' && contract.review?.riskLevel
                        ? getRiskChip(contract.review.riskLevel, contract.review.overallScore || 0)
                        : '-'}
                    </TableCell>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* メニュー */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          ダウンロード
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          削除
        </MenuItem>
      </Menu>

      {/* フォルダ編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>フォルダを編集</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="フォルダ名"
              required
              fullWidth
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: 'grey.600' }} disabled={saving}>
            キャンセル
          </Button>
          <Button
            onClick={handleEditFolder}
            variant="contained"
            disabled={!editFolderName.trim() || saving}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            {saving ? '保存中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
