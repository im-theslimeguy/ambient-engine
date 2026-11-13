---
title: Ambient Engine
description: A client-side library for weather, surfaces, particles, and translucent world drawing.
---

One client library for weather, block surfaces, particles, and translucent world drawing. Your mod registers an effect. The engine runs it.

Start with [Install](/install/) or [Your first effect](/first-effect/).

Ambient Engine `0.1.1` is a **client-only library** for Fabric, Forge, and NeoForge. Other mods register effects through a public API that contains no loader types. The engine reads vanilla weather, asks the world about blocks, spawns particles inside a shared budget, and draws camera-relative quads through the vanilla translucent entity pipeline.

It does not replace Minecraft's weather, and it does not ship puddles, frost, or drips of its own. Those stay in the mod that knows the gameplay.

## What you call

| You need | Type |
| --- | --- |
| Register during startup | `AmbientPlugin`, discovered once per mod |
| Per effect | `AmbientEffect` |
| World questions | `Environment`, `Surfaces` |
| Vanilla particles | `ParticleScheduler` |
| Textured quads | `AmbientDraw` |
| Saved settings | `ConfigBuilder`, then `config/ambient-engine.json` |
| Frame budget | `PerformanceView` |

Registration closes at the end of startup. Calling `effect`, `config`, or `temperature` later throws `IllegalStateException`.

## What you still write

The queries are building blocks. `rainExposed` is vanilla `Level.isRainingAt`, which is the wrong test for water dripping off an eave. An eave effect combines `shape()`, `skyVisible()`, `replaceable()`, and `showerTicks()` itself. The same is true of a snow cap, a glass streak, or a frost sheet: the engine will place an exact particle and draw a UV-mapped quad, and your mod decides where.

## Loaders and versions

Fabric, Forge, and NeoForge, from Minecraft 1.18.2 through 26.3. NeoForge starts at 1.21.1. A published file contains more than one loader only when every loader inside it declares the same Minecraft versions. Match the jar to the line you compile, using the table on [Install](/install/).
