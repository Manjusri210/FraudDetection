import os
import sys
import json
import pandas as pd
import numpy as np
import joblib
from datetime import date
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report, accuracy_score, precision_score,
    recall_score, f1_score, confusion_matrix, roc_auc_score, average_precision_score
)

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

from dataset.generate_dataset import generate_fraud_dataset

MODEL_VERSION = "1.0.0"


def train():
    dataset_path = os.path.join(project_root, 'dataset', 'transactions_dataset.csv')
    if not os.path.exists(dataset_path):
        print("Dataset not found. Generating dataset (5,000 rows)...")
        df = generate_fraud_dataset(num_samples=5000)
        os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
        df.to_csv(dataset_path, index=False)
        print(f"Dataset saved to {dataset_path}")
    else:
        df = pd.read_csv(dataset_path)
        print(f"Dataset loaded: {len(df)} rows")

    print(f"\nClass distribution:\n{df['is_fraud'].value_counts().to_string()}")
    fraud_rate = df['is_fraud'].mean() * 100
    print(f"Fraud rate: {fraud_rate:.1f}%\n")

    # Feature engineering
    df['amount_to_avg_ratio'] = df['amount'] / (df['average_amount'] + 1e-5)

    X = df.drop(columns=['is_fraud'])
    y = df['is_fraud']

    num_features = ['amount', 'account_age', 'transaction_frequency', 'average_amount',
                    'failed_attempts', 'previous_fraud_history', 'amount_to_avg_ratio']
    cat_features = ['device_type', 'payment_method', 'transaction_type', 'location']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_features)
        ]
    )

    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            random_state=42,
            class_weight='balanced',
            n_jobs=-1
        ))
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

    print("Training Random Forest Classifier...")
    model_pipeline.fit(X_train, y_train)

    y_pred = model_pipeline.predict(X_test)
    y_proba = model_pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    avg_prec = average_precision_score(y_test, y_proba)

    tn, fp, fn, tp = cm.ravel()

    print("\n================ MODEL EVALUATION METRICS ================")
    print(f"Accuracy:           {acc:.4f}  ({acc*100:.1f}%)")
    print(f"Precision:          {prec:.4f}  ({prec*100:.1f}%)")
    print(f"Recall:             {rec:.4f}  ({rec*100:.1f}%)")
    print(f"F1 Score:           {f1:.4f}  ({f1*100:.1f}%)")
    print(f"ROC-AUC:            {roc_auc:.4f}")
    print(f"Avg Precision:      {avg_prec:.4f}")
    print(f"\nConfusion Matrix:")
    print(f"  TN={tn}  FP={fp}")
    print(f"  FN={fn}  TP={tp}")
    print(f"\nFalse Negatives (missed fraud): {fn}")
    print(f"False Positives (false alarms):  {fp}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Fraud']))
    print("==========================================================\n")

    # Compute class distribution
    class_dist = df['is_fraud'].value_counts().to_dict()

    metrics = {
        'model_version': MODEL_VERSION,
        'algorithm': 'Random Forest Classifier',
        'n_estimators': 100,
        'max_depth': 12,
        'class_weight': 'balanced',
        'accuracy': round(float(acc), 4),
        'precision': round(float(prec), 4),
        'recall': round(float(rec), 4),
        'f1_score': round(float(f1), 4),
        'roc_auc': round(float(roc_auc), 4),
        'average_precision': round(float(avg_prec), 4),
        'confusion_matrix': cm.tolist(),
        'true_negatives': int(tn),
        'false_positives': int(fp),
        'false_negatives': int(fn),
        'true_positives': int(tp),
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'decision_threshold': 0.5,
        'high_risk_threshold': 0.65,
        'medium_risk_threshold': 0.35,
        'class_distribution': {
            'legitimate': int(class_dist.get(0, 0)),
            'fraud': int(class_dist.get(1, 0))
        },
        'dataset': f'Synthetic — transactions_dataset.csv ({len(df)} rows)',
        'evaluated_at': str(date.today()),
    }

    model_dir = os.path.abspath(os.path.join(current_dir, '..', 'model'))
    os.makedirs(model_dir, exist_ok=True)

    # Save metrics.json separately (for /metrics endpoint)
    metrics_file = os.path.join(model_dir, 'metrics.json')
    with open(metrics_file, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {metrics_file}")

    # Save model payload
    payload_to_save = {
        'pipeline': model_pipeline,
        'metrics': metrics,
        'num_features': num_features,
        'cat_features': cat_features,
    }
    model_file = os.path.join(model_dir, 'fraud_model.joblib')
    joblib.dump(payload_to_save, model_file)
    print(f"Model saved to {model_file}")


if __name__ == '__main__':
    train()
