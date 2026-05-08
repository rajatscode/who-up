# Who-Up: Deployment & Shipping Checklist

## Pre-Deployment (Code Ready)
- [ ] All source files in `/src`
- [ ] `public/` has all assets (textures, data)
- [ ] `.gitignore` configured correctly
- [ ] `package.json` with dependencies
- [ ] No build errors: `npm run build` succeeds
- [ ] No console errors in dev mode

## Deployment Steps (5 minutes)
1. **Build for production**:
   ```bash
   npm run build
   ```
   Output: `dist/` folder ready to deploy

2. **Test production build locally**:
   ```bash
   npx vite preview
   ```
   Open http://localhost:4173 and verify functionality

3. **Deploy to static host** (GitHub Pages, Vercel, Netlify, or simple HTTP server):
   ```bash
   # Option A: GitHub Pages (if repo is public)
   git push origin main
   # Settings → Pages → Deploy from branch (main/dist)
   
   # Option B: Local HTTP server
   cd dist && python3 -m http.server 8000
   ```

4. **Verify deployed version**:
   - [ ] App loads without errors
   - [ ] Globe renders
   - [ ] Awake dots visible
   - [ ] Interactions work (drag, scroll, time slider)
   - [ ] Count displays correctly
   - [ ] Time travel scrubs backward/forward

## Shipping (Final QA Sign-Off)
- [ ] QA tester: All tests PASS (see QA_CHECKLIST.md)
- [ ] Nemesis: No critical BS detected
- [ ] Performance: 60 FPS on Chrome, 30+ FPS on Firefox
- [ ] Visual: Matches design spec
- [ ] No crashes, no console errors

## Live Demo Link
**Will be provided here once deployed:**
```
[Link to live demo]
```

## Rollback Plan (If Needed)
- Keep previous commit: `git log --oneline | head -5`
- Revert: `git revert <commit-hash>`
- Re-deploy from previous version

---

*Target: Deployment complete by 7:45am ET, demo live by 8am ET.*
