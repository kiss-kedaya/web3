import { NetworkConfig } from '../types/web3';

export const NETWORKS: NetworkConfig[] = [
  // EVM Networks - BNB Chain作为默认网络放在第一位
  {
    name: 'BNB Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    symbol: 'BNB',
    blockExplorer: 'https://www.oklink.com/zh-hans/bsc',
    color: '#F3BA2F',
    type: 'evm'
  },
  {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/ethereum',
    color: '#627EEA',
    type: 'evm'
  },
  {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    symbol: 'MATIC',
    blockExplorer: 'https://www.oklink.com/zh-hans/polygon',
    color: '#8247E5',
    type: 'evm'
  },
  {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/arbitrum-one',
    color: '#28A0F0',
    type: 'evm'
  },
  {
    name: 'OP Mainnet',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/optimism',
    color: '#FF0420',
    type: 'evm'
  },
  {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/base',
    color: '#0052FF',
    type: 'evm'
  },
  {
    name: 'Avalanche-C',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    symbol: 'AVAX',
    blockExplorer: 'https://www.oklink.com/zh-hans/avalanche',
    color: '#E84142',
    type: 'evm'
  },
  {
    name: 'Fantom',
    chainId: 250,
    rpcUrl: 'https://rpc.ftm.tools',
    symbol: 'FTM',
    blockExplorer: 'https://www.oklink.com/zh-hans/fantom',
    color: '#1969FF',
    type: 'evm'
  },
  {
    name: 'zkSync Era',
    chainId: 324,
    rpcUrl: 'https://mainnet.era.zksync.io',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/zksync-era',
    color: '#8C8DFC',
    type: 'evm'
  },
  {
    name: 'Polygon zkEVM',
    chainId: 1101,
    rpcUrl: 'https://zkevm-rpc.com',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/polygon-zkevm',
    color: '#8247E5',
    type: 'evm'
  },
  {
    name: 'Linea',
    chainId: 59144,
    rpcUrl: 'https://rpc.linea.build',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/linea',
    color: '#121212',
    type: 'evm'
  },
  {
    name: 'Scroll',
    chainId: 534352,
    rpcUrl: 'https://rpc.scroll.io',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/scroll',
    color: '#FFEEDA',
    type: 'evm'
  },
  {
    name: 'Manta Pacific',
    chainId: 169,
    rpcUrl: 'https://pacific-rpc.manta.network/http',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/manta',
    color: '#000000',
    type: 'evm'
  },
  {
    name: 'opBNB Mainnet',
    chainId: 204,
    rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
    symbol: 'BNB',
    blockExplorer: 'https://www.oklink.com/zh-hans/opbnb',
    color: '#F3BA2F',
    type: 'evm'
  },
  // 测试网络
  {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.drpc.org',
    symbol: 'ETH',
    blockExplorer: 'https://www.oklink.com/zh-hans/sepolia',
    color: '#627EEA',
    type: 'evm'
  },
  {
    name: 'Mumbai Testnet',
    chainId: 80001,
    rpcUrl: 'https://polygon-mumbai-bor-rpc.publicnode.com',
    symbol: 'MATIC',
    blockExplorer: 'https://www.oklink.com/zh-hans/mumbai',
    color: '#8247E5',
    type: 'evm'
  },
  {
    name: 'Amoy Testnet',
    chainId: 80002,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    symbol: 'MATIC',
    blockExplorer: 'https://www.oklink.com/zh-hans/amoy',
    color: '#8247E5',
    type: 'evm'
  }
];

export const getNetworkByChainId = (chainId: number): NetworkConfig | undefined => {
  return NETWORKS.find(network => network.chainId === chainId);
};

export const getDefaultNetwork = (): NetworkConfig => {
  return NETWORKS[0]; // BNB Chain作为默认网络
};

export const getExplorerUrl = (network: NetworkConfig, txHash: string): string => {
  return `${network.blockExplorer}/tx/${txHash}`;
};