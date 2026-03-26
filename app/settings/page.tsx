import { Settings, CheckCircle2, XCircle, Info, Key, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const keys = [
    { name: "GROQ_API_KEY", status: process.env.GROQ_API_KEY ? "active" : "missing", platform: "Groq", description: "Used for AI text generation & profile extraction" },
    { name: "SERPER_API_KEY", status: process.env.SERPER_API_KEY ? "active" : "missing", platform: "Serper.dev", description: "Used for Google search to find LinkedIn profiles" },
  ];

  return (
    <div className="py-12 space-y-12 max-w-4xl">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-5xl font-heading tracking-tight flex items-center gap-4">
          <Settings className="w-10 h-10 text-primary" />
          System Settings
        </h1>
        <p className="text-muted-foreground font-medium">Configure your external API connections</p>
      </div>

      <div className="bg-surface rounded-2xl border border-white/5 p-8 shadow-2xl space-y-8">
        <div className="flex gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <Info className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="text-sm">
                <p className="font-bold text-white mb-1 uppercase tracking-widest text-[10px]">Security Note</p>
                <p className="text-muted-foreground">API keys are loaded from <code className="text-primary px-1 bg-white/5 rounded">.env.local</code> on your local machine. This ensures your keys never leave your server and stay secure.</p>
            </div>
        </div>

        <div className="grid gap-6">
            {keys.map((key) => (
                <div key={key.name} className="flex items-center justify-between p-6 rounded-2xl bg-secondary/30 border border-white/5 hover:border-primary/20 transition-all group shadow-inner">
                    <div className="flex gap-6 items-center">
                        <div className={`p-4 rounded-xl ${key.status === 'active' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            <Key className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-lg">{key.platform}</h4>
                                <Badge variant="outline" className={`font-mono text-[10px] ${key.status === 'active' ? 'border-success/20 text-success' : 'border-error/20 text-error'}`}>
                                    {key.status === 'active' ? 'CONNECTED' : 'NOT FOUND'}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{key.description}</p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground/50 mt-2 tracking-widest">Environment Variable: <span className="text-white/60">{key.name}</span></p>
                        </div>
                    </div>

                    {key.status === 'active' ? (
                        <CheckCircle2 className="w-8 h-8 text-success group-hover:scale-110 transition-transform" />
                    ) : (
                        <AlertTriangle className="w-8 h-8 text-error group-hover:animate-bounce transition-transform" />
                    )}
                </div>
            ))}
        </div>

        <div className="p-8 border-t border-white/5 text-center mt-8">
            <h3 className="font-heading mb-4 text-xl">Missing a key?</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
                Go to the root folder and edit <code className="text-primary px-1 bg-white/5 rounded">.env.local</code> with your API keys. Restart the server once updated.
            </p>
            <div className="grid grid-cols-2 gap-4">
               <a href="https://console.groq.com/keys" target="_blank" className="p-4 bg-surface rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest text-center">Get Groq Key</a>
               <a href="https://serper.dev/api-key" target="_blank" className="p-4 bg-surface rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest text-center">Get Serper Key</a>
            </div>
        </div>
      </div>
    </div>
  );
}
