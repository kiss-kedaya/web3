import { ethers } from 'ethers';
import { NetworkConfig, TransactionHistory, TransactionDetail, TransactionLog } from '../types/web3';
import { isOKXSupported } from '../config/apiKeys';
import { analyzeApiError, logApiError, isSuccessfulResponse, ApiError } from '../utils/apiErrorHandler';

// OKX API响应类型定义
interface OKXApiResponse<T = unknown> {
  code: number;
  msg?: string;
  detailMsg?: string;
  data: T;
}

interface OKXTransactionData {
  hash: string;
  blockHeight?: string;
  blockNumber?: string;
  blockHash?: string;
  from: string;
  to: string;
  value: string | number;
  blocktime?: string;
  timestamp?: string;
  timeStamp?: string;
  status: string | number;
  isError?: boolean | string;
  fee?: string | number;
  realValue?: string | number;
  gasUsed?: string;
  gasLimit?: string;
  gas?: string;
  gasPrice?: string;
  nonce?: string;
  input?: string;
  data?: string;
  transactionIndex?: string;
  contractAddress?: string;
  methodId?: string;
  method?: string;
  confirm?: string | number;
  legalRate?: string;
  valueRaw?: string;
  inputHex?: string;
  tokenTransferCount?: string | number;
  logCount?: string | number;
  internalTranCount?: string | number;
  deploymentContract?: boolean | string;
  index?: string | number;
  methodName?: string;
}

interface OKXTransactionListResponse {
  hits: OKXTransactionData[];
  total?: number;
}

interface OKXTransactionLogData {
  data: Array<{
    data: string[];
  }>;
}

// OKX API日志响应类型
interface OKXLogResponse {
  address: string;
  topics: string[];
  data: string;
  blockNumber?: string;
  transactionHash?: string;
  transactionIndex?: string;
  blockHash?: string;
  logIndex?: string;
  removed?: boolean;
}



// OKX API支持的网络映射
const OKX_NETWORK_MAPPING: Record<number, string> = {
  1: 'eth',        // 以太坊主网
  11155111: 'eth', // Sepolia测试网 (使用eth端点)
  56: 'bsc',       // BSC主网
  137: 'polygon',  // Polygon主网
  80001: 'polygon', // Polygon Mumbai (使用polygon端点)
  42161: 'arbitrum', // Arbitrum One
  43114: 'avax',   // Avalanche C-Chain
  10: 'optimism',  // Optimism
  8453: 'base',    // Base
  324: 'zksync',   // zkSync Era
  250: 'fantom',   // Fantom
  25: 'cronos',    // Cronos
  100: 'gnosis',   // Gnosis Chain
  1284: 'moonbeam', // Moonbeam
  1285: 'moonriver', // Moonriver
  42220: 'celo',   // Celo
  1666600000: 'harmony', // Harmony
  128: 'heco',     // HECO
  66: 'okc',       // OKC
  321: 'kcc',      // KCC
};

