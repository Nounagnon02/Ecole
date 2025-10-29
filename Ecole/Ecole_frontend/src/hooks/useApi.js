import { useState, useCallback } from 'react';
import api from '../api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err) => {
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error || 
                        err.message || 
                        'Une erreur est survenue';
    setError(errorMessage);
    console.error('Erreur API:', err);
  }, []);

  const apiCall = useCallback(async (apiFunction, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Méthodes CRUD communes
  const get = useCallback((url, config = {}) => {
    return apiCall(() => api.get(url, config));
  }, [apiCall]);

  const post = useCallback((url, data = {}, config = {}) => {
    return apiCall(() => api.post(url, data, config));
  }, [apiCall]);

  const put = useCallback((url, data = {}, config = {}) => {
    return apiCall(() => api.put(url, data, config));
  }, [apiCall]);

  const del = useCallback((url, config = {}) => {
    return apiCall(() => api.delete(url, config));
  }, [apiCall]);

  return {
    loading,
    error,
    clearError,
    get,
    post,
    put,
    delete: del,
    apiCall
  };
};

// Hook spécialisé pour les opérations CRUD
export const useCrud = (baseUrl) => {
  const { loading, error, clearError, get, post, put, delete: del } = useApi();
  const [data, setData] = useState([]);
  const [item, setItem] = useState(null);

  const fetchAll = useCallback(async (params = {}) => {
    try {
      const response = await get(baseUrl, { params });
      setData(response.data);
      return response.data;
    } catch (err) {
      setData([]);
      throw err;
    }
  }, [baseUrl, get]);

  const fetchOne = useCallback(async (id) => {
    try {
      const response = await get(`${baseUrl}/${id}`);
      setItem(response.data);
      return response.data;
    } catch (err) {
      setItem(null);
      throw err;
    }
  }, [baseUrl, get]);

  const create = useCallback(async (newData) => {
    try {
      const response = await post(baseUrl, newData);
      setData(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [baseUrl, post]);

  const update = useCallback(async (id, updatedData) => {
    try {
      const response = await put(`${baseUrl}/${id}`, updatedData);
      setData(prev => prev.map(item => 
        item.id === id ? response.data : item
      ));
      if (item && item.id === id) {
        setItem(response.data);
      }
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [baseUrl, put, item]);

  const remove = useCallback(async (id) => {
    try {
      await del(`${baseUrl}/${id}`);
      setData(prev => prev.filter(item => item.id !== id));
      if (item && item.id === id) {
        setItem(null);
      }
      return true;
    } catch (err) {
      throw err;
    }
  }, [baseUrl, del, item]);

  return {
    loading,
    error,
    clearError,
    data,
    item,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    setData,
    setItem
  };
};

// Hook pour gérer les formulaires avec API
export const useForm = (initialData = {}, onSubmit) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setErrors({});
      await onSubmit(formData);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  const setFieldValue = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setFieldValue,
    setFormData,
    setErrors
  };
};