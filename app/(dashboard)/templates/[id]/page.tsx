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

interface TemplateSection {
  number: number;
  title: string;
  content: string;
}

const mockTemplate = {
  id: '1',
  name: '業務委託契約書テンプレート',
  category: '業務委託契約',
  description: 'IT業界向けの標準的な業務委託契約書テンプレート。フリーランスや業務委託先との契約に最適です。',
  features: [
    '損害賠償の上限額を明記',
    '知的財産権の帰属を明確化',
    '秘密保持条項を含む',
    '業務範囲を詳細に規定',
    '支払条件と請求方法を明記',
  ],
  sections: [
    { number: 1, title: '業務内容', content: '甲は、乙に対し、以下の業務を委託し、乙はこれを受託する。' },
    { number: 2, title: '契約期間', content: '本契約の有効期間は、契約締結日から1年間とする。' },
    { number: 3, title: '報酬および支払条件', content: '甲は乙に対し、業務の対価として、月額金○○円を支払う。' },
    { number: 4, title: '秘密保持', content: '甲および乙は、本契約の履行により知り得た相手方の秘密情報を第三者に開示してはならない。' },
    { number: 5, title: '知的財産権', content: '本契約に基づき作成された成果物の知的財産権は、甲に帰属する。' },
    { number: 6, title: '損害賠償', content: '甲または乙が本契約に違反し、相手方に損害を与えた場合、その損害を賠償する。' },
    { number: 7, title: '契約解除', content: '甲または乙は、相手方が本契約に違反した場合、本契約を解除することができる。' },
    { number: 8, title: '協議事項', content: '本契約に定めのない事項については、甲乙協議の上、決定する。' },
  ],
  lastUpdated: '2024-01-10',
  downloads: 1234,
};

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const [useDialogOpen, setUseDialogOpen] = React.useState(false);
  const [counterparty, setCounterparty] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [customNotes, setCustomNotes] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleUseTemplate = () => {
    if (!counterparty.trim()) {
      return;
    }

    // TODO: テンプレートを使用して契約書を生成
    setSuccess('テンプレートから契約書を作成しました');
    setUseDialogOpen(false);

    // 契約書一覧にリダイレクト
    setTimeout(() => {
      router.push('/contracts');
    }, 1500);
  };

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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <DocumentIcon sx={{ fontSize: 40, color: 'black' }} />
              <Typography variant="h4" fontWeight={700}>
                {mockTemplate.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
              <Chip label={mockTemplate.category} sx={{ bgcolor: 'black', color: 'white', fontWeight: 600 }} />
              <Typography variant="body2" color="text.secondary">
                {mockTemplate.downloads.toLocaleString()}回使用
              </Typography>
              <Typography variant="body2" color="text.secondary">
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                最終更新: {mockTemplate.lastUpdated}
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
              {mockTemplate.description}
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
              {mockTemplate.sections.map((section) => (
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
              {mockTemplate.features.map((feature, index) => (
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
      <Dialog open={useDialogOpen} onClose={() => setUseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>テンプレートから契約書を作成</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            テンプレート: <strong>{mockTemplate.name}</strong>
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
            />

            <TextField
              label="契約金額"
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例：500,000円"
              helperText="金額が決まっている場合は入力してください"
            />

            <TextField
              label="備考・特記事項"
              fullWidth
              multiline
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="追加で記載したい内容があれば入力してください"
            />

            <Alert severity="info">
              テンプレートを元に契約書が作成されます。作成後、詳細を編集することができます。
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUseDialogOpen(false)} sx={{ color: 'grey.600' }}>
            キャンセル
          </Button>
          <Button
            onClick={handleUseTemplate}
            variant="contained"
            disabled={!counterparty.trim()}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            契約書を作成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
