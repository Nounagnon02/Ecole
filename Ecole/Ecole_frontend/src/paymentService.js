import api from './api';

const paymentService = {
  createPayment: async (data) => {
    try {
      const response = await api.post('/payments/initialize', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  checkPaymentStatus: async (transactionId) => {
    try {
      const response = await api.get('/payments/status', {
        params: { payment_id: transactionId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default paymentService;
