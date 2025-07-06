/**
 * API错误处理工具
 * 专门处理各种API调用中的错误情况
 */

export enum ApiErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  type: ApiErrorType;
  message: string;
  originalError?: any;
  canRetry: boolean;
  suggestedAction: string;
}

/**
 * 分析API响应错误
 */
export function analyzeApiError(response: any, error?: any): ApiError {
  // 检查HTTP状态码
  if (response?.status) {
    switch (response.status) {
      case 401:
      case 403:
        return {
          type: ApiErrorType.AUTHENTICATION_ERROR,
          message: 'API密钥无效或缺失',
          originalError: error,
          canRetry: false,
          suggestedAction: '请检查API密钥配置或使用备选数据源'
        };
      
      case 429:
        return {
          type: ApiErrorType.RATE_LIMIT_ERROR,
          message: 'API请求频率超限',
          originalError: error,
          canRetry: true,
          suggestedAction: '请稍后重试或使用备选数据源'
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ApiErrorType.SERVICE_UNAVAILABLE,
          message: 'API服务暂时不可用',
          originalError: error,
          canRetry: true,
          suggestedAction: '请稍后重试或使用备选数据源'
        };
    }
  }

  // 检查响应内容中的错误信息
  if (response?.message || response?.error) {
    const errorMessage = response.message || response.error;
    
    // 检查常见的认证错误信息
    if (errorMessage.toLowerCase().includes('api key') || 
        errorMessage.toLowerCase().includes('invalid key') ||
        errorMessage.toLowerCase().includes('missing key')) {
      return {
        type: ApiErrorType.AUTHENTICATION_ERROR,
        message: 'API密钥问题: ' + errorMessage,
        originalError: error,
        canRetry: false,
        suggestedAction: '请配置正确的API密钥或使用备选数据源'
      };
    }
    
    // 检查速率限制错误
    if (errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('too many requests')) {
      return {
        type: ApiErrorType.RATE_LIMIT_ERROR,
        message: '请求频率超限: ' + errorMessage,
        originalError: error,
        canRetry: true,
        suggestedAction: '请稍后重试'
      };
    }
  }

  // 网络错误
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    return {
      type: ApiErrorType.NETWORK_ERROR,
      message: '网络连接错误',
      originalError: error,
      canRetry: true,
      suggestedAction: '请检查网络连接或使用备选数据源'
    };
  }

  // 默认未知错误
  return {
    type: ApiErrorType.UNKNOWN_ERROR,
    message: error?.message || '未知错误',
    originalError: error,
    canRetry: true,
    suggestedAction: '请重试或使用备选数据源'
  };
}

/**
 * 检查错误是否为认证相关
 */
export function isAuthenticationError(error: ApiError): boolean {
  return error.type === ApiErrorType.AUTHENTICATION_ERROR;
}

/**
 * 检查错误是否可以重试
 */
export function canRetryAfterError(error: ApiError): boolean {
  return error.canRetry;
}

/**
 * 获取错误的用户友好描述
 */
export function getErrorDescription(error: ApiError): string {
  switch (error.type) {
    case ApiErrorType.AUTHENTICATION_ERROR:
      return '🔑 API认证失败，正在尝试备选数据源...';
    
    case ApiErrorType.RATE_LIMIT_ERROR:
      return '⏱️ 请求频率过高，正在尝试备选数据源...';
    
    case ApiErrorType.NETWORK_ERROR:
      return '🌐 网络连接问题，正在尝试备选数据源...';
    
    case ApiErrorType.SERVICE_UNAVAILABLE:
      return '🔧 服务暂时不可用，正在尝试备选数据源...';
    
    case ApiErrorType.INVALID_RESPONSE:
      return '📄 数据格式异常，正在尝试备选数据源...';
    
    default:
      return '❌ 数据获取失败，正在尝试备选数据源...';
  }
}

/**
 * 记录API错误（用于调试和监控）
 */
export function logApiError(source: string, error: ApiError, context?: any): void {
  console.group(`🚨 API错误 - ${source}`);
  console.error('错误类型:', error.type);
  console.error('错误信息:', error.message);
  console.error('建议操作:', error.suggestedAction);
  console.error('可重试:', error.canRetry);
  
  if (context) {
    console.error('上下文:', context);
  }
  
  if (error.originalError) {
    console.error('原始错误:', error.originalError);
  }
  
  console.groupEnd();
}

/**
 * 创建重试延迟（指数退避）
 */
export function getRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attemptNumber - 1), 10000);
}

/**
 * 检查响应是否表示成功
 */
export function isSuccessfulResponse(response: any): boolean {
  // 检查HTTP状态码
  if (response?.status && (response.status < 200 || response.status >= 300)) {
    return false;
  }
  
  // 检查API特定的成功标识
  if (response?.status === '0' || response?.success === false) {
    return false;
  }
  
  // 检查是否有数据
  if (response?.result && Array.isArray(response.result) && response.result.length === 0) {
    return true; // 空结果也是成功的
  }
  
  if (response?.data && Array.isArray(response.data) && response.data.length === 0) {
    return true; // 空结果也是成功的
  }
  
  return true;
}
