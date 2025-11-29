import { ChatSession } from '../types';

const STORAGE_KEY = 'uccai_sessions';

export const storageService = {
  getSessions: (): ChatSession[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load sessions from storage:", error);
      return [];
    }
  },

  saveSessions: (sessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions to storage:", error);
    }
  },

  saveSession: (session: ChatSession) => {
    const sessions = storageService.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session); // Add new sessions to the top
    }
    
    storageService.saveSessions(sessions);
    return sessions;
  },

  deleteSession: (sessionId: string) => {
    const sessions = storageService.getSessions();
    const newSessions = sessions.filter(s => s.id !== sessionId);
    storageService.saveSessions(newSessions);
    return newSessions;
  }
};