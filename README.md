# Digital Fraud Detection System 🛡️⚡

An end-to-end, AI-powered **Real-Time Digital Fraud Detection** web application built using **React (Vite)**, **Node.js/Express**, **Python (Flask + Scikit-Learn)**, and **MongoDB**. The platform predicts transaction fraud risk, determines severity levels (`LOW`, `MEDIUM`, `HIGH`), and generates human-readable risk explanations.

---

## 🚀 Key Features

- **Real-Time ML Risk Assessment**: Submits transaction features (amount, account age, transaction frequency, failed attempts, device type, location anomaly, etc.) to a Random Forest classifier.
- **Explainable AI (XAI)**: Generates explicit, human-understandable reasons for flagged transactions (e.g. "Amount is 4.2x higher than account average", "Multiple failed security attempts").
- **Security Dashboard**: Visual metrics for Total Transactions, Legitimate vs Fraud Cases, Daily Volume Trends, and Risk Category Distributions.
- **Interactive Transaction Analysis (`/analyze`)**: Custom multi-input transaction form with instant demo preset buttons ("Legitimate Demo", "High-Risk Fraud Demo").
- **Alert Management Console (`/alerts`)**: Dedicated security alert feed for high-risk cases with review status tracking ("Mark as Reviewed").
- **Transaction Audit History (`/transactions`)**: Full queryable table supporting keyword search, multi-factor filtering, sorting, and pagination.
- **Analytics & Reporting (`/analytics`)**: Date window filters (Today, 7 Days, 30 Days, 3 Months, All Time) with breakdown charts by payment method and transaction type.
- **JWT & Password Security**: Bcrypt password hashing, JWT bearer authorization, protected routes, session persistence, and security headers (Helmet).
- **Responsive SaaS UI**: Dark Navy aesthetic optimized for desktop, tablet, and mobile browsers.

---

## 📐 Architecture & Technology Stack

```
                               ┌────────────────────────────────┐
                               │     React Frontend (Vite)      │
                               │  (React Router, Axios, Lucide) │
                               └───────────────┬────────────────┘
                                               │
                                               │ REST API (JWT Auth)
                                               ▼
┌─────────────────────────┐    ┌────────────────────────────────┐
│   MongoDB Database      │ ◄──┤    Node.js Express Backend     │
│ (Users & Transactions)  │    │   (Mongoose, Bcrypt, Helmet)   │
└─────────────────────────┘    └───────────────┬────────────────┘
                                               │
                                               │ HTTP POST /predict
                                               ▼
                               ┌────────────────────────────────┐
                               │   Python ML Service (Flask)    │
                               │ (Scikit-Learn Random Forest)   │
                               └────────────────────────────────┘
```

| Component | Technology / Library |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Axios, Lucide React Icons |
| **Backend** | Node.js v24, Express.js, Mongoose, JWT, BcryptJS, Helmet, Rate-Limit |
| **ML Engine** | Python 3.11, Flask, Flask-CORS, Scikit-Learn, Pandas, NumPy, Joblib |
| **Database** | MongoDB Server |

---

## 📁 Project Structure

```
digital-fraud-detection/
├── frontend/                 # React Vite Single Page App
│   ├── src/
│   │   ├── components/       # Navbar, Footer, StatsCard, ResultCard, CustomChart, RiskBadge
│   │   ├── context/          # AuthContext (JWT & session state)
│   │   ├── pages/            # Landing, Login, Register, Dashboard, Analyze, Transactions, Alerts, Analytics, Profile
│   │   ├── services/         # Axios API instance with JWT interceptor
│   │   ├── App.jsx           # Router configuration & protected routes
│   │   └── main.jsx
│   └── package.json
│
├── backend/                  # Node.js Express REST API
│   ├── config/               # Database connection setup
│   ├── controllers/          # Auth, Transaction, Analytics, Alert, Profile handlers
│   ├── middleware/           # Auth protection middleware
│   ├── models/               # User and Transaction Mongoose schemas
│   ├── routes/               # API route definitions
│   ├── seed.js               # Database demo seeder script
│   ├── server.js             # Express app entrypoint
│   └── package.json
│
├── ml-service/               # Python Flask ML Service
│   ├── model/                # Saved fraud_model.joblib classifier
│   ├── training/             # Scikit-Learn training pipeline script
│   ├── app.py                # Flask REST API server (/health, /predict)
│   ├── predict.py            # Prediction & explainability engine
│   └── requirements.txt
│
├── dataset/                  # Synthetic training dataset generator
│   └── generate_dataset.py
│
└── README.md
```

---

## ⚙️ Environment Variables Setup

Create `.env` inside `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fraud_detection
JWT_SECRET=fraud_detection_secret_key_jwt_2026_secure
ML_SERVICE_URL=http://127.0.0.1:5001
NODE_ENV=development
```

---

## ⚡ Quick Start Guide

### 1. Database & Seed Setup
Ensure MongoDB server is running on `mongodb://127.0.0.1:27017/`.

Run seed script to populate initial demo user and transactions:
```bash
cd backend
npm install
node seed.js
```

> **Demo User Credentials**:
> - Email: `demo@frauddetection.com`
> - Password: `Password123!`

---

### 2. Train & Launch ML Service
```bash
# From project root
python -m pip install -r ml-service/requirements.txt

# Train Random Forest Classifier
python ml-service/training/train_model.py

# Start Flask ML REST API (Port 5001)
python ml-service/app.py
```

---

### 3. Launch Backend API
```bash
cd backend
npm run dev
# Starts backend server on http://localhost:5000
```

---

### 4. Launch Frontend Web App
```bash
cd frontend
npm install
npm run dev
# Starts React app on http://localhost:3000
```

---

## 🔌 API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Authenticate & obtain JWT
- `GET /api/auth/me` - Fetch active user profile

### Transactions
- `POST /api/transactions/analyze` - Analyze transaction via ML Engine & save result
- `GET /api/transactions` - List transactions (Search, Filter, Sort, Paginate)
- `GET /api/transactions/:id` - Fetch transaction details & risk factors
- `DELETE /api/transactions/:id` - Delete transaction record

### Analytics & Alerts
- `GET /api/analytics/summary` - Aggregate metrics (Total, Fraud Rate, Average Amount)
- `GET /api/analytics/trends` - Daily transaction volume & fraud trends
- `GET /api/analytics/risk-distribution` - Risk breakdown by payment method & type
- `GET /api/alerts` - List pending high-risk alerts
- `PATCH /api/alerts/:id/review` - Update alert reviewed status

---

## 📊 Limitations & Future Improvements

- **Real-Time Streaming**: Integrate Apache Kafka / Redis for sub-millisecond event streaming.
- **SHAP / LIME Integration**: Expand feature explainability with SHAP value visual waterfall charts.
- **Biometric Device Profiling**: Capture canvas fingerprinting and IP location geolocation APIs.
