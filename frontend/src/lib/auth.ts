export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ff_token');
}
export function setToken(t: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ff_token', t);
}
export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ff_token');
}
