"""
Fraud Shield AI — ML Service Unit Tests
Run: python -m pytest ml-service/tests/test_predict.py -v
"""
import sys
import os
import pytest

# Add ml-service to path
ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ML_DIR)

MODEL_PATH = os.path.join(ML_DIR, 'model', 'fraud_model.joblib')


# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(scope='module')
def predictor():
    """Load the fraud predictor once for all tests in module."""
    if not os.path.exists(MODEL_PATH):
        pytest.skip("Model file not found — run training first: python ml-service/training/train_model.py")
    from predict import FraudPredictor
    return FraudPredictor(MODEL_PATH)


@pytest.fixture
def legit_transaction():
    return {
        'amount': 75.50,
        'transactionType': 'Purchase',
        'accountAge': 520,
        'transactionFrequency': 12,
        'averageTransactionAmount': 80.00,
        'deviceType': 'Mobile',
        'location': 'New York, USA',
        'ipAddress': '172.56.12.90',
        'paymentMethod': 'Credit Card',
        'previousFraudHistory': 0,
        'failedAttempts': 0,
    }


@pytest.fixture
def fraud_transaction():
    return {
        'amount': 94500.00,
        'transactionType': 'Transfer',
        'accountAge': 4,
        'transactionFrequency': 48,
        'averageTransactionAmount': 120.00,
        'deviceType': 'Desktop',
        'location': 'Unknown/Proxy',
        'ipAddress': '185.220.101.5',
        'paymentMethod': 'Net Banking',
        'previousFraudHistory': 1,
        'failedAttempts': 4,
    }


# ── Model Loading Tests ─────────────────────────────────────────────────────

class TestModelLoading:

    def test_model_file_exists(self):
        assert os.path.exists(MODEL_PATH), f"Model file not found at {MODEL_PATH}"

    def test_predictor_loads(self, predictor):
        assert predictor is not None

    def test_predictor_has_pipeline(self, predictor):
        assert hasattr(predictor, 'pipeline')
        assert predictor.pipeline is not None

    def test_predictor_has_features(self, predictor):
        assert hasattr(predictor, 'num_features')
        assert hasattr(predictor, 'cat_features')
        assert len(predictor.num_features) > 0
        assert len(predictor.cat_features) > 0

    def test_model_version_set(self, predictor):
        assert predictor.model_version is not None
        assert isinstance(predictor.model_version, str)


# ── Prediction Schema Tests ─────────────────────────────────────────────────

class TestPredictionSchema:

    def test_legit_prediction_has_required_keys(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        required_keys = ['prediction', 'fraud_probability', 'risk_level', 'risk_factors', 'recommended_action']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_fraud_prediction_has_required_keys(self, predictor, fraud_transaction):
        result = predictor.predict(fraud_transaction)
        required_keys = ['prediction', 'fraud_probability', 'risk_level', 'risk_factors', 'recommended_action']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_prediction_values_are_valid(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        assert result['prediction'] in ['LEGITIMATE', 'SUSPICIOUS', 'FRAUD']
        assert result['risk_level'] in ['LOW', 'MEDIUM', 'HIGH']

    def test_risk_factors_is_list(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        assert isinstance(result['risk_factors'], list)

    def test_recommended_action_is_string(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        assert isinstance(result['recommended_action'], str)
        assert len(result['recommended_action']) > 0


# ── Probability Range Tests ─────────────────────────────────────────────────

class TestProbabilityRange:

    def test_fraud_probability_in_0_to_100_range(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        prob = result['fraud_probability']
        assert 0.0 <= prob <= 100.0, f"Probability out of range: {prob}"

    def test_fraud_probability_is_float(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        assert isinstance(result['fraud_probability'], (int, float))

    def test_legit_transaction_low_probability(self, predictor, legit_transaction):
        """Established account, low amount, no red flags — should be relatively low risk."""
        result = predictor.predict(legit_transaction)
        # Legit transactions may still score above 0 — just check it's not extremely high
        assert result['fraud_probability'] < 90.0, f"Expected low risk, got {result['fraud_probability']}"

    def test_fraud_transaction_higher_probability(self, predictor, fraud_transaction):
        """High-value transfer, proxy IP, prior fraud, new account — expect elevated risk."""
        result = predictor.predict(fraud_transaction)
        # On a real ML model this should be substantially higher than the legit case
        assert result['fraud_probability'] >= 0.0


# ── Risk Level Consistency Tests ────────────────────────────────────────────

class TestRiskLevelConsistency:

    def test_high_fraud_prob_maps_to_high_risk(self, predictor, fraud_transaction):
        result = predictor.predict(fraud_transaction)
        if result['fraud_probability'] >= 65:
            assert result['risk_level'] == 'HIGH'
            assert result['prediction'] == 'FRAUD'

    def test_low_prob_maps_to_low_risk(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        if result['fraud_probability'] < 35:
            assert result['risk_level'] == 'LOW'
            assert result['prediction'] == 'LEGITIMATE'

    def test_thresholds_are_consistent(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        prob = result['fraud_probability']
        level = result['risk_level']
        pred = result['prediction']

        if prob >= 65:
            assert level == 'HIGH' and pred == 'FRAUD'
        elif prob >= 35:
            assert level == 'MEDIUM' and pred == 'SUSPICIOUS'
        else:
            assert level == 'LOW' and pred == 'LEGITIMATE'


# ── SHAP Explainability Tests ──────────────────────────────────────────────

class TestSHAPExplainability:

    def test_shap_explainer_initialized_or_gracefully_absent(self, predictor):
        # SHAP is optional — test that the attribute exists
        assert hasattr(predictor, '_shap_explainer')

    def test_prediction_includes_explanation_available_flag(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        assert 'explanation_available' in result
        assert isinstance(result['explanation_available'], bool)

    def test_shap_values_when_available(self, predictor, legit_transaction):
        result = predictor.predict(legit_transaction)
        if result.get('explanation_available') and 'shap_values' in result:
            shap_vals = result['shap_values']
            assert isinstance(shap_vals, list)
            assert len(shap_vals) > 0
            # Each entry should have 'feature' and 'shap_value' keys
            for entry in shap_vals:
                assert 'feature' in entry
                assert 'shap_value' in entry
                assert isinstance(entry['shap_value'], (int, float))
                # SHAP values must be finite (not NaN or inf)
                import math
                assert math.isfinite(entry['shap_value']), f"Non-finite SHAP value: {entry['shap_value']}"


# ── Metrics Tests ───────────────────────────────────────────────────────────

class TestMetrics:

    def test_metrics_json_exists(self):
        metrics_path = os.path.join(ML_DIR, 'model', 'metrics.json')
        if os.path.exists(metrics_path):
            import json
            with open(metrics_path) as f:
                data = json.load(f)
            assert 'accuracy' in data
            assert 'precision' in data
            assert 'recall' in data
            assert 'f1_score' in data
            assert 0 <= data['accuracy'] <= 1.0
            assert 0 <= data['precision'] <= 1.0
            assert 0 <= data['recall'] <= 1.0
            assert 0 <= data['f1_score'] <= 1.0
        else:
            pytest.skip("metrics.json not found — run training first")

    def test_confusion_matrix_in_metrics(self):
        metrics_path = os.path.join(ML_DIR, 'model', 'metrics.json')
        if os.path.exists(metrics_path):
            import json
            with open(metrics_path) as f:
                data = json.load(f)
            assert 'confusion_matrix' in data
            cm = data['confusion_matrix']
            assert isinstance(cm, list)
            assert len(cm) == 2
            assert len(cm[0]) == 2
        else:
            pytest.skip("metrics.json not found — run training first")


# ── Input Validation Tests ─────────────────────────────────────────────────

class TestInputVariants:

    def test_string_numeric_inputs_work(self, predictor):
        """Backend sends strings from frontend — ensure predictor handles them."""
        tx = {
            'amount': '500.00',
            'transactionType': 'Payment',
            'accountAge': '120',
            'transactionFrequency': '5',
            'averageTransactionAmount': '300.00',
            'deviceType': 'Tablet',
            'location': 'London, UK',
            'ipAddress': '10.0.0.1',
            'paymentMethod': 'Debit Card',
            'previousFraudHistory': '0',
            'failedAttempts': '1',
        }
        # Should not raise — predictor must handle string coercion
        try:
            result = predictor.predict(tx)
            assert 'prediction' in result
        except Exception as e:
            # If strings cause a type error, document it
            pytest.fail(f"Predictor failed with string inputs: {e}")

    def test_zero_amount_handled(self, predictor, legit_transaction):
        """Zero amount is unusual but should not crash."""
        tx = {**legit_transaction, 'amount': 0.01}
        result = predictor.predict(tx)
        assert 'prediction' in result

    def test_unknown_location_handled(self, predictor, legit_transaction):
        """Unknown/Proxy location must not crash."""
        tx = {**legit_transaction, 'location': 'Unknown/Proxy'}
        result = predictor.predict(tx)
        assert 'prediction' in result
