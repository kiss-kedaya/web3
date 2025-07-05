import { ethers } from 'ethers';
import * as bip39 from 'bip39';

export const isValidPrivateKey = (privateKey: string): boolean => {
  try {
    if (!privateKey || privateKey.trim() === '') {
      return false;
    }

    // 移除空格和换行符
    privateKey = privateKey.trim().replace(/\s/g, '');

    // 如果没有0x前缀，添加它
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    // 检查长度（64个十六进制字符 + 0x前缀 = 66个字符）
    if (privateKey.length !== 66) {
      return false;
    }

    // 检查是否为有效的十六进制
    if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
      return false;
    }

    // 尝试创建钱包实例
    new ethers.Wallet(privateKey);
    return true;
  } catch (error) {
    console.log('私钥验证失败:', error);
    return false;
  }
};

export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};


export const formatEther = (value: string): string => {
  try {
    return ethers.formatEther(value);
  } catch {
    return '0';
  }
};

export const parseEther = (value: string): string => {
  try {
    return ethers.parseEther(value).toString();
  } catch {
    return '0';
  }
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidMnemonic = (mnemonic: string): boolean => {
  try {
    return bip39.validateMnemonic(mnemonic);
  } catch {
    return false;
  }
};

export const generateWalletFromMnemonic = (mnemonic: string, index: number = 0): { address: string; privateKey: string; path: string } => {
  try {
    const path = `m/44'/60'/0'/0/${index}`;
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);
    
    return {
      address: hdNode.address,
      privateKey: hdNode.privateKey,
      path: path
    };
  } catch (error) {
    throw new Error(`从助记词生成钱包失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};



