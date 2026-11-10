---
title: Your first effect
description: Register one AmbientPlugin, spawn vanilla particles, and read a setting from the shared config file.
---

A plugin is a plain class. It does not implement a loader initializer, and it does not import Fabric, Forge, or NeoForge. The loader only needs to find the class once. Use one discovery path per mod, or the effect is registered twice.

```java
package com.example.weather;

import se.miljo.beef.ambient.api.AmbientPlugin;
import se.miljo.beef.ambient.api.AmbientRegistry;

public final class DripPlugin implements AmbientPlugin {
    public static final String EFFECT = "example-weather:drips";

    @Override
    public void register(AmbientRegistry registry) {
        registry.config(EFFECT)
            .decimal("rate", 0.35F, 0.0F, 5.0F)
            .integer("perTick", 2, 0, 16);
        registry.effect(new DripEffect());
    }
}
```

`registry.config` and `registry.effect` are legal only inside `register`. The string passed to `config` must be the same string `AmbientEffect.id()` returns. The engine stores settings under that id.

Fabric finds the class from the `ambient-engine` entrypoint in `fabric.mod.json`. Forge and NeoForge find it from the service file `META-INF/services/se.miljo.beef.ambient.api.AmbientPlugin`, with the class name on its own line. A Fabric mod that also ships that service file registers the effect twice. Pick one path. The dependency id is `ambient-engine` on every loader. See [Install](/install/).

```java
package com.example.weather;

import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.world.phys.Vec3;
import se.miljo.beef.ambient.api.AmbientEffect;
import se.miljo.beef.ambient.api.EffectContext;
import se.miljo.beef.ambient.api.ParticleRequest;
import se.miljo.beef.ambient.api.Weather;

public final class DripEffect implements AmbientEffect {
    private int cooldown;

    @Override
    public String id() {
        return DripPlugin.EFFECT;
    }

    @Override
    public int priority() {
        return 10;
    }

    @Override
    public boolean active(EffectContext context) {
        Weather weather = context.environment().weather();
        return weather == Weather.RAIN || weather == Weather.THUNDER;
    }

    @Override
    public void tick(EffectContext context) {
        if (cooldown > 0) {
            cooldown--;
            return;
        }
        float rate = context.config().getFloat("rate", 0.35F);
        cooldown = Math.max(1, Math.round(8.0F / Math.max(0.05F, rate)));

        BlockPos pos = context.environment().playerPos();
        Vec3 at = Vec3.atCenterOf(pos).add(0.0, 1.2, 0.0);
        int count = context.config().getInt("perTick", 2);
        context.particles().spawn(ParticleRequest.of(at, ParticleTypes.DRIPPING_DRIPSTONE_WATER, count, 0.02, 32.0, true));
    }
}
```

`ParticleRequest.of` jitters velocity. A drip that must leave a specific point on a block edge uses `ParticleRequest.exact` instead. That path is documented in [Particles](/particles/).

On the next launch the engine writes `config/ambient-engine.json`. The effect appears under `effects`, with `enabled`, `rate`, and `perTick`. Players turn the effect off by setting `enabled` to `false`. The settings screen, when debug keys are on, toggles that same flag.

```json
{
  "debugKeys": false,
  "performance": {
    "globalParticleBudget": 4000,
    "effectParticleBudget": 400,
    "maxDistance": 64.0,
    "adaptive": true
  },
  "effects": {
    "example-weather:drips": {
      "enabled": true,
      "rate": 0.35,
      "perTick": 2
    }
  }
}
```

The shipped example mod (`ambient-engine-example`) is this shape: one plugin, one outdoor mote effect, settings for rate, count, and a billboard. Read it as a usage sample. It is not a weather mod.
