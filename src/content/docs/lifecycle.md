---
title: Lifecycle
description: When init, tick, render, cleanup, and chunk unload run, and how priority and active interact.
---

The engine owns the client tick and the world render hook. An effect does not subscribe to loader events.

## Order inside one tick

1. If the client has no level or player, every initialized effect is cleaned up and the engine detaches.
2. If the level object changed, the same cleanup runs, then effects initialize again on the new level.
3. `spawnScale` and the frustum are refreshed.
4. Effects run in descending `priority()`. Equal priorities keep registration order.
5. For each effect, `enabled` is read from config. A transition from enabled to disabled calls `cleanup` once.
6. A newly enabled effect receives `init` once.
7. `active(context)` is consulted. A false result skips `tick` and `render` for that frame. The effect stays initialized.
8. `tick` runs only when the game is not paused. `render` still runs while paused, using the active flags from the last unpaused tick. `showerTicks()` keeps advancing during the pause, because the environment is refreshed before the pause check.

`onChunkUnload(context, chunkX, chunkZ)` is delivered only to effects that have already received `init`.

## Methods

```java
public interface AmbientEffect {
    String id();
    default int priority() { return 0; }
    default boolean active(EffectContext context) { return true; }
    default void init(EffectContext context) {}
    default void tick(EffectContext context) {}
    default void render(EffectContext context, AmbientDraw draw) {}
    default void cleanup(EffectContext context) {}
    default void onChunkUnload(EffectContext context, int chunkX, int chunkZ) {}
}
```

`id()` is the config key and the name shown in the settings screen and in `/ambient effects`. Use a mod namespace: `yourmod:puddles`.

`priority` has a second meaning. While the client is below 20 fps, effects with a negative priority are suppressed and do not tick. Zero and positive priorities keep running. See [Performance](/performance/).

## EffectContext

Every callback receives the same context:

| Method | Use |
| --- | --- |
| `environment()` | Weather, biome, light, player and camera position |
| `surfaces()` | Block state, collision shape, exposure tests |
| `particles()` | Spawn vanilla particles |
| `config()` | This effect's settings, including `enabled` |
| `performance()` | Budgets, distance, current spawn scale |
| `debug()` | True only while the debug overlay is on |

`config()` is the effect currently being called. Do not cache it across effects. Do cache your own cooldown fields on the effect instance. The instance lives for the whole client session.

## Outside a callback

`Ambient.environment()`, `Ambient.surfaces()`, `Ambient.diagnostics()`, and `Ambient.reloadConfig()` read the live engine. Before a world is running, `environment().available()` is false and the returned objects are empty stubs (`EmptyEnvironment`, `EmptySurfaces`, `EmptyDiagnostics`). Plugins should not call `Ambient.bind`. That method belongs to the engine.

`Ambient.setDebug` does nothing while `debugKeys` is false. See [Debugging](/debugging/).
