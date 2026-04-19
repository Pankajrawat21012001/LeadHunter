import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { Contact, Campaign } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.csv');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.csv');

// Ensure /data directory exists
export const ensureDataDir = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
};

// Read all contacts
export const readContacts = (): Contact[] => {
    ensureDataDir();
    if (!fs.existsSync(CONTACTS_FILE)) return [];
    try {
        const content = fs.readFileSync(CONTACTS_FILE, 'utf-8');
        if (!content) return [];
        const result = Papa.parse(content, { header: true, skipEmptyLines: true });
        return result.data as Contact[];
    } catch (error) {
        console.error('Error reading contacts CSV:', error);
        return [];
    }
};

// Append new contacts
export const appendContacts = (newContacts: Contact[]): void => {
    ensureDataDir();
    const existing = readContacts();
    const existingUrls = new Set(existing.map(c => c.linkedinUrl).filter(Boolean));
    const deduped = newContacts.filter(c => !existingUrls.has(c.linkedinUrl));
    const allContacts = [...existing, ...deduped];
    const csv = Papa.unparse(allContacts);
    fs.writeFileSync(CONTACTS_FILE, csv);
};

// Update contact status
export const updateContactStatus = (id: string, status: string): void => {
    ensureDataDir();
    const contacts = readContacts();
    const updated = contacts.map(c => c.id === id ? { ...c, status: status as any } : c);
    fs.writeFileSync(CONTACTS_FILE, Papa.unparse(updated));
};

// Update contact field (generic)
export const updateContact = (id: string, field: string, value: any): void => {
    ensureDataDir();
    const contacts = readContacts();
    const updated = contacts.map(c => c.id === id ? { ...c, [field]: value } : c);
    fs.writeFileSync(CONTACTS_FILE, Papa.unparse(updated));
};

// Read all campaigns
export const readCampaigns = (): Campaign[] => {
    ensureDataDir();
    if (!fs.existsSync(CAMPAIGNS_FILE)) return [];
    try {
        const content = fs.readFileSync(CAMPAIGNS_FILE, 'utf-8');
        if (!content) return [];
        const result = Papa.parse(content, { header: true, skipEmptyLines: true });
        return result.data as Campaign[];
    } catch (error) {
        console.error('Error reading campaigns CSV:', error);
        return [];
    }
};

// Save many campaigns (overwrite)
export const overwriteCampaigns = (campaigns: Campaign[]): void => {
    ensureDataDir();
    const csv = Papa.unparse(campaigns);
    fs.writeFileSync(CAMPAIGNS_FILE, csv);
};

// Save a single campaign (append or update)
export const saveCampaign = (campaign: Campaign): void => {
    ensureDataDir();
    const existing = readCampaigns();
    const index = existing.findIndex(c => c.id === campaign.id);
    let updated;
    if (index >= 0) {
        updated = [...existing];
        updated[index] = campaign;
    } else {
        updated = [...existing, campaign];
    }
    overwriteCampaigns(updated);
};

// Get existing LinkedIn URLs
export const getExistingUrls = (): Set<string> => {
    const contacts = readContacts();
    return new Set(contacts.map(c => c.linkedinUrl).filter(Boolean));
};

// Count total contacts
export const getContactCount = (): number => readContacts().length;
