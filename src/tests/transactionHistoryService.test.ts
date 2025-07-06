/**
 * 交易历史服务测试
 * 验证延迟加载和交易详情获取功能
 */

import { TransactionHistoryService } from '../services/transactionHistoryService';
import { NetworkConfig } from '../types/web3';
import { ethers } from 'ethers';

// 模拟网络配置
const mockBSCNetwork: NetworkConfig = {
  chainId: 56,
  name: 'BSC Mainnet',
  rpcUrl: 'https://bsc-dataseed1.binance.org/',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18
  },
  blockExplorer: 'https://bscscan.com'
};

const mockEthereumNetwork: NetworkConfig = {
  chainId: 1,
  name: 'Ethereum Mainnet',
  rpcUrl: 'https://eth.llamarpc.com',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  blockExplorer: 'https://etherscan.io'
};

const mockUnsupportedNetwork: NetworkConfig = {
  chainId: 999999,
  name: 'Unsupported Network',
  rpcUrl: 'https://example.com',
  nativeCurrency: {
    name: 'TEST',
    symbol: 'TEST',
    decimals: 18
  },
  blockExplorer: 'https://example.com'
};

describe('TransactionHistoryService', () => {
  let provider: ethers.JsonRpcProvider;

  beforeEach(() => {
    // 创建模拟provider
    provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
  });

  describe('支持的网络', () => {
    test('BSC网络应该支持交易详情获取', async () => {
      const service = new TransactionHistoryService(provider, mockBSCNetwork);
      
      // 测试一个真实的BSC交易哈希
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const result = await service.getTransactionDetail(txHash);
      
      // 验证返回结构
      expect(result).toHaveProperty('detail');
      expect(result).toHaveProperty('dataSource');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('以太坊网络应该支持交易详情获取', async () => {
      const ethProvider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
      const service = new TransactionHistoryService(ethProvider, mockEthereumNetwork);
      
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const result = await service.getTransactionDetail(txHash);
      
      expect(result).toHaveProperty('detail');
      expect(result).toHaveProperty('dataSource');
      expect(result).toHaveProperty('errors');
    });
  });

  describe('不支持的网络', () => {
    test('不支持的网络应该返回相应错误', async () => {
      const service = new TransactionHistoryService(provider, mockUnsupportedNetwork);
      
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const result = await service.getTransactionDetail(txHash);
      
      expect(result.detail).toBeNull();
      expect(result.dataSource).toBe('none');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('该网络不支持获取交易详情或交易不存在');
    });
  });

  describe('交易历史获取', () => {
    test('应该能获取交易历史列表', async () => {
      const service = new TransactionHistoryService(provider, mockBSCNetwork);
      
      // 使用一个真实的BSC地址进行测试
      const address = '0x1234567890123456789012345678901234567890';
      
      const result = await service.getTransactionHistory(address, 1, 10);
      
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('dataSource');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.transactions)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('网络标识符', () => {
    test('应该正确获取BSC网络标识符', () => {
      const service = new TransactionHistoryService(provider, mockBSCNetwork);

      // 通过类型断言访问私有方法进行测试
      const networkId = (service as unknown as { getOKXNetworkId(): string | null }).getOKXNetworkId();
      expect(networkId).toBe('bsc');
    });

    test('应该正确获取以太坊网络标识符', () => {
      const ethProvider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
      const service = new TransactionHistoryService(ethProvider, mockEthereumNetwork);

      const networkId = (service as unknown as { getOKXNetworkId(): string | null }).getOKXNetworkId();
      expect(networkId).toBe('eth');
    });

    test('不支持的网络应该返回null', () => {
      const service = new TransactionHistoryService(provider, mockUnsupportedNetwork);

      const networkId = (service as unknown as { getOKXNetworkId(): string | null }).getOKXNetworkId();
      expect(networkId).toBeNull();
    });
  });
});

/**
 * 手动测试指南
 * 
 * 1. 启动开发服务器：npm run dev
 * 2. 在浏览器中打开应用
 * 3. 连接到支持的网络（如BSC、以太坊等）
 * 4. 查看交易历史页面
 * 5. 点击任意交易的展开按钮
 * 6. 观察是否正确加载交易详情
 * 7. 检查浏览器控制台的日志输出
 * 
 * 预期结果：
 * - 交易列表正常显示
 * - 点击展开时显示"加载详细信息..."
 * - 成功获取详情后显示完整的交易信息
 * - 错误情况下显示相应的错误信息
 */
