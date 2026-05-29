// Glossary page logic — uses embedded data to avoid file:// fetch issues.
// priority: "high" の用語は ⭐ 表示 / 優先度高のみフィルタ対象。
(function () {
  const DATA = {
    categories: [
      {
        id: 'process',
        name: '業務・プロセス系',
        terms: [
          { term: '仕入れ', priority: 'high', short: '事業の素材となる土地・建物を見つけて手に入れる活動', long: '不動産業者が、自社の事業（売却・開発・賃貸など）に使う土地や建物を仕入れる業務。製造業の原料調達に相当する。', related: ['仕入れチャネル', 'オフマーケット'] },
          { term: 'オフマーケット', priority: 'high', short: '市場（仲介・レインズ）に出てこない物件', long: '売主が「売る」と決断する前段階で、特定の業者にしか情報が流れない物件群。競合は少ないがアクセスは困難。', related: ['仕入れ', '地権者'] },
          { term: 'レインズ', priority: 'high', short: '業者間で物件情報を共有するシステム', long: 'REINS。不動産流通標準情報システム。免許業者が登録・閲覧できる。本流チャネルのひとつだが、掲載時点で多くの目に晒される。', related: ['仕入れチャネル', '媒介'] },
          { term: '媒介', priority: 'high', short: '仲介の正式名称', long: '売主・買主の取引を仲介する業務。専属専任・専任・一般の3区分がある。', related: ['レインズ', '仲介'] },
          { term: '業者間流通', short: '業者同士で回す物件情報', long: 'レインズ含む業者間の情報網全般を指す表現。', related: ['レインズ'] },
          { term: '川上情報', short: '市場に出る前の生情報', long: '売却検討すらまだの段階で得る情報。仕入れの勝敗を分ける。', related: ['オフマーケット'] },
          { term: '失注', short: '競合に取られて買えなかったこと', long: '良い物件ほど失注リスクが高い。', related: [] },
          { term: '稟議', short: '社内の購入承認プロセス', long: '仕入れ候補が出てきたら、価格・採算・リスクを社内回覧して購入決裁を取る。', related: [] },
          { term: '与信', short: '買主の支払い能力評価', long: '金融機関や売主側が、買い手の購入余力を判断する。', related: [] },
          { term: '仕入れチャネル', priority: 'high', short: '情報を得るルート', long: '仲介経由・レインズ・地権者直接・紹介、の4本柱。', related: ['レインズ', 'オフマーケット'] },
          { term: '目利き', short: '良い物件を見抜く力', long: '立地・需給・規制・将来性を総合して、物件の事業性を判断する能力。経験で育つことが多く属人化しやすい。', related: [] },
        ],
      },
      {
        id: 'property',
        name: '物件・土地系',
        terms: [
          { term: '用地', priority: 'high', short: '事業に使う土地', long: '「マンション用地」「戸建用地」などの形で使われる。', related: [] },
          { term: '宅地', short: '住宅を建てられる土地', long: '都市計画法・建築基準法上で住宅利用が認められた区分。', related: ['用途地域'] },
          { term: '底地', short: '借地権が設定されている土地の地主側の権利', long: '他人に貸している土地の所有権。流通市場では低めの評価。', related: ['借地権'] },
          { term: '借地権', short: '土地を借りて使う権利', long: '建物所有目的の借地権は借地借家法で保護される。', related: ['底地'] },
          { term: '現況道路', short: '実際に道路として使われている道', long: '建築基準法上の道路かは別途確認必要。', related: ['接道義務'] },
          { term: '整形地', short: '形が四角に近い土地', long: '建築の自由度が高く、評価も高い。', related: [] },
          { term: '古家', priority: 'high', short: '古い建物が残っている土地', long: '「古家付き土地」として売買されることが多い。解体費を加味して値付け。', related: [] },
          { term: '空き家', priority: 'high', short: '居住・利用されていない住宅', long: '総務省調査で全国数百万戸。仕入れの主要ターゲットのひとつ。', related: ['古家'] },
          { term: '遊休地', priority: 'high', short: '使われていない土地', long: '農地・山林・工場跡地など。再エネ・物流の有望ターゲット。', related: [] },
          { term: '接道', short: '敷地が道路に接していること', long: '建築基準法では2m以上の接道が必要（接道義務）。', related: ['接道義務'] },
          { term: '接道義務', priority: 'high', short: '建築可能になる接道要件', long: '建築基準法42条で道路に2m以上接していることが原則。満たさないと再建築不可。', related: ['接道', '再建築不可', '位置指定道路', '2項道路'] },
          { term: '容積率', priority: 'high', short: '敷地に対する延床面積の比率', long: '用途地域ごとに上限が定められている。商業地は600-800%、住居地は100-200%等。', related: ['建ぺい率', '用途地域'] },
          { term: '建ぺい率', short: '敷地に対する建築面積の比率', long: '1階の建築可能面積を縛る指標。', related: ['容積率'] },
          { term: '用途地域', priority: 'high', short: '都市計画で定められた土地利用区分', long: '住居系・商業系・工業系など13種。建物の用途・規模を縛る。', related: ['容積率'] },
          { term: '再建築不可', priority: 'high', short: '現在の建物が無くなったら建て替えられない土地', long: '接道義務を満たさない等の理由。再販価格が大きく下がる。位置指定道路図・道路種別図で判定する。', related: ['接道義務', '位置指定道路', '2項道路'] },
          { term: '位置指定道路', priority: 'high', short: '私道だが建基法上の道路と認められた指定道', long: '建築基準法42条1項5号に基づき、特定行政庁から道路位置の指定を受けた私道。指定図面（位置指定道路図）に幅員・延長・すみ切り形状が記載される。私道接道地の再建築可否の核心。', related: ['接道義務', '2項道路', '再建築不可'] },
          { term: '2項道路', short: '幅員4m未満のみなし道路（建基法42条2項）', long: '建築基準法施行前から存在する幅員4m未満の道路を「みなし道路」として扱うもの。建て替え時はセットバック義務が生じ、有効宅地面積が減る。', related: ['セットバック', '狭あい道路', '接道義務'] },
          { term: 'セットバック', priority: 'high', short: '道路境界線を後退させて敷地を狭めること', long: '2項道路など幅員4m未満の道路に接する敷地で、道路中心線から2m後退した位置を新しい道路境界とする義務。後退部分は建築面積・容積率の算定に含められない。', related: ['2項道路', '狭あい道路'] },
          { term: '狭あい道路', short: '幅員4m未満の道路', long: '2項道路を含む狭い道路の総称。セットバック・後退用地の協議が必要。', related: ['2項道路', 'セットバック'] },
          { term: '道路台帳', short: '公道（認定道路）の管理台帳', long: '道路法に基づき道路管理者が作成する公道の台帳。幅員・延長・構造・区域などを記載。私道や2項道路は対象外。', related: ['位置指定道路'] },
          { term: '確定測量（境界確定）', priority: 'high', short: '隣地・道路管理者立会いで境界を確定すること', long: '隣接地所有者と立ち会って境界を確認する民々境界、道路管理者と確認する官民境界の双方を確定し、確定測量図と筆界確認書を整える作業。未確定だと正確な面積・分筆・開発に支障し、取引価格・流動性に直結する。', related: ['公図'] },
        ],
      },
      {
        id: 'price',
        name: '価格・評価系',
        terms: [
          { term: '公示地価', priority: 'high', short: '国が毎年発表する代表地点の地価', long: '国土交通省が毎年3月に発表。公的指標として広く参照される。', related: ['基準地価'] },
          { term: '基準地価', short: '都道府県が発表する地価', long: '公示地価と並ぶ公的指標。9月発表。', related: ['公示地価'] },
          { term: '相続税路線価', priority: 'high', short: '国税庁が定める相続税評価用の路線価', long: '公示地価の概ね80%。毎年7月発表。', related: ['公示地価', '固定資産税路線価'] },
          { term: '固定資産税路線価', short: '市区町村が定める固定資産税評価用の路線価', long: '公示地価の概ね70%。', related: ['相続税路線価'] },
          { term: '実勢価格', short: '実際の取引で成立する価格', long: '公的価格と乖離することがある。市場の需給で動く。', related: [] },
          { term: '積算価格', short: '土地と建物それぞれを足し上げた評価額', long: '金融機関の担保評価でよく使われる。', related: [] },
          { term: '収益還元法', short: '想定家賃収入から評価する方法', long: 'NOIを還元利回りで割って物件価格を算出。投資家視点。', related: ['NOI', 'キャップレート'] },
          { term: '取引事例比較法', short: '近隣の取引事例から評価する方法', long: '現実の取引価格を基準に補正する評価法。', related: [] },
          { term: '担保掛目', short: '金融機関が担保として評価する割合', long: '担保評価額に対する融資可能額の比率。70%等。', related: ['積算価格'] },
          { term: 'NOI', short: 'Net Operating Income', long: '賃料収入から運営費を引いた純収益。', related: ['収益還元法', 'キャップレート'] },
          { term: 'キャップレート', short: '還元利回り', long: 'NOIを物件価格で割った数値。投資判断の基準。', related: ['NOI'] },
        ],
      },
      {
        id: 'player',
        name: 'プレイヤー系',
        terms: [
          { term: 'デベロッパー', priority: 'high', short: '開発業者', long: '土地を仕入れ、建物を建てて販売・賃貸する事業者。マンデベ・戸建分譲・商業デベ等。', related: [] },
          { term: '戸建分譲', priority: 'high', short: '戸建住宅を分譲販売する事業', long: 'パワビル・ハウスメーカーなどが代表。', related: [] },
          { term: '買取再販', priority: 'high', short: '中古物件を買い取りリフォームして販売', long: '短期回転モデル。築古・訳ありもOK。', related: [] },
          { term: '仲介', priority: 'high', short: '媒介業務', long: '売主・買主の間に立ち手数料を得る。最大3%+6万円。', related: ['媒介', '専任媒介契約'] },
          { term: '専任媒介契約', short: '仲介を1社だけに任せる契約', long: '他社には依頼できないが、報告義務などがある。', related: ['仲介'] },
          { term: '地権者', priority: 'high', short: '土地の所有権を持つ人', long: 'WHEREの主要アプローチ対象。', related: ['オフマーケット'] },
          { term: '底地権者', short: '底地の所有者', long: '借地人に貸している地主。', related: ['底地'] },
          { term: '地主', short: '土地の所有者一般', long: '代々の地主は地縁・人脈で動くことが多い。', related: ['地権者'] },
        ],
      },
      {
        id: 'legal',
        name: '法務・登記系',
        terms: [
          { term: '登記簿（謄本）', priority: 'high', short: '土地・建物の権利関係の公的記録', long: '所有者・抵当権・地番・地目などが記載される。法務局で取得可能。', related: ['公図'] },
          { term: '公図', short: '土地の形状・地番を示す公的図面', long: '境界確定に使われる。古い図面は精度が低い場合あり。', related: ['登記簿（謄本）'] },
          { term: '地目', short: '土地の利用目的の登記区分', long: '宅地・畑・田・山林など。地目変更には手続きが必要。', related: [] },
          { term: '抵当権', short: '融資の担保に設定される権利', long: '借入返済不能時に競売にかけられる。', related: [] },
          { term: '相続登記', short: '相続発生時の登記変更', long: '2024年4月から義務化された。', related: ['登記簿（謄本）'] },
          { term: '商業登記簿', short: '会社の登記情報', long: '法人所有不動産を追う際に使われる。', related: [] },
          { term: '登記事項証明書', priority: 'high', short: '登記簿謄本の正式名称', long: '法務局が発行する登記内容の証明書。認証文・公印付きで証明力を持つ。表題部／権利部甲区／権利部乙区の3層構成。土地と建物は別々に取得する。', related: ['登記簿（謄本）', '登記事項要約書', '表題部', '権利部甲区', '権利部乙区'] },
          { term: '登記事項要約書', short: '現在有効な登記事項のみ抜粋した書類', long: '法務局で取得できるが、認証文・公印がなく証明力はない。閲覧目的なら謄本より安く早く取れる。履歴は載らない。隣地所有者の早期確認などに使う。', related: ['登記事項証明書'] },
          { term: '表題部', short: '登記簿の物理情報パート', long: '土地なら所在・地番・地目・地積、建物なら家屋番号・構造・床面積など、物件の物理的属性を記載する部分。', related: ['登記事項証明書', '権利部甲区', '権利部乙区'] },
          { term: '権利部甲区', short: '所有権に関する登記事項', long: '所有者の氏名・住所、所有権移転・差押・仮登記など、所有権に関する一切が記載される。', related: ['登記事項証明書', '権利部乙区'] },
          { term: '権利部乙区', short: '所有権以外の権利（抵当権など）の登記事項', long: '抵当権・根抵当権・地上権・賃借権など、所有権以外の権利が記載される。融資・担保の状況を読み取る重要パート。', related: ['登記事項証明書', '権利部甲区', '抵当権'] },
          { term: '閉鎖謄本', short: '閉鎖された登記記録の謄本', long: '合筆・建物滅失・他筆吸収などで閉鎖された登記記録。現行の登記簿謄本には載らない。過去の所有者・抹消された権利を遡って確認できるが、保存期間切れで廃棄されているケースもある。', related: ['登記事項証明書', '移記', '旧土地台帳'] },
          { term: '移記', short: '紙簿冊からコンピュータ登記簿への書き換え', long: 'ブック（紙）登記簿からコンピュータ登記簿へ移し替える作業。移記時に現在有効な事項のみ移され、抹消済みの古い権利は移記されないことが多い。そのため移記前の記録は「移記閉鎖謄本」として別に残る。', related: ['閉鎖謄本'] },
          { term: '旧土地台帳', short: '昭和35年以前の旧税務署系の土地記録', long: '1960年（昭和35年）の台帳・登記簿一元化より前に、税務署が地租課税のために管理していた記録。明治期からの古い所有者履歴を含むことがあり、所有者不明土地・相続調査の最古層資料となる。証明力は限定的。', related: ['閉鎖謄本'] },
        ],
      },
      {
        id: 'unit',
        name: '単位・計算',
        terms: [
          { term: '平米（㎡）', priority: 'high', short: 'WHERE社内の共通単位（面積）', long: '1辺1mの正方形の面積。WHEREが扱うデータベース・案件管理はすべて㎡統一。坪と混在する顧客打ち合わせでは「㎡換算でいくらか」を必ず確認する癖を。', related: ['坪', '容積率', '建ぺい率'] },
          { term: '坪', priority: 'high', short: '伝統単位（1坪 ≒ 3.30578㎡）', long: '畳2枚分。日本の不動産取引では今も主流。1坪 = 約3.30578㎡ ≒ 6尺×6尺。営業先・チラシ・顧客の頭の中は坪ベースが多い。', related: ['平米（㎡）'] },
          { term: '1坪 = 3.30578㎡', priority: 'high', short: '坪→平米の換算式', long: '正確には 1坪 = 400/121 ㎡ ≒ 3.30578㎡。ざっくり「坪に3.3を掛ければ平米」。100坪なら約330㎡。', related: ['平米（㎡）', '坪'] },
          { term: '1㎡ = 0.3025坪', priority: 'high', short: '平米→坪の換算式', long: '正確には 1㎡ = 121/400坪 ≒ 0.3025坪。ざっくり「平米を3.3で割れば坪」。100㎡なら約30坪。', related: ['平米（㎡）', '坪'] },
          { term: '1ha（ヘクタール）', short: '10,000㎡ = 約3,025坪', long: '再エネ用地・郊外大型地で使う。1ha=100m×100m=10,000㎡。1MW級メガソーラーの目安は1〜2ha。', related: ['平米（㎡）'] },
          { term: '畳', short: '広さの感覚単位（1畳 ≒ 1.62㎡）', long: '地域差あり（中京間・江戸間など）。WHEREでは厳密計算には使わないが、顧客との会話で出てきたら㎡に直す。', related: ['平米（㎡）'] },
        ],
      },
      {
        id: 'where',
        name: 'WHERE固有語',
        terms: [
          { term: '衛星データ×AI', priority: 'high', short: '衛星画像をAIで解析するWHEREのコア技術', long: '光学・SARなどの衛星画像から、空地・古家・遊休地などを面で抽出する。', related: ['候補地抽出'] },
          { term: 'AI手書き風DM', priority: 'high', short: 'AIが書く手書き風のダイレクトメール', long: '業界平均0.02%のDM返信率に対し、約1%（50倍）の返信率を実現。', related: [] },
          { term: '候補地抽出', priority: 'high', short: '条件に合う土地を地図上で見つけるプロセス', long: '衛星×AIで「ここ怪しい」と判断した土地を一覧化。', related: ['衛星データ×AI'] },
          { term: '地権者特定', priority: 'high', short: '候補地の所有者を特定すること', long: '登記情報を活用し、所有者の住所・連絡先（一部）まで紐付ける。', related: ['地権者DB'] },
          { term: '地権者DB', priority: 'high', short: '組織に蓄積される地権者ネットワーク', long: '担当者異動でも消えない再現性のある仕入れ基盤。', related: ['地権者特定'] },
          { term: 'Deal Tech', priority: 'high', short: '不動産取引のテクノロジー化', long: 'WHEREが標榜する事業領域。仕入れのオフマーケット側をテクノロジーで開拓する。', related: [] },
          { term: 'オフマーケット仕入れ基盤', priority: 'high', short: '市場前用地への直接アクセス基盤', long: 'WHEREの3つのコア価値の1つ目。', related: ['オフマーケット'] },
        ],
      },
    ],
  };

  const state = { keyword: '', activeCategory: 'all', onlyHigh: false };

  function termIndex() {
    const map = new Map();
    for (const cat of DATA.categories) {
      for (const t of cat.terms) {
        map.set(t.term, { ...t, categoryId: cat.id, categoryName: cat.name });
      }
    }
    return map;
  }
  const TERM_MAP = termIndex();

  function matches(term) {
    if (state.onlyHigh && term.priority !== 'high') return false;
    if (!state.keyword) return true;
    const kw = state.keyword.toLowerCase();
    return [term.term, term.short, term.long].some((s) => (s || '').toLowerCase().includes(kw));
  }

  function renderFilters() {
    const wrap = document.getElementById('filters');
    if (!wrap) return;
    const buttons = [{ id: 'all', name: 'すべて' }, ...DATA.categories.map((c) => ({ id: c.id, name: c.name }))];
    const catHtml = buttons
      .map((b) => `<button class="glossary-filter ${state.activeCategory === b.id ? 'is-active' : ''}" data-cat="${b.id}">${b.name}</button>`)
      .join('');
    const highHtml = `<button class="glossary-filter ${state.onlyHigh ? 'is-active' : ''}" data-high="1" style="border-color:var(--color-accent-1);">⭐ 優先度高のみ</button>`;
    wrap.innerHTML = catHtml + highHtml;
    wrap.querySelectorAll('button[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.cat;
        renderAll();
      });
    });
    wrap.querySelector('button[data-high]').addEventListener('click', () => {
      state.onlyHigh = !state.onlyHigh;
      renderAll();
    });
  }

  function renderGlossary() {
    const root = document.getElementById('glossary-root');
    if (!root) return;
    let html = '';
    let total = 0;
    for (const cat of DATA.categories) {
      if (state.activeCategory !== 'all' && state.activeCategory !== cat.id) continue;
      const filtered = cat.terms.filter(matches);
      if (filtered.length === 0) continue;
      const highCount = filtered.filter((t) => t.priority === 'high').length;
      total += filtered.length;
      html += `<section class="glossary-category"><h2>${cat.name} <small class="muted">(${filtered.length}${highCount > 0 ? ` / うち⭐${highCount}` : ''})</small></h2><div class="glossary-grid">`;
      for (const t of filtered) {
        const star = t.priority === 'high' ? '<span class="prio-star" title="優先度高">⭐</span>' : '';
        html += `<button class="glossary-item ${t.priority === 'high' ? 'is-high' : ''}" data-term="${encodeURIComponent(t.term)}"><div class="term">${star}${t.term}</div><div class="short">${t.short}</div></button>`;
      }
      html += '</div></section>';
    }
    if (total === 0) {
      html = '<p class="muted">該当する用語が見つかりませんでした。</p>';
    }
    root.innerHTML = html;
    root.querySelectorAll('.glossary-item').forEach((el) => {
      el.addEventListener('click', () => openModal(decodeURIComponent(el.dataset.term)));
    });
  }

  function openModal(termName) {
    const t = TERM_MAP.get(termName);
    if (!t) return;
    const modal = document.getElementById('term-modal');
    const body = modal.querySelector('.modal-body');
    const relHtml = (t.related && t.related.length > 0)
      ? `<div class="related"><strong>関連:</strong><br>${t.related.map((r) => `<span class="related-link" data-jump="${encodeURIComponent(r)}">${r}</span>`).join('')}</div>`
      : '';
    const star = t.priority === 'high' ? '<span class="tag note" style="margin-left:6px;">⭐ 優先度高</span>' : '';
    body.innerHTML = `
      <button class="close-btn" type="button" aria-label="閉じる">×</button>
      <span class="tag">${t.categoryName}</span>${star}
      <div class="term" style="margin-top:8px;">${t.term}</div>
      <p style="font-size:14px; color:var(--color-subtext); margin-bottom:12px;">${t.short}</p>
      <p style="font-size:15px;">${t.long}</p>
      ${relHtml}
    `;
    modal.classList.add('is-open');
    body.querySelector('.close-btn').addEventListener('click', closeModal);
    body.querySelectorAll('.related-link').forEach((el) => {
      el.addEventListener('click', () => openModal(decodeURIComponent(el.dataset.jump)));
    });
  }
  function closeModal() {
    document.getElementById('term-modal').classList.remove('is-open');
  }

  function renderAll() {
    renderFilters();
    renderGlossary();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('search');
    search.addEventListener('input', (e) => {
      state.keyword = e.target.value.trim();
      renderGlossary();
    });
    document.getElementById('term-modal').addEventListener('click', (e) => {
      if (e.target.id === 'term-modal') closeModal();
    });
    renderAll();
  });
})();
