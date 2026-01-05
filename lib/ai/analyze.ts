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

【重要】各リスクについて：
- リスクレベル（high/medium/low）
- originalText: 契約書から該当箇所を抽出してください。以下のルールに従ってください：
  * 可能な限り元の文章を一字一句そのまま抽出する
  * 条項のタイトル（「第○条（○○）」）は含めず、本文のみを抽出する
  * 複数の文がある場合は、リスクに該当する部分のみを抽出する（前後の無関係な文は含めない）
  * 句読点や記号も正確に含める
  * 改行は含めず、連続したテキストとして記載する
- suggestedText: 修正提案（originalTextを修正した後の文章）
- reason: 修正理由
- legalBasis: 法的根拠

【originalTextの抽出例】
例1：
契約書の記載: 「第10条（損害賠償）甲は、本契約に違反した場合、乙に生じた一切の損害を賠償するものとする。」
正しいoriginalText: 「甲は、本契約に違反した場合、乙に生じた一切の損害を賠償するものとする。」

例2：
契約書の記載: 「第5条（秘密保持）甲及び乙は、本契約に関連して知り得た相手方の秘密情報を第三者に開示してはならない。前項の義務は、本契約終了後も3年間継続する。」
リスクが第1文のみに関係する場合：
正しいoriginalText: 「甲及び乙は、本契約に関連して知り得た相手方の秘密情報を第三者に開示してはならない。」

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
      "originalText": "【契約書から一字一句そのままコピー】",
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

// 条項並び替え提案のインターフェース
export interface ArticleOrderSuggestion {
  suggestedOrder: string[]; // 条番号の配列（例: ["1", "3", "2", "4"]）
  reasoning: string[]; // 各判断理由
}

// 条項の自動並び替え提案
export async function suggestArticleOrder(
  articles: { number: string; title: string }[]
): Promise<ArticleOrderSuggestion> {
  const articleList = articles.map((a) => `第${a.number}条（${a.title}）`).join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `あなたは日本の契約書の専門家です。
契約書の条項を法的に一般的で適切な順序に並び替えてください。

一般的な契約書の条項順序:
1. 定義・目的
2. 業務内容・範囲
3. 報酬・支払条件
4. 権利義務
5. 知的財産権
6. 秘密保持
7. 損害賠償
8. 契約期間・更新
9. 契約解除
10. 反社会的勢力の排除
11. 管轄裁判所
12. 協議事項
13. 附則・その他

上記の一般的な順序を参考に、提供された条項を最適な順序に並び替えてください。`,
    messages: [
      {
        role: 'user',
        content: `以下の条項リストを最適な順序に並び替えてください。

${articleList}

JSON形式で回答してください:
{
  "suggestedOrder": ["1", "3", "2", ...],
  "reasoning": ["定義条項を最初に配置", ...]
}`,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse AI response for article order');
  }

  return JSON.parse(jsonMatch[0]) as ArticleOrderSuggestion;
}

// 条項並び替え提案のモック関数
export async function suggestArticleOrderMock(
  articles: { number: string; title: string }[]
): Promise<ArticleOrderSuggestion> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 一般的な契約書の順序に基づいてソート
  const orderPriority: Record<string, number> = {
    '目的': 1,
    '定義': 2,
    '業務': 3,
    '委託': 3,
    '報酬': 4,
    '支払': 4,
    '対価': 4,
    '権利': 5,
    '義務': 5,
    '知的財産': 6,
    '著作権': 6,
    '秘密': 7,
    '機密': 7,
    '損害': 8,
    '賠償': 8,
    '責任': 8,
    '期間': 9,
    '更新': 9,
    '解除': 10,
    '解約': 10,
    '終了': 10,
    '反社': 11,
    '管轄': 12,
    '裁判': 12,
    '協議': 13,
    '附則': 14,
    '雑則': 14,
  };

  const getOrderPriority = (title: string): number => {
    for (const [keyword, priority] of Object.entries(orderPriority)) {
      if (title.includes(keyword)) {
        return priority;
      }
    }
    return 100; // デフォルトは最後
  };

  const sortedArticles = [...articles].sort((a, b) => {
    return getOrderPriority(a.title) - getOrderPriority(b.title);
  });

  return {
    suggestedOrder: sortedArticles.map((a) => a.number),
    reasoning: sortedArticles.map(
      (a, i) => `第${a.number}条（${a.title}）を${i + 1}番目に配置`
    ),
  };
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
        // 条項タイトルを含めず、本文のみ
        originalText: '乙は、本契約に違反した場合、甲に生じた一切の損害を賠償するものとする。',
        suggestedText: '乙は、本契約に違反した場合、甲に生じた直接かつ現実の損害を賠償するものとする。ただし、賠償額の上限は本契約に基づく報酬総額を超えないものとする。',
        reason: '損害賠償の範囲が無制限となっており、予測不可能なリスクが生じる可能性があります。',
        legalBasis: '民法第416条（損害賠償の範囲）',
      },
      {
        riskType: '契約解除条件',
        riskLevel: 'medium',
        sectionTitle: '第15条（契約の解除）',
        // 条項タイトルを含めず、本文のみ
        originalText: '甲は、乙に書面で通知することにより、いつでも本契約を解除することができる。',
        suggestedText: '甲または乙は、30日前までに相手方に書面で通知することにより、本契約を解除することができる。',
        reason: '一方的な解除権が設定されており、受託者側に不利な条件となっています。',
        legalBasis: '民法第651条（委任の解除）',
      },
      {
        riskType: '知的財産権',
        riskLevel: 'low',
        sectionTitle: '第8条（知的財産権）',
        // 条項タイトルを含めず、本文のみ
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
