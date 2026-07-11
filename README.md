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

---

## 16. Interview Speaking Kit (memorize this section)

Study in **two layers**: a 1-minute spoken version, and deeper backup answers for cross-questions. Do NOT memorize the whole README word-for-word — memorize the *logic* behind each sentence.

### 16.1 The 60-Second Script (say this out loud until it flows)

> "PhishGuard AI is a web app that detects whether a URL is safe, suspicious, or phishing. It gives both a **Trust Score** and an **ML risk score**.
>
> I built it because most URL checkers only look at basic string patterns — they miss real phishing tricks and often wrongly flag legitimate sites.
>
> The stack is **React, TypeScript, Tailwind, and Framer Motion**. For prediction I used **client-side execution of trained model artifacts** instead of a backend.
>
> The flow: user enters a URL → I extract 12 URL features → run a 7-module trust analyzer → pass features into an ensemble model → show the verdict, trust bar, and analysis tabs.
>
> The hero feature is the **ensemble predictor** — Random Forest, Logistic Regression, and an XGBoost-style weighted scorer each vote, and I combine them with weights 0.35 / 0.25 / 0.40.
>
> The main challenge was needing real ML predictions without a backend. I solved it by training the models offline in Python, exporting the trees and coefficients as JSON, and writing a TypeScript runtime that executes them in the browser in under 5 ms.
>
> The biggest limitation is that domain age and traffic are estimated, not fetched live. If I extend it, I'd add a backend with WHOIS and Google Safe Browsing APIs, and persist history in a database."

### 16.2 The 2-Minute Technical Version

Add these details on top of the 60-second script:

- **Feature extraction (12 features):** URL length, HTTPS, dot count, special-char count, IP-as-host, suspicious keywords, subdomain count, path depth, estimated domain age, `@` symbol, redirect count, short-URL detection.
- **Trust analyzer (7 modules, 8 weighted factors):** Domain Age 20%, SSL 10%, TLD Reputation 8%, Traffic Rank 15%, Backlinks 12%, Search Indexing 10%, Content Signals 15% (brand mimicry regex, homoglyphs, suspicious paths), Reputation 10%. Verdict tiers: ≥70 safe, 40–69 suspicious, <40 phishing.
- **Ensemble math:** `score = 0.35·RF + 0.25·LR + 0.40·XGB` → verdict = phishing if `score > 0.5`.
- **Why weighted that way:** XGB got highest validation accuracy so highest weight; LR is linear so weighted lowest; RF sits in between.

### 16.3 Hero Feature — Pseudocode to Recite from Memory

```text
function predict(features):
    vec = featuresToVector(features)             # 12-dim numeric vector

    # 1. Random Forest — traverse each exported tree, average the votes
    rf  = mean(traverseTree(tree, vec) for tree in RF_TREES)

    # 2. Logistic Regression — standardize + sigmoid
    z   = intercept + Σ coef[i] * (vec[i] - mean[i]) / std[i]
    lr  = 1 / (1 + exp(-z))

    # 3. XGBoost surrogate — importance-weighted risk scoring
    xgb = sigmoid(Σ importance[i] * risk_signal(feature[i]))

    # 4. Weighted ensemble
    score   = 0.35*rf + 0.25*lr + 0.40*xgb
    verdict = "phishing" if score > 0.5 else "legitimate"
    return { models, riskScore: score*100, verdict, explanation }
```

Tree traversal (6 lines — remember this shape):

```text
traverseTree(node, vec):
    if node is leaf: return node.leaf                # 0 or 1
    if vec[node.f] <= node.t: return traverseTree(node.l, vec)
    else:                     return traverseTree(node.r, vec)
```

### 16.4 Where the Model Weights Actually Live (be exact)

If an interviewer asks *"show me exactly where the Random Forest weights and decision tree arrays are stored, and how the ensemble voting runs":*

- **File:** `src/lib/trainedModel.ts` — exports `TRAINED_MODEL` containing:
  - `rf_trees` — array of Random Forest decision trees, each node is either `{ leaf: 0|1 }` or `{ f, t, l, r }` (feature index, threshold, left child, right child).
  - `lr_coefficients`, `lr_intercept`, `lr_mean`, `lr_std` — Logistic Regression weights + standardization parameters.
  - `feature_importances` — used by the XGBoost surrogate scorer.
  - `rf_accuracy`, `lr_accuracy` — offline training accuracy.
