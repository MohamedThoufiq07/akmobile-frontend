/**
 * Formats API errors cleanly, avoiding raw Axios error strings or status 500 messages.
 */
export function formatErrorMessage(err, fallback = 'An unexpected error occurred. Please try again.') {
  if (!err) return fallback;

  if (typeof err === 'string') return err;

  // DRF or custom API response message
  const serverMsg = err.response?.data?.message || err.response?.data?.detail || err.response?.data?.error;
  if (serverMsg && typeof serverMsg === 'string') {
    return serverMsg;
  }

  // Field validation dictionary from DRF
  if (err.response?.data && typeof err.response.data === 'object' && !Array.isArray(err.response.data)) {
    const firstKey = Object.keys(err.response.data)[0];
    const firstVal = err.response.data[firstKey];
    if (Array.isArray(firstVal) && firstVal.length > 0) {
      return `${firstKey}: ${firstVal[0]}`;
    }
    if (typeof firstVal === 'string') {
      return `${firstKey}: ${firstVal}`;
    }
  }

  // HTTP status codes
  const status = err.response?.status;
  if (status === 400) return 'Invalid request parameters. Please check your input.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return 'Request conflict. Please refresh the page and try again.';
  if (status === 413) return 'The uploaded file is too large.';
  if (status === 500) return 'Server is temporarily unavailable. Please try again in a few moments.';
  if (status === 502 || status === 503 || status === 504) return 'Service temporarily unavailable. Please check your network connection.';

  // Network / timeout
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'The request timed out. Please check your internet connection.';
  }
  if (err.message === 'Network Error' || !err.response) {
    return 'Unable to reach the server. Please check your internet connection.';
  }

  return err.message || fallback;
}
