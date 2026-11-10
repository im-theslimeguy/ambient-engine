---
title: Rendering
description: Camera-relative billboards, face quads, and UV-mapped textured quads on the translucent entity pipeline.
---

`render` receives an `AmbientDraw`. Everything submitted during this frame is flushed once, after every active effect has rendered, through the vanilla translucent entity pipeline. You do not bind a shader or a render type.

Coordinates are world positions. The engine translates by the camera before upload. `cameraRelative()` is always true today, so write world positions either way.

Quads whose first corner is farther than the current render distance, in blocks, are dropped. `renderDistanceBlocks()` reports that limit.

## Simple shapes

```java
draw.billboard(center, 0.35F, 0x66AADDFF, null);
draw.quad(a, b, c, d, 0x80FFFFFF, "mymod:textures/effect/puddle.png");
draw.face(center, new Vec3(0, 1, 0), 0.5F, 0x66FFFFFF, null);
```

Color is packed ARGB. An alpha byte of 0 is drawn as fully opaque.

A null texture, or a blank one, is the engine's white pixel, `ambient-engine:textures/white.png`. Any other texture is `namespace:path` inside your mod's `assets` folder. The string form is the same on every Minecraft version. Do not pass `Identifier` or `ResourceLocation` into `AmbientDraw`.

`billboard` faces the camera. `face` builds a square of the given size, pushed `0.01` blocks along the normal so it does not z-fight the block. Both use `AmbientDraw.FULL_LIGHT` (`0x00F000F0`) and the full 0–1 UV square.

Winding for the simple quad is the order `a, b, c, d`. UVs are `(0,1), (1,1), (1,0), (0,0)`.

## Textured quads

Glass streaks, puddle sheets, and frost cards need a region of a texture and real light.

```java
int light = context.environment().packedLight(pos);
draw.texturedQuad(
    a, b, c, d,
    u0, v1,
    u1, v1,
    u1, v0,
    u0, v0,
    0xCCFFFFFF,
    light,
    "mymod:textures/effect/streak.png"
);
```

`pos` is the block the quad belongs to. Each corner has its own UV, in the same order as the positions. `light` is the packed value from `Environment.packedLight`, not a 0–15 level. Fullbright is `AmbientDraw.FULL_LIGHT`. An alpha byte of `0` is drawn as `255`.

The texture must already be a stitched texture the vanilla texture manager can load. The engine does not generate atlases. Animated sheets are ordinary ticking textures. The engine does not know about frames. Pick the UV of the frame you want, or let the texture animator move the whole texture.

## What this pipeline will not do

One translucent pass cannot express a custom render pipeline, a cutout shader, or a mesh that is not quads. Clip a puddle to the ground by emitting several `texturedQuad` calls, one per cell, the same way you would fill a `VertexConsumer`. Frost that needs a block mesh still belongs in the mod that owns that mesh. Send the engine the finished quads.

Drawing happens even while the game is paused, for effects that are active. Particle spawning does not.
