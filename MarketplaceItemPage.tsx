import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MarketplaceItem } from '../types';
import { MessageCircle, MapPin, Heart, ArrowLeft, Share2 } from 'lucide-react';
import { marketplaceService } from '../services/marketplaceService';
import { useAuth } from '../hooks/useAuth';

const MarketplaceItemPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const item = (location.state as any)?.item as MarketplaceItem;

    if (!item) return <div className="p-10 text-white">Item not found.</div>;

    const handleMessageSeller = async () => {
        if (!user) return;
        try {
            // Messaging feature was removed in a previous step, but we still have a link to it
            // Redirecting to social as a safe fallback or alert
            alert("Messaging feature is currently unavailable.");
        } catch (e) {
            alert("Failed to start chat.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#18191a] text-black dark:text-gray-200">
            <div className="bg-white dark:bg-[#242526] sticky top-0 z-10 p-4 flex items-center gap-4 shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <ArrowLeft />
                </button>
                <h1 className="font-bold text-lg truncate">{item.title}</h1>
            </div>

            <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Images */}
                <div className="space-y-4">
                    <div className="aspect-square bg-black rounded-xl overflow-hidden">
                        <img src={item.photos[0]} className="w-full h-full object-contain" />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {item.photos.slice(1).map((p, i) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img src={p} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
                        <div className="text-2xl font-bold text-blue-600 mb-4">
                            {item.currency} {item.price.toLocaleString()}
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleMessageSeller}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                            >
                                <MessageCircle /> Message Seller
                            </button>
                            <button className="p-3 bg-gray-200 dark:bg-[#3a3b3c] rounded-lg hover:opacity-80">
                                <Heart />
                            </button>
                            <button className="p-3 bg-gray-200 dark:bg-[#3a3b3c] rounded-lg hover:opacity-80">
                                <Share2 />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#242526] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold mb-2">Details</h3>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-gray-500">Condition</span>
                            <span className="capitalize">{item.condition}</span>
                            <span className="text-gray-500">Category</span>
                            <span>{item.category}</span>
                            <span className="text-gray-500">Location</span>
                            <span className="flex items-center gap-1"><MapPin size={14}/> {item.city || 'Unknown'}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#242526] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold mb-2">Description</h3>
                        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                            {item.description}
                        </p>
                    </div>

                    {item.profiles && (
                        <div className="bg-white dark:bg-[#242526] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                            <img src={item.profiles?.avatar_url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-full" />
                            <div>
                                <h3 className="font-bold">Seller Info</h3>
                                <p className="text-sm text-gray-500">{item.profiles?.full_name || item.profiles?.username}</p>
                            </div>
                            <button className="ml-auto text-blue-500 font-bold text-sm">View Profile</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketplaceItemPage;