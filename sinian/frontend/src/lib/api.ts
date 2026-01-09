import axios from 'axios';
import type { NostalgiaPerson, CreatePersonRequest, ChatRequest, ChatResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 思念人相关API
export const personApi = {
  getAll: () => api.get<NostalgiaPerson[]>('/persons'),
  getById: (id: number) => api.get<NostalgiaPerson>(`/persons/${id}`),
  create: (data: CreatePersonRequest) => api.post<NostalgiaPerson>('/persons', data),
  update: (id: number, data: CreatePersonRequest) => api.put<NostalgiaPerson>(`/persons/${id}`, data),
  delete: (id: number) => api.delete(`/persons/${id}`),
  uploadPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<NostalgiaPerson>(`/persons/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadVoice: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<NostalgiaPerson>(`/persons/${id}/voice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// 聊天相关API
export const chatApi = {
  send: (data: ChatRequest) => api.post<ChatResponse>('/chat', data),
};

export default api;
