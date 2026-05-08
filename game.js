// game.js — Fantasy Metaverse · Phaser 3 Isometric RPG
// Procedural graphics, player movement, NPC interaction, Claude AI
'use strict';

// =====================================================================
// GLOBAL CONSTANTS
// =====================================================================
const TILE_W   = 64;
const TILE_H   = 32;
const EXTRA_H  = 88;   // canvas height above tile (for buildings/trees)
const MAP_COLS = 20;
const MAP_ROWS = 20;
const ANCHOR_Y = (EXTRA_H + TILE_H / 2) / (TILE_H + EXTRA_H); // sprite origin Y

// =====================================================================
// MAP DATA (inline — works from file:// without CORS)
// =====================================================================
const MAP_TILES = [
  [6,6,6,6,6,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4],
  [6,6,6,6,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4],
  [6,6,6,5,5,5,5,1,1,1,1,1,5,5,5,5,4,4,4,4],
  [6,6,5,5,5,5,1,1,1,1,1,1,1,5,5,5,5,4,4,4],
  [6,5,5,5,5,1,1,1,1,1,1,1,1,1,5,5,5,4,4,4],
  [5,5,5,5,1,1,2,2,2,2,2,2,2,1,1,5,5,5,4,4],
  [5,5,5,1,1,2,2,1,1,1,1,1,2,2,1,1,5,5,4,4],
  [5,5,1,1,2,2,1,1,7,3,3,7,1,1,2,2,5,5,4,4],
  [5,1,1,2,2,1,7,1,1,3,3,1,1,7,1,2,2,5,4,4],
  [5,1,2,2,1,1,8,3,3,3,3,3,3,9,1,1,2,5,4,4],
  [5,1,2,1,1,3,3,3,10,3,3,10,3,3,3,1,2,4,4,4],
  [5,1,2,2,1,7,3,3,3,3,3,3,3,3,7,1,2,5,4,4],
  [5,1,1,2,2,1,1,3,3,1,1,3,3,1,1,2,2,5,4,4],
  [5,5,1,1,2,2,1,1,7,3,3,7,1,1,2,2,5,5,4,4],
  [5,5,5,1,1,2,2,1,1,1,1,1,2,2,1,5,5,5,4,4],
  [5,5,5,5,1,1,2,2,2,2,2,11,2,1,1,5,5,5,4,4],
  [6,5,5,5,5,1,1,1,1,1,1,1,1,1,5,5,5,4,4,4],
  [6,6,5,5,5,5,1,1,1,1,1,1,5,5,5,5,4,4,4,4],
  [6,6,6,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,4],
  [6,6,6,6,5,5,5,5,5,5,5,5,5,5,4,4,4,4,4,4],
];

const NPC_DATA = [
  { id:'elena', name:'エレナ',     col:10, row:7,  headCol:'#f4a87c', bodyCol:'#7050a0',
    role:'村の長老の孫娘',
    greeting:'あ、冒険者さん！良かった会えて。実は村のことで心配事があって…',
    personality:'明るく親切だが少し心配性。村人をとても気にかけている。' },
  { id:'tom',   name:'トム',       col:7,  row:11, headCol:'#e0c090', bodyCol:'#3a6020',
    role:'農夫の息子',
    greeting:'よう！畑の調子はまあまあだけど、最近モンスターが増えてきてな…',
    personality:'素朴で働き者。農業と食べ物が大好き。少しおっちょこちょい。' },
  { id:'lily',  name:'リリー',     col:12, row:12, headCol:'#f8a8c0', bodyCol:'#8a3050',
    role:'薬草師の娘',
    greeting:'あ…冒険者さん。よ、よかったら…薬草のことで相談があるんですが…',
    personality:'内気で話し下手だが薬草の知識は豊富。実はとても勇敢。' },
  { id:'rex',   name:'レックス',   col:6,  row:9,  headCol:'#c8a040', bodyCol:'#6030a0',
    role:'旅の商人',
    greeting:'いらっしゃい！今日は珍しいものが入ってきたよ！…実は困ったことがあってね。',
    personality:'明るいセールスマン。お金に細かいが義理堅い。旅で見聞が広い。' },
  { id:'aria',  name:'アリア団長', col:13, row:9,  headCol:'#d0c0a0', bodyCol:'#a02010',
    role:'冒険者ギルド団長',
    greeting:'よく来た、冒険者よ。ちょうど緊急依頼が入ったところだ。',
    personality:'威厳があり戦略的。部下を大切にする。弱者への正義感が強い。' },
];

