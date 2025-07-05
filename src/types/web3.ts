export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorer: string;
  color: string;
  type: 'evm';
}

export interface Transaction {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface ContractMethod {
  name: string;
  type: 'function' | 'event';
  inputs: Array<{
    name: string;
    type: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
  }>;
  stateMutability?: string;
}

export interface TransactionDetails {
  from?: string;
  to?: string;
  value?: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
}

export interface ContractDetails {
  contractAddress: string;
  methodName?: string;
  parameters?: Record<string, unknown>;
}

export interface SignatureDetails {
  message: string;
  signature?: string;
}

export interface ErrorDetails {
  code?: string | number;
  reason?: string;
  stack?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'transaction' | 'contract' | 'signature' | 'error';
  message: string;
  txHash?: string;
  status: 'success' | 'error' | 'pending';
  details?: TransactionDetails | ContractDetails | SignatureDetails | ErrorDetails;
}

export interface WalletBalance {
  address: string;
  balance: string;
  tokens: Array<{
    address: string;
    symbol: string;
    balance: string;
  }>;
}

