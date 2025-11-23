import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  model: 'gemini' | 'cohere';
  mode: 'normal' | 'deepthink' | 'search';
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  createNewChat: () => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateChatSettings: (model: 'gemini' | 'cohere', mode: 'normal' | 'deepthink' | 'search') => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  useEffect(() => {
    if (user) {
      const savedChats = localStorage.getItem(`askify_chats_${user.email}`);
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
        if (parsedChats.length > 0) {
          setCurrentChat(parsedChats[0]);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && chats.length > 0) {
      localStorage.setItem(`askify_chats_${user.email}`, JSON.stringify(chats));
    }
  }, [chats, user]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      model: 'gemini',
      mode: 'normal'
    };
    setChats([newChat, ...chats]);
    setCurrentChat(newChat);
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  };

  const deleteChat = (chatId: string) => {
    const updatedChats = chats.filter(c => c.id !== chatId);
    setChats(updatedChats);
    if (currentChat?.id === chatId) {
      setCurrentChat(updatedChats[0] || null);
    }
  };

  const renameChat = (chatId: string, newTitle: string) => {
    setChats(chats.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
    if (currentChat?.id === chatId) {
      setCurrentChat({ ...currentChat, title: newTitle });
    }
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!currentChat) return;

    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    const updatedMessages = [...currentChat.messages, newMessage];
    
    // Auto-rename chat based on first user message
    let updatedTitle = currentChat.title;
    if (currentChat.messages.length === 0 && message.role === 'user') {
      updatedTitle = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
    }

    const updatedChat = {
      ...currentChat,
      messages: updatedMessages,
      title: updatedTitle
    };

    setChats(chats.map(c => c.id === currentChat.id ? updatedChat : c));
    setCurrentChat(updatedChat);
  };

  const updateChatSettings = (model: 'gemini' | 'cohere', mode: 'normal' | 'deepthink' | 'search') => {
    if (!currentChat) return;
    const updatedChat = { ...currentChat, model, mode };
    setChats(chats.map(c => c.id === currentChat.id ? updatedChat : c));
    setCurrentChat(updatedChat);
  };

  return (
    <ChatContext.Provider value={{
      chats,
      currentChat,
      createNewChat,
      selectChat,
      deleteChat,
      renameChat,
      addMessage,
      updateChatSettings
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
