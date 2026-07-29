/**
 * 计算器点击音效
 *
 * 使用 Web Audio API 生成短促的点击音，模拟物理按键手感。
 * 在无 AudioContext 的环境（如 Node.js 测试）中静默降级。
 */

/** @type {AudioContext | null} */
let audioCtx = null;

/**
 * 获取或创建 AudioContext 实例（懒初始化 + 复用）
 * @returns {AudioContext | null}
 */
function getAudioContext() {
  if (audioCtx) return audioCtx;
  try {
    const Ctor =
      typeof window !== 'undefined' &&
      (window.AudioContext || window.webkitAudioContext);
    if (Ctor) {
      audioCtx = new Ctor();
    }
  } catch {
    // 浏览器不支持或用户未交互时可能拒绝创建
  }
  return audioCtx;
}

/**
 * 播放一次短促的点击音。
 *
 * 音色设计：800Hz 正弦波 + 50ms 指数衰减包络，
 * 音量 0.3 → 0.001，模拟物理按键的清脆反馈。
 *
 * 在无 AudioContext 的环境中静默返回，不抛异常。
 */
export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);

    // 短促衰减：50ms 内从 0.3 降至接近无声
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // AudioContext 可能处于 closed 状态等异常情况
  }
}
