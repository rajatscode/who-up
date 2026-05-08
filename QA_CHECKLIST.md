# Who-Up: QA Testing Checklist

## Pre-Flight Checklist (Before Testing)
- [ ] App loads without console errors
- [ ] No 404s for assets (textures, data files)
- [ ] Performance: 60 FPS on initial load
- [ ] Browser compatibility: Chrome/Firefox/Safari

## Feature Testing: Globe Rendering
- [ ] Earth sphere renders (visible at all zoom levels)
- [ ] Satellite texture is visible and realistic
- [ ] Day/night lighting is present (visible light side vs dark side)
- [ ] Globe rotates smoothly (no stuttering)
- [ ] Colors are correct (dark space background, blue oceans, etc.)

## Feature Testing: Awake Humans
- [ ] Awake human dots appear on globe
- [ ] Dots are at correct locations (lat/lon mapping correct)
- [ ] Dots have visual style (color, glow, size) as designed
- [ ] Dots don't overlap excessively
- [ ] Dot count updates when time changes

## Feature Testing: Interactions
- [ ] **Drag to rotate**: Globe rotates smoothly when dragged
- [ ] **Scroll to zoom**: Zoom in/out works, camera moves correctly
- [ ] **Click (if used)**: Interactions respond immediately
- [ ] **No lag**: Interactions feel responsive (<100ms latency)

## Feature Testing: Real-Time Display
- [ ] Current awake count displayed at top
- [ ] Count is visible and readable (large enough)
- [ ] Count updates as globe rotates (reflecting new visible regions)
- [ ] Time indicator shows current local time (UTC or local?)

## Feature Testing: Time Travel
- [ ] Time slider appears (bottom or specified location)
- [ ] Slider is draggable and responds to input
- [ ] Dragging updates globe dots to reflect past/future
- [ ] Count updates correctly when time changes
- [ ] Can scrub back at least 24 hours
- [ ] Can scrub forward back to "now"
- [ ] Time display updates with slider position

## Feature Testing: Visual Quality
- [ ] Globe is "fun to play with" (subjective but important)
- [ ] No visual glitches or z-fighting
- [ ] Smooth animations (if any)
- [ ] Text is readable (time labels, count)
- [ ] Overall aesthetic matches design spec

## Bug Testing
- [ ] No crashes when rotating globe
- [ ] No crashes when zooming
- [ ] No crashes when scrubbing time slider
- [ ] No visual artifacts on zoom/pan
- [ ] No memory leaks (check DevTools heap)

## Performance Testing
- [ ] First load time < 3 seconds
- [ ] Frame rate >= 30 FPS (target 60)
- [ ] No jank during interactions
- [ ] Reasonable memory usage (< 500MB)

## Edge Cases
- [ ] Zoom all the way in (at poles)
- [ ] Zoom all the way out (full Earth)
- [ ] Scrub to oldest time (24 hours ago)
- [ ] Scrub to newest time (now)
- [ ] Rotate to view both day and night sides
- [ ] Rotate to view high-population regions (Asia, Europe)

## Sign-Off Criteria
✅ **PASS** if:
- All feature tests pass
- No critical bugs
- FPS >= 30
- It's fun to interact with

❌ **FAIL** if:
- Core features don't work (globe, dots, time travel)
- Crashes occur
- FPS < 15
- Design doesn't match spec

---

*Testing will begin as soon as code is ready. Target: Complete testing by 7:30am ET.*
