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
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async update(data: UpdateTSPIDData): Promise<TSPID> {
        const response = await fetch(`${API_BASE_URL}/update/${encodeURIComponent(data.id)}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async delete(id: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/delete/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async get(id: string): Promise<TSPID> {
        const response = await fetch(`${API_BASE_URL}/get/${encodeURIComponent(id)}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async list(limit: number = 100, offset: number = 0): Promise<TSPID[]> {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString()
        });
        
        const response = await fetch(`${API_BASE_URL}/list?${params}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
}

export const tspidService = new TSPIDService(); 