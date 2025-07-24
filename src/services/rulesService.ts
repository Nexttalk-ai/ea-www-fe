const API_BASE_URL = 'https://282x80mwdj.execute-api.us-west-2.amazonaws.com/dev/rule';

export interface Rule {
    id: string;
    name: string;
    s3_key: string;
    content: Record<string, any>;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    version: number;
}

export interface CreateRuleData {
    name: string;
    s3_key: string;
    content: Record<string, any>;
}

export interface UpdateRuleData {
    id: string;
    name?: string;
    s3_key?: string;
    content?: Record<string, any>;
}

class RulesService {
    private rulesCache: Rule[] = [];

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

    async create(data: CreateRuleData): Promise<Rule> {
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

    async update(data: UpdateRuleData): Promise<Rule> {
        const response = await fetch(`${API_BASE_URL}/update`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({
                action: 'update',
                data: data
            }),
        });
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message || errorData.error) {
                    errorMessage = errorData.message || errorData.error;
                }
            } catch (e) {
                // If JSON parsing fails, use the default message
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Update cache with the new rule data
        const ruleIndex = this.rulesCache.findIndex(rule => rule.id === data.id);
        if (ruleIndex !== -1) {
            this.rulesCache[ruleIndex] = result;
        }
        
        return result;
    }

    async delete(id: string): Promise<{ status: string; id: string }> {
        const response = await fetch(`${API_BASE_URL}/delete`, {
            method: 'DELETE',
            headers: this.getHeaders(),
            body: JSON.stringify({
                action: 'delete',
                data: { id }
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async get(id: string): Promise<Rule> {
        // Try to get the rule from cache first to get the s3_key
        let cachedRule = this.rulesCache.find(rule => rule.id === id);
        
        // If not in cache, try to fetch list to populate cache
        if (!cachedRule && this.rulesCache.length === 0) {
            try {
                const rules = await this.list();
                this.rulesCache = rules;
                cachedRule = this.rulesCache.find(rule => rule.id === id);
            } catch (e) {
                // Continue with the original request if list fails
            }
        }
        
        const headers = this.getHeaders();
        
        // If we found the rule in cache, include the s3_key to work around backend bug
        const requestBody = cachedRule ? {
            action: 'get',
            data: { 
                id,
                s3_key: cachedRule.s3_key  // Add s3_key to work around backend bug
            }
        } : {
            action: 'get',
            data: { id }
        };
        
        const response = await fetch(`${API_BASE_URL}/get`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message || errorData.error) {
                    errorMessage = errorData.message || errorData.error;
                }
            } catch (e) {
                // If JSON parsing fails, use the default message
            }
            
            // If the backend failed and we have cached data, return the cached rule
            if (cachedRule) {
                return {
                    ...cachedRule,
                    content: cachedRule.content || {}
                };
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Ensure content exists, even if it's empty
        if (!result.content) {
            result.content = {};
        }
        
        return result;
    }

    async list(): Promise<Rule[]> {
        const headers = this.getHeaders();
        
        const requestBody = {
            action: 'list'
        };
        
        const response = await fetch(`${API_BASE_URL}/list`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message || errorData.error) {
                    errorMessage = errorData.message || errorData.error;
                }
            } catch (e) {
                // If JSON parsing fails, use the default message
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Ensure each rule has content, even if it's empty
        if (Array.isArray(result)) {
            const rules = result.map(rule => ({
                ...rule,
                content: rule.content || {}
            }));
            
            // Update cache
            this.rulesCache = rules;
            
            return rules;
        }
        
        return result;
    }
}

export const rulesService = new RulesService();
