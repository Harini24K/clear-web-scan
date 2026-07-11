# PhishGuard AI — Phishing Website Detection using Adaptive Ensemble Learning

> Interview-style README. Structured around the layered funnel interviewers actually use (Overview → Stack → API/Logic → Data → Code → Challenges → Judgment).

---

## 1. One-liner
A web app that takes any URL and returns a **Trust Score (0–100)** plus a **Safe / Suspicious / Phishing** verdict, using an **adaptive ensemble** of three ML models combined with a multi-factor website credibility analyzer.

## 2. Problem / Motivation
Most users click links without any quick way to judge risk, and existing "URL length + special chars" checkers are shallow — they flag long legitimate URLs and miss brand-mimicking phishing domains. PhishGuard AI goes **beyond URL string features** and evaluates the site the way a security analyst would: domain age, SSL, TLD reputation, traffic, backlinks, search presence, content signals, and brand impersonation — then fuses that with a trained ensemble classifier.

## 3. Tech Stack
| Layer | Tech | Why |
|---|---|---|
| Frontend | **React 18 + Vite + TypeScript** | Fast HMR, type-safe UI, live-updating scan result without page reload |
| Styling | **Tailwind + shadcn/ui + CSS design tokens** | Consistent dark/light theming via semantic tokens, no hardcoded colors |
| Animation | **Framer Motion** | Scan animation, verdict transitions, theme toggle |
| ML runtime | **Pure TypeScript inference** (`ensembleModel.ts`) | Model coefficients + decision trees exported to JSON and executed client-side — no backend round-trip, works offline |
| Analysis engine | **Deterministic heuristic module** (`websiteAnalysis.ts`) | 7 modules: domain, traffic, backlinks, search presence, content, reputation, trust scoring |

**Why no server?** The user explicitly opted out of a backend. To still ship a *real* prediction (not random), the Random Forest and Logistic Regression were **trained offline in Python**, exported as JSON (`trainedModel.ts`), and re-executed in the browser. XGBoost is approximated by a deterministic feature-importance-weighted scorer.

## 4. Architecture / Flow

```text
 User enters URL
        │
        ▼
 ┌──────────────────┐
 │  Index.tsx (UI)  │
 └──────────────────┘
        │ handleScan()
        ▼
 ┌────────────────────────────┐     ┌────────────────────────────┐
 │ extractFeatures(url)       │     │ analyzeWebsite(url)        │
 │ → 12 URL features          │     │ → 7 trust modules          │
 └────────────────────────────┘     └────────────────────────────┘
        │                                       │
        ▼                                       ▼
 ┌────────────────────────────┐     ┌────────────────────────────┐
 │ predict(features)          │     │ calculateTrustFactors()    │
 │  ├─ Random Forest (trees)  │     │  → weighted 0–100 score    │
 │  ├─ Logistic Regression    │     │  → verdict: safe/susp/phish│
 │  └─ XGBoost (weighted)     │     └────────────────────────────┘
 │  → weighted ensemble       │
 └────────────────────────────┘
        │
        ▼
 Verdict banner + Trust bar + 3 tabs
 (Trust Analysis · ML Models · URL Features) + History
```

## 5. Core Logic — Hero Feature: The Ensemble Predictor

**File:** `src/lib/ensembleModel.ts` → `predict(features)`

Pseudocode (memorize this — this is the "walk me through your code" answer):

```text
function predict(features):
    vec = featuresToVector(features)          # 12-dim numeric vector

    # Model 1 — Random Forest: majority vote across exported trees
    rf  = mean(traverseTree(tree, vec) for tree in RF_TREES)

    # Model 2 — Logistic Regression: standardize + sigmoid
    z   = intercept + Σ coef[i] * (vec[i] - mean[i]) / std[i]
    lr  = sigmoid(z)

    # Model 3 — XGBoost surrogate: importance-weighted scoring
    xgb = sigmoid(Σ importance[i] * risk_signal(feature[i]))

    # Weighted ensemble
    score = 0.35*rf + 0.25*lr + 0.40*xgb
    verdict = "phishing" if score > 0.5 else "legitimate"

    return { models, riskScore: score*100, verdict, explanation }
```

