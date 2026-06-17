
import React, { useState, useEffect } from 'react';
import { marketplaceService } from '../services/marketplaceService';
import { MarketplaceItem } from '../types';
import { Search, MapPin, Tag, Filter, Plus, Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ["All", "Electronics", "Vehicles", "Property", "Furniture", "Fashion", "Hobbies", "Services"];

const Marketplace = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [maxDistance, setMaxDistance] = useState<number>(50); // Default 50km
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
        <div className="min-h-screen bg-gray-50 dark:bg-[#18191a] text-black dark:text-gray-200">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white dark:bg-[#242526] border-b border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-7xl mx-auto w-full">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Tag className="text-blue-600" /> Marketplace
                    </h1>
                    
                    <div className="flex-1 w-full max-w-xl relative">
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                            placeholder="Search marketplace..." 
                            className="w-full bg-gray-100 dark:bg-[#3a3b3c] rounded-full px-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => navigate('/marketplace/sell')}
                            className="bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-80"
                        >
                            <Plus size={20} /> Sell
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide max-w-7xl mx-auto pb-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                category === cat 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 dark:bg-[#3a3b3c] hover:bg-gray-300 dark:hover:bg-[#4e4f50]'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                    {userLoc && (
                        <select 
                            value={maxDistance} 
                            onChange={(e) => setMaxDistance(Number(e.target.value))}
                            className="bg-gray-200 dark:bg-[#3a3b3c] px-3 py-1.5 rounded-full text-sm outline-none cursor-pointer"
                        >
                            <option value="5">5 km</option>
                            <option value="15">15 km</option>
                            <option value="30">30 km</option>
                            <option value="50">50 km</option>
                            <option value="10000">Anywhere</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto p-4">
                {userLoc && (
                    <div className="mb-4 text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={16} className="text-blue-500" />
                        Showing items within {maxDistance} km of your location
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20">Loading items...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-xl font-bold mb-2">No items found</p>
                        <p>Try changing filters or search a different area.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {items.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => navigate(`/marketplace/item/${item.id}`, { state: { item } })}
                                className="bg-white dark:bg-[#242526] rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800"
                            >
                                <div className="aspect-square relative">
                                    <img 
                                        src={item.photos?.[0] || 'https://via.placeholder.com/300'} 
                                        className="w-full h-full object-cover" 
                                    />
                                    {item.condition === 'new' && (
                                        <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">NEW</span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="font-bold text-lg">
                                        {item.currency} {item.price.toLocaleString()}
                                    </div>
                                    <h3 className="text-sm font-medium line-clamp-1 mb-1">{item.title}</h3>
                                    <div className="text-xs text-gray-500 mb-2">
                                        {item.city || 'Unknown Location'}
                                        {item.distance && ` • ${item.distance.toFixed(1)} km`}
                                    </div>
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
