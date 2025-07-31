import { TSPID } from '../types/types';
import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('/tspid');

export interface CreateTSPIDData {
    id: string;
    organization_id: string;
    revshare_coefficient?: number;
    status?: 'ENABLED' | 'DISABLED';
}

export interface UpdateTSPIDData {
    id: string;
    organization_id?: string;
    revshare_coefficient?: number;
    status?: 'ENABLED' | 'DISABLED';
}

class TSPIDService {
    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('ID_TOKEN')}`
        };
    }

    async create(data: CreateTSPIDData): Promise<TSPID> {
        const response = await fetch(`${API_BASE_URL}/create`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                action: 'create',
                data: data
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async update(data: UpdateTSPIDData): Promise<TSPID> {
        const response = await fetch(`${API_BASE_URL}/update`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({
                action: 'update',
                data: data
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async delete(id: string): Promise<{ status: string; id: string }> {
        const response = await fetch(`${API_BASE_URL}/delete`, {
            method: 'DELETE',
            headers: this.getHeaders(),
            body: JSON.stringify({
                action: 'delete',
                data: {
                    id: id
                }
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async get(id: string): Promise<TSPID> {
        const response = await fetch(`${API_BASE_URL}/get?id=${encodeURIComponent(id)}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                action: 'get',
                data: { id }
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async list(): Promise<TSPID[]> {
        const response = await fetch(`${API_BASE_URL}/list`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                action: 'list'
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
}

export const tspidService = new TSPIDService(); 