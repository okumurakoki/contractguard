import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface RiskItem {
  riskType: string;
  riskLevel: 'high' | 'medium' | 'low';
  sectionTitle: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  legalBasis: string;
}

export interface AnalysisResult {
  riskLevel: 'high' | 'medium' | 'low';
  overallScore: number;
  summary: string;
  risks: RiskItem[];
  checklist: {
    item: string;
    checked: boolean;
    note?: string;
  }[];
}

const SYSTEM_PROMPT = `あなたは日本の契約書を専門にレビューする法務AIアシスタントです。
契約書の内容を分析し、リスクを特定して改善提案を行ってください。

以下の観点で分析してください：
1. 損害賠償条項（上限設定、免責条項の妥当性）
2. 契約解除条件（一方的な解除権、解除通知期間）
3. 知的財産権（帰属、使用許諾の範囲）
4. 秘密保持（範囲、期間の妥当性）
5. 競業避止（範囲、期間の妥当性）
6. 支払条件（遅延損害金、支払期日）
7. 契約期間・更新条件（自動更新の有無、解約条件）
8. 管轄裁判所・準拠法

各リスクについて：
- リスクレベル（high/medium/low）
- 該当箇所の原文
- 修正提案
- 修正理由
- 法的根拠

を明確に示してください。

出力は必ず以下のJSON形式で返してください：
{
  "riskLevel": "high" | "medium" | "low",
  "overallScore": 0-100,
  "summary": "契約書の総合評価（200文字以内）",
  "risks": [
    {
      "riskType": "損害賠償条項",
      "riskLevel": "high" | "medium" | "low",
      "sectionTitle": "該当セクション名",
      "originalText": "原文",
      "suggestedText": "修正案",
      "reason": "修正理由",
      "legalBasis": "法的根拠"
    }
  ],
  "checklist": [
    {
      "item": "チェック項目",
      "checked": true | false,
      "note": "備考"
    }
  ]
}`;

export async function analyzeContract(contractText: string, contractType: string): Promise<AnalysisResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `以下の${contractType}を分析してください。

---
${contractText}
---

JSON形式で回答してください。`,
      },
    ],
  });

  // レスポンスからテキストを抽出
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // JSONを抽出してパース
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  const result = JSON.parse(jsonMatch[0]) as AnalysisResult;
  return result;
}

// モック関数（API未設定時用）
export async function analyzeContractMock(contractType: string): Promise<AnalysisResult> {
  // 実際のAPIが設定されるまでのモックデータ
  await new Promise((resolve) => setTimeout(resolve, 2000)); // 擬似的な遅延

  return {
    riskLevel: 'medium',
    overallScore: 72,
    summary: `この${contractType}は概ね標準的な内容ですが、損害賠償条項と解除条件について確認が必要です。特に損害賠償の上限設定と、一方的な解除権の有無を確認してください。`,
    risks: [
      {
        riskType: '損害賠償条項',
        riskLevel: 'high',
        sectionTitle: '第10条（損害賠償）',
        originalText: '乙は、本契約に違反した場合、甲に生じた一切の損害を賠償するものとする。',
        suggestedText: '乙は、本契約に違反した場合、甲に生じた直接かつ現実の損害を賠償するものとする。ただし、賠償額の上限は本契約に基づく報酬総額を超えないものとする。',
        reason: '損害賠償の範囲が無制限となっており、予測不可能なリスクが生じる可能性があります。',
        legalBasis: '民法第416条（損害賠償の範囲）',
      },
      {
        riskType: '契約解除条件',
        riskLevel: 'medium',
        sectionTitle: '第15条（契約の解除）',
        originalText: '甲は、乙に書面で通知することにより、いつでも本契約を解除することができる。',
        suggestedText: '甲または乙は、30日前までに相手方に書面で通知することにより、本契約を解除することができる。',
        reason: '一方的な解除権が設定されており、受託者側に不利な条件となっています。',
        legalBasis: '民法第651条（委任の解除）',
      },
      {
        riskType: '知的財産権',
        riskLevel: 'low',
        sectionTitle: '第8条（知的財産権）',
        originalText: '本業務により生じた成果物の知的財産権は、甲に帰属するものとする。',
        suggestedText: '本業務により生じた成果物の知的財産権は、報酬の支払完了をもって甲に帰属するものとする。',
        reason: '知的財産権の帰属時期が明確でないため、報酬支払完了を条件とすることを推奨します。',
        legalBasis: '著作権法第15条（職務著作）',
      },
    ],
    checklist: [
      { item: '契約当事者の特定', checked: true },
      { item: '契約目的の明確化', checked: true },
      { item: '業務範囲の定義', checked: true },
      { item: '報酬・支払条件', checked: true },
      { item: '損害賠償上限の設定', checked: false, note: '上限設定を推奨' },
      { item: '秘密保持条項', checked: true },
      { item: '契約期間の明記', checked: true },
      { item: '解除条件の双方性', checked: false, note: '双方に解除権を付与すべき' },
      { item: '管轄裁判所の指定', checked: true },
    ],
  };
}
