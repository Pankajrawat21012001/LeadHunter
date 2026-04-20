'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Briefcase, 
    Target, 
    Link2, 
    Check, 
    Search, 
    X,
    MessageSquare,
    Mail,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const searchSchema = z.object({
  targetDescription: z.string().min(5, "Tell us a bit more about what you're looking for"),
  useCase: z.enum(["job", "customer", "connection"]),
  needs: z.object({
    linkedinUrl: z.boolean(),
    email: z.boolean(),
    linkedinMessage: z.boolean(),
    coldEmail: z.boolean(),
  }),
  targetCount: z.number().min(1).max(50),
  senderContext: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

const STEPS = [
  { id: 1, label: "Understanding intent" },
  { id: 2, label: "Searching internet" },
  { id: 3, label: "Extracting profiles" },
  { id: 4, label: "Deduplicating" },
  { id: 5, label: "Finding emails" },
  { id: 6, label: "Personalizing messages" },
  { id: 7, label: "Finalizing" },
];

import { useSearchParams } from 'next/navigation';

export default function SearchForm({ existingCount }: { existingCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearching, setIsSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [stepStates, setStepStates] = useState<Record<number, { status: string; message: string; data?: any }>>({});
  const [progress, setProgress] = useState(0);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      targetDescription: searchParams.get('q') || "",
      useCase: (searchParams.get('useCase') as any) || "connection",
      needs: {
        linkedinUrl: true,
        email: true,
        linkedinMessage: true,
        coldEmail: true,
      },
      targetCount: 10,
      senderContext: "",
    },
  });

  useEffect(() => {
    const q = searchParams.get('q');
    const u = searchParams.get('useCase');
    if (q) form.setValue('targetDescription', q);
    if (u) form.setValue('useCase', u as any);
  }, [searchParams, form]);

  const onSubmit = async (values: SearchFormValues) => {
    setIsSearching(true);
    setProgress(0);
    setStepStates({});
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          previousQuery: searchParams.get('prev') || undefined
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
            console.log('SSE Event:', event);
            
            if (event.step !== undefined) {
              setCurrentStep(event.step);
              setStepStates(prev => ({
                ...prev,
                [event.step]: { 
                    status: event.status, 
                    message: event.message,
                    data: event.data 
                }
              }));

              if (event.step > 0) {
                setProgress((event.step / STEPS.length) * 100);
              }
            }

            if (event.status === 'complete' || (event.step === 0 && event.status === 'complete')) {
              toast.success("Campaign search completed!");
              setTimeout(() => {
                router.push(`/campaign/${event.data.campaignId}`);
              }, 1500);
            }

            if (event.status === 'error') {
              toast.error(event.message);
              setIsSearching(false);
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      setIsSearching(false);
    }
  };

  const useCase = form.watch("useCase");
  const targetCount = form.watch("targetCount");

  return (
    <div className="space-y-10 pb-20">
      <AnimatePresence mode="wait">
        {!isSearching ? (
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="space-y-10"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-5xl font-heading tracking-tight text-foreground">Who are you looking for?</h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Describe your ideal outreach targets and let AI handle the heavy lifting.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 max-w-3xl mx-auto">
              {/* Target Description */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  {...form.register("targetDescription")}
                  placeholder='e.g. "HR managers at startups in India"'
                  className="h-15 pl-12 text-lg bg-white border-purple-200 rounded-2xl focus:ring-primary focus:border-primary transition-all shadow-sm text-foreground placeholder:text-muted-foreground/60"
                />
                {form.formState.errors.targetDescription && (
                  <p className="text-red-500 text-sm mt-2">{form.formState.errors.targetDescription.message}</p>
                )}
              </div>

              {/* Use Case Cards */}
              <div className="space-y-4">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block text-center">
                  What is your goal?
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <UseCaseCard
                    id="job"
                    selected={useCase === "job"}
                    onClick={() => form.setValue("useCase", "job")}
                    icon={<Briefcase className="w-5 h-5" />}
                    title="Get a Job"
                    description="Find hiring managers & recruiters"
                  />
                  <UseCaseCard
                    id="customer"
                    selected={useCase === "customer"}
                    onClick={() => form.setValue("useCase", "customer")}
                    icon={<Target className="w-5 h-5" />}
                    title="Sell a Product"
                    description="Find potential customers & decision makers"
                  />
                  <UseCaseCard
                    id="connection"
                    selected={useCase === "connection"}
                    onClick={() => form.setValue("useCase", "connection")}
                    icon={<Link2 className="w-5 h-5" />}
                    title="Networking"
                    description="Expand your professional circle"
                  />
                </div>
              </div>

              {/* Sender Context */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block text-center">
                  About You (Optional)
                </label>
                <div className="relative max-w-2xl mx-auto">
                    <textarea
                    {...form.register("senderContext")}
                    placeholder='e.g. "I am a product designer with 5 years at B2B SaaS startups"'
                    className="w-full h-28 bg-white border border-purple-200 rounded-2xl p-5 text-sm resize-none focus:ring-1 ring-primary focus:border-primary transition-all shadow-sm text-foreground placeholder:text-muted-foreground/60"
                    />
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mt-2 tracking-widest text-center">
                        This detail helps Groq write hyper-personalized messages.
                    </p>
                </div>
              </div>

              {/* Checkboxes & Count */}
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">
                    What do you need?
                  </label>
                  <div className="grid gap-3">
                    <NeedsCheckbox label="LinkedIn Profile" checked={form.watch("needs.linkedinUrl")} onChange={(v: boolean) => form.setValue("needs.linkedinUrl", v)} icon={<Link2 className="w-4 h-4" />} />
                    <NeedsCheckbox label="Email Address" checked={form.watch("needs.email")} onChange={(v: boolean) => form.setValue("needs.email", v)} icon={<Mail className="w-4 h-4" />} />
                    <NeedsCheckbox label="LinkedIn Message" checked={form.watch("needs.linkedinMessage")} onChange={(v: boolean) => form.setValue("needs.linkedinMessage", v)} icon={<MessageSquare className="w-4 h-4" />} />
                    <NeedsCheckbox label="Cold Email" checked={form.watch("needs.coldEmail")} onChange={(v: boolean) => form.setValue("needs.coldEmail", v)} icon={<Mail className="w-4 h-4" />} />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">
                    How many people?
                  </label>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-5xl font-heading text-primary">{targetCount}</span>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">New People</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          You have {existingCount} in your list
                        </p>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="50" 
                      value={targetCount}
                      onChange={(e) => form.setValue("targetCount", parseInt(e.target.value))}
                      className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-14 text-base rounded-2xl accent-glow group mt-6 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg"
              >
                <Zap className="w-5 h-5 mr-2 fill-white group-hover:scale-110 transition-transform" />
                Find People
                <ArrowRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
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
                        {step.id === 2 && currentStep === 2 && state?.data?.count && (
                          <span className="inline-block mt-0.5 font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            {state.data.count} found
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        {state && state.message && (
                          <p className="text-xs text-muted-foreground animate-in slide-in-from-left-2 fade-in">{state.message}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-red-500 hover:bg-red-50"
                onClick={() => setIsSearching(false)}
            >
              Cancel Search
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UseCaseCard({ id, selected, onClick, icon, title, description }: any) {
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


function NeedsCheckbox({ label, checked, onChange, icon }: any) {
  return (
    <div 
      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
        checked 
          ? 'bg-primary/8 border-primary/30 text-primary' 
          : 'bg-white border-purple-100 text-muted-foreground hover:border-purple-300 hover:bg-purple-50/50'
      }`}
      onClick={() => onChange(!checked)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v)}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        onClick={(e) => e.stopPropagation()}
      />
      <span className={`text-sm flex-1 font-medium ${checked ? 'text-primary' : 'text-foreground'}`}>{label}</span>
      <div className={`${checked ? 'text-primary' : 'text-muted-foreground/50'}`}>{icon}</div>
    </div>
  );
}
