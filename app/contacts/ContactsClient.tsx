'use client';

import { useState, useMemo } from 'react';
import { Contact } from "@/lib/types";
import CampaignTable from "@/components/CampaignTable";
import { Users, Download, Search, X, Filter } from "lucide-react";
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
        (c.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.jobTitle || '').toLowerCase().includes(search.toLowerCase());
      const matchUseCase = filterUseCase === 'all' || c.useCase === filterUseCase;
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchSearch && matchUseCase && matchStatus;
    });
  }, [initialContacts, search, filterUseCase, filterStatus]);

  return (
    <div className="py-10 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/15 shadow-sm">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-heading tracking-tight text-foreground">All Contacts</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="text-primary font-bold">{filteredContacts.length}</span>
                {filteredContacts.length !== initialContacts.length
                  ? ` filtered (from ${initialContacts.length} total)`
                  : ' people discovered across all campaigns'}
              </p>
            </div>
          </div>
        </div>

        <Link href="/api/export">
          <Button variant="outline" className="h-11 px-5 rounded-xl border-purple-200 bg-white hover:bg-purple-50 hover:border-primary/30 gap-2 font-semibold text-xs uppercase tracking-widest text-foreground shadow-sm">
            <Download className="w-4 h-4 text-primary" />
            Export CSV
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4">
        <div className="flex gap-3 items-center bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, or role..."
              className="w-full h-10 bg-purple-50/60 border border-purple-100 rounded-xl pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Button
            variant={showFilters ? "default" : "outline"}
            className={`h-10 px-4 rounded-xl gap-2 text-xs font-semibold uppercase tracking-widest transition-all ${showFilters ? 'bg-primary text-white' : 'border-purple-200 bg-white hover:bg-purple-50 text-foreground'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>

          <Badge className="h-10 px-4 bg-primary/10 text-primary border border-primary/20 font-semibold text-xs rounded-xl">
            {filteredContacts.length} Shown
          </Badge>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Goal / Use Case</label>
              <select
                value={filterUseCase}
                onChange={e => setFilterUseCase(e.target.value)}
                className="w-full h-10 bg-white border border-purple-200 rounded-xl px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="all">All Goals</option>
                <option value="job">Get a Job</option>
                <option value="customer">Sell Product</option>
                <option value="connection">Networking</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Pipeline Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full h-10 bg-white border border-purple-200 rounded-xl px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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

      {/* Table */}
      {filteredContacts.length > 0 ? (
        <CampaignTable contacts={filteredContacts} />
      ) : (
        <div className="bg-white border border-dashed border-purple-200 rounded-2xl p-24 text-center shadow-sm">
          <Search className="w-12 h-12 text-purple-200 mx-auto mb-4" />
          <h3 className="text-xl font-heading text-muted-foreground/60 italic tracking-tighter">No matches found</h3>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
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
