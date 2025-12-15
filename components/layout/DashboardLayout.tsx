'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  ListItemAvatar,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  CloudUpload as UploadIcon,
  Folder as FolderIcon,
  Article as TemplateIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  section?: string;
}

const navItems: NavItem[] = [
  { title: 'ダッシュボード', path: '/dashboard', icon: <DashboardIcon />, section: 'main' },
  { title: '契約書一覧', path: '/contracts', icon: <DescriptionIcon />, section: 'main' },
  { title: 'アップロード', path: '/upload', icon: <UploadIcon />, section: 'main' },
  { title: 'フォルダ', path: '/folders', icon: <FolderIcon />, section: 'main' },
  { title: 'テンプレート', path: '/templates', icon: <TemplateIcon />, section: 'main' },
  { title: '契約書作成支援', path: '/lawyer', icon: <GavelIcon />, section: 'main' },
  { title: 'チーム', path: '/team', icon: <PeopleIcon />, section: 'settings' },
  { title: '監査ログ', path: '/settings/audit-logs', icon: <SecurityIcon />, section: 'settings' },
  { title: '設定', path: '/settings', icon: <SettingsIcon />, section: 'settings' },
];

interface SearchResult {
  id: string;
  title: string;
  type: 'contract' | 'template' | 'folder';
  subtitle?: string;
  path: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);

  const currentDrawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    signOut();
    handleClose();
  };

  const handleSearch = React.useCallback(async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // 契約書を検索
      const response = await fetch(`/api/contracts?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const results: SearchResult[] = data.contracts.map((contract: {
          id: string;
          contractTitle: string | null;
          fileName: string;
          contractType: string | null;
        }) => ({
          id: contract.id,
          title: contract.contractTitle || contract.fileName,
          type: 'contract' as const,
          subtitle: contract.contractType || '未分類',
          path: `/contracts/${contract.id}`,
        }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, []);

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <DescriptionIcon />;
      case 'template':
        return <TemplateIcon />;
      case 'folder':
        return <FolderIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'contract':
        return '契約書';
      case 'template':
        return 'テンプレート';
      case 'folder':
        return 'フォルダ';
      default:
        return '';
    }
  };

  const mainNavItems = navItems.filter((item) => item.section === 'main');
  const settingsNavItems = navItems.filter((item) => item.section === 'settings');

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.path || (item.path !== '/settings' && pathname.startsWith(item.path + '/'));

    const button = (
      <ListItemButton
        component={Link}
        href={item.path}
        sx={{
          borderRadius: 1,
          py: 1.25,
          px: collapsed ? 1.5 : 2,
          mx: collapsed ? 0.5 : 1,
          minHeight: 48,
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'all 0.2s ease',
          bgcolor: isActive ? '#18181b' : 'transparent',
          '&:hover': {
            bgcolor: isActive ? '#18181b' : '#27272a',
          },
        }}
      >
        <ListItemIcon
          sx={{
            color: isActive ? '#ffffff' : '#a1a1aa',
            minWidth: collapsed ? 0 : 40,
            mr: collapsed ? 0 : 1.5,
            justifyContent: 'center',
            '& .MuiSvgIcon-root': {
              fontSize: 22,
            },
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.title}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : '#d4d4d8',
              letterSpacing: '0.01em',
            }}
          />
        )}
      </ListItemButton>
    );

    return (
      <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
        {collapsed ? (
          <Tooltip title={item.title} placement="right" arrow>
            {button}
          </Tooltip>
        ) : (
          button
        )}
      </ListItem>
    );
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        bgcolor: '#09090b',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #27272a',
      }}
    >
      {/* ヘッダー */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2.5,
          py: 2,
          minHeight: 64,
          borderBottom: '1px solid #27272a',
        }}
      >
        {!collapsed && (
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              fontSize: '1.125rem',
            }}
          >
            ContractGuard
          </Typography>
        )}
        <IconButton
          onClick={handleCollapseToggle}
          size="small"
          sx={{
            color: '#71717a',
            '&:hover': {
              bgcolor: '#27272a',
              color: '#ffffff',
            },
          }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* メインナビゲーション */}
      <Box sx={{ flex: 1, py: 2, overflowY: 'auto' }}>
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 3,
              py: 1,
              display: 'block',
              color: '#71717a',
              fontWeight: 600,
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            メニュー
          </Typography>
        )}
        <List disablePadding>
          {mainNavItems.map(renderNavItem)}
        </List>

        <Divider sx={{ my: 2, borderColor: '#27272a' }} />

        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 3,
              py: 1,
              display: 'block',
              color: '#71717a',
              fontWeight: 600,
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            管理
          </Typography>
        )}
        <List disablePadding>
          {settingsNavItems.map(renderNavItem)}
        </List>
      </Box>

      {/* フッター */}
      {!collapsed && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #27272a',
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: '#18181b',
              borderRadius: 1,
              border: '1px solid #27272a',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#71717a',
                display: 'block',
                mb: 0.5,
              }}
            >
              現在のプラン
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              Free プラン
            </Typography>
            <Typography
              variant="caption"
              component={Link}
              href="/settings/billing"
              sx={{
                color: '#3b82f6',
                display: 'block',
                mt: 0.5,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              プランをアップグレード →
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          bgcolor: '#ffffff',
          color: '#09090b',
          borderBottom: '1px solid #e4e4e7',
          transition: 'width 0.2s ease, margin 0.2s ease',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              color: '#09090b',
              mr: 3,
              fontSize: '1rem',
              letterSpacing: '-0.01em',
            }}
          >
            {navItems.find((item) => item.path === pathname)?.title || 'ContractGuard'}
          </Typography>

          {/* 検索バー */}
          <Box
            sx={{
              flexGrow: 1,
              maxWidth: 480,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <TextField
              placeholder="契約書、テンプレート、フォルダを検索..."
              size="small"
              fullWidth
              onClick={() => setSearchOpen(true)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#a1a1aa', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: '#f4f4f5',
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#e4e4e7' },
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
            />
          </Box>

          {/* モバイル検索ボタン */}
          <IconButton
            sx={{ display: { xs: 'block', md: 'none' }, mr: 1 }}
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* 通知アイコン */}
          <IconButton
            sx={{
              color: '#71717a',
              '&:hover': { bgcolor: '#f4f4f5' },
            }}
          >
            <NotificationsIcon sx={{ fontSize: 22 }} />
          </IconButton>

          {/* ユーザーメニュー */}
          <IconButton
            onClick={handleMenu}
            sx={{
              ml: 1,
              '&:hover': { bgcolor: '#f4f4f5' },
            }}
          >
            <Avatar
              src={user?.imageUrl}
              sx={{
                width: 34,
                height: 34,
                bgcolor: '#18181b',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e4e4e7',
              },
            }}
          >
            <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
              <Box>
                <Typography variant="body2" fontWeight={600} color="#09090b">
                  {user?.fullName || 'ユーザー'}
                </Typography>
                <Typography variant="caption" color="#71717a">
                  {user?.primaryEmailAddress?.emailAddress || 'user@example.com'}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem component={Link} href="/settings/profile" onClick={handleClose} sx={{ py: 1.25 }}>
              <Typography variant="body2">プロフィール</Typography>
            </MenuItem>
            <MenuItem component={Link} href="/settings/billing" onClick={handleClose} sx={{ py: 1.25 }}>
              <Typography variant="body2">支払い設定</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut} sx={{ py: 1.25 }}>
              <Typography variant="body2" color="#dc2626">ログアウト</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* サイドバー */}
      <Box
        component="nav"
        sx={{
          width: { sm: currentDrawerWidth },
          flexShrink: { sm: 0 },
          transition: 'width 0.2s ease',
        }}
        aria-label="navigation"
      >
        {/* モバイル用ドロワー */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* デスクトップ用ドロワー */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              transition: 'width 0.2s ease',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          mt: 8,
          minHeight: '100vh',
          bgcolor: '#fafafa',
          transition: 'width 0.2s ease',
        }}
      >
        {children}
      </Box>

      {/* 検索ダイアログ */}
      <Dialog
        open={searchOpen}
        onClose={handleSearchClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh',
            border: '1px solid #e4e4e7',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SearchIcon sx={{ color: '#71717a' }} />
            <TextField
              autoFocus
              placeholder="検索キーワードを入力..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              variant="standard"
              fullWidth
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: '1rem' },
              }}
            />
            <IconButton onClick={handleSearchClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {searchQuery && searchResults.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="#71717a">
                「{searchQuery}」に一致する結果が見つかりませんでした
              </Typography>
            </Box>
          ) : searchResults.length > 0 ? (
            <List disablePadding>
              {searchResults.map((result) => (
                <ListItem
                  key={result.id}
                  component={Link}
                  href={result.path}
                  onClick={handleSearchClose}
                  sx={{
                    borderBottom: '1px solid #f4f4f5',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f4f4f5' },
                    textDecoration: 'none',
                    color: 'inherit',
                    py: 1.5,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#f4f4f5', color: '#71717a' }}>
                      {getTypeIcon(result.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="#09090b">
                          {result.title}
                        </Typography>
                        <Chip
                          label={getTypeLabel(result.type)}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: '#f4f4f5',
                            color: '#71717a',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="#a1a1aa">
                        {result.subtitle}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 48, color: '#e4e4e7', mb: 2 }} />
              <Typography variant="body2" color="#71717a">
                契約書名、テンプレート名、フォルダ名で検索できます
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
