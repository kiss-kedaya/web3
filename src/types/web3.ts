export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorer: string;
  color: string;
  type: 'evm';
  iconUrl?: string;
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

export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean;
}

export interface TransactionHistory {
  hash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gasUsed: string;
  gasLimit: string;
  nonce: number;
  data: string;
  timestamp: number;
  status: number;
  logs: TransactionLog[];
  contractAddress?: string;
  methodId?: string;
  methodName?: string;
  decodedInput?: Record<string, unknown>;
  decodedLogs?: Array<{
    name: string;
    signature: string;
    topic: string;
    args: Record<string, unknown>;
  }>;
  // OKX API 特有字段
  fee?: number; // 手续费
  realValue?: number; // 实际价值变化
}

// 交易日志接口
export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber?: number;
  transactionHash?: string;
  transactionIndex?: number;
  blockHash?: string;
  logIndex?: number;
  removed?: boolean;
}

// 日志显示格式类型
export type LogDisplayFormat = 'raw' | 'decoded' | 'topics';

// 详细交易信息接口
export interface TransactionDetail {
  // 基础信息
  hash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: number;
  status: number;

  // 详细信息
  confirm: number; // 确认数
  legalRate?: string; // 法币汇率
  valueRaw: string; // 原始值
  gasUsed: string;
  gasLimit: string;
  gasPrice: string;
  index: number; // 交易在区块中的索引
  inputHex: string; // 交易输入数据
  tokenTransferCount: number; // 代币转账数量
  logCount: number; // 日志数量
  internalTranCount: number; // 内部交易数量
  deploymentContract: boolean; // 是否为合约部署
  fee?: number; // 手续费
  realValue?: number; // 实际价值变化

  // 可选的额外字段
  nonce?: number;
  methodId?: string;
  methodName?: string;

  // 新增：完整的日志数据
  logs?: TransactionLog[];
}

