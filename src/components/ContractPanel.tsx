import React, { useState } from "react";
import { Code, Search, Play } from "lucide-react";
import { isValidAddress } from "../utils/crypto";
import { ethers } from "ethers";
import { ContractMethod } from "../types/web3";

interface ContractPanelProps {
  provider: ethers.JsonRpcProvider | null;
  isConnected: boolean;
}

export const ContractPanel: React.FC<ContractPanelProps> = ({
  provider,
  isConnected,
}) => {
  const [contractAddress, setContractAddress] = useState("");
  const [abi, setAbi] = useState("");
  const [contractMethods, setContractMethods] = useState<ContractMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ContractMethod | null>(
    null
  );
  const [methodInputs, setMethodInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [methodResult, setMethodResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const parseABI = () => {
    try {
      const parsedAbi = JSON.parse(abi);
      const methods = parsedAbi.filter(
        (item: { type?: string }) => item.type === "function"
      ) as ContractMethod[];
      setContractMethods(methods);
      setSelectedMethod(null);
      setMethodResult("");
    } catch (error) {
      console.error("无效的 ABI:", error);
      alert("无效的 ABI 格式");
    }
  };

  const executeMethod = async () => {
    if (!selectedMethod || !contractAddress || !provider) return;

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(
        contractAddress,
        [selectedMethod],
        provider
      );

      const inputs = selectedMethod.inputs.map((input) => {
        const value = methodInputs[input.name] || "";
        // 基本类型转换
        if (input.type === "uint256" || input.type.startsWith("uint")) {
          return BigInt(value || "0");
        }
        return value;
      });

      const result = await contract[selectedMethod.name](...inputs);
      setMethodResult(
        typeof result === "object"
          ? JSON.stringify(result, null, 2)
          : result.toString()
      );
    } catch (error) {
      console.error("方法执行失败:", error);
      setMethodResult(
        `错误: ${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodInputChange = (inputName: string, value: string) => {
    setMethodInputs((prev) => ({
      ...prev,
      [inputName]: value,
    }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <Code className="text-yellow-400" size={20} />
        <h3 className="text-lg font-semibold text-white">智能合约</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            合约地址
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          {contractAddress && !isValidAddress(contractAddress) && (
            <p className="text-sm text-red-400">无效的合约地址</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            合约 ABI
          </label>
          <textarea
            value={abi}
            onChange={(e) => setAbi(e.target.value)}
            placeholder="粘贴合约 ABI JSON..."
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={parseABI}
          disabled={!abi.trim()}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Search size={18} />
          <span>解析 ABI</span>
        </button>

        {contractMethods.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                选择方法
              </label>
              <select
                value={selectedMethod?.name || ""}
                onChange={(e) => {
                  const method =
                    contractMethods.find((m) => m.name === e.target.value) ||
                    null;
                  setSelectedMethod(method);
                  setMethodInputs({});
                  setMethodResult("");
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">选择一个方法</option>
                {contractMethods.map((method) => (
                  <option key={method.name} value={method.name}>
                    {method.name} ({method.stateMutability || "view"})
                  </option>
                ))}
              </select>
            </div>

            {selectedMethod && (
              <div className="space-y-4">
                {selectedMethod.inputs.map((input) => (
                  <div key={input.name} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      {input.name} ({input.type})
                    </label>
                    <input
                      type="text"
                      value={methodInputs[input.name] || ""}
                      onChange={(e) =>
                        handleMethodInputChange(input.name, e.target.value)
                      }
                      placeholder={`输入 ${input.type} 值`}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                ))}

                <button
                  onClick={executeMethod}
                  disabled={
                    !isConnected ||
                    !contractAddress ||
                    !isValidAddress(contractAddress) ||
                    isLoading
                  }
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Play size={18} />
                  <span>{isLoading ? "执行中..." : "执行方法"}</span>
                </button>

                {methodResult && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      结果
                    </label>
                    <pre className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm font-mono whitespace-pre-wrap">
                      {methodResult}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
