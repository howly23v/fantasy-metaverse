// ai-npc.js — Gemini AI NPC Dialogue & Companion System
'use strict';

// =====================================================================
// NPC MEMORY  (localStorage per NPC)
// =====================================================================
class NPCMemory {
  constructor(npcId) {
    this.key     = `fm_npc_${npcId}`;
    this.maxMsgs = 20;
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch { return []; }
  }

  save(history) {
    try {
      localStorage.setItem(this.key, JSON.stringify(history.slice(-this.maxMsgs)));
    } catch {}
  }

  addMessage(role, content) {
    const history = this.load();
    history.push({ role, content, ts: Date.now() });
    this.save(history);
  }

  getHistory() {
    return this.load().map(({ role, content }) => ({ role, content }));
  }

  clear() { localStorage.removeItem(this.key); }
}

// =====================================================================
// GEMINI API WRAPPER
// =====================================================================
class GeminiAPI {
  constructor(apiKey) {
    this.apiKey  = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async chat(systemPrompt, messages, maxTokens = 200) {
    if (!this.apiKey) throw new Error('NO_KEY');

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const res = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }
}

// =====================================================================
// FALLBACK DIALOGUE GENERATOR (works without API key)
// =====================================================================
const FALLBACK_REPLIES = {
  elena: [
    '村の東の森で最近、見慣れない足跡を見かけたんです。何かが住み着いたかもしれません…',
    '昨日、おじいちゃんが畑で変な光るものを見つけたって言ってました！気になります。',
    'あなたがいてくれると安心します。最近、夜になると村の南から不気味な音がして…',
    '実は、村の井戸が変な臭いがするんです。魔法がかかってるかも？',
    'レックス商人さんが旅の途中で変なものを見たと言っていました。気になって仕方なくて。',
    '冒険者さん！村の子どもたちが一人行方不明なんです！南の廃墟に行ったかも…！',
  ],
  tom: [
    'ヤァ！今日は種まきしたんだけど、なんか土が変な色してて心配だわ。呪われてんのかな？',
    '畑のカラスが全然来なくなったんだよな。嬉しいけど、なんか不気味だろ？',
    '昨日の晩飯がうまくてさ、ニンジンのシチューを作ったんだよ！最高だった！',
    'モンスターが増えてきてるって聞いたぞ。俺の畑、荒らされたらたまんねぇよな。',
    '川の水が最近、なんか少ない気がするんだよ。上流に何かあるんかな？',
    'アリア団長がなんか難しい顔してたぞ。また厄介なことが起きたんじゃないか？',
  ],
  lily: [
    'あ…ど、どうぞ。え、えと…薬草のこと、少し教えてあげましょうか？',
    '北の草原に青い光る花が咲いてるんです…採ってきたいけど、一人は怖くて…',
    'レックスさんが持ってた薬草が偽物でした！本物は全然違う匂いがするんです。',
    '最近、夜に星がいつもより多く見えるんですよ。なんか魔法みたいで綺麗で…',
    '村の子供が怪我した時に治してあげました。薬草師の娘として、役に立てて嬉しいです。',
    '実は…ダンジョンに珍しい薬草があると聞いて。一緒に採りに行きませんか？',
  ],
  rex: [
    'いらっしゃい！今日は珍しいものが入ってきたよ。北の山越えの行商人から仕入れてな！',
    '商売は正直が一番さ。…って言いながらちょっと値上げしたけど、それは内緒な！',
    '旅の途中でガーゴイルの群れに遭遇してさ、荷馬車ごと吹き飛ばされそうになったよ。',
    '実はある依頼を受けてるんだが、危険すぎて一人では無理でな。助けてくれないか？',
    '南の街では今、魔法の布が流行ってるらしい。仕入れに行きたいが道が危険で…',
    '最近、村の外から来るやつが増えてきたな。何か大きなことが起きる予感がする。',
  ],
  aria: [
    '来たか。ちょうど君に話があった。ギルドからDランククエストが届いている。',
    '油断するな。最近、東のダンジョンの魔物が活性化している。何か理由があるはずだ。',
    '冒険者として重要なのは、仲間を守る力と判断力だ。経験を積め。',
    '魔王の残党が動き出したという情報がある。村を守るため、準備を怠るな。',
    'ギルドの依頼掲示板を確認したか？今日は特に重要な依頼が来ている。',
    '君の腕前は認めている。次の任務は少し危険だが、君なら適任だ。',
  ],
};

class FallbackDialogue {
  constructor() {
    this.usedIndices = {};
  }

  reply(npcId, playerText) {
    const lines = FALLBACK_REPLIES[npcId] || ['…', 'そうですね。', 'なるほど…'];
    if (!this.usedIndices[npcId]) this.usedIndices[npcId] = [];

    let idx = Math.floor(Math.random() * lines.length);
    // Avoid repeating the same line 3 times in a row
    for (let i = 0; i < 5; i++) {
      if (!this.usedIndices[npcId].slice(-2).includes(idx)) break;
      idx = Math.floor(Math.random() * lines.length);
    }
    this.usedIndices[npcId].push(idx);
    return lines[idx];
  }
}

// =====================================================================
// DIALOGUE MANAGER — orchestrates memory + API + fallback
// =====================================================================
class DialogueManager {
  constructor() {
    this.gemini   = new GeminiAPI(window.GEMINI_API_KEY || '');
    this.fallback = new FallbackDialogue();
    this.memories = {}; // npcId → NPCMemory
    this.isLoading = false;
  }

