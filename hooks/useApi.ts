import { useState, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  authenticatedGet, 
  authenticatedPost, 
  authenticatedPut, 
  authenticatedDelete,
  apiCall 
} from '@/lib/api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends ApiState<T> {
  get: (url: string) => Promise<T>;
  post: (url: string, data?: any) => Promise<T>;
  put: (url: string, data?: any) => Promise<T>;
  del: (url: string) => Promise<T>;
  reset: () => void;
}

/**
 * Custom hook để thực hiện các API calls với authentication
 */
export function useApi<T = any>(): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { authToken } = useAuth();

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: null }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, loading: false, error }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, loading: false, data, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const get = useCallback(async (url: string): Promise<T> => {
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    setLoading(true);
    try {
      const data = await apiCall<T>(() => authenticatedGet(url));
      setData(data);
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch data';
      setError(errorMessage);
      throw error;
    }
  }, [authToken, setLoading, setData, setError]);

  const post = useCallback(async (url: string, data?: any): Promise<T> => {
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    setLoading(true);
    try {
      const response = await apiCall<T>(() => authenticatedPost(url, data));
      setData(response);
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create data';
      setError(errorMessage);
      throw error;
    }
  }, [authToken, setLoading, setData, setError]);

  const put = useCallback(async (url: string, data?: any): Promise<T> => {
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    setLoading(true);
    try {
      const response = await apiCall<T>(() => authenticatedPut(url, data));
      setData(response);
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update data';
      setError(errorMessage);
      throw error;
    }
  }, [authToken, setLoading, setData, setError]);

  const del = useCallback(async (url: string): Promise<T> => {
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    setLoading(true);
    try {
      const response = await apiCall<T>(() => authenticatedDelete(url));
      setData(response);
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete data';
      setError(errorMessage);
      throw error;
    }
  }, [authToken, setLoading, setData, setError]);

  return {
    ...state,
    get,
    post,
    put,
    del,
    reset,
  };
}

/**
 * Hook để thực hiện một API call cụ thể
 */
export function useApiCall<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  initialData?: any
) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData || null,
    loading: false,
    error: null,
  });

  const { authToken } = useAuth();

  const execute = useCallback(async (data?: any): Promise<T> => {
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let response: T;
      
      switch (method) {
        case 'GET':
          response = await apiCall<T>(() => authenticatedGet(url));
          break;
        case 'POST':
          response = await apiCall<T>(() => authenticatedPost(url, data));
          break;
        case 'PUT':
          response = await apiCall<T>(() => authenticatedPut(url, data));
          break;
        case 'DELETE':
          response = await apiCall<T>(() => authenticatedDelete(url));
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error: any) {
      const errorMessage = error.message || `Failed to ${method.toLowerCase()} data`;
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [authToken, url, method]);

  const reset = useCallback(() => {
    setState({ data: initialData || null, loading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
} 