import os
import pandas as pd
import numpy as np
import joblib

class FraudPredictor:
    def __init__(self, model_path):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}. Run train_model.py first.")
        
        data = joblib.load(model_path)
        self.pipeline = data['pipeline']
        self.metrics = data['metrics']
        self.num_features = data['num_features']
        self.cat_features = data['cat_features']

    def predict(self, transaction_data):
        """
        Accepts a dict of transaction feature values.
        Returns:
            dict containing prediction, fraud_probability, risk_level, risk_factors, recommended_action
        """
        amount = float(transaction_data.get('amount', 0))
        account_age = float(transaction_data.get('accountAge', 30))
        transaction_frequency = float(transaction_data.get('transactionFrequency', 1))
        average_amount = float(transaction_data.get('averageTransactionAmount', amount))
        failed_attempts = int(transaction_data.get('failedAttempts', 0))
        previous_fraud_history = int(transaction_data.get('previousFraudHistory', 0))
        device_type = str(transaction_data.get('deviceType', 'Desktop'))
        payment_method = str(transaction_data.get('paymentMethod', 'Credit Card'))
        transaction_type = str(transaction_data.get('transactionType', 'Payment'))
        location = str(transaction_data.get('location', 'Unknown/Proxy'))

        amount_to_avg_ratio = amount / (average_amount + 1e-5)

        input_df = pd.DataFrame([{
            'amount': amount,
            'account_age': account_age,
            'transaction_frequency': transaction_frequency,
            'average_amount': average_amount,
            'failed_attempts': failed_attempts,
            'previous_fraud_history': previous_fraud_history,
            'amount_to_avg_ratio': amount_to_avg_ratio,
            'device_type': device_type,
            'payment_method': payment_method,
            'transaction_type': transaction_types if 'transaction_types' in locals() else transaction_type,
            'location': location
        }])

        # Calculate prediction probability
        prob = self.pipeline.predict_proba(input_df)[0][1]
        prob_percent = round(float(prob) * 100, 1)

        # Risk level determination
        if prob_percent >= 65:
            risk_level = 'HIGH'
            prediction = 'FRAUD'
        elif prob_percent >= 35:
            risk_level = 'MEDIUM'
            prediction = 'SUSPICIOUS'
        else:
            risk_level = 'LOW'
            prediction = 'LEGITIMATE'

        # Explainability: Extract distinct risk factors based on feature thresholds & contributions
        risk_factors = []
        
        if amount_to_avg_ratio > 3.0:
            risk_factors.append(f"Unusual transaction amount (${amount:,.2f} is {amount_to_avg_ratio:.1f}x higher than account average)")
        elif amount > 2500 and average_amount < 500:
            risk_factors.append(f"High-value transaction (${amount:,.2f}) significantly above normal baseline")

        if failed_attempts >= 3:
            risk_factors.append(f"Multiple failed security/login attempts ({failed_attempts} attempts recorded)")
        elif failed_attempts >= 1:
            risk_factors.append(f"Previous failed attempt detected ({failed_attempts} attempt)")

        if previous_fraud_history == 1:
            risk_factors.append("Associated account has previous flagged fraud history")

        if account_age < 14:
            risk_factors.append(f"New account activity (Account age: {int(account_age)} days)")

        if transaction_frequency > 30:
            risk_factors.append(f"Abnormally high transaction frequency ({int(transaction_frequency)} txns/month)")

        if location in ['Unknown/Proxy', 'Proxy Network', 'TOR Node']:
            risk_factors.append("Transaction originates from suspicious or proxy IP location")

        if not risk_factors and risk_level == 'LOW':
            risk_factors.append("Normal behavior patterns; transaction amount, device, and location match historical profile")

        # Action recommendation based on risk
        if risk_level == 'HIGH':
            recommended_action = "Block transaction immediately and trigger secondary identity verification."
        elif risk_level == 'MEDIUM':
            recommended_action = "Flag for manual review and request 2FA OTP verification from user."
        else:
            recommended_action = "Approve transaction automatically; no suspicious anomalies detected."

        return {
            "prediction": prediction,
            "fraud_probability": prob_percent,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommended_action": recommended_action,
            "metrics": self.metrics
        }
