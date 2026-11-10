---
title: Particles
description: Jittered ambient particles and exact drips, and which budgets apply to each.
---

`context.particles().spawn` returns how many particles were accepted. Zero means the budget or the distance test rejected them.

There are two factories.

## Jittered

```java
ParticleRequest.of(pos, ParticleTypes.END_ROD, count);
ParticleRequest.of(pos, ParticleTypes.END_ROD, count, speed, maxDistance, respectFrustum);
```

The short form uses speed `0.01`, max distance `48`, and frustum culling. Horizontal velocity is random in the range `-speed / 2` to `speed / 2`. Vertical velocity is random from `0` to `speed`, so the bias is upward. `count` is multiplied by `performance().spawnScale()` before the budgets are applied. Both the global budget and this effect's budget can reject the spawn.

## Exact

```java
ParticleRequest.exact(pos, new Vec3(0.0, -0.02, 0.0), ParticleTypes.SNOWFLAKE);
ParticleRequest.exact(pos, Vec3.ZERO, ParticleTypes.DRIPPING_WATER, 16.0, true);
```

This places **one** particle at `pos` with exactly the motion vector you pass. The position is not jittered. The frustum test is skipped. `spawnScale` is not applied, and the spawn is not rejected by the per-effect budget.

An accepted exact particle still increments that effect's spawn counter. Jittered spawns later in the same tick can therefore hit `effectParticleBudget` sooner. The exact spawn itself only stops for the global budget or the distance test.

What still applies to the exact spawn:

- the global particle budget
- distance, using the smaller of the request's `maxDistance` and the config `maxDistance`

The last boolean is `force`. When true, the engine calls the level's force-spawn particle method, so rain does not swallow the particle. The default `exact` uses max distance `64` and `force = true`. Spawn several flakes by calling `exact` several times, each with its own position. That is how a melt burst keeps a downward velocity on every flake.

```java
for (int i = 0; i < 4; i++) {
    Vec3 at = Vec3.atCenterOf(pos).add((rng.nextDouble() - 0.5) * 0.5, 0.1, (rng.nextDouble() - 0.5) * 0.5);
    Vec3 motion = new Vec3((rng.nextDouble() - 0.5) * 0.01, -(0.006 + rng.nextDouble() * 0.006), (rng.nextDouble() - 0.5) * 0.01);
    context.particles().spawn(ParticleRequest.exact(at, motion, ParticleTypes.SNOWFLAKE, 32.0, true));
}
```

`rng` is your own `RandomSource`. The engine does not share one with the effect.

## Counters

| Method | Meaning |
| --- | --- |
| `budgetRemaining()` | global budget minus particles already accepted this tick |
| `spawnedThisTick()` | accepted particles, all effects |
| `rejectedThisTick()` | requests dropped this tick |

The debug overlay prints the same numbers. Rejected exact spawns are still worth logging in your own mod while you tune a cap. The engine will not raise the global budget to match a gameplay cap. Raise `globalParticleBudget` in the config if a dense effect legitimately needs more than the default `4000` per tick.
