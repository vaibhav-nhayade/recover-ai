export type RecoveryType =
  | "PAYMENT_FAILURE"
  | "CHECKOUT_ABANDONMENT"
  | "SUBSCRIPTION_FAILURE"
  | "OVERDUE_INVOICE";

export type Priority = "HIGH" | "MEDIUM" | "LOW";

export type RecoveryStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "RECOVERED"
  | "FAILED"
  | "ESCALATED";

export type TransactionStatus = "SUCCESS" | "FAILED" | "PENDING";

export type PaymentMethod = "UPI" | "CARD" | "NETBANKING" | "WALLET";

export interface Customer {
  id: string;
  name: string;
  email: string;
  ltv: number;
  successfulPayments: number;
  failedPayments: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  failureReason?: string;
  attempts: number;
  timestamp: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  amount: number;
  status: "ACTIVE" | "PAST_DUE" | "CANCELLED";
  nextBillingDate: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  amount: number;
  status: "OPEN" | "PAID" | "OVERDUE";
  dueDate: string;
}

export interface RecoveryDiagnosis {
  reason: string;
  explanation: string;
  confidence: number;
  recoverability: number;
  evidence: string[];
}

export interface RecoveryAction {
  id: string;
  title: string;
  steps: string[];
  expectedRecovery: number;
  confidence: number;
}

export interface RecoveryCase {
  id: string;
  type: RecoveryType;
  customerId: string;
  transactionId?: string;
  amount: number;
  priority: Priority;
  status: RecoveryStatus;
  recoveryProbability: number;
  diagnosis: RecoveryDiagnosis;
  recommendedAction: RecoveryAction;
  timestamp: string;
}

export interface AgentStep {
  id: string;
  label: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  timestamp?: string;
}

export interface AgentRun {
  id: string;
  caseId: string;
  mode: "SUCCESS" | "ESCALATION";
  status: "IDLE" | "RUNNING" | "COMPLETED" | "ESCALATED";
  steps: AgentStep[];
  recoveryAmount?: number;
  recoveryTimeMinutes?: number;
  escalationReason?: string;
}

export interface AnalyticsMetrics {
  revenueAtRisk: number;
  recoveredRevenue: number;
  recoveryRate: number;
  activeCases: number;
  successfulRecoveries: number;
  humanEscalations: number;
  averageRecoveryTimeMinutes: number;
  interventionSuccessRate: number;
  escalationRate: number;
}

export interface AuditEvent {
  id: string;
  caseId: string;
  timestamp: string;
  actor: "SYSTEM" | "AI_AGENT" | "POLICY_ENGINE" | "MERCHANT";
  event: string;
  detail: string;
  result?: "PASSED" | "FAILED" | "INFO";
}
