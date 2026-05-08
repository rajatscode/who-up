# 🚀 Vercel Backup Deployment — If GitHub Pages Fails

**Deployment to Vercel takes 2 minutes. Do this NOW as insurance.**

---

## WHY BACKUP DEPLOYMENT

GitHub Pages is reliable, but:
- CDN hiccups can happen
- DNS delays can occur  
- If a judge's ISP has GitHub cached stale, they see old version

**Vercel is a different CDN.** If GitHub fails, Vercel works. Both can't fail simultaneously.

---

## QUICK START (2 minutes)

### 1. Install Vercel CLI (1 minute)

```bash
npm install -g vercel
# or
yarn global add vercel
```

### 2. Deploy (1 minute)

```bash
cd /Users/rmehndir/dev/rajat/who-up
vercel
```

**Answer the prompts:**
- "Which scope?" → Your personal account
- "Link to existing project?" → No (first time)
- "Project name?" → `who-up`
- "Directory to deploy?" → `.` (current directory)

**Result**: Get a URL like `https://who-up.vercel.app`

### 3. Test (30 seconds)

Open the Vercel URL in a browser. Confirm:
- [ ] Counter renders
- [ ] Wake wave visible
- [ ] Time-lapse works
- [ ] No console errors

---

## BACKUP DURING JUDGE DEMO

**Scenario**: Judge clicks your GitHub link, page is slow.

**Action**: 
1. Say: "Let me try the alternate deployment..." 
2. Open `https://who-up.vercel.app` in another tab
3. Judges see instant load
4. Demo continues seamlessly

---

## IF VERCEL ALSO FAILS

**Unlikely, but prepared:**

### Local Fallback
```bash
cd /Users/rmehndir/dev/rajat/who-up
python3 -m http.server 8000
# Open http://localhost:8000
```

Works if judge is on your network. Not ideal for remote.

### Screenshot Fallback
If both fail, you have screenshots of the 60-second demo flow in the documentation. Not ideal, but shows judges exactly what they'd see.

---

## DEPLOYMENT STATUS

**GitHub Pages**: ✅ https://rajatscode.github.io/who-up  
**Vercel**: ⏳ Deploy now (takes 2 min)  
**Local**: ✅ python3 -m http.server 8000

---

## GO-LIVE CHECKLIST

Before judges arrive:

- [ ] GitHub Pages URL loads instantly
- [ ] Vercel deployment complete and tested
- [ ] You can load both URLs on your device
- [ ] Local fallback ready (python server command memorized)
- [ ] Have both URLs copied to clipboard

If GitHub is slow, switch to Vercel. If both fail, run local. You're covered.

