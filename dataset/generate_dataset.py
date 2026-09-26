import pandas as pd
import numpy as np
import os

def generate_fraud_dataset(num_samples=5000, random_state=42):
    np.random.seed(random_state)
    
    # Generate realistic transaction parameters
    amounts = np.random.exponential(scale=150, size=num_samples) + 5
    # Introduce some extreme high-value transactions
    high_val_idx = np.random.choice(num_samples, size=int(num_samples * 0.05), replace=False)
    amounts[high_val_idx] = np.random.uniform(1500, 10000, size=len(high_val_idx))
    
    avg_amounts = amounts * np.random.uniform(0.3, 1.8, size=num_samples)
    # For high fraud risk, average amount is much lower than current amount
    
    account_ages = np.random.randint(1, 1200, size=num_samples) # days
    transaction_frequencies = np.random.randint(1, 50, size=num_samples) # tx per month
    
    failed_attempts = np.random.choice([0, 1, 2, 3, 4, 5], size=num_samples, p=[0.70, 0.15, 0.08, 0.04, 0.02, 0.01])
    previous_fraud_history = np.random.choice([0, 1], size=num_samples, p=[0.93, 0.07])
    
    device_types = np.random.choice(['Mobile', 'Desktop', 'Tablet'], size=num_samples, p=[0.55, 0.35, 0.10])
    payment_methods = np.random.choice(['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'], size=num_samples, p=[0.35, 0.25, 0.20, 0.10, 0.10])
    transaction_types = np.random.choice(['Payment', 'Transfer', 'Withdrawal', 'Deposit', 'Purchase'], size=num_samples, p=[0.30, 0.25, 0.20, 0.10, 0.15])
    
    locations = np.random.choice(['New York, USA', 'London, UK', 'Mumbai, IN', 'Tokyo, JP', 'Berlin, DE', 'Sydney, AU', 'Toronto, CA', 'Unknown/Proxy'], size=num_samples)
    
    # Determine synthetic Fraud label based on combined risk heuristic + noise
    amount_ratio = amounts / (avg_amounts + 1)
    
    fraud_score = (
        (amount_ratio > 3.0).astype(int) * 35 +
        (failed_attempts >= 3).astype(int) * 30 +
        (previous_fraud_history == 1).astype(int) * 25 +
        (account_ages < 30).astype(int) * 15 +
        (transaction_frequencies > 35).astype(int) * 15 +
        (locations == 'Unknown/Proxy').astype(int) * 20 +
        np.random.normal(0, 10, size=num_samples)
    )
    
    is_fraud = (fraud_score > 45).astype(int)
    
    df = pd.DataFrame({
        'amount': np.round(amounts, 2),
        'account_age': account_ages,
        'transaction_frequency': transaction_frequencies,
        'average_amount': np.round(avg_amounts, 2),
        'failed_attempts': failed_attempts,
        'previous_fraud_history': previous_fraud_history,
        'device_type': device_types,
        'payment_method': payment_methods,
        'transaction_type': transaction_types,
        'location': locations,
        'is_fraud': is_fraud
    })
    
    output_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, 'transactions_dataset.csv')
    df.to_csv(file_path, index=False)
    print(f"Dataset generated successfully with {len(df)} samples ({is_fraud.sum()} fraudulent). Saved to: {file_path}")
    return df

if __name__ == '__main__':
    generate_fraud_dataset()
