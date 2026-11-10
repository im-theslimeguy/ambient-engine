---
title: Surfaces
description: Block state, collision shape, and the exposure tests Ambient Engine actually implements.
---

`Surfaces` answers questions about one block. The `BlockState` and `VoxelShape` it returns are the vanilla objects, so a mod can keep using block tags and shape bounds. The boolean helpers are specific. Read the test before you build gameplay on the name.

## Raw world data

| Method | Returns |
| --- | --- |
| `state(pos)` | `level.getBlockState(pos)` |
| `neighbor(pos, direction)` | the state one step along `direction` |
| `shape(pos)` | the collision shape, empty context |
| `replaceable(pos)` | air, or the block can be replaced |
| `solidRender(pos)` | the block renders as solid |
| `fullCollision(pos)` | the collision shape is a full cube |
| `openFaces(pos)` | every direction for which `faceExposed` is true |

`replaceable`, `solidRender`, and `fullCollision` follow that Minecraft version's methods. On 1.18, replaceable still goes through the block material. On 1.19 and later it is `canBeReplaced()`.

Tags stay in your mod. Leaves are not special inside the engine:

```java
BlockState state = context.surfaces().state(pos);
boolean leaves = state.is(BlockTags.LEAVES);
VoxelShape shape = context.surfaces().shape(pos);
```

An empty collision shape has no edge to hang a drip on. Read `shape.bounds()` and place the particle yourself with `ParticleRequest.exact`.

## Exposure helpers

`faceExposed(pos, face)` is false when the block is air. It is also false when the neighbor on `face` has a sturdy face pointing back. Otherwise it is true when that neighbor does not render as solid.

`edgeOpen(pos, face, along)` requires the two directions to be on different axes, `faceExposed(pos, face)` to be true, and the neighbor along `along` to not be sturdy against `face`.

`surfaceExposed(pos)` is `faceExposed(pos, UP)` and `canSeeSky` on the block above.

`rainExposed(pos)` is **only** `Level.isRainingAt(pos)`.

`snowExposed(pos)` is `rainExposed` and the biome at that position is cold enough to snow.

`transparentSurface(pos)` is true for glass, glass panes, tinted glass, and block ids whose path ends in `_stained_glass` or `_stained_glass_pane`.

`overhang(pos)` is true when the block is not air, some block in the three blocks above renders as solid, and at least one horizontal direction has an open top edge.

`sheltered(pos)` is true when the sky is blocked, or the motion-blocking heightmap is above `y + 1`.

## Building an eave from the pieces

This is the composition, not a built-in effect. It looks for a solid block with an open side, sky above the block or the block above it, and a shower that has already lasted 40 ticks.

```java
BlockPos pos = candidate;
Surfaces surfaces = context.surfaces();
Environment environment = context.environment();
if (surfaces.state(pos).isAir() || !surfaces.fullCollision(pos)) {
    return;
}
if (!environment.skyVisible(pos) && !environment.skyVisible(pos.above())) {
    return;
}
if (environment.showerTicks() < 40) {
    return;
}
for (Direction side : Direction.Plane.HORIZONTAL) {
    BlockPos beside = pos.relative(side);
    if (!surfaces.replaceable(beside) || !surfaces.replaceable(beside.below())) {
        continue;
    }
    VoxelShape shape = surfaces.shape(pos);
    // Place the drip on shape.bounds() along `side` with ParticleRequest.exact.
}
```

`rainExposed(pos)` would reject this block, because a solid block is not "raining at" itself. `edgeOpen` is a cheaper neighbor test and does not require two air blocks under the lip. Use it as a hint, then apply the gameplay rule in the effect.
