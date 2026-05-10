/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, MessageCircle, Sparkles } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './FirebaseProvider';
import { ChatMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const ChatBox: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return unsubscribe;
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const messageData = {
      text: inputText.trim(),
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userAvatar: user.photoURL || '',
      createdAt: serverTimestamp()
    };

    setInputText('');

    try {
      await addDoc(collection(db, 'chats'), messageData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chats');
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-orange-100">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Foodie Community</h3>
            <p className="text-orange-100 text-xs">Share your cooking tips & tricks!</p>
          </div>
        </div>
        <div className="bg-orange-400 p-1.5 rounded-full animate-pulse">
          <Sparkles size={16} />
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-orange-50/30"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <MessageCircle size={48} className="opacity-20" />
            <p>No messages yet. Be the first to say hi!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, x: msg.userId === user?.uid ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id}
              className={`flex flex-col ${msg.userId === user?.uid ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-2 max-w-[80%] ${msg.userId === user?.uid ? 'flex-row-reverse' : 'flex-row'}`}>
                <img 
                  src={msg.userAvatar || `https://ui-avatars.com/api/?name=${msg.userName}`} 
                  alt={msg.userName} 
                  className="w-8 h-8 rounded-full border border-orange-200 mt-1"
                />
                <div 
                  className={`p-3 rounded-2xl shadow-sm ${
                    msg.userId === user?.uid 
                      ? 'bg-orange-500 text-white rounded-tr-none' 
                      : 'bg-white border border-orange-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <div className="text-[10px] font-bold opacity-70 mb-1">
                    {msg.userName}
                  </div>
                  <div className="text-sm">
                    {msg.text}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <form 
        onSubmit={sendMessage}
        className="p-4 bg-white border-t border-orange-100 flex gap-2"
      >
        {user ? (
          <>
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your cooking secret..."
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:outline-none focus:bg-white transition-all"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="bg-orange-500 text-white p-3 rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
            >
              <Send size={20} />
            </button>
          </>
        ) : (
          <div className="w-full text-center py-2 text-gray-500 text-sm italic">
            Please log in to participate in the community chat.
          </div>
        )}
      </form>
    </div>
  );
};
