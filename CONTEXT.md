# Smart Symptom Pattern Alerts

A focused, Folia-aligned enhancement that detects unusual patterns and possible treatment–symptom relationships in user health logs, then surfaces concise, actionable alerts.

---

## 1) Purpose & Fit

* **Goal:** Help users notice non-obvious patterns (e.g., fatigue spikes 2–3 days after Treatment A) and prompt helpful next steps.
* **Why this fits Folia:** Folia’s mission is to make personal health data useful; this adds lightweight analytics on top of HRO-style logs without duplicating core features.
* **Hiring signal:** Shows proficiency with **Laravel/PHP, MySQL, REST**, pragmatic analytics, API design, data modeling, and a small **JS dashboard**. Bonus hooks for **Swift/Kotlin** clients.

---

## 2) Scope (MVP)

**Inputs**: User symptom logs (type, severity 0–10, timestamp), treatments (name, timestamp), optional notes/context.

**Output**: A ranked list of alerts per user, such as:

* *Spike alerts:* “Pain severity spiked above baseline on 3 of the last 7 days.”
* *Post-treatment pattern alerts:* “Fatigue increases within 48–72 hours after Treatment A (3/4 recent occurrences).”
* *Co-occurrence alerts (optional):* “Headache often co-occurs with nausea (65% of days with headache).”

**Non-goals (MVP):** Causal claims, medical advice, broad cohort analytics.

---

## 3) High-Level Architecture

* **Backend**: Laravel API + MySQL

  * CRUD for logs/treatments; background job to compute alerts; endpoints to fetch alerts.
* **Frontend (minimal)**: Small JS (React or vanilla) page to view alerts and sparkline trends.
* **Mobile (optional)**: Swift/Kotlin screens to list alerts and push notifications.
* **Batch cadence**: Recompute on new log/treatment or scheduled (e.g., every 6 hours).

```
Client (Web/iOS/Android) → Laravel REST API → MySQL
                                ↓ (Queue/Schedule)
                         Pattern Engine → Alerts table
```

---

## 4) Data Model (MySQL)

**users**

* `id` (PK), `email`, `password_hash`, timestamps

**symptom\_logs**

* `id` (PK), `user_id` (FK), `symptom` (ENUM/Text), `severity` (TINYINT 0–10), `notes` (Text NULL), `occurred_at` (DATETIME), timestamps
* Index: (`user_id`, `occurred_at`)

**treatments** (optional structuring)

* `id` (PK), `user_id` (FK), `name` (VARCHAR), `dose` (VARCHAR NULL), `administered_at` (DATETIME), timestamps
* Index: (`user_id`, `administered_at`)

**alerts**

* `id` (PK), `user_id` (FK), `type` (ENUM: `spike`, `post_treatment`, `co_occurrence`), `severity` (TINYINT 1–5), `summary` (VARCHAR), `details` (JSON), `generated_at` (DATETIME), `resolved_at` (DATETIME NULL)
* Index: (`user_id`, `generated_at` DESC)

---

## 5) API (Laravel Routes)

**Auth (simplified for demo)**

* `POST /auth/register` → email, password
* `POST /auth/login` → JWT

**Logs/Treatments**

* `POST /symptom-logs` → { symptom, severity, notes?, occurred\_at }
* `GET /symptom-logs?from&to&symptom`
* `POST /treatments` → { name, dose?, administered\_at }
* `GET /treatments?from&to&name`

**Alerts**

* `GET /alerts` → list current alerts (latest N)
* `POST /alerts/recompute` (admin/dev only)
* `POST /alerts/{id}/resolve` → mark resolved

**Example: POST /symptom-logs**

```json
{
  "symptom": "fatigue",
  "severity": 7,
  "notes": "after long day",
  "occurred_at": "2025-08-19T20:15:00Z"
}
```

**Example: GET /alerts (response)**

```json
[
  {
    "id": 91,
    "type": "post_treatment",
    "severity": 4,
    "summary": "Fatigue tends to increase 48–72h after Treatment A",
    "details": {
      "symptom": "fatigue",
      "treatment": "Treatment A",
      "window_hours": [48,72],
      "evidence": {"matches": 3, "trials": 4}
    },
    "generated_at": "2025-08-20T08:00:00Z"
  }
]
```

---

## 6) Pattern Engine (MVP Algorithms)

**A. Spike Detection (per symptom)**

