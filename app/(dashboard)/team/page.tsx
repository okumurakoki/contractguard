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
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import {
  PersonAdd as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited';
  joinedAt: string;
  avatar?: string;
}

const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: '山田太郎',
    email: 'yamada@example.com',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-01-01',
  },
  {
    id: '2',
    name: '佐藤花子',
    email: 'sato@example.com',
    role: 'member',
    status: 'active',
    joinedAt: '2024-01-05',
  },
  {
    id: '3',
    name: '鈴木一郎',
    email: 'suzuki@example.com',
    role: 'member',
    status: 'active',
    joinedAt: '2024-01-10',
  },
  {
    id: '4',
    name: '田中次郎',
    email: 'tanaka@example.com',
    role: 'viewer',
    status: 'invited',
    joinedAt: '2024-01-15',
  },
];

export default function TeamPage() {
  const [members, setMembers] = React.useState<TeamMember[]>(mockMembers);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null);
  const [openInviteDialog, setOpenInviteDialog] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'admin' | 'member' | 'viewer'>('member');
  const [success, setSuccess] = React.useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: TeamMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleDelete = () => {
    if (selectedMember) {
      setMembers(members.filter((m) => m.id !== selectedMember.id));
      setSuccess(`${selectedMember.name}をチームから削除しました`);
    }
    handleMenuClose();
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: String(members.length + 1),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'invited',
      joinedAt: new Date().toISOString().split('T')[0],
    };

    setMembers([...members, newMember]);
    setSuccess(`${inviteEmail}に招待メールを送信しました`);
    setOpenInviteDialog(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { label: '管理者', color: 'error' as const },
      member: { label: 'メンバー', color: 'primary' as const },
      viewer: { label: '閲覧者', color: 'default' as const },
    };
    const { label, color } = config[role as keyof typeof config];
    return <Chip label={label} color={color} size="small" />;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: '有効', color: 'success' as const },
      invited: { label: '招待中', color: 'warning' as const },
    };
    const { label, color } = config[status as keyof typeof config];
    return <Chip label={label} color={color} size="small" variant="outlined" />;
  };

  const getRoleDescription = (role: string) => {
    const descriptions = {
      admin: '全ての機能にアクセス可能。メンバー管理、請求設定の変更ができます。',
      member: '契約書のアップロード、レビュー、編集が可能。他のメンバーの契約書も閲覧できます。',
      viewer: '契約書の閲覧のみ可能。アップロードや編集はできません。',
    };
    return descriptions[role as keyof typeof descriptions];
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            チーム管理
          </Typography>
          <Typography variant="body2" color="text.secondary">
            チームメンバーの招待と権限管理 • <Box component="span" sx={{ fontWeight: 600, color: 'black' }}>あと6人追加可能</Box>
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenInviteDialog(true)}
          sx={{
            bgcolor: 'black',
            color: 'white',
            '&:hover': { bgcolor: 'grey.800' },
          }}
        >
          メンバーを招待
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* 権限説明 */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          権限について
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {getRoleBadge('admin')}
              <Typography variant="body2" fontWeight={600}>
                管理者
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {getRoleDescription('admin')}
            </Typography>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {getRoleBadge('member')}
              <Typography variant="body2" fontWeight={600}>
                メンバー
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {getRoleDescription('member')}
            </Typography>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {getRoleBadge('viewer')}
              <Typography variant="body2" fontWeight={600}>
                閲覧者
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {getRoleDescription('viewer')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* メンバー一覧 */}
      <Paper sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="h6" fontWeight={700}>
            チームメンバー ({members.length}人)
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>メンバー</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>メールアドレス</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>権限</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ステータス</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>参加日</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={member.avatar}
                        sx={{
                          bgcolor: 'black',
                          width: 40,
                          height: 40,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                        }}
                      >
                        {member.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {member.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.joinedAt}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {member.status === 'invited' && (
                      <Button
                        size="small"
                        startIcon={<EmailIcon />}
                        sx={{ mr: 1, color: 'grey.700' }}
                      >
                        再送信
                      </Button>
                    )}
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, member)}>
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* メニュー */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          権限を変更
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          削除
        </MenuItem>
      </Menu>

      {/* 招待ダイアログ */}
      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>チームメンバーを招待</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="メールアドレス"
              type="email"
              required
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="example@company.com"
              autoFocus
            />
            <FormControl fullWidth required>
              <InputLabel>権限</InputLabel>
              <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)} label="権限">
                <MenuItem value="admin">管理者</MenuItem>
                <MenuItem value="member">メンバー</MenuItem>
                <MenuItem value="viewer">閲覧者</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info">
              招待メールが送信されます。メンバーはメール内のリンクからアカウント登録できます。
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenInviteDialog(false)} sx={{ color: 'grey.600' }}>
            キャンセル
          </Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={!inviteEmail.trim()}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            招待を送信
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
