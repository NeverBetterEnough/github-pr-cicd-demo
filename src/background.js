/**
 * 数学主题背景动画
 *
 * Canvas 粒子系统：浮动的数学符号 + 网格背景，营造数学氛围。
 */

// ========== 可测试的配置与工具函数 ==========

/** 数学符号池 */
export const MATH_SYMBOLS = [
  '+', '−', '×', '÷', '=',
  '∑', '∫', '∏', '√', '∞',
  'π', 'θ', 'λ', 'Δ', 'Ω',
  'α', 'β', 'γ', 'δ', 'ε',
  '∂', '∇', '≈', '≤', '≥',
  '±', '∝', '∈', '∀', '∃',
];

/** 默认粒子数量 */
export const DEFAULT_PARTICLE_COUNT = 30;

/** 网格线颜色（半透明） */
export const GRID_COLOR = 'rgba(100, 116, 139, 0.10)';
/** 网格间距（px） */
export const GRID_SPACING = 50;

/**
 * 创建单个粒子
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {object} 粒子对象
 */
export function createParticle(canvasWidth, canvasHeight) {
  const symbolIdx = Math.floor(Math.random() * MATH_SYMBOLS.length);
  return {
    symbol: MATH_SYMBOLS[symbolIdx],
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    vx: (Math.random() - 0.5) * 0.3,  // 水平漂移速度（px/frame）
    vy: (Math.random() - 0.5) * 0.3,  // 垂直漂移速度
    size: 14 + Math.random() * 20,     // 字号 14–34
    opacity: 0.08 + Math.random() * 0.10, // 透明度 0.08–0.18
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.002,
    // 定时换符号
    switchTimer: 200 + Math.random() * 400, // 帧数间隔
    switchCounter: 0,
  };
}

/**
 * 创建粒子数组
 * @param {number} count   粒子数量
 * @param {number} width   画布宽度
 * @param {number} height  画布高度
 * @returns {object[]}
 */
export function createParticles(count = DEFAULT_PARTICLE_COUNT, width = 800, height = 600) {
  return Array.from({ length: count }, () => createParticle(width, height));
}

/**
 * 更新单个粒子位置（边界回弹）
 * @param {object} p       粒子
 * @param {number} width   画布宽度
 * @param {number} height  画布高度
 */
export function updateParticle(p, width, height) {
  p.x += p.vx;
  p.y += p.vy;
  p.rotation += p.rotationSpeed;

  // 边界回弹
  if (p.x < 0) { p.x = 0; p.vx *= -1; }
  if (p.x > width) { p.x = width; p.vx *= -1; }
  if (p.y < 0) { p.y = 0; p.vy *= -1; }
  if (p.y > height) { p.y = height; p.vy *= -1; }

  // 定时换符号
  p.switchCounter++;
  if (p.switchCounter >= p.switchTimer) {
    p.switchCounter = 0;
    p.switchTimer = 200 + Math.random() * 400;
    const newIdx = Math.floor(Math.random() * MATH_SYMBOLS.length);
    p.symbol = MATH_SYMBOLS[newIdx];
  }
}

// ========== Canvas 动画 ==========

let animationId = null;
let canvas = null;

/**
 * 绘制网格背景
 */
function drawGrid(ctx, width, height) {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += GRID_SPACING) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += GRID_SPACING) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/**
 * 绘制所有粒子
 */
function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.font = `${p.size}px "Segoe UI Symbol", "Arial Unicode MS", sans-serif`;
    ctx.fillStyle = `rgba(100, 116, 139, ${p.opacity})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.symbol, 0, 0);
    ctx.restore();
  }
}

/**
 * 初始化背景动画
 *
 * 在 <body> 中创建一个 <canvas> 并启动 requestAnimationFrame 循环。
 * 多次调用会先销毁旧实例。
 *
 * @param {number} [particleCount] 粒子数量，默认 30
 * @returns {object} { canvas, stop }
 */
export function initBackground(particleCount = DEFAULT_PARTICLE_COUNT) {
  // 避免重复初始化
  if (canvas) {
    cancelAnimationFrame(animationId);
    canvas.remove();
  }

  canvas = document.createElement('canvas');
  canvas.id = 'math-bg';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let width = 0;
  let height = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    // 窗口大小改变时重建粒子
    particles = createParticles(particleCount, width, height);
  }

  resize();
  window.addEventListener('resize', resize);

  function frame() {
    ctx.clearRect(0, 0, width, height);

    // 1) 纯色背景
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 2) 网格
    drawGrid(ctx, width, height);

    // 3) 粒子
    for (const p of particles) {
      updateParticle(p, width, height);
    }
    drawParticles(ctx, particles);

    animationId = requestAnimationFrame(frame);
  }

  animationId = requestAnimationFrame(frame);

  return {
    canvas,
    stop() {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (canvas && canvas.parentNode) {
        canvas.remove();
      }
      canvas = null;
      animationId = null;
    },
  };
}
