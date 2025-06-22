import api from './api';

export const getDebateTopics = async () => {
  const response = await api.get('/debates/topics/');
  return response.data;
};

export const createDebateTopic = async (topicData: { title: string; description: string }) => {
  const response = await api.post('/debates/topics/', topicData);
  return response.data;
};

export const deleteDebateTopic = async (topicId: number) => {
  const response = await api.delete(`/debates/topics/${topicId}/`);
  return response.data;
};

export const getDebateSessions = async () => {
  const response = await api.get('/debates/sessions/');
  return response.data;
};

export const createDebateSession = async (sessionData: { topic_id: number; start_time?: string; end_time?: string }) => {
  const response = await api.post('/debates/sessions/', sessionData);
  return response.data;
};

export const deleteDebateSession = async (sessionId: number) => {
  const response = await api.delete(`/debates/sessions/${sessionId}/`);
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

export const getSessionMessages = async (sessionId: string) => {
  const response = await api.get(`/debates/messages/?session_pk=${sessionId}`);
  return response.data;
}

export const postMessage = async (sessionId: string, content: string) => {
  const response = await api.post(`/debates/messages/?session_pk=${sessionId}`, { content });
  return response.data;
}