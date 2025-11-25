import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const paymentService = {
  createPayment: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/payments/initialize`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  checkPaymentStatus: async (transactionId) => {
    try {
      const response = await axios.get(`${API_URL}/payments/status`, {
        params: { payment_id: transactionId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default paymentService;
