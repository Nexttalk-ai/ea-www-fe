import { Domain } from '../types/types';
import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('/domain');

export interface CreateDomainData {
    name: string;
    domain_url: string;
    status: 'ENABLED' | 'DISABLED';
}

export interface UpdateDomainData {
    id: string;
    name?: string;
    domain_url?: string;
    status?: 'ENABLED' | 'DISABLED';
}

class DomainService {
    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('ID_TOKEN')}`
        };
    }

    async create(data: CreateDomainData): Promise<Domain> {
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

    async update(data: UpdateDomainData): Promise<Domain> {
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

    async get(id: string): Promise<Domain> {
        const response = await fetch(`${API_BASE_URL}/get/${encodeURIComponent(id)}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async list(limit: number = 100, offset: number = 0): Promise<Domain[]> {
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

export const domainService = new DomainService(); 