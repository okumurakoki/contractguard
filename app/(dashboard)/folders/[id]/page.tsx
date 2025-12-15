'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
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
  name: string;
  type: string;
  uploadDate: string;
  status: 'pending' | 'completed' | 'error';
  riskLevel: 'high' | 'medium' | 'low';
  riskCount: number;
}

const mockContracts: Contract[] = [
  {
    id: '1',
    name: '業務委託契約書_ABC社',
    type: '業務委託契約',
    uploadDate: '2024-01-15',
    status: 'completed',
    riskLevel: 'high',
    riskCount: 5,
  },
  {
    id: '2',
    name: '秘密保持契約_XYZ社',
    type: '秘密保持契約',
    uploadDate: '2024-01-14',
    status: 'completed',
    riskLevel: 'low',
    riskCount: 1,
  },
  {
    id: '3',
    name: '売買契約書_DEF社',
    type: '売買契約',
    uploadDate: '2024-01-13',
    status: 'completed',
    riskLevel: 'medium',
    riskCount: 3,
  },
];

export default function FolderDetailPage() {
  const params = useParams();
  const folderId = params.id as string;
  const [contracts, setContracts] = React.useState<Contract[]>(mockContracts);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedContract, setSelectedContract] = React.useState<string | null>(null);

  const folderName = folderId === 'uncategorized' ? '未分類' : '2024年度契約';

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, contractId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedContract(contractId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContract(null);
  };

  const handleDelete = () => {
    if (selectedContract) {
      setContracts(contracts.filter((c) => c.id !== selectedContract));
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
      pending: { label: '分析中', color: 'warning' as const },
      error: { label: 'エラー', color: 'error' as const },
    };
    const { label, color } = config[status as keyof typeof config];
    return <Chip label={label} color={color} size="small" variant="outlined" />;
  };

  const filteredContracts = contracts.filter((contract) =>
    contract.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
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
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ borderColor: 'grey.300', color: 'black' }}
          >
            フォルダ編集
          </Button>
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
                        {contract.name}
                      </Typography>
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
                    <TableCell>{getStatusChip(contract.status)}</TableCell>
                    <TableCell>
                      {contract.status === 'completed' ? getRiskChip(contract.riskLevel, contract.riskCount) : '-'}
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
    </Box>
  );
}
