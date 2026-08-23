import type {
  AnalyticsMetrics,
  AuditEvent,
  Customer,
  Invoice,
  RecoveryCase,
  Subscription,
  Transaction,
} from "@/types";

export const mockCustomers: Customer[] = [
  { id: "CUS_1042", name: "Rahul Sharma", email: "rahul.sharma@example.com", ltv: 184000, successfulPayments: 18, failedPayments: 3 },
  { id: "CUS_1187", name: "Priya Desai", email: "priya.desai@example.com", ltv: 92000, successfulPayments: 11, failedPayments: 1 },
  { id: "CUS_1261", name: "Arjun Mehta", email: "arjun.mehta@example.com", ltv: 146000, successfulPayments: 16, failedPayments: 2 },
  { id: "CUS_1398", name: "Sneha Kulkarni", email: "sneha.kulkarni@example.com", ltv: 78000, successfulPayments: 9, failedPayments: 2 },
  { id: "CUS_1452", name: "Vikram Patel", email: "vikram.patel@example.com", ltv: 211000, successfulPayments: 21, failedPayments: 4 },
  { id: "CUS_1534", name: "Ananya Rao", email: "ananya.rao@example.com", ltv: 67000, successfulPayments: 8, failedPayments: 1 },
];

export const mockTransactions: Transaction[] = [
  { id: "PAY_83921", customerId: "CUS_1042", amount: 24999, paymentMethod: "UPI", status: "FAILED", failureReason: "UPI timeout", attempts: 3, timestamp: "2026-08-23T08:42:01+05:30" },
  { id: "PAY_83920", customerId: "CUS_1187", amount: 8500, paymentMethod: "CARD", status: "SUCCESS", attempts: 1, timestamp: "2026-08-23T08:15:00+05:30" },
  { id: "PAY_83918", customerId: "CUS_1261", amount: 18900, paymentMethod: "CARD", status: "FAILED", failureReason: "Bank decline", attempts: 2, timestamp: "2026-08-23T07:51:00+05:30" },
  { id: "PAY_83914", customerId: "CUS_1398", amount: 6200, paymentMethod: "NETBANKING", status: "FAILED", failureReason: "Gateway timeout", attempts: 1, timestamp: "2026-08-23T07:24:00+05:30" },
  { id: "PAY_83908", customerId: "CUS_1452", amount: 31500, paymentMethod: "UPI", status: "SUCCESS", attempts: 1, timestamp: "2026-08-23T06:58:00+05:30" },
  { id: "PAY_83897", customerId: "CUS_1534", amount: 4800, paymentMethod: "WALLET", status: "FAILED", failureReason: "Wallet unavailable", attempts: 2, timestamp: "2026-08-23T06:31:00+05:30" },
];

export const mockSubscriptions: Subscription[] = [
  { id: "SUB_2041", customerId: "CUS_1042", amount: 2499, status: "PAST_DUE", nextBillingDate: "2026-08-22" },
  { id: "SUB_2042", customerId: "CUS_1187", amount: 1499, status: "ACTIVE", nextBillingDate: "2026-09-01" },
];

export const mockInvoices: Invoice[] = [
  { id: "INV_7712", customerId: "CUS_1452", amount: 42000, status: "OVERDUE", dueDate: "2026-08-15" },
  { id: "INV_7714", customerId: "CUS_1398", amount: 12500, status: "OPEN", dueDate: "2026-08-28" },
];

