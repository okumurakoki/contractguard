'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Description as DocumentIcon,
  Gavel as GavelIcon,
  BusinessCenter as BusinessIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

// 契約書テンプレートの種類
const contractTemplates = [
  {
    id: 'service',
    title: '業務委託契約書',
    description: 'フリーランスや外部業者への業務委託に使用する基本的な契約書',
    icon: <BusinessIcon sx={{ fontSize: 48, color: '#1e40af' }} />,
    tags: ['業務委託', '一般'],
    estimatedTime: '15分',
  },
  {
    id: 'nda',
    title: '秘密保持契約書（NDA）',
    description: '機密情報の取り扱いについて定める契約書',
    icon: <SecurityIcon sx={{ fontSize: 48, color: '#059669' }} />,
    tags: ['秘密保持', '一般'],
    estimatedTime: '10分',
  },
  {
    id: 'employment',
    title: '雇用契約書',
    description: '正社員・契約社員の雇用に関する契約書',
    icon: <PeopleIcon sx={{ fontSize: 48, color: '#dc2626' }} />,
    tags: ['雇用', '人事'],
    estimatedTime: '20分',
  },
  {
    id: 'sales',
    title: '売買契約書',
    description: '商品やサービスの売買に関する契約書',
    icon: <AssignmentIcon sx={{ fontSize: 48, color: '#7c3aed' }} />,
    tags: ['売買', '取引'],
    estimatedTime: '15分',
  },
  {
    id: 'license',
    title: 'ライセンス契約書',
    description: '知的財産権の使用許諾に関する契約書',
    icon: <GavelIcon sx={{ fontSize: 48, color: '#ea580c' }} />,
    tags: ['ライセンス', '知財'],
    estimatedTime: '20分',
  },
  {
    id: 'consulting',
    title: 'コンサルティング契約書',
    description: '経営・技術コンサルティングサービスに関する契約書',
    icon: <DocumentIcon sx={{ fontSize: 48, color: '#0891b2' }} />,
    tags: ['コンサルティング', '専門'],
    estimatedTime: '20分',
  },
];

const steps = ['テンプレート選択', '基本情報入力', '条項カスタマイズ', '確認・生成'];

export default function LawyerContractCreationPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = React.useState(0);
  const [selectedTemplate, setSelectedTemplate] = React.useState('');
  const [contractType, setContractType] = React.useState('');
  const [clientName, setClientName] = React.useState('');
  const [counterpartyName, setCounterpartyName] = React.useState('');
  const [contractPurpose, setContractPurpose] = React.useState('');

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // 契約書を生成して詳細ページへ遷移
      router.push('/contracts/new');
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleContractTypeChange = (event: SelectChangeEvent) => {
    setContractType(event.target.value);
  };

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#1a2332' }}>
          契約書作成支援
        </Typography>
        <Typography variant="body1" color="text.secondary">
          テンプレートを選択して、クライアント向けの契約書を効率的に作成できます
        </Typography>
      </Box>

      {/* ステッパー */}
      <Paper sx={{ p: 3, mb: 4, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* ステップ1: テンプレート選択 */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
            契約書テンプレートを選択
          </Typography>
          <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            {contractTemplates.map((template, index) => (
              <Box
                key={template.id}
                sx={{
                  p: 3,
                  borderBottom: index < contractTemplates.length - 1 ? '1px solid #e5e7eb' : 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    borderLeft: '4px solid #3b82f6',
                  },
                }}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {/* アイコン */}
                  <Box
                    sx={{
                      minWidth: 80,
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f8fafc',
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {template.icon}
                  </Box>

                  {/* コンテンツ */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6" fontWeight={700}>
                        {template.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {template.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              bgcolor: '#f0f9ff',
                              color: '#1e40af',
                              border: '1px solid #bfdbfe',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {template.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      作成時間目安: <strong>{template.estimatedTime}</strong>
                    </Typography>
                  </Box>

                  {/* ボタン */}
                  <Box sx={{ minWidth: 200 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        bgcolor: '#1e40af',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': { bgcolor: '#1e3a8a' },
                      }}
                    >
                      このテンプレートを使用
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      )}

      {/* ステップ2: 基本情報入力 */}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
            契約書の基本情報を入力
          </Typography>
          <Paper sx={{ p: 4, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 3 }}>
              <Box sx={{ gridColumn: "span 12" }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  選択されたテンプレート:{' '}
                  <strong>{contractTemplates.find((t) => t.id === selectedTemplate)?.title}</strong>
                </Alert>
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                <TextField
                  fullWidth
                  label="依頼者（甲）"
                  placeholder="例: 株式会社ABC"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  helperText="契約を依頼するクライアント企業名"
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                <TextField
                  fullWidth
                  label="相手方（乙）"
                  placeholder="例: 株式会社XYZ"
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  helperText="契約の相手方企業・個人名"
                />
              </Box>
              <Box sx={{ gridColumn: "span 12" }}>
                <FormControl fullWidth>
                  <InputLabel>契約形態</InputLabel>
                  <Select value={contractType} onChange={handleContractTypeChange} label="契約形態">
                    <MenuItem value="standard">標準契約</MenuItem>
                    <MenuItem value="master">基本契約</MenuItem>
                    <MenuItem value="individual">個別契約</MenuItem>
                    <MenuItem value="amendment">変更契約</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ gridColumn: "span 12" }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="契約の目的・背景"
                  placeholder="この契約の目的や背景について簡潔に記載してください"
                  value={contractPurpose}
                  onChange={(e) => setContractPurpose(e.target.value)}
                  helperText="契約書の前文や目的条項に使用されます"
                />
              </Box>
            </Box>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={handleBack}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#4b5563',
              }}
            >
              戻る
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!clientName || !counterpartyName || !contractType}
              sx={{
                bgcolor: '#1e40af',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#1e3a8a' },
              }}
            >
              次へ
            </Button>
          </Box>
        </Box>
      )}

      {/* ステップ3以降は省略（実装時に追加） */}
      {activeStep >= 2 && (
        <Box>
          <Paper sx={{ p: 4, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h6" gutterBottom>
              ステップ {activeStep + 1}: {steps[activeStep]}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              このステップは開発中です
            </Typography>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={handleBack}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#4b5563',
              }}
            >
              戻る
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{
                bgcolor: '#1e40af',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#1e3a8a' },
              }}
            >
              {activeStep === steps.length - 1 ? '契約書を生成' : '次へ'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
