import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

// API base URL configuration
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://myprojectfreelanace.netlify.app/.netlify/functions'
  : 'http://localhost:5001';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get Firebase auth token and user
  let authToken = '';
  let firebaseUser = null;
  try {
    const user = auth.currentUser;
    if (user) {
      authToken = await user.getIdToken();
      firebaseUser = user;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authorization header if we have a token
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Add Firebase user ID header for better authentication
  if (firebaseUser) {
    headers["X-Firebase-User-ID"] = firebaseUser.uid;
  }

  // Construct full URL
  let fullUrl;
  if (url.startsWith('http')) {
    fullUrl = url;
  } else if (import.meta.env.PROD) {
    // For production, use Netlify Functions
    fullUrl = `${API_BASE_URL}/api${url.startsWith('/') ? url : '/' + url}`;
  } else {
    // For development, use Express server
    fullUrl = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: (method === 'GET' || method === 'HEAD') ? undefined : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get Firebase auth token and user
    let authToken = '';
    let firebaseUser = null;
    try {
      const user = auth.currentUser;
      if (user) {
        authToken = await user.getIdToken();
        firebaseUser = user;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }

    const headers: Record<string, string> = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Add Firebase user ID header for better authentication
    if (firebaseUser) {
      headers["X-Firebase-User-ID"] = firebaseUser.uid;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
