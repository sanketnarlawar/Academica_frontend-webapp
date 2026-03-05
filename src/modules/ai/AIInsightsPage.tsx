import { Brain, TrendingUp, AlertTriangle, Star, Lightbulb } from 'lucide-react';

const insights = [
    {
        id: 1, icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10', title: 'Fee Collection Trending Up',
        body: 'Fee collection has improved by 8.5% compared to last month. Sending timely reminders has been effective — consider automating this for consistent results.',
        category: 'Finance', confidence: 92,
    },
    {
        id: 2, icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10', title: 'Attendance Dip on Fridays',
        body: 'Student attendance drops by ~12% every Friday compared to week average. Consider scheduling engaging activities or assemblies on Fridays.',
        category: 'Attendance', confidence: 87,
    },
    {
        id: 3, icon: Star, color: 'text-violet-400 bg-violet-500/10', title: 'Top Performing Class',
        body: 'Class 10-A maintains the highest attendance (93%) and has the best fee payment rate. The teaching approach in this class could be a model for others.',
        category: 'Academics', confidence: 95,
    },
    {
        id: 4, icon: Lightbulb, color: 'text-blue-400 bg-blue-500/10', title: 'Admission Growth Opportunity',
        body: '8 new admission applications received this week, which is 60% higher than the same period last year. Consider expanding Class 6 capacity.',
        category: 'Admissions', confidence: 78,
    },
];

export default function AIInsightsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="page-title">AI Insights</h1>
                    <p className="page-subtitle">Smart recommendations powered by data analysis</p>
                </div>
            </div>

            <div className="glass-card p-5 border-violet-500/20 bg-violet-500/5">
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <p className="text-sm text-slate-300">
                        AI has analyzed <strong className="text-white">1,248 student records</strong>, <strong className="text-white">9 months</strong> of fee data, and <strong className="text-white">180 days</strong> of attendance to generate these insights.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {insights.map(insight => {
                    const Icon = insight.icon;
                    return (
                        <div key={insight.id} className="glass-card p-6 hover:border-white/15 transition-all hover:scale-[1.01]">
                            <div className="flex items-start gap-4">
                                <div className={`p-2.5 rounded-xl ${insight.color} flex-shrink-0`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-sm font-semibold text-white">{insight.title}</h3>
                                        <span className="badge badge-purple text-[10px]">{insight.category}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">{insight.body}</p>
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${insight.confidence}%` }} />
                                        </div>
                                        <span className="text-xs text-slate-500">{insight.confidence}% confidence</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
