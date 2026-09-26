import os
import sys
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Ensure dataset directory is accessible
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

from dataset.generate_dataset import generate_fraud_dataset

def train():
    dataset_path = os.path.join(project_root, 'dataset', 'transactions_dataset.csv')
    if not os.path.exists(dataset_path):
        print("Dataset not found. Generating dataset now...")
        df = generate_fraud_dataset(num_samples=5000)
    else:
        df = pd.read_csv(dataset_path)

    # Feature engineering
    df['amount_to_avg_ratio'] = df['amount'] / (df['average_amount'] + 1e-5)
    
    X = df.drop(columns=['is_fraud'])
    y = df['is_fraud']

    num_features = ['amount', 'account_age', 'transaction_frequency', 'average_amount', 'failed_attempts', 'previous_fraud_history', 'amount_to_avg_ratio']
    cat_features = ['device_type', 'payment_method', 'transaction_type', 'location']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_features)
        ]
    )

    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, class_weight='balanced'))
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Training Random Forest Classifier...")
    model_pipeline.fit(X_train, y_train)

    y_pred = model_pipeline.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    print("\n================ MODEL EVALUATION METRICS ================")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("\nConfusion Matrix:")
    print(cm)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    print("==========================================================\n")

    metrics = {
        'accuracy': round(float(acc), 4),
        'precision': round(float(prec), 4),
        'recall': round(float(rec), 4),
        'f1_score': round(float(f1), 4),
        'confusion_matrix': cm.tolist()
    }

    model_dir = os.path.abspath(os.path.join(current_dir, '..', 'model'))
    os.makedirs(model_dir, exist_ok=True)
    model_file = os.path.join(model_dir, 'fraud_model.joblib')

    payload_to_save = {
        'pipeline': model_pipeline,
        'metrics': metrics,
        'num_features': num_features,
        'cat_features': cat_features
    }

    joblib.dump(payload_to_save, model_file)
    print(f"Model and artifacts successfully saved to {model_file}")

if __name__ == '__main__':
    train()
