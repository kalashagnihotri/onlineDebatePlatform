import api from './api';

export const getDebateTopics = async () => {
  const response = await api.get('/debates/topics/');
  return response.data;
};

export const getDebateSession = async (id: string) => {
  const response = await api.get(`/debates/sessions/${id}/`);
  return response.data;
}

export const getSessionParticipants = async (sessionId: string) => {
  const response = await api.get(`/debates/sessions/${sessionId}/participants/`);
  return response.data;
}

export const postMessage = async (sessionId: string, content: string) => {
  const response = await api.post(`/debates/messages/?session_pk=${sessionId}`, { content });
  return response.data;
} 