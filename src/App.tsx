/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { Recipe } from './types';
import { Navbar } from './components/Navbar';
import { RecipeCard } from './components/RecipeCard';
import { RecipeForm } from './components/RecipeForm';
import { ChatBox } from './components/ChatBox';
import { ProfileOnboarding } from './components/ProfileOnboarding';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './components/FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChefHat, Heart, MessageCircle, Sparkles, TrendingUp, Users, Utensils, Coffee, Pizza, Soup, Beef } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('explore');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetching, setFetching] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    { name: 'All', icon: <Utensils size={14} /> },
    { name: 'Breakfast', icon: <Coffee size={14} /> },
    { name: 'Lunch', icon: <Soup size={14} /> },
    { name: 'Dinner', icon: <Beef size={14} /> },
    { name: 'Fast Food', icon: <Pizza size={14} /> },
  ];

  useEffect(() => {
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Recipe[];
      setRecipes(data);
      setFetching(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'recipes');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const recipeIds = snapshot.docs.map(doc => doc.data().recipeId);
      if (recipeIds.length === 0) {
        setFavorites([]);
        return;
      }
      
      const favs = recipes.filter(r => recipeIds.includes(r.id));
      setFavorites(favs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'favorites');
    });
    return unsubscribe;
  }, [user, recipes]);

  const deleteRecipe = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    try {
      await deleteDoc(doc(db, 'recipes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recipes/${id}`);
    }
  };

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.description.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="text-orange-500"
        >
          <ChefHat size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLoginClick={() => setIsAuthModalOpen(true)}
      />
      <ProfileOnboarding />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'explore' && (
            <motion.div 
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <div className="relative rounded-[2.5rem] overflow-hidden bg-[#1A1A1A] p-8 sm:p-16 text-white shadow-2xl flex flex-col lg:flex-row items-center gap-12">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]" />
                
                <div className="relative z-10 lg:w-3/5 space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    <Sparkles size={14} className="animate-pulse" />
                    Kitchen of the Future
                  </div>
                  
                  <h1 className="text-5xl sm:text-7xl font-black leading-[1.1] tracking-tight">
                    Every dish tells <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">a story.</span>
                  </h1>
                  
                  <p className="text-gray-400 text-lg sm:text-xl max-w-xl font-medium leading-relaxed">
                    Join a community of 5,000+ chefs sharing their secret recipes and visual food stories. AI-powered inspiration for your next meal.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-96 group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={20} />
                      <input 
                        type="text" 
                        placeholder="Search for 'Spicy Pasta' or 'Vegan'..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#2A2A2A] border border-transparent rounded-[1.25rem] pl-14 pr-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-white placeholder:text-gray-600 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:w-2/5 relative">
                  <div className="relative z-10 bg-gradient-to-br from-orange-500 to-orange-600 p-1.5 rounded-[2.5rem] rotate-3 shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800" 
                      alt="Hero food" 
                      className="rounded-[2.25rem] object-cover aspect-square grayscale-[20%] hover:grayscale-0 transition-all duration-700" 
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black">Trending Now</p>
                      <p className="text-sm font-bold text-gray-900">Spicy Ramen Bowl</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8">
                    <div className="bg-orange-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg">Featured Today</div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-1/2 aspect-video md:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                      <img 
                        src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800" 
                        alt="Summer Salad" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    </div>
                    <div className="w-full md:w-1/2 space-y-4">
                      <h3 className="text-3xl font-black text-gray-900 leading-tight">Mediterranean Summer Salad with Feta</h3>
                      <p className="text-gray-500 font-medium">A refreshing blend of crisp cucumbers, sun-ripened tomatoes, and creamy feta cheese drizzled with extra virgin olive oil.</p>
                      <div className="flex items-center gap-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">JD</div>
                          <span className="text-sm font-bold text-gray-700">Jane Doe</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-sm text-gray-400 font-medium">15 min prep</span>
                      </div>
                      <button className="w-full md:w-auto bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all">
                        View Full Recipe
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-gradient-to-br from-orange-500 to-orange-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-black mb-2">Join the Foodie Chat!</h3>
                      <p className="text-orange-50/80 text-sm font-medium">Connect with fellow chefs and share your cooking secrets in real-time.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 px-6 py-4 rounded-2xl font-black shadow-xl hover:bg-orange-50 active:scale-95 transition-all group-hover:gap-4"
                    >
                      <MessageCircle size={20} />
                      Go to Community
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <Utensils size={20} />, label: 'Recipes', val: '1.2k+' },
                  { icon: <Users size={20} />, label: 'Active Chefs', val: '540' },
                  { icon: <TrendingUp size={20} />, label: 'Daily Visits', val: '10k' },
                  { icon: <Sparkles size={20} />, label: 'AI Generated', val: 'Featured' },
                ].map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center text-center space-y-2 hover:border-orange-200 hover:shadow-lg transition-all cursor-default">
                    <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
                      {s.icon}
                    </div>
                    <p className="text-2xl font-black text-gray-900">{s.val}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recipe Grid Section */}
              <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-black text-gray-900">Explore Recipes</h2>
                    <p className="text-gray-500 text-lg mt-2">Handpicked collections for every meal.</p>
                  </div>
                  
                  <div className="flex bg-white p-1.5 rounded-[2rem] border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                    {categories.map((cat) => (
                      <button 
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                          selectedCategory === cat.name 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {cat.icon}
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {fetching ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 space-y-4">
                        <div className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
                        <div className="h-6 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : filteredRecipes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredRecipes.map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} onDelete={() => deleteRecipe(recipe.id!)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                    <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="text-orange-500" size={36} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">No matching recipes</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mt-2">We couldn't find anything matching your search. Why not share yours?</p>
                    <button 
                      onClick={() => setActiveTab('create')}
                      className="mt-8 bg-orange-500 text-white px-8 py-3 rounded-full font-black shadow-lg shadow-orange-100 hover:scale-105 active:scale-95 transition-all"
                    >
                      Add a Recipe
                    </button>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div 
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-red-100 text-red-500 rounded-2xl">
                  <Heart size={28} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900">Your Favorites</h2>
                  <p className="text-gray-500">The meals you love most, all in one place.</p>
                </div>
              </div>

              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <Heart className="text-gray-200 mx-auto mb-4" size={64} />
                  <h3 className="text-xl font-bold text-gray-900">Nothing here yet</h3>
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className="mt-4 text-orange-500 font-bold hover:underline"
                  >
                    Go explore some recipes!
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RecipeForm onSuccess={() => setActiveTab('explore')} />
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-500 rounded-2xl">
                  <MessageCircle size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900">Community Chat</h2>
                  <p className="text-gray-500">Ask questions, share tips, and connect with other cooks.</p>
                </div>
              </div>
              <ChatBox />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-gray-100 py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg text-white">
              <ChefHat size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800">Recipe Haven</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2026 Recipe Haven. Made with ❤️ for food lovers.
          </div>
          <div className="flex gap-6 text-gray-400 text-sm font-medium">
            <a href="#" className="hover:text-orange-500">Recipes</a>
            <a href="#" className="hover:text-orange-500">Privacy</a>
            <a href="#" className="hover:text-orange-500">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
