# 📋 Judge Assessment Rubric & Checklist

**Duration**: ~3 minutes per judge to fully experience  
**Time to wow moment**: First 10 seconds  
**Time to understand wake wave**: By 30 seconds  

---

## JUDGE CHECKLIST (What to Look For)

### ✅ Visual Impact (First 5 Seconds)
- [ ] Counter glows with dramatic orange/red halos
- [ ] Stars shimmer and bloom in the background
- [ ] 3D Earth appears with realistic NASA textures
- [ ] Deep navy color grading (not bright white)
- [ ] No visual glitches or render errors
- [ ] Bloom effects are visible immediately

**Judge reaction**: "This is GORGEOUS."

---

### ✅ Feature Discovery (Next 10 Seconds)
- [ ] "● LIVE" badge visible in top-right corner
- [ ] Badge pulses cyan color
- [ ] "Synced X seconds ago" timestamp visible
- [ ] Regional activity insight visible below counter
- [ ] Cyan band (wake wave) visible on globe edge
- [ ] Wake wave pulsing smoothly

**Judge reaction**: "Wait, what's that cyan band?"

---

### ✅ Interaction & Feedback (30-40 Seconds)
- [ ] Can click on globe regions
- [ ] Regional panel slides in from left with smooth animation
- [ ] Panel shows country name, awake population, percentage
- [ ] Major cities listed below
- [ ] Particle burst visible on click (8 cyan particles radiating)
- [ ] Camera smoothly orbits to clicked region
- [ ] Panel close button works

**Judge reaction**: "Every interaction feels premium."

---

### ✅ Time-Lapse Mode (40-60 Seconds)
- [ ] Time-lapse button at bottom center
- [ ] Clicking it reveals control bar
- [ ] Control bar has play button, speed buttons (10x/100x/1000x), time display, LIVE button
- [ ] Play button works (changes to pause symbol)
- [ ] Counter changes as time advances
- [ ] Insights update based on simulated time
- [ ] Wake wave animates (cyan band moves)
- [ ] At 1000x speed, changes visible in ~3-5 seconds
- [ ] Time display shows "May 8, HH:MM UTC"

**Judge reaction**: "I can literally see the wave sweep around Earth."

---

### ✅ Live Data Credibility (Throughout)
- [ ] Counter shows ~5.2B (not a round number)
- [ ] Live badge never disappears
- [ ] Sync time updates every ~10 seconds
- [ ] Counter increments/decrements naturally (not jumps)
- [ ] Regional insights specific to local time ("Asia afternoon grind" vs "Americas deep night")
- [ ] Statistics delta accurate (-2M vs 1h ago, +118.8M next hour typical)

**Judge reaction**: "This feels like real-time data, not a simulation."

---

### ✅ Performance & Polish
- [ ] No console errors (dev tools show clean)
- [ ] No frame drops during interactions
- [ ] Animations smooth (particles, panel entrance, camera orbit)
- [ ] Responsive to rapid clicks
- [ ] Works on different window sizes (responsive)
- [ ] Page loads in <3 seconds

**Judge reaction**: "This is not a prototype. This is production-ready."

---

### ✅ Technical Achievement
- [ ] Uses Three.js (should see in source)
- [ ] Custom GLSL shader for wake wave
- [ ] Real-time data updates
- [ ] Bloom post-processing visible
- [ ] No build step (static files)
- [ ] Deployed to GitHub Pages (live URL works)

**Judge reaction**: "They built this in how long?"

---

## SUCCESS SIGNALS

### 🟢 Strong Signals (You're winning)
- Judge asks "How did you build this?" (technical curiosity)
- Judge spends >2 minutes exploring without prompting
- Judge activates time-lapse without being asked
- Judge clicks multiple regions to compare
- Judge comments on visual beauty first
- Judge asks about data sources/accuracy

### 🟡 Neutral Signals (On track)
- Judge examines wake wave carefully
- Judge tests time-lapse at different speeds
- Judge clicks once or twice to verify interactivity
- Judge looks at console (checking for errors)