// OKX API服务类
class OKXApiService {
  private baseUrl = 'https://www.oklink.com/api/explorer';
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig) {
    this.networkConfig = networkConfig;
  }

  /**
   * 获取网络标识符
   */
  private getNetworkIdentifier(): string | null {
    return OKX_NETWORK_MAPPING[this.networkConfig.chainId] || null;
  }

  /**
   * 检查当前网络是否支持OKX API
   */
  isNetworkSupported(): boolean {
    return this.getNetworkIdentifier() !== null;
  }

  /**
   * 对时间戳进行加密处理
   */
  private encryptTime(timestamp: number): string {
    const t = timestamp * 1 + 1111111111111;
    const e = t.toString().split('');
    const r = Math.floor(Math.random() * 10).toString();
    const n = Math.floor(Math.random() * 10).toString();
    const o = Math.floor(Math.random() * 10).toString();
    return e.join('') + r + n + o;
  }

  /**
   * 对API密钥进行处理
   */
  private encryptApiKey(): string {
    const t = "a2c903cc-b31e-4547-9299-b6d07b7631ab";
    const e = t.split('');
    const r = e.slice(0, 8);
    return e.slice(8).join('') + r.join('');
  }

  /**
   * 组合加密后的API密钥和时间戳，并进行base64编码
   */
  private combineAndEncode(apiKey: string, timestamp: string): string {
    const combined = `${apiKey}|${timestamp}`;
    return btoa(combined);
  }

  /**
   * 生成API密钥
   */
  private generateApiKey(): string {
    const timestamp = Date.now();
    const encryptedApiKey = this.encryptApiKey();
    const encryptedTimestamp = this.encryptTime(timestamp);
    return this.combineAndEncode(encryptedApiKey, encryptedTimestamp);
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    return {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "pragma": "no-cache",
      "cache-control": "no-cache",
      "x-zkdex-env": "0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "x-cdn": "https://static.oklink.com",
      "app-type": "web",
      "x-utc": "8",
      "sec-ch-ua-mobile": "?0",
      "x-apikey": this.generateApiKey(),
      "x-locale": "zh_CN",
      "x-simulated-trading": "undefined",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      "referer": "https://www.oklink.com/zh-hans",
      "accept-language": "zh-CN,zh;q=0.9",
    };
  }

  /**
   * 获取指定地址和方法的交易哈希
   */
  async getTransactionHash(address: string, method: string = "mint"): Promise<string | null> {
    const networkId = this.getNetworkIdentifier();
    if (!networkId) {
      console.warn(`网络 ${this.networkConfig.name} 不支持OKX API`);
      return null;
    }

    try {
      const url = `${this.baseUrl}/v2/${networkId}/addresses/${address}/transactionsByClassfy/condition?offset=0&limit=1000&nonzeroValue=false&address=${address}&t=${Date.now()}`;

      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.data && data.data.hits) {
        for (const tx of data.data.hits) {
          if (tx.method === method) {
            return tx.hash;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('获取OKX交易哈希失败:', error);
      return null;
    }
  }

  /**
   * 获取交易日志
   */
  async getTransactionLogs(txHash: string): Promise<OKXTransactionLogData | null> {
    const networkId = this.getNetworkIdentifier();
    if (!networkId) {
      console.warn(`网络 ${this.networkConfig.name} 不支持OKX API`);
      return null;
    }

    try {
      const url = `${this.baseUrl}/v1/${networkId}/transactions/${txHash}/logs?t=${Date.now()}`;

      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as OKXTransactionLogData;
    } catch (error) {
      console.error('获取OKX交易日志失败:', error);
      return null;
    }
  }

  /**
   * 获取交易的完整日志数据（新方法）
   */
  async getTransactionLogsDetailed(txHash: string): Promise<OKXLogResponse[] | null> {
    const networkId = this.getNetworkIdentifier();
    if (!networkId) {
      console.warn(`网络 ${this.networkConfig.name} 不支持OKX API`);
      return null;
    }

    try {
      const url = `${this.baseUrl}/v1/${networkId}/transactions/${txHash}/logs?t=${Date.now()}`;

      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 检查响应格式并解析日志数据
      if (data && data.data && Array.isArray(data.data)) {
        return data.data as OKXLogResponse[];
      }

      return null;
    } catch (error) {
      console.error('获取OKX交易详细日志失败:', error);
      return null;
    }
  }

  /**
   * 获取地址的交易历史
   */
  async getAddressTransactions(address: string, offset: number = 0, limit: number = 20): Promise<OKXApiResponse<OKXTransactionListResponse> | null> {
    const networkId = this.getNetworkIdentifier();
    if (!networkId) {
      console.warn(`网络 ${this.networkConfig.name} 不支持OKX API`);
      return null;
    }

    try {
      const url = `${this.baseUrl}/v2/${networkId}/addresses/${address}/transactionsByClassfy/condition?offset=${offset}&limit=${limit}&nonzeroValue=false&address=${address}&t=${Date.now()}`;

      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as OKXApiResponse<OKXTransactionListResponse>;
    } catch (error) {
      console.error('获取OKX地址交易失败:', error);
      return null;
    }
  }

  /**
   * 获取交易详细信息
   */
  async getTransactionDetail(txHash: string): Promise<OKXApiResponse<OKXTransactionData | OKXTransactionData[]> | null> {
    const networkId = this.getNetworkIdentifier();
    if (!networkId) {
      console.warn(`网络 ${this.networkConfig.name} 不支持OKX API`);
      return null;
    }

    try {
      const timestamp = Date.now();
      const url = `${this.baseUrl}/v1/${networkId}/transactions/${txHash}?t=${timestamp}`;

      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as OKXApiResponse<OKXTransactionData | OKXTransactionData[]>;
    } catch (error) {
      console.error('获取OKX交易详情失败:', error);
      return null;
    }
  }
}

// 移除了传统区块浏览器API配置，现在只使用OKX API

export class TransactionHistoryService {
  private provider: ethers.JsonRpcProvider;
  private network: NetworkConfig;
  private okxService: OKXApiService;

  constructor(provider: ethers.JsonRpcProvider, network: NetworkConfig) {
    this.provider = provider;
    this.network = network;
    this.okxService = new OKXApiService(network);
  }

  /**
   * 获取地址的交易历史
   */
  async getTransactionHistory(
    address: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ transactions: TransactionHistory[], dataSource: string, errors: ApiError[] }> {
    const errors: ApiError[] = [];

    // 检查网络是否支持OKX API
    if (!isOKXSupported(this.network.chainId)) {
      const error = analyzeApiError({ message: `网络 ${this.network.name} 暂不支持数据查询` });
      console.log(`❌ 网络 ${this.network.name} 不支持OKX API`);
      return {
        transactions: [],
        dataSource: 'none',
        errors: [error]
      };
    }

    // 使用OKX API获取交易历史
    console.log(`🔄 使用OKX API获取 ${this.network.name} 网络的交易历史...`);

    try {
      const okxResult = await this.queryFromOKXAPI(address, page, pageSize);
      if (okxResult.success) {
        if (okxResult.data.length > 0) {
          console.log(`✅ 成功从OKX API获取到 ${okxResult.data.length} 条交易记录`);
        } else {
          console.log(`ℹ️ OKX API返回空结果（地址可能没有交易记录）`);
        }
        return {
          transactions: okxResult.data,
          dataSource: 'okx',
          errors: []
        };
      } else if (okxResult.error) {
        errors.push(okxResult.error);
        logApiError('OKX API', okxResult.error, { address, network: this.network.name });
      }
    } catch (error) {
      const apiError = analyzeApiError(null, error);
      errors.push(apiError);
      logApiError('OKX API', apiError, { address, network: this.network.name });
    }

    // 如果OKX API不可用，返回空数组和错误信息
    console.log(`❌ OKX API不可用，无法获取 ${this.network.name} 网络的交易历史`);
    return {
      transactions: [],
      dataSource: 'none',
      errors: errors
    };
  }

  /**
   * 使用OKX API查询交易历史
   */
  private async queryFromOKXAPI(
    address: string,
    page: number,
    pageSize: number
  ): Promise<{ success: boolean, data: TransactionHistory[], error?: ApiError }> {
    try {
      const offset = (page - 1) * pageSize;
      const response = await this.okxService.getAddressTransactions(address, offset, pageSize);

      if (!response) {
        return {
          success: false,
          data: [],
          error: analyzeApiError({ message: 'OKX API返回空响应' })
        };
      }

      // 检查响应是否成功
      if (!isSuccessfulResponse(response)) {
        return {
          success: false,
          data: [],
          error: analyzeApiError(response)
        };
      }

      if (response.data && response.data.hits) {
        const transactions = this.parseOKXResponse(response.data.hits);
        return {
          success: true,
          data: transactions
        };
      }

      // 空结果也是成功的
      return {
        success: true,
        data: []
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: analyzeApiError(null, error)
      };
    }
  }

  /**
   * 解析OKX API响应数据
   */
  private parseOKXResponse(okxTxs: OKXTransactionData[]): TransactionHistory[] {
    return okxTxs.map((tx: OKXTransactionData) => ({
      hash: tx.hash,
      blockNumber: parseInt(tx.blockHeight || tx.blockNumber || '0'),
      blockHash: tx.blockHash || '',
      transactionIndex: parseInt(tx.transactionIndex || '0'),
      from: tx.from,
      to: tx.to,
      value: this.parseOKXValue(tx.value),
      gasPrice: this.parseOKXGasPrice(tx.gasPrice),
      gasUsed: tx.gasUsed || '0',
      gasLimit: tx.gasLimit || tx.gas || '0',
      nonce: parseInt(tx.nonce || '0'),
      data: tx.input || tx.data || '0x',
      timestamp: parseInt(tx.blocktime || tx.timestamp || tx.timeStamp || '0'),
      // 保留OKX API的原始fee字段
      fee: typeof tx.fee === 'number' ? tx.fee : (typeof tx.fee === 'string' ? parseFloat(tx.fee) : undefined),
      realValue: typeof tx.realValue === 'number' ? tx.realValue : (typeof tx.realValue === 'string' ? parseFloat(tx.realValue) : undefined),
      status: this.parseOKXStatus(tx.status, tx.isError),
      logs: [], // 需要单独查询日志
      contractAddress: tx.contractAddress || undefined,
      methodId: tx.methodId || ((tx.input && tx.input.length >= 10) ? tx.input.slice(0, 10) : undefined),
      methodName: tx.method || this.getMethodName(tx.methodId || ''),
    }));
  }

  /**
   * 解析OKX API的value字段
   * OKX返回的是已经格式化的十进制数值，不需要再用formatEther转换
   */
  private parseOKXValue(value: string | number | null | undefined): string {
    try {
      if (value === null || value === undefined) {
        return '0';
      }

      // 如果是数字类型，直接转换为字符串
      if (typeof value === 'number') {
        return Math.abs(value).toString(); // 使用绝对值，因为OKX用负数表示支出
      }

      // 如果是字符串，尝试解析
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          return Math.abs(numValue).toString();
        }
      }

      return '0';
    } catch (error) {
      console.warn('解析OKX value失败:', error, 'value:', value);
      return '0';
    }
  }

  /**
   * 解析OKX API的gas价格
   * 正确处理OKX API返回的gasPrice字段
   */
  private parseOKXGasPrice(gasPrice: string | number | null | undefined): string {
    try {
      if (gasPrice === null || gasPrice === undefined) {
        return '0';
      }

      let gasPriceValue: number;

      if (typeof gasPrice === 'number') {
        gasPriceValue = gasPrice;
      } else if (typeof gasPrice === 'string') {
        gasPriceValue = parseFloat(gasPrice);
        if (isNaN(gasPriceValue)) {
          return '0';
        }
      } else {
        return '0';
      }

      // OKX API通常返回的gasPrice已经是以Wei为单位
      // 1 Gwei = 1e9 Wei，所以需要除以1e9来转换为Gwei
      const gasPriceInGwei = gasPriceValue / 1e9;

      // 如果值太小，显示更多小数位
      if (gasPriceInGwei < 0.001) {
        return gasPriceInGwei.toFixed(9);
      } else if (gasPriceInGwei < 1) {
        return gasPriceInGwei.toFixed(6);
      } else {
        return gasPriceInGwei.toFixed(2);
      }
    } catch (error) {
      console.warn('解析OKX gas price失败:', error, 'gasPrice:', gasPrice);
      return '0';
    }
  }

  /**
   * 解析OKX API的交易状态
   */
  private parseOKXStatus(status: string | number | null | undefined, isError: boolean | string | null | undefined): number {
    try {
      // 如果明确标记为错误
      if (isError === true || isError === 'true') {
        return 0;
      }

      // 解析status字段
      if (status === '0x1' || status === 1 || status === '1') {
        return 1;
      }

      if (status === '0x0' || status === 0 || status === '0') {
        return 0;
      }

      // 默认认为成功
      return 1;
    } catch (error) {
      console.warn('解析OKX status失败:', error, 'status:', status, 'isError:', isError);
      return 1;
    }
  }



  /**
   * 获取方法名称
   */
  private getMethodName(methodId: string): string {
    const methodSignatures: Record<string, string> = {
      '0xa9059cbb': 'transfer(address,uint256)',
      '0x23b872dd': 'transferFrom(address,address,uint256)',
      '0x095ea7b3': 'approve(address,uint256)',
      '0x40c10f19': 'mint(address,uint256)',
      '0x42966c68': 'burn(uint256)',
      '0x70a08231': 'balanceOf(address)',
      '0xdd62ed3e': 'allowance(address,address)',
      '0x18160ddd': 'totalSupply()',
      '0x06fdde03': 'name()',
      '0x95d89b41': 'symbol()',
      '0x313ce567': 'decimals()',
    };

    return methodSignatures[methodId] || `未知方法 (${methodId})`;
  }



  /**
   * 获取特定方法的交易哈希（使用OKX API）
   */
  async getTransactionHashByMethod(address: string, method: string): Promise<string | null> {
    if (this.okxService.isNetworkSupported()) {
      return await this.okxService.getTransactionHash(address, method);
    }
    console.warn(`网络 ${this.network.name} 不支持OKX API特殊功能`);
    return null;
  }

  /**
   * 获取交易的详细日志（使用OKX API）
   */
  async getTransactionDetailedLogs(txHash: string): Promise<OKXTransactionLogData | null> {
    if (this.okxService.isNetworkSupported()) {
      return await this.okxService.getTransactionLogs(txHash);
    }
    console.warn(`网络 ${this.network.name} 不支持OKX API特殊功能`);
    return null;
  }

  /**
   * 获取交易的完整日志数据（新方法）
   */
  async getTransactionLogs(txHash: string): Promise<{
    logs: TransactionLog[];
    dataSource: string;
    errors: ApiError[];
  }> {
    const errors: ApiError[] = [];

    try {
      // 检查网络是否支持OKX API
      if (isOKXSupported(this.network.chainId)) {
        const okxLogs = await this.okxService.getTransactionLogsDetailed(txHash);
        if (okxLogs) {
          const parsedLogs = this.parseOKXLogs(okxLogs);
          return {
            logs: parsedLogs,
            dataSource: 'okx',
            errors: []
          };
        }
      }

      return {
        logs: [],
        dataSource: 'none',
        errors: [analyzeApiError({
          message: '该网络不支持获取交易日志或日志不存在',
          details: `Network: ${this.network.name} (ChainId: ${this.network.chainId}), TxHash: ${txHash}`
        })]
      };
    } catch (error) {
      const apiError = analyzeApiError(null, error);
      errors.push(apiError);
      logApiError('OKX API', apiError, { txHash, network: this.network.name });

      return {
        logs: [],
        dataSource: 'error',
        errors
      };
    }
  }

  /**
   * 解析OKX API返回的日志数据
   */
  private parseOKXLogs(okxLogs: OKXLogResponse[]): TransactionLog[] {
    return okxLogs.map((log) => ({
      address: log.address,
      topics: log.topics || [],
      data: log.data || '0x',
      blockNumber: log.blockNumber ? parseInt(log.blockNumber) : undefined,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex ? parseInt(log.transactionIndex) : undefined,
      blockHash: log.blockHash,
      logIndex: log.logIndex ? parseInt(log.logIndex) : undefined,
      removed: log.removed || false
    }));
  }

  /**
   * 从交易收据中提取token ID
   */
  async extractTokenIdFromTransaction(txHash: string): Promise<string | null> {
    try {
      // 确保交易哈希格式正确
      if (!txHash.startsWith('0x')) {
        txHash = `0x${txHash}`;
      }

      // 获取交易收据
      const receipt = await this.provider.getTransactionReceipt(txHash);

      // 直接提取第一个日志的第四个topic
      if (receipt && receipt.logs && receipt.logs.length > 0) {
        const log = receipt.logs[0];
        if (log.topics && log.topics.length >= 4) {
          return log.topics[3];
        }
      }

      return null;
    } catch (error) {
      console.error('提取token ID失败:', error);
      return null;
    }
  }

  /**
   * 解析Feed等级（从OKX日志数据）
   */
  async parseFeedLevel(txHash: string): Promise<number | null> {
    try {
      const logData = await this.getTransactionDetailedLogs(txHash);

      if (logData && logData.data && logData.data.length > 1) {
        const levelHex = logData.data[1]?.data?.[7];
        if (levelHex && typeof levelHex === 'string') {
          return parseInt(levelHex, 16);
        }
      }

      return null;
    } catch (error) {
      console.error('解析Feed等级失败:', error);
      return null;
    }
  }

  /**
   * 获取OKX网络标识符
   */
  private getOKXNetworkId(): string | null {
    return OKX_NETWORK_MAPPING[this.network.chainId] || null;
  }

  /**
   * 获取交易详细信息
   * @param txHash 交易哈希
   * @returns 交易详细信息
   */
  async getTransactionDetail(txHash: string): Promise<{
    detail: TransactionDetail | null;
    dataSource: string;
    errors: ApiError[];
  }> {
    const errors: ApiError[] = [];

    try {
      // 检查网络是否支持OKX API（使用chainId而不是name）
      if (isOKXSupported(this.network.chainId)) {
        const networkId = this.getOKXNetworkId();
        if (networkId) {
          const detail = await this.fetchOKXTransactionDetail(txHash, networkId);
          if (detail) {
            return {
              detail,
              dataSource: 'okx',
              errors
            };
          }
        }
      }

      return {
        detail: null,
        dataSource: 'none',
        errors: [analyzeApiError({
          message: '该网络不支持获取交易详情或交易不存在',
          details: `Network: ${this.network.name} (ChainId: ${this.network.chainId}), TxHash: ${txHash}`
        })]
      };
    } catch (error) {
      const apiError = analyzeApiError(null, error);
      errors.push(apiError);
      logApiError('OKX API', apiError, { txHash, network: this.network.name });

      return {
        detail: null,
        dataSource: 'error',
        errors
      };
    }
  }

  /**
   * 从OKX API获取交易详细信息
   * 使用OKX服务的getTransactionDetail方法
   */
  private async fetchOKXTransactionDetail(txHash: string, networkId: string): Promise<TransactionDetail | null> {
    try {
      console.log(`🔄 获取OKX交易详情: ${networkId}/${txHash}`);

      // 使用OKX服务的getTransactionDetail方法
      const data = await this.okxService.getTransactionDetail(txHash);

      if (!data) {
        console.warn('⚠️ OKX API返回空响应');
        return null;
      }

      console.log('🔍 OKX API响应:', { code: data.code, hasData: !!data.data, dataType: Array.isArray(data.data) ? 'array' : typeof data.data });

      if (data.code !== 0 || !data.data) {
        console.warn('⚠️ OKX API返回空数据或错误:', data);
        return null;
      }

      // 处理两种可能的数据格式：单个对象或包含单个对象的数组
      let txData: OKXTransactionData;
      if (Array.isArray(data.data)) {
        if (data.data.length === 0) {
          console.warn('⚠️ OKX API返回空数组');
          return null;
        }
        txData = data.data[0];
      } else {
        txData = data.data;
      }

      console.log('✅ 成功获取交易详情');
      return this.parseOKXTransactionDetail(txData);
    } catch (error) {
      console.error('❌ 获取OKX交易详情失败:', error);
      throw error;
    }
  }

  /**
   * 解析OKX API返回的交易详细信息
   */
  private parseOKXTransactionDetail(tx: OKXTransactionData): TransactionDetail {
    return {
      hash: tx.hash || '',
      blockNumber: parseInt(tx.blockHeight || tx.blockNumber || '0'),
      blockHash: tx.blockHash || '',
      from: tx.from || '',
      to: tx.to || null,
      value: this.parseOKXValue(tx.value),
      timestamp: parseInt(tx.blocktime || tx.timestamp || tx.timeStamp || '0'),
      status: tx.status === '0x1' || tx.status === 1 || tx.isError === false ? 1 : 0,

      // 详细信息
      confirm: parseInt(String(tx.confirm || '0')),
      legalRate: tx.legalRate || undefined,
      valueRaw: tx.valueRaw || String(tx.value || '0'),
      gasUsed: tx.gasUsed || '0',
      gasLimit: tx.gasLimit || tx.gas || '0',
      gasPrice: this.parseOKXGasPrice(tx.gasPrice),
      index: parseInt(String(tx.index || tx.transactionIndex || '0')),
      inputHex: tx.inputHex || tx.input || tx.data || '0x',
      tokenTransferCount: parseInt(String(tx.tokenTransferCount || '0')),
      logCount: parseInt(String(tx.logCount || '0')),
      internalTranCount: parseInt(String(tx.internalTranCount || '0')),
      deploymentContract: tx.deploymentContract === true || tx.deploymentContract === 'true',

      // OKX特有字段
      fee: typeof tx.fee === 'number' ? tx.fee : (typeof tx.fee === 'string' ? parseFloat(tx.fee) : undefined),
      realValue: typeof tx.realValue === 'number' ? tx.realValue : (typeof tx.realValue === 'string' ? parseFloat(tx.realValue) : undefined),

      // 可选字段
      nonce: parseInt(tx.nonce || '0'),
      methodId: tx.methodId || undefined,
      methodName: tx.methodName || tx.method || undefined
    };
  }
}
