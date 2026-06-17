

import React, { useEffect } from 'react';

interface AdSenseBannerProps { slotId: string; className?: string; format?: string; }

const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ slotId, className = "", format = "auto" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <div className={`w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden min-h-[90px] flex flex-col items-center justify-center p-4 relative group ${className}`}>
      <div className="absolute top-2 right-4 text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-40">Sponsored</div>
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', minWidth: '250px' }}
           data-ad-client="ca-pub-REPLACE_WITH_REAL_ID"
           data-ad-slot={slotId}
           data-ad-format={format}
           data-full-width-responsive="true"></ins>
      <div className="hidden group-empty:block text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Optimizing Ad Inventory...</div>
    </div>
  );
};

export default AdSenseBanner;
