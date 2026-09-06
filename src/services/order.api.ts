import { api } from './api';

export const getAllOrders = async (status?: string) => {
  try {
    const response = await api.get('/orders/admin/all', {
      params: { status }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const response = await api.patch(`/orders/admin/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};