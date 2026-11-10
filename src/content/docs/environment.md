---
title: Environment
description: Vanilla weather, biome, light, place, and how long the current rain shower has lasted.
---

`Environment` reads the client level. It does not simulate weather. `available()` is false when no world is running.

## Weather

`weather()` is one of `CLEAR`, `RAIN`, `SNOW`, `THUNDER`.

| Condition | Result |
| --- | --- |
| `Level.isThundering()` | `THUNDER` |
| not raining | `CLEAR` |
| raining, and the biome at the player is cold enough to snow | `SNOW` |
| raining otherwise | `RAIN` |

`rainIntensity()` is `Level.getRainLevel(1)`. It is the vanilla 0–1 fade, including during thunder and snow.

`snowIntensity()` equals `rainIntensity()` when the weather is `SNOW`, or when it is `THUNDER` and the player biome is cold enough to snow. Otherwise it is 0.

Cold enough to snow uses the biome test at sea level 63 on modern versions. Older lines use that line's precipitation API. Do not treat `snowIntensity()` as "there is a snow layer nearby". It is a biome test.

## Shower age

`showerTicks()` counts consecutive client ticks where all of these are true:

- the level is raining
- rain intensity is above `0.05`
- the player biome is not cold enough to snow

Thunder in a warm biome counts. Snow biomes reset the counter. The value caps at `100000` and resets to 0 on the first tick that fails the test, and when the player changes level.

An eave delay of about two seconds is `showerTicks() >= 40`. The engine does not apply that delay for you. The counter advances when the client ticks, including while the game is paused. Effect `tick` methods do not run during that pause.

## Time, biome, temperature

| Method | Meaning |
| --- | --- |
| `biomeId()` | Registry id at the player, or `minecraft:plains` if the holder has no key |
| `biomeTemperature()` | Vanilla base temperature of that biome |
| `temperature()` | The first registered `TemperatureSource` that returns a value, otherwise `biomeTemperature()` |
| `dayTime()` | The level's clock time |
| `dayFraction()` | `dayTime() % 24000 / 24000` |

A temperature mod implements `TemperatureSource` and registers it from its plugin:

```java
registry.temperature((environment, pos) -> OptionalDouble.of(measured));
```

Return `OptionalDouble.empty()` to decline. `temperature()` asks every source in registration order, always at the player position, and keeps the first present value. It does not blend them. The `BlockPos` on `sample` is that player position.

## Place and exposure

Both are evaluated at the `BlockPos` you pass.

`place(pos)`:

| Result | Test |
| --- | --- |
| `UNDERGROUND` | the sky is blocked and `y` is more than 8 blocks under the motion-blocking height |
| `INDOORS` | the sky is blocked, or that height is above `y + 1` |
| `OUTDOORS` | otherwise |

`exposure(pos)`:

| Result | Test |
| --- | --- |
| `SHELTERED` | `Level.isRainingAt(pos)` is false |
| `SNOW` | it is raining at the position and the biome there is cold enough to snow |
| `RAIN` | it is raining at the position otherwise |

`isRainingAt` requires the column above that exact position to be open to rain. A solid eave block usually fails it. For drips, test the air under the lip, or use `skyVisible` on the block and the block above. See [Surfaces](/surfaces/).

## Light and camera

`blockLight`, `skyLight`, and `light` are the 0–15 brightness values. `light` is the greater of the two.

`packedLight(pos)` is the packed overlay used by entity vertices: `(blockLight << 4) | (skyLight << 20)`. Pass it to `AmbientDraw.texturedQuad`. `AmbientDraw.FULL_LIGHT` is the fullbright constant `0x00F000F0`.

`playerPos()` is the player's block position. `cameraPos()` is the camera position used for distance tests. `skyVisible(pos)` is `Level.canSeeSky`.