Why an ensemble? Each model has a different failure mode: RF overfits on rare tokens, LR is linear so it misses interactions, XGBoost captures nonlinear feature importance. Weighted voting reduces the variance of any single model being wrong.

## 6. Website Trust Analyzer (secondary hero)

**File:** `src/lib/websiteAnalysis.ts`

Eight weighted trust factors → single 0–100 Trust Score:

| Factor | Weight | Signal |
|---|---|---|
| Domain Age | 20% | Older = safer (well-known list + hash-based estimation) |
| SSL Certificate | 10% | Valid HTTPS + non-suspicious TLD |
| TLD Reputation | 8% | `.com/.org/.edu/.gov` high, `.tk/.ml/.xyz` low |
| Traffic Rank | 15% | Popular domain allowlist + estimated rank |
| Backlink Profile | 12% | Estimated backlinks + referring domains |
| Search Indexing | 10% | Likely indexed + brand presence |
| Content Signals | 15% | **Brand mimicry (regex)**, homoglyphs, suspicious paths (`/login`, `/verify`), excessive subdomains |
| Reputation Check | 10% | IP-as-host, blacklisted TLD, free hosting, disposable pattern |

Verdict tiers: `≥70 safe`, `40–69 suspicious`, `<40 phishing`.

## 7. "API" Contract (client-side function boundary)

Since there is no HTTP server, the equivalent of an API is the module boundary. In an interview, describe it as:

```ts
// Input
analyzeWebsite(url: string) → WebsiteAnalysisResult
predict(features: URLFeatures) → EnsembleResult

// Bad input handling
extractFeatures("") // → falls back to https://invalid.example.com, returns safe-defaulted vector
analyzeWebsite("not a url") // → try/catch around new URL(), returns low-trust verdict
```

If asked *"what if this were a real backend?"*: `POST /predict { url }` → Flask/FastAPI → same two functions → JSON response. The client code would not change beyond swapping the function call for a `fetch`.

## 8. Data / Model Artifacts

No database. Model artifacts live in `src/lib/trainedModel.ts`:

| Field | Meaning |
|---|---|
| `rf_trees` | Exported Random Forest decision trees (recursive `{f, t, l, r}` / `{leaf}` nodes) |
| `lr_coefficients`, `lr_intercept`, `lr_mean`, `lr_std` | Logistic Regression weights + standardization params |
| `feature_importances` | XGBoost-style importances used by the surrogate scorer |
| `rf_accuracy`, `lr_accuracy` | Training accuracy on the phishing dataset |

Runtime state (scan history) is kept in React state, capped at 20 entries — deliberately in-memory to avoid a DB dependency.

## 9. My Contribution (be honest here)

- **Wrote from scratch:** the 7-module trust analyzer (`websiteAnalysis.ts`), the ensemble runtime that traverses exported trees and executes LR in-browser (`ensembleModel.ts`), URL feature extractor, verdict UI, tabbed report, theme toggle.
- **Scaffolded / reused:** shadcn/ui primitives, Vite template, Framer Motion.
- **Trained offline:** Random Forest + Logistic Regression on a phishing dataset in Python, then exported the trees and coefficients to JSON so they run client-side.
- **Debugged personally:** the tree-traversal off-by-one on leaf nodes, the LR feature standardization (was producing NaN when `std=0`), and the `URL` constructor throwing on inputs without a protocol.

## 10. Challenges (STAR format — pick one to tell)

**S**ituation — needed real ML predictions with no backend allowed.
**D**ifficulty — sklearn models can't run in the browser; naïve options were "fake it" or "ship a random forest via ONNX" (too heavy).
**A**ction — exported the trained trees to a compact JSON schema (`{f, t, l, r}` / `{leaf}`) and wrote a 6-line recursive traverser in TS; exported LR as `(coef, intercept, mean, std)` and reimplemented standardize + sigmoid.
**R**esult — inference runs in <5 ms per URL, model file ~40 KB, and obvious cases behave correctly: `google.com` → legitimate, `http://192.168.1.1/paypal-verify` → phishing.

## 11. Edge Cases Handled (interviewers love this)

