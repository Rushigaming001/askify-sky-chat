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
  model: string;
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
  updateChatSettings: (model: string, mode: 'normal' | 'deepthink' | 'search' | 'reasoning') => void;
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
        if (content.includes('hello') || content.includes('hi ') || content === 'hi' || content.includes('hey') || content.includes('greetings')) {
          updatedTitle = '👋 Greeting Chat';
        } else if (content.includes('help me') || content.includes('how do i') || content.includes('can you help')) {
          updatedTitle = '❓ Help Request';
        } else if (content.includes('code') || content.includes('programming') || content.includes('function') || content.includes('debug') || content.includes('javascript') || content.includes('python') || content.includes('react')) {
          updatedTitle = '💻 Coding Session';
        } else if (content.includes('write') && (content.includes('essay') || content.includes('story') || content.includes('article'))) {
          updatedTitle = '✍️ Writing Project';
        } else if (content.includes('email') || content.includes('letter')) {
          updatedTitle = '📧 Email Draft';
        } else if (content.includes('explain') || content.includes('what is') || content.includes('tell me about') || content.includes('define')) {
          updatedTitle = '📚 Learning Query';
        } else if (content.includes('solve') || content.includes('calculate') || content.includes('math') || content.includes('equation')) {
          updatedTitle = '🧮 Math Problem';
        } else if (content.includes('translate') || content.includes('language') || content.includes('spanish') || content.includes('french') || content.includes('hindi')) {
          updatedTitle = '🌐 Translation';
        } else if (content.includes('recipe') || content.includes('cook') || content.includes('food')) {
          updatedTitle = '🍳 Recipe Help';
        } else if (content.includes('travel') || content.includes('trip') || content.includes('vacation')) {
          updatedTitle = '✈️ Travel Planning';
        } else if (content.includes('business') || content.includes('startup') || content.includes('marketing')) {
          updatedTitle = '💼 Business Ideas';
        } else if (content.includes('health') || content.includes('fitness') || content.includes('exercise')) {
          updatedTitle = '💪 Health & Fitness';
        } else if (content.includes('game') || content.includes('minecraft') || content.includes('gaming')) {
          updatedTitle = '🎮 Gaming Chat';
        } else if (content.includes('image') || content.includes('picture') || content.includes('photo') || content.includes('draw')) {
          updatedTitle = '🖼️ Image Request';
        } else if (content.includes('video') || content.includes('youtube')) {
          updatedTitle = '🎬 Video Topic';
        } else if (content.includes('music') || content.includes('song') || content.includes('playlist')) {
          updatedTitle = '🎵 Music Chat';
        } else if (content.includes('summarize') || content.includes('summary') || content.includes('tldr')) {
          updatedTitle = '📝 Summary Request';
        } else if (content.includes('review') || content.includes('feedback')) {
          updatedTitle = '⭐ Review Discussion';
        } else if (content.includes('joke') || content.includes('funny') || content.includes('humor')) {
          updatedTitle = '😄 Fun & Jokes';
        } else {
          // Extract meaningful words for title
          const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when', 'where', 'who', 'can', 'you', 'me', 'my', 'your', 'this', 'that', 'please', 'could', 'would', 'should', 'do', 'does', 'did', 'have', 'has', 'had', 'will', 'be', 'to', 'of', 'and', 'or', 'for', 'with', 'about', 'from', 'in', 'on', 'at', 'by', 'it', 'its', 'i', 'im', "i'm"];
          const words = content.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
          
          if (words.length >= 2) {
            const titleWords = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1));
            updatedTitle = titleWords.join(' ');
            if (updatedTitle.length > 25) {
              updatedTitle = updatedTitle.slice(0, 25) + '...';
            }
          } else if (words.length === 1) {
            updatedTitle = words[0].charAt(0).toUpperCase() + words[0].slice(1) + ' Chat';
          } else {
            updatedTitle = message.content.slice(0, 25) + (message.content.length > 25 ? '...' : '');
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

  const updateChatSettings = (model: string, mode: 'normal' | 'deepthink' | 'search' | 'reasoning') => {
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
