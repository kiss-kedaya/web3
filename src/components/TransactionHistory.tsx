import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  History,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Filter,
  Copy,
} from "lucide-react";
import {
  TransactionHistory as TransactionHistoryType,
  TransactionDetail,
  NetworkConfig,
  TransactionLog,
} from "../types/web3";
import { ethers } from "ethers";
import { getExplorerUrl } from "../utils/networks";
import { TransactionHistoryService } from "../services/transactionHistoryService";
import { TransactionLogsViewer } from "./TransactionLogsViewer";
import { InputDataViewer } from "./InputDataViewer";

interface TransactionHistoryProps {
  wallet: ethers.Wallet | null;
  provider: ethers.JsonRpcProvider | null;
  currentNetwork: NetworkConfig | null;
  isConnected: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  wallet,
  provider,
  currentNetwork,
  isConnected,
}) => {
  const [transactions, setTransactions] = useState<TransactionHistoryType[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "sent" | "received" | "contract"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [dataSource, setDataSource] = useState<"okx" | "none" | "unknown">(
    "unknown"
  );
  const [showTokenTransfers, setShowTokenTransfers] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  // 无限滚动相关 - 现在使用滚动事件而不是 IntersectionObserver

  // 交易详情相关
  const [transactionDetails, setTransactionDetails] = useState<{ [hash: string]: TransactionDetail }>({});
  const [loadingDetails, setLoadingDetails] = useState<{ [hash: string]: boolean }>({});
  const [detailErrors, setDetailErrors] = useState<{ [hash: string]: string }>({});

  // 交易日志相关
  const [transactionLogs, setTransactionLogs] = useState<{ [hash: string]: TransactionLog[] }>({});
  const [loadingLogs, setLoadingLogs] = useState<{ [hash: string]: boolean }>({});
  const [logErrors, setLogErrors] = useState<{ [hash: string]: string }>({});

  // 防止重复触发的时间戳
  const lastLoadTimeRef = useRef<number>(0);

  const loadTransactionHistory = useCallback(
    async (reset = false) => {
      if (!wallet || !provider || !isConnected || !currentNetwork) return;

      setIsLoading(true);
      try {
        const currentPage = reset ? 1 : page;
        const pageSize = 20;

        const historyService = new TransactionHistoryService(
          provider,
          currentNetwork
        );
        const result = await historyService.getTransactionHistory(
          wallet.address,
          currentPage,
          pageSize
        );

        setDataSource(result.dataSource as "okx" | "none" | "unknown");

        if (result.errors.length > 0) {
          const errorMessages = result.errors.map((error) => error.message);
          setApiErrors(errorMessages);
          console.warn("API调用中遇到错误:", result.errors);
        } else {
          setApiErrors([]);
        }

        const transactions = result.transactions;

        if (reset) {
          setTransactions(transactions);
          setPage(2);
        } else {
          setTransactions((prev) => [...prev, ...transactions]);
          setPage((prev) => prev + 1);
        }

        // 调试日志：检查fee字段
        if (transactions.length > 0) {
          console.log('Transaction data sample:', {
            hash: transactions[0].hash,
            fee: transactions[0].fee,
            gasUsed: transactions[0].gasUsed,
            gasPrice: transactions[0].gasPrice,
            realValue: transactions[0].realValue
          });
        }

        // 只有当返回的交易数量等于页面大小时，才认为还有更多数据
        const hasMoreData = transactions.length === pageSize;
        setHasMore(hasMoreData);
        console.log(`页面 ${currentPage} 加载完成，获取 ${transactions.length} 条交易，还有更多数据: ${hasMoreData}`);
      } catch (error) {
        console.error("加载交易历史失败:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, provider, isConnected, currentNetwork, page]
  );

  useEffect(() => {
    if (wallet && provider && isConnected) {
      // 重置状态
      setTransactions([]);
      setPage(1);
      setHasMore(true);
      setExpandedTx(null);
      console.log('钱包或网络变化，重置交易历史状态');
      loadTransactionHistory(true);
    }
  }, [wallet, provider, isConnected, currentNetwork]);

  // 设置基于滚动位置的无限滚动
  useEffect(() => {
    // 只有在有数据且还有更多数据时才设置滚动监听
    if (!hasMore || transactions.length === 0) return;

    // 获取滚动容器（桌面端或移动端）
    const desktopContainer = document.getElementById('transaction-scroll-container');
    const mobileContainer = document.getElementById('transaction-scroll-container-mobile');
    const scrollContainer = desktopContainer || mobileContainer;

    if (!scrollContainer) {
      console.log('未找到滚动容器，跳过无限滚动设置');
      return;
    }

    const handleScroll = () => {
      // 如果正在加载或没有更多数据，则不处理
      if (isLoading || !hasMore) return;

      const now = Date.now();

      // 防止短时间内重复触发（至少间隔500ms）
      if (now - lastLoadTimeRef.current < 500) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

      // 计算距离底部的距离
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // 当距离底部小于100px时触发加载
      if (distanceFromBottom < 100) {
        console.log('触发无限滚动加载:', {
          page,
          scrollTop,
          scrollHeight,
          clientHeight,
          distanceFromBottom,
          hasMore,
          isLoading
        });

        lastLoadTimeRef.current = now;
        loadTransactionHistory(false);
      }
    };

    // 添加滚动监听器
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // 清理函数
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, isLoading, loadTransactionHistory, transactions.length, page]);

  // 检查是否需要自动加载更多数据（当容器内容不足以产生滚动条时）
  useEffect(() => {
    if (!hasMore || isLoading || transactions.length === 0) return;

    const checkAndLoadMore = () => {
      const desktopContainer = document.getElementById('transaction-scroll-container');
      const mobileContainer = document.getElementById('transaction-scroll-container-mobile');
      const scrollContainer = desktopContainer || mobileContainer;

      if (!scrollContainer) return;

      // 如果容器内容高度小于等于容器可视高度，说明没有滚动条，需要加载更多
      const { scrollHeight, clientHeight } = scrollContainer;

      if (scrollHeight <= clientHeight && hasMore && !isLoading) {
        console.log('容器内容不足，自动加载更多数据:', {
          scrollHeight,
          clientHeight,
          transactions: transactions.length
        });
        loadTransactionHistory(false);
      }
    };

    // 延迟检查，确保DOM已经渲染完成
    const timer = setTimeout(checkAndLoadMore, 100);

    return () => clearTimeout(timer);
  }, [transactions.length, hasMore, isLoading, loadTransactionHistory]);

  const getTransactionType = (tx: TransactionHistoryType) => {
    if (!wallet) return "unknown";
    if (tx.from.toLowerCase() === wallet.address.toLowerCase()) return "sent";
    if (tx.to && tx.to.toLowerCase() === wallet.address.toLowerCase())
      return "received";
    if (tx.to === null || tx.to === "") return "contract-creation";
    return "contract-call";
  };

  const filteredTransactions = transactions.filter((tx) => {
    const type = getTransactionType(tx);
    const matchesFilter =
      filter === "all" ||
      (filter === "sent" && type === "sent") ||
      (filter === "received" && type === "received") ||
      (filter === "contract" &&
        (type === "contract-call" || type === "contract-creation"));

    const matchesSearch =
      !searchTerm ||
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.to && tx.to.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "未知时间";
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const calculateTransactionFee = (gasUsed: string, gasPrice: string) => {
    try {
      const gasPriceWei = ethers.parseUnits(gasPrice, "gwei");
      const feeWei = BigInt(gasUsed) * gasPriceWei;
      return ethers.formatEther(feeWei);
    } catch {
      return "0";
    }
  };

  // 格式化Gas价格显示
  const formatGasPrice = (gasPrice: string) => {
    try {
      const price = parseFloat(gasPrice);
      if (price === 0) return "0 Gwei";

      // 如果价格很小，显示更多小数位
      if (price < 0.001) {
        return `${price.toFixed(9)} Gwei`;
      } else if (price < 1) {
        return `${price.toFixed(6)} Gwei`;
      } else {
        return `${price.toFixed(2)} Gwei`;
      }
    } catch {
      return `${gasPrice} Gwei`;
    }
  };

  // 增强的Gas价格显示（包含原生货币和Gwei）
  const formatEnhancedGasPrice = (gasPrice: string) => {
    try {
      // 确保有网络信息 - 使用正确的字段名
      const networkSymbol = currentNetwork?.symbol || 'ETH';

      const priceInGwei = parseFloat(gasPrice);
      if (priceInGwei === 0) return `0 ${networkSymbol} (0 Gwei)`;

      // 将Gwei转换为原生货币单位
      // 1 Gwei = 1e-9 ETH/BNB
      const priceInNative = priceInGwei * 1e-9;

      // 格式化原生货币显示
      let nativeDisplay: string;
      if (priceInNative < 1e-12) {
        nativeDisplay = priceInNative.toExponential(3);
      } else if (priceInNative < 1e-6) {
        // 对于非常小的数值，保留更多小数位
        nativeDisplay = priceInNative.toFixed(18).replace(/\.?0+$/, '');
      } else {
        nativeDisplay = priceInNative.toFixed(15).replace(/\.?0+$/, '');
      }

      // 格式化Gwei显示
      let gweiDisplay: string;
      if (priceInGwei < 0.001) {
        gweiDisplay = priceInGwei.toFixed(9);
      } else if (priceInGwei < 1) {
        gweiDisplay = priceInGwei.toFixed(6);
      } else {
        gweiDisplay = priceInGwei.toFixed(2);
      }

      return `${nativeDisplay} ${networkSymbol} (${gweiDisplay} Gwei)`;
    } catch (error) {
      console.error('Gas price formatting error:', error, 'gasPrice:', gasPrice);
      return `${gasPrice} Gwei`;
    }
  };

  // 添加千位分隔符
  const addCommas = (num: string | number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 格式化Gas限制和使用量
  const formatGasLimitAndUsage = (gasLimit: string, gasUsed: string) => {
    try {
      const limit = parseInt(gasLimit);
      const used = parseInt(gasUsed);

      if (limit === 0) return `${addCommas(used)} (N/A)`;

      const percentage = ((used / limit) * 100).toFixed(1);
      return `${addCommas(limit)} | ${addCommas(used)} (${percentage}%)`;
    } catch {
      return `${gasLimit} | ${gasUsed}`;
    }
  };

  // 复制到剪贴板功能
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 可以添加一个简单的提示，但这里先保持简单
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 获取交易详情
  const loadTransactionDetail = useCallback(
    async (txHash: string) => {
      if (!provider || !currentNetwork) return;

      // 如果已经有详情数据或正在加载，则跳过
      if (transactionDetails[txHash] || loadingDetails[txHash]) {
        return;
      }

      setLoadingDetails(prev => ({ ...prev, [txHash]: true }));
      setDetailErrors(prev => ({ ...prev, [txHash]: '' }));

      try {
        const historyService = new TransactionHistoryService(provider, currentNetwork);
        const result = await historyService.getTransactionDetail(txHash);

        if (result.detail) {
          setTransactionDetails(prev => ({ ...prev, [txHash]: result.detail! }));
        } else {
          const errorMessage = result.errors.length > 0
            ? result.errors[0].message
            : '无法获取交易详情';
          setDetailErrors(prev => ({ ...prev, [txHash]: errorMessage }));
        }
      } catch (error) {
        console.error('获取交易详情失败:', error);
        setDetailErrors(prev => ({
          ...prev,
          [txHash]: '获取交易详情失败，请稍后重试'
        }));
      } finally {
        setLoadingDetails(prev => ({ ...prev, [txHash]: false }));
      }
    },
    [provider, currentNetwork, transactionDetails, loadingDetails]
  );

  // 加载交易日志
  const loadTransactionLogs = useCallback(
    async (txHash: string) => {
      if (!provider || !currentNetwork) return;

      // 避免重复请求
      if (transactionLogs[txHash] || loadingLogs[txHash]) {
        return;
      }

      setLoadingLogs(prev => ({ ...prev, [txHash]: true }));
      setLogErrors(prev => ({ ...prev, [txHash]: '' }));

      try {
        const historyService = new TransactionHistoryService(provider, currentNetwork);
        const result = await historyService.getTransactionLogs(txHash);

        if (result.logs.length > 0) {
          setTransactionLogs(prev => ({ ...prev, [txHash]: result.logs }));
        } else {
          const errorMessage = result.errors.length > 0
            ? result.errors[0].message
            : '无法获取交易日志';
          setLogErrors(prev => ({ ...prev, [txHash]: errorMessage }));
        }
      } catch (error) {
        console.error('获取交易日志失败:', error);
        setLogErrors(prev => ({
          ...prev,
          [txHash]: '获取交易日志失败，请稍后重试'
        }));
      } finally {
        setLoadingLogs(prev => ({ ...prev, [txHash]: false }));
      }
    },
    [provider, currentNetwork, transactionLogs, loadingLogs]
  );

  // 处理交易展开/折叠
  const handleTransactionExpand = useCallback(
    (txHash: string) => {
      const isCurrentlyExpanded = expandedTx === txHash;

      if (isCurrentlyExpanded) {
        // 折叠交易
        setExpandedTx(null);
      } else {
        // 展开交易
        setExpandedTx(txHash);
        // 加载交易详情
        loadTransactionDetail(txHash);
      }
    },
    [expandedTx, loadTransactionDetail]
  );

  // 生成OKLink地址URL
  const getOKLinkAddressUrl = (address: string) => {
    if (!currentNetwork) return '#';

    // 网络名称映射到OKLink的网络标识（基于networks.ts和OKLink官方支持）
    const networkMap: { [key: string]: string } = {
      // 主流网络（与networks.ts保持一致）
      'bnb chain': 'bsc',
      'ethereum': 'ethereum',
      'polygon': 'polygon',
      'arbitrum one': 'arbitrum-one',
      'op mainnet': 'optimism',
      'base': 'base',
      'avalanche-c': 'avalanche',
      'fantom': 'fantom',
      'zksync era': 'zksync-era',
      'polygon zkevm': 'polygon-zkevm',
      'linea': 'linea',
      'scroll': 'scroll',
      'manta pacific': 'manta',
      'opbnb mainnet': 'opbnb',

      // 测试网络
      'sepolia testnet': 'sepolia',
      'mumbai testnet': 'mumbai',
      'amoy testnet': 'amoy',

      // 兼容性别名
      'bsc': 'bsc',
      'binance smart chain': 'bsc',
      'bnb': 'bsc',
      'eth': 'ethereum',
      'mainnet': 'ethereum',
      'matic': 'polygon',
      'arbitrum': 'arbitrum-one',
      'optimism': 'optimism',
      'op': 'optimism',
      'avalanche': 'avalanche',
      'avax': 'avalanche',
      'ftm': 'fantom',
      'zksync': 'zksync-era',
      'zksync-era': 'zksync-era',
      'polygon-zkevm': 'polygon-zkevm',
      'manta': 'manta',
      'opbnb': 'opbnb',
      'sepolia': 'sepolia',
      'mumbai': 'mumbai',
      'amoy': 'amoy'
    };

    const networkName = currentNetwork.name.toLowerCase();
    const networkId = networkMap[networkName] || networkName.replace(/\s+/g, '-').toLowerCase();
    return `https://www.oklink.com/zh-hans/${networkId}/address/${address}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <History className="text-blue-400" size={20} />
            <h3 className="text-lg font-semibold text-white">交易历史</h3>
          </div>
          {dataSource !== "unknown" && (
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                dataSource === "okx"
                  ? "bg-blue-900 text-blue-300"
                  : dataSource === "none"
                  ? "bg-red-900 text-red-300"
                  : "bg-yellow-900 text-yellow-300"
              }`}
            >
              {dataSource === "okx"
                ? "OKX API"
                : dataSource === "none"
                ? "网络不支持"
                : "未知数据源"}
            </div>
          )}
        </div>
        <button
          onClick={() => loadTransactionHistory(true)}
          disabled={isLoading}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="搜索交易哈希或地址..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value as "all" | "sent" | "received" | "contract"
              )
            }
            className="pl-10 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            <option value="sent">发送</option>
            <option value="received">接收</option>
            <option value="contract">合约</option>
          </select>
        </div>
        <button
          onClick={() => setShowTokenTransfers(!showTokenTransfers)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            showTokenTransfers
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          代币转账
        </button>
      </div>

      {apiErrors.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-md p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <h4 className="text-sm font-medium text-red-300">数据源警告</h4>
          </div>
          <ul className="text-xs text-red-200 space-y-1">
            {apiErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
          <p className="text-xs text-red-300 mt-2">
            某些数据源可能无法访问，显示的交易记录可能不完整。
          </p>
        </div>
      )}

      {!isConnected ? (
        <p className="text-gray-400 text-center py-8">请先连接钱包</p>
      ) : filteredTransactions.length === 0 && !isLoading ? (
        <p className="text-gray-400 text-center py-8">暂无交易记录</p>
      ) : (
        <div className="space-y-4">
          {/* 总计信息 */}
          <div className="bg-gray-700 px-4 py-2 rounded-lg border border-gray-600">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
              <span className="text-sm text-gray-300">
                共计 {filteredTransactions.length} 条数据
              </span>
              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2">
                <span className="text-xs text-gray-400">
                  {dataSource === "okx" && "数据来源: OKX API"}
                </span>
              </div>
            </div>
          </div>

          {/* 桌面端表格布局 - 响应式优化，最大宽度90% */}
          <div className="hidden md:block bg-gray-800 rounded-lg overflow-hidden w-full max-w-[90vw] mx-auto">
            {/* 表格头部 */}
            <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
              <div className="responsive-table-header grid gap-2 text-xs font-medium text-gray-300">
                <div>交易哈希</div>
                <div>方法</div>
                <div>区块</div>
                <div className="text-blue-400">时间</div>
                <div>发送方</div>
                <div>接收方</div>
                <div>数量</div>
                <div>手续费</div>
              </div>
            </div>

            {/* 表格内容 */}
            <div className="max-h-[40vh] overflow-y-auto" id="transaction-scroll-container">
              {filteredTransactions.map((tx) => {
                const isExpanded = expandedTx === tx.hash;

                return (
                  <div
                    key={tx.hash}
                    className="border-b border-gray-700 last:border-b-0"
                  >
                    <div
                      className="px-4 py-2 cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleTransactionExpand(tx.hash)}
                    >
                      <div className="responsive-table-row grid gap-2 items-center text-sm">
                        {/* 交易哈希 */}
                        <div className="flex items-center space-x-1 min-w-0">
                          <a
                            href={getExplorerUrl(currentNetwork!, tx.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-mono text-xs truncate"
                            onClick={(e) => e.stopPropagation()}
                            title={tx.hash}
                          >
                            {shortenHash(tx.hash)}
                          </a>
                          {isExpanded ? (
                            <ChevronUp size={12} className="text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
                          )}
                        </div>

                        {/* 方法 */}
                        <div className="text-white text-xs truncate" title={tx.methodName || tx.methodId || "transfer"}>
                          {tx.methodName
                            ? tx.methodName.split("(")[0]
                            : tx.methodId
                            ? "contract"
                            : "transfer"}
                        </div>

                        {/* 区块 */}
                        <div className="text-blue-400 font-mono text-xs">
                          <a
                            href={`${currentNetwork?.blockExplorer}/block/${tx.blockNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tx.blockNumber}
                          </a>
                        </div>

                        {/* 时间 */}
                        <div className="text-gray-300 text-xs">
                          {formatTimestamp(tx.timestamp)}
                        </div>

                        {/* 发送方 */}
                        <div className="flex items-center space-x-1 min-w-0">
                          <a
                            href={getOKLinkAddressUrl(tx.from)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-mono text-xs transition-colors truncate"
                            onClick={(e) => e.stopPropagation()}
                            title={`发送方: ${tx.from}`}
                          >
                            {shortenAddress(tx.from)}
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(tx.from);
                            }}
                            className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0"
                            title="复制地址"
                          >
                            <Copy size={10} />
                          </button>
                          {tx.from.toLowerCase() ===
                            wallet?.address.toLowerCase() && (
                            <span className="text-xs bg-orange-600 text-white px-1 py-0.5 rounded flex-shrink-0">
                              Out
                            </span>
                          )}
                        </div>

                        {/* 接收方 */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1">
                            {tx.to ? (
                              <a
                                href={getOKLinkAddressUrl(tx.to)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 font-mono text-xs transition-colors truncate"
                                onClick={(e) => e.stopPropagation()}
                                title={`接收方: ${tx.to}`}
                              >
                                {shortenAddress(tx.to)}
                              </a>
                            ) : (
                              <span className="text-gray-300 font-mono text-xs truncate">
                                {shortenAddress(tx.to || "")}
                              </span>
                            )}
                            {tx.to && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(tx.to!);
                                }}
                                className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0"
                                title="复制地址"
                              >
                                <Copy size={10} />
                              </button>
                            )}
                            {tx.to?.toLowerCase() ===
                              wallet?.address.toLowerCase() && (
                              <span className="text-xs bg-green-600 text-white px-1 py-0.5 rounded flex-shrink-0">
                                In
                              </span>
                            )}
                          </div>
                          {/* NFT标识 */}
                          {tx.methodName &&
                            (tx.methodName.includes("mint") ||
                              tx.methodName.includes("feed")) && (
                              <div className="flex items-center space-x-1 mt-1">
                                <span className="text-xs text-blue-400">
                                  🔗
                                </span>
                                <span className="text-xs text-blue-400">
                                  NFT: WSPetChest
                                </span>
                              </div>
                            )}
                        </div>

                        {/* 数量 */}
                        <div className="text-white font-mono text-xs min-w-0">
                          {parseFloat(tx.value) > 0 ? (
                            <span
                              className={`truncate block ${
                                tx.from.toLowerCase() ===
                                wallet?.address.toLowerCase()
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}
                              title={`${tx.from.toLowerCase() === wallet?.address.toLowerCase() ? "-" : ""}${parseFloat(tx.value).toFixed(10)} ${currentNetwork?.symbol}`}
                            >
                              {tx.from.toLowerCase() ===
                              wallet?.address.toLowerCase()
                                ? "-"
                                : ""}
                              {parseFloat(tx.value).toFixed(6)}{" "}
                              <span className="hidden lg:inline">{currentNetwork?.symbol}</span>
                              <span className="lg:hidden">{currentNetwork?.symbol?.slice(0, 3)}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 truncate block" title={`0.0000000000 ${currentNetwork?.symbol}`}>
                              0.000000{" "}
                              <span className="hidden lg:inline">{currentNetwork?.symbol}</span>
                              <span className="lg:hidden">{currentNetwork?.symbol?.slice(0, 3)}</span>
                            </span>
                          )}
                        </div>

                        {/* 手续费 */}
                        <div className="text-gray-300 font-mono text-xs min-w-0">
                          <span
                            className="truncate block"
                            title={`${tx.fee !== undefined && tx.fee !== null && tx.fee > 0 ?
                              `${parseFloat(tx.fee.toString()).toFixed(10)} ${currentNetwork?.symbol}` :
                              `${parseFloat(calculateTransactionFee(tx.gasUsed, tx.gasPrice)).toFixed(10)} ${currentNetwork?.symbol}`
                            }`}
                          >
                            {tx.fee !== undefined && tx.fee !== null && tx.fee > 0 ?
                              `${parseFloat(tx.fee.toString()).toFixed(6)} ` :
                              `${parseFloat(calculateTransactionFee(tx.gasUsed, tx.gasPrice)).toFixed(6)} `
                            }
                            <span className="hidden lg:inline">{currentNetwork?.symbol}</span>
                            <span className="lg:hidden">{currentNetwork?.symbol?.slice(0, 3)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 展开的详细信息 */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-600">
                        {/* 加载状态 */}
                        {loadingDetails[tx.hash] && (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                            <span className="ml-2 text-sm text-gray-400">加载详细信息...</span>
                          </div>
                        )}

                        {/* 错误状态 */}
                        {detailErrors[tx.hash] && !loadingDetails[tx.hash] && (
                          <div className="py-4">
                            <div className="text-sm text-red-400">
                              {detailErrors[tx.hash]}
                            </div>
                          </div>
                        )}

                        {/* 详细信息 - 优化的网格布局 */}
                        {!loadingDetails[tx.hash] && !detailErrors[tx.hash] && (
                          <div className="detail-grid mt-4">
                            {/* 状态 */}
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">状态</label>
                              <div className={`text-sm ${
                                tx.status === 1 ? "text-green-400" : "text-red-400"
                              }`}>
                                {tx.status === 1 ? "成功" : "失败"}
                              </div>
                            </div>

                            {/* 确认数 */}
                            {transactionDetails[tx.hash]?.confirm !== undefined ? (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">确认数</label>
                                <div className="text-sm text-white">
                                  {transactionDetails[tx.hash].confirm}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Nonce</label>
                                <div className="text-sm text-white">
                                  {transactionDetails[tx.hash]?.nonce || tx.nonce}
                                </div>
                              </div>
                            )}

                            {/* Gas 限额 & Gas 消耗 */}
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Gas 限额 & Gas 消耗</label>
                              <div className="text-sm text-white font-mono">
                                {formatGasLimitAndUsage(
                                  transactionDetails[tx.hash]?.gasLimit || tx.gasLimit || '0',
                                  transactionDetails[tx.hash]?.gasUsed || tx.gasUsed
                                )}
                              </div>
                            </div>

                            {/* Gas 价格 */}
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Gas 价格</label>
                              <div className="text-sm text-white font-mono">
                                {formatEnhancedGasPrice(transactionDetails[tx.hash]?.gasPrice || tx.gasPrice)}
                              </div>
                            </div>

                            {/* 交易索引 */}
                            {transactionDetails[tx.hash]?.index !== undefined && (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">交易索引</label>
                                <div className="text-sm text-white">
                                  {transactionDetails[tx.hash].index}
                                </div>
                              </div>
                            )}

                            {/* 代币转账数量 */}
                            {transactionDetails[tx.hash]?.tokenTransferCount !== undefined && (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">代币转账数</label>
                                <div className="text-sm text-white">
                                  {transactionDetails[tx.hash].tokenTransferCount}
                                </div>
                              </div>
                            )}

                            {/* 日志数量 - 交互式 */}
                            {transactionDetails[tx.hash]?.logCount !== undefined && (
                              <TransactionLogsViewer
                                logs={transactionLogs[tx.hash] || []}
                                logCount={transactionDetails[tx.hash].logCount}
                                isLoading={loadingLogs[tx.hash]}
                                onLoadLogs={() => loadTransactionLogs(tx.hash)}
                              />
                            )}

                            {/* 内部交易数量 */}
                            {transactionDetails[tx.hash]?.internalTranCount !== undefined && (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">内部交易数</label>
                                <div className="text-sm text-white">
                                  {transactionDetails[tx.hash].internalTranCount}
                                </div>
                              </div>
                            )}

                            {/* 合约部署标识 */}
                            {transactionDetails[tx.hash]?.deploymentContract && (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">交易类型</label>
                                <div className="text-sm text-purple-400">
                                  合约部署
                                </div>
                              </div>
                            )}

                            {/* 方法签名 */}
                            {(tx.methodId || transactionDetails[tx.hash]?.methodId) && (
                              <div className="col-span-2">
                                <label className="text-xs text-gray-400 block mb-1">方法签名</label>
                                <div className="text-sm text-white font-mono">
                                  {transactionDetails[tx.hash]?.methodId || tx.methodId}
                                </div>
                                {(tx.methodName || transactionDetails[tx.hash]?.methodName) && (
                                  <div className="text-xs text-yellow-400 mt-1">
                                    {transactionDetails[tx.hash]?.methodName || tx.methodName}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 输入数据 - 交互式 */}
                            {(tx.data || transactionDetails[tx.hash]?.inputHex) && (
                              <div className="col-span-2">
                                <InputDataViewer
                                  inputData={transactionDetails[tx.hash]?.inputHex || tx.data}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-gray-600">
                          {currentNetwork && (
                            <a
                              href={getExplorerUrl(currentNetwork, tx.hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                            >
                              <span>在区块浏览器中查看</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 桌面端 - 数据加载完成提示 */}
              {!hasMore && transactions.length > 0 && (
                <div className="py-6 flex justify-center items-center border-t border-gray-700">
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <div className="w-8 h-px bg-gray-600"></div>
                    <span>已加载全部交易记录</span>
                    <div className="w-8 h-px bg-gray-600"></div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 移动端卡片布局 - 最大宽度90% */}
          <div className="md:hidden space-y-3 w-full max-w-[90vw] mx-auto max-h-[90vh] overflow-y-auto" id="transaction-scroll-container-mobile">
            {filteredTransactions.map((tx) => {
              const isExpanded = expandedTx === tx.hash;

              return (
                <div
                  key={tx.hash}
                  className="bg-gray-700 rounded-lg overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleTransactionExpand(tx.hash)}
                  >
                    {/* 卡片头部 - 状态和时间 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            tx.status === 1 ? "bg-green-400" : "bg-red-400"
                          }`}
                        ></div>
                        <span className="text-sm text-green-400">交易成功</span>
                        <span className="text-xs text-gray-400">
                          ({formatTimestamp(tx.timestamp)})
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>

                    {/* 交易哈希 */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-400 mb-1">
                        交易哈希:
                      </div>
                      <a
                        href={getExplorerUrl(currentNetwork!, tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-mono text-sm break-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {tx.hash}
                      </a>
                    </div>

                    {/* 方法和区块 */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">方法</div>
                        <div className="text-white text-sm">
                          {tx.methodName
                            ? tx.methodName.split("(")[0]
                            : tx.methodId
                            ? "contract"
                            : "transfer"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">区块</div>
                        <a
                          href={`${currentNetwork?.blockExplorer}/block/${tx.blockNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tx.blockNumber}
                        </a>
                      </div>
                    </div>

                    {/* 发送方和接收方 */}
                    <div className="mb-3">
                      <div className="grid grid-cols-2 gap-4">
                        {/* 发送方 */}
                        <div>
                          <div className="text-xs text-gray-400 mb-1">发送方</div>
                          <div className="flex items-center space-x-1">
                            <a
                              href={getOKLinkAddressUrl(tx.from)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 font-mono text-sm transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="在OKLink中查看地址"
                            >
                              {shortenAddress(tx.from)}
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(tx.from);
                              }}
                              className="text-gray-400 hover:text-gray-200 transition-colors"
                              title="复制地址"
                            >
                              <Copy size={12} />
                            </button>
                            {tx.from.toLowerCase() ===
                              wallet?.address.toLowerCase() && (
                              <span className="text-xs bg-orange-600 text-white px-1 py-0.5 rounded">
                                Out
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 接收方 */}
                        <div>
                          <div className="text-xs text-gray-400 mb-1">接收方</div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              {tx.to ? (
                                <a
                                  href={getOKLinkAddressUrl(tx.to)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 font-mono text-sm transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                  title="在OKLink中查看地址"
                                >
                                  {shortenAddress(tx.to)}
                                </a>
                              ) : (
                                <span className="text-gray-300 font-mono text-sm">
                                  {shortenAddress(tx.to || "")}
                                </span>
                              )}
                              {tx.to && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(tx.to!);
                                  }}
                                  className="text-gray-400 hover:text-gray-200 transition-colors"
                                  title="复制地址"
                                >
                                  <Copy size={12} />
                                </button>
                              )}
                              {tx.to?.toLowerCase() ===
                                wallet?.address.toLowerCase() && (
                                <span className="text-xs bg-green-600 text-white px-1 py-0.5 rounded">
                                  In
                                </span>
                              )}
                            </div>
                            {/* NFT标识 */}
                            {tx.methodName &&
                              (tx.methodName.includes("mint") ||
                                tx.methodName.includes("feed")) && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-blue-400">🔗</span>
                                  <span className="text-xs text-blue-400">NFT: WSPetChest</span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 数量和手续费 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">数量</div>
                        <div className="text-white font-mono text-sm">
                          {parseFloat(tx.value) > 0 ? (
                            <span
                              className={
                                tx.from.toLowerCase() ===
                                wallet?.address.toLowerCase()
                                  ? "text-red-400"
                                  : "text-green-400"
                              }
                            >
                              {tx.from.toLowerCase() ===
                              wallet?.address.toLowerCase()
                                ? "-"
                                : ""}
                              {parseFloat(tx.value).toFixed(10)}{" "}
                              {currentNetwork?.symbol}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              0.0000000000 {currentNetwork?.symbol}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">手续费</div>
                        <div className="text-gray-300 font-mono text-sm">
                          {tx.fee !== undefined && tx.fee !== null && tx.fee > 0 ?
                            `${parseFloat(tx.fee.toString()).toFixed(10)} ${currentNetwork?.symbol}` :
                            `${parseFloat(calculateTransactionFee(tx.gasUsed, tx.gasPrice)).toFixed(10)} ${currentNetwork?.symbol}`
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 展开的详细信息 - 移动端优化网格布局 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-600">
                      <div className="detail-grid mt-4">
                        {/* 状态 */}
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">状态</label>
                          <div className={`text-sm ${
                            tx.status === 1 ? "text-green-400" : "text-red-400"
                          }`}>
                            {tx.status === 1 ? "成功" : "失败"}
                          </div>
                        </div>

                        {/* 确认数或Nonce */}
                        {transactionDetails[tx.hash]?.confirm !== undefined ? (
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">确认数</label>
                            <div className="text-sm text-white">
                              {transactionDetails[tx.hash].confirm}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Nonce</label>
                            <div className="text-sm text-white">
                              {transactionDetails[tx.hash]?.nonce || tx.nonce}
                            </div>
                          </div>
                        )}

                        {/* Gas 限额 & Gas 消耗 */}
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400 block mb-1">Gas 限额 & Gas 消耗</label>
                          <div className="text-sm text-white font-mono">
                            {formatGasLimitAndUsage(
                              transactionDetails[tx.hash]?.gasLimit || tx.gasLimit || '0',
                              transactionDetails[tx.hash]?.gasUsed || tx.gasUsed
                            )}
                          </div>
                        </div>

                        {/* Gas 价格 */}
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400 block mb-1">Gas 价格</label>
                          <div className="text-sm text-white font-mono">
                            {formatEnhancedGasPrice(transactionDetails[tx.hash]?.gasPrice || tx.gasPrice)}
                          </div>
                        </div>

                        {/* 交易索引 */}
                        {transactionDetails[tx.hash]?.transactionIndex !== undefined && (
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">交易索引</label>
                            <div className="text-sm text-white">
                              {transactionDetails[tx.hash].transactionIndex}
                            </div>
                          </div>
                        )}

                        {/* 方法签名 */}
                        {(tx.methodId || transactionDetails[tx.hash]?.methodId) && (
                          <div className="col-span-2">
                            <label className="text-xs text-gray-400 block mb-1">方法签名</label>
                            <div className="text-sm text-white font-mono">
                              {transactionDetails[tx.hash]?.methodId || tx.methodId}
                            </div>
                            {(tx.methodName || transactionDetails[tx.hash]?.methodName) && (
                              <div className="text-xs text-yellow-400 mt-1">
                                {transactionDetails[tx.hash]?.methodName || tx.methodName}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 日志数量 - 移动端交互式 */}
                        {transactionDetails[tx.hash]?.logCount !== undefined && (
                          <div className="col-span-2">
                            <TransactionLogsViewer
                              logs={transactionLogs[tx.hash] || []}
                              logCount={transactionDetails[tx.hash].logCount}
                              isLoading={loadingLogs[tx.hash]}
                              onLoadLogs={() => loadTransactionLogs(tx.hash)}
                            />
                          </div>
                        )}

                        {/* 输入数据 - 移动端交互式 */}
                        {(tx.data || transactionDetails[tx.hash]?.inputHex) && (
                          <div className="col-span-2">
                            <InputDataViewer
                              inputData={transactionDetails[tx.hash]?.inputHex || tx.data}
                              truncateLength={24}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 pt-3 border-t border-gray-600">
                        {currentNetwork && (
                          <a
                            href={getExplorerUrl(currentNetwork, tx.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                          >
                            <span>在区块浏览器中查看</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}

              {/* 移动端 - 数据加载完成提示 */}
              {!hasMore && transactions.length > 0 && (
                <div className="py-6 flex justify-center items-center">
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <div className="w-6 h-px bg-gray-600"></div>
                    <span>已加载全部交易记录</span>
                    <div className="w-6 h-px bg-gray-600"></div>
                  </div>
                </div>
              )}

          </div>

          {/* 无限滚动状态指示器 */}
          {transactions.length > 0 && (
            <div className="mt-4 py-2 flex justify-center items-center">
              {isLoading && hasMore && (
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400"></div>
                  <span className="text-xs">正在加载更多...</span>
                </div>
              )}
              {!isLoading && hasMore && transactions.length > 0 && (
                <div className="text-xs text-gray-500">
                  继续滚动加载更多
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
