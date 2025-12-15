import { Filter } from 'lucide-react';
import type { FilterState } from '@/types/tracker';

interface Props {
    filter: FilterState;
    onChange: (filter: FilterState) => void;
}

export default function TrackerFilters({ filter, onChange }: Props) {
    const amounts = [0, 1000, 5000, 10000, 50000, 100000];

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                <Filter className="w-4 h-4 text-blue-400" />
                Filters
            </h3>

            <div className="space-y-6">
                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-3 block uppercase tracking-wider">Whale Tag</label>
                    <div className="relative">
                        <select
                            value={filter.tag}
                            onChange={(e) => onChange({ ...filter, tag: e.target.value })}
                            className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer hover:border-white/20"
                        >
                            <option value="">All Categories</option>
                            <option value="insider">👁️ Insider (High WR + New)</option>
                            <option value="smart">🧠 Smart Money (High WR)</option>
                            <option value="winner">🏆 Winner (High PnL)</option>
                            <option value="dumb">🤡 Dumb Money</option>
                            <option value="loser">💀 Loser</option>
                            <option value="whale">🐋 Whale (&gt; $100k)</option>
                            <option value="shark">🦈 Shark (&gt; $20k)</option>
                            <option value="dolphin">🐬 Dolphin (&gt; $5k)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-3 block uppercase tracking-wider">Min Amount</label>
                    <div className="grid grid-cols-3 gap-2">
                        {amounts.map((amt) => (
                            <button
                                key={amt}
                                onClick={() => onChange({ ...filter, minAmount: amt })}
                                className={`px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 border ${filter.minAmount === amt
                                        ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-[#0a0f16] border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20 hover:text-gray-200'
                                    }`}
                            >
                                {amt === 0 ? 'Any' : `$${amt / 1000}k`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
