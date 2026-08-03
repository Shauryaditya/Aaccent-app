import { getApiBaseUrl } from '../services/api';

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
  if (!error) return 'An unexpected error occurred';

  // Only an axios error with no response means the request never reached the server.
  // Plain Error objects (file uploads, storage, parsing) also lack `.response`, so
  // checking `.response` alone would mislabel every one of them as a network failure.
  if (error.isAxiosError === true && !error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'The server took too long to respond. It may be waking up — try again.';
    }
    const base = getApiBaseUrl();
    return `Cannot reach the server at ${base}. Check that the backend is running and that this device is on the same network.`;
  }

  if (!error.response) {
    // Not an HTTP failure at all — surface whatever actually broke.
    return error.message || 'An unexpected error occurred';
  }

  const { status, data } = error.response;

  // Next.js route handlers return plain-text bodies (e.g. new NextResponse("Unauthorized")),
  // so the body is often a bare string rather than a JSON object.
  const detail =
    (typeof data === 'string' && data.trim()) ||
    data?.message ||
    data?.error ||
    '';

  if (status === 401) {
    return detail
      ? `Not signed in (401): ${detail}`
      : 'Your session is not being accepted by the server (401). Try signing out and back in.';
  }

  if (status === 403) {
    return detail ? `Not allowed (403): ${detail}` : 'This account does not own that item (403).';
  }

  return detail ? `${detail} (${status})` : `Request failed with status ${status}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};