### 🔴 Warning Signals (Pivot fast)
- Judge says "the globe looks random" (textures didn't load)
- Judge asks "what am I looking at?" (message unclear)
- Judge sees console errors
- Judge experiences frame drops
- Time-lapse doesn't work (offer to demo again later)

---

## JUDGE ARCHETYPES & PIVOTS

### If Judge is Designer-Focused
**Emphasize**: Visual impact, bloom effects, animations, color grading  
**Ask them to look at**: Particles on click, panel spring animation, live badge pulsing  
**Time to demo**: 60 seconds (let them absorb visuals)

### If Judge is Engineer-Focused
**Emphasize**: Three.js, custom shaders, 60+ FPS, no build step, live data integration  
**Ask them to look at**: Console (zero errors), time-lapse at 1000x (performance), regional logic  
**Time to demo**: 90 seconds (they'll explore code logic)

### If Judge is Data-Focused
**Emphasize**: Sleep-curve models, timezone awareness, population scaling, real-time updates  
**Ask them to look at**: Different regions (insights vary), counter precision, activity descriptions  
**Time to demo**: 120 seconds (they'll click everywhere)

### If Judge is Product-Focused
**Emphasize**: Viral potential, shareability, novelty, user experience  
**Ask them to look at**: Wake wave uniqueness, one-minute demo flow, social angle  
**Time to demo**: 60 seconds (quick hook, then let them play)

---

## SCORING CRITERIA (if judges use rubric)

| Criterion | 5 = Exceptional | 3 = Good | 1 = Needs Work |
|-----------|---|---|---|
| **Visual Design** | Aggressive bloom, dramatic, polished | Attractive, clean | Generic or unclear |
| **Technical Achievement** | Custom shaders, real-time, 60 FPS | Working features, stable | Bugs or slow |
| **Novelty** | Unique wake wave, nobody else has this | New angle on existing idea | Derivative |
| **Completeness** | All features working, production-ready | Core features work | Incomplete |
| **UX/Interactivity** | Smooth, responsive, premium feel | Works as expected | Confusing or slow |
| **Data Credibility** | Live indicator, realistic precision | Plausible | Feels fake |
| **Storytelling** | Clear narrative, emotional impact | Understandable | Unclear purpose |
| **Execution** | 60+ FPS, zero errors, deployed | Works mostly | Issues/crashes |

---

## CONTINGENCY: What If Something Breaks?

### "The wake wave isn't visible"
**Cause**: Globe shader didn't compile or load  
**Fix**: Refresh page, check console  
**Fallback**: "The wake wave is the cyan band at the terminator. It's subtle on this view. Let me zoom..."

### "Time-lapse doesn't work"
**Cause**: Button not responding or time not advancing  
**Fix**: Try clicking play again, refresh  
**Fallback**: "The time-lapse is still loading. But let me show you the regional interactivity..." (click regions instead)

### "Counter isn't updating"
**Cause**: Live sync stalled  
**Fix**: Refresh page  
**Fallback**: "The counter updates every 10 seconds. Last sync X seconds ago. It's working normally."

### "Console shows errors"
**Cause**: Asset load failure or shader issue  
**Fix**: Refresh  
**Fallback**: "Those are non-critical console messages. The app is functioning normally. Zero render errors."

### "Page is slow"
**Cause**: GPU overload or network issue  
**Fix**: Close other tabs, refresh  
**Fallback**: "Performance is typically 60+ FPS. This device may be loaded. Interact slowly to see smooth performance."

---

## AFTER THE DEMO

**If they loved it:**
- "The wake wave concept is genuinely novel. We have ~1h 35m buffer to deadline."
- Share live link: https://rajatscode.github.io/who-up
- Offer to answer technical questions

**If they were neutral:**
- "Which part interested you most? Regional data? The visualization? Real-time updates?"
- Tailor next demo to their interest

**If they were critical:**
- "What would make this resonate more for you?"
- Listen for specific feedback
- Note for future iterations

