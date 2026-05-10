/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Heart, Clock, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recipe } from '../types';
import { useAuth } from './FirebaseProvider';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface RecipeCardProps {
  recipe: Recipe;
  onDelete?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onDelete }) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!user || !recipe.id) return;

    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', user.uid),
      where('recipeId', '==', recipe.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setIsFavorited(true);
        setFavoriteId(snapshot.docs[0].id);
      } else {
        setIsFavorited(false);
        setFavoriteId(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'favorites');
    });

    return unsubscribe;
  }, [user, recipe.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !recipe.id) return;

    try {
      if (isFavorited && favoriteId) {
        await deleteDoc(doc(db, 'favorites', favoriteId));
      } else {
        await addDoc(collection(db, 'favorites'), {
          userId: user.uid,
          recipeId: recipe.id,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'favorites');
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-200/40 transition-shadow duration-300"
    >
      <div 
        className="aspect-square overflow-hidden cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <img 
          src={recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800'} 
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {user && (
            <button 
              onClick={toggleFavorite}
              className={`p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all ${
                isFavorited 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/80 text-gray-400 hover:text-red-500 hover:scale-110'
              }`}
            >
              <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          )}
          {user?.uid === recipe.authorId && onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2.5 rounded-full shadow-lg bg-white/80 text-gray-400 hover:text-red-600 hover:bg-white transition-all backdrop-blur-md"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 cursor-pointer" onClick={() => setShowDetail(true)}>
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
          {recipe.title}
        </h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2 min-h-[40px]">
          {recipe.description}
        </p>
        
        <div className="flex items-center justify-between mt-4 border-t border-gray-50 pt-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={14} />
            <span>{new Date(recipe.createdAt?.seconds * 1000).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-full text-orange-600 font-medium text-xs">
            <User size={12} />
            <span>{recipe.authorId.slice(0, 6)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-y-auto relative shadow-2xl"
            >
              <button 
                onClick={() => setShowDetail(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full text-gray-500 hover:text-gray-900 shadow-sm"
              >
                ✕
              </button>
              
              <img src={recipe.image} alt={recipe.title} className="w-full h-72 object-cover" />
              
              <div className="p-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">{recipe.title}</h2>
                <div className="flex items-center gap-4 text-gray-500 mb-6 font-medium">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>Prep: 25 mins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={16} />
                    <span>Shared by Cook #{recipe.authorId.slice(0, 4)}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                      Ingredients
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-orange-300 rounded-full"></div>
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                      Instructions
                    </h4>
                    <div className="whitespace-pre-wrap text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {recipe.instructions}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
