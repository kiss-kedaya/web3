/**
 * Gas价格转换测试
 * 验证OKX API gas价格解析和显示的正确性
 */

import { TransactionHistoryService } from '../services/transactionHistoryService';
import { NetworkConfig } from '../types/web3';
import { ethers } from 'ethers';

// 模拟BSC网络配置
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

describe('Gas价格转换测试', () => {
  let provider: ethers.JsonRpcProvider;
  let service: TransactionHistoryService;

  beforeEach(() => {
    provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
    service = new TransactionHistoryService(provider, mockBSCNetwork);
  });

  describe('parseOKXGasPrice方法', () => {
    test('应该正确转换Wei到Gwei', () => {
      // 通过类型断言访问私有方法
      const parseGasPrice = (service as any).parseOKXGasPrice;

      // 测试案例：125000000 Wei = 0.125 Gwei
      const result1 = parseGasPrice(125000000);
      expect(parseFloat(result1)).toBeCloseTo(0.125, 6);

      // 测试案例：5000000000 Wei = 5 Gwei
      const result2 = parseGasPrice(5000000000);
      expect(parseFloat(result2)).toBeCloseTo(5, 2);

      // 测试案例：1000000000 Wei = 1 Gwei
      const result3 = parseGasPrice(1000000000);
      expect(parseFloat(result3)).toBeCloseTo(1, 2);
    });

    test('应该处理字符串输入', () => {
      const parseGasPrice = (service as any).parseOKXGasPrice;

      const result = parseGasPrice('125000000');
      expect(parseFloat(result)).toBeCloseTo(0.125, 6);
    });

    test('应该处理边界情况', () => {
      const parseGasPrice = (service as any).parseOKXGasPrice;

      // 测试null和undefined
      expect(parseGasPrice(null)).toBe('0');
      expect(parseGasPrice(undefined)).toBe('0');

      // 测试0
      expect(parseGasPrice(0)).toBe('0.000000000');

      // 测试非常小的值
      const result = parseGasPrice(1); // 1 Wei = 0.000000001 Gwei
      expect(parseFloat(result)).toBeCloseTo(0.000000001, 9);
    });

    test('应该处理无效输入', () => {
      const parseGasPrice = (service as any).parseOKXGasPrice;

      expect(parseGasPrice('invalid')).toBe('0');
      expect(parseGasPrice(NaN)).toBe('0');
    });
  });

  describe('实际场景测试', () => {
    test('BSC典型gas价格应该合理', () => {
      const parseGasPrice = (service as any).parseOKXGasPrice;

      // BSC典型gas价格：5 Gwei = 5000000000 Wei
      const result = parseGasPrice(5000000000);
      const gwei = parseFloat(result);
      
      expect(gwei).toBeGreaterThan(0);
      expect(gwei).toBeLessThan(1000); // 应该是合理的Gwei值
      expect(gwei).toBeCloseTo(5, 2);
    });

    test('以太坊典型gas价格应该合理', () => {
      const parseGasPrice = (service as any).parseOKXGasPrice;

      // 以太坊典型gas价格：20 Gwei = 20000000000 Wei
      const result = parseGasPrice(20000000000);
      const gwei = parseFloat(result);
      
      expect(gwei).toBeGreaterThan(0);
      expect(gwei).toBeLessThan(1000);
      expect(gwei).toBeCloseTo(20, 2);
    });
  });

  describe('格式化测试', () => {
    test('应该根据数值大小选择合适的小数位', () => {
      const parseGasPrice = (service as any).parseOKXGasPrice;

      // 很小的值应该显示9位小数
      const smallResult = parseGasPrice(1); // 0.000000001 Gwei
      expect(smallResult.split('.')[1]?.length).toBe(9);

      // 小值应该显示6位小数
      const mediumResult = parseGasPrice(100000); // 0.0001 Gwei
      expect(mediumResult.split('.')[1]?.length).toBe(6);

      // 正常值应该显示2位小数
      const largeResult = parseGasPrice(5000000000); // 5 Gwei
      expect(largeResult.split('.')[1]?.length).toBe(2);
    });
  });
});

/**
 * 手动验证指南
 * 
 * 1. 启动应用并连接到BSC网络
 * 2. 查看交易历史，观察gas价格显示
 * 3. 预期看到合理的值，如：
 *    - "5.00 Gwei" 而不是 "5000000000 Gwei"
 *    - "0.125 Gwei" 而不是 "125000000 Gwei"
 * 4. 点击展开交易详情，确认详情页显示一致
 * 5. 对比区块浏览器的gas价格，验证准确性
 * 
 * 常见的合理gas价格范围：
 * - BSC: 1-20 Gwei
 * - 以太坊: 10-100 Gwei（网络拥堵时可能更高）
 * - Polygon: 1-50 Gwei
 */
