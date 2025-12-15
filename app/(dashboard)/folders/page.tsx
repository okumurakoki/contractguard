'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  CardActions,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface Folder {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  _count: {
    contracts: number;
    childFolders: number;
  };
}

export default function FoldersPage() {
  const [folders, setFolders] = React.useState<Folder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [uncategorizedCount, setUncategorizedCount] = React.useState(0);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingFolder, setEditingFolder] = React.useState<Folder | null>(null);
  const [folderName, setFolderName] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedFolder, setSelectedFolder] = React.useState<Folder | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [saving, setSaving] = React.useState(false);

  // フォルダ一覧を取得
  const fetchFolders = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/folders');
      if (!response.ok) {
        throw new Error('フォルダの取得に失敗しました');
      }
      const data = await response.json();
      setFolders(data.folders);

      // 未分類の契約書数を取得
      const contractsResponse = await fetch('/api/contracts?folderId=null');
      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json();
        setUncategorizedCount(contractsData.contracts.filter((c: { folderId: string | null }) => !c.folderId).length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleOpenDialog = (folder?: Folder) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderName(folder.name);
    } else {
      setEditingFolder(null);
      setFolderName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFolder(null);
    setFolderName('');
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) return;

    setSaving(true);
    try {
      if (editingFolder) {
        // 編集 - APIエンドポイントを作成する必要があるが、とりあえずPOSTで対応
        const response = await fetch(`/api/folders/${editingFolder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folderName }),
        });
        if (!response.ok) throw new Error('更新に失敗しました');
      } else {
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folderName }),
        });
        if (!response.ok) throw new Error('作成に失敗しました');
      }
      await fetchFolders();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, folder: Folder) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedFolder(folder);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFolder(null);
  };

  const handleEdit = () => {
    if (selectedFolder) {
      handleOpenDialog(selectedFolder);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedFolder) {
      try {
        const response = await fetch(`/api/folders/${selectedFolder.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('削除に失敗しました');
        await fetchFolders();
      } catch (err) {
        setError(err instanceof Error ? err.message : '削除に失敗しました');
      }
    }
    handleMenuClose();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            フォルダ管理
          </Typography>
          <Typography variant="body2" color="text.secondary">
            契約書を整理して管理
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setViewMode('grid')}
              sx={{
                bgcolor: viewMode === 'grid' ? 'black' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'grey.700',
                '&:hover': {
                  bgcolor: viewMode === 'grid' ? 'grey.800' : 'grey.100',
                },
              }}
            >
              <GridViewIcon />
            </IconButton>
            <IconButton
              onClick={() => setViewMode('list')}
              sx={{
                bgcolor: viewMode === 'list' ? 'black' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'grey.700',
                '&:hover': {
                  bgcolor: viewMode === 'list' ? 'grey.800' : 'grey.100',
                },
              }}
            >
              <ListViewIcon />
            </IconButton>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            新規フォルダ
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {[1, 2, 3].map((i) => (
            <Card key={i} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 1.5, mb: 2 }} />
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="40%" height={20} />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : viewMode === 'grid' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
        {folders.map((folder) => (
            <Card
              key={folder.id}
              component={Link}
              href={`/folders/${folder.id}`}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'grey.200',
                textDecoration: 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'black',
                  boxShadow: 2,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      bgcolor: folder.color || '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FolderIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, folder)}
                    sx={{ color: 'grey.600' }}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>

                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {folder.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <FileIcon sx={{ fontSize: 18, color: 'grey.500' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {folder._count.contracts}件の契約書
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  作成日: {new Date(folder.createdAt).toLocaleDateString('ja-JP')}
                </Typography>
              </CardActions>
            </Card>
        ))}

        {/* 未分類フォルダ */}
          <Card
            component={Link}
            href="/folders/uncategorized"
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: '1px dashed',
              borderColor: 'grey.300',
              textDecoration: 'none',
              bgcolor: 'grey.50',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'black',
                bgcolor: 'grey.100',
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    bgcolor: 'grey.400',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FolderIcon sx={{ fontSize: 28, color: 'white' }} />
                </Box>
              </Box>

              <Typography variant="h6" fontWeight={700} gutterBottom>
                未分類
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                フォルダに分類されていない契約書
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon sx={{ fontSize: 18, color: 'grey.500' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {uncategorizedCount}件の契約書
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {folders.map((folder) => (
            <Paper
              key={folder.id}
              component={Link}
              href={`/folders/${folder.id}`}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'grey.200',
                textDecoration: 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'black',
                  boxShadow: 1,
                },
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    bgcolor: folder.color || '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FolderIcon sx={{ fontSize: 28, color: 'white' }} />
                </Box>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={700} sx={{ flexGrow: 1 }}>
                      {folder.name}
                    </Typography>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, folder)}>
                      <MoreIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {folder._count.contracts}件の契約書
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      作成日: {new Date(folder.createdAt).toLocaleDateString('ja-JP')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
          <Paper
            component={Link}
            href="/folders/uncategorized"
            sx={{
              p: 2,
              border: '1px dashed',
              borderColor: 'grey.300',
              bgcolor: 'grey.50',
              textDecoration: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'black',
                bgcolor: 'grey.100',
              },
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  bgcolor: 'grey.400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FolderIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
                  未分類
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  フォルダに分類されていない契約書
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {uncategorizedCount}件の契約書
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* メニュー */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          編集
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          削除
        </MenuItem>
      </Menu>

      {/* フォルダ作成/編集ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingFolder ? 'フォルダを編集' : '新規フォルダを作成'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="フォルダ名"
              required
              fullWidth
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="例：2024年度契約"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'grey.600' }} disabled={saving}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveFolder}
            variant="contained"
            disabled={!folderName.trim() || saving}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            {saving ? '保存中...' : editingFolder ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
