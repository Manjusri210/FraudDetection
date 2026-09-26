import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from predict import FraudPredictor
from training.train_model import train

app = Flask(__name__)
CORS(app)

model_path = os.path.join(current_dir, 'model', 'fraud_model.joblib')

# Train model if not present
if not os.path.exists(model_path):
    print("Model file not found. Running training process...")
    train()

try:
    predictor = FraudPredictor(model_path)
    print("ML Model loaded successfully into Flask service.")
except Exception as e:
    print(f"Error loading model: {e}")
    predictor = None

@app.route('/health', methods=['GET'])
def health():
    if predictor:
        return jsonify({
            "status": "HEALTHY",
            "service": "Fraud Detection ML Service",
            "model_loaded": True,
            "metrics": predictor.metrics
        }), 200
    else:
        return jsonify({
            "status": "UNHEALTHY",
            "service": "Fraud Detection ML Service",
            "model_loaded": False,
            "error": "Model failed to load"
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    if not predictor:
        return jsonify({"error": "ML Model is not initialized"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No transaction data provided in request body"}), 400

    try:
        result = predictor.predict(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting ML Flask Service on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
