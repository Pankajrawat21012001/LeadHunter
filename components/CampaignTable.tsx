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
    toast.success(`${label} copied!`, { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> });
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
      <div className="bg-white rounded-2xl border border-purple-100 border-dashed p-24 text-center shadow-sm">
        <Users className="w-12 h-12 text-purple-200 mx-auto mb-4" />
        <h3 className="text-xl font-heading text-muted-foreground/60 italic tracking-tighter">No contacts found in this view</h3>
        <p className="text-sm text-muted-foreground/40 mt-2 font-mono uppercase tracking-widest">Gravity has not pulled any results yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-purple-50/60">
          <TableRow className="hover:bg-transparent border-purple-100">
            <TableHead className="w-[300px] py-5 font-bold uppercase tracking-widest text-xs text-muted-foreground">Person</TableHead>
            <TableHead className="py-5 font-bold uppercase tracking-widest text-xs text-muted-foreground">Role & Company</TableHead>
            <TableHead className="py-5 font-bold uppercase tracking-widest text-xs text-center text-muted-foreground">LinkedIn</TableHead>
            <TableHead className="py-5 font-bold uppercase tracking-widest text-xs text-center text-muted-foreground">Email</TableHead>
            <TableHead className="py-5 font-bold uppercase tracking-widest text-xs text-muted-foreground">Status</TableHead>
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
                    className={`cursor-pointer transition-colors border-purple-100/70 ${isExpanded ? 'bg-primary/5' : 'hover:bg-purple-50/50'}`}
                    onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-primary font-bold text-sm">
                        {contact.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground mb-0.5 truncate">{contact.fullName}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">ID: {contact.id.split('_').pop()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <p className="font-medium text-sm text-foreground truncate max-w-[200px]">{contact.jobTitle}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">@{contact.company}</p>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <a 
                      href={contact.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex h-8 px-3 items-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 font-semibold text-xs border border-sky-200 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      LI PRO
                      <ExternalLink className="w-3 h-3 ml-1.5" />
                    </a>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    {contact.email ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">READY</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-purple-100">NONE</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <select 
                      value={contact.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateStatus(contact.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`bg-transparent border-0 font-semibold text-sm focus:ring-0 cursor-pointer uppercase tracking-wide ${
                        contact.status === 'replied' ? 'text-emerald-600' : 
                        contact.status === 'messaged' ? 'text-primary' :
                        contact.status === 'skip' ? 'text-red-500' : 'text-muted-foreground'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="messaged">Messaged</option>
                      <option value="replied">Replied</option>
                      <option value="converted">Converted</option>
                      <option value="skip">Skip</option>
                    </select>
                  </TableCell>
                  <TableCell className="py-4">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                  <TableRow className="border-purple-100 bg-purple-50/30">
                    <TableCell colSpan={6} className="p-0 border-t border-purple-100">
                      <div className="p-8 grid grid-cols-2 gap-8 animate-in slide-in-from-top-2">
                        {/* LinkedIn Column */}
                        <div className="space-y-4">
                           <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                              <div className="flex items-center gap-2.5">
                                 <div className="p-1.5 bg-sky-50 rounded-lg">
                                   <LinkedinIcon className="w-4 h-4 text-sky-600" />
                                 </div>
                                 <span className="font-semibold text-sm text-foreground">LinkedIn Connect</span>
                              </div>
                              <div className="flex gap-1.5">
                                <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => copyToClipboard(contact.linkedinMessage, "Message")}>
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => handleEdit(contact.id, 'li', contact.linkedinMessage)}>
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </Button>
                              </div>
                           </div>

                           <div className="relative group p-5 pb-12 bg-white rounded-xl border border-purple-100 shadow-sm min-h-[140px]">
                              {editingId === `${contact.id}_li` ? (
                                <div className="space-y-3">
                                  <textarea 
                                    className="w-full bg-purple-50 border border-primary/20 rounded-xl p-4 text-sm h-32 focus:ring-1 ring-primary text-foreground resize-none"
                                    value={tempMessage}
                                    onChange={(e) => setTempMessage(e.target.value)}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setEditingId(null)}>Cancel</Button>
                                    <Button size="sm" className="bg-primary text-white hover:bg-primary/90" onClick={() => saveEdit(contact.id, 'li')}>Save</Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed text-foreground/80 break-words whitespace-pre-wrap">
                                  {contact.linkedinMessage || "No message generated"}
                                </p>
                              )}
                           </div>
                           <p className="text-[10px] uppercase font-semibold text-muted-foreground flex justify-between px-1">
                             <span>Limit: 300 Chars</span>
                             <span className={(contact.linkedinMessage?.length || 0) > 300 ? 'text-red-500' : 'text-primary'}>
                               {contact.linkedinMessage?.length || 0}/300
                             </span>
                           </p>
                        </div>

                        {/* Email Column */}
                        <div className="space-y-4">
                           <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                              <div className="flex items-center gap-2.5">
                                 <div className="p-1.5 bg-purple-50 rounded-lg">
                                   <Mail className="w-4 h-4 text-primary" />
                                 </div>
                                 <span className="font-semibold text-sm text-foreground">Cold Email Pipeline</span>
                              </div>
                              <div className="flex gap-1.5">
                                {contact.email && (
                                  <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => copyToClipboard(contact.email, "Email Address")}>
                                    <Copy className="w-3 h-3" />
                                    {contact.email}
                                  </Button>
                                )}
                              </div>
                           </div>

                           {coldEmail ? (
                             <div className="space-y-3">
                               <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm flex justify-between items-center">
                                  <div>
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Subject</p>
                                    <p className="text-sm font-semibold text-foreground">{coldEmail.subject}</p>
                                  </div>
                                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => copyToClipboard(coldEmail.subject, "Subject")}>
                                    <Copy className="w-3 h-3" />
                                  </Button>
                               </div>

                               <div className="relative group p-5 pb-12 bg-white rounded-xl border border-purple-100 shadow-sm min-h-[140px]">
                                 {editingId === `${contact.id}_ce` ? (
                                    <div className="space-y-3">
                                      <textarea 
                                        className="w-full bg-purple-50 border border-primary/20 rounded-xl p-4 text-sm h-32 focus:ring-1 ring-primary text-foreground resize-none"
                                        value={tempMessage}
                                        onChange={(e) => setTempMessage(e.target.value)}
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setEditingId(null)}>Cancel</Button>
                                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90" onClick={() => saveEdit(contact.id, 'ce')}>Save</Button>
                                      </div>
                                    </div>
                                 ) : (
                                   <>
                                     <p className="text-sm leading-relaxed text-foreground/80 break-words whitespace-pre-wrap">
                                       {coldEmail.body}
                                     </p>
                                     <div className="absolute bottom-3 right-3 flex gap-2">
                                       <Button 
                                         size="sm" 
                                         variant="ghost" 
                                         className="h-8 gap-1.5 bg-purple-50 hover:bg-purple-100 text-primary text-xs border border-purple-200" 
                                         onClick={() => handleEdit(contact.id, 'ce', coldEmail.body)}
                                       >
                                         <Edit2 className="w-3 h-3" />
                                         Edit
                                       </Button>
                                       <Button 
                                         size="sm" 
                                         variant="ghost" 
                                         className="h-8 gap-1.5 bg-purple-50 hover:bg-purple-100 text-primary text-xs border border-purple-200" 
                                         onClick={() => copyToClipboard(coldEmail.body, "Email Body")}
                                       >
                                         <Copy className="w-3 h-3" />
                                         Copy Body
                                       </Button>
                                     </div>
                                   </>
                                 )}
                               </div>
                             </div>
                           ) : (
                             <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl border border-dashed border-purple-200 text-muted-foreground">
                               <Mail className="w-8 h-8 mb-2 text-purple-200" />
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
