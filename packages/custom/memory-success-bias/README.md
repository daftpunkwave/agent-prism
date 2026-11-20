# @agentprism/memory-success-bias

**Custom comparison dimension**: which recalled past experiences reach the prompt.
Same task, three mixes: successful experiences only / failed experiences only / both.

```
Arena → dimension "memory_success_bias"     Builder → block "Memory success bias"
  both (default)                               both
  success                                      successes
  failure                                      failures
```

## What it changes

The shared memory service recalls successful and failed task experiences from the
same episodic store. Which mix helps depends on the task: failures usually carry
the correction, successes carry the pattern to repeat. This dimension makes the
mix the axis:

| value | effect |
|---|---|
| `both` | Mount the recall unchanged (default). |
| `success` | Mount only entries whose recorded `success` is true. |
| `failure` | Mount only entries whose recorded `success` is false. |

Read-side only: it filters the recall before rendering; it does not change what is
stored, and it never adds a recall. The semantic layer is left untouched —
semantic facts have no success/failure outcome.

## Hook

`memory(input, value)` → returns a filtered `recall` (episodic only), or
`undefined` for `both`, an unknown value, or an absent recall. Coverage: every
driver (memory is mounted during prompt assembly).

## Use

Register in the composition root (`apps/server/src/assemble.ts`) with the other
custom dimensions, add `"@agentprism/memory-success-bias": "workspace:*"` to
`apps/server/package.json`, add the package to the `tsconfig.tests.json` path map
(the server test typecheck resolves workspace packages through it), and
`pnpm install`. `ARENA_CUSTOM_DIMENSIONS=off` disables it with every custom
dimension.

Register it **before** `memory_top_n` when both are active: hooks fold in
registration order, so the top-N truncation then applies to the filtered set.
Pair it with the built-in `memory` dimension (`episodic` or `full`): on `none` or
`semantic` there is no episodic recall to shape.

## Limits

The built-in run path calls `recallEpisodic` with a small limit (3), so filtering
also changes how many entries are mounted: `success` or `failure` can mount fewer
entries than `both`. Treat this as a mix axis, not a controlled outcome-only test.
To separate outcome from volume, compare at a fixed mounted count (for example,
subsample `both` to the same number of entries) or use a memory module that can
recall enough candidates before filtering.

## Copy it

Copy this directory, rename the package/id/options, swap the hook, and update the
family README table. The full recipe, the four hook slots, the driver coverage
table, and the constraints live in
[`docs/reference/add-a-custom-dimension.md`](../../../docs/reference/add-a-custom-dimension.md).

## Dependencies

- Runtime: `contracts` only (descriptor types). The host registers the dimension.