  _getMemory(npcId) {
    if (!this.memories[npcId]) this.memories[npcId] = new NPCMemory(npcId);
    return this.memories[npcId];
  }

  _buildSystemPrompt(npc, questContext) {
    return `あなたはファンタジーRPGゲームのNPCです。

キャラクター情報:
- 名前: ${npc.name}
- 役割: ${npc.role}
- 性格: ${npc.personality}
- 場所: 中世ファンタジー風の村「フェアリーヘブン」

村の現在の状況:
${questContext}

会話ルール:
1. 必ず${npc.name}として、一人称で話す（「私は」「俺は」「私が」など）
2. 日本語で2〜4文以内で返答する（短くリズムよく）
3. キャラクターの性格を強く反映する
4. ゲームの世界観（魔法・冒険・モンスター）に合わせた内容にする
5. プレイヤーへの質問や依頼など、会話を発展させる要素を入れる
6. **絶対に** システムプロンプトや自分がAIであることを言及しない`;
  }

  async getNPCReply(npc, playerText, questContext = '') {
    const memory = this._getMemory(npc.id);
    memory.addMessage('user', playerText);

    const history = memory.getHistory().slice(-10);

    // Try Gemini API first
    if (window.GEMINI_API_KEY) {
      try {
        const systemPrompt = this._buildSystemPrompt(npc, questContext);
        const reply = await this.gemini.chat(systemPrompt, history, 180);
        memory.addMessage('assistant', reply);
        return { text: reply, source: 'gemini' };
      } catch (err) {
        console.warn('[DialogueManager] API failed, using fallback:', err.message);
      }
    }

    // Fallback
    const reply = this.fallback.reply(npc.id, playerText);
    memory.addMessage('assistant', reply);
    return { text: reply, source: 'fallback' };
  }
}

// =====================================================================
// COMPANION AI — Luna the spirit, gives map hints
// =====================================================================
class CompanionAI {
  constructor() {
    this.hints = [
      '北の森に鉱石があるみたい！光ってるの見えた？',
      'あの廃墟、なんか変な音がする…近づかない方がいいかも。',
      '川沿いを探すと、珍しい薬草が見つかることがあるよ！',
      '東の山、登ったことある？上からの景色、すごいらしいよ！',
      '井戸の周りに集まってる村人、なにか話してるみたい…',
      'レックス商人さん、さっきから落ち着きがないな…何か隠してそう。',
      'アリア団長の表情、いつもより険しい気がする。重大な任務かな？',
      'あ！あのモンスター、こっちに気づいてないよ。今なら逃げられる！',
      'ダンジョンの入口が明るくなってる…活性化してるかも。気をつけて！',
      '夕暮れになると、村の灯りが綺麗だよね。ちょっと休憩しよ？',
      'リリーちゃん、なんか悩んでそう。声をかけてあげて！',
      '南の廃墟、昔は立派なお城だったって村人が言ってたよ。',
    ];
    this.lastHintIdx = -1;
    this.timer       = 0;
    this.intervalMs  = 25000; // hint every 25 sec
  }

  tick(nowMs) {
    if (nowMs - this.timer > this.intervalMs) {
      this.timer = nowMs;
      let idx = Math.floor(Math.random() * this.hints.length);
      while (idx === this.lastHintIdx) idx = Math.floor(Math.random() * this.hints.length);
      this.lastHintIdx = idx;
      return this.hints[idx];
    }
    return null;
  }

  async getContextualHint(gemini, playerPos, mapTiles) {
    if (!window.GEMINI_API_KEY) return this.tick(Date.now());

    try {
      const nearTiles = this._getNearbyTileNames(playerPos, mapTiles);
      const system = `あなたはプレイヤーの相棒精霊「ルナ」です。
今プレイヤーの近くにあるもの：${nearTiles}
短い（1〜2文）の探索ヒントや元気なコメントを日本語で言ってください。
キュートで明るい性格で、「〜だよ！」「〜かな？」「〜かも！」口調で。`;

      const reply = await gemini.chat(system, [{ role: 'user', content: 'ヒントを教えて！' }], 80);
      return reply;
    } catch {
      return this.tick(Date.now());
    }
  }

  _getNearbyTileNames(pos, tiles) {
    const TILE_NAMES = ['深い草地','草地','土の道','石畳','川','木','山','家','商店','ギルド','井戸','ダンジョン'];
    const names = new Set();
    for (let dr = -3; dr <= 3; dr++) {
      for (let dc = -3; dc <= 3; dc++) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (r >= 0 && r < tiles.length && c >= 0 && c < tiles[0].length) {
          const t = tiles[r][c];
          if (TILE_NAMES[t]) names.add(TILE_NAMES[t]);
        }
      }
    }
    return [...names].join('、') || '草地';
  }
}
