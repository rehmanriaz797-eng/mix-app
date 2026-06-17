
import React, { useState, useEffect } from 'react';
import { marketplaceService } from '../services/marketplaceService';
import { MarketplaceItem } from '../types';
import { Search, MapPin, Tag, Filter, Plus, Heart, ShoppingBag, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = [
    { id: 'All', icon: Sparkles },
    { id: 'Electronics', icon: Zap },
    { id: 'Vehicles', icon: MapPin },
    { id: 'Property', icon: MapPin },
    { id: 'Furniture', icon: ShoppingBag },
    { id: 'Fashion', icon: ShoppingBag },
    { id: 'Hobbies', icon: Heart },
    { id: 'Services', icon: Zap }
];

const Marketplace = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [maxDistance, setMaxDistance] = useState<number>(50);
    const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        const init = async () => {
            const loc = await marketplaceService.getCurrentLocation();
            setUserLoc(loc);
            loadItems();
        };
        init();
    }, [category, maxDistance]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await marketplaceService.getItems({ 
                category, 
                maxDistance: userLoc ? maxDistance : undefined,
                query: searchQuery
            });
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') loadItems();
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans animate-in fade-in duration-500">
            {/* Instant Header */}
            <div className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-2xl border-b border-white/5 p-4 md:px-10 py-6">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between max-w-[1800px] mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-lg border border-brand/20">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">Marketplace</h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Node-to-Node Exchange</p>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full max-w-2xl relative group">
                        <div className="absolute inset-0 bg-brand/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                            placeholder="Query the physical inventory..." 
                            className="w-full bg-[#0d1117] border border-white/10 text-white rounded-2xl px-12 py-3.5 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all font-bold placeholder-slate-600 relative z-10"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={20} />
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => navigate('/upload')}
                            className="bg-brand text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all flex items-center gap-3 shadow-xl shadow-brand/20 active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={18} /> Sell Item
                        </button>
                    </div>
                </div>

                {/* Categories Glow Bar */}
                <div className="mt-8 flex gap-3 overflow-x-auto scrollbar-hide max-w-[1800px] mx-auto pb-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setCategory(cat.id);
                                if (navigator.vibrate) navigator.vibrate(5);
                            }}
                            className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border ${
                                category === cat.id 
                                ? 'bg-brand border-brand text-white shadow-xl shadow-brand/30 scale-105' 
                                : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <cat.icon size={14} className={category === cat.id ? 'text-white' : 'text-slate-500'} />
                            {cat.id}
                        </button>
                    ))}
                    <div className="w-px h-8 bg-white/10 mx-2"></div>
                    {userLoc && (
                        <select 
                            value={maxDistance} 
                            onChange={(e) => setMaxDistance(Number(e.target.value))}
                            className="bg-white/5 border border-white/5 text-slate-400 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer hover:text-white hover:bg-white/10 transition-all"
                        >
                            <option value="5">5 km range</option>
                            <option value="15">15 km range</option>
                            <option value="30">30 km range</option>
                            <option value="50">50 km range</option>
                            <option value="10000">Global range</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Main Inventory Grid */}
            <div className="max-w-[1800px] mx-auto p-6 md:p-10 pb-32">
                {userLoc && (
                    <div className="mb-10 text-[10px] font-black text-slate-500 flex items-center gap-3 uppercase tracking-[0.3em] animate-in fade-in slide-in-from-left-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shadow-glow-brand"></div>
                        Geographic Signal Locked: Items within {maxDistance}km
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-white/5 rounded-[2rem] animate-pulse"></div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-center opacity-40">
                        <div className="p-10 bg-white/5 rounded-[3.5rem] mb-8 border border-white/5 shadow-2xl">
                            <ShoppingBag size={80} className="text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-[0.4em] mb-3">Inventory Empty</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">The physical grid encountered a synchronization void.</p>
                        <button onClick={() => { setCategory('All'); loadItems(); }} className="mt-10 px-10 py-4 bg-brand text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-2xl active:scale-95">Re-sync Grid</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                        {items.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => navigate(`/marketplace/item/${item.id}`, { state: { item } })}
                                className="group cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-700"
                            >
                                <div className="aspect-square relative rounded-[2.5rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl transition-all duration-500 group-hover:shadow-brand/20 group-hover:-translate-y-3 group-hover:border-brand/40">
                                    <img 
                                        src={item.photos?.[0] || 'https://picsum.photos/seed/item/400'} 
                                        className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
                                        alt={item.title}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    {item.condition === 'new' && (
                                        <div className="absolute top-4 left-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 text-emerald-400 text-[8px] font-black px-2.5 py-1 rounded-xl uppercase tracking-widest shadow-lg">PRISTINE</div>
                                    )}

                                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                        <div className="p-2.5 bg-black/60 backdrop-blur-md rounded-xl text-white/50 border border-white/10 hover:text-red-500 transition-colors">
                                            <Heart size={14} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-5 px-2">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="text-xl font-black text-white italic tracking-tighter">
                                            <span className="text-brand text-xs align-top mr-0.5">$</span>
                                            {item.price.toLocaleString()}
                                        </div>
                                        {item.distance && (
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <MapPin size={10} className="text-brand" /> {item.distance.toFixed(1)}KM
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-[13px] font-black text-slate-300 line-clamp-1 uppercase tracking-tight group-hover:text-white transition-colors">{item.title}</h3>
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1 italic">{item.city || 'Central Node'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Marketplace;
