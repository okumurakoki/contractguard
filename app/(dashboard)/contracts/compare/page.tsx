'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface ContractData {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  sections: Section[];
}

interface Section {
  number: number;
  title: string;
  content: string;
}

interface Difference {
  section: number;
  title: string;
  type: 'added' | 'removed' | 'modified' | 'same';
  contract1Content?: string;
  contract2Content?: string;
}

const mockContracts: Record<string, ContractData> = {
  '1': {
    id: '1',
    name: '業務委託契約書_ABC社',
    type: '業務委託契約',
    uploadDate: '2024-01-15',
    sections: [
      { number: 1, title: '業務内容', content: '甲は、乙に対し、Webアプリケーション開発業務を委託し、乙はこれを受託する。' },
      { number: 2, title: '契約期間', content: '本契約の有効期間は、2024年1月1日から2025年12月31日までとする。' },
      { number: 3, title: '報酬', content: '甲は乙に対し、業務の対価として、月額50万円を支払う。' },
      { number: 4, title: '秘密保持', content: '甲および乙は、本契約の履行により知り得た相手方の秘密情報を第三者に開示してはならない。' },
      { number: 5, title: '損害賠償', content: '甲または乙が本契約に違反し、相手方に損害を与えた場合、その損害を賠償する。上限額は契約金額の100%とする。' },
    ],
  },
  '2': {
    id: '2',
    name: '秘密保持契約_XYZ社',
    type: '秘密保持契約',
    uploadDate: '2024-01-14',
    sections: [
      { number: 1, title: '目的', content: '本契約は、両当事者間の秘密情報の保護を目的とする。' },
      { number: 2, title: '秘密情報の定義', content: '秘密情報とは、書面、口頭、電磁的記録その他の媒体により開示される一切の情報をいう。' },
      { number: 3, title: '秘密保持義務', content: '受領者は、秘密情報を厳に秘密として保持し、開示者の事前の書面による承諾なく第三者に開示してはならない。' },
      { number: 4, title: '契約期間', content: '本契約の有効期間は、締結日から3年間とする。' },
      { number: 5, title: '損害賠償', content: '秘密保持義務に違反した場合、違反者は相手方に生じた一切の損害を賠償する責任を負う。' },
    ],
  },
  '3': {
    id: '3',
    name: '売買契約書_DEF社',
    type: '売買契約',
    uploadDate: '2024-01-13',
    sections: [
      { number: 1, title: '売買の目的物', content: 'ソフトウェアライセンスの販売' },
      { number: 2, title: '売買代金', content: '300万円' },
      { number: 3, title: '支払条件', content: '契約締結後30日以内に全額を支払う。' },
      { number: 4, title: '納品', content: '代金受領後7営業日以内に納品する。' },
      { number: 5, title: '損害賠償', content: '甲または乙が本契約に違反し、相手方に損害を与えた場合、その損害を賠償する。' },
    ],
  },
};

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];

  if (ids.length !== 2) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700}>
          比較する契約書を2つ選択してください
        </Typography>
      </Box>
    );
  }

  const contract1 = mockContracts[ids[0]];
  const contract2 = mockContracts[ids[1]];

  if (!contract1 || !contract2) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700}>
          契約書が見つかりません
        </Typography>
      </Box>
    );
  }

  // 差分を計算
  const differences: Difference[] = [];
  const allSectionNumbers = new Set([
    ...contract1.sections.map((s) => s.number),
    ...contract2.sections.map((s) => s.number),
  ]);

  Array.from(allSectionNumbers)
    .sort((a, b) => a - b)
    .forEach((sectionNum) => {
      const section1 = contract1.sections.find((s) => s.number === sectionNum);
      const section2 = contract2.sections.find((s) => s.number === sectionNum);

      if (section1 && section2) {
        if (section1.content === section2.content && section1.title === section2.title) {
          differences.push({
            section: sectionNum,
            title: section1.title,
            type: 'same',
            contract1Content: section1.content,
            contract2Content: section2.content,
          });
        } else {
          differences.push({
            section: sectionNum,
            title: section1.title,
            type: 'modified',
            contract1Content: section1.content,
            contract2Content: section2.content,
          });
        }
      } else if (section1) {
        differences.push({
          section: sectionNum,
          title: section1.title,
          type: 'removed',
          contract1Content: section1.content,
        });
      } else if (section2) {
        differences.push({
          section: sectionNum,
          title: section2.title,
          type: 'added',
          contract2Content: section2.content,
        });
      }
    });

  const getDiffIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'removed':
        return <CloseIcon sx={{ color: 'error.main', fontSize: 20 }} />;
      case 'modified':
        return <InfoIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
      default:
        return <CheckIcon sx={{ color: 'grey.400', fontSize: 20 }} />;
    }
  };

  const getDiffLabel = (type: string) => {
    switch (type) {
      case 'added':
        return { label: '追加', color: 'success' as const };
      case 'removed':
        return { label: '削除', color: 'error' as const };
      case 'modified':
        return { label: '変更', color: 'warning' as const };
      default:
        return { label: '同一', color: 'default' as const };
    }
  };

  const diffCount = {
    added: differences.filter((d) => d.type === 'added').length,
    removed: differences.filter((d) => d.type === 'removed').length,
    modified: differences.filter((d) => d.type === 'modified').length,
    same: differences.filter((d) => d.type === 'same').length,
  };

  return (
    <>
      {/* サマリー */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              契約書 A
            </Typography>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {contract1.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={contract1.type} size="small" />
              <Chip label={contract1.uploadDate} size="small" variant="outlined" />
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              契約書 B
            </Typography>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {contract2.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={contract2.type} size="small" />
              <Chip label={contract2.uploadDate} size="small" variant="outlined" />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip label={`同一: ${diffCount.same}件`} size="small" variant="outlined" />
          <Chip label={`変更: ${diffCount.modified}件`} color="warning" size="small" />
          <Chip label={`追加: ${diffCount.added}件`} color="success" size="small" />
          <Chip label={`削除: ${diffCount.removed}件`} color="error" size="small" />
        </Box>
      </Paper>

      {/* 差分リスト */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        条項ごとの比較 ({differences.length}件)
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {differences.map((diff) => {
          const { label, color } = getDiffLabel(diff.type);
          return (
            <Paper
              key={diff.section}
              sx={{
                border: '1px solid',
                borderColor: diff.type === 'same' ? 'grey.200' : `${color}.main`,
                borderLeft: '4px solid',
                borderLeftColor: diff.type === 'same' ? 'grey.200' : `${color}.main`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  {getDiffIcon(diff.type)}
                  <Chip label={`第${diff.section}条`} size="small" sx={{ bgcolor: 'black', color: 'white', fontWeight: 700 }} />
                  <Typography variant="h6" fontWeight={700}>
                    {diff.title}
                  </Typography>
                  <Chip label={label} color={color} size="small" sx={{ ml: 'auto' }} />
                </Box>

                {diff.type === 'same' && (
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2">{diff.contract1Content}</Typography>
                  </Box>
                )}

                {diff.type === 'modified' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom>
                        契約書 A
                      </Typography>
                      <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
                        <Typography variant="body2">{diff.contract1Content}</Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom>
                        契約書 B
                      </Typography>
                      <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                        <Typography variant="body2">{diff.contract2Content}</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {diff.type === 'added' && (
                  <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom>
                      契約書 B のみに存在
                    </Typography>
                    <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                      <Typography variant="body2">{diff.contract2Content}</Typography>
                    </Box>
                  </Box>
                )}

                {diff.type === 'removed' && (
                  <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom>
                      契約書 A のみに存在
                    </Typography>
                    <Box sx={{ bgcolor: 'error.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
                      <Typography variant="body2">{diff.contract1Content}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </>
  );
}

export default function ComparePage() {
  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <IconButton component={Link} href="/contracts" sx={{ mb: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          契約書比較
        </Typography>
        <Typography variant="body2" color="text.secondary">
          2つの契約書の内容を比較して差分を確認
        </Typography>
      </Box>

      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
        <CompareContent />
      </Suspense>
    </Box>
  );
}
