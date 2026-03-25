export const showToast = (
  type: 'success' | 'error' | 'info',
  title: string,
  message?: string
) => {
  // This will be imported from react-native-toast-message
  const Toast = require('react-native-toast-message').default;
  
  Toast.show({
    type,
    text1: title,
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 60,
  });
};

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};