import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl('/organization');

export interface Organization {
    id: string;
    name: string;
    slug: string | null;
    users: string[] | number; // Array for get operations, number for list operations
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    version: number;
}

export interface CreateOrganizationData {
    name: string;
    slug?: string;
    users?: string[];
}

export interface UpdateOrganizationData {
    id: string;
    name?: string;
    slug?: string;
    users?: string[];
}

class OrganizationService {
    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('ID_TOKEN')}`
        };
    }

    async create(data: CreateOrganizationData): Promise<Organization> {
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

    async update(data: UpdateOrganizationData): Promise<Organization> {
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

    async get(id: string): Promise<Organization> {
        // First, get the organization details
        const orgResponse = await fetch(`${API_BASE_URL}/get/${encodeURIComponent(id)}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!orgResponse.ok) {
            throw new Error(`HTTP error! status: ${orgResponse.status}`);
        }
        const organization = await orgResponse.json();

        // Then, get all users to find which ones belong to this organization
        const usersResponse = await fetch(getApiUrl('/user/list'), {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!usersResponse.ok) {
            throw new Error(`HTTP error! status: ${usersResponse.status}`);
        }
        const users = await usersResponse.json();

        // Filter users that belong to this organization
        // Note: The user service returns organization names in the organizations array,
        // so we need to filter by organization name, not ID
        const organizationUsers = users
            .filter((user: any) => user.organizations && user.organizations.includes(organization.name))
            .map((user: any) => user.id);

        // Return the organization with the users array populated
        return {
            ...organization,
            users: organizationUsers
        };
    }

    async list(limit: number = 100, offset: number = 0): Promise<Organization[]> {
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

export const organizationService = new OrganizationService(); 