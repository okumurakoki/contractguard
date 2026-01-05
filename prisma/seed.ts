import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    title: '業務委託基本契約書',
    description: 'フリーランスや外部業者への業務委託に使用できる標準的な契約書テンプレート。IT業界向けに最適化されています。',
    category: '業務委託契約',
    industry: 'IT',
    content: `<h1>業務委託基本契約書</h1>

<p>{{counterparty}}（以下「甲」という）と{{company}}（以下「乙」という）は、以下のとおり業務委託契約を締結する。</p>

<h2>第1条（目的）</h2>
<p>甲は乙に対し、本契約に定める条件に従い、別途定める業務（以下「本業務」という）を委託し、乙はこれを受託する。</p>

<h2>第2条（業務内容）</h2>
<p>本業務の具体的な内容、納期、納品物等については、別途個別契約で定める。</p>

<h2>第3条（報酬）</h2>
<p>甲は乙に対し、本業務の対価として、{{amount}}を支払う。支払条件は別途個別契約で定める。</p>

<h2>第4条（秘密保持）</h2>
<p>甲および乙は、本契約の履行により知り得た相手方の秘密情報を第三者に開示してはならない。</p>

<h2>第5条（知的財産権）</h2>
<p>本契約に基づき乙が作成した成果物に関する知的財産権は、甲への納品完了時に甲に帰属する。</p>

<h2>第6条（損害賠償）</h2>
<p>甲または乙が本契約に違反し、相手方に損害を与えた場合、その損害を賠償する責任を負う。</p>

<h2>第7条（契約解除）</h2>
<p>甲または乙は、相手方が本契約に違反した場合、書面による通知をもって本契約を解除することができる。</p>

<h2>第8条（協議事項）</h2>
<p>本契約に定めのない事項については、甲乙協議の上、決定する。</p>

<p style="text-align: right;">{{date}}</p>

<p>甲：{{counterparty}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>

<p>乙：{{company}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>`,
    variables: JSON.stringify([
      { name: 'counterparty', label: '契約相手（甲）', required: true, placeholder: '株式会社ABC' },
      { name: 'company', label: '自社名（乙）', required: true, placeholder: '株式会社XYZ' },
      { name: 'amount', label: '報酬金額', required: false, placeholder: '月額500,000円' },
    ]),
    isPublic: true,
    isPremium: false,
  },
  {
    title: '秘密保持契約書（NDA）',
    description: '取引開始前の情報開示に適したシンプルなNDAテンプレート。双方向の秘密保持に対応。',
    category: '秘密保持契約',
    industry: null,
    content: `<h1>秘密保持契約書</h1>

<p>{{counterparty}}（以下「甲」という）と{{company}}（以下「乙」という）は、以下のとおり秘密保持契約を締結する。</p>

<h2>第1条（目的）</h2>
<p>本契約は、甲乙間で開示される秘密情報の取扱いについて定めることを目的とする。</p>

<h2>第2条（秘密情報の定義）</h2>
<p>本契約における「秘密情報」とは、開示当事者が受領当事者に対し、秘密である旨を明示して開示した技術上、営業上その他一切の情報をいう。</p>

<h2>第3条（秘密保持義務）</h2>
<p>受領当事者は、秘密情報を善良なる管理者の注意をもって管理し、第三者に開示・漏洩してはならない。</p>

<h2>第4条（目的外使用の禁止）</h2>
<p>受領当事者は、秘密情報を本契約の目的以外に使用してはならない。</p>

<h2>第5条（有効期間）</h2>
<p>本契約の有効期間は、契約締結日から{{period}}とする。</p>

<h2>第6条（返還義務）</h2>
<p>受領当事者は、本契約終了後速やかに、秘密情報を開示当事者に返還または廃棄しなければならない。</p>

<p style="text-align: right;">{{date}}</p>

<p>甲：{{counterparty}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>

<p>乙：{{company}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>`,
    variables: JSON.stringify([
      { name: 'counterparty', label: '契約相手（甲）', required: true },
      { name: 'company', label: '自社名（乙）', required: true },
      { name: 'period', label: '有効期間', required: false, placeholder: '3年間' },
    ]),
    isPublic: true,
    isPremium: false,
  },
  {
    title: '売買基本契約書',
    description: '継続的な商品売買取引に使用できる基本契約書。製造業・卸売業向け。',
    category: '売買契約',
    industry: '製造業',
    content: `<h1>売買基本契約書</h1>

<p>{{counterparty}}（以下「甲」という）と{{company}}（以下「乙」という）は、甲乙間の継続的売買取引について、以下のとおり契約を締結する。</p>

<h2>第1条（目的）</h2>
<p>本契約は、甲乙間の商品売買取引に関する基本的事項を定めることを目的とする。</p>

<h2>第2条（個別契約）</h2>
<p>個々の売買取引については、本契約に基づき別途個別契約を締結する。</p>

<h2>第3条（納品）</h2>
<p>乙は、個別契約で定める納期・場所に商品を納品する。</p>

<h2>第4条（検収）</h2>
<p>甲は、納品後{{inspection_days}}日以内に検収を行い、結果を乙に通知する。</p>

<h2>第5条（代金支払）</h2>
<p>甲は、検収完了後、乙の請求に基づき代金を支払う。</p>

<h2>第6条（所有権移転）</h2>
<p>商品の所有権は、代金完済時に乙から甲に移転する。</p>

<h2>第7条（瑕疵担保）</h2>
<p>乙は、納品後{{warranty_period}}間、商品の瑕疵について担保責任を負う。</p>

<p style="text-align: right;">{{date}}</p>

<p>甲：{{counterparty}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>

<p>乙：{{company}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>`,
    variables: JSON.stringify([
      { name: 'counterparty', label: '買主（甲）', required: true },
      { name: 'company', label: '売主（乙）', required: true },
      { name: 'inspection_days', label: '検収期間（日数）', placeholder: '7' },
      { name: 'warranty_period', label: '瑕疵担保期間', placeholder: '1年' },
    ]),
    isPublic: true,
    isPremium: false,
  },
  {
    title: 'SaaS利用規約',
    description: 'SaaS事業者向けの利用規約テンプレート。個人情報保護法対応済み。',
    category: 'サービス利用規約',
    industry: 'IT',
    content: `<h1>{{service_name}} 利用規約</h1>

<h2>第1条（適用）</h2>
<p>本規約は、{{company}}（以下「当社」という）が提供する「{{service_name}}」（以下「本サービス」という）の利用に関する条件を定めるものです。</p>

<h2>第2条（利用登録）</h2>
<p>本サービスの利用を希望する者は、当社所定の方法により利用登録を申請し、当社の承認を得るものとします。</p>

<h2>第3条（禁止事項）</h2>
<p>利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。<br>
（1）法令または公序良俗に違反する行為<br>
（2）当社または第三者の権利を侵害する行為<br>
（3）本サービスの運営を妨害する行為</p>

<h2>第4条（サービスの変更・停止）</h2>
<p>当社は、利用者への事前通知なく、本サービスの内容を変更または停止することができます。</p>

<h2>第5条（個人情報の取扱い）</h2>
<p>当社は、利用者の個人情報を当社のプライバシーポリシーに従い適切に取り扱います。</p>

<h2>第6条（免責事項）</h2>
<p>当社は、本サービスの利用により生じた損害について、当社に故意または重過失がある場合を除き、責任を負いません。</p>

<h2>第7条（規約の変更）</h2>
<p>当社は、利用者への事前通知をもって本規約を変更することができます。</p>

<h2>第8条（準拠法・管轄）</h2>
<p>本規約は日本法に準拠し、本サービスに関する紛争は{{court}}を専属的合意管轄裁判所とします。</p>

<p style="text-align: right;">制定日：{{date}}<br>{{company}}</p>`,
    variables: JSON.stringify([
      { name: 'service_name', label: 'サービス名', required: true },
      { name: 'company', label: '運営会社名', required: true },
      { name: 'court', label: '管轄裁判所', placeholder: '東京地方裁判所' },
    ]),
    isPublic: true,
    isPremium: false,
  },
  {
    title: 'ソフトウェア開発委託契約書',
    description: 'システム開発・アプリ開発の委託に特化した契約書テンプレート。仕様変更や知的財産権の帰属を明確化。',
    category: '業務委託契約',
    industry: 'IT',
    content: `<h1>ソフトウェア開発委託契約書</h1>

<p>{{counterparty}}（以下「甲」という）と{{company}}（以下「乙」という）は、ソフトウェア開発業務の委託について、以下のとおり契約を締結する。</p>

<h2>第1条（目的）</h2>
<p>甲は乙に対し、{{project_name}}（以下「本件開発」という）を委託し、乙はこれを受託する。</p>

<h2>第2条（開発内容）</h2>
<p>本件開発の詳細は、別紙仕様書に定める。</p>

<h2>第3条（委託料）</h2>
<p>甲は乙に対し、本件開発の対価として{{amount}}を支払う。</p>

<h2>第4条（納期）</h2>
<p>乙は{{delivery_date}}までに成果物を甲に納品する。</p>

<h2>第5条（仕様変更）</h2>
<p>仕様変更が生じた場合、甲乙協議の上、納期および委託料を変更することができる。</p>

<h2>第6条（検収）</h2>
<p>甲は納品後{{inspection_days}}日以内に検収を行う。</p>

<h2>第7条（瑕疵担保）</h2>
<p>乙は検収完了後{{warranty_months}}ヶ月間、成果物の瑕疵について無償で修補する。</p>

<h2>第8条（知的財産権）</h2>
<p>成果物に関する著作権その他の知的財産権は、委託料完済時に甲に帰属する。</p>

<h2>第9条（秘密保持）</h2>
<p>甲および乙は、本契約に関して知り得た秘密情報を第三者に開示しない。</p>

<p style="text-align: right;">{{date}}</p>

<p>甲：{{counterparty}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>

<p>乙：{{company}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>`,
    variables: JSON.stringify([
      { name: 'counterparty', label: '発注者（甲）', required: true },
      { name: 'company', label: '受注者（乙）', required: true },
      { name: 'project_name', label: 'プロジェクト名', required: true },
      { name: 'amount', label: '委託料', placeholder: '5,000,000円' },
      { name: 'delivery_date', label: '納期', placeholder: '令和7年3月31日' },
      { name: 'inspection_days', label: '検収期間（日数）', placeholder: '14' },
      { name: 'warranty_months', label: '瑕疵担保期間（ヶ月）', placeholder: '12' },
    ]),
    isPublic: true,
    isPremium: true,
  },
  {
    title: '顧問契約書',
    description: '弁護士・税理士・コンサルタントなどの顧問契約に使用できるテンプレート。',
    category: 'コンサルティング契約',
    industry: null,
    content: `<h1>顧問契約書</h1>

<p>{{counterparty}}（以下「甲」という）と{{company}}（以下「乙」という）は、顧問業務の委託について、以下のとおり契約を締結する。</p>

<h2>第1条（目的）</h2>
<p>甲は乙に対し、{{service_type}}に関する顧問業務を委託し、乙はこれを受託する。</p>

<h2>第2条（業務内容）</h2>
<p>乙は甲に対し、以下の業務を提供する。<br>
（1）{{service_type}}に関する相談対応<br>
（2）書類の確認・アドバイス<br>
（3）その他甲乙間で別途合意した業務</p>

<h2>第3条（顧問料）</h2>
<p>甲は乙に対し、月額{{monthly_fee}}を毎月末日までに支払う。</p>

<h2>第4条（契約期間）</h2>
<p>本契約の有効期間は、{{start_date}}から{{period}}とする。期間満了の1ヶ月前までに甲乙いずれからも書面による解約の意思表示がない場合、同条件で更新される。</p>

<h2>第5条（秘密保持）</h2>
<p>乙は、本契約に関して知り得た甲の秘密情報を第三者に開示しない。</p>

<h2>第6条（解約）</h2>
<p>甲または乙は、1ヶ月前の書面通知をもって本契約を解約することができる。</p>

<p style="text-align: right;">{{date}}</p>

<p>甲：{{counterparty}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>

<p>乙：{{company}}<br>
住所：<br>
代表者：　　　　　　　　　　印</p>`,
    variables: JSON.stringify([
      { name: 'counterparty', label: '依頼者（甲）', required: true },
      { name: 'company', label: '顧問（乙）', required: true },
      { name: 'service_type', label: '顧問業務の種類', placeholder: '法務' },
      { name: 'monthly_fee', label: '月額顧問料', placeholder: '100,000円' },
      { name: 'start_date', label: '契約開始日', placeholder: '令和7年1月1日' },
      { name: 'period', label: '契約期間', placeholder: '1年間' },
    ]),
    isPublic: true,
    isPremium: false,
  },
];

async function main() {
  console.log('Seeding templates...');

  for (const template of templates) {
    const existing = await prisma.template.findFirst({
      where: { title: template.title, organizationId: null },
    });

    if (existing) {
      console.log(`Template "${template.title}" already exists, skipping.`);
      continue;
    }

    await prisma.template.create({
      data: {
        organizationId: null, // 公式テンプレート
        createdBy: null,
        title: template.title,
        description: template.description,
        category: template.category,
        industry: template.industry,
        content: template.content,
        variables: template.variables,
        isPublic: template.isPublic,
        isPremium: template.isPremium,
        usageCount: 0,
      },
    });

    console.log(`Created template: ${template.title}`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
