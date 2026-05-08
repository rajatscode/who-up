# Who-Up: Core Requirements

## Product Vision
Interactive 3D globe showing estimated awake humans worldwide, with real-time view and time-travel capability.

## Must-Have Features (MVP)
1. **3D Interactive Globe** - WebGL-rendered Earth
2. **Awake-Human Estimation** - Dots/markers showing where humans are likely awake
3. **Awake Count Display** - Running total at top ("X billion awake now")
4. **Real-Time View** - Shows current moment
5. **Time Travel** - Scrub backward/forward to any past time (rewind) back to present
6. **User Interaction** - Drag to rotate, scroll to zoom, click to time-scrub

## Technical Constraints
- Frontend-only webapp (no backend)
- Use dialec for code generation
- WebGL + satellite Earth texture
- Realistic day/night lighting
- Fun and responsive

## Data & Algorithms
- Awake estimation by local time + population distribution
- Simple heuristic: % awake varies by local hour
- Geographic sampling via grid or population density

## Visual Direction (TBD by Designer)
- Dark space background
- Realistic or stylized Earth
- Glowing awake-human markers
- Bottom time-slider UI
- Centered count display

## Dialec Integration (TBD by Architecture)
- Dialec generates frontend code
- Tech stack TBD (Three.js? Babylon.js? TypeScript?)

---

*Status: Awaiting team decisions on tech stack and finalized specs.*
