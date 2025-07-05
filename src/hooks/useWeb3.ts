import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { NetworkConfig, Transaction, ActivityLog } from "../types/web3";
import { isValidPrivateKey } from "../utils/crypto";

export const useWeb3 = () => {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig | null>(
    null
  );
  const [gasPrice, setGasPrice] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const addLog = useCallback((log: Omit<ActivityLog, "id" | "timestamp">) => {
    const newLog: ActivityLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  }, []);

  const connectWallet = useCallback(
    async (privateKey: string, network: NetworkConfig) => {
      try {
        // 只支持 EVM 网络的连接
        if (network.type !== "evm") {
          throw new Error("当前只支持 EVM 网络连接");
        }

        if (!isValidPrivateKey(privateKey)) {
          throw new Error("无效的私钥");
        }

        const rpcProvider = new ethers.JsonRpcProvider(network.rpcUrl);
        const walletInstance = new ethers.Wallet(privateKey, rpcProvider);

        // 测试连接
        await rpcProvider.getNetwork();

        setProvider(rpcProvider);
        setWallet(walletInstance);
        setCurrentNetwork(network);
        setIsConnected(true);

        // 获取 gas 价格
        try {
          const feeData = await rpcProvider.getFeeData();
          if (feeData.gasPrice) {
            setGasPrice(ethers.formatUnits(feeData.gasPrice, "gwei"));
          }
        } catch (error) {
          console.warn("无法获取 gas 价格:", error);
        }

        addLog({
          type: "transaction",
          message: `已连接到 ${network.name}`,
          status: "success",
        });

        return walletInstance;
      } catch (error) {
        addLog({
          type: "error",
          message: `连接失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
          status: "error",
        });
        throw error;
      }
    },
    [addLog]
  );

  const disconnect = useCallback(() => {
    setProvider(null);
    setWallet(null);
    setCurrentNetwork(null);
    setIsConnected(false);
    setGasPrice("");

    addLog({
      type: "transaction",
      message: "已断开钱包连接",
      status: "success",
    });
  }, [addLog]);

  const getBalance = useCallback(
    async (address: string) => {
      if (!provider) throw new Error("提供者未连接");

      try {
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
      } catch (error) {
        addLog({
          type: "error",
          message: `获取余额失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
          status: "error",
        });
        throw error;
      }
    },
    [provider, addLog]
  );

  const sendTransaction = useCallback(
    async (transaction: Transaction) => {
      if (!wallet || !provider) throw new Error("钱包未连接");

      try {
        const tx = await wallet.sendTransaction({
          to: transaction.to,
          value: transaction.value ? ethers.parseEther(transaction.value) : 0,
          data: transaction.data || "0x",
          gasLimit: transaction.gasLimit || 21000,
          gasPrice: transaction.gasPrice
            ? ethers.parseUnits(transaction.gasPrice, "gwei")
            : undefined,
        });

        addLog({
          type: "transaction",
          message: `交易已发送: ${tx.hash}`,
          status: "pending",
          txHash: tx.hash,
        });

        const receipt = await tx.wait();

        addLog({
          type: "transaction",
          message: `交易已确认: ${tx.hash}`,
          status: "success",
          txHash: tx.hash,
          details: receipt ? {
            from: receipt.from,
            to: receipt.to || undefined,
            gasUsed: receipt.gasUsed?.toString(),
            gasPrice: receipt.gasPrice?.toString(),
            blockNumber: receipt.blockNumber,
          } : undefined,
        });

        return receipt;
      } catch (error) {
        addLog({
          type: "error",
          message: `交易失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
          status: "error",
        });
        throw error;
      }
    },
    [wallet, provider, addLog]
  );

  const signMessage = useCallback(
    async (message: string) => {
      if (!wallet) throw new Error("钱包未连接");

      try {
        const signature = await wallet.signMessage(message);

        addLog({
          type: "signature",
          message: `消息已签名: ${message}`,
          status: "success",
          details: { message, signature },
        });

        return signature;
      } catch (error) {
        addLog({
          type: "error",
          message: `签名失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
          status: "error",
        });
        throw error;
      }
    },
    [wallet, addLog]
  );

  const estimateGas = useCallback(
    async (transaction: Transaction) => {
      if (!provider) throw new Error("提供者未连接");

      try {
        const estimate = await provider.estimateGas({
          to: transaction.to,
          value: transaction.value ? ethers.parseEther(transaction.value) : 0,
          data: transaction.data || "0x",
        });

        return estimate.toString();
      } catch (error) {
        addLog({
          type: "error",
          message: `Gas 估算失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
          status: "error",
        });
        throw error;
      }
    },
    [provider, addLog]
  );

  const switchNetwork = useCallback(
    async (network: NetworkConfig) => {
      if (!wallet) throw new Error("钱包未连接");

      try {
        // 只支持 EVM 网络的切换
        if (network.type !== "evm") {
          throw new Error("当前只支持 EVM 网络切换");
        }

        const rpcProvider = new ethers.JsonRpcProvider(network.rpcUrl);
        const walletInstance = new ethers.Wallet(wallet.privateKey, rpcProvider);

        // 测试连接
        await rpcProvider.getNetwork();

        setProvider(rpcProvider);
        setWallet(walletInstance);
        setCurrentNetwork(network);

        // 获取 gas 价格
        try {
          const feeData = await rpcProvider.getFeeData();
          if (feeData.gasPrice) {
            setGasPrice(ethers.formatUnits(feeData.gasPrice, "gwei"));
          }
        } catch (error) {
          console.warn("无法获取 gas 价格:", error);
        }

        addLog({
          type: "transaction",
          message: `已切换到 ${network.name}`,
          status: "success",
        });

        return walletInstance;
      } catch (error) {
        addLog({
          type: "error",
          message: `网络切换失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
          status: "error",
        });
        throw error;
      }
    },
    [wallet, addLog]
  );

  return {
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
    switchNetwork,
    addLog,
  };
};