const PLAYER_COL = 10;
const PLAYER_ROW = 10;

// =====================================================================
// TILE VISUAL DEFINITIONS
// =====================================================================
const TILE_DEF = [
  // 0: dark grass
  { name:'深い草地', walk:true,  flat:true,  top:'#4a8f2a' },
  // 1: grass
  { name:'草地',     walk:true,  flat:true,  top:'#6cb33f' },
  // 2: dirt path
  { name:'土の道',   walk:true,  flat:true,  top:'#c8a076' },
  // 3: stone path
  { name:'石畳',     walk:true,  flat:true,  top:'#b0b0a0' },
  // 4: water
  { name:'川',       walk:false, flat:true,  top:'#3a80d9', water:true },
  // 5: tree
  { name:'森',       walk:false, flat:true,  top:'#5aa82e', tree:true },
  // 6: mountain
  { name:'山',       walk:false, cube:true,  cubeH:64, top:'#8a8a8a', left:'#5a5a5a', right:'#484848',
    wallTop:'#9a9a9a', wallL:'#626262', wallR:'#505050' },
  // 7: house
  { name:'家',       walk:false, cube:true,  cubeH:48,
    wallTop:'#e8d4a0', wallL:'#b8a478', wallR:'#9a8060',
    roof:'#c04040', hasRoof:true },
  // 8: shop
  { name:'商店',     walk:false, cube:true,  cubeH:42,
    wallTop:'#d4b480', wallL:'#a08050', wallR:'#887040',
    roof:'#804820', hasRoof:true },
  // 9: guild_hall
  { name:'ギルド',   walk:false, cube:true,  cubeH:60,
    wallTop:'#dce0f0', wallL:'#a0a8c8', wallR:'#8090b0',
    roof:'#202890', hasRoof:true },
  // 10: well
  { name:'井戸',     walk:true,  flat:true,  top:'#b0b0a0', well:true },
  // 11: dungeon
  { name:'ダンジョン', walk:false, cube:true, cubeH:36,
    wallTop:'#3a2a4a', wallL:'#2a1a3a', wallR:'#1a0a2a',
    roof:'#0a0015', hasRoof:false, isDungeon:true },
];

