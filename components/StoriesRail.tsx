
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Story } from '../types';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const StoriesRail = () => {
    const { profile } = useAuth();
    const [stories, setStories] = useState<Story[]>([]);

    useEffect(() => {
        const fetchStories = async () => {
            const { data } = await supabase
                .from('stories')
                .select('*, profiles(username, avatar_url)')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });
            if (data) setStories(data as any);
        };
        fetchStories();
    }, []);

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 px-2 scrollbar-hide">
            {/* Create Story */}
            <div className="w-24 h-40 bg-gray-800 rounded-xl relative flex-shrink-0 cursor-pointer overflow-hidden border border-gray-700">
                <img src={profile?.avatar_url || 'https://picsum.photos/100'} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black flex flex-col items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center -mt-8 border-2 border-black text-white">
                        <Plus size={16} />
                    </div>
                    <span className="text-xs text-white mt-1 font-medium">Create story</span>
                </div>
            </div>

            {stories.map(story => (
                <div key={story.id} className="w-24 h-40 bg-gray-800 rounded-xl relative flex-shrink-0 cursor-pointer overflow-hidden border border-gray-700">
                    {story.media_type === 'video' ? (
                        <video src={story.media_url} className="w-full h-full object-cover" />
                    ) : (
                        <img src={story.media_url} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    )}
                    <div className="absolute top-2 left-2 w-8 h-8 rounded-full border-2 border-blue-500 p-0.5 bg-black">
                        <img src={story.profiles?.avatar_url} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <span className="absolute bottom-2 left-2 text-xs text-white font-bold drop-shadow-md truncate w-20">
                        {story.profiles?.username}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default StoriesRail;
