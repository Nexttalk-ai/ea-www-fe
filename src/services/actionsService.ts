const API_BASE_URL = 'https://282x80mwdj.execute-api.us-west-2.amazonaws.com/dev';

export interface Action {
    id: string;
    name: string;
    platform: string;
    status: string;
    created_at: string;
    updated_at: string;
    version: number;
}

export interface ActionValue {
    id: string;
    action_id: string;
    value: string;
    formula: string;
    status: string;
    created_at: string;
    updated_at: string;
    version: number;
    action_name: string;
    platform: string;
}

export interface ActionFormula {
    id: string;
    name: string;
    formula: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
    version: number;
}

class ActionsService {
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

    async listActions(): Promise<Action[]> {
        const response = await fetch(`${API_BASE_URL}/action/list?type=actions`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }

    async listActionValues(): Promise<ActionValue[]> {
        const response = await fetch(`${API_BASE_URL}/action-value/list?type=action_values`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }

    async listActionFormulas(): Promise<ActionFormula[]> {
        const response = await fetch(`${API_BASE_URL}/action/list?type=action_formulas`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }

    getActionValues(actionName: string, actionValues: ActionValue[]): ActionValue[] {
        return actionValues.filter(value => value.action_name === actionName);
    }
}

export const actionsService = new ActionsService(); 