# Dialec Configuration for Who-Up

## Expected Dialec Setup (Pending Architecture Decision)

### Dialec Sidecar Initialization
```bash
cd /Users/rmehndir/dev/rajat/who-up
dialec init --project who-up --tech [typescript|ocaml] --framework [threejs|babylon|custom]
```

### Dialec Generation Strategy
**Architecture decision will specify:**
1. **Code generation scope**: 
   - Full app (scenes, UI, interactions)?
   - Just scaffold (boilerplate + structure)?
   - Data layer only (algorithms + utilities)?

2. **Dialec prompts** (examples):
   - "Generate a Three.js scene with a rotating sphere"
   - "Generate interactive camera controls (drag/zoom)"
   - "Generate a UI slider for time scrubbing"
   - "Generate awake-estimation algorithm module"

3. **Iteration loop**:
   - Generate → Test → Refine with dialec prompts
   - Keep code in `/src` for version control
   - Use dialec for rapid iteration, not as single-shot

### Health Checks
- Monitor: Does dialec respond in <5 seconds?
- If dialec hangs >30s: Kill process, try again
- If dialec fails twice: Escalate to architecture lead, consider manual implementation

### Fallback: Manual Implementation
If dialec is unreliable:
- Use dialec for small targeted prompts (one component at a time)
- Implementer writes boilerplate manually
- Still ship on time

---

*Awaiting architecture-lead decision on dialec role...*