* Baseline: rolling median (last 28 days) and MAD (median absolute deviation).
* Spike if `severity_today ≥ baseline + k * MAD` (start with `k=1.5`).
* Alert if spikes occur on ≥ `S` days in last `N` (e.g., `S=3` of `N=7`).

**B. Post-Treatment Pattern**

* For each treatment event T and symptom S, inspect window `[T+L, T+U]` hours (e.g., 24–72h).
* Compute proportion of windows showing above-baseline severity vs. matched control windows.
* Generate alert if proportion ≥ threshold (e.g., ≥ 0.6) and count ≥ min occurrences (e.g., ≥ 3).

**C. Co-occurrence (optional)**

* `P(symptom A | symptom B day)` vs `P(symptom A)` baseline.
* Alert if lift ≥ 1.5 and min support ≥ 5 days.

**Ranking**

* Map statistical strength + recency → `severity` \[1–5].

**Pseudocode (batch)**

```pseudo
for user in users:
  for symptom in symptoms(user):
    baseline = rolling_median(user, symptom, 28d)
    mad = rolling_mad(user, symptom, 28d)
    spikes = days_with(severity >= baseline + 1.5*mad, last 7d)
    if count(spikes) >= 3: create_or_update_alert(spike,...)
  for treatment in treatments(user, last 60d):
    for symptom in key_symptoms(user):
      hits, trials = evaluate_window(user, treatment, symptom, 24–72h)
      if trials >= 4 and hits/trials >= 0.6: create_or_update_alert(post_treatment,...)
```

---

## 7) Frontend (Mini Dashboard)

* **Alerts List**: grouped by type; show summary, severity chip, generated\_at.
* **Detail Drawer**: tiny sparkline of symptom over last 30 days + markers for treatments.
* **Actions**: resolve/dismiss alert; link to relevant logs.

---

## 8) Security & Privacy (Demo Level)

* JWT auth, user-scoped queries.
* Do not store PHI beyond what’s needed; keep sample data synthetic.
* Rate limiting on write endpoints; input validation; server-side timestamp sanity checks.
* Strong disclaimer: *Not medical advice; for demonstration only.*

---

## 9) Developer Setup

**Backend**

* Laravel 11, PHP ≥8.2, MySQL 8
* `.env` template (DB creds, JWT secret)
* `php artisan migrate --seed`
* `php artisan queue:work` (if using jobs) & `php artisan schedule:work`

**Frontend**

* Minimal React + Vite (or a Blade view) rendering `/alerts` with fetch + list UI.

**Testing**

* Unit tests: spike detector, window evaluator, alert ranking.
* HTTP tests: auth, CRUD, alerts fetch.
* Seed script creates \~3 users with 60 days of synthetic logs/treatments.

---

## 10) Stretch Goals (Nice-to-have)

* Push notifications (APNs/FCM) for new alerts (Swift/Kotlin client screens).
* Export alerts to CSV.
* User-configurable thresholds per symptom.
* Role `research_manager` that can view demo aggregates across synthetic users.
* Add simple Bayesian update for post-treatment confidence.

---

## 11) What This Demonstrates

* **Tech:** Laravel REST, MySQL schema design, background jobs, basic analytics, JS UI.
* **Product thinking:** Narrow, valuable enhancement consistent with Folia’s HRO vision.
* **Data literacy:** Baselines, robust outlier detection (median/MAD), windowed comparisons.
* **Pragmatism:** Clear MVP with safe defaults and room to grow.

---

## 12) Acceptance Criteria (MVP)

* Can create logs/treatments via API.
* Batch job generates at least two alert types on seeded data.
* `/alerts` returns ranked, human-readable alerts for the authenticated user.
* Mini dashboard lists alerts and opens details with a sparkline.
* All unit tests green; README shows setup & seed instructions.

---

## 13) Sample Seed Snippets

**Synthetic treatment**

```json
{"name":"Treatment A","administered_at":"2025-07-01T08:00:00Z"}
```

**Synthetic fatigue logs (excerpt)**

```json
[
  {"symptom":"fatigue","severity":3,"occurred_at":"2025-07-01T20:00:00Z"},
  {"symptom":"fatigue","severity":7,"occurred_at":"2025-07-03T20:00:00Z"},
  {"symptom":"fatigue","severity":6,"occurred_at":"2025-07-06T20:00:00Z"}
]
```

---

### Disclaimer

This demo is for educational/portfolio purposes only and does **not** provide medical advice.
