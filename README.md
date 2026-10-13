# Fraud Shield AI
### *Detect Risk. Explain Decisions. Prevent Fraud.*

> **ZERO ORIGIN 2026 — Round 2 Submission**  
> AI-powered digital fraud detection and investigation platform with explainable ML, real-time monitoring, batch analysis, and an enterprise-grade dark cybersecurity UI.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│          FRAUD SHIELD AI — SYSTEM ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────┐                           │
│  │   React Frontend (Vite)          │  http://localhost:3000    │
│  │   Dark cybersecurity UI          │                           │
│  │   React Router v6 + Lucide Icons │                           │
│  └──────────────┬───────────────────┘                           │
│                 │  REST API /api/* (JWT Bearer)                  │
│                 ▼                                               │
│  ┌──────────────────────────────────┐                           │
│  │   Node.js + Express Backend      │  http://localhost:5000    │
│  │   JWT Auth + bcrypt + Helmet     │                           │
│  │   Rate limiting + CORS           │                           │
│  └──────┬─────────────┬─────────────┘                           │
│         │             │                                          │
│         ▼             ▼                                          │
│  ┌──────────┐  ┌──────────────────────────────────┐            │
│  │ MongoDB  │  │   Python Flask ML Service         │            │
│  │ :27017   │  │   http://localhost:5001            │            │
│  │ Mongoose │  │   Scikit-Learn Random Forest      │            │
│  └──────────┘  │   SHAP TreeExplainer (optional)   │            │
│                └──────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Status | Details |
|---|---|---|
| **Transaction Risk Analysis** | ✅ | Real ML prediction via Random Forest |
| **SHAP Explainability** | ✅ | Per-prediction feature attributions (when SHAP available) |
| **Fraud Risk Score** | ✅ | 0–100% probability + LOW/MEDIUM/HIGH classification |
| **Rule-Based Fallback** | ✅ | Works without ML service (heuristic engine) |
| **Batch CSV Analysis** | ✅ | Upload, validate, analyze up to 500 transactions, export results |
| **Live Transaction Monitor** | ✅ | Simulated real-time stream with high-risk alerts |
| **Fraud Network Graph** | ✅ | Interactive SVG visualization of account relationships |
| **Investigation Center** | ✅ | Case list, detail view, mark reviewed, analyst notes |
| **Model Insights** | ✅ | Real metrics, confusion matrix, feature importance, ROC-AUC |
| **Analytics Dashboard** | ✅ | Trends, risk distribution, KPI cards |
| **Demo Mode** | ✅ | 6 hackathon scenarios (Normal, High Fraud, Account Takeover, etc.) |
| **JWT Authentication** | ✅ | Register, login, protected routes |
| **Automated Tests (Python)** | ✅ | pytest test suite for ML service |

---

## ML Model Performance

> ⚠️ **These metrics are from synthetic training data.** Real-world performance on actual financial transaction data will differ significantly.

| Metric | Value | Notes |
|---|---|---|
| **Accuracy** | 96.2% | Misleading on imbalanced data — see below |
| **Precision** | 60.0% | % of fraud flags that are real fraud |
| **Recall** | 57.5% | % of actual frauds caught |
| **F1 Score** | 58.7% | Harmonic mean of precision & recall |
| **ROC-AUC** | 91.2% | Threshold-independent discrimination |
| Algorithm | Random Forest (100 trees, max_depth=12) | |
| Training samples | 4,000 | Stratified split 80/20 |
| Class imbalance handling | `class_weight='balanced'` | |

**Why accuracy can be misleading:** If 85% of transactions are legitimate, a model always predicting "Legitimate" achieves 85% accuracy without catching a single fraud. F1 Score and ROC-AUC are the proper metrics for fraud detection.

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Python 3.11
- MongoDB (local, port 27017)

### 1. Clone & Configure Backend

```bash
cd backend
cp ../.env.example .env
# Edit .env — set your JWT_SECRET
npm install
node server.js
```

### 2. Train & Start ML Service

```bash
cd ml-service
pip install -r requirements.txt
# Train model (generates fraud_model.joblib + metrics.json)
python training/train_model.py
# Start Flask service
python app.py
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Demo Credentials

```
Email:    demo@frauddetection.com
Password: Password123!
```

Or register a new account at `/register`.

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + receive JWT |
| GET | `/api/auth/me` | Get current user profile |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transactions/analyze` | Single transaction ML prediction |
| POST | `/api/transactions/batch-analyze` | Batch analysis (up to 500 rows) |
| GET | `/api/transactions` | List transactions (search, filter, paginate) |
| GET | `/api/transactions/:id` | Get transaction detail |
| DELETE | `/api/transactions/:id` | Delete transaction |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/summary` | KPI summary (range: today/7days/30days/3months) |
| GET | `/api/analytics/trends` | Daily transaction volume trends |
| GET | `/api/analytics/risk-distribution` | Risk breakdown by category |

### Alerts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/alerts` | List alerts (filter by reviewed status) |
| PATCH | `/api/alerts/:id/review` | Mark alert as reviewed |

### Model
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/model/metrics` | Model evaluation metrics (proxies Flask) |
| GET | `/api/model/status` | ML service health + SHAP availability |
| GET | `/api/health` | System health (DB + ML service status) |

---

## ML Service Endpoints

Flask service running at `http://localhost:5001`:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Model status + SHAP availability |
| POST | `/predict` | Single transaction prediction + SHAP |
| POST | `/predict/batch` | Batch prediction (array of transactions) |
| GET | `/metrics` | Saved evaluation metrics (metrics.json) |

---

## Batch CSV Format

Upload a CSV with these exact column headers:

```
amount,transactionType,accountAge,transactionFrequency,averageTransactionAmount,
deviceType,location,ipAddress,paymentMethod,previousFraudHistory,failedAttempts
```

Use the **Download Template** button in the Batch Analysis page to get a pre-formatted template.

**Limits:** Max 500 rows per upload, max 5 MB file size.

---

## Risk Scoring Logic

```
fraud_probability ≥ 65% → HIGH risk → FRAUD prediction
fraud_probability 35–64% → MEDIUM risk → SUSPICIOUS prediction
fraud_probability < 35% → LOW risk → LEGITIMATE prediction
```

The model applies `class_weight='balanced'` to handle the class imbalance inherent in fraud datasets. The 65% threshold (not the default 50%) was chosen to reduce false positives.

---

## Project Structure

```
FraudDetection/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Auth, Toast, Theme contexts
│   │   ├── layouts/       # AppLayout with sidebar + header
│   │   ├── pages/         # 14 page components
│   │   ├── services/      # Axios API client
│   │   └── styles/        # Dark cybersecurity CSS design system
│   └── public/
├── backend/               # Node.js + Express API
│   ├── controllers/       # Request handlers
│   ├── middleware/         # JWT auth, error handling
│   ├── models/            # Mongoose schemas
│   └── routes/            # API route definitions
├── ml-service/            # Python Flask ML service
│   ├── app.py             # Flask endpoints
│   ├── predict.py         # FraudPredictor class + SHAP
│   ├── model/             # fraud_model.joblib + metrics.json
│   ├── training/          # train_model.py
│   └── tests/             # pytest test suite
└── dataset/               # Synthetic dataset generation
```

---

## Running Tests

```bash
# Python ML service tests
cd FraudDetection
python -m pytest ml-service/tests/test_predict.py -v

# Expected output: ~20 tests covering model loading, prediction schema,
# probability ranges, SHAP explainability, and metrics validation
```

---

## Known Limitations

1. **Synthetic data only** — Model trained on programmatically generated data. Performance on real-world financial transactions is unknown and likely lower.
2. **SHAP availability** — SHAP requires pandas DLL access. On environments with strict Application Control policies, SHAP will fall back gracefully (predictions still work; SHAP values not returned).
3. **Session-only notes** — Analyst notes in Investigation Center are not persisted to MongoDB in this version.
4. **Frontend-only simulation** — Live Monitor and Fraud Network use demo/synthetic data; they do not stream real transactions.
5. **Single-user context** — Analytics and transaction history are scoped to the logged-in user.

---

## Future Improvements

- **Real transaction data** — Connect to a real payment processor sandbox (Stripe, Razorpay test mode)
- **Persistent investigation notes** — Add notes field to Transaction schema
- **Anomaly detection** — Add Isolation Forest for unsupervised pattern detection
- **WebSocket streaming** — Real-time push for live monitor instead of polling
- **Model retraining pipeline** — Automated retraining when new labeled data is available
- **Role-based access** — Admin vs. Analyst vs. Read-only roles

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router v6, Lucide React, Custom CSS |
| Backend | Node.js 18, Express 4, Mongoose 8, JWT, bcrypt, Helmet |
| Database | MongoDB (local) |
| ML Service | Python 3.11, Flask 2.3, Scikit-Learn, Pandas, NumPy, SHAP |
| ML Model | Random Forest Classifier (100 estimators, max_depth=12) |
| Dev Tools | Vite, nodemon, pytest |

---

*Built for ZERO ORIGIN 2026 — Fraud Shield AI*
