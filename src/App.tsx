import React, { useState, useEffect } from 'react';
import { Zap, Wallet, Send, Code, FileSignature, Activity, Key, ChevronDown, History } from 'lucide-react';
import { useWeb3 } from './hooks/useWeb3';
import { ConnectionPanel } from './components/ConnectionPanel';
import { WalletPanel } from './components/WalletPanel';
import { TransactionPanel } from './components/TransactionPanel';
import { ContractPanel } from './components/ContractPanel';
import { SignaturePanel } from './components/SignaturePanel';
import { ActivityLog } from './components/ActivityLog';
import { MnemonicPanel } from './components/MnemonicPanel';
import { TransactionHistory } from './components/TransactionHistory';
import { NetworkConfig, Transaction } from './types/web3';
import { NETWORKS } from './utils/networks';

function App() {
  const {
    provider,
    wallet,
    currentNetwork,
    gasPrice,
    isConnected,
    activityLogs,
    connectWallet,
    disconnect,
    getBalance,
    sendTransaction,
    signMessage,
    estimateGas,
    switchNetwork
  } = useWeb3();

  const [activeTab, setActiveTab] = useState('wallet');
  const [balance, setBalance] = useState<string>('0');
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  // 获取钱包余额
  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet && isConnected) {
        try {
          const bal = await getBalance(wallet.address);
          setBalance(bal);
        } catch (error) {
          console.error('获取余额失败:', error);
          setBalance('0');
        }
      } else {
        setBalance('0');
      }
    };

    fetchBalance();

    // 设置定时器每30秒更新一次余额
    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, [wallet, isConnected, getBalance, currentNetwork]);

  // 处理网络切换
  const handleNetworkSwitch = async (network: NetworkConfig) => {
    try {
      await switchNetwork(network);
      setShowNetworkDropdown(false);
    } catch (error) {
      console.error('网络切换失败:', error);
    }
  };

  // 包装连接函数以匹配接口
  const handleConnect = async (privateKey: string, network: NetworkConfig) => {
    await connectWallet(privateKey, network);
  };

  // 包装网络切换函数以匹配接口
  const handleSwitchNetwork = async (network: NetworkConfig) => {
    await switchNetwork(network);
  };

  // 包装发送交易函数以匹配接口
  const handleSendTransaction = async (transaction: Transaction) => {
    await sendTransaction(transaction);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const dropdown = document.querySelector('[data-network-dropdown]');
      const button = document.querySelector('[data-network-button]');

      if (showNetworkDropdown && dropdown && button) {
        if (!dropdown.contains(target) && !button.contains(target)) {
          setShowNetworkDropdown(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNetworkDropdown]);

  const tabs = [
    { id: 'wallet', label: '钱包管理', icon: Wallet },
    { id: 'mnemonic', label: '助记词', icon: Key },
    { id: 'transaction', label: '交易', icon: Send },
    { id: 'history', label: '交易历史', icon: History },
    { id: 'contract', label: '合约', icon: Code },
    { id: 'signature', label: '签名', icon: FileSignature },
    { id: 'activity', label: '活动', icon: Activity }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'wallet':
        return (
          <WalletPanel
            wallet={wallet}
            onGetBalance={getBalance}
            currentNetwork={currentNetwork}
            isConnected={isConnected}
          />
        );
      case 'mnemonic':
        return (
          <MnemonicPanel
            onConnectWallet={handleConnect}
            currentNetwork={currentNetwork}
          />
        );

      case 'transaction':
        return (
          <TransactionPanel
            onSendTransaction={handleSendTransaction}
            onEstimateGas={estimateGas}
            gasPrice={gasPrice}
            isConnected={isConnected}
          />
        );
      case 'history':
        return (
          <TransactionHistory
            wallet={wallet}
            provider={provider}
            currentNetwork={currentNetwork}
            isConnected={isConnected}
          />
        );
      case 'contract':
        return (
          <ContractPanel
            provider={provider}
            isConnected={isConnected}
          />
        );
      case 'signature':
        return (
          <SignaturePanel
            onSignMessage={signMessage}
            isConnected={isConnected}
          />
        );
      case 'activity':
        return (
          <ActivityLog
            logs={activityLogs}
            currentNetwork={currentNetwork}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 头部 */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Zap className="text-blue-400" size={24} />
              <h1 className="text-xl font-bold text-white">Web3 多链测试套件</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected && currentNetwork && (
                <div className="relative">
                  <button
                    data-network-button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNetworkDropdown(!showNetworkDropdown);
                    }}
                    className="flex items-center space-x-2 px-3 py-1 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentNetwork.color }}
                    />
                    <span className="text-sm text-gray-300">{currentNetwork.name}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {showNetworkDropdown && (
                    <div
                      data-network-dropdown
                      className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50"
                    >
                      {NETWORKS.map((network) => (
                        <button
                          key={network.chainId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNetworkSwitch(network);
                          }}
                          className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-700 transition-colors ${
                            currentNetwork.chainId === network.chainId ? 'bg-gray-700' : ''
                          }`}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: network.color }}
                          />
                          <span className="text-sm text-gray-300">{network.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isConnected && currentNetwork ? (
                <div className="text-sm text-gray-400">
                  {balance} {currentNetwork.symbol}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  未连接
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 连接面板 */}
          <div className="lg:col-span-1">
            <ConnectionPanel
              isConnected={isConnected}
              currentNetwork={currentNetwork}
              onConnect={handleConnect}
              onDisconnect={disconnect}
              onSwitchNetwork={handleSwitchNetwork}
            />
          </div>

          {/* 主要内容 */}
          <div className="lg:col-span-2">
            {/* 标签导航 */}
            <div className="mb-6">
              <div className="border-b border-gray-700">
                <nav className="flex space-x-8 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* 标签内容 */}
            <div>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;