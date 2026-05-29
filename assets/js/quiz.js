// Quiz logic — embedded questions, localStorage results.
(function () {
  const QUIZ = [
    {
      q: '不動産仕入れの本質を一番うまく表しているのは?',
      choices: [
        '完成物件を販売する仕事',
        '事業に使う土地・建物を見つけて手に入れる仕事',
        '物件を仲介して手数料を得る仕事',
        '不動産を担保にローンを組む仕事',
      ],
      ans: 1,
      explain: '製造業の「原料調達」に相当する活動。事業の素材となる土地・建物を、出口戦略に合わせて見つけてくる仕事。',
    },
    {
      q: '「オフマーケット」とは何を指す?',
      choices: [
        '市場価格より高すぎて売れない物件',
        '海外市場でしか取引されない物件',
        '市場（仲介・レインズ）に出てこない物件',
        '違法物件のこと',
      ],
      ans: 2,
      explain: '所有者が「売る」と決断する前段階の物件群。競合は少ないが、所有者の特定とアプローチが難しい領域。',
    },
    {
      q: '仕入れチャネルのうち「本流」で混雑しているのはどれ?',
      choices: [
        '仲介経由・業者間流通（レインズ）',
        '地権者直接アプローチ',
        '紹介・ネットワーク',
        '飛び込み営業',
      ],
      ans: 0,
      explain: '仲介経由とレインズが業界の本流。同じ情報を多くの会社が取り合うので、価格競争になりやすい。',
    },
    {
      q: '相続税路線価は公示地価のおよそ何%?',
      choices: ['50%程度', '70%程度', '80%程度', '100%同じ'],
      ans: 2,
      explain: '相続税路線価は公示地価の概ね80%、固定資産税路線価は概ね70%。',
    },
    {
      q: '業界平均のDM返信率と、WHEREのAI手書き風DMの返信率の比は?',
      choices: ['2倍', '10倍', '約50倍', '同程度'],
      ans: 2,
      explain: '業界平均 0.02% に対して、WHEREのAI手書き風DMは約1%（およそ50倍）。',
    },
    {
      q: 'WHEREの3つのコア価値に含まれないものは?',
      choices: [
        'オフマーケット用地への直接アクセス基盤',
        '地権者交渉基盤の短期構築',
        '組織知としての地権者DB',
        '不動産売買仲介手数料の代行徴収',
      ],
      ans: 3,
      explain: 'WHEREは仲介ビジネスではない。市場前用地の検出・地権者直接交渉・組織への蓄積、の3つが核。',
    },
    {
      q: '業界の構造課題「属人化」の典型的な症状はどれ?',
      choices: [
        '物件価格が公示地価と乖離する',
        '担当者が異動・退職すると地権者ネットワークが消える',
        '仲介手数料が高騰する',
        '建築費が予算をオーバーする',
      ],
      ans: 1,
      explain: '地縁ビジネスゆえ、人＝資産の構造から抜けられない。組織にナレッジが残らないと、新任担当者が一から関係構築せざるを得ない。',
    },
    {
      q: '「容積率」が指すものは?',
      choices: [
        '敷地の境界からの後退距離',
        '敷地に対する建築面積の比率',
        '敷地に対する延床面積の比率',
        '建物の最大高さ',
      ],
      ans: 2,
      explain: '容積率＝延床面積/敷地面積。建ぺい率（建築面積/敷地面積）と混同しがちなので要注意。',
    },
    {
      q: 'マンデベが特に重視する仕入れ条件は?',
      choices: [
        '駅遠でも安く広い土地',
        '駅近・容積率が高い・商業地域',
        '山林や農地',
        '築古の戸建',
      ],
      ans: 1,
      explain: 'マンション分譲は容積率と立地で事業性が決まる。500坪以上・駅近・容積率高めが定番条件。',
    },
    {
      q: 'WHEREが標榜する事業領域として正しい表現は?',
      choices: [
        '不動産仲介テック（Brokerage Tech）',
        '建築テック（Con Tech）',
        '取引テック（Deal Tech）',
        '管理テック（Property Tech）',
      ],
      ans: 2,
      explain: '「Deal Tech」── 不動産取引のテクノロジー化。仕入れの非マーケット側をテクノロジーで開拓する立ち位置。',
    },
    {
      q: '隣接地の所有者を手早く・安く確認したいときに最適な書類は?',
      choices: [
        '隣地の登記簿謄本（登記事項証明書）',
        '隣地要約書（登記事項要約書）',
        '閉鎖謄本',
        '旧土地台帳',
      ],
      ans: 1,
      explain: '登記事項要約書は認証文・公印なしで証明力こそないが、その分安く早く取得できる。「誰が持っているか」だけ先に知りたい初期確認に最適。証明が必要な場面では謄本（登記事項証明書）を取り直す。',
    },
    {
      q: '私道に接する土地の再建築可否を判定するうえで、最も重要な書類は?',
      choices: [
        '道路台帳',
        '位置指定道路図',
        '旧土地台帳',
        '商業登記簿',
      ],
      ans: 1,
      explain: '位置指定道路図は、私道のうち建築基準法42条1項5号の道路位置指定を受けた私道の指定図面。私道接道地の再建築可否の核心資料。道路台帳は公道のみが対象なので私道の判定には使えない。',
    },
    {
      q: '現行のコンピュータ謄本に載っていない、コンピュータ化前の古い抵当権を確認するには?',
      choices: [
        '隣地要約書',
        '道路種別図',
        '移記閉鎖謄本',
        '境界確定図',
      ],
      ans: 2,
      explain: '紙（ブック）→コンピュータ化に伴う移記の際、抹消済みの古い権利は移記されないことが多い。これらは「移記閉鎖謄本」にのみ残るため、長期の権利履歴を要する相続・訴訟調査では必ず併せて確認する。',
    },
  ];

  const STORAGE_KEY = 'quiz:result:v1';

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function render() {
    const root = document.getElementById('quiz-root');
    if (!root) return;
    root.innerHTML = '';
    const answers = new Array(QUIZ.length).fill(null);

    QUIZ.forEach((item, idx) => {
      const card = el('div', 'quiz-card reveal is-visible');
      card.innerHTML = `<div class="q">Q${idx + 1}. ${item.q}</div>`;
      const choices = el('div', 'choices');
      item.choices.forEach((c, ci) => {
        const btn = el('button', 'choice', `<strong>${String.fromCharCode(65 + ci)}.</strong> ${c}`);
        btn.type = 'button';
        btn.addEventListener('click', () => {
          if (answers[idx] !== null) return;
          answers[idx] = ci;
          const isCorrect = ci === item.ans;
          btn.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
          if (!isCorrect) {
            const correctBtn = choices.children[item.ans];
            if (correctBtn) correctBtn.classList.add('is-correct');
          }
          [...choices.children].forEach((c) => { c.disabled = true; });
          explain.classList.add('is-open');
          updateResult();
        });
        choices.appendChild(btn);
      });
      card.appendChild(choices);
      const explain = el('div', 'explain', `<strong>💡 解説:</strong> ${item.explain}`);
      card.appendChild(explain);
      root.appendChild(card);
    });

    const resultBox = el('div', 'quiz-result', `
      <div class="score"><span id="score-num">0</span> / ${QUIZ.length}</div>
      <p id="score-msg" style="margin-top:8px;">問題を解いて、理解度を測ろう。</p>
      <button id="reset-btn" type="button" style="margin-top:12px; padding:8px 18px; background:#fff; color:var(--color-main); border-radius:999px; font-weight:700;">🔄 もう一度</button>
    `);
    root.appendChild(resultBox);

    function updateResult() {
      const done = answers.filter((a) => a !== null).length;
      const correct = answers.reduce((acc, a, i) => acc + (a === QUIZ[i].ans ? 1 : 0), 0);
      document.getElementById('score-num').textContent = correct;
      const msg = document.getElementById('score-msg');
      if (done < QUIZ.length) {
        msg.textContent = `回答済み: ${done} / ${QUIZ.length}`;
      } else {
        const pct = Math.round((correct / QUIZ.length) * 100);
        if (pct === 100) msg.innerHTML = '🎉 全問正解! 仕入れ理解パーフェクト。';
        else if (pct >= 80) msg.innerHTML = '🌟 素晴らしい理解度。あと一歩で完璧!';
        else if (pct >= 60) msg.innerHTML = '👍 基本は押さえています。もう一周復習を。';
        else msg.innerHTML = '📖 該当章をもう一度ゆっくり読んでみよう。';
        // Persist result
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            correct, total: QUIZ.length, percent: pct, at: new Date().toISOString(),
          }));
        } catch (_) {}
      }
    }

    document.getElementById('reset-btn').addEventListener('click', () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      render();
    });

    // Restore last result message
    try {
      const last = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (last) {
        document.getElementById('score-num').textContent = `${last.correct}`;
        document.getElementById('score-msg').innerHTML = `前回スコア: ${last.percent}% (${new Date(last.at).toLocaleString('ja-JP')})`;
      }
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', render);
})();
