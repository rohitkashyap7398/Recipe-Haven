/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChefHat, Plus, X, Image as ImageIcon, Send, Sparkles, Wand2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './FirebaseProvider';
import { motion } from 'motion/react';
import { generateRecipeImage } from '../services/geminiService';

interface RecipeFormProps {
  onSuccess: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = async () => {
    if (!title) {
      alert('Please enter a title first to generate an image.');
      return;
    }
    setIsGenerating(true);
    try {
      const generatedUrl = await generateRecipeImage(title, description);
      setImage(generatedUrl);
    } catch (error) {
      console.error(error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index: number) => {
    const newIng = ingredients.filter((_, i) => i !== index);
    setIngredients(newIng.length ? newIng : ['']);
  };
  const updateIngredient = (index: number, value: string) => {
    const newIng = [...ingredients];
    newIng[index] = value;
    setIngredients(newIng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'recipes'), {
        title,
        description,
        image: image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800',
        ingredients: ingredients.filter(i => i.trim()),
        instructions,
        authorId: user.uid,
        createdAt: serverTimestamp()
      });
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'recipes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
          <ChefHat size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Add New Recipe</h2>
          <p className="text-gray-500 text-sm">Share your culinary masterpiece with the world.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Recipe Title</label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Authentic Italian Lasagna"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500/20 focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Recipe Image</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input 
                  type="url" 
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="URL or use Magic Generate →"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-orange-500/20 focus:outline-none focus:bg-white transition-all text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold rounded-2xl hover:shadow-lg hover:from-purple-700 hover:to-orange-600 active:scale-95 disabled:opacity-50 transition-all text-sm whitespace-nowrap"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>Magic Generate</span>
                  </>
                )}
              </button>
            </div>
            {image && (
              <div className="mt-2 relative rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Quick Description</label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Tell us what makes this dish special..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500/20 focus:outline-none focus:bg-white transition-all text-sm resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 ml-1 flex justify-between items-center">
              <span>Ingredients</span>
              <button 
                type="button" 
                onClick={addIngredient}
                className="text-orange-600 hover:text-orange-700 font-bold text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Add One
              </button>
            </label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    required
                    type="text" 
                    value={ing}
                    onChange={(e) => updateIngredient(i, e.target.value)}
                    placeholder={`Ingredient #${i + 1}`}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500/10 focus:outline-none focus:bg-white transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => removeIngredient(i)}
                    className="text-gray-300 hover:text-red-500 p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Step-by-Step Instructions</label>
            <textarea 
              required
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              placeholder="1. Wash the vegetables...&#10;2. Preheat the oven to 180°C..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500/20 focus:outline-none focus:bg-white transition-all text-sm resize-none"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-200 hover:bg-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Send size={20} />
              <span>Publish Recipe</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};
