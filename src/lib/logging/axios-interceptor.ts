import { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { frontendLogger, FrontendAction } from './logger';

export function setupAxiosInterceptors(axiosInstance: AxiosInstance): void {
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const correlationId = frontendLogger.getCorrelationId();
      
      config.headers = config.headers || {};
      config.headers['x-correlation-id'] = correlationId;
      config.headers['x-request-id'] = frontendLogger.getSessionId();

      frontendLogger.debug(FrontendAction.API_REQUEST, `${config.method?.toUpperCase()} ${config.url}`, {
        url: config.url,
        method: config.method,
        headers: Object.keys(config.headers || {}),
        correlationId,
      });

      (config as any).metadata = { startTime: Date.now() };

      return config;
    },
    (error: AxiosError) => {
      frontendLogger.error(FrontendAction.API_ERROR, `Request failed: ${error.message}`, {
        url: error.config?.url,
        method: error.config?.method,
        error: error.message,
      });
      return Promise.reject(error);
    },
  );

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      const duration = Date.now() - ((response.config as any)?.metadata?.startTime || 0);

      frontendLogger.debug(FrontendAction.API_RESPONSE, `${response.config?.method?.toUpperCase()} ${response.config?.url} - ${response.status}`, {
        url: response.config?.url,
        method: response.config?.method,
        status: response.status,
        duration,
        correlationId: response.headers['x-correlation-id'],
      });

      return response;
    },
    (error: AxiosError) => {
      const duration = Date.now() - ((error.config as any)?.metadata?.startTime || 0);

      frontendLogger.error(FrontendAction.API_ERROR, `Response error: ${error.message}`, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        duration,
        error: error.message,
        correlationId: error.response?.headers?.['x-correlation-id'],
      });

      return Promise.reject(error);
    },
  );
}
