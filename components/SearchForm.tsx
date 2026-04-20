'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Briefcase, 
    Target, 
    Link2, 
    Check, 
    X,
    MessageSquare,
    Mail,
    ArrowRight,
    Plus,
    ChevronDown,
    Users,
    MapPin,
    Building2,
    Tag,
    TrendingUp,
    Layers,
    User2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { SearchFilters, UseCase } from '@/lib/types';

// ---------- Tag Input ----------
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const add = (raw: string) => {
        const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
        const next = [...new Set([...value, ...parts])];
        onChange(next);
        setDraft('');
    };

    const remove = (tag: string) => onChange(value.filter(t => t !== tag));

    const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (['Enter', ','].includes(e.key)) { e.preventDefault(); add(draft); }
        if (e.key === 'Backspace' && !draft && value.length) remove(value[value.length - 1]);
    };

    return (
        <div 
            className="flex flex-wrap gap-1.5 min-h-[44px] w-full bg-white border border-purple-200 rounded-xl px-3 py-2 cursor-text focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
            onClick={() => inputRef.current?.focus()}
        >
            {value.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-lg border border-primary/20">
                    {tag}
                    <button type="button" onClick={() => remove(tag)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={onKey}
                onBlur={() => { if (draft) add(draft); }}
                placeholder={value.length === 0 ? placeholder : ''}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
            />
        </div>
    );
}

// ---------- Select Field ----------
function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none bg-white border border-purple-200 rounded-xl px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-9 outline-none"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
    );
}

// ---------- Field Label ----------
function FieldLabel({ icon, label, hint }: { icon: React.ReactNode; label: string; hint?: string }) {
    return (
        <div className="flex items-center gap-2 mb-2">
            <span className="p-1 bg-primary/10 rounded-md text-primary">{icon}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
            {hint && <span className="text-[10px] font-medium text-muted-foreground/50 ml-auto">{hint}</span>}
        </div>
    );
}

const STEPS = [
    { id: 1, label: "Building queries" },
    { id: 2, label: "Searching LinkedIn" },
    { id: 3, label: "Extracting profiles" },
    { id: 4, label: "Deduplicating" },
    { id: 5, label: "Finding emails" },
    { id: 6, label: "Personalizing messages" },
    { id: 7, label: "Finalizing" },
];

const COMPANY_STAGES = [
    { value: 'any', label: 'Any Stage' },
    { value: 'startup', label: 'Startup (Early-stage)' },
    { value: 'mid-size', label: 'Mid-size Company' },
    { value: 'enterprise', label: 'Enterprise / Large Corp' },
];

