'use client';

import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Article as TemplateIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  format: string;
  language?: string;
  isFavorite: boolean;
  downloadCount: number;
}

// デフォルトテンプレート（DBにデータがない場合のフォールバック）
const defaultTemplates: Template[] = [
  {
    id: 'default-1',
    name: '業務委託基本契約書',
    category: '業務委託契約',
    description: 'フリーランスや外部業者への業務委託に使用できる標準的な契約書テンプレート',
    format: 'Word',
    language: '日本語',
    isFavorite: false,
    downloadCount: 245,
  },
  {
    id: 'default-2',
    name: '秘密保持契約書（NDA）',
    category: '秘密保持契約',
    description: '取引開始前の情報開示に適したシンプルなNDAテンプレート',
    format: 'PDF',
    language: '日本語',
    isFavorite: false,
    downloadCount: 189,
  },
  {
    id: 'default-3',
    name: '売買基本契約書',
    category: '売買契約',
    description: '継続的な商品売買取引に使用できる基本契約書',
    format: 'Word',
    language: '日本語',
    isFavorite: false,
    downloadCount: 156,
  },
  {
    id: 'default-4',
    name: 'SaaS利用規約',
    category: 'サービス利用規約',
    description: 'SaaS事業者向けの利用規約テンプレート。個人情報保護法対応済み',
    format: 'PDF',
    language: '日本語',
    isFavorite: false,
    downloadCount: 234,
  },
  {
    id: 'default-5',
    name: 'ソフトウェア開発委託契約書',
    category: '業務委託契約',
    description: 'システム開発・アプリ開発の委託に特化した契約書テンプレート',
    format: 'Word',
    language: '日本語',
    isFavorite: false,
    downloadCount: 178,
  },
  {
    id: 'default-6',
    name: '顧問契約書',
    category: 'コンサルティング契約',
    description: '弁護士・税理士・コンサルタントなどの顧問契約に使用',
    format: 'PDF',
    language: '日本語',
    isFavorite: false,
    downloadCount: 123,
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          if (data.templates && data.templates.length > 0) {
            setTemplates(data.templates);
          } else {
            // DBにデータがない場合はデフォルトを使用
            setTemplates(defaultTemplates);
          }
        } else {
          setTemplates(defaultTemplates);
        }
      } catch {
        setTemplates(defaultTemplates);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);
  const [tabValue, setTabValue] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const handleToggleFavorite = (templateId: string) => {
    setTemplates(
      templates.map((t) => (t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const categories = ['すべて', '業務委託契約', '秘密保持契約', '売買契約', 'サービス利用規約', 'コンサルティング契約'];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = tabValue === 0 || template.category === categories[tabValue];
    return matchesSearch && matchesCategory;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            契約書テンプレート
          </Typography>
          <Typography variant="body2" color="text.secondary">
            弁護士監修の契約書テンプレートをダウンロード
          </Typography>
        </Box>
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
      </Box>

      {/* 検索バー */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <TextField
          fullWidth
          placeholder="テンプレート名やキーワードで検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* カテゴリータブ */}
      <Paper sx={{ mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' },
          }}
        >
          {categories.map((category, index) => (
            <Tab key={index} label={category} />
          ))}
        </Tabs>
      </Paper>

      {/* お気に入りテンプレート */}
      {tabValue === 0 && templates.filter((t) => t.isFavorite).length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            お気に入り
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 3 }}>
            {templates
              .filter((t) => t.isFavorite)
              .map((template) => (
                <Box key={template.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid',
                      borderColor: 'grey.200',
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
                            bgcolor: 'black',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <TemplateIcon sx={{ fontSize: 28, color: 'white' }} />
                        </Box>
                        <IconButton size="small" onClick={() => handleToggleFavorite(template.id)}>
                          <StarIcon sx={{ color: 'warning.main' }} />
                        </IconButton>
                      </Box>

                      <Chip label={template.category} size="small" sx={{ mb: 1 }} />
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                        {template.description}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {template.language && <Chip label={template.language} size="small" variant="outlined" />}
                        <Chip label={template.format} size="small" variant="outlined" />
                        <Chip label={`${template.downloadCount}DL`} size="small" variant="outlined" />
                      </Box>
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        sx={{ color: 'grey.700' }}
                      >
                        プレビュー
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        sx={{
                          ml: 'auto',
                          bgcolor: 'black',
                          color: 'white',
                          '&:hover': { bgcolor: 'grey.800' },
                        }}
                      >
                        ダウンロード
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              ))}
          </Box>
        </Box>
      )}

      {/* すべてのテンプレート */}
      <Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {tabValue === 0 ? 'すべてのテンプレート' : categories[tabValue]}
        </Typography>

        {filteredTemplates.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="body2" color="text.secondary">
              該当するテンプレートがありません
            </Typography>
          </Paper>
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
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'black',
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TemplateIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <IconButton size="small" onClick={() => handleToggleFavorite(template.id)}>
                      {template.isFavorite ? (
                        <StarIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                      ) : (
                        <StarBorderIcon sx={{ fontSize: 20 }} />
                      )}
                    </IconButton>
                  </Box>

                  <Chip label={template.category} size="small" sx={{ mb: 1.5, alignSelf: 'flex-start' }} />
                  <Typography variant="body1" fontWeight={700} sx={{ mb: 1, lineHeight: 1.4 }}>
                    {template.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      flexGrow: 1,
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {template.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                    {template.language && <Chip label={template.language} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />}
                    <Chip label={template.format} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    <Chip label={`${template.downloadCount}DL`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, pt: 1, borderTop: '1px solid', borderColor: 'grey.200' }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
                      sx={{ color: 'grey.700', fontSize: '0.8rem', px: 1 }}
                    >
                      プレビュー
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        ml: 'auto',
                        bgcolor: 'black',
                        color: 'white',
                        fontSize: '0.8rem',
                        px: 1.5,
                        '&:hover': { bgcolor: 'grey.800' },
                      }}
                    >
                      DL
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredTemplates.map((template) => (
              <Paper
                key={template.id}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'grey.200',
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
                      bgcolor: 'black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <TemplateIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Chip label={template.category} size="small" />
                      <Typography variant="body1" fontWeight={700} sx={{ flexGrow: 1 }}>
                        {template.name}
                      </Typography>
                      <IconButton size="small" onClick={() => handleToggleFavorite(template.id)}>
                        {template.isFavorite ? (
                          <StarIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                        ) : (
                          <StarBorderIcon sx={{ fontSize: 20 }} />
                        )}
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
                      {template.description}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {template.language && <Chip label={template.language} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />}
                        <Chip label={template.format} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        <Chip label={`${template.downloadCount}DL`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
                          sx={{ color: 'grey.700', fontSize: '0.8rem' }}
                        >
                          プレビュー
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            bgcolor: 'black',
                            color: 'white',
                            fontSize: '0.8rem',
                            '&:hover': { bgcolor: 'grey.800' },
                          }}
                        >
                          ダウンロード
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
