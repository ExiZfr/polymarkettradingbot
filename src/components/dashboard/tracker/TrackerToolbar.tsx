import { Filter, Search } from 'lucide-react';
import type { FilterState } from '@/types/tracker';

interface Props {
    filter: FilterState;
    onChange: (filter: FilterState) => void;
}

export default function TrackerToolbar({ filter, onChange }: Props) {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-[#0a0f16]">
            {/* Tag Filter */}
            <div className="relative min-w-[180px]">
                <select
                    value={filter.tag}
                    onChange={(e) => onChange({ ...filter, tag: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50 appearance-none"
                >
                    <option value="">All Tags</option>
                    <option value="insider">👁️ Insider</option>
                    <option value="smart">🧠 Smart Money</option>
                    <option value="winner">🏆 Winner</option>
                    <option value="whale">🐋 Whale</option>
                    <option value="shark">🦈 Shark</option>
                    <option value="dolphin">🐬 Dolphin</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <Filter className="w-3 h-3" />
                </div>
            </div>

            {/* Min Amount Pills */}
            <div className="flex items-center gap-1">
                {[0, 1000, 50000, 100000].map((amt) => (
                    <button
                        key={amt}
                        onClick={() => onChange({ ...filter, minAmount: amt })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter.minAmount === amt
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-white/5 text-gray-500 hover:text-gray-300 border border-transparent'
                            }`}
                    >
                        {amt === 0 ? 'All Size' : `>${amt / 1000}k`}
                    </button>
                ))}
            </div>

            <div className="ml-auto relative">
                <input
                    type="text"
                    placeholder="Search market..."
                    className="bg-black/20 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/30 w-64 block"
                />
                <Search className="w-3 h-3 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
        </div>
    );
}
