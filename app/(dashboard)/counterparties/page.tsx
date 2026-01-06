'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

interface Counterparty {
  id: string;
  name: string;
  shortName: string | null;
  address: string | null;
  representative: string | null;
  repTitle: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  notes: string | null;
}

const CATEGORIES = [
  { value: 'customer', label: '顧客' },
  { value: 'supplier', label: '仕入先' },
  { value: 'partner', label: 'パートナー' },
  { value: 'other', label: 'その他' },
];

export default function CounterpartiesPage() {
  const [counterparties, setCounterparties] = React.useState<Counterparty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // ダイアログ状態
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // フォーム状態
  const [formData, setFormData] = React.useState({
    name: '',
    shortName: '',
    address: '',
    representative: '',
    repTitle: '',
    email: '',
    phone: '',
    category: '',
    notes: '',
  });

  // 取引先一覧を取得
  const fetchCounterparties = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/counterparties');
      if (!response.ok) throw new Error('取得に失敗しました');
      const data = await response.json();
      setCounterparties(data.counterparties);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCounterparties();
  }, [fetchCounterparties]);

  // ダイアログを開く（新規作成）
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      shortName: '',
      address: '',
      representative: '',
      repTitle: '代表取締役',
      email: '',
      phone: '',
      category: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  // ダイアログを開く（編集）
  const handleOpenEdit = (cp: Counterparty) => {
    setEditingId(cp.id);
    setFormData({
      name: cp.name,
      shortName: cp.shortName || '',
      address: cp.address || '',
      representative: cp.representative || '',
      repTitle: cp.repTitle || '',
      email: cp.email || '',
      phone: cp.phone || '',
      category: cp.category || '',
      notes: cp.notes || '',
    });
    setDialogOpen(true);
  };

  // 保存
  const handleSave = async () => {
    try {
      setError(null);
      const url = editingId ? `/api/counterparties/${editingId}` : '/api/counterparties';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      setSuccess(editingId ? '取引先を更新しました' : '取引先を登録しました');
      setDialogOpen(false);
      fetchCounterparties();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    }
  };

  // 削除確認
  const handleDeleteConfirm = (id: string) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  // 削除実行
  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/counterparties/${deletingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('削除に失敗しました');

      setSuccess('取引先を削除しました');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchCounterparties();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const getCategoryLabel = (value: string | null) => {
    const cat = CATEGORIES.find(c => c.value === value);
    return cat ? cat.label : value || '-';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BusinessIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={700}>
            取引先管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          新規登録
        </Button>
      </Box>

      {/* アラート */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* 取引先一覧 */}
      <Paper sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600 }}>会社名</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>代表者</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>住所</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>分類</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                  </TableRow>
                ))
              ) : counterparties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    取引先が登録されていません
                  </TableCell>
                </TableRow>
              ) : (
                counterparties.map((cp) => (
                  <TableRow key={cp.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{cp.name}</Typography>
                      {cp.shortName && (
                        <Typography variant="caption" color="text.secondary">
                          ({cp.shortName})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {cp.representative ? (
                        <>
                          {cp.repTitle && <Typography variant="caption" color="text.secondary">{cp.repTitle} </Typography>}
                          {cp.representative}
                        </>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cp.address || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {cp.category ? (
                        <Chip label={getCategoryLabel(cp.category)} size="small" />
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEdit(cp)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(cp.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 登録/編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? '取引先を編集' : '取引先を新規登録'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="会社名"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="略称"
              value={formData.shortName}
              onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              fullWidth
              placeholder="例: ABC社"
            />
            <TextField
              label="住所"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="代表者肩書"
                value={formData.repTitle}
                onChange={(e) => setFormData({ ...formData, repTitle: e.target.value })}
                sx={{ width: '40%' }}
                placeholder="代表取締役"
              />
              <TextField
                label="代表者名"
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="電話番号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>分類</InputLabel>
              <Select
                value={formData.category}
                label="分類"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <MenuItem value="">未設定</MenuItem>
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="メモ"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name}>
            {editingId ? '更新' : '登録'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>取引先を削除</DialogTitle>
        <DialogContent>
          <Typography>この取引先を削除してもよろしいですか？</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>キャンセル</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