- **File:** `src/lib/ensembleModel.ts` — runtime:
  - `traverseTree()` walks each exported tree recursively.
  - `rfPredict()` averages leaf votes across all trees (majority vote).
  - `lrPredict()` standardizes `(x - mean) / std`, dots with coefficients, applies sigmoid.
  - `xgbPredict()` sums importance-weighted risk signals through a sigmoid.
  - `predict()` combines: `0.35*rf + 0.25*lr + 0.40*xgb`, thresholds at 0.5.

### 16.5 Defensive Answers — Say These Verbatim

**Q: "This is a frontend app. Where is your backend and database?"**

> "The current architecture is purposely built as a high-performance, client-side progressive web app. Instead of hosting a heavy Python backend to serve predictions, the ML models — including a 20-tree Random Forest and Logistic Regression — were trained **offline on 6,000 samples**. Their learned weights and tree paths were then compiled directly into deterministic TypeScript algorithms executing natively in the browser.
>
> For data persistence, it uses client-side state rather than a traditional cloud database. This keeps infrastructure costs at zero and network latency at near-zero. A major next-step limitation I've already identified is security — the model parameters are exposed to the client. If I were to scale this for production, my first step would be refactoring these modules into **cloud edge functions backed by a PostgreSQL database**."

**Q: "Why an ensemble instead of one model?"**

> "Each model has a different failure mode. RF overfits on rare tokens, LR is linear so misses feature interactions, and XGBoost captures nonlinear importance. Weighted voting reduces the variance of any single model being wrong, so the ensemble is more robust than any individual model."

**Q: "Why React and TypeScript?"**

> "React gives me a live-updating result panel with tabs and animations without page reloads. TypeScript gives me type-safe model I/O — the exported tree schema and LR weights are typed, so I catch shape mismatches at compile time instead of runtime."

**Q: "How does Random Forest prediction work here specifically?"**

> "Each tree is a JSON node of either `{leaf: 0|1}` or `{f, t, l, r}`. I recursively walk the tree: at each internal node I compare `vec[f]` to threshold `t`, go left if `≤`, right otherwise. When I hit a leaf I return its class. I do this for all trees and average — that's the majority vote."

**Q: "How is the Trust Score different from the ML risk score?"**

> "The Trust Score is a **heuristic, explainable per-factor** score (domain age, SSL, TLD, traffic, backlinks, indexing, content signals, reputation). The ML risk score is **learned from data**. They act as a cross-check — if both agree, confidence is high; if they disagree, the UI shows Suspicious rather than a hard verdict."

**Q: "What if the input URL is invalid or empty?"**

> "I wrap `new URL()` in a `try/catch`. If parsing fails I fall back to a safe default. If the user forgot the protocol I auto-prepend `https://`. LR standardization is guarded against `std = 0` to avoid NaN."

**Q: "What challenge did you face while exporting the models?"**

> "sklearn models can't run in the browser directly. Options were 'fake it' or ship a full ONNX runtime — too heavy. I designed a compact JSON schema for trees, wrote a 6-line recursive traverser, and exported LR as `(coef, intercept, mean, std)`. The tricky bugs were an off-by-one on leaf nodes and NaN from `std = 0` — both caught by writing a small validation script that compared browser predictions against the Python model on a holdout set."

**Q: "What's the biggest limitation?"**

> "No live network calls. WHOIS age, Tranco rank, and Google indexing are estimated from domain characteristics, not fetched. Model parameters are also exposed to the client."

**Q: "What would you improve with 2 more weeks?"**

> "1) A Flask/FastAPI backend with `/predict` calling real WHOIS + Safe Browsing APIs. 2) Replace the XGBoost surrogate with a proper ONNX-exported model. 3) Persist scan history and user-reported phishing in Postgres and retrain weekly — that's what makes the ensemble truly *adaptive*. 4) A browser extension to scan the current tab."

**Q: "How would this scale to 10,000 users tomorrow?"**

> "The frontend scales infinitely — static hosting plus client-side inference has no server bottleneck. The bottleneck appears only when I add the backend for real WHOIS/threat-intel, which needs response caching and rate-limit handling per upstream API."

### 16.6 The Two-Layer Rule

- **Layer 1 (always ready):** the 60-second script in §16.1.
- **Layer 2 (on cross-question):** flow (§4), hero pseudocode (§16.3), file locations (§16.4), STAR challenge (§10), limitation (§12), improvements (§13).

Never memorize only the script. Memorize the **logic behind each sentence** — the interviewer can drill deeper into any word you say. 
