// Corrections communes pour tous les dashboards

// Fonction pour gérer les erreurs API
export const handleApiError = (error, setError) => {
  const errorMessage = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      'Une erreur est survenue';
  setError(errorMessage);
  console.error('Erreur API:', error);
};

// Fonction pour gérer les états de chargement
export const withLoading = async (asyncFunction, setLoading, setError = null) => {
  try {
    setLoading(true);
    const result = await asyncFunction();
    return result;
  } catch (error) {
    if (setError) {
      handleApiError(error, setError);
    }
    throw error;
  } finally {
    setLoading(false);
  }
};

// Fonction pour valider les données avant envoi
export const validateFormData = (data, requiredFields) => {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`Le champ ${field} est requis`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fonction pour formater les données avant affichage
export const formatDisplayData = (data) => {
  if (!data) return 'N/A';
  
  if (typeof data === 'string') {
    return data.charAt(0).toUpperCase() + data.slice(1);
  }
  
  if (typeof data === 'number') {
    return data.toString();
  }
  
  return data;
};

// Fonction pour gérer les notifications
export const showNotification = (message, type = 'info', duration = 3000) => {
  // Créer une notification temporaire
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem;
    border-radius: 6px;
    color: white;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    background-color: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : '#4299e1'};
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, duration);
};

// Fonction pour nettoyer les données avant envoi à l'API
export const sanitizeApiData = (data) => {
  const cleaned = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string') {
        cleaned[key] = value.trim();
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
};

// Fonction pour gérer les template literals dans les URLs
export const buildApiUrl = (baseUrl, params = {}) => {
  let url = baseUrl;
  
  // Remplacer les paramètres dans l'URL
  Object.keys(params).forEach(key => {
    url = url.replace(`{${key}}`, params[key]);
  });
  
  return url;
};

// Hook personnalisé pour gérer les états communs
export const useCommonState = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const clearMessages = () => {
    setError('');
    setMessage('');
  };
  
  const setSuccess = (msg) => {
    setMessage(msg);
    setError('');
  };
  
  const setErrorMessage = (msg) => {
    setError(msg);
    setMessage('');
  };
  
  return {
    loading,
    setLoading,
    error,
    message,
    clearMessages,
    setSuccess,
    setErrorMessage
  };
};

// Fonction pour débouncer les recherches
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Fonction pour paginer les données
export const paginateData = (data, page = 1, itemsPerPage = 10) => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  return {
    data: data.slice(startIndex, endIndex),
    totalPages: Math.ceil(data.length / itemsPerPage),
    currentPage: page,
    totalItems: data.length,
    hasNext: endIndex < data.length,
    hasPrev: page > 1
  };
};