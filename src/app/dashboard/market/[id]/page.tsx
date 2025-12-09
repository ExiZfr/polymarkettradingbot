"use client";

<div className="flex h-screen items-center justify-center bg-[#0A0B0F]">
    <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white animate-pulse">Running Deep Analysis...</h2>
        <p className="text-slate-400 text-sm mt-2">Checking sentiment, volume profile, and whale movements</p>
    </div>
</div>
    );

return (
    <div className="min-h-screen bg-[#0A0B0F] p-6 pb-24">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
                <ArrowLeft size={16} /> Back
            </button>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white leading-tight mb-2">{market?.title}</h1>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-400 font-mono">Vol: {market?.volume}</span>
                        <span className="text-indigo-400 font-mono">Prob: {market?.probability}%</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Column: AI Analysis */}
            <div className="md:col-span-2 space-y-6">

                {/* Score Card */}
                <div className="bg-[#15171E] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Brain size={120} />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-400" /> AI Confidence Score
                    </h2>

                    <div className="flex items-end gap-4 mb-4">
                        <span className="text-5xl font-black text-green-400">92/100</span>
                        <span className="text-sm text-slate-400 mb-2">Strong Buy Signal</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-xl">
                            <span className="text-xs text-slate-500 block mb-1">Sentiment</span>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[85%]" />
                            </div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl">
                            <span className="text-xs text-slate-500 block mb-1">Whale Flow</span>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[70%]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reasoning */}
                <div className="bg-[#15171E] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-md font-bold text-white mb-4">Analysis Results</h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm text-slate-300">
                            <CheckCircle className="text-green-500 shrink-0" size={16} />
                            Recent news spike correlates with 50% volume surge.
                        </li>
                        <li className="flex gap-3 text-sm text-slate-300">
                            <CheckCircle className="text-green-500 shrink-0" size={16} />
                            "Whale 0x5a...3f" accumulated $50k YES shares in last hour.
                        </li>
                        <li className="flex gap-3 text-sm text-slate-300">
                            <AlertTriangle className="text-yellow-500 shrink-0" size={16} />
                            High volatility expected in next 24h due to upcoming press conference.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right Column: Execution */}
            <div className="space-y-6">
                {/* Trade Card */}
                <div className="bg-[#15171E] border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden">
                    {isExecuting && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10 flex-col gap-2">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                            <span className="text-sm font-bold text-white">Executing on Paper Engine...</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-white">Take Position</h2>
                        {wallet && (
                            <div className="text-xs text-right">
                                <span className="text-slate-500 block">Paper Balance</span>
                                <span className="text-green-400 font-mono font-bold">${wallet.balance.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Amount ($)</label>
                            <input
                                type="number"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(e.target.value)}
                                placeholder="100"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => handleTrade('YES')}
                            className="flex-1 py-3 bg-green-500/10 border border-green-500/50 hover:bg-green-500/20 text-green-400 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Buy YES
                        </button>
                        <button
                            onClick={() => handleTrade('NO')}
                            className="flex-1 py-3 bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Buy NO
                        </button>
                    </div>

                    {tradeResult && (
                        <div className={`p-3 rounded-lg text-xs border ${tradeResult.status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            {tradeResult.status === 'success' && <CheckCircle className="inline mr-1" size={12} />}
                            {tradeResult.message}
                        </div>
                    )}

                    <p className="text-center text-xs text-slate-600 mt-4 flex items-center justify-center gap-1">
                        <Shield size={10} /> Secure Execution via PolyGraalX Paper Engine
                    </p>
                </div>
            </div>
        </div>
    </div>
);
}
