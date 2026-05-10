/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Phone, Key, ShieldCheck, ArrowRight, ChefHat, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'form' | 'otp' | 'google';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<AuthStep>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'form') {
      if (name && phone) setStep('otp');
    } else if (step === 'otp') {
      if (otp.every(v => v !== '')) setStep('google');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const finalizeLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Onboarding will handle profile creation if missing
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 z-10 p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          ✕
        </button>

        <div className="bg-orange-500 p-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent)] opacity-50" />
          <motion.div 
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/30 rotate-6 shadow-xl">
              <ChefHat size={40} />
            </div>
            <h2 className="text-3xl font-black mb-2">
              {step === 'form' && 'Welcome Chef!'}
              {step === 'otp' && 'Verification'}
              {step === 'google' && 'Almost Ready'}
            </h2>
            <p className="text-orange-100/80 font-medium">
              {step === 'form' && 'Join our community of 5k+ food lovers.'}
              {step === 'otp' && `Enter the code sent to ${phone}`}
              {step === 'google' && 'Verify your identity to save your progress.'}
            </p>
          </motion.div>
        </div>

        <div className="p-8">
          <form onSubmit={handleNext} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 'form' && (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors" size={18} />
                      <input 
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors" size={18} />
                      <input 
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 00000 00000"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-black text-white font-black py-5 rounded-[1.25rem] shadow-xl shadow-gray-200 hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Get Verification Code
                    <ArrowRight size={20} />
                  </button>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div 
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between gap-3 px-4">
                    {otp.map((digit, i) => (
                      <input 
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="w-14 h-16 bg-gray-100 border-2 border-transparent rounded-2xl text-center text-2xl font-black text-orange-600 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm"
                      />
                    ))}
                  </div>
                  <div className="text-center">
                    <button type="button" className="text-sm font-bold text-orange-500 hover:underline">
                      Resend Code?
                    </button>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-black text-white font-black py-5 rounded-[1.25rem] shadow-xl shadow-gray-200 hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Verify Code
                    <ShieldCheck size={20} />
                  </button>
                </motion.div>
              )}

              {step === 'google' && (
                <motion.div 
                  key="google"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 py-4 text-center"
                >
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-orange-700 text-sm font-medium mb-4">
                    🎉 Verification Successful! <br />
                    One last step to create your profile.
                  </div>
                  <button 
                    onClick={finalizeLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 py-5 rounded-[1.25rem] transition-all group active:scale-95 shadow-sm"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                        <span className="font-bold text-gray-800">Continue with Google</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 max-w-[240px] mx-auto">
                    By continuing, you agree to our Terms of Culinary Excellence.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
