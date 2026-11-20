# @agentprism/memory-success-bias

**自定义对比维度**：召回的经历中，哪些进入 prompt。同一任务上对比“只放成功 /
只放失败 / 两者都放”。

```
Arena → 维度 "memory_success_bias"         Builder → 积木块 "Memory success bias"
  both（默认）                               both
  success                                    successes
  failure                                    failures
```

## 它改变什么

共享记忆服务会把成功和失败的任务经历召回在同一个 episodic 库里。哪种混合更
有用取决于任务：失败通常带着“下次怎么改”，成功带着“照这个再做一遍”。这个维度
把混合比例变成对比轴：

| 取值 | 效果 |
|---|---|
| `both` | 原样挂载召回结果（默认） |
| `success` | 只挂载 `success === true` 的条目 |
| `failure` | 只挂载 `success === false` 的条目 |

只作用于读侧：在渲染前过滤召回结果，不改变存储，也不会新增召回。semantic 层
保持原样——语义事实没有成功/失败的结果。

## 使用的钩子

`memory(input, value)` → 返回过滤后的 `recall`（仅 episodic）；`both`、未知取值
或没有召回时返回 `undefined`。覆盖范围：全部 driver（记忆在 prompt 组装期挂载）。

## 使用

在组合根（`apps/server/src/assemble.ts`）与其他自定义维度一起注册；在
`apps/server/package.json` 加上 `"@agentprism/memory-success-bias": "workspace:*"`；
执行 `pnpm install`。`ARENA_CUSTOM_DIMENSIONS=off` 可随全部自定义维度一起关闭。

请与内置 `memory` 维度（`episodic` 或 `full`）搭配使用：设为 `none` 或 `semantic`
时没有 episodic 召回可过滤。

## 照抄它

复制本目录，改包名/id/选项，替换钩子，并更新家族 README 表。完整配方、四个钩子
槽位、driver 覆盖表与约束见
[`docs/reference/add-a-custom-dimension.zh.md`](../../../docs/reference/add-a-custom-dimension.zh.md)。

## 依赖

- Runtime：仅 `contracts`（描述符类型）。由宿主注册该维度。