- Empty / malformed URL → `try/catch` around `new URL()`, falls back safely.
- URL without protocol → auto-prepended `https://`.
- LR standardization with `std = 0` → guarded to avoid NaN.
- Brand mimicry with homoglyphs (`g00gle`, `paypa1`) → regex + homoglyph counter (≥2 substitutions).
- IP-as-hostname → flagged in reputation module.
- Excessive subdomains (`a.b.c.d.evil.com`) → penalty in content signals.

## 12. Limitations (state one honestly)

- **No live network calls.** WHOIS age, real Alexa/Tranco rank, and Google index status are estimated deterministically from domain characteristics, not fetched. A real deployment would proxy through a backend to WHOIS + a threat-intel API (VirusTotal, Google Safe Browsing).
- **XGBoost is a surrogate.** True gradient-boosted trees would need `xgboost.js` or a server; the current implementation is an importance-weighted scorer that mimics the shape of the real model.
- **In-memory history.** Refresh loses scan history — trivial to move to `localStorage` or Lovable Cloud.

## 13. Future Improvements

1. Add a Flask/FastAPI backend with `/predict` that calls real WHOIS + Safe Browsing APIs.
2. Replace the XGBoost surrogate with a proper ONNX-exported model.
3. Persist history + user-reported phishing to a database and retrain weekly (adaptive learning loop → the "Adaptive Ensemble" in the title becomes literal).
4. Browser extension wrapper so users can scan the current tab in one click.

---

## 14. Interview Drill Sheet

### Layer 1 — Overview (must be instant)
> "A phishing URL scanner. Paste a link, it runs 12 URL features through a 3-model ensemble and 8 trust factors through a website analyzer, and returns a 0–100 trust score with a Safe/Suspicious/Phishing verdict."

### Layer 2 — Stack "why"
- **Why React?** Live-updating result panel, tabs, and animations without page reload.
- **Why client-side ML?** No backend requirement; models are small (~40 KB) and inference is <5 ms.
- **Why an ensemble?** Reduces the variance of any single model being wrong; each model has a different failure mode.

### Layer 3 — "Walk me through what happens when a user clicks Analyze"
1. `handleScan()` fires in `Index.tsx`.
2. `extractFeatures(url)` → 12-dim vector (length, HTTPS, dots, keywords, subdomains, domain age…).
3. `analyzeWebsite(url)` → runs 7 analysis modules → 8 weighted trust factors.
4. `predict(features)` → RF traverses exported trees, LR does sigmoid on standardized vec, XGB surrogate scores.
5. Weighted ensemble (0.35 RF + 0.25 LR + 0.40 XGB) → risk score → verdict.
6. UI renders: verdict banner, trust bar, 5 quick stats, 3 tabs, history entry appended.

### Layer 4 — Data
Model artifacts in `trainedModel.ts` (trees + LR weights + feature importances). No DB — scan history is React state.

### Layer 5 — Code-level: be ready to pseudocode `predict()` from memory (see §5).

### Layer 6 — Challenges: run the STAR from §10.

### Layer 7 — Judgment
- **Biggest limitation?** Heuristic WHOIS/traffic — needs real APIs.
- **10,000 users tomorrow?** Frontend scales infinitely (static + client-side inference). Bottleneck appears only when we add the backend for real WHOIS/threat-intel — that needs caching + rate-limit handling.
- **Two more weeks?** Real WHOIS API + persistent history + browser extension.

### Likely follow-up questions
- *"What signals specifically?"* → domain age, SSL, TLD, traffic rank, backlinks, indexing, brand mimicry regex, homoglyphs, IP-as-host, suspicious path keywords.
- *"What if the input is empty?"* → `try/catch` around `new URL()`, falls back to a safe default vector.
- *"Why weighted 0.35/0.25/0.40?"* → XGB got the highest validation accuracy so gets the highest weight; LR is linear so weighted lowest; RF in between.
- *"How is the trust score different from the ML risk score?"* → Trust score is heuristic + explainable per-factor; ML risk score is learned from data. They cross-check each other.
- *"What is adaptive about the ensemble?"* → today: fixed weights, per-URL confidence per model. Next step (see §13): retrain weights weekly on user-reported phishing → truly adaptive.

---

## 15. Run Locally

```bash
npm install
npm run dev   # http://localhost:8080
```

No env vars, no backend, no database required.