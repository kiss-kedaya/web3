import { NetworkConfig } from '../types/web3';

export const NETWORKS: NetworkConfig[] = [
  // EVM Networks - BSC主网作为默认网络放在第一位
  {
    name: 'BSC 主网',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    symbol: 'BNB',
    blockExplorer: 'https://bscscan.com',
    color: '#F3BA2F',
    type: 'evm'
  },
  {
    name: 'Polygon 主网',
    chainId: 137,
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
    color: '#8247E5',
    type: 'evm'
  },
  {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    symbol: 'ETH',
    blockExplorer: 'https://arbiscan.io',
    color: '#28A0F0',
    type: 'evm'
  },
  {
    name: 'Avalanche Network C-Chain',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    symbol: 'AVAX',
    blockExplorer: 'https://snowtrace.io',
    color: '#E84142',
    type: 'evm'
  },
  {
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    symbol: 'ETH',
    blockExplorer: 'https://basescan.org',
    color: '#0052FF',
    type: 'evm'
  },
  {
    name: 'OP Mainnet',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    symbol: 'ETH',
    blockExplorer: 'https://optimistic.etherscan.io',
    color: '#FF0420',
    type: 'evm'
  },
  {
    name: 'zkSync Era Mainnet',
    chainId: 324,
    rpcUrl: 'https://mainnet.era.zksync.io',
    symbol: 'ETH',
    blockExplorer: 'https://explorer.zksync.io',
    color: '#8C8DFC',
    type: 'evm'
  },
  {
    name: '以太坊主网',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io',
    color: '#627EEA',
    type: 'evm'
  },
  {
    name: 'Sepolia 测试网',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.drpc.org',
    symbol: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io',
    color: '#627EEA',
    type: 'evm'
  },
  {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrl: 'https://polygon-mumbai-bor-rpc.publicnode.com',
    symbol: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com',
    color: '#8247E5',
    type: 'evm'
  }
];

export const getNetworkByChainId = (chainId: number): NetworkConfig | undefined => {
  return NETWORKS.find(network => network.chainId === chainId);
};

export const getDefaultNetwork = (): NetworkConfig => {
  return NETWORKS[0]; // BSC主网作为默认网络
};

export const getExplorerUrl = (network: NetworkConfig, txHash: string): string => {
  return `${network.blockExplorer}/tx/${txHash}`;
};