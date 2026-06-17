
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { monetizationService } from '../services/monetizationService';
import { CreatorWallet, WalletTransaction } from '../types';
import { 
    Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, 
    History, CreditCard, Landmark, Zap, ShieldCheck, 
    Sparkles, DollarSign, ChevronRight
} from 'lucide-react';

const WalletPage: React.FC = () => {
    const { user, profile } = useAuth();
    const [wallet, setWallet] = useState<CreatorWallet | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const w = await monetizationService.getWallet(user.id);
            setWallet(w);
            if (w) {
                const txs = await monetizationService.getTransactionHistory(w.id);
                setTransactions(txs);
            }
            setLoading(false);
        };
        load();
    }, [user]);

    if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-700 uppercase tracking-[0.5em]">Syncing Ledger...</div>;

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#0b1026] rounded-[3.5rem] p-12 border border-white/5 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity"><Landmark size={200} /></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-brand font-black text-[10px] uppercase tracking-[0.3em] mb-6">
                            <Sparkles size={14} /> Neural Revenue Balance
                        </div>
                        <h1 className="text-7xl font-black text-white tracking-tighter flex items-start gap-2">
                            <span className="text-3xl mt-3 opacity-30">$</span>
                            {wallet?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h1>
                        <div className="mt-8 flex items-center gap-6">
                            <div className="bg-green-500/10 text-green-500 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={12} /> +12.4% vs last week
                            </div>
                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Global Payouts Optimized</span>
                        </div>
                    </div>
                </div>

                <div className="bg-brand rounded-[3.5rem] p-12 text-white shadow-2xl shadow-brand/30 flex flex-col justify-between group hover:scale-[1.02] transition-all cursor-pointer">
                     <div className="flex justify-between items-start">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <CreditCard size={32} />
                        </div>
                        <ShieldCheck size={28} className="opacity-50" />
                     </div>
                     <div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Primary Method</div>
                        <div className="text-2xl font-black">{profile?.full_name?.toUpperCase() || 'AZKAAR CREATOR'}</div>
                        <div className="text-sm font-mono mt-1 opacity-70">•••• •••• •••• 4242</div>
                     </div>
                </div>
            </div>

            {/* Action Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0b1026] rounded-[3rem] p-10 border border-white/5 shadow-xl">
                        <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tight italic">Initiate Payout</h3>
                        
                        <div className="space-y-8">
                            <div className="relative group">
                                <input 
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-2xl font-black text-white outline-none focus:border-brand transition-all pl-14 shadow-inner"
                                />
                                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-brand" size={28} />
                            </div>

                            <button className="w-full py-6 bg-brand text-white font-black rounded-3xl text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-brand/30 hover:bg-brand-600 active:scale-95 transition-all">
                                Request Withdrawal
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-[#0b1026] rounded-[3rem] border border-white/5 overflow-hidden shadow-xl">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4 italic">
                                <History className="text-brand" /> Ledger Protocol
                            </h3>
                            <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Generate PDF</button>
                        </div>

                        <div className="divide-y divide-white/5">
                            {transactions.map(tx => (
                                <div key={tx.id} className="p-8 hover:bg-white/[0.01] transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-2xl ${tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {tx.type === 'withdrawal' ? <ArrowUpCircle size={24}/> : <ArrowDownCircle size={24}/>}
                                        </div>
                                        <div>
                                            <div className="text-white font-black text-base uppercase tracking-tight">
                                                {tx.type.replace('_', ' ')}
                                                {tx.metadata.senderName && <span className="text-brand font-medium lowercase ml-3">from @{tx.metadata.senderName}</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                                                {new Date(tx.created_at).toLocaleDateString()} • NODE_REF: {tx.id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xl font-black ${tx.type === 'withdrawal' ? 'text-white' : 'text-green-500'}`}>
                                            {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toFixed(2)}
                                        </div>
                                        <div className={`text-[9px] font-black uppercase tracking-widest mt-2 px-3 py-1 rounded-full inline-block ${tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {tx.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletPage;
