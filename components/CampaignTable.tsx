'use client';

import React, { useState } from 'react';
import { Contact } from '@/lib/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
    ExternalLink, 
    Copy, 
    Check, 
    ChevronDown, 
    ChevronUp, 
    Mail, 
    Linkedin as LinkedinIcon,
    User,
    Users,
    Edit2,
    CheckCircle2,
    XCircle,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function CampaignTable({ contacts: initialContacts }: { contacts: Contact[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempMessage, setTempMessage] = useState("");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, { icon: <CheckCircle2 className="w-4 h-4 text-success" /> });
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const resp = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (resp.ok) {
        setContacts(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
        toast.message(`Status updated to ${newStatus}`);
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleEdit = (id: string, type: 'li' | 'ce', content: string) => {
    setEditingId(`${id}_${type}`);
    setTempMessage(content);
  };

  const saveEdit = async (id: string, type: 'li' | 'ce') => {
    let finalValue = tempMessage;
    
    setContacts(prev => prev.map(c => {
      if (c.id === id) {
        if (type === 'li') return { ...c, linkedinMessage: tempMessage };
        if (type === 'ce') {
           const parsed = JSON.parse(c.coldEmail || '{}');
           parsed.body = tempMessage;
           const stringified = JSON.stringify(parsed);
           finalValue = stringified;
           return { ...c, coldEmail: stringified };
        }
      }
      return c;
    }));

    try {
        await fetch('/api/contacts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id, 
                field: type === 'li' ? 'linkedinMessage' : 'coldEmail',
                value: finalValue 
            })
        });
        toast.success("Message saved permanently");
    } catch (e) {
        toast.error("Failed to save to server");
    }
    
    setEditingId(null);
  };

  if (contacts.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-dashed border-white/10 p-24 text-center">
        <Users className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
        <h3 className="text-xl font-heading text-muted-foreground/40 italic tracking-tighter">No contacts found in this view</h3>
        <p className="text-sm text-muted-foreground/30 mt-2 font-mono uppercase tracking-widest">Gravity has not pulled any results yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-secondary/20">
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="w-[300px] py-6 font-bold uppercase tracking-widest text-xs">Person</TableHead>
            <TableHead className="py-6 font-bold uppercase tracking-widest text-xs">Role & Company</TableHead>
            <TableHead className="py-6 font-bold uppercase tracking-widest text-xs text-center">LinkedIn</TableHead>
            <TableHead className="py-6 font-bold uppercase tracking-widest text-xs text-center">Email</TableHead>
            <TableHead className="py-6 font-bold uppercase tracking-widest text-xs">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const isExpanded = expandedId === contact.id;
            const coldEmail = contact.coldEmail ? JSON.parse(contact.coldEmail) : null;

            return (
              <React.Fragment key={contact.id}>
                <TableRow 
                    className={`cursor-pointer transition-colors border-white/5 ${isExpanded ? 'bg-primary/5' : 'hover:bg-white/5'}`}
                    onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                >
                  <TableCell className="py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
                        {contact.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white mb-0.5">{contact.fullName}</p>
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-tighter">ID: {contact.id.split('_').pop()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <p className="font-medium text-sm text-white">{contact.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">@{contact.company}</p>
                  </TableCell>
                  <TableCell className="py-5 text-center">
                    <a 
                      href={contact.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex h-8 px-3 items-center rounded-lg bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5]/20 font-bold text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      LI PRO
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </TableCell>
                  <TableCell className="py-5 text-center">
                    {contact.email ? (
                      <Badge className="bg-success text-white">READY</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-white/5">NONE</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-5">
                    <select 
                      value={contact.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateStatus(contact.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`bg-transparent border-0 font-bold text-sm focus:ring-0 cursor-pointer uppercase tracking-widest ${
                        contact.status === 'replied' ? 'text-success' : 
                        contact.status === 'messaged' ? 'text-primary' :
                        contact.status === 'skip' ? 'text-error' : 'text-muted-foreground'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="messaged">Messaged</option>
                      <option value="replied">Replied</option>
                      <option value="converted">Converted</option>
                      <option value="skip">Skip</option>
                    </select>
                  </TableCell>
                  <TableCell className="py-5">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                  <TableRow className="border-white/5 bg-primary/5">
                    <TableCell colSpan={6} className="p-0 border-t-0">
                      <div className="p-8 grid grid-cols-2 gap-8 animate-in slide-in-from-top-2">
                        {/* LinkedIn Column */}
                        <div className="space-y-6">
                           <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-xl border border-white/5">
                              <div className="flex items-center gap-3">
                                 <LinkedinIcon className="w-5 h-5 text-[#0077b5]" />
                                 <span className="font-heading tracking-tight">LinkedIn Connect</span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-8 gap-2 text-xs" onClick={() => copyToClipboard(contact.linkedinMessage, "Message")}>
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 gap-2 text-xs" onClick={() => handleEdit(contact.id, 'li', contact.linkedinMessage)}>
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </Button>
                              </div>
                           </div>

                           <div className="relative group p-6 bg-surface rounded-2xl border border-white/5 shadow-inner min-h-[140px]">
                              {editingId === `${contact.id}_li` ? (
                                <div className="space-y-4">
                                  <textarea 
                                    className="w-full bg-secondary p-4 rounded-xl border border-primary/20 text-sm h-32 focus:ring-1 ring-primary"
                                    value={tempMessage}
                                    onChange={(e) => setTempMessage(e.target.value)}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                    <Button size="sm" onClick={() => saveEdit(contact.id, 'li')}>Save</Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed text-slate-300">
                                  {contact.linkedinMessage || "No message generated"}
                                </p>
                              )}
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Info className="w-4 h-4 text-muted-foreground" />
                              </div>
                           </div>
                           <p className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                             <span>Limit: 300 Chars</span>
                             <span className={(contact.linkedinMessage?.length || 0) > 300 ? 'text-error' : ''}>
                               {contact.linkedinMessage?.length || 0}/300
                             </span>
                           </p>
                        </div>

                        {/* Email Column */}
                        <div className="space-y-6">
                           <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-xl border border-white/5">
                              <div className="flex items-center gap-3">
                                 <Mail className="w-5 h-5 text-primary" />
                                 <span className="font-heading tracking-tight">Cold Email Pipeline</span>
                              </div>
                              <div className="flex gap-2">
                                {contact.email && (
                                  <Button size="sm" variant="ghost" className="h-8 gap-2 text-xs" onClick={() => copyToClipboard(contact.email, "Email Address")}>
                                    <Copy className="w-3 h-3" />
                                    {contact.email}
                                  </Button>
                                )}
                              </div>
                           </div>

                           {coldEmail ? (
                             <div className="space-y-4">
                               <div className="p-4 bg-surface rounded-xl border border-white/5 flex justify-between items-center">
                                  <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Subject</p>
                                    <p className="text-sm font-bold text-white">{coldEmail.subject}</p>
                                  </div>
                                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(coldEmail.subject, "Subject")}>
                                    <Copy className="w-3 h-3" />
                                  </Button>
                               </div>

                               <div className="relative group p-6 bg-surface rounded-2xl border border-white/5 shadow-inner min-h-[140px]">
                                 {editingId === `${contact.id}_ce` ? (
                                    <div className="space-y-4">
                                      <textarea 
                                        className="w-full bg-secondary p-4 rounded-xl border border-primary/20 text-sm h-32 focus:ring-1 ring-primary"
                                        value={tempMessage}
                                        onChange={(e) => setTempMessage(e.target.value)}
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                        <Button size="sm" onClick={() => saveEdit(contact.id, 'ce')}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm leading-relaxed text-slate-300">
                                        {coldEmail.body}
                                      </p>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="absolute bottom-4 right-4 h-8 gap-2 bg-secondary hover:bg-white/10" 
                                        onClick={() => copyToClipboard(coldEmail.body, "Email Body")}
                                      >
                                        <Copy className="w-3 h-3" />
                                        Copy Body
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="absolute bottom-4 right-32 h-8 gap-2 bg-secondary hover:bg-white/10" 
                                        onClick={() => handleEdit(contact.id, 'ce', coldEmail.body)}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        Edit
                                      </Button>
                                    </>
                                  )}
                               </div>
                             </div>
                           ) : (
                             <div className="flex flex-col items-center justify-center h-48 bg-surface rounded-2xl border border-dashed border-white/10 text-muted-foreground">
                               <Mail className="w-8 h-8 mb-2 opacity-20" />
                               <p className="text-sm">Email template not requested or email not found</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
