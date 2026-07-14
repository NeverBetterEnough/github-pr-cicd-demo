# 除法运算支持

## Summary
为迷你计算器新增除法运算。在 `calculator.js` 中新增 `divide` 纯函数，在 `index.html` 的运算符下拉菜单中添加"除法"选项，在 `app.js` 中注册除法运算映射，并编写覆盖正常除法、除零、零除、负数、浮点数等场景的测试用例。

## Acceptance Criteria
- [ ] 用户可在 UI 下拉菜单中选择"除法"运算符
- [ ] 输入被除数 8、除数 2，点击计算，结果面板显示 4
- [ ] 输入被除数 0、除数 5，点击计算，结果面板显示 0
- [ ] 输入被除数 8、除数 0 时，`calculator.divide()` 抛出明确的错误（错误消息包含 "zero" 或 "除零"）
- [ ] 除零时 UI 在结果面板显示错误提示文字（如 "除数不能为零"），而非 `Infinity` 或 `NaN`
- [ ] 所有已有运算 (add/subtract/multiply) 功能不受影响，测试通过

## Edge Cases & Boundaries

| 场景 | 预期行为 |
|------|----------|
| 除数为 0 | `divide(8, 0)` 抛出 `Error`；UI `catch` 后显示"除数不能为零" |
| 被除数为 0 | `divide(0, 5)` 返回 `0`，正常显示 |
| 负数除法 | `divide(-6, 3)` 返回 `-2`；`divide(6, -3)` 返回 `-2`；`divide(-6, -3)` 返回 `2` |
| 浮点数除法 | `divide(1, 3)` 返回 `0.333...`（JS 默认精度，不做额外舍入）；`divide(0.1, 0.2)` 返回 JS 浮点运算结果（不做特殊处理，与现有 add/subtract/multiply 风格一致） |
| 非数字输入 | 由 `app.js` 中 `Number(input.value)` 转换为 `NaN`，`divide(NaN, x)` 或 `divide(x, NaN)` 返回 `NaN`。UI 显示 "NaN"，与现有运算行为一致（无需特殊处理） |
| 被除数和除数均为 0 | `divide(0, 0)` 在数学上未定义，但 JS 中 `0/0` 返回 `NaN`。这里应同样抛除零错误（除数检查优先于被除数） |

## Technical Design

### 修改文件清单

**1. `src/calculator.js`** — 新增 `divide` 函数
```js
export function divide(a, b) {
  if (b === 0) {
    throw new Error('除数不能为零');
  }
  return a / b;
}
```
- 无新增依赖
- 保持纯函数风格，与 `add/subtract/multiply` 一致
- 除零时抛出 Error 而非返回特殊值，让调用方决定如何处理

**2. `tests/calculator.test.js`** — 新增除法测试
- 导入 `divide`
- 新增 5 个测试用例（见 Test Plan）

**3. `src/app.js`** — 注册除法运算
- 从 `calculator.js` 导入 `divide`
- 在 `operations` 映射中添加 `divide`
- 对调用 `calculate()` 的结果加 `try/catch`，捕获除零错误后在结果面板显示错误消息
- 注：当前代码只用 `if (!calculate)` 处理不支持的运算；需额外加 `try/catch` 处理运行时的除零异常

**4. `src/index.html`** — 添加除法选项
- 在 `<select id="operator">` 中添加 `<option value="divide">除法</option>`

### 数据流
```
用户输入 → app.js 读取 input 值 → Number() 转换 → operations[operator] 查找 → divide(a, b) 计算
                                                                                    ↓ 除零抛出 Error
                                                                               app.js catch → 显示 "除数不能为零"
                                                                                    ↓ 正常返回
                                                                               显示 String(result)
```

## Task Breakdown

| # | 任务 | 描述 | 涉及文件 |
|---|------|------|----------|
| 1 | 实现 `divide` 函数 | 在 `calculator.js` 中新增 `divide(a, b)` 导出函数，除数为 0 时抛出 Error | `src/calculator.js` |
| 2 | 编写测试用例 | 为 `divide` 编写 5 个测试用例（正常、除零、零除、负数、浮点数），确保 `node --test` 通过 | `tests/calculator.test.js` |
| 3 | 前端注册除法 | 在 `app.js` 中导入 `divide`、加入 `operations` 映射、添加 `try/catch` 错误处理 | `src/app.js` |
| 4 | UI 添加除法选项 | 在 `index.html` 的运算符 `<select>` 中添加 `<option value="divide">除法</option>` | `src/index.html` |
| 5 | 运行全量测试验证 | 执行 `node --test` 确认所有测试（含已有 3 个 + 新增 5 个）通过 | — |

## Test Plan

### 新增测试用例 (`tests/calculator.test.js`)

```js
test('divide: 8 / 2 应等于 4', () => {
  assert.equal(divide(8, 2), 4);
});

test('divide: 0 / 5 应等于 0', () => {
  assert.equal(divide(0, 5), 0);
});

test('divide: 8 / 0 应抛出错误', () => {
  assert.throws(() => divide(8, 0), /除数不能为零/);
});

test('divide: 负数除法 -6 / 3 应等于 -2', () => {
  assert.equal(divide(-6, 3), -2);
});

test('divide: 浮点数除法 1 / 3 应约等于 0.333', () => {
  assert.equal(divide(1, 3), 1 / 3);
});
```

- 测试框架：Node.js 内置 `node:test` + `node:assert/strict`
- 运行命令：`node --test`

## Risks & Questions

- [ ] **Q1: 除零时的行为策略？** 当前设计为 `divide()` 抛出 Error，UI 显示 "除数不能为零"。这是推荐做法，但需确认：是否接受抛出异常的方式？还是倾向于返回 `Infinity` 或 `null` 由 UI 自行判断？
- [ ] **Q2: 浮点数精度？** JS 原生浮点除法会产生 `0.1/0.2 = 0.5`（精确）或 `1/3 = 0.3333333333333333`。是否需要限制小数位数（如 `toFixed(4)`）？当前设计选择不做额外舍入，与现有 `add/subtract/multiply` 保持一致。若需要精度控制，建议作为独立需求单独处理。
- [ ] **Q3: `app.js` 中 `try/catch` 的粒度？** 当前 `app.js` 的 `calculate()` 调用没有错误处理，本次改为对整个 `calculate(first, second)` 加 `try/catch`。这意味着未来任何运算抛出的错误都会走统一的 catch 分支。若某天某个运算抛出的错误消息不是面向用户的（如技术性错误），会直接显示在 UI 上。是否需要更细粒度的区分，还是当前"错误消息即面向用户"的约定可以接受？
