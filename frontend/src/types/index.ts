export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Wallet {
  id: string;
  name: string;
  description: string;
  total_balance: number;
  allocated_balance: number;
  available_balance: number;
  status: 'ACTIVE' | 'FROZEN';
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  role: 'PROCUREMENT' | 'RESEARCH' | 'BUDGET_ANALYST' | 'AUDITOR';
  status: 'ACTIVE' | 'INACTIVE' | 'FLAGGED';
  budget_limit: number;
  spent_amount: number;
  available_budget: number;
  permissions: string[];
  wallet_id?: string;
  description: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  trust_score: number;
  is_suspicious: boolean;
  is_blocked: boolean;
  avg_price: number;
  description: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  category: string;
  price: number;
  specs: Record<string, any>;
  in_stock: boolean;
  market_price: number;
}

export interface Transaction {
  id: string;
  purchase_request_id?: string;
  agent_id: string;
  vendor_id?: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'BLOCKED';
  policy_decision: string;
  policy_reason: string;
  policy_rules_evaluated: any[];
  risk_score: number;
  risk_category: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  transaction_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_at: string;
  resolved_at?: string;
  approved_by?: string;
  notes: string;
  transaction?: Transaction;
  agent?: Agent;
  vendor?: Vendor;
  audit_report?: {
    risk_score: number;
    recommendation: string;
    red_flags: string[];
    explanation: string;
  };
}

export interface Policy {
  id: string;
  name: string;
  auto_approve_threshold: number;
  risk_auto_reject_threshold: number;
  blocked_vendors: string[];
  require_human_above: number;
  is_active: boolean;
  created_at: string;
}

export interface LedgerEntry {
  id: number;
  event_id: string;
  timestamp: string;
  event_type: string;
  description: string;
  transaction_ref?: string;
  data_hash: string;
  prev_hash: string;
  chain_hash: string;
  extra_metadata?: Record<string, any>;
}

export interface DashboardStats {
  total_allocation: number;
  available_balance: number;
  total_spending: number;
  active_agents: number;
  pending_approvals: number;
  completed_transactions: number;
  rejected_transactions: number;
  risk_alerts: number;
  kill_switch_active: boolean;
}
