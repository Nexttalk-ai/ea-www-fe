import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../layouts/HomeLayout';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { FaPlus, FaTrash } from 'react-icons/fa';
import DraggableConditions from '../components/ui/DraggableConditions';
import ScheduleSelector from '../components/ui/ScheduleSelector';
import ReactJson from 'react-json-view';
import { v4 as uuidv4 } from 'uuid';
import { rulesService } from '../services/rulesService';
import { actionsService, Action as ApiAction, ActionValue } from '../services/actionsService';
import { metricsService, Metric } from '../services/metricsService';
import MetricSelect from '../components/ui/MetricSelect';
import ActionFormulaSelector from '../components/ui/ActionFormulaSelector';

// Mock data for operators
const operators = [
    { value: 'AND', label: 'AND' },
    { value: 'OR', label: 'OR' },
];

// Mock data for comparison operators
const comparisonOperators = [
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '>=', label: '>=' },
    { value: '<=', label: '<=' },
    { value: '==', label: '==' },
    { value: '!=', label: '!=' },
];

interface Condition {
    id: string;
    name: string;
    operator: string;
    value: string;
    groupOperator?: 'AND' | 'OR';
}

interface Action {
    name: string;
    value: string;
    formula: string;
}

interface Schedule {
    timing: 'daily' | 'hourly';
    unit: 'minute' | 'hour';
    value: number;
    priority?: number;
}

