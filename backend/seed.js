const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fraud_detection';

const sampleLocations = [
  'New York, USA', 'London, UK', 'Mumbai, IN', 'Tokyo, JP',
  'Berlin, DE', 'Sydney, AU', 'Toronto, CA', 'Unknown/Proxy'
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections if desired
    await User.deleteMany({ email: 'demo@frauddetection.com' });
    
    // Create demo user
    const demoUser = await User.create({
      name: 'Demo Fraud Analyst',
      email: 'demo@frauddetection.com',
      password: 'Password123!',
      role: 'admin'
    });

    console.log(`Created demo user: ${demoUser.email} (Password: Password123!)`);

    // Delete previous transactions for demo user
    await Transaction.deleteMany({ userId: demoUser._id });

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Generate 35 realistic transactions spanning the past 14 days
    const demoTransactions = [
      {
        transactionId: 'TXN-9021-FRAUD',
        userId: demoUser._id,
        amount: 8550.00,
        transactionType: 'Transfer',
        accountAge: 5,
        transactionFrequency: 45,
        averageTransactionAmount: 180.00,
        deviceType: 'Desktop',
        location: 'Unknown/Proxy',
        ipAddress: '185.220.101.5',
        paymentMethod: 'Net Banking',
        transactionTime: new Date(now - 0.2 * day),
        previousFraudHistory: 1,
        failedAttempts: 4,
        prediction: 'FRAUD',
        fraudProbability: 92.4,
        riskLevel: 'HIGH',
        riskFactors: [
          'Unusual transaction amount ($8,550.00 is 47.5x higher than account average)',
          'Multiple failed security/login attempts (4 attempts recorded)',
          'Associated account has previous flagged fraud history',
          'New account activity (Account age: 5 days)',
          'Abnormally high transaction frequency (45 txns/month)',
          'Transaction originates from suspicious or proxy IP location'
        ],
        recommendedAction: 'Block transaction immediately and trigger secondary identity verification.',
        reviewed: false,
        createdAt: new Date(now - 0.2 * day)
      },
      {
        transactionId: 'TXN-8012-LEGIT',
        userId: demoUser._id,
        amount: 45.50,
        transactionType: 'Purchase',
        accountAge: 450,
        transactionFrequency: 12,
        averageTransactionAmount: 50.00,
        deviceType: 'Mobile',
        location: 'New York, USA',
        ipAddress: '172.56.21.89',
        paymentMethod: 'Credit Card',
        transactionTime: new Date(now - 0.5 * day),
        previousFraudHistory: 0,
        failedAttempts: 0,
        prediction: 'LEGITIMATE',
        fraudProbability: 4.2,
        riskLevel: 'LOW',
        riskFactors: [
          'Normal behavior patterns; transaction amount, device, and location match historical profile'
        ],
        recommendedAction: 'Approve transaction automatically; no suspicious anomalies detected.',
        reviewed: true,
        createdAt: new Date(now - 0.5 * day)
      },
      {
        transactionId: 'TXN-7519-SUSP',
        userId: demoUser._id,
        amount: 1450.00,
        transactionType: 'Withdrawal',
        accountAge: 120,
        transactionFrequency: 8,
        averageTransactionAmount: 300.00,
        deviceType: 'Tablet',
        location: 'London, UK',
        ipAddress: '82.165.197.1',
        paymentMethod: 'Debit Card',
        transactionTime: new Date(now - 1 * day),
        previousFraudHistory: 0,
        failedAttempts: 2,
        prediction: 'SUSPICIOUS',
        fraudProbability: 58.1,
        riskLevel: 'MEDIUM',
        riskFactors: [
          'Unusual transaction amount ($1,450.00 is 4.8x higher than account average)',
          'Previous failed attempt detected (2 attempts)'
        ],
        recommendedAction: 'Flag for manual review and request 2FA OTP verification from user.',
        reviewed: false,
        createdAt: new Date(now - 1 * day)
      },
      {
        transactionId: 'TXN-6420-FRAUD',
        userId: demoUser._id,
        amount: 4200.00,
        transactionType: 'Payment',
        accountAge: 12,
        transactionFrequency: 38,
        averageTransactionAmount: 120.00,
        deviceType: 'Desktop',
        location: 'Unknown/Proxy',
        ipAddress: '198.51.100.42',
        paymentMethod: 'UPI',
        transactionTime: new Date(now - 2 * day),
        previousFraudHistory: 1,
        failedAttempts: 3,
        prediction: 'FRAUD',
        fraudProbability: 88.7,
        riskLevel: 'HIGH',
        riskFactors: [
          'Unusual transaction amount ($4,200.00 is 35.0x higher than account average)',
          'Multiple failed security/login attempts (3 attempts recorded)',
          'Associated account has previous flagged fraud history',
          'Transaction originates from suspicious or proxy IP location'
        ],
        recommendedAction: 'Block transaction immediately and trigger secondary identity verification.',
        reviewed: false,
        createdAt: new Date(now - 2 * day)
      },
      {
        transactionId: 'TXN-5541-LEGIT',
        userId: demoUser._id,
        amount: 120.00,
        transactionType: 'Purchase',
        accountAge: 320,
        transactionFrequency: 15,
        averageTransactionAmount: 110.00,
        deviceType: 'Mobile',
        location: 'Mumbai, IN',
        ipAddress: '103.21.124.5',
        paymentMethod: 'UPI',
        transactionTime: new Date(now - 3 * day),
        previousFraudHistory: 0,
        failedAttempts: 0,
        prediction: 'LEGITIMATE',
        fraudProbability: 7.8,
        riskLevel: 'LOW',
        riskFactors: [
          'Normal behavior patterns; transaction amount, device, and location match historical profile'
        ],
        recommendedAction: 'Approve transaction automatically; no suspicious anomalies detected.',
        reviewed: true,
        createdAt: new Date(now - 3 * day)
      }
    ];

    // Add 25 more generated transactions for realistic statistical distributions
    const types = ['Payment', 'Transfer', 'Withdrawal', 'Deposit', 'Purchase'];
    const methods = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'];
    const devices = ['Mobile', 'Desktop', 'Tablet'];

    for (let i = 6; i <= 30; i++) {
      const isHighRisk = i % 5 === 0;
      const isMedRisk = i % 3 === 0 && !isHighRisk;
      const amt = isHighRisk ? Math.floor(2000 + Math.random() * 5000) : isMedRisk ? Math.floor(600 + Math.random() * 1000) : Math.floor(20 + Math.random() * 200);
      const avgAmt = Math.floor(50 + Math.random() * 150);
      const prob = isHighRisk ? Math.floor(75 + Math.random() * 20) : isMedRisk ? Math.floor(40 + Math.random() * 20) : Math.floor(2 + Math.random() * 25);
      const risk = isHighRisk ? 'HIGH' : isMedRisk ? 'MEDIUM' : 'LOW';
      const pred = isHighRisk ? 'FRAUD' : isMedRisk ? 'SUSPICIOUS' : 'LEGITIMATE';
      const daysAgo = Math.floor(Math.random() * 12);

      demoTransactions.push({
        transactionId: `TXN-${1000 + i}-${risk}`,
        userId: demoUser._id,
        amount: amt,
        transactionType: types[i % types.length],
        accountAge: Math.floor(10 + Math.random() * 500),
        transactionFrequency: Math.floor(2 + Math.random() * 20),
        averageTransactionAmount: avgAmt,
        deviceType: devices[i % devices.length],
        location: sampleLocations[i % sampleLocations.length],
        ipAddress: `192.168.1.${i}`,
        paymentMethod: methods[i % methods.length],
        transactionTime: new Date(now - daysAgo * day),
        previousFraudHistory: isHighRisk ? 1 : 0,
        failedAttempts: isHighRisk ? 3 : isMedRisk ? 1 : 0,
        prediction: pred,
        fraudProbability: prob,
        riskLevel: risk,
        riskFactors: isHighRisk ? [
          `Unusual transaction amount ($${amt} vs avg $${avgAmt})`,
          'Multiple failed security attempts detected'
        ] : isMedRisk ? [
          `Transaction amount higher than baseline`
        ] : [
          'Normal behavior patterns'
        ],
        recommendedAction: isHighRisk ? 'Block transaction immediately' : isMedRisk ? 'Request OTP' : 'Approve',
        reviewed: !isHighRisk,
        createdAt: new Date(now - daysAgo * day)
      });
    }

    await Transaction.insertMany(demoTransactions);
    console.log(`Seeded ${demoTransactions.length} demo transactions successfully.`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
