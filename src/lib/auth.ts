export function getAuthHeader() {
  const token = localStorage.getItem('app_auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function authFetch(url: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    ...getAuthHeader()
  };
  
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('app_auth_token');
    window.dispatchEvent(new Event('auth-expired'));
  }
  
  return response;
}
