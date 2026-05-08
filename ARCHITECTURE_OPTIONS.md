# Architecture Options: For Lead's Decision

## Option A: TypeScript + Three.js + Vite (Recommended for Speed)
- **Pros**: Fastest to ship, large Three.js community, dialec works well with TS, easy debugging
- **Cons**: Standard stack (less fun)
- **Dialec role**: Generate scene setup, interaction controllers, UI scaffolding
- **Time to MVP**: 2-3 hours
- **Build**: Vite (zero-config, fast refresh)

## Option B: OCaml + Bonsai + ReScript
- **Pros**: Type-safe, functional, Bonsai is fun, bonus points
- **Cons**: Slower to ship, smaller community, dialec may not have templates
- **Dialec role**: Generate data layer + UI framework, less code generation
- **Time to MVP**: 4+ hours (slower ramp)
- **Build**: BuckleScript/ReScript compiler

## Option C: Babylon.js + TypeScript
- **Pros**: More powerful WebGL, better lighting models, good for complex scenes
- **Cons**: Steeper learning curve, more boilerplate
- **Dialec role**: Similar to Three.js approach
- **Time to MVP**: 2-3 hours
- **Build**: Vite or Webpack

## Earth Texture Sources
1. **NASA Blue Marble** (realistic, free): https://earthobservatory.nasa.gov/images/55425/blue-marble-2012
2. **Natural Earth** (free tiles): https://www.naturalearthdata.com/
3. **Procedural** (simple sphere, day/night only)

## Recommended Decision
**Option A (TypeScript + Three.js + Vite)** — fastest to deliver with sufficient visual quality. Dialec generates boilerplate + scene structure. Ship by 8am ET.

---

*Awaiting architecture-lead decision...*
