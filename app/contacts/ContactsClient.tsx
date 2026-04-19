'use client';

import { useState, useMemo } from 'react';
import { Contact } from "@/lib/types";
import CampaignTable from "@/components/CampaignTable";
import { Users, Download, Search, Filter, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ContactsClient({ initialContacts }: { initialContacts: Contact[] }) {
  const [search, setSearch] = useState('');
  const [filterUseCase, setFilterUseCase] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredContacts = useMemo(() => {
    return initialContacts.filter(c => {
      const matchSearch = !search || 
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.jobTitle.toLowerCase().includes(search.toLowerCase());
      
      const matchUseCase = filterUseCase === 'all' || c.useCase === filterUseCase;
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      
      return matchSearch && matchUseCase && matchStatus;
    });
  }, [initialContacts, search, filterUseCase, filterStatus]);

  return (
    <div className="py-12 space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary rounded-2xl border border-white/5">
                <Users className="w-8 h-8 text-primary shadow-lg shadow-primary/10" />
              </div>
              <h1 className="text-5xl font-heading tracking-tight">All Contacts</h1>
          </div>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="text-white font-bold">{filteredContacts.length}</span> 
            {filteredContacts.length !== initialContacts.length ? ` filtered (from ${initialContacts.length})` : ' people discovered across all campaigns'}
          </p>
        </div>

        <div className="flex gap-4">
            <Link href="/api/export">
                <Button variant="outline" className="h-12 px-6 rounded-xl bg-surface border-white/5 gap-2 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]">
                <Download className="w-4 h-4" />
                Export CSV
                </Button>
            </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-6">
        <div className="flex gap-4 items-center bg-surface/50 p-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, company, or role..." 
                    className="w-full h-12 bg-secondary/50 rounded-xl pl-12 pr-4 text-sm border-0 focus:ring-1 ring-primary transition-all shadow-inner text-white font-sans"
                />
                {search && (
                    <button 
                        onClick={() => setSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            <div className="flex gap-2">
                <Button 
                    variant={showFilters ? "secondary" : "ghost"} 
                    className={`h-12 px-4 rounded-xl gap-2 hover:bg-white/5 ${showFilters ? 'bg-primary/20 text-primary' : 'bg-secondary/30'}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Filter</span>
                </Button>
                <Badge variant="outline" className="h-12 border-white/5 bg-secondary px-6 text-white text-[10px] font-bold uppercase tracking-widest shadow-inner">
                    {filteredContacts.length} Shown
                </Badge>
            </div>
        </div>

        {showFilters && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-2">Goal / Use Case</label>
                    <select 
                        value={filterUseCase}
                        onChange={(e) => setFilterUseCase(e.target.value)}
                        className="w-full h-12 bg-surface/50 rounded-xl px-4 text-sm border-0 focus:ring-1 ring-primary text-white font-sans"
                    >
                        <option value="all">All Goals</option>
                        <option value="job">Job Hunt</option>
                        <option value="customer">Sell Product</option>
                        <option value="connection">Networking</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-2">Pipeline Status</label>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full h-12 bg-surface/50 rounded-xl px-4 text-sm border-0 focus:ring-1 ring-primary text-white font-sans"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="messaged">Messaged</option>
                        <option value="replied">Replied</option>
                        <option value="converted">Converted</option>
                        <option value="skip">Skip</option>
                    </select>
                </div>
            </div>
        )}
      </div>

      {filteredContacts.length > 0 ? (
        <CampaignTable contacts={filteredContacts} />
      ) : (
        <div className="bg-surface rounded-2xl border border-dashed border-white/10 p-24 text-center">
            <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-heading text-white">No matches found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
            <Button 
                variant="link" 
                className="mt-4 text-primary"
                onClick={() => { setSearch(''); setFilterUseCase('all'); setFilterStatus('all'); }}
            >
                Clear all filters
            </Button>
        </div>
      )}
    </div>
  );
}
