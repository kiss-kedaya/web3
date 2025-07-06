/**
 * 数据源配置管理
 * 简化版本：只使用OKX API，移除传统区块浏览器API依赖
 */

// 这些函数现在简化为只检查OKX支持
export function getApiKey(chainId: number): string | undefined {
  return undefined; // 不再使用传统API密钥
}

export function isApiKeyAvailable(chainId: number): boolean {
  return false; // 不再依赖API密钥
}

export function hasFallbackDataSource(chainId: number): boolean {
  return isOKXSupported(chainId); // OKX就是我们的主要数据源
}

/**
 * OKX API支持的网络列表
 */
export const OKX_SUPPORTED_NETWORKS = [
  1,          // 以太坊主网
  11155111,   // Sepolia测试网
  56,         // BSC主网
  137,        // Polygon主网
  80001,      // Polygon Mumbai
  42161,      // Arbitrum One
  43114,      // Avalanche C-Chain
  10,         // Optimism
  8453,       // Base
  324,        // zkSync Era
  250,        // Fantom
  25,         // Cronos
  100,        // Gnosis Chain
  1284,       // Moonbeam
  1285,       // Moonriver
  42220,      // Celo
  1666600000, // Harmony
  128,        // HECO
  66,         // OKC
  321,        // KCC
];

/**
 * 检查网络是否支持OKX API
 */
export function isOKXSupported(chainId: number): boolean {
  return OKX_SUPPORTED_NETWORKS.includes(chainId);
}

/**
 * 检查网络是否支持传统区块浏览器API（已废弃，始终返回false）
 */
export function isExplorerAPISupported(chainId: number): boolean {
  return false; // 不再使用传统区块浏览器API
}