const SENIORITY_OPTIONS = [
    { value: 'any', label: 'Any Seniority' },
    { value: 'IC', label: 'Individual Contributor' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Director', label: 'Director / VP' },
    { value: 'C-level', label: 'C-Level (CEO, CTO, CMO…)' },
];

import { useSearchParams } from 'next/navigation';

const DEFAULT_FILTERS: SearchFilters = {
    roles: [],
    industries: [],
    locations: [],
    companyStage: 'any',
    companySize: null,
    signals: [],
    seniority: 'any',
};

export default function SearchForm({ existingCount }: { existingCount: number }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [useCase, setUseCase] = useState<UseCase>('connection');
    const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const [needs, setNeeds] = useState({ linkedinUrl: true, email: true, linkedinMessage: true, coldEmail: true });
    const [targetCount, setTargetCount] = useState(10);
    const [senderContext, setSenderContext] = useState('');

    const [isSearching, setIsSearching] = useState(false);
    const [currentStep, setCurrentStep] = useState<number | null>(null);
    const [stepStates, setStepStates] = useState<Record<number, { status: string; message: string; data?: any }>>({});
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!searchParams) return;

        const u = searchParams.get('useCase');
        if (u) setUseCase(u as UseCase);

        // Restore full filter state when coming from "Find More" (New Way)
        const filtersParam = searchParams.get('filters');
        if (filtersParam) {
            try {
                const parsed = JSON.parse(filtersParam) as SearchFilters;
                if (parsed && typeof parsed === 'object') {
                    setFilters({
                        roles: Array.isArray(parsed.roles) ? parsed.roles : [],
                        industries: Array.isArray(parsed.industries) ? parsed.industries : [],
                        locations: Array.isArray(parsed.locations) ? parsed.locations : [],
                        companyStage: parsed.companyStage || 'any',
                        companySize: parsed.companySize || null,
                        signals: Array.isArray(parsed.signals) ? parsed.signals : [],
                        seniority: parsed.seniority || 'any',
                    });
                }
            } catch (e) {
                console.error('Failed to restore filters from URL:', e);
            }
        } else {
            // Check for legacy description fallback
            const q = searchParams.get('q');
            if (q) {
                // Call extraction API to bifurcate the single string into proper fields
                fetch('/api/extract-filters', {
                    method: 'POST',
                    body: JSON.stringify({ description: q }),
                })
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setFilters({
                            roles: data.roles || [q],
                            industries: data.industries || [],
                            locations: data.locations || [],
                            companyStage: data.companyStage || 'any',
                            companySize: data.companySize || null,
                            signals: data.signals || [],
                            seniority: data.seniority || 'any',
                        });
                    } else {
                        setFilters(prev => ({ ...prev, roles: [q] }));
                    }
                })
                .catch(() => setFilters(prev => ({ ...prev, roles: [q] })));
            }
        }
    }, [searchParams]);

    const setFilter = <K extends keyof SearchFilters>(key: K, val: SearchFilters[K]) => {
        setFilters(prev => ({ ...prev, [key]: val }));
    };

    // Build a readable description from the filters
    const buildDescription = () => {
        const parts: string[] = [];
        if (filters.roles.length) parts.push(filters.roles.join(' / '));
        if (filters.industries.length) parts.push(`in ${filters.industries.join(', ')}`);
        if (filters.locations.length) parts.push(`based in ${filters.locations.join(', ')}`);
        if (filters.companyStage !== 'any') parts.push(`at ${filters.companyStage} companies`);
        return parts.join(', ') || 'Custom search';
    };

    const validate = () => {
        if (filters.roles.length === 0) { toast.error('Add at least one Job Title / Role.'); return false; }
        return true;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSearching(true);
        setProgress(0);
        setStepStates({});

        const targetDescription = buildDescription();

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                body: JSON.stringify({
                    targetDescription,
                    filters,
                    useCase,
                    needs,
                    targetCount,
                    senderContext: senderContext || undefined,
                    previousQuery: searchParams.get('prev') || undefined,
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to start search');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(l => l.trim().startsWith('data: '));

                for (const line of lines) {
                    try {
                        const event = JSON.parse(line.replace('data: ', ''));
                        if (event.step !== undefined) {
                            setCurrentStep(event.step);
                            setStepStates(prev => ({ ...prev, [event.step]: { status: event.status, message: event.message, data: event.data } }));
                            if (event.step > 0) setProgress((event.step / STEPS.length) * 100);
                        }
                        if (event.status === 'complete') {
                            toast.success("Campaign search completed!");
                            setTimeout(() => router.push(`/campaign/${event.data.campaignId}`), 1500);
                        }
                        if (event.status === 'error') {
                            toast.error(event.message);
                            setIsSearching(false);
                        }
                    } catch (e) { /* ignore parse error */ }
                }
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <AnimatePresence mode="wait">
                {!isSearching ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="space-y-10"
                    >
                        {/* Header */}
                        <div className="text-center space-y-3">
                            <h1 className="text-5xl font-heading tracking-tight text-foreground">Who are you looking for?</h1>
                            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                                Fill in the fields below — we'll build a precise LinkedIn search query from your inputs.
                            </p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-8 max-w-4xl mx-auto">
                            {/* ── GOAL ── */}
                            <div className="space-y-3">
                                <FieldLabel icon={<Target className="w-3.5 h-3.5" />} label="Your Goal" />
                                <div className="grid grid-cols-3 gap-4">
                                    <UseCaseCard id="job" selected={useCase === "job"} onClick={() => setUseCase("job")} icon={<Briefcase className="w-5 h-5" />} title="Get a Job" description="Find hiring managers & recruiters" />
                                    <UseCaseCard id="customer" selected={useCase === "customer"} onClick={() => setUseCase("customer")} icon={<Target className="w-5 h-5" />} title="Sell a Product" description="Find potential customers & decision makers" />
                                    <UseCaseCard id="connection" selected={useCase === "connection"} onClick={() => setUseCase("connection")} icon={<Link2 className="w-5 h-5" />} title="Networking" description="Expand your professional circle" />
                                </div>
                            </div>

                            {/* ── MAIN FILTER GRID ── */}
                            <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm space-y-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-purple-50 pb-3">
                                    LinkedIn Search Filters
                                </p>

                                {/* Row 1: Roles + Seniority */}
                                <div className="grid grid-cols-[1fr_220px] gap-5">
                                    <div>
                                        <FieldLabel icon={<User2 className="w-3.5 h-3.5" />} label="Job Titles / Roles" hint="Required · press Enter or comma to add" />
                                        <TagInput value={filters.roles} onChange={v => setFilter('roles', v)} placeholder='e.g. "Product Manager", "CTO"' />
                                    </div>
                                    <div>
                                        <FieldLabel icon={<Layers className="w-3.5 h-3.5" />} label="Seniority Level" />
                                        <SelectField value={filters.seniority} onChange={v => setFilter('seniority', v)} options={SENIORITY_OPTIONS} />
                                    </div>
                                </div>

                                {/* Row 2: Industries */}
                                <div>
                                    <FieldLabel icon={<Building2 className="w-3.5 h-3.5" />} label="Industries / Sectors" hint="Optional · press Enter to add" />
                                    <TagInput value={filters.industries} onChange={v => setFilter('industries', v)} placeholder='e.g. "SaaS", "FinTech", "Healthcare"' />
                                </div>

                                {/* Row 3: Locations */}
                                <div>
                                    <FieldLabel icon={<MapPin className="w-3.5 h-3.5" />} label="Locations" hint="Countries or cities" />
                                    <TagInput value={filters.locations} onChange={v => setFilter('locations', v)} placeholder='e.g. "India", "San Francisco", "UK"' />
                                </div>

                                {/* Row 4: Company Stage + Company Size */}
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <FieldLabel icon={<TrendingUp className="w-3.5 h-3.5" />} label="Company Stage" />
                                        <SelectField value={filters.companyStage} onChange={v => setFilter('companyStage', v)} options={COMPANY_STAGES} />
                                    </div>
                                    <div>
                                        <FieldLabel icon={<Users className="w-3.5 h-3.5" />} label="Company Size" hint="Optional" />
                                        <input
                                            type="text"
                                            value={filters.companySize || ''}
                                            onChange={e => setFilter('companySize', e.target.value || null)}
                                            placeholder='e.g. "1-50", "500-1000"'
                                            className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Row 5: Intent Signals */}
                                <div>
                                    <FieldLabel icon={<Tag className="w-3.5 h-3.5" />} label="Intent Signals / Keywords" hint="Optional — helps filter by activity" />
                                    <TagInput value={filters.signals} onChange={v => setFilter('signals', v)} placeholder='e.g. "hiring", "fundraising", "scaling"' />
                                </div>
                            </div>

                            {/* ── SENDER CONTEXT ── */}
                            <div className="space-y-2">
                                <FieldLabel icon={<MessageSquare className="w-3.5 h-3.5" />} label="About You" hint="Optional — helps write personalized messages" />
                                <textarea
                                    value={senderContext}
                                    onChange={e => setSenderContext(e.target.value)}
                                    placeholder='e.g. "I am a product designer with 5 years at B2B SaaS startups"'
                                    className="w-full h-24 bg-white border border-purple-200 rounded-2xl p-4 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
                                />
                            </div>

                            {/* ── NEEDS & COUNT ── */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <FieldLabel icon={<Check className="w-3.5 h-3.5" />} label="What do you need?" />
                                    <div className="grid gap-2.5">
                                        <NeedsCheckbox label="LinkedIn Profile URL" checked={needs.linkedinUrl} onChange={(v: boolean) => setNeeds(p => ({ ...p, linkedinUrl: v }))} icon={<Link2 className="w-4 h-4" />} />
                                        <NeedsCheckbox label="Email Address" checked={needs.email} onChange={(v: boolean) => setNeeds(p => ({ ...p, email: v }))} icon={<Mail className="w-4 h-4" />} />
                                        <NeedsCheckbox label="LinkedIn Message" checked={needs.linkedinMessage} onChange={(v: boolean) => setNeeds(p => ({ ...p, linkedinMessage: v }))} icon={<MessageSquare className="w-4 h-4" />} />
                                        <NeedsCheckbox label="Cold Email" checked={needs.coldEmail} onChange={(v: boolean) => setNeeds(p => ({ ...p, coldEmail: v }))} icon={<Mail className="w-4 h-4" />} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <FieldLabel icon={<Users className="w-3.5 h-3.5" />} label="How many people?" />
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-5xl font-heading text-primary">{targetCount}</span>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground uppercase font-semibold">New People</p>
                                                <p className="text-xs text-muted-foreground mt-1">You have {existingCount} in your list</p>
                                            </div>
                                        </div>
                                        <input
                                            type="range" min="1" max="50" value={targetCount}
                                            onChange={e => setTargetCount(parseInt(e.target.value))}
                                            className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-14 text-base rounded-2xl accent-glow group mt-2 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg"
                            >
                                <Zap className="w-5 h-5 mr-2 fill-white group-hover:scale-110 transition-transform" />
                                Find People
                                <ArrowRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="progress"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-xl mx-auto space-y-10"
                    >
                        <div className="text-center space-y-3">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <Zap className="w-9 h-9 text-primary fill-primary animate-pulse" />
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            </div>
                            <h2 className="text-3xl font-heading text-foreground">Finding your people...</h2>
                            <p className="text-muted-foreground text-sm">This normally takes 1–2 minutes depending on quantity</p>
                        </div>

                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-purple-100 shadow-md">
                            <Progress value={progress} className="h-2.5" />
                            <div className="space-y-5">
                                {STEPS.map((step) => {
                                    const state = stepStates[step.id];
                                    return (
                                        <div key={step.id} className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                                                state?.status === 'done' ? 'bg-emerald-100 text-emerald-600' :
                                                currentStep === step.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' :
                                                'bg-purple-50 text-muted-foreground'
                                            }`}>
                                                {state?.status === 'done' ? <Check className="w-4 h-4" /> :
                                                 currentStep === step.id ? <div className="w-2 h-2 bg-white rounded-full animate-ping" /> :
                                                 <span className="text-xs font-bold">{step.id}</span>}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-semibold text-sm transition-colors ${currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {step.label}
                                                </p>
                                                {state?.message && (
                                                    <p className="text-xs text-muted-foreground animate-in slide-in-from-left-2 fade-in mt-0.5">{state.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Button variant="ghost" className="w-full text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => setIsSearching(false)}>
                            Cancel Search
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function UseCaseCard({ id, selected, onClick, icon, title, description }: { id: string; selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string }) {
    return (
        <Card
            onClick={onClick}
            className={`p-5 cursor-pointer transition-all duration-200 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] shadow-sm ${
                selected
                    ? 'bg-primary/8 border-primary/40 ring-2 ring-primary/20 shadow-primary/10'
                    : 'bg-white border-purple-100 hover:border-purple-300 hover:bg-purple-50/50'
            }`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${selected ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'bg-purple-50 text-primary'}`}>
                {icon}
            </div>
            <h3 className={`font-semibold text-base mb-1 ${selected ? 'text-primary' : 'text-foreground'}`}>{title}</h3>
            <p className="text-xs text-muted-foreground leading-snug">{description}</p>
            {selected && (
                <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-sm">
                    <Check className="w-2.5 h-2.5 text-white" />
                </div>
            )}
        </Card>
    );
}

function NeedsCheckbox({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode }) {
    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                checked
                    ? 'bg-primary/8 border-primary/30 text-primary'
                    : 'bg-white border-purple-100 text-muted-foreground hover:border-purple-300 hover:bg-purple-50/50'
            }`}
            onClick={() => onChange(!checked)}
        >
            <Checkbox
                checked={checked}
                onCheckedChange={(v: boolean) => onChange(v)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                onClick={e => e.stopPropagation()}
            />
            <span className={`text-sm flex-1 font-medium ${checked ? 'text-primary' : 'text-foreground'}`}>{label}</span>
            <div className={`${checked ? 'text-primary' : 'text-muted-foreground/50'}`}>{icon}</div>
        </div>
    );
}
