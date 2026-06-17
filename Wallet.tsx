

import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { monetizationService } from './services/monetizationService';
import { CreatorWallet, WalletTransaction, PayoutMethod } from './types';
import { 
    Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, 
    History, CreditCard, Landmark, Zap, ShieldCheck, 
    ChevronRight, AlertCircle, Sparkles, DollarSign
} from 'lucide-react';

const WalletPage: React.FC = () => {
    const { user, profile } = useAuth();
    const [wallet, setWallet] = useState<CreatorWallet | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    // Fixed: PayoutMethod is now exported from types.ts
    const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('bank');

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const w = await monetizationService.getWallet(user.id);
            if (w) {
                setWallet(w);
                const txs = await monetizationService.getTransactionHistory(w.id);
                setTransactions(txs);
            }
            setLoading(false);
        };
        load();
    }, [user]);

    const handleWithdraw = async () => {
        if (!user || !withdrawAmount || Number(withdrawAmount) <= 0) return;
        try {
            await monetizationService.requestWithdrawal(user.id, Number(withdrawAmount), payoutMethod);
            alert("Withdrawal request sent successfully!");
            // Reload wallet
            const w = await monetizationService.getWallet(user.id);
            setWallet(w);
            setWithdrawAmount('');
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse font-black text-slate-500">SYNCHRONIZING WALLET...</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 pb-32">
            
            {/* Header / Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0b1026] rounded-[3rem] p-10 border border-white/5 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Landmark size={200} /></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <div className="flex items-center gap-2 text-brand font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                                <Sparkles size={14} /> Total Revenue Balance
                            </div>
                            <h1 className="text-6xl font-black text-white tracking-tighter flex items-start gap-1">
                                <span className="text-2xl mt-2 opacity-50">$</span>
                                {wallet?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h1>
                            <div className="mt-6 flex items-center gap-4">
                                <div className="bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp size={12} /> +12.4% this month
                                </div>
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Global Payout Enabled</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-4 w-full md:w-auto">
                            <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] min-w-[200px]">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending Clearance</div>
                                <div className="text-xl font-black text-white">${wallet?.pending_balance.toLocaleString()}</div>
                                <p className="text-[9px] text-slate-600 mt-2">Cleared every 7 days</p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] min-w-[200px]">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lifetime Earned</div>
                                <div className="text-xl font-black text-brand">${wallet?.total_earned.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-brand rounded-[3rem] p-10 text-white shadow-2xl shadow-brand/20 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-transform">
                     <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                            <CreditCard size={28} />
                        </div>
                        <ShieldCheck size={24} className="opacity-50" />
                     </div>
                     <div className="mt-8">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Connected Method</div>
                        <div className="text-xl font-black">{profile?.full_name?.toUpperCase() || 'AZKAAR CREATOR'}</div>
                        <div className="text-sm font-mono mt-1 opacity-80">•••• •••• •••• 4242</div>
                     </div>
                     <div className="mt-10 flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-widest">Level 3 KYC Verified</span>
                         <div className="bg-white text-brand px-4 py-2 rounded-xl text-[10px] font-black uppercase">Standard</div>
                     </div>
                </div>
            </div>

            {/* Main Action Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Withdrawal Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0b1026] rounded-[2.5rem] p-8 border border-white/5">
                        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Request Payout</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Amount (USD)</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xl font-black text-white outline-none focus:border-brand transition-all pl-12"
                                    />
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-2 block">Payout Channel</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'bank', icon: Landmark, label: 'Bank Transfer' },
                                        { id: 'easypaisa', icon: Zap, label: 'Easypaisa' },
                                        { id: 'jazzcash', icon: Zap, label: 'JazzCash' },
                                        { id: 'stripe', icon: CreditCard, label: 'Stripe' }
                                    ].map(method => (
                                        <button 
                                            key={method.id}
                                            onClick={() => setPayoutMethod(method.id as PayoutMethod)}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${payoutMethod === method.id ? 'bg-brand/10 border-brand text-brand shadow-lg shadow-brand/10' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                                        >
                                            <method.icon size={20} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleWithdraw}
                                disabled={!withdrawAmount || Number(withdrawAmount) > (wallet?.balance || 0)}
                                className="w-full py-5 bg-brand text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-brand/30 hover:bg-brand-600 disabled:opacity-30 disabled:grayscale transition-all"
                            >
                                Initiate Withdrawal
                            </button>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex gap-4">
                        <AlertCircle className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1">Compliance Check</h4>
                            <p className="text-slate-400 text-[11px] leading-relaxed">Tax forms are required for withdrawals over $500. Visit the <span className="text-amber-500 font-bold underline cursor-pointer">Tax Center</span> to complete your profile.</p>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0b1026] rounded-[2.5rem] border border-white/5 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <History className="text-brand" /> Ledger History
                            </h3>
                            <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Export CSV</button>
                        </div>

                        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto scrollbar-hide">
                            {transactions.length === 0 ? (
                                <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-[0.2em] opacity-40">No ledger entries found</div>
                            ) : (
                                transactions.map(tx => (
                                    <div key={tx.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-2xl ${
                                                tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' : 
                                                tx.type === 'tip' ? 'bg-brand/10 text-brand' : 'bg-green-500/10 text-green-500'
                                            }`}>
                                                {tx.type === 'withdrawal' ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}
                                            </div>
                                            <div>
                                                <div className="text-white font-black text-sm uppercase tracking-tight">
                                                    {tx.type.replace('_', ' ')}
                                                    {tx.metadata.senderName && <span className="text-slate-500 font-medium lowercase ml-2">from {tx.metadata.senderName}</span>}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                    {new Date(tx.created_at).toLocaleDateString()} • REF: #{tx.id.substring(0, 8)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-black ${tx.type === 'withdrawal' ? 'text-white' : 'text-green-500'}`}>
                                                {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toLocaleString()}
                                            </div>
                                            <div className={`text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full inline-block ${
                                                tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                                {tx.status}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletPage;
