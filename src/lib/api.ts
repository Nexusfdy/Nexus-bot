export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("adminToken");
  
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let finalUrl = url;
  if (!options.method || options.method.toUpperCase() === 'GET') {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.append('_t', Date.now().toString());
    finalUrl = urlObj.toString();
  }

  const response = await fetch(finalUrl, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem("adminToken");
    window.dispatchEvent(new Event("auth_error"));
  }

  return response;
};

export const safeFetchJsonWithAuth = async (url: string) => {
  try {
    const res = await fetchWithAuth(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};
