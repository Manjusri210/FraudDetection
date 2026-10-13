import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Try to import SHAP — graceful fallback if not installed
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("WARNING: SHAP not installed. Explainability features disabled. Run: pip install shap")


FRAUD_THRESHOLD_HIGH = 0.65   # >= HIGH risk / FRAUD
FRAUD_THRESHOLD_MEDIUM = 0.35  # >= MEDIUM risk / SUSPICIOUS
MODEL_VERSION = "1.0.0"


class FraudPredictor:
    def __init__(self, model_path):
        payload = joblib.load(model_path)
        self.pipeline = payload['pipeline']
        self.metrics = payload.get('metrics', {})
        self.num_features = payload['num_features']
        self.cat_features = payload['cat_features']
        self.all_features = self.num_features + self.cat_features
        self.model_version = MODEL_VERSION

        # Load additional metrics from JSON file if available
        metrics_json_path = os.path.join(os.path.dirname(model_path), 'metrics.json')
        if os.path.exists(metrics_json_path):
            with open(metrics_json_path, 'r') as f:
                extra = json.load(f)
                self.metrics.update(extra)

        # Initialize SHAP explainer on the underlying classifier
        if SHAP_AVAILABLE:
            try:
                # Access the trained classifier from the pipeline
                classifier = self.pipeline.named_steps['classifier']
                # Build background data using a small sample of training features
                # We create a minimal background for the explainer
                self._shap_explainer = shap.TreeExplainer(classifier)
                print("SHAP TreeExplainer initialized successfully.")
            except Exception as e:
                self._shap_explainer = None
                print(f"WARNING: Could not initialize SHAP explainer: {e}")
        else:
            self._shap_explainer = None

    def _build_input_df(self, data):
        """Build a DataFrame row from raw input dict."""
        amount = float(data.get('amount', 0))
        avg_amount = float(data.get('averageTransactionAmount', 1))
        amount_to_avg_ratio = amount / (avg_amount + 1e-5)

        row = {
            'amount': amount,
            'account_age': float(data.get('accountAge', 0)),
            'transaction_frequency': float(data.get('transactionFrequency', 0)),
            'average_amount': avg_amount,
            'failed_attempts': float(data.get('failedAttempts', 0)),
            'previous_fraud_history': float(data.get('previousFraudHistory', 0)),
            'amount_to_avg_ratio': amount_to_avg_ratio,
            'device_type': str(data.get('deviceType', 'Desktop')),
            'payment_method': str(data.get('paymentMethod', 'Credit Card')),
            'transaction_type': str(data.get('transactionType', 'Payment')),
            'location': str(data.get('location', 'Unknown')),
        }
        return pd.DataFrame([row])

    def _get_risk_factors(self, data, probability):
        """Generate human-readable risk factor descriptions."""
        factors = []
        amount = float(data.get('amount', 0))
        avg_amount = float(data.get('averageTransactionAmount', 1))
        account_age = float(data.get('accountAge', 0))
        failed_attempts = float(data.get('failedAttempts', 0))
        freq = float(data.get('transactionFrequency', 0))
        prev_fraud = int(data.get('previousFraudHistory', 0))
        location = str(data.get('location', ''))
        tx_type = str(data.get('transactionType', ''))

        ratio = amount / (avg_amount + 1e-5)

        if ratio > 5:
            factors.append(f"Transaction amount (${amount:,.2f}) is {ratio:.1f}× the account's historical average — highly anomalous")
        elif ratio > 2:
            factors.append(f"Transaction amount (${amount:,.2f}) is {ratio:.1f}× the account's historical average — elevated")

        if prev_fraud == 1:
            factors.append("Account has a prior fraud incident on record — elevated inherent risk")

        if failed_attempts >= 4:
            factors.append(f"High number of failed authentication attempts ({int(failed_attempts)}) — possible account takeover attempt")
        elif failed_attempts >= 2:
            factors.append(f"Multiple failed login attempts ({int(failed_attempts)}) detected before this transaction")

        if account_age < 14:
            factors.append(f"Very new account ({int(account_age)} days old) — newly created accounts are higher risk")
        elif account_age < 60:
            factors.append(f"Relatively new account ({int(account_age)} days old)")

        if any(kw in location.lower() for kw in ['proxy', 'unknown', 'tor', 'vpn']):
            factors.append(f"Transaction originates from a suspicious or anonymized IP location: '{location}'")

        if freq > 40:
            factors.append(f"Unusually high transaction frequency ({int(freq)}/month) — possible automated activity")

        if tx_type in ['Transfer', 'Withdrawal'] and amount > 5000:
            factors.append(f"High-value {tx_type} transaction is a common fraud vector")

        return factors

    def _get_shap_explanation(self, df):
        """Return SHAP feature attributions for the given input row."""
        if self._shap_explainer is None:
            return None, None

        try:
            preprocessor = self.pipeline.named_steps['preprocessor']
            X_transformed = preprocessor.transform(df)
            shap_values = self._shap_explainer.shap_values(X_transformed)

            # shap_values is list of arrays [class_0, class_1] for binary classification
            if isinstance(shap_values, list) and len(shap_values) > 1:
                fraud_shap = shap_values[1][0]  # fraud class, first row
            else:
                fraud_shap = shap_values[0] if len(shap_values) == 1 else shap_values[0]

            base_value = float(self._shap_explainer.expected_value[1]) if isinstance(
                self._shap_explainer.expected_value, np.ndarray
            ) else float(self._shap_explainer.expected_value)

            # Get feature names from preprocessor
            try:
                feature_names = preprocessor.get_feature_names_out()
            except Exception:
                feature_names = [f"feature_{i}" for i in range(len(fraud_shap))]

            # Build sorted top-10 attributions
            contributions = []
            for name, value in zip(feature_names, fraud_shap):
                contributions.append({'feature': str(name), 'shap_value': round(float(value), 5)})

            contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)

            return contributions[:10], base_value
        except Exception as e:
            print(f"SHAP computation failed: {e}")
            return None, None

    def _get_recommendation(self, risk_level, probability):
        """Return an actionable recommendation based on risk level."""
        if risk_level == 'HIGH':
            return "Block transaction immediately and flag for urgent human review. Notify the account holder via registered contact and place a temporary hold."
        elif risk_level == 'MEDIUM':
            return "Flag for secondary review before processing. Request additional verification from the account holder. Do not block automatically."
        else:
            return "Transaction appears within normal parameters. Proceed with standard processing and monitoring."

    def predict(self, data):
        """Run fraud prediction with optional SHAP explanation."""
        df = self._build_input_df(data)

        # Get prediction
        proba = self.pipeline.predict_proba(df)[0]
        fraud_probability = float(proba[1])
        risk_score = round(fraud_probability * 100, 2)

        # Determine risk level and label
        if fraud_probability >= FRAUD_THRESHOLD_HIGH:
            risk_level = 'HIGH'
            prediction = 'FRAUD'
        elif fraud_probability >= FRAUD_THRESHOLD_MEDIUM:
            risk_level = 'MEDIUM'
            prediction = 'SUSPICIOUS'
        else:
            risk_level = 'LOW'
            prediction = 'LEGITIMATE'

        # Get risk factors (rule-based human-readable)
        risk_factors = self._get_risk_factors(data, fraud_probability)

        # Get SHAP explanation
        shap_contributions, shap_base = self._get_shap_explanation(df)

        result = {
            'prediction': prediction,
            'fraud_probability': round(fraud_probability * 100, 2),
            'risk_score': risk_score,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'recommended_action': self._get_recommendation(risk_level, fraud_probability),
            'model_version': self.model_version,
            'explanation_available': shap_contributions is not None,
            'metrics': {
                'accuracy': self.metrics.get('accuracy'),
                'precision': self.metrics.get('precision'),
                'recall': self.metrics.get('recall'),
                'f1_score': self.metrics.get('f1_score'),
            }
        }

        if shap_contributions is not None:
            result['shap_values'] = shap_contributions
            result['shap_base_value'] = round(shap_base, 5)

        return result
