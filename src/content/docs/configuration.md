---
title: Configuration
description: Declare settings at startup and read them from config/ambient-engine.json.
---

The file is `config/ambient-engine.json`, in the game config folder. The engine creates it on first launch and rewrites it after a successful load, so a missing declared key appears. Hand-written comments are not preserved. A file that fails to parse is replaced. A JSON value that is not an object is left on disk and ignored.

## Declaring keys

Declare keys inside `AmbientPlugin.register`, before registration freezes:

```java
public enum GlassMode { OFF, STREAKS, SHEETS }

registry.config("example-weather:drips")
    .bool("onGlass", true)
    .integer("perTick", 2, 0, 16)
    .decimal("rate", 0.35F, 0.0F, 5.0F)
    .enumeration("glass", GlassMode.STREAKS);
```

`glass` is stored as the enum name, `"STREAKS"`. An unknown name loads as the fallback.

| Builder | Stored as | Validation |
| --- | --- | --- |
| `bool(key, fallback)` | boolean | none |
| `integer(key, fallback, min, max)` | number | clamped to min and max |
| `decimal(key, fallback, min, max)` | number | clamped to min and max |
| `enumeration(key, fallback)` | that enum's `name()` | unknown names fall back |

Every effect also has an implicit boolean `enabled`, default `true`. You do not declare it. The settings screen toggles only this flag. Integers, decimals, and enums are edited in the JSON.

Getters return the fallback argument when the key was never declared or the stored type does not match. Setters write the file immediately, and they do nothing when the key was not declared as that type. The rewrite keeps declared keys only, so a key you removed from `register` disappears from the effect object, and an effect id that is no longer registered disappears from `effects`.

## Performance block

These keys sit beside `effects`, under `performance`. They are global, not per effect.

| Key | Default | Clamp |
| --- | --- | --- |
| `globalParticleBudget` | `4000` | 64 … 100000 |
| `effectParticleBudget` | `400` | 1 … global budget |
| `maxDistance` | `64` | 4 … 256 |
| `adaptive` | `true` | boolean |

`effectParticleBudget` rejects jittered spawns only. An exact spawn is not rejected by it, but each accepted exact particle still counts toward the effect counter. See [Particles](/particles/) and [Performance](/performance/).

## debugKeys

`debugKeys` defaults to `false` and lives at the top of the file.

```json
{
  "debugKeys": false
}
```

While it is false, F6 and F7 are not bound and `/ambient debug` refuses to turn the overlay on. Fabric can bind the keys after `/ambient reload`. Forge and NeoForge register keys only during startup, so those two need a restart. Details are on [Debugging](/debugging/).

## Reload

`Ambient.reloadConfig()` reads the file again. On 1.19.4 and newer, `/ambient reload` calls that method. It is a client command. 1.18.2 has no `/ambient` command, so restart the client or call `reloadConfig` from your mod. Effects that were disabled run `cleanup` on the following tick. Effects that were enabled run `init` if they had been cleaned up.
