import { TSPID } from '../types/types';

export interface CreateTSPIDData {
    tspid_value: string;
    content?: any;
}

export interface UpdateTSPIDData {
    id: string;
    tspid_value?: string;
    content?: any;
}

class TSPIDService {
    private getStorageKey() {
        return 'tspid_data';
    }

    private getStoredTSPIDs(): TSPID[] {
        const stored = localStorage.getItem(this.getStorageKey());
        return stored ? JSON.parse(stored) : [];
    }

    private setStoredTSPIDs(tspids: TSPID[]) {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(tspids));
    }

    async create(data: CreateTSPIDData): Promise<TSPID> {
        const tspids = this.getStoredTSPIDs();
        const newTSPID: TSPID = {
            id: Date.now().toString(),
            tspid_value: data.tspid_value,
            enabled: true,
            generationMethod: 'manual',
            expiryDays: 30,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            version: 1,
            content: data.content || {}
        };
        
        tspids.push(newTSPID);
        this.setStoredTSPIDs(tspids);
        return newTSPID;
    }

    async update(data: UpdateTSPIDData): Promise<TSPID> {
        const tspids = this.getStoredTSPIDs();
        const index = tspids.findIndex(t => t.id === data.id);
        
        if (index === -1) {
            throw new Error('TSPID not found');
        }

        const updatedTSPID: TSPID = {
            ...tspids[index],
            ...data,
            updated_at: new Date().toISOString(),
            version: tspids[index].version + 1
        };

        tspids[index] = updatedTSPID;
        this.setStoredTSPIDs(tspids);
        return updatedTSPID;
    }

    async delete(id: string): Promise<{ status: string; id: string }> {
        const tspids = this.getStoredTSPIDs();
        const index = tspids.findIndex(t => t.id === id);
        
        if (index === -1) {
            throw new Error('TSPID not found');
        }

        tspids.splice(index, 1);
        this.setStoredTSPIDs(tspids);
        
        return { status: 'success', id };
    }

    async get(id: string): Promise<TSPID> {
        const tspids = this.getStoredTSPIDs();
        const tspid = tspids.find(t => t.id === id);
        
        if (!tspid) {
            throw new Error('TSPID not found');
        }
        
        return tspid;
    }

    async list(): Promise<TSPID[]> {
        return this.getStoredTSPIDs();
    }
}

export const tspidService = new TSPIDService(); 