import React, { useState, useRef, useEffect } from 'react';
import { marketplaceService } from '../services/marketplaceService';
import { useAuth } from '../hooks/useAuth';
import { Camera, MapPin, X, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SellItem = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [locationLoading, setLocationLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        description: '',
        category: 'Electronics',
        condition: 'new',
        city: '',
        location_lat: 0,
        location_lng: 0
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        handleGetLocation();
    }, []);

    const handleGetLocation = async () => {
        setLocationLoading(true);
        const loc = await marketplaceService.getCurrentLocation();
        if (loc) {
            setFormData(prev => ({
                ...prev,
                location_lat: loc.lat,
                location_lng: loc.lng,
                city: 'Current Location'
            }));
        }
        setLocationLoading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
            const newPreviews = newFiles.map((f: any) => URL.createObjectURL(f));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            await marketplaceService.postItem({
                user_id: user.id,
                title: formData.title,
                price: parseFloat(formData.price),
                currency: '$',
                description: formData.description,
                category: formData.category,
                condition: formData.condition as 'new' | 'used',
                city: formData.city,
                location_lat: formData.location_lat,
                location_lng: formData.location_lng,
                photos: [] 
            }, files);
            
            navigate('/marketplace');
        } catch (err) {
            console.error(err);
            alert("Failed to list item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#18191a] text-black dark:text-gray-200 p-4">
            <div className="max-w-2xl mx-auto bg-white dark:bg-[#242526] rounded-xl shadow p-6">
                <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <ChevronLeft />
                    </button>
                    <h1 className="text-2xl font-bold">Sell Item</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block font-medium mb-2">Photos (Max 10)</label>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
                            >
                                <Camera className="text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1">Add Photo</span>
                            </div>
                            {previews.map((src, idx) => (
                                <div key={idx} className="w-24 h-24 relative flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                                    <img src={src} className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setFiles(files.filter((_, i) => i !== idx));
                                            setPreviews(previews.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*" className="hidden" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input 
                                required
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full p-3 bg-gray-100 dark:bg-[#3a3b3c] rounded-lg outline-none"
                                placeholder="What are you selling?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Price</label>
                            <input 
                                required
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                                className="w-full p-3 bg-gray-100 dark:bg-[#3a3b3c] rounded-lg outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select 
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className="w-full p-3 bg-gray-100 dark:bg-[#3a3b3c] rounded-lg outline-none cursor-pointer"
                        >
                            {["Electronics", "Vehicles", "Property", "Furniture", "Fashion", "Hobbies", "Services"].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Condition</label>
                        <div className="flex gap-4">
                            {['new', 'used'].map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setFormData({...formData, condition: c as any})}
                                    className={`flex-1 py-2 rounded-lg capitalize border ${
                                        formData.condition === c 
                                        ? 'bg-blue-100 border-blue-500 text-blue-700' 
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea 
                            required
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full p-3 bg-gray-100 dark:bg-[#3a3b3c] rounded-lg outline-none h-32 resize-none"
                            placeholder="Describe your item..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={handleGetLocation}
                                className="bg-gray-100 dark:bg-[#3a3b3c] p-3 rounded-lg hover:bg-gray-200"
                            >
                                <MapPin size={20} className={locationLoading ? "animate-bounce" : ""} />
                            </button>
                            <input 
                                value={formData.city || (formData.location_lat ? `${formData.location_lat.toFixed(3)}, ${formData.location_lng.toFixed(3)}` : '')}
                                readOnly
                                className="flex-1 p-3 bg-gray-100 dark:bg-[#3a3b3c] rounded-lg text-gray-500"
                                placeholder="Auto-detecting location..."
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Posting...' : 'List Item'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SellItem;