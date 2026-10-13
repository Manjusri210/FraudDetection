import os
import sys
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from predict import FraudPredictor
from training.train_model import train

app = Flask(__name__)

# Allow frontend and backend origins
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:5000"]}})

model_path = os.path.join(current_dir, 'model', 'fraud_model.joblib')

# Train model if not present
if not os.path.exists(model_path):
    print("Model file not found. Running training process...")
    train()

try:
    predictor = FraudPredictor(model_path)
    print("ML Model loaded successfully into Flask service.")
except Exception as e:
    print(f"CRITICAL: Error loading model: {e}")
    predictor = None


@app.route('/health', methods=['GET'])
def health():
    if predictor:
        return jsonify({
            "status": "HEALTHY",
            "service": "Fraud Shield AI — ML Service",
            "model_loaded": True,
            "model_version": predictor.model_version,
            "shap_available": predictor._shap_explainer is not None,
            "metrics": predictor.metrics
        }), 200
    else:
        return jsonify({
            "status": "UNHEALTHY",
            "service": "Fraud Shield AI — ML Service",
            "model_loaded": False,
            "error": "Model failed to load"
        }), 500


@app.route('/metrics', methods=['GET'])
def metrics():
    """Expose saved model evaluation metrics."""
    if not predictor:
        return jsonify({"error": "Model not loaded"}), 500

    metrics_path = os.path.join(current_dir, 'model', 'metrics.json')
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r') as f:
            data = json.load(f)
        return jsonify(data), 200

    # Fallback: return from model payload
    return jsonify({
        **predictor.metrics,
        "model_version": predictor.model_version,
        "note": "metrics.json not found; returning stored training metrics"
    }), 200


@app.route('/predict', methods=['POST'])
def predict():
    """Single transaction prediction with SHAP explanation."""
    if not predictor:
        return jsonify({"error": "ML Model is not initialized"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No transaction data provided in request body"}), 400

    # Basic required field validation
    required = ['amount', 'transactionType', 'accountAge', 'transactionFrequency',
                 'averageTransactionAmount', 'deviceType', 'location', 'paymentMethod',
                 'previousFraudHistory', 'failedAttempts']

    missing = [f for f in required if f not in data or data[f] is None or data[f] == '']
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        result = predictor.predict(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Batch prediction — accepts array of transactions."""
    if not predictor:
        return jsonify({"error": "ML Model is not initialized"}), 500

    data = request.get_json()
    if not data or 'transactions' not in data:
        return jsonify({"error": "Request body must contain a 'transactions' array"}), 400

    transactions = data['transactions']
    if not isinstance(transactions, list):
        return jsonify({"error": "'transactions' must be an array"}), 400

    MAX_BATCH = 500
    if len(transactions) > MAX_BATCH:
        return jsonify({"error": f"Batch size exceeds maximum of {MAX_BATCH} transactions"}), 400

    results = []
    for i, txn in enumerate(transactions):
        try:
            result = predictor.predict(txn)
            # Strip SHAP values from batch results (too verbose)
            result.pop('shap_values', None)
            result.pop('shap_base_value', None)
            results.append({"index": i, "result": result, "error": None})
        except Exception as e:
            results.append({"index": i, "result": None, "error": str(e)})

    success_count = sum(1 for r in results if r['error'] is None)
    return jsonify({
        "total": len(transactions),
        "successful": success_count,
        "failed": len(transactions) - success_count,
        "results": results
    }), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting Fraud Shield AI ML Service on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
