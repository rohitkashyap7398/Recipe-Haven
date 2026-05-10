/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './FirebaseProvider';

export const ProfileOnboarding: React.FC = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setShow(false);
      return;
    }

    const checkProfile = async () => {
      try {
        const q = query(collection(db, 'profiles'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setShow(true);
          setName(user.displayName || '');
        } else {
          setShow(false);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };

    checkProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !phone) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'profiles'), {
        userId: user.uid,
        displayName: name,
        phoneNumber: phone,
        createdAt: serverTimestamp(),
      });
      setShow(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'profiles');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-orange-900/40 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="bg-orange-500 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2">Welcome to Recipe Haven!</h2>
            <p className="text-orange-100/80 text-sm">Let's finish setting up your profile to start cooking.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Your Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-3.5 text-gray-400" />
                  <input 
                    required
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-orange-500/20 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Phone Number (OTP Verification style)</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-3.5 text-gray-400" />
                  <input 
                    required
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 00000 00000"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-orange-500/20 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 ml-1 italic">* We'll use this for your private chef dashboard.</p>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
