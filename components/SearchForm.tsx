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
  const [stepStates, setStepStates] = useState<Record<number, { status: string; message: string }>>({});
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
        coldEmail: false,
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
        body: JSON.stringify(values),
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
                [event.step]: { status: event.status, message: event.message }
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
    <div className="space-y-12 pb-20">
      <AnimatePresence mode="wait">
        {!isSearching ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-heading tracking-tight">Who are you looking for?</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-sans">
                Describe your ideal outreach targets and let AI handle the heavy lifting.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12 max-w-3xl mx-auto">
              {/* Target Description */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  {...form.register("targetDescription")}
                  placeholder='e.g. "HR managers at startups in India"'
                  className="h-16 pl-14 text-xl bg-surface border-white/5 rounded-2xl focus:ring-primary focus:border-primary transition-all duration-300 shadow-2xl"
                />
                {form.formState.errors.targetDescription && (
                  <p className="text-error text-sm mt-2">{form.formState.errors.targetDescription.message}</p>
                )}
              </div>

              {/* Use Case Cards */}
              <div className="space-y-6">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground block text-center">
                  What is your goal?
                </label>
                <div className="grid grid-cols-3 gap-6">
                  <UseCaseCard
                    id="job"
                    selected={useCase === "job"}
                    onClick={() => form.setValue("useCase", "job")}
                    icon={<Briefcase className="w-6 h-6" />}
                    title="Get a Job"
                    description="Find hiring managers & recruiters"
                  />
                  <UseCaseCard
                    id="customer"
                    selected={useCase === "customer"}
                    onClick={() => form.setValue("useCase", "customer")}
                    icon={<Target className="w-6 h-6" />}
                    title="Sell a Product"
                    description="Find potential customers & decision makers"
                  />
                  <UseCaseCard
                    id="connection"
                    selected={useCase === "connection"}
                    onClick={() => form.setValue("useCase", "connection")}
                    icon={<Link2 className="w-6 h-6" />}
                    title="Networking"
                    description="Expand your professional circle"
                  />
                </div>
              </div>

              {/* Checkboxes & Count */}
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground block">
                    What do you need?
                  </label>
                  <div className="grid gap-4">
                    <NeedsCheckbox label="LinkedIn Profile" checked={form.watch("needs.linkedinUrl")} onChange={(v: boolean) => form.setValue("needs.linkedinUrl", v)} icon={<Link2 className="w-4 h-4" />} />
                    <NeedsCheckbox label="Email Address" checked={form.watch("needs.email")} onChange={(v: boolean) => form.setValue("needs.email", v)} icon={<Mail className="w-4 h-4" />} />
                    <NeedsCheckbox label="LinkedIn Message" checked={form.watch("needs.linkedinMessage")} onChange={(v: boolean) => form.setValue("needs.linkedinMessage", v)} icon={<MessageSquare className="w-4 h-4" />} />
                    <NeedsCheckbox label="Cold Email" checked={form.watch("needs.coldEmail")} onChange={(v: boolean) => form.setValue("needs.coldEmail", v)} icon={<Mail className="w-4 h-4" />} />
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground block">
                    How many people?
                  </label>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-5xl font-heading text-primary">{targetCount}</span>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold">New People</p>
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
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-16 text-xl rounded-2xl accent-glow group mt-8"
              >
                <Zap className="w-6 h-6 mr-3 fill-white group-hover:scale-110 transition-transform" />
                Find People
                <ArrowRight className="w-6 h-6 ml-auto opacity-50 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto space-y-12"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <Zap className="w-10 h-10 text-primary fill-primary animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
              <h2 className="text-4xl font-heading">Finding your people...</h2>
              <p className="text-muted-foreground">This normally takes 1-2 minutes depending on quantity</p>
            </div>

            <div className="space-y-8 bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl">
              <Progress value={progress} className="h-3" />
              
              <div className="space-y-6">
                {STEPS.map((step) => {
                  const state = stepStates[step.id];
                  return (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                        state?.status === 'done' ? 'bg-success/20 text-success' : 
                        currentStep === step.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 
                        'bg-secondary/50 text-muted-foreground'
                      }`}>
                        {state?.status === 'done' ? <Check className="w-5 h-5" /> : 
                         currentStep === step.id ? <div className="w-2 h-2 bg-white rounded-full animate-ping" /> : 
                         <span className="text-xs font-bold">{step.id}</span>}
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold transition-colors ${currentStep === step.id ? 'text-white' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {state && state.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 animate-in slide-in-from-left-2 fade-in">{state.message}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-error"
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
      className={`p-6 cursor-pointer transition-all duration-300 border-white/5 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${
        selected ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-surface hover:bg-white/5'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${selected ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-snug">{description}</p>
      {selected && (
        <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </Card>
  );
}


function NeedsCheckbox({ label, checked, onChange, icon }: any) {
  return (
    <div 
      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
        checked ? 'bg-primary/5 border-primary/50 text-white' : 'bg-surface border-white/5 text-muted-foreground hover:bg-white/5'
      }`}
      onClick={() => onChange(!checked)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span className="text-sm flex-1 font-medium">{label}</span>
      <div className="opacity-50">{icon}</div>
    </div>
  );
}
