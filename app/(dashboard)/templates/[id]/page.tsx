'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  FileDownload as DownloadIcon,
  Description as DocumentIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface TemplateVariable {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string;
  industry: string | null;
  content: string;
  variables: TemplateVariable[];
  usageCount: number;
  isPremium: boolean;
  updatedAt: string;
}

// コンテンツから条項を抽出
function extractSections(content: string): Array<{ number: number; title: string; content: string }> {
  const sections: Array<{ number: number; title: string; content: string }> = [];
  const regex = /第(\d+)条[　\s]*[\(（]([^）\)]+)[）\)]\s*([^第]*)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    sections.push({
      number: parseInt(match[1], 10),
      title: match[2].trim(),
      content: match[3].replace(/<[^>]*>/g, '').trim().substring(0, 200) + '...',
    });
  }

  return sections.length > 0 ? sections : [
    { number: 1, title: '契約内容', content: 'テンプレートの内容がここに表示されます' },
  ];
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = React.useState<Template | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [useDialogOpen, setUseDialogOpen] = React.useState(false);
  const [counterparty, setCounterparty] = React.useState('');
  const [variableValues, setVariableValues] = React.useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [generating, setGenerating] = React.useState(false);

  // テンプレート詳細を取得
  React.useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/templates/${templateId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'テンプレートの取得に失敗しました');
          return;
        }

        setTemplate(data.template);
      } catch {
        setError('テンプレートの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (templateId && !templateId.startsWith('default-')) {
      fetchTemplate();
    } else {
      // デフォルトテンプレートの場合はモックデータを使用
      setTemplate({
        id: templateId,
        title: '業務委託契約書テンプレート',
        description: 'IT業界向けの標準的な業務委託契約書テンプレート。フリーランスや業務委託先との契約に最適です。',
        category: '業務委託契約',
        industry: 'IT',
        content: '<h2>業務委託契約書</h2><p>第1条（業務内容）甲は、乙に対し、以下の業務を委託し、乙はこれを受託する。</p>',
        variables: [
          { name: 'amount', label: '契約金額', placeholder: '例：500,000円' },
        ],
        usageCount: 1234,
        isPremium: false,
        updatedAt: new Date().toISOString(),
      });
      setLoading(false);
    }
  }, [templateId]);

  const handleUseTemplate = async () => {
    if (!counterparty.trim()) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/templates/${templateId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counterparty,
          variables: variableValues,
          notes: customNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '契約書の生成に失敗しました');
        return;
      }

      setSuccess('テンプレートから契約書を作成しました');
      setUseDialogOpen(false);

      // 作成した契約書の詳細ページにリダイレクト
      setTimeout(() => {
        router.push(`/contracts/${data.contract.id}`);
      }, 1500);
    } catch {
      setError('契約書の生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const sections = template ? extractSections(template.content) : [];
  const features = [
    '損害賠償の上限額を明記',
    '知的財産権の帰属を明確化',
    '秘密保持条項を含む',
    '業務範囲を詳細に規定',
    '支払条件と請求方法を明記',
  ];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={40} width={40} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={60} width="60%" />
        <Skeleton variant="text" height={30} width="40%" />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 4 }} />
      </Box>
    );
  }

  if (!template) {
    return (
      <Box>
        <IconButton component={Link} href="/templates" sx={{ mb: 2 }}>
          <BackIcon />
        </IconButton>
        <Alert severity="error">{error || 'テンプレートが見つかりません'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <IconButton component={Link} href="/templates" sx={{ mb: 2 }}>
          <BackIcon />
        </IconButton>

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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <DocumentIcon sx={{ fontSize: 40, color: 'black' }} />
              <Typography variant="h4" fontWeight={700}>
                {template.title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
              <Chip label={template.category} sx={{ bgcolor: 'black', color: 'white', fontWeight: 600 }} />
              <Typography variant="body2" color="text.secondary">
                {template.usageCount.toLocaleString()}回使用
              </Typography>
              <Typography variant="body2" color="text.secondary">
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                最終更新: {new Date(template.updatedAt).toLocaleDateString('ja-JP')}
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
              {template.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ borderColor: 'grey.300', color: 'black', '&:hover': { borderColor: 'black' } }}
            >
              ダウンロード
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setUseDialogOpen(true)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                px: 3,
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              このテンプレートを使う
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* 左側: 契約書構成 */}
        <Box>
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              契約書の構成
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sections.map((section) => (
                <Paper
                  key={section.number}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    bgcolor: 'grey.50',
                    '&:hover': {
                      borderColor: 'black',
                      bgcolor: 'white',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Chip
                      label={`第${section.number}条`}
                      size="small"
                      sx={{
                        bgcolor: 'black',
                        color: 'white',
                        fontWeight: 700,
                        minWidth: 60,
                      }}
                    />
                    <Typography variant="body1" fontWeight={700}>
                      {section.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, ml: 0.5 }}>
                    {section.content}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* 右側: テンプレート情報 */}
        <Box>
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              テンプレートの特徴
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List disablePadding>
              {features.map((feature, index) => (
                <ListItem key={index} sx={{ px: 0, py: 1 }}>
                  <CheckIcon sx={{ color: 'success.main', mr: 1.5, fontSize: 20 }} />
                  <ListItemText
                    primary={feature}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoIcon sx={{ fontSize: 20, color: 'info.main' }} />
                <Typography variant="body2" fontWeight={700}>
                  使い方
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                このテンプレートを使用すると、契約相手や金額などの情報を入力するだけで、すぐに契約書を作成できます。
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<EditIcon />}
              onClick={() => setUseDialogOpen(true)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                py: 1.5,
                mb: 2,
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              このテンプレートを使う
            </Button>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<DownloadIcon />}
              sx={{
                borderColor: 'grey.300',
                color: 'black',
                py: 1.5,
              }}
            >
              PDFダウンロード
            </Button>
          </Paper>
        </Box>
      </Box>

      {/* テンプレート使用ダイアログ */}
      <Dialog open={useDialogOpen} onClose={() => !generating && setUseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>テンプレートから契約書を作成</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            テンプレート: <strong>{template.title}</strong>
          </Typography>

          <Box sx={{ display: 'grid', gap: 3 }}>
            <TextField
              label="契約相手（社名・氏名）"
              required
              fullWidth
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              placeholder="例：株式会社ABC"
              autoFocus
              disabled={generating}
            />

            {template.variables.map((variable) => (
              <TextField
                key={variable.name}
                label={variable.label}
                required={variable.required}
                fullWidth
                value={variableValues[variable.name] || ''}
                onChange={(e) => setVariableValues({
                  ...variableValues,
                  [variable.name]: e.target.value,
                })}
                placeholder={variable.placeholder}
                disabled={generating}
              />
            ))}

            <TextField
              label="備考・特記事項"
              fullWidth
              multiline
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="追加で記載したい内容があれば入力してください"
              disabled={generating}
            />

            <Alert severity="info">
              テンプレートを元に契約書が作成されます。作成後、詳細を編集することができます。
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUseDialogOpen(false)} sx={{ color: 'grey.600' }} disabled={generating}>
            キャンセル
          </Button>
          <Button
            onClick={handleUseTemplate}
            variant="contained"
            disabled={!counterparty.trim() || generating}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            {generating ? <CircularProgress size={24} color="inherit" /> : '契約書を作成'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