// =====================================================================
// CANVAS TILE TEXTURE FACTORY
// =====================================================================
function buildTileCanvas(typeId) {
  const def = TILE_DEF[typeId];
  const TW  = TILE_W;
  const TH  = TILE_H;
  const EH  = EXTRA_H;
  const canvas = document.createElement('canvas');
  canvas.width  = TW;
  canvas.height = TH + EH;
  const ctx = canvas.getContext('2d');
  const y0  = EH; // tile's top-diamond-vertex y in canvas

  if (def.cube) {
    const ch = def.cubeH;

    // ── Left wall ───────────────────────────────────────────────────
    const grad_l = ctx.createLinearGradient(0, y0 + TH/2 - ch, TW/2, y0 + TH);
    grad_l.addColorStop(0, def.wallL || '#666');
    grad_l.addColorStop(1, _darken(def.wallL || '#666', 30));
    ctx.fillStyle = grad_l;
    ctx.beginPath();
    ctx.moveTo(0,     y0 + TH/2 - ch);
    ctx.lineTo(TW/2,  y0 + TH   - ch);
    ctx.lineTo(TW/2,  y0 + TH);
    ctx.lineTo(0,     y0 + TH/2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // ── Right wall ──────────────────────────────────────────────────
    const grad_r = ctx.createLinearGradient(TW/2, y0 + TH - ch, TW, y0 + TH/2);
    grad_r.addColorStop(0, def.wallR || '#555');
    grad_r.addColorStop(1, _darken(def.wallR || '#555', 30));
    ctx.fillStyle = grad_r;
    ctx.beginPath();
    ctx.moveTo(TW/2,  y0 + TH   - ch);
    ctx.lineTo(TW,    y0 + TH/2 - ch);
    ctx.lineTo(TW,    y0 + TH/2);
    ctx.lineTo(TW/2,  y0 + TH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.stroke();

    // ── Top face ────────────────────────────────────────────────────
    const grad_t = ctx.createLinearGradient(0, y0 + TH/2 - ch, TW, y0 + TH/2 - ch);
    grad_t.addColorStop(0, def.wallTop || '#aaa');
    grad_t.addColorStop(1, _lighten(def.wallTop || '#aaa', 15));
    ctx.fillStyle = grad_t;
    ctx.beginPath();
    ctx.moveTo(TW/2,  y0       - ch);
    ctx.lineTo(TW,    y0 + TH/2 - ch);
    ctx.lineTo(TW/2,  y0 + TH  - ch);
    ctx.lineTo(0,     y0 + TH/2 - ch);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.stroke();

    // ── Roof / Peak (for buildings) ─────────────────────────────────
    if (def.hasRoof) {
      const rh = 18;
      // Left slope
      ctx.fillStyle = def.roof || '#800';
      ctx.beginPath();
      ctx.moveTo(TW/2, y0 - ch - rh);
      ctx.lineTo(0,    y0 + TH/2 - ch);
      ctx.lineTo(TW/2, y0 + TH   - ch);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Right slope
      ctx.fillStyle = _darken(def.roof || '#800', 25);
      ctx.beginPath();
      ctx.moveTo(TW/2, y0 - ch - rh);
      ctx.lineTo(TW,   y0 + TH/2 - ch);
      ctx.lineTo(TW/2, y0 + TH   - ch);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Window glow on left wall
      ctx.fillStyle = 'rgba(255,220,100,0.75)';
      ctx.beginPath();
      ctx.rect(10, y0 + TH/2 - ch + 6, 9, 7);
      ctx.fill();
      // Door on left wall
      ctx.fillStyle = '#6b3a1f';
      const dx = 24, dw = 12, dh = 17;
      ctx.beginPath();
      ctx.rect(dx, y0 + TH - ch - dh + 2, dw, dh - 2);
      ctx.fill();
    }

    if (def.isDungeon) {
      // Eerie purple aura on top face
      const aura = ctx.createRadialGradient(TW/2, y0 + TH/2 - ch, 2, TW/2, y0 + TH/2 - ch, 24);
      aura.addColorStop(0, 'rgba(160,50,255,0.7)');
      aura.addColorStop(1, 'rgba(60,0,120,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.moveTo(TW/2, y0 - ch);
      ctx.lineTo(TW,   y0 + TH/2 - ch);
      ctx.lineTo(TW/2, y0 + TH  - ch);
      ctx.lineTo(0,    y0 + TH/2 - ch);
      ctx.closePath();
      ctx.fill();
    }

  } else {
    // ── Flat tile ───────────────────────────────────────────────────
    const grad = ctx.createLinearGradient(0, y0, TW, y0 + TH);
    grad.addColorStop(0, _lighten(def.top, 10));
    grad.addColorStop(1, _darken(def.top, 10));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(TW/2, y0);
    ctx.lineTo(TW,   y0 + TH/2);
    ctx.lineTo(TW/2, y0 + TH);
    ctx.lineTo(0,    y0 + TH/2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Subtle top-left highlight
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.moveTo(TW/2, y0);
    ctx.lineTo(0,    y0 + TH/2);
    ctx.lineTo(TW/2, y0 + TH);
    ctx.closePath();
    ctx.fill();

    if (def.water) {
      // Shimmer lines
      ctx.strokeStyle = 'rgba(180,230,255,0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(TW/2 - 12 + i * 14, y0 + TH/2 - 2 + i * 4);
        ctx.lineTo(TW/2 + 12 + i * 6,  y0 + TH/2 - 2 + i * 4);
        ctx.stroke();
      }
    }

    if (def.tree) {
      // Trunk
      ctx.fillStyle = '#7a4a20';
      ctx.beginPath();
      ctx.rect(TW/2 - 3, y0 - 4, 6, 14);
      ctx.fill();
      // Three-layer crown for depth
      const layers = [
        { ox:8,  oy:-14, r:11, c:'#1e6824' },
        { ox:-8, oy:-18, r:11, c:'#1e6824' },
        { ox:0,  oy:-28, r:15, c:'#27922e' },
        { ox:0,  oy:-26, r:12, c:'#34b83c' },
      ];
      layers.forEach(l => {
        ctx.fillStyle = l.c;
        ctx.beginPath();
        ctx.arc(TW/2 + l.ox, y0 + l.oy, l.r, 0, Math.PI * 2);
        ctx.fill();
      });
      // Highlight
      ctx.fillStyle = 'rgba(160,255,120,0.25)';
      ctx.beginPath();
      ctx.arc(TW/2 - 4, y0 - 30, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (def.well) {
      const wx = TW/2, wy = y0 + TH/2 - 4;
      // Stone base
      ctx.fillStyle = '#909088';
      ctx.beginPath();
      ctx.ellipse(wx, wy + 2, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Walls
      ctx.strokeStyle = '#707068';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(wx, wy - 8, 13, 6, 0, Math.PI, 0, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wx - 13, wy + 2); ctx.lineTo(wx - 13, wy - 8);
      ctx.moveTo(wx + 13, wy + 2); ctx.lineTo(wx + 13, wy - 8);
      ctx.stroke();
      // Rope
      ctx.strokeStyle = '#c8a060';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wx, wy - 8); ctx.lineTo(wx, wy - 16);
      ctx.stroke();
      // Bucket
      ctx.fillStyle = '#a08040';
      ctx.fillRect(wx - 4, wy - 22, 8, 7);
    }
  }
  return canvas;
}

function _hexToRgb(hex) {
  const c = hex.replace('#','');
  return { r: parseInt(c.slice(0,2),16), g: parseInt(c.slice(2,4),16), b: parseInt(c.slice(4,6),16) };
}
function _darken(hex, amt) {
  if (!hex || !hex.startsWith('#')) return hex;
  const {r,g,b} = _hexToRgb(hex);
  const clamp = v => Math.max(0, Math.min(255, v));
  const h = v => v.toString(16).padStart(2,'0');
  return `#${h(clamp(r-amt))}${h(clamp(g-amt))}${h(clamp(b-amt))}`;
}
function _lighten(hex, amt) {
  return _darken(hex, -amt);
}

// =====================================================================
// CHARACTER CANVAS FACTORY
// =====================================================================
function buildCharCanvas(headCol, bodyCol, shadowCol = 'rgba(0,0,0,0.3)') {
  const cw = 32, ch = 52;
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');

  // Shadow ellipse at base
  ctx.fillStyle = shadowCol;
  ctx.beginPath(); ctx.ellipse(cw/2, ch - 6, 9, 4, 0, 0, Math.PI*2); ctx.fill();

  // Body (torso)
  // Body (use fillRect for compatibility; roundRect is Chrome99+)
  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.rect(cw/2 - 6, ch - 28, 12, 16);
  ctx.fill();
  // Body shading
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.rect(cw/2 + 1, ch - 28, 5, 16);
  ctx.fill();

  // Head
  ctx.fillStyle = headCol;
  ctx.beginPath(); ctx.arc(cw/2, ch - 36, 9, 0, Math.PI*2); ctx.fill();
  // Face highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.arc(cw/2 - 2, ch - 39, 3, 0, Math.PI*2); ctx.fill();

  return canvas;
}

function buildPlayerCanvas() {
  const canvas = buildCharCanvas('#f4a87c', '#2858a0');
  const ctx = canvas.getContext('2d');
  // Helmet / hat brim
  ctx.fillStyle = '#3060b0';
  ctx.fillRect(canvas.width/2 - 10, canvas.height - 47, 20, 5);
  return canvas;
}

function buildNPCIndicator(color) {
  const s = 8;
  const canvas = document.createElement('canvas');
  canvas.width = s*2; canvas.height = s;
  const ctx = canvas.getContext('2d');
  // Small diamond indicator
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(s, 0); ctx.lineTo(s*2, s/2); ctx.lineTo(s, s); ctx.lineTo(0, s/2);
  ctx.closePath(); ctx.fill();
  return canvas;
}

// =====================================================================
// ISO ↔ SCREEN COORDINATE CONVERSIONS
// =====================================================================
function iso2screen(col, row, originX, originY) {
  return {
    x: originX + (col - row) * TILE_W / 2,
    y: originY + (col + row) * TILE_H / 2,
  };
}
function screen2iso(sx, sy, originX, originY) {
  const rx = sx - originX, ry = sy - originY;
  return {
    col: Math.round( rx / TILE_W + ry / TILE_H),
    row: Math.round(-rx / TILE_W + ry / TILE_H),
  };
}
function depthOf(col, row) { return (col + row) * 10; }

// =====================================================================
// MAIN PHASER SCENE
// =====================================================================
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.tileMap      = [];  // {sprite, col, row}
    this.npcObjects   = {};  // id → {sprite, label, bubble, data}
    this.player       = null;
    this.playerCol    = PLAYER_COL;
    this.playerRow    = PLAYER_ROW;
    this.isMoving     = false;
    this.moveTarget   = null;
    this.movePath     = [];
    this.dialogueOpen = false;
    this.activeNPC    = null;
    this.waterTick    = 0;
    this.waterAlt     = false;
    this.originX      = 0;
    this.originY      = 0;
    this.dayTime      = 0;   // 0-1 day cycle
    this.nightOverlay = null;
    this.bubbleTimer  = 0;
    this.bubbleText   = null;
    this.companionBubble = null;
  }

  // ──────────────────────────────────────────────────────────────────
  preload() {
    // Generate all tile textures from Canvas
    TILE_DEF.forEach((_, i) => {
      const c = buildTileCanvas(i);
      this.textures.addCanvas('tile_' + i, c);
    });

    // Player & NPC textures
    this.textures.addCanvas('player_tex', buildPlayerCanvas());
    NPC_DATA.forEach(n => {
      this.textures.addCanvas('npc_' + n.id, buildNPCCanvas(n.headCol, n.bodyCol, n.id));
    });
  }

  // ──────────────────────────────────────────────────────────────────
  create() {
    const worldW = (MAP_COLS + MAP_ROWS) * TILE_W / 2 + 400;
    const worldH = (MAP_COLS + MAP_ROWS) * TILE_H / 2 + 600;
    this.originX = worldW / 2;
    this.originY = 160;

    // Background sky gradient
    this.add.rectangle(0, 0, worldW, worldH, 0x1a0a2e).setOrigin(0);

    // Build isometric map
    this._buildMap();

    // Build entities
    this._buildPlayer();
    this._buildNPCs();

    // Camera follows player
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);

    // Input: click on world
    this.input.on('pointerdown', this._onWorldClick, this);

    // Companion sprite (floating orb)
    this._buildCompanion();

    // Night overlay (transparent rect over entire world)
    this.nightOverlay = this.add.rectangle(worldW/2, worldH/2, worldW, worldH, 0x0000aa, 0)
      .setDepth(5000).setScrollFactor(1);

    // HUD is handled by HTML overlay (see index.html)
    // Signal that game is ready
    this._initAI();

    // Water animation
    this.time.addEvent({ delay: 600, callback: this._animateWater, callbackScope: this, loop: true });

    // Companion hint timer
    this.time.addEvent({ delay: 28000, callback: this._showCompanionHint, callbackScope: this, loop: true });

    console.log('[GameScene] Created. World:', worldW, 'x', worldH);
  }

  // ──────────────────────────────────────────────────────────────────
  update(time, delta) {
    this._updatePlayerMovement(delta);
    this._updateDayCycle(delta);
    this._updateNPCBobble(time);
    this._tickQuestEngine(time);
  }

  // ──────────────────────────────────────────────────────────────────
  // MAP BUILDING
  // ──────────────────────────────────────────────────────────────────
  _buildMap() {
    // Build sorted render order: (col+row) ascending
    const order = [];
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        order.push({ col, row });
      }
    }
    order.sort((a, b) => (a.col + a.row) - (b.col + b.row));

    order.forEach(({ col, row }) => {
      const type = MAP_TILES[row][col];
      const pos  = iso2screen(col, row, this.originX, this.originY);
      const sp   = this.add.image(pos.x, pos.y, 'tile_' + type);
      sp.setOrigin(0.5, ANCHOR_Y);
      sp.setDepth(depthOf(col, row));

      // Store water tiles for animation
      if (type === 4) { sp._isWater = true; sp._wCol = col; sp._wRow = row; }

      this.tileMap.push({ sprite: sp, col, row, type });
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // PLAYER
  // ──────────────────────────────────────────────────────────────────
  _buildPlayer() {
    const pos = iso2screen(this.playerCol, this.playerRow, this.originX, this.originY);
    this.player = this.add.image(pos.x, pos.y, 'player_tex')
      .setOrigin(0.5, 1).setDepth(depthOf(this.playerCol, this.playerRow) + 5);

    // Name tag
    this.playerLabel = this.add.text(pos.x, pos.y - 42, '冒険者', {
      fontSize: '10px', fontFamily: 'sans-serif',
      color: '#ffffffcc', backgroundColor: '#00000055',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1).setDepth(depthOf(this.playerCol, this.playerRow) + 6);

    // Walk indicator (target tile highlight)
    this.walkIndicator = this.add.graphics().setDepth(0);
  }

  // ──────────────────────────────────────────────────────────────────
  // NPCs
  // ──────────────────────────────────────────────────────────────────
  _buildNPCs() {
    NPC_DATA.forEach(npc => {
      const pos = iso2screen(npc.col, npc.row, this.originX, this.originY);
      const sp = this.add.image(pos.x, pos.y, 'npc_' + npc.id)
        .setOrigin(0.5, 1)
        .setDepth(depthOf(npc.col, npc.row) + 5)
        .setInteractive({ useHandCursor: true });

      sp.on('pointerdown', () => this._onNPCClick(npc));
      sp.on('pointerover', () => {
        sp.setTint(0xffffaa);
        this._showTalkPrompt(npc, pos);
      });
      sp.on('pointerout', () => { sp.clearTint(); this._hideTalkPrompt(); });

      // Name label
      const label = this.add.text(pos.x, pos.y - 42, npc.name, {
        fontSize: '11px', fontFamily: 'serif',
        color: '#ffe88a', backgroundColor: '#00000077',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 1).setDepth(depthOf(npc.col, npc.row) + 7);

      // Speech bubble placeholder
      this.npcObjects[npc.id] = { sprite: sp, label, data: npc, origY: pos.y };
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // COMPANION (Luna — floating orb)
  // ──────────────────────────────────────────────────────────────────
  _buildCompanion() {
    const pos = iso2screen(PLAYER_COL - 1, PLAYER_ROW, this.originX, this.originY);
    const g   = this.add.graphics().setDepth(9000);
    // Glow
    g.fillStyle(0x80c8ff, 0.15);
    g.fillCircle(0, 0, 18);
    g.fillStyle(0xa8e0ff, 0.5);
    g.fillCircle(0, 0, 10);
    g.fillStyle(0xe8f8ff, 0.9);
    g.fillCircle(0, 0, 5);
    g.x = pos.x - 24;
    g.y = pos.y - 30;

    this.companionOrb  = g;
    this.companionName = this.add.text(g.x, g.y - 18, 'ルナ', {
      fontSize: '9px', color: '#c8f0ff', backgroundColor: '#00000055',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1).setDepth(9001);

    // Floating tween
    this.tweens.add({
      targets: [this.companionOrb, this.companionName],
      y: '-=8',
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // AI INIT
  // ──────────────────────────────────────────────────────────────────
  _initAI() {
    this.dialogueManager = new DialogueManager();
    this.questEngine     = new QuestEngine();
    this.companionAI     = new CompanionAI();

    // Generate initial quest
    const q = this.questEngine.generateQuest(NPC_DATA);
    this._updateQuestHUD(q);
  }

  // ──────────────────────────────────────────────────────────────────
  // CLICK HANDLER
  // ──────────────────────────────────────────────────────────────────
  _onWorldClick(pointer) {
    if (this.dialogueOpen) return;

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const { col, row } = screen2iso(worldX, worldY, this.originX, this.originY);

    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return;

    const type = MAP_TILES[row][col];
    const def  = TILE_DEF[type];
    if (!def.walk) {
      this._showFloatingText(worldX, worldY - 20, '通れない！', '#ff9966');
      return;
    }

    this._movePlayerTo(col, row);
  }

  _onNPCClick(npc) {
    const dist = Math.abs(this.playerCol - npc.col) + Math.abs(this.playerRow - npc.row);
    if (dist > 3) {
      this._showFloatingText(
        iso2screen(npc.col, npc.row, this.originX, this.originY).x,
        iso2screen(npc.col, npc.row, this.originX, this.originY).y - 30,
        'もっと近づいて！', '#ffcc66',
      );
      return;
    }
    this._openDialogue(npc);
  }

  // ──────────────────────────────────────────────────────────────────
  // PLAYER MOVEMENT
  // ──────────────────────────────────────────────────────────────────
  _movePlayerTo(targetCol, targetRow) {
    if (this.isMoving) return;

    // Simple Bresenham-ish step-by-step path
    this.movePath = this._buildPath(this.playerCol, this.playerRow, targetCol, targetRow);
    if (this.movePath.length === 0) return;

    // Draw walk indicator
    this._drawWalkIndicator(targetCol, targetRow);

    this._doNextStep();
  }

  _buildPath(sc, sr, tc, tr) {
    const path = [];
    let c = sc, r = sr;
    for (let i = 0; i < 30; i++) {
      if (c === tc && r === tr) break;
      const dc = tc - c, dr = tr - r;
      if (Math.abs(dc) >= Math.abs(dr)) { c += Math.sign(dc); }
      else                              { r += Math.sign(dr); }
      if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) break;
      const t = MAP_TILES[r][c];
      if (!TILE_DEF[t].walk) break;
      path.push({ col: c, row: r });
    }
    return path;
  }

  _doNextStep() {
    if (this.movePath.length === 0) {
      this.isMoving = false;
      this.walkIndicator.clear();
      return;
    }
    this.isMoving = true;
    const { col, row } = this.movePath.shift();
    const target = iso2screen(col, row, this.originX, this.originY);

    // Use absolute x,y for both player and label (avoids delta-accumulation bugs)
    this.tweens.add({
      targets: this.player,
      x: target.x,
      y: target.y,
      duration: 160,
      ease: 'Linear',
    });
    this.tweens.add({
      targets: this.playerLabel,
      x: target.x,
      y: target.y - 42,
      duration: 160,
      ease: 'Linear',
      onComplete: () => {
        this.playerCol = col;
        this.playerRow = row;
        this.player.setDepth(depthOf(col, row) + 5);
        this.playerLabel.setDepth(depthOf(col, row) + 6);
        // Move companion alongside player
        this.companionOrb.x  = target.x - 26;
        this.companionOrb.y  = target.y - 32;
        this.companionName.x = target.x - 26;
        this.companionName.y = target.y - 50;
        this._doNextStep();
      },
    });
  }

  _drawWalkIndicator(col, row) {
    this.walkIndicator.clear();
    const pos = iso2screen(col, row, this.originX, this.originY);
    this.walkIndicator.lineStyle(2, 0xffffff, 0.6);
    this.walkIndicator.beginPath();
    this.walkIndicator.moveTo(pos.x, pos.y - TILE_H/2);
    this.walkIndicator.lineTo(pos.x + TILE_W/2, pos.y);
    this.walkIndicator.lineTo(pos.x, pos.y + TILE_H/2);
    this.walkIndicator.lineTo(pos.x - TILE_W/2, pos.y);
    this.walkIndicator.closePath();
    this.walkIndicator.strokePath();
  }

  // ──────────────────────────────────────────────────────────────────
  // DIALOGUE SYSTEM
  // ──────────────────────────────────────────────────────────────────
  _openDialogue(npc) {
    this.dialogueOpen = true;
    this.activeNPC    = npc;
    const questCtx = this.questEngine.getQuestContext();

    // Show greeting in speech bubble above NPC
    this._showNPCSpeechBubble(npc.id, npc.greeting);

    // Notify HTML UI
    if (window.openDialogueUI) {
      window.openDialogueUI(npc, async (playerText) => {
        if (!playerText.trim()) return;
        this._showNPCSpeechBubble(npc.id, '…（考え中）');
        try {
          const result = await this.dialogueManager.getNPCReply(npc, playerText, questCtx);
          this._showNPCSpeechBubble(npc.id, result.text);
          if (window.showNPCReplyInUI) window.showNPCReplyInUI(npc, result.text, result.source);
        } catch (e) {
          this._showNPCSpeechBubble(npc.id, 'う…なんか変な感じが…');
        }
      });
    }
  }

  _showNPCSpeechBubble(npcId, text) {
    // Remove old bubble if any
    if (this._bubbleObj) { this._bubbleObj.destroy(); this._bubbleObj = null; }
    if (this._bubbleBg)  { this._bubbleBg.destroy();  this._bubbleBg  = null; }

    const obj = this.npcObjects[npcId];
    if (!obj) return;

    const pos = iso2screen(obj.data.col, obj.data.row, this.originX, this.originY);
    const tx  = pos.x;
    const ty  = pos.y - 60;

    this._bubbleBg = this.add.graphics().setDepth(8500);
    const w = Math.min(text.length * 8 + 20, 240);
    this._bubbleBg.fillStyle(0xfef6e0, 0.92);
    this._bubbleBg.fillRoundedRect(tx - w/2, ty - 32, w, 34, 8);
    this._bubbleBg.lineStyle(2, 0xc8a450, 1);
    this._bubbleBg.strokeRoundedRect(tx - w/2, ty - 32, w, 34, 8);
    // Tail
    this._bubbleBg.fillTriangle(tx - 6, ty + 2, tx + 6, ty + 2, tx, ty + 12);

    this._bubbleObj = this.add.text(tx, ty - 15, text, {
      fontSize: '12px', fontFamily: 'serif',
      color: '#3a2a10', wordWrap: { width: w - 16 },
    }).setOrigin(0.5, 0.5).setDepth(8501);

    // Auto-hide after 5s
    this.time.delayedCall(5000, () => {
      if (this._bubbleObj) { this._bubbleObj.destroy(); this._bubbleObj = null; }
      if (this._bubbleBg)  { this._bubbleBg.destroy();  this._bubbleBg = null; }
    });
  }

  _showTalkPrompt(npc, pos) {
    this._hideTalkPrompt();
    this._talkPrompt = this.add.text(pos.x, pos.y - 56, `[F] ${npc.name}に話しかける`, {
      fontSize: '11px', fontFamily: 'sans-serif',
      color: '#ffffff', backgroundColor: '#00000099',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5, 1).setDepth(9000);
  }
  _hideTalkPrompt() {
    if (this._talkPrompt) { this._talkPrompt.destroy(); this._talkPrompt = null; }
  }

  // ──────────────────────────────────────────────────────────────────
  // FLOATING TEXT FEEDBACK
  // ──────────────────────────────────────────────────────────────────
  _showFloatingText(x, y, msg, color = '#ffffff') {
    const t = this.add.text(x, y, msg, {
      fontSize: '13px', fontFamily: 'serif', color,
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(9000);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  // ──────────────────────────────────────────────────────────────────
  // WATER ANIMATION
  // ──────────────────────────────────────────────────────────────────
  _animateWater() {
    this.waterAlt = !this.waterAlt;
    this.tileMap.forEach(({ sprite, type }) => {
      if (type !== 4) return;
      // Slight tint toggle
      if (this.waterAlt) sprite.setTint(0x6ab0f0);
      else               sprite.clearTint();
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // DAY / NIGHT CYCLE
  // ──────────────────────────────────────────────────────────────────
  _updateDayCycle(delta) {
    this.dayTime = (this.dayTime + delta * 0.00003) % 1;
    const t = this.dayTime;
    let alpha = 0;
    if (t < 0.25)      alpha = 0;                        // daytime
    else if (t < 0.4)  alpha = (t - 0.25) / 0.15 * 0.55;// sunset
    else if (t < 0.65) alpha = 0.55;                     // night
    else if (t < 0.8)  alpha = (0.8 - t) / 0.15 * 0.55; // sunrise
    else               alpha = 0;

    this.nightOverlay.setFillStyle(0x000033, alpha);

    // Update HUD clock
    const hour = Math.floor(t * 24);
    const min  = Math.floor((t * 24 * 60) % 60);
    if (window.updateHUDClock) {
      const phase = t < 0.25 ? '☀️昼' : t < 0.4 ? '🌅夕方' : t < 0.65 ? '🌙夜' : '🌅朝';
      window.updateHUDClock(`${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')} ${phase}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // NPC BOBBLE ANIMATION
  // ──────────────────────────────────────────────────────────────────
  _updateNPCBobble(time) {
    Object.entries(this.npcObjects).forEach(([id, obj]) => {
      const offset = Math.sin(time * 0.0018 + NPC_DATA.findIndex(n => n.id === id)) * 2;
      obj.sprite.y = obj.origY + offset;
      obj.label.y  = obj.origY + offset - 42;
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // COMPANION HINT
  // ──────────────────────────────────────────────────────────────────
  _showCompanionHint() {
    const hint = this.companionAI.tick(Date.now());
    if (!hint) return;

    if (window.showCompanionHint) window.showCompanionHint(hint);

    const cx = this.companionOrb.x + 24;
    const cy = this.companionOrb.y + 16;
    this._showFloatingText(cx, cy, `ルナ：${hint}`, '#c8f0ff');
  }

  // ──────────────────────────────────────────────────────────────────
  // QUEST ENGINE TICK
  // ──────────────────────────────────────────────────────────────────
  _tickQuestEngine(time) {
    const newQ = this.questEngine.tick(time, NPC_DATA);
    if (newQ) {
      this._updateQuestHUD(newQ);
      this._showFloatingText(
        this.player.x, this.player.y - 50,
        `📜 新しいクエスト！`, '#ffe066',
      );
    }
  }

  _updateQuestHUD(quest) {
    if (window.updateQuestHUD) window.updateQuestHUD(quest);
  }

  // ──────────────────────────────────────────────────────────────────
  // PLAYER MOVEMENT (internal tick — nothing extra needed here)
  // ──────────────────────────────────────────────────────────────────
  _updatePlayerMovement(delta) {
    // Movement is tween-based, no per-frame updates needed
  }
}

// =====================================================================
// NPC TEXTURE WITH ROLE BADGE
// =====================================================================
function buildNPCCanvas(headCol, bodyCol, npcId) {
  const canvas = buildCharCanvas(headCol, bodyCol);
  const ctx    = canvas.getContext('2d');

  // Small role-type icon on body
  const icons = { elena:'★', tom:'♣', lily:'♥', rex:'$', aria:'⚔' };
  const icon  = icons[npcId] || '•';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font      = '8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(icon, canvas.width / 2, canvas.height - 18);
  return canvas;
}

// =====================================================================
// PHASER GAME INIT
// =====================================================================
function initGame() {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a0a2e',
    parent: 'game-container',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [GameScene],
  };
  return new Phaser.Game(config);
}
