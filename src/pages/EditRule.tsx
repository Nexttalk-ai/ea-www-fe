import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactJson from 'react-json-view';
import Button from '../components/ui/Button';
import HomeLayout from '../layouts/HomeLayout';
import { FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import Select from '../components/ui/Select';
import ScheduleSelector from '../components/ui/ScheduleSelector';
import { rulesService, Rule } from '../services/rulesService';
import { actionsService, Action as ApiAction, ActionValue } from '../services/actionsService';
import { metricsService, Metric } from '../services/metricsService';
import DraggableConditions from '../components/ui/DraggableConditions';
import ActionFormulaSelector from '../components/ui/ActionFormulaSelector';
import { v4 as uuidv4 } from 'uuid';

const operators = [
    { value: 'AND', label: 'AND' },
    { value: 'OR', label: 'OR' },
];

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

interface RuleAction {
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

const EditRule: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Loading states
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contentError, setContentError] = useState<string | null>(null);

    // Original rule data
    const [originalRule, setOriginalRule] = useState<Rule | null>(null);

    // Form state
    const [ruleName, setRuleName] = useState('');
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [selectedOperator, setSelectedOperator] = useState<string[]>([]);
    const [actions, setActions] = useState<RuleAction[]>([]);
    const [schedule, setSchedule] = useState<Schedule>({ timing: 'daily', unit: 'hour', value: 0, priority: 0 });

    // Preview state
    const [showPreview, setShowPreview] = useState(false);
    const [ruleData, setRuleData] = useState<any>(null);

    // Add new state for actions and values
    const [availableActions, setAvailableActions] = useState<ApiAction[]>([]);
    const [availableActionValues, setAvailableActionValues] = useState<ActionValue[]>([]);

    const [metrics, setMetrics] = useState<Metric[]>([]);

    const extractContentFromResponse = (response: any): any => {
        // Try direct content field first
        if (response?.content && typeof response.content === 'object' && Object.keys(response.content).length > 0) {
            return response.content;
        }

        // Try parsing body field and look for content inside it
        if (response?.body) {
            try {
                const bodyData = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;

                // Look for content field inside the body
                if (bodyData?.content && typeof bodyData.content === 'object' && Object.keys(bodyData.content).length > 0) {
                    return bodyData.content;
                }

                // If body itself looks like content (has rule structure), use it
                if (bodyData && typeof bodyData === 'object' && (
                    bodyData.rule || bodyData.schedule || bodyData.actions
                )) {
                    return bodyData;
                }
            } catch (e) {
                console.log(e);
                // Failed to parse body
            }
        }

        // Try nested content paths
        const contentPaths = [
            response?.data?.content,
            response?.result?.content,
            response?.content,
        ];

        for (const contentPath of contentPaths) {
            if (contentPath && typeof contentPath === 'object' && Object.keys(contentPath).length > 0) {
                return contentPath;
            }
        }

        // Last resort: if response has rule-like structure, use it as content
        if (response && typeof response === 'object' && (
            response.rule || response.schedule || response.actions
        )) {
            return response;
        }

        return null;
    };

    // Load existing rule data
    useEffect(() => {
        const fetchRule = async (retries = 2) => {
            if (!id) {
                setError('Rule ID is required');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                setContentError(null);

                // Step 1: Get all rules to find our rule and get the s3_key
                const allRules = await rulesService.list();
                const foundRule = allRules.find(r => r.id === id);

                if (!foundRule) {
                    setError(`Rule with ID "${id}" not found`);
                    setLoading(false);
                    return;
                }

                // Set basic rule info
                setOriginalRule(foundRule);
                setRuleName(foundRule.name || '');

                // Step 2: Try get() method to fetch full content
                try {
                    const ruleWithContent = await rulesService.get(id);

                    // Try to extract content from various possible locations
                    const extractedContent = extractContentFromResponse(ruleWithContent);

                    if (extractedContent) {
                        // Populate form with extracted content
                        populateFormWithContent(extractedContent);

                        // Update original rule with content
                        setOriginalRule({
                            ...foundRule,
                            ...ruleWithContent,
                            content: extractedContent
                        });
                    } else {
                        setContentError('Rule has no content or content could not be extracted');
                        // Still set the original rule for basic editing
                        setOriginalRule(foundRule);
                    }
                } catch (getError) {
                    setContentError(`Failed to load content: ${getError instanceof Error ? getError.message : String(getError)}`);

                    // Fallback to metadata only
                    setOriginalRule(foundRule);
                }

                setLoading(false);
            } catch (err) {
                if (retries > 0) {
                    setTimeout(() => fetchRule(retries - 1), 1000);
                } else {
                    setError(err instanceof Error ? err.message : 'Failed to fetch rule');
                    setLoading(false);
                }
            }
        };

        fetchRule();
    }, [id]);

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

    const populateFormWithContent = (content: any) => {
        if (!content) return;

        console.log(content);

        if (content.schedule) {
            setSchedule(content.schedule);
        }

        if (content.rule?.syntax) {
        
            const operatorRegex = /(!=|==|>=|<=|>|<)/;
            const logicalOperatorRegex = /\b(AND|OR)\b/gi; // case-insensitive
        
            // Match logical operators (AND/OR), preserving order
            const operators = content.rule.syntax.match(logicalOperatorRegex)?.map((op: string) => op.toUpperCase()) || [];
        
            // Split by logical operators (AND/OR), case-insensitive
            const conditions = content.rule.syntax.split(/\s+(?:AND|OR)\s+/i);
        
            const existingConditions = conditions.map((cond: string, index: number) => {
                const match = cond.match(operatorRegex);
                if (!match) return null;
        
                const operator = match[0];
                const [metric, value] = cond.split(operator).map((s: string) => s.trim());

                setSelectedOperator([operators[operators.length - 1] || 'AND']);
        
                return {
                    id: uuidv4(),
                    name: metric,
                    operator: operator,
                    value: value,
                    groupOperator: operators[operators.length - 1] || 'AND'
                };
            }).filter(Boolean); // remove nulls if any
        
            setConditions(existingConditions);
        }

        if (content.actions) {
            setActions(content.actions.map((action: any) => ({
                name: action.name || '',
                value: action.value || '',
                formula: action.formula || ''
            })));
        }
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
                syntax: generateRuleSyntax()
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

    const generateRuleSyntax = () => {
        console.log(conditions);
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

    const formatMetricReference = (metricExpression: string) => {
        // If it's already a properly formatted reference, return as is
        if (metricExpression.startsWith('(m:')) {
            return metricExpression;
        }
        return `(m:${metricExpression})`;
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

    const handleSave = async (dataToSave?: any) => {
        if (!originalRule) {
            setError('Original rule data not found');
            return;
        }

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
                .replace(/[^a-zA-Z0-9_-]/g, '_')
                .replace(/_{2,}/g, '_')
                .replace(/^_|_$/g, '')
                .substring(0, 100) || 'rule';

            const s3_key = `${sanitizedName}.json`;

            // Check for duplicate rule names (excluding the current rule)
            try {
                const existingRules = await rulesService.list();
                const duplicateRule = existingRules.find(rule => 
                    rule.s3_key === s3_key && rule.id !== originalRule.id
                );
                if (duplicateRule) {
                    setError(`A rule with the name "${ruleName}" already exists. Please choose a different name.`);
                    return;
                }
            } catch (listErr) {
                console.warn('Could not check for duplicate rule names:', listErr);
            }

            // Update the rule using the service
            await rulesService.update({
                id: originalRule.id,
                name: ruleName,
                s3_key: s3_key,
                content: saveData
            });

            // Navigate to rules page on success
            navigate('/rules');
        } catch (err) {
            console.error('Error updating rule:', err);
            setError(err instanceof Error ? err.message : 'Failed to update rule');
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

    const handleFormulaChange = (index: number, value: string) => {
        const newActions = [...actions];
        newActions[index].formula = value;
        setActions(newActions);
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

    if (loading) {
        return (
            <HomeLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </HomeLayout>
        );
    }

    if (error && !originalRule) {
        return (
            <HomeLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
                        {error}
                    </div>
                    <Button
                        onClick={() => navigate('/rules')}
                        className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
                    >
                        <FaArrowLeft />
                        Back to Rules
                    </Button>
                </div>
            </HomeLayout>
        );
    }

    return (
        <HomeLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        onClick={() => navigate('/rules')}
                        className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
                    >
                        <FaArrowLeft />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Rule</h1>
                </div>

                {/* Show content loading warning if applicable */}
                {contentError && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800 text-sm">
                            <strong>Content Loading Issue:</strong> {contentError}
                        </p>
                        <p className="text-yellow-700 text-xs mt-1">
                            You can still edit the rule name and basic settings, but existing rule content may not be available for editing.
                        </p>
                    </div>
                )}

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
                                            placeholder="Enter or select formula"
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
                                    value={schedule.priority || 0}
                                    onChange={(e) => setSchedule({
                                        ...schedule,
                                        priority: parseInt(e.target.value) || 0
                                    })}
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
                                Preview Changes
                            </Button>
                            <Button 
                                onClick={handleDirectSave}
                                className={`text-white ${isLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
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

export default EditRule; 
