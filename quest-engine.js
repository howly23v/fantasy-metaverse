// quest-engine.js — Fantasy Metaverse Quest Generation Engine
'use strict';

// =====================================================================
// QUEST TEMPLATES
// =====================================================================
const QUEST_TEMPLATES = [
  {
    id: 'gather',
    titleFn: (npc, item) => `【${npc.name}の依頼】${item}を集めてほしい`,
    descFn:  (npc, item, qty) =>
      `${npc.name}が言った：「${item}が${qty}個必要なんです。東の森か川沿いで見つかるかも。`,
    reward: () => Math.floor(Math.random() * 80 + 30) + 'G',
    items: ['薬草','キノコ','光る石','古い硬貨','羽毛','果実','木の実','魔法の砂'],
  },
  {
    id: 'escort',
    titleFn: (npc) => `【緊急】${npc.name}の護衛依頼`,
    descFn:  (npc) =>
      `${npc.name}が言った：「ダンジョン付近に怪しい気配があって…一緒に来てもらえますか？」`,
    reward: () => Math.floor(Math.random() * 120 + 60) + 'G',
    items: [],
  },
  {
    id: 'investigate',
    titleFn: (npc, place) => `${place}の異変を調べてほしい`,
    descFn:  (npc, place) =>
      `${npc.name}が言った：「${place}が最近おかしくて…原因を調べてもらえると助かります」`,
    reward: () => Math.floor(Math.random() * 100 + 50) + 'G',
    items: ['北の森','南の荒地','廃墟','川の上流','山の洞窟'],
  },
  {
    id: 'delivery',
    titleFn: (npc, target) => `${target}への荷物を届けてほしい`,
    descFn:  (npc, target) =>
      `${npc.name}が言った：「これを${target}に届けてほしい。急ぎの用件なんです」`,
    reward: () => Math.floor(Math.random() * 60 + 20) + 'G',
    items: ['アリア団長','エレナ','村の長老','旅の詩人'],
  },
  {
    id: 'crisis',
    titleFn: (npc) => `【緊急クエスト】村に危機！`,
    descFn:  (npc) =>
      `${npc.name}が血相を変えて言った：「大変です！モンスターの群れが村に向かっています！今すぐ対処してください！」`,
    reward: () => Math.floor(Math.random() * 200 + 100) + 'G + 村の評判UP',
    items: [],
  },
];

// =====================================================================
// QUEST GENERATOR
// =====================================================================
class QuestEngine {
  constructor() {
    this.activeQuests  = [];
    this.completedIds  = new Set();
    this.lastGenTime   = 0;
    this.genIntervalMs = 120000; // Generate new quest every 2 min
  }

  /** Pick a random element from an array */
  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Generate a quest driven by NPC context.
   * @param {Array} npcs - array of NPC data objects
   * @returns {Object} quest object
   */
  generateQuest(npcs) {
    const npc      = this._pick(npcs);
    const template = this._pick(QUEST_TEMPLATES);
    const item     = this._pick(template.items.length ? template.items : ['謎の品物']);
    const qty      = Math.floor(Math.random() * 4 + 2);

    const quest = {
      id:          `quest_${Date.now()}`,
      templateId:  template.id,
      title:       template.titleFn(npc, item, qty),
      description: template.descFn(npc, item, qty),
      reward:      template.reward(),
      npcId:       npc.id,
      npcName:     npc.name,
      item,
      qty,
      progress:    0,
      status:      'active',  // active | completed | failed
      createdAt:   Date.now(),
      // Random urgency flavour
      urgency:     this._pick(['普通','急ぎ','超緊急','いつでも良い']),
    };

    this.activeQuests.push(quest);
    console.log('[QuestEngine] Generated:', quest.title);
    return quest;
  }

  /** Periodically spawn a new quest if time has elapsed */
  tick(now, npcs) {
    if (now - this.lastGenTime > this.genIntervalMs && this.activeQuests.length < 3) {
      this.lastGenTime = now;
      return this.generateQuest(npcs);
    }
    return null;
  }

  completeQuest(questId) {
    const q = this.activeQuests.find(q => q.id === questId);
    if (q) {
      q.status = 'completed';
      this.completedIds.add(questId);
      this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
      return q;
    }
    return null;
  }

  getActive() { return this.activeQuests; }

  /** Build a short context string for the Claude prompt */
  getQuestContext() {
    if (!this.activeQuests.length) return 'アクティブなクエストはありません。';
    return this.activeQuests
      .map(q => `・${q.title}（依頼者：${q.npcName}、報酬：${q.reward}）`)
      .join('\n');
  }
}
