import React from 'react';
import { NetworkConfig } from '../types/web3';

interface NetworkIconProps {
  network: NetworkConfig;
  size?: number;
  className?: string;
}

export const NetworkIcon: React.FC<NetworkIconProps> = ({ 
  network, 
  size = 16,
  className = ''
}) => {
  if (network.iconUrl) {
    return (
      <img
        src={network.iconUrl}
        alt={network.name}
        className={`rounded-full flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          // 如果图标加载失败，显示颜色圆点作为后备
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'block';
        }}
      />
    );
  }
  
  return (
    <div
      className={`rounded-full flex-shrink-0 ${className}`}
      style={{ 
        backgroundColor: network.color,
        width: size,
        height: size
      }}
    />
  );
};
