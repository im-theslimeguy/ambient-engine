---
title: Debugging
description: Turn on F6 and F7 from the config file, and what the overlay and commands show.
---

Debug tools ship in the library and stay off. A normal player never sees the overlay, the surface squares, or the keybinds.

## Turning them on

In `config/ambient-engine.json`:

```json
{
  "debugKeys": true
}
```

Save the file. On Fabric, run `/ambient reload` or restart the client. On Forge and NeoForge, restart: those loaders register key mappings only while the client is starting, and a later reload does not bind F6 or F7. The engine binds two keys:

| Key | Action |
| --- | --- |
| F6 | Toggle the debug overlay and the surface squares |
| F7 | Open the settings screen |

While `debugKeys` is false, those keys are not registered, F6 and F7 do nothing, and `/ambient debug` replies that the keys are off. `Ambient.setDebug` is ignored in that state. `/ambient` is a client command. Fabric 1.18.2 does not register it, so that line restarts after the file is edited. Forge 1.18.2 does register it. Every newer line registers it on all three loaders.

Minecraft 26.3 reads keyboard keys as SDL scancodes. The engine migrates a saved bind of the old GLFW codes (295 and 296) back to F6 and F7. On older Minecraft versions the keys are the normal GLFW F6 and F7.

## What F6 draws

The overlay lists each effect id, its state (`off`, `idle`, or `active`), its priority, the particles it spawned this tick, and its tick time. The header line is the effect count, the global particle count, the rejected count, and the current spawn scale.

The squares are `openFaces` inside a box around the player, from x −2 to 2, y −1 to 2, and z −2 to 2. Blue is up, yellow is a side, gray is down. They exist so a surface test can be checked in the world. They are not an effect, and they are not drawn when debug mode is off.

## The settings screen

F7 lists one toggle per registered effect. That toggle writes `enabled`. Reload reads the JSON again. Close returns to the game. The screen does not pause the world, and it does not edit rates or enums. Those stay in the file, which is the point of a library: players are not given a second options menu unless your mod builds one.

## Commands

On 1.19.4 and newer, all three exist even when debug keys are off. Only `debug` is gated. 1.18.2 has none of them. Use `Ambient.reloadConfig()` and `Ambient.diagnostics()` from your own mod on that version.

| Command | Result |
| --- | --- |
| `/ambient reload` | Reread `ambient-engine.json` |
| `/ambient debug` | Toggle the overlay, if `debugKeys` is true |
| `/ambient effects` | Print id, active state, and particle count |

`Ambient.diagnostics()` returns the same snapshot for your own commands: `effects()`, `particlesThisTick()`, `rejectedThisTick()`, `globalBudget()`, `spawnScale()`, `framesPerSecond()`, `lastTickMillis()`, and `debug()`. Each `EffectStats` record is `id`, `priority`, `enabled`, `active`, `particles`, `tickMillis`.
