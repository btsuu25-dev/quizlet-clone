const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Project {
  id: string;
  title: string;
  description: string | null;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  projectId: string;
  term: string;
  definition: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

// Wrapper for fetch to include Authorization header
const fetchAuth = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.method !== 'GET' && options.method !== 'DELETE') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Unauthorized, maybe clear token and redirect to login
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP Error ${res.status}`);
  }

  // Handle empty responses (like 204 No Content)
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const api = {
  // --- AUTH ---
  login: async (data: any): Promise<{ token: string; user: User }> => {
    return fetchAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  register: async (data: any): Promise<{ token: string; user: User }> => {
    return fetchAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getMe: async (): Promise<{ user: User }> => {
    return fetchAuth('/auth/me', { cache: 'no-store' });
  },

  // --- PROJECTS ---
  getProjects: async (): Promise<Project[]> => {
    return fetchAuth('/projects', { cache: 'no-store' });
  },

  getProject: async (id: string): Promise<Project> => {
    return fetchAuth(`/projects/${id}`, { cache: 'no-store' });
  },

  createProject: async (data: { title: string; description?: string, folderId?: string }): Promise<Project> => {
    return fetchAuth('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProject: async (id: string, data: { title?: string; description?: string, folderId?: string | null }): Promise<Project> => {
    return fetchAuth(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteProject: async (id: string): Promise<void> => {
    await fetchAuth(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // --- FOLDERS ---
  getFolders: async (): Promise<Folder[]> => {
    return fetchAuth('/folders', { cache: 'no-store' });
  },

  getFolder: async (id: string): Promise<Folder & { projects: Project[] }> => {
    return fetchAuth(`/folders/${id}`, { cache: 'no-store' });
  },

  createFolder: async (data: { title: string }): Promise<Folder> => {
    return fetchAuth('/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteFolder: async (id: string): Promise<void> => {
    await fetchAuth(`/folders/${id}`, {
      method: 'DELETE',
    });
  },

  getFolderFlashcards: async (folderId: string): Promise<Flashcard[]> => {
    return fetchAuth(`/folders/${folderId}/flashcards`);
  },

  // --- FLASHCARDS ---
  getFlashcards: async (projectId: string): Promise<Flashcard[]> => {
    return fetchAuth(`/projects/${projectId}/flashcards`, { cache: 'no-store' });
  },

  createFlashcard: async (projectId: string, data: { term: string; definition: string }): Promise<Flashcard> => {
    return fetchAuth(`/projects/${projectId}/flashcards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteFlashcard: async (id: string): Promise<void> => {
    await fetchAuth(`/flashcards/${id}`, {
      method: 'DELETE',
    });
  }
};
