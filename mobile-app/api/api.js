import apiClient from './axiosConfig';

export const getNotifications = async (token) => {
  const response = await apiClient.get('/merchandiser/notifications', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const markNotificationAsRead = async (token, notificationId) => {
  const response = await apiClient.put(
    `/visites/${notificationId}`,
    { notification_status: 'lu' },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};