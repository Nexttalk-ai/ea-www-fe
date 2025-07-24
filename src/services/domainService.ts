import { Domain } from '../types/types';

export interface CreateDomainData {
    name: string;
    address: string;
    status: 'active' | 'inactive';
}

export interface UpdateDomainData {
    id: string;
    name?: string;
    address?: string;
    status?: 'active' | 'inactive';
}

class DomainService {
    private getStorageKey() {
        return 'domains_data';
    }

    private getStoredDomains(): Domain[] {
        const stored = localStorage.getItem(this.getStorageKey());
        return stored ? JSON.parse(stored) : [];
    }

    private setStoredDomains(domains: Domain[]) {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(domains));
    }

    async create(data: CreateDomainData): Promise<Domain> {
        const domains = this.getStoredDomains();
        const newDomain: Domain = {
            id: Date.now().toString(),
            name: data.name,
            address: data.address,
            status: data.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            version: 1
        };
        
        domains.push(newDomain);
        this.setStoredDomains(domains);
        return newDomain;
    }

    async update(data: UpdateDomainData): Promise<Domain> {
        const domains = this.getStoredDomains();
        const index = domains.findIndex(d => d.id === data.id);
        
        if (index === -1) {
            throw new Error('Domain not found');
        }

        const updatedDomain: Domain = {
            ...domains[index],
            ...data,
            updated_at: new Date().toISOString(),
            version: domains[index].version + 1
        };

        domains[index] = updatedDomain;
        this.setStoredDomains(domains);
        return updatedDomain;
    }

    async delete(id: string): Promise<{ status: string; id: string }> {
        const domains = this.getStoredDomains();
        const index = domains.findIndex(d => d.id === id);
        
        if (index === -1) {
            throw new Error('Domain not found');
        }

        domains.splice(index, 1);
        this.setStoredDomains(domains);
        
        return { status: 'success', id };
    }

    async get(id: string): Promise<Domain> {
        const domains = this.getStoredDomains();
        const domain = domains.find(d => d.id === id);
        
        if (!domain) {
            throw new Error('Domain not found');
        }
        
        return domain;
    }

    async list(): Promise<Domain[]> {
        return this.getStoredDomains();
    }
}

export const domainService = new DomainService(); 