const AddRule: React.FC = () => {
    const navigate = useNavigate();
    const [ruleName, setRuleName] = useState('');
    const [selectedOperator, setSelectedOperator] = useState<string[]>([]);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [schedule, setSchedule] = useState<Schedule>({
        timing: 'daily',
        unit: 'hour',
        value: 0,
        priority: 0,
    });
    const [showPreview, setShowPreview] = useState(false);
    const [ruleData, setRuleData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New state for available actions and values
    const [availableActions, setAvailableActions] = useState<ApiAction[]>([]);
    const [availableActionValues, setAvailableActionValues] = useState<ActionValue[]>([]);
    const [metrics, setMetrics] = useState<Metric[]>([]);

    // Load actions and values
    useEffect(() => {
        const loadActionsData = async () => {
            try {
                const [actions, actionValues] = await Promise.all([
                    actionsService.listActions(),
                    actionsService.listActionValues()
                ]);
                setAvailableActions(actions);
                setAvailableActionValues(actionValues);
            } catch (err) {
                console.error('Error loading actions:', err);
                setError(err instanceof Error ? err.message : 'Failed to load actions');
            }
        };

        loadActionsData();
    }, []);

    // Load metrics
    useEffect(() => {
        const loadMetrics = async () => {
            try {
                const metricsData = await metricsService.listMetrics();
                setMetrics(metricsData);
            } catch (err) {
                console.error('Error loading metrics:', err);
                setError(err instanceof Error ? err.message : 'Failed to load metrics');
            }
        };

        loadMetrics();
    }, []);

    const formatMetricReference = (metricExpression: string) => {
        // If it's already a properly formatted reference, return as is
        if (metricExpression.startsWith('(m:')) {
            return metricExpression;
        }
        return `(m:${metricExpression})`;
    };

    const handleMetricSelect = (index: number, value: string) => {
        const newConditions = [...conditions];
        newConditions[index].name = value;
        setConditions(newConditions);

        // Update corresponding action formula if it exists
        const newActions = [...actions];
        if (newActions[index]) {
            newActions[index].formula = formatMetricReference(value);
            setActions(newActions);
        }
    };

    const handleFormulaChange = (index: number, value: string) => {
        const newActions = [...actions];
        // Don't format if the user is typing a custom formula
        newActions[index].formula = value;
        setActions(newActions);
    };

    const validateForm = () => {
        if (!ruleName.trim()) {
            alert('Please enter a rule name');
            return false;
        }

        if (ruleName.trim().length < 2) {
            alert('Rule name must be at least 2 characters long');
            return false;
        }

        if (selectedOperator.length === 0) {
            alert('Please select an operator (AND/OR)');
            return false;
        }

        if (conditions.length === 0) {
            alert('Please add at least one condition');
            return false;
        }

        return true;
    };

    const createRuleData = () => {
        return {
            schedule: {
                priority: schedule.priority,
                ...schedule
            },
            rule: {
                syntax: generateRuleSyntax(),
            },
            actions: actions.map(action => ({
                name: action.name,
                value: action.value,
                formula: action.formula,
            }))
        };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const data = createRuleData();
        setRuleData(data);
        setShowPreview(true);
    };

    const handleSave = async (dataToSave?: any) => {
        // Use provided data or current ruleData
        const saveData = dataToSave || ruleData;

        if (!saveData) {
            setError('No rule data to save');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Generate storage key using actual rule name
            const sanitizedName = ruleName
                .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore, keep letters, numbers, underscore, dash
                .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
                .replace(/^_|_$/g, '') // Remove leading/trailing underscores
                .substring(0, 100) || 'rule'; // Limit length and provide fallback

            const s3_key = `${sanitizedName}.json`;

            // Check for duplicate rule names by checking if s3_key already exists
            try {
                const existingRules = await rulesService.list();
                const duplicateRule = existingRules.find(rule => rule.s3_key === s3_key);
                if (duplicateRule) {
                    setError(`A rule with the name "${ruleName}" already exists. Please choose a different name.`);
                    return;
                }
            } catch (listErr) {
                console.warn('Could not check for duplicate rule names:', listErr);
                // Continue with save even if we can't check for duplicates
            }

            // Create the rule using the service
            await rulesService.create({
                name: ruleName,
                s3_key: s3_key,
                content: saveData
            });

            // Navigate to rules page on success
            navigate('/rules');
        } catch (err) {
            console.error('Error saving rule:', err);
            setError(err instanceof Error ? err.message : 'Failed to save rule');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = () => handleSave();

    const handleDirectSave = () => {
        if (!validateForm()) {
            return;
        }
        const data = createRuleData();
        handleSave(data);
    };

    const handleBack = () => {
        setShowPreview(false);
    };

    const generateRuleSyntax = () => {
        if (conditions.length === 0) return '';

        // Start with the first condition
        let result = `${conditions[0].name} ${conditions[0].operator}${conditions[0].value}`;

        // For each subsequent condition, add it with its groupOperator
        for (let i = 1; i < conditions.length; i++) {
            const condition = conditions[i];
            const operator = condition.groupOperator || 'AND';
            result += ` ${operator.toLowerCase()} ${condition.name} ${condition.operator}${condition.value}`;
        }

        return result;
    };

    const addCondition = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
        }
        if (conditions.length < 45) {
            if (selectedOperator.length === 0) {
                alert('Please select an operator (AND/OR) before adding a condition');
                return;
            }
            setConditions([...conditions, {
                id: uuidv4(),
                name: '',
                operator: '',
                value: '',
                groupOperator: selectedOperator[0] as 'AND' | 'OR'
            }]);
        }
    };

    const addAction = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
        }
        // Get first available options from both lists
        const firstActionName = availableActions.length > 0 ? availableActions[0].name : '';
        const firstActionValue = availableActionValues.length > 0 ? availableActionValues[0].value : '';

        // Get the corresponding condition's metric if it exists
        const actionIndex = actions.length;
        const correspondingMetric = conditions[actionIndex]?.name || '';
        const initialFormula = correspondingMetric ? formatMetricReference(correspondingMetric) : '';

        setActions([...actions, {
            name: firstActionName,
            value: firstActionValue,
            formula: initialFormula
        }]);
    };

    const removeAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    return (
        <HomeLayout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Add New Rule</h1>
                {!showPreview ? (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Rule Name */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Rule Name</h2>
                            <input
                                type="text"
                                value={ruleName}
                                onChange={(e) => setRuleName(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter rule name"
                                required
                            />
                            {ruleName.trim() && (
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>
                                        <span className="font-medium">Storage key: </span>
                                        <span className="font-mono">
                                            {ruleName
                                                .replace(/[^a-zA-Z0-9_-]/g, '_')
                                                .replace(/_{2,}/g, '_')
                                                .replace(/^_|_$/g, '')
                                                .substring(0, 100) || 'rule'}.json
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Rule names must be unique. Special characters will be replaced with underscores.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rule Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Rule</h2>
                            <Select
                                id="operator"
                                label="Operator"
                                options={operators}
                                value={selectedOperator}
                                onChange={setSelectedOperator}
                                multipleSelect={false}
                                placeholder="Select operator..."
                            />

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Conditions</h3>
                                <DraggableConditions
                                    conditions={conditions}
                                    onChange={(newConditions) => {
                                        setConditions(newConditions);
                                        // Update corresponding actions if needed
                                        newConditions.forEach((condition, index) => {
                                            const newActions = [...actions];
                                            if (newActions[index]) {
                                                newActions[index].formula = formatMetricReference(condition.name);
                                            }
                                            setActions(newActions);
                                        });
                                    }}
                                    comparisonOperators={comparisonOperators}
                                    metrics={metrics}
                                    onMetricSelect={(index, value) => handleMetricSelect(index, value)}
                                />
                                {conditions.length < 45 && (
                                    <Button
                                        onClick={addCondition}
                                        className="flex items-center gap-2"
                                    >
                                        <FaPlus />
                                        <span>Add Condition</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Actions Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Actions</h2>
                            {actions.map((action, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="w-[400px] shrink-0">
                                        <Select
                                            id={`action-name-${index}`}
                                            value={[action.name]}
                                            onChange={(value) => {
                                                const newActions = [...actions];
                                                newActions[index].name = value[0];
                                                setActions(newActions);
                                            }}
                                            options={availableActions.map(a => ({
                                                value: a.name,
                                                label: a.name
                                            }))}
                                            multipleSelect={false}
                                            placeholder="Select action..."
                                        />
                                    </div>
                                    <div className="w-[150px] shrink-0">
                                        <Select
                                            id={`action-value-${index}`}
                                            value={[action.value]}
                                            onChange={(value) => {
                                                const newActions = [...actions];
                                                newActions[index].value = value[0];
                                                setActions(newActions);
                                            }}
                                            options={availableActionValues.map(v => ({
                                                value: v.value,
                                                label: v.value
                                            }))}
                                            multipleSelect={false}
                                            placeholder="Select value..."
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <ActionFormulaSelector
                                            value={action.formula}
                                            onChange={(value) => handleFormulaChange(index, value)}
                                            placeholder="Select formula"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAction(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                            <Button
                                onClick={addAction}
                                className="flex items-center gap-2"
                            >
                                <FaPlus />
                                <span>Add Action</span>
                            </Button>
                        </div>

                        {/* Schedule Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Schedule</h2>
                            <div className="flex flex-col gap-2">
                                <span className="block text-sm font-medium text-gray-600">Priority</span>
                                <input
                                    type="number"
                                    value={schedule.priority}
                                    onChange={(e) => {
                                        setSchedule({ ...schedule, priority: parseInt(e.target.value) });
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                                    placeholder="Enter schedule priority"
                                />
                            </div>
                            <ScheduleSelector
                                schedule={schedule}
                                onChange={setSchedule}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button
                                onClick={() => navigate('/rules')}
                                className="bg-gray-500 hover:bg-gray-600"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (validateForm()) {
                                        const data = createRuleData();
                                        setRuleData(data);
                                        setShowPreview(true);
                                    }
                                }}
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                Preview Rule
                            </Button>
                            <Button
                                onClick={handleDirectSave}
                                className={`text-white ${isLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Save Rule'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8">
                        {error && (
                            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Rule Preview</h2>
                            <ReactJson
                                src={ruleData}
                                theme="rjv-default"
                                name={false}
                                collapsed={1}
                                displayDataTypes={false}
                                enableClipboard={false}
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                onClick={handleBack}
                                className="bg-gray-500 hover:bg-gray-600"
                                disabled={isLoading}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handlePublish}
                                className={`text-white ${isLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Save & Publish'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </HomeLayout>
    );
};

export default AddRule; 