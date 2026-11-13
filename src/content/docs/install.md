---
title: Install
description: Depend on Ambient Engine from Gradle through the Modrinth Maven API, and register one plugin.
---

Ambient Engine is a normal client mod for Fabric, Forge, and NeoForge. Players install the jar that matches their loader and Minecraft version. Your development environment also needs that jar on the compile classpath, which is what the Maven dependency below does.

The license is PolyForm Noncommercial 1.0.0.

## Modrinth Maven

Every file uploaded to Modrinth is available from Modrinth's Maven repository. Gradle coordinates use the **project id** and the **version id** from that file's Modrinth page. They are not the project slug, and they are not the human version number `0.1.1`.

The example below is the newest Ambient Engine file that lists the newest Minecraft version. This release is <span data-ambient="number">0.1.1</span> for Minecraft <span data-ambient="game">26.3</span>. The project id is <span data-ambient="project">6Dndi5in</span> and the version id is <span data-ambient="version">eGOmFlTG</span>.

```
maven.modrinth:6Dndi5in:eGOmFlTG
```

On load, this page asks `https://api.modrinth.com/v2/project/ambient-engine/version` for the project's files. When that request succeeds, it replaces the ids above with the newest file whose game versions include the newest Minecraft version. A file for an older line has its own version id. Compiling for 1.21.4 means that file's id, not the 26.3 id.

```groovy
repositories {
    exclusiveContent {
        forRepository {
            maven {
                name = "Modrinth"
                url = "https://api.modrinth.com/maven"
            }
        }
        // forRepositories(fg.repository) // Uncomment on ForgeGradle. Leave it out on Loom and ModDevGradle.
        filter {
            includeGroup "maven.modrinth"
        }
    }
}

dependencies {
    modImplementation "maven.modrinth:6Dndi5in:eGOmFlTG"
}
```

`exclusiveContent` keeps Gradle from asking Modrinth for Minecraft, a loader, or anything outside `maven.modrinth`.

### Which Gradle configuration

| Your build | Dependency line |
| --- | --- |
| Loom templates that still expose `modImplementation` | `modImplementation "maven.modrinth:6Dndi5in:eGOmFlTG"` |
| Loom 1.17 on Minecraft 26.x, where that configuration does not exist | `implementation "maven.modrinth:6Dndi5in:eGOmFlTG"` |
| ForgeGradle | `modImplementation "maven.modrinth:6Dndi5in:eGOmFlTG"` |
| NeoForge ModDevGradle | `implementation "maven.modrinth:6Dndi5in:eGOmFlTG"` |

Kotlin DSL is the same coordinates with parentheses:

```kotlin
dependencies {
    modImplementation("maven.modrinth:6Dndi5in:eGOmFlTG")
}
```

### Transitive dependencies

Modrinth's Maven API does not publish the transitive graph a normal author repository would. A Fabric jar of Ambient Engine needs Fabric API at runtime, and this coordinate will not pull Fabric API in for you. Keep your existing Fabric API dependency. Forge and NeoForge jars do not need Fabric API.

If the author later publishes a repository that does include transitive metadata, prefer that repository. Mixing it with `maven.modrinth` can put the same jar on the classpath twice, because the group id differs (`maven.modrinth` versus the author's group). Ambient Engine does not publish a separate author repository. Use the Modrinth coordinate only.

The Maven jar is the development classpath. A player still needs Ambient Engine installed, unless you are assembling a dev run. The mod id is `ambient-engine` on every loader. Register the plugin once.

Fabric, in `fabric.mod.json`:

```json
{
  "entrypoints": {
    "ambient-engine": ["com.example.weather.DripPlugin"]
  },
  "depends": {
    "ambient-engine": "*",
    "fabric-api": "*"
  }
}
```

Forge and NeoForge, in `META-INF/services/se.miljo.beef.ambient.api.AmbientPlugin`:

```
com.example.weather.DripPlugin
```

Depend on `ambient-engine` from `mods.toml` or `neoforge.mods.toml` with `side = "CLIENT"`. Do not add the Fabric entrypoint and the service file in the same mod. The engine reads both, and the effect would be registered twice.

## Pick a jar

Each file is compiled for one Minecraft line. A file contains Fabric, Forge, and NeoForge together only when those loaders declare the same Minecraft versions. Where the ranges differ, the loaders stay in separate files, so Modrinth cannot offer a loader a version that file does not run.

| Line | Loaders in one file | Fabric `minecraft` | Forge `minecraft` | NeoForge `minecraft` |
| --- | --- | --- | --- | --- |
| 1.18.2 | separate | `>=1.18 <=1.18.2` | `[1.18.2,1.19)` | none |
| 1.19.4 | separate | `>=1.19 <=1.19.4` | `[1.19.4,1.20)` | none |
| 1.20.1 | Fabric + Forge | `>=1.20 <=1.20.1` | `[1.20,1.20.2)` | none |
| 1.21.1 | separate | `>=1.21 <=1.21.3` | `[1.21,1.21.2)` | `[1.21.1,1.21.2)` |
| 1.21.4 | all three | `>=1.21.4 <1.21.5` | `[1.21.4,1.21.5)` | `[1.21.4,1.21.5)` |
| 1.21.8 | Fabric alone; Forge + NeoForge together | `>=1.21.5 <=1.21.8` | `[1.21.8,1.21.9)` | `[1.21.8,1.21.9)` |
| 1.21.10 | Fabric alone; Forge + NeoForge together | `>=1.21.9 <=1.21.10` | `[1.21.10,1.21.11)` | `[1.21.10,1.21.11)` |
| 1.21.11 | all three | `1.21.11` | `[1.21.11,1.21.12)` | `[1.21.11,1.21.12)` |
| 26.1 | all three | `~26.1-` | `[26.1,26.2)` | `[26.1,26.2)` |
| 26.2 | all three | `~26.2` | `[26.2,26.3)` | `[26.2,26.3)` |
| 26.3 | all three | `~26.3` | `[26.3,26.4)` | `[26.3,26.4)` |

`[1.20,1.20.2)` is 1.20 and 1.20.1, the same two versions as the Fabric range on that line. `[1.21.11,1.21.12)` is 1.21.11. `~26.1-` matches 26.1, 26.1.1, and 26.1.2, and does not match 26.2. `~26.2` and `~26.3` match only their own minor line.

Java is 17 on 1.18.2, 1.19.4, and 1.20.1, 21 from 1.21.1 through 1.21.11, and 25 on 26.1, 26.2, and 26.3. Fabric Loader is `>=0.14.0` through 1.21.11, `>=0.19.3` on 26.1 and 26.2, and `>=0.20.1` on 26.3.

On Modrinth, upload each file on its own and set that file's game versions to the versions every loader inside it actually accepts. Each file then has its own version id. A mod compiled for 1.21.4 depends on the 1.21.4 version id, not on the 26.3 version id.

## Packages

Import `se.miljo.beef.ambient.api`. That package is the supported surface. `se.miljo.beef.ambient.client` is the implementation and can change without notice.

`AmbientEngine.id(path)` returns `Identifier` on 1.21.11 and newer, and `ResourceLocation` on older lines. Effect code should not need it. Pass texture ids as `namespace:path` strings. See [Rendering](/rendering/).
