import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('');

export interface Metric {
    id: string;
    name: string;
    description: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    version: number;
}

class MetricsService {
    private getHeaders() {
        const token = sessionStorage.getItem('ID_TOKEN');
        if (!token) {
            throw new Error('Authentication token not found. Please log in again.');
        }
        
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async listMetrics(): Promise<Metric[]> {
        const response = await fetch(`${API_BASE_URL}/metric/list?type=metrics`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }
}

export const metricsService = new MetricsService();

 