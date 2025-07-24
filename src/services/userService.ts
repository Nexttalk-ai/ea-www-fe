const API_BASE_URL = 'https://282x80mwdj.execute-api.us-west-2.amazonaws.com/dev/user';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    organizations: string[];
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    version: number;
}

export interface CreateUserData {
    name: string;
    email: string;
    role: string;
    organizations?: string[];
}

export interface UpdateUserData {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    organizations?: string[];
}

class UserService {
    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('ID_TOKEN')}`
        };
    }

    async create(data: CreateUserData): Promise<User> {
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

    async update(data: UpdateUserData): Promise<User> {
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

    async get(id: string): Promise<User> {
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

    async list(): Promise<User[]> {
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

export const userService = new UserService(); 