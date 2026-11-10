---
title: Performance
description: How the shared particle budget, distance cap, and low-FPS suppression behave.
---

There is one scheduler. Effects do not spawn on their own threads, and they do not keep a private particle list inside the engine. A particle handed to `spawn` is submitted to the client level immediately.

## Scale

When `adaptive` is true and the reported fps is between 1 and 39, jittered spawns are multiplied by:

```
max(0.15, fps / 40)
```

At 20 fps that scale is `0.5`. At 40 fps and above it is `1`. Exact spawns ignore the scale, so a drip you placed on an edge is not randomly deleted because the frame rate dipped.

`framesPerSecond()` and `spawnScale()` are on `PerformanceView`. `Diagnostics` exposes the same numbers.

## Budgets

`globalParticleBudget` counts every accepted particle this tick, jittered and exact.

`effectParticleBudget` rejects jittered particles for the effect currently ticking. Exact particles are not rejected by it. Each accepted exact particle still increments the effect counter, so a burst of exact drips can leave no room for later jittered spawns in that same effect. Exact particles always consume the global budget, and they stop when `budgetRemaining()` hits zero.

Distance uses the smaller of the request max distance and `performance.maxDistance`. A request past that limit is rejected and counted in `rejectedThisTick()`.

## Suppression

`performance().suppressed(priority)` is true when fps is below 20 and `priority` is negative. The engine already skips `tick` for those effects. You only need to call `suppressed` yourself if you want the same rule for work done outside `tick`.

Put optional decoration on a negative priority. Keep gameplay-visible effects at 0 or above if they should survive a stutter.

## Visibility

`performance().visible(x, y, z)` is the camera frustum test. Jittered requests with `respectFrustum` true use it. Exact requests do not. When the frustum is unavailable, the test allows the point. That is the case on some older versions where the cull frustum is not readable from the camera.

## Chunks

`onChunkUnload` is the hook for maps you keyed by chunk. The engine does not track your blocks. If you stored puddle state for chunk `(x, z)`, drop it here. Effects that have not been `init`'d yet do not receive the event.
