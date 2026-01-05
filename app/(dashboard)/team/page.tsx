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
  Skeleton,
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
  name: string | null;
  email: string;
  role: string;
  status: 'active' | 'invited';
  joinedAt: string;
  avatar?: string;
}

interface TeamData {
  members: TeamMember[];
  invitations: {
    id: string;
    email: string;
    role: string;
    status: 'invited';
    createdAt: string;
  }[];
  maxMembers: number;
  currentCount: number;
}

export default function TeamPage() {
  const [data, setData] = React.useState<TeamData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null);
  const [openInviteDialog, setOpenInviteDialog] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'admin' | 'member' | 'viewer'>('member');
  const [success, setSuccess] = React.useState('');
  const [inviting, setInviting] = React.useState(false);

  const fetchTeam = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/team');
      if (!response.ok) {
        throw new Error('チーム情報の取得に失敗しました');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const allMembers: TeamMember[] = React.useMemo(() => {
    if (!data) return [];
    const members = data.members.map((m) => ({
      ...m,
      status: 'active' as const,
    }));
    const invitations = data.invitations.map((inv) => ({
      id: inv.id,
      name: inv.email.split('@')[0],
      email: inv.email,
      role: inv.role,
      status: 'invited' as const,
      joinedAt: inv.createdAt,
    }));
    return [...members, ...invitations];
  }, [data]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: TeamMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    try {
      const endpoint = selectedMember.status === 'invited'
        ? `/api/team/invitations/${selectedMember.id}`
        : `/api/team/members/${selectedMember.id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }
      setSuccess(`${selectedMember.name || selectedMember.email}をチームから削除しました`);
      fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
    handleMenuClose();
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '招待に失敗しました');
      }

      setSuccess(`${inviteEmail}に招待メールを送信しました`);
      setOpenInviteDialog(false);
      setInviteEmail('');
      setInviteRole('member');
      fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : '招待に失敗しました');
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { label: '管理者', color: 'error' as const },
      member: { label: 'メンバー', color: 'primary' as const },
      viewer: { label: '閲覧者', color: 'default' as const },
    };
    const { label, color } = config[role as keyof typeof config] || { label: role, color: 'default' as const };
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
    return descriptions[role as keyof typeof descriptions] || '';
  };

  const remainingSlots = data ? data.maxMembers - data.currentCount : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            チーム管理
          </Typography>
          <Typography variant="body2" color="text.secondary">
            チームメンバーの招待と権限管理 •{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'black' }}>
              あと{remainingSlots}人追加可能
            </Box>
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenInviteDialog(true)}
          disabled={remainingSlots <= 0}
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 権限説明 */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          権限について
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
          {['admin', 'member', 'viewer'].map((role) => (
            <Box key={role}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {getRoleBadge(role)}
                <Typography variant="body2" fontWeight={600}>
                  {role === 'admin' ? '管理者' : role === 'member' ? 'メンバー' : '閲覧者'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {getRoleDescription(role)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* メンバー一覧 */}
      <Paper sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="h6" fontWeight={700}>
            チームメンバー ({allMembers.length}人)
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
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="text" width={100} />
                      </Box>
                    </TableCell>
                    <TableCell><Skeleton variant="text" width={150} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="text" width={60} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="text" width={40} /></TableCell>
                  </TableRow>
                ))
              ) : allMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      チームメンバーはまだいません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                allMembers.map((member) => (
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
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {member.name || member.email.split('@')[0]}
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
                        {new Date(member.joinedAt).toLocaleDateString('ja-JP')}
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
                ))
              )}
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
              <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')} label="権限">
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
          <Button onClick={() => setOpenInviteDialog(false)} sx={{ color: 'grey.600' }} disabled={inviting}>
            キャンセル
          </Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={!inviteEmail.trim() || inviting}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            {inviting ? '送信中...' : '招待を送信'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
