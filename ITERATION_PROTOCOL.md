# Who-Up: Rapid Iteration Protocol

**Goal:** Ship code frequently, iterate fast, reach 8am ET deadline without waste.

## Iteration Cycle (Repeat every 30-45 min)

### 1. **Code Ready** (Implementer)
   - Commits to repo with specific feature focus
   - Tag/message: "FEATURE: [globe|dots|ui|interactions|polish]"
   - Coordinator pings QA immediately

### 2. **QA Tests** (QA Tester)
   - Runs relevant subset of QA_CHECKLIST.md
   - Documents findings: ✅ Pass, ❌ Fail, ⚠️ Warning
   - Feedback format:
     ```
     ✅ Globe renders correctly
     ❌ Dots not visible at (40.7, -74.0)
     ⚠️ Performance: FPS drops to 25 on scroll
     ```
   - Reports to coordinator + implementer within 15 min

### 3. **Nemesis Reviews** (Nemesis)
   - Scans for: Scope creep? Quality cuts? BS decisions?
   - Flags: "Architecture decision holding up visual polish?" or "Good, shipping on time"
   - Reports to coordinator

### 4. **Implementer Fixes** (Implementer)
   - Prioritizes: Crashes > Visual bugs > Performance > Polish
   - Commits hotfix within 20 min
   - Back to step 1

### 5. **Coordinator Decides**
   - **Go**: Feature works, move to next milestone
   - **Iterate**: Critical bug, implementer fixes, QA re-tests
   - **Ship**: All critical features done, QA sign-off, deploy

---

## Feature Priority (If Cutting)

**Must have (non-negotiable):**
1. Globe renders (Three.js sphere + Earth texture)
2. Awake dots appear at correct locations
3. Count displays (total awake humans)
4. Time slider (scrub backward/forward)
5. Basic interactions (drag rotate, scroll zoom)

**Nice to have (if time):**
6. Smooth animations
7. Advanced lighting
8. Detailed visual polish
9. Performance optimization

**Cut if time-crunched:**
- Complex shaders
- Advanced camera controls
- Multi-timezone visualization
- Historical data persistence

---

## Time Guardrails

| Time | Milestone | Status |
|------|-----------|--------|
| NOW | Architecture + data finalized | 🟢 GO |
| +30 min | Globe rendering + dots | 🎯 Target |
| +1.5 hrs | Full features (UI, interactions) | 🎯 Target |
| +2 hrs | QA testing + critical fixes | 🎯 Target |
| +2.5 hrs | Polish + sign-off | 🎯 Target |
| +3 hrs | Deployment + demo | 🎯 Target |
| 8am ET | **SHIP** | 🚀 Deadline |

---

## Communication Protocol

**Coordinator to team:**
- Updates every 30 min or on milestone completion
- Flags delays immediately
- Makes cut/iterate decisions fast
- No long meetings—async decisions

**Team to Coordinator:**
- Commits trigger auto-ping
- Blockers reported immediately
- Status: "code ready", "bug found", "fixed", "ready for QA"

**QA to Coordinator:**
- Feedback within 15 min of code delivery
- Format: ✅❌⚠️ list + brief explanation
- Severity: Critical / High / Low

---

## Success = Shipped by 8am ET with all must-haves working.

Anything less is failure. Go. 🚀