export const mockRecoveryCases: RecoveryCase[] = [
  {
    id: "CASE_001",
    type: "PAYMENT_FAILURE",
    customerId: "CUS_1042",
    transactionId: "PAY_83921",
    amount: 24999,
    priority: "HIGH",
    status: "PENDING",
    recoveryProbability: 84,
    diagnosis: {
      reason: "Payment method failure",
      explanation: "The customer has successfully completed multiple previous payments. The current transaction has failed repeatedly using the same UPI payment method.",
      confidence: 91,
      recoverability: 84,
      evidence: ["18 successful historical payments", "3 failed attempts on current transaction", "Repeated UPI timeout"],
    },
    recommendedAction: {
      id: "ACT_001",
      title: "Switch payment method",
      steps: ["Generate alternative payment link", "Send personalized recovery message", "Monitor payment verification"],
      expectedRecovery: 20999,
      confidence: 91,
    },
    timestamp: "2026-08-23T08:42:01+05:30",
  },
  {
    id: "CASE_002",
    type: "CHECKOUT_ABANDONMENT",
    customerId: "CUS_1187",
    transactionId: "CHK_99120",
    amount: 8500,
    priority: "MEDIUM",
    status: "RECOVERED",
    recoveryProbability: 92,
    diagnosis: {
      reason: "Checkout abandonment",
      explanation: "The customer reached the payment verification stage and exited before completion.",
      confidence: 88,
      recoverability: 92,
      evidence: ["Checkout reached payment stage", "No completed payment", "Customer has prior successful purchases"],
    },
    recommendedAction: {
      id: "ACT_002",
      title: "Send checkout recovery link",
      steps: ["Generate one-click checkout link", "Send email recovery message", "Monitor checkout completion"],
      expectedRecovery: 7820,
      confidence: 88,
    },
    timestamp: "2026-08-23T08:15:00+05:30",
  },
  {
    id: "CASE_003",
    type: "SUBSCRIPTION_FAILURE",
    customerId: "CUS_1261",
    transactionId: "PAY_83918",
    amount: 18900,
    priority: "HIGH",
    status: "IN_PROGRESS",
    recoveryProbability: 71,
    diagnosis: {
      reason: "Bank decline",
      explanation: "The payment has been declined twice while the customer maintains a strong successful-payment history.",
      confidence: 86,
      recoverability: 71,
      evidence: ["16 successful historical payments", "2 current bank declines", "Active subscription relationship"],
    },
    recommendedAction: {
      id: "ACT_003",
      title: "Offer alternate payment method",
      steps: ["Generate alternate payment link", "Notify customer", "Verify completion"],
      expectedRecovery: 13419,
      confidence: 86,
    },
    timestamp: "2026-08-23T07:51:00+05:30",
  },
  {
    id: "CASE_004",
    type: "OVERDUE_INVOICE",
    customerId: "CUS_1452",
    amount: 42000,
    priority: "HIGH",
    status: "ESCALATED",
    recoveryProbability: 54,
    diagnosis: {
      reason: "Invoice overdue",
      explanation: "The invoice has passed its due date and the account has not responded to automated reminders.",
      confidence: 94,
      recoverability: 54,
      evidence: ["8 days overdue", "Reminder already sent", "High-value invoice"],
    },
    recommendedAction: {
      id: "ACT_004",
      title: "Escalate for merchant review",
      steps: ["Pause automated retries", "Create human review task", "Record escalation reason"],
      expectedRecovery: 22680,
      confidence: 94,
    },
    timestamp: "2026-08-23T07:10:00+05:30",
  },
  {
    id: "CASE_005",
    type: "PAYMENT_FAILURE",
    customerId: "CUS_1398",
    transactionId: "PAY_83914",
    amount: 6200,
    priority: "MEDIUM",
    status: "PENDING",
    recoveryProbability: 76,
    diagnosis: {
      reason: "Gateway timeout",
      explanation: "The transaction failed because the payment gateway timed out before confirmation.",
      confidence: 89,
      recoverability: 76,
      evidence: ["Single gateway timeout", "No customer decline signal", "Customer has repeat purchase history"],
    },
    recommendedAction: {
      id: "ACT_005",
      title: "Retry through alternate route",
      steps: ["Validate retry policy", "Initiate one controlled retry", "Verify final status"],
      expectedRecovery: 4712,
      confidence: 89,
    },
    timestamp: "2026-08-23T07:24:00+05:30",
  },
];

export const mockAnalytics: AnalyticsMetrics = {
  revenueAtRisk: 1842000,
  recoveredRevenue: 487500,
  recoveryRate: 26.5,
  activeCases: 324,
  successfulRecoveries: 176,
  humanEscalations: 12,
  averageRecoveryTimeMinutes: 23,
  interventionSuccessRate: 68.4,
  escalationRate: 3.7,
};

export const mockRevenueTrend = [
  { label: "Mon", atRisk: 2.8, recovered: 0.8 },
  { label: "Tue", atRisk: 3.4, recovered: 1.1 },
  { label: "Wed", atRisk: 4.1, recovered: 1.3 },
  { label: "Thu", atRisk: 3.2, recovered: 1.0 },
  { label: "Fri", atRisk: 4.7, recovered: 1.4 },
  { label: "Sat", atRisk: 3.9, recovered: 1.2 },
  { label: "Sun", atRisk: 4.4, recovered: 1.5 },
];

export const mockRecoveryByType = [
  { label: "Payment Failure", value: 48 },
  { label: "Checkout Abandonment", value: 24 },
  { label: "Subscription Failure", value: 17 },
  { label: "Overdue Invoice", value: 11 },
];

export const mockAuditEvents: AuditEvent[] = [
  { id: "AUD_001", caseId: "CASE_001", timestamp: "08:42:01", actor: "SYSTEM", event: "Risk detected", detail: "Transaction PAY_83921 identified as revenue at risk.", result: "INFO" },
  { id: "AUD_002", caseId: "CASE_001", timestamp: "08:42:02", actor: "AI_AGENT", event: "Customer history retrieved", detail: "18 successful historical payments found.", result: "INFO" },
  { id: "AUD_003", caseId: "CASE_001", timestamp: "08:42:03", actor: "AI_AGENT", event: "AI diagnosis completed", detail: "Payment method failure; confidence 91%.", result: "INFO" },
  { id: "AUD_004", caseId: "CASE_001", timestamp: "08:42:03", actor: "POLICY_ENGINE", event: "Policy validation", detail: "Recommended action is within merchant policy.", result: "PASSED" },
  { id: "AUD_005", caseId: "CASE_001", timestamp: "08:42:04", actor: "AI_AGENT", event: "Recovery link prepared", detail: "Alternative payment route selected.", result: "INFO" },
  { id: "AUD_006", caseId: "CASE_001", timestamp: "08:42:05", actor: "SYSTEM", event: "Recovery notification prepared", detail: "Personalized recovery message ready for delivery.", result: "INFO" },
  { id: "AUD_007", caseId: "CASE_001", timestamp: "08:59:18", actor: "SYSTEM", event: "Payment verification", detail: "Simulation verified successful payment.", result: "PASSED" },
];

export const mockAgentSteps = [
  "Revenue risk detected",
  "Customer history analyzed",
  "Failure diagnosed",
  "Recovery strategy selected",
  "Policy validation passed",
  "Payment link generated",
  "Recovery notification sent",
  "Payment verified",
];
