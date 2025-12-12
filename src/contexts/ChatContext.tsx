import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  model: 'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3' | 'gemini-lite' | 'nano-banana' | 'grok' | 'cohere' | 'deepseek';
  mode: 'normal' | 'deepthink' | 'search' | 'reasoning';
  pinned?: boolean;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  createNewChat: () => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  togglePinChat: (chatId: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateChatSettings: (model: 'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3' | 'gemini-lite' | 'nano-banana' | 'grok' | 'cohere' | 'deepseek', mode: 'normal' | 'deepthink' | 'search' | 'reasoning') => void;
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
    if (user) {
      if (chats.length > 0) {
        localStorage.setItem(`askify_chats_${user.email}`, JSON.stringify(chats));
      } else {
        localStorage.removeItem(`askify_chats_${user.email}`);
      }
    }
  }, [chats, user]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      model: 'grok',
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

  const togglePinChat = (chatId: string) => {
    setChats(chats.map(c => c.id === chatId ? { ...c, pinned: !c.pinned } : c));
    if (currentChat?.id === chatId) {
      setCurrentChat({ ...currentChat, pinned: !currentChat.pinned });
    }
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!currentChat) return;

    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    setChats(prevChats => {
      const targetChat = prevChats.find(c => c.id === currentChat.id);
      if (!targetChat) return prevChats;

      const updatedMessages = [...targetChat.messages, newMessage];
      
      // Smart auto-rename based on first user message
      let updatedTitle = targetChat.title;
      if (targetChat.messages.length === 0 && message.role === 'user') {
        const content = message.content.toLowerCase().trim();
        
        // Intelligent title generation based on message content
        if (content.includes('hello') || content.includes('hi ') || content === 'hi' || content.includes('hey')) {
          updatedTitle = 'Greetings Exchange';
        } else if (content.includes('help') || content.includes('how to') || content.includes('assist')) {
          updatedTitle = 'Help Request';
        } else if (content.includes('code') || content.includes('program') || content.includes('debug')) {
          updatedTitle = 'Coding Assistance';
        } else if (content.includes('write') || content.includes('create') || content.includes('generate')) {
          updatedTitle = 'Content Creation';
        } else if (content.includes('explain') || content.includes('what is') || content.includes('tell me about')) {
          updatedTitle = 'Information Query';
        } else if (content.includes('solve') || content.includes('calculate') || content.includes('math')) {
          updatedTitle = 'Problem Solving';
        } else if (content.includes('translate') || content.includes('language')) {
          updatedTitle = 'Translation Request';
        } else if (content.includes('design') || content.includes('ui') || content.includes('layout')) {
          updatedTitle = 'Design Discussion';
        } else {
          // Extract key words from the message for a meaningful title
          const words = content.split(' ').filter(w => w.length > 3);
          if (words.length > 0) {
            const title = words.slice(0, 3).join(' ');
            updatedTitle = title.charAt(0).toUpperCase() + title.slice(1);
            if (updatedTitle.length > 30) {
              updatedTitle = updatedTitle.slice(0, 30) + '...';
            }
          } else {
            updatedTitle = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
          }
        }
      }

      const updatedChat = {
        ...targetChat,
        messages: updatedMessages,
        title: updatedTitle
      };

      setCurrentChat(updatedChat);
      return prevChats.map(c => c.id === currentChat.id ? updatedChat : c);
    });
  };

  const updateChatSettings = (model: 'gemini' | 'gpt' | 'askify' | 'gpt-mini' | 'gpt-nano' | 'gemini-3' | 'gemini-lite' | 'nano-banana' | 'grok' | 'cohere' | 'deepseek', mode: 'normal' | 'deepthink' | 'search' | 'reasoning') => {
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
      togglePinChat,
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
