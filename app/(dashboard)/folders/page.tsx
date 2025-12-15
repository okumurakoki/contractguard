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
  Grid,
  Card,
  CardContent,
  CardActions,
  Menu,
  MenuItem,
  Chip,
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
  description: string;
  contractCount: number;
  createdAt: string;
  color: string;
}

const mockFolders: Folder[] = [
  {
    id: '1',
    name: '2024年度契約',
    description: '2024年に締結した契約書を管理',
    contractCount: 12,
    createdAt: '2024-01-01',
    color: '#000000',
  },
  {
    id: '2',
    name: '継続契約',
    description: '定期的に更新が必要な契約書',
    contractCount: 8,
    createdAt: '2024-01-10',
    color: '#424242',
  },
  {
    id: '3',
    name: '新規案件',
    description: '新規取引先との契約書',
    contractCount: 5,
    createdAt: '2024-01-15',
    color: '#616161',
  },
  {
    id: '4',
    name: '重要契約',
    description: '金額が大きい・重要度が高い契約',
    contractCount: 3,
    createdAt: '2024-01-20',
    color: '#757575',
  },
];

export default function FoldersPage() {
  const [folders, setFolders] = React.useState<Folder[]>(mockFolders);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingFolder, setEditingFolder] = React.useState<Folder | null>(null);
  const [folderName, setFolderName] = React.useState('');
  const [folderDescription, setFolderDescription] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedFolder, setSelectedFolder] = React.useState<Folder | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const handleOpenDialog = (folder?: Folder) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderName(folder.name);
      setFolderDescription(folder.description);
    } else {
      setEditingFolder(null);
      setFolderName('');
      setFolderDescription('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFolder(null);
    setFolderName('');
    setFolderDescription('');
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) return;

    if (editingFolder) {
      setFolders(
        folders.map((f) =>
          f.id === editingFolder.id
            ? { ...f, name: folderName, description: folderDescription }
            : f
        )
      );
    } else {
      const newFolder: Folder = {
        id: String(folders.length + 1),
        name: folderName,
        description: folderDescription,
        contractCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        color: '#000000',
      };
      setFolders([...folders, newFolder]);
    }
    handleCloseDialog();
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

  const handleDelete = () => {
    if (selectedFolder) {
      setFolders(folders.filter((f) => f.id !== selectedFolder.id));
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

      {viewMode === 'grid' ? (
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
                      bgcolor: folder.color,
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {folder.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileIcon sx={{ fontSize: 18, color: 'grey.500' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {folder.contractCount}件の契約書
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  作成日: {folder.createdAt}
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                フォルダに分類されていない契約書
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon sx={{ fontSize: 18, color: 'grey.500' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  4件の契約書
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
                    bgcolor: folder.color,
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

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {folder.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {folder.contractCount}件の契約書
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      作成日: {folder.createdAt}
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
                    4件の契約書
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
            <TextField
              label="説明（任意）"
              fullWidth
              multiline
              rows={3}
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              placeholder="フォルダの用途や内容を説明"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'grey.600' }}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveFolder}
            variant="contained"
            disabled={!folderName.trim()}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            {editingFolder ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
