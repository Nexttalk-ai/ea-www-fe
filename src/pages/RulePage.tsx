import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactJson from 'react-json-view';
import Button from '../components/ui/Button';
import HomeLayout from '../layouts/HomeLayout';
import { FaArrowLeft, FaRedo, FaTimes, FaSave } from 'react-icons/fa';
import { rulesService, Rule } from '../services/rulesService';

const RulePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [rule, setRule] = useState<Rule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [contentError, setContentError] = useState<string | null>(null);
    
    // JSON Editor Modal state
    const [showJsonEditor, setShowJsonEditor] = useState(false);
    const [jsonContent, setJsonContent] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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

    const handleEditJson = () => {
        if (rule?.content && Object.keys(rule.content).length > 0) {
            setJsonContent(JSON.stringify(rule.content, null, 2));
        } else {
            // Provide a template for empty content
            setJsonContent(JSON.stringify({
                "name": rule?.name || "New Rule",
                "schedule": {
                    "timing": "daily",
                    "unit": "hour",
                    "value": 0,
                    "priority": 0
                },
                "rule": {
                    "operator": "AND",
                    "syntax": "",
                    "conditions": []
                },
                "actions": []
            }, null, 2));
        }
        setJsonError(null);
        setShowJsonEditor(true);
    };

    const validateJson = (jsonString: string): { isValid: boolean; parsed?: any; error?: string } => {
        try {
            const parsed = JSON.parse(jsonString);
            return { isValid: true, parsed };
        } catch (error) {
            return { 
                isValid: false, 
                error: error instanceof Error ? error.message : 'Invalid JSON format' 
            };
        }
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setJsonContent(value);
        
        // Real-time validation
        if (value.trim()) {
            const validation = validateJson(value);
            if (!validation.isValid) {
                setJsonError(validation.error || 'Invalid JSON');
            } else {
                setJsonError(null);
            }
        } else {
            setJsonError(null);
        }
    };

    const handleSaveJson = async () => {
        if (!rule || !id) return;
        
        const validation = validateJson(jsonContent);
        if (!validation.isValid) {
            setJsonError(validation.error || 'Invalid JSON format');
            return;
        }

        try {
            setSaving(true);
            setJsonError(null);

            // Update the rule with new content
            await rulesService.update({
                id: rule.id,
                name: rule.name,
                s3_key: rule.s3_key,
                content: validation.parsed
            });

            // Update local state
            setRule({
                ...rule,
                content: validation.parsed
            });

            setShowJsonEditor(false);
            
            // Show success message (you could add a toast notification here)
            alert('JSON content updated successfully!');
            
        } catch (error) {
            setJsonError(error instanceof Error ? error.message : 'Failed to save JSON content');
        } finally {
            setSaving(false);
        }
    };

    const handleCloseJsonEditor = () => {
        setShowJsonEditor(false);
        setJsonError(null);
    };

    useEffect(() => {
        const fetchRule = async (retries = 2) => {
            if (!id) return;
            
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
                
                // Step 2: Try get() method to fetch full content
                try {
                    const ruleWithContent = await rulesService.get(id);
                    
                    // Try to extract content from various possible locations
                    const extractedContent = extractContentFromResponse(ruleWithContent);
                    
                    if (extractedContent) {
                        const finalRule = {
                            ...foundRule,
                            ...ruleWithContent,
                            content: extractedContent
                        };
                        setRule(finalRule);
                    } else {
                        setRule({
                            ...foundRule,
                            content: {}
                        });
                        setContentError('Rule has no content or content could not be extracted');
                    }
                } catch (getError) {
                    setContentError(`Failed to load content: ${getError instanceof Error ? getError.message : String(getError)}`);
                    
                    // Fallback to metadata only
                    setRule({
                        ...foundRule,
                        content: {}
                    });
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

    if (loading) {
        return (
            <HomeLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </HomeLayout>
        );
    }

    if (error || !rule) {
        return (
            <HomeLayout>
                <div className="p-6">
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                        {error || 'Rule not found'}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button
                            onClick={() => navigate('/rules')}
                            className="text-black hover:text-black flex items-center gap-2"
                        >
                            <FaArrowLeft />
                            Back to Rules
                        </Button>
                        {error && (
                            <Button
                                onClick={() => window.location.reload()}
                                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                            >
                                <FaRedo />
                                Retry
                            </Button>
                        )}
                    </div>
                </div>
            </HomeLayout>
        );
    }

    return (
        <HomeLayout>
            <div className="px-6 py-2">
                {/* Back Button */}
                <Button
                    onClick={() => navigate('/rules')}
                    className="text-black hover:text-black flex items-center gap-2"
                >
                    <FaArrowLeft />
                    Back to Rules
                </Button>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold px-4 py-2">{rule.name || 'Unnamed Rule'}</h1>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => navigate(`/rules/edit/${rule.id}`)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                        >
                            Edit Rule
                        </Button>
                        <Button
                            onClick={handleEditJson}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            Edit JSON
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Storage Key</h2>
                            <p className="mt-1">{rule.s3_key || 'N/A'}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Version</h2>
                            <p className="mt-1">v{rule.version || '1'}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Created At</h2>
                            <p className="mt-1">{rule.created_at ? new Date(rule.created_at).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Last Updated</h2>
                            <p className="mt-1">{rule.updated_at ? new Date(rule.updated_at).toLocaleString() : 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-sm font-medium text-gray-500 mb-4">Content</h2>
                    
                    {/* Show content error if any */}
                    {contentError && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-800 text-sm">{contentError}</p>
                        </div>
                    )}
                    
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 bg-gray-50 rounded" style={{ height: 'calc(100vh - 400px)', overflow: 'auto' }}>
                            {rule.content && Object.keys(rule.content).length > 0 ? (
                                <ReactJson
                                    src={rule.content}
                                    name={false}
                                    theme="rjv-default"
                                    enableClipboard={false}
                                    displayDataTypes={false}
                                    displayObjectSize={false}
                                    quotesOnKeys={false}
                                />
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-lg mb-2">No content available</p>
                                    <p className="text-sm">
                                        {contentError 
                                            ? 'There was an issue loading the rule content from S3.' 
                                            : 'This rule has no JSON content configured.'
                                        }
                                    </p>
                                    {rule.s3_key && (
                                        <p className="text-xs mt-2 text-gray-400">
                                            S3 Key: {rule.s3_key}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* JSON Editor Modal */}
                {showJsonEditor && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-4xl flex flex-col">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-bold">Edit JSON Content</h2>
                                <button
                                    onClick={handleCloseJsonEditor}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 p-6 flex flex-col">
                                {jsonError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                                        <p className="text-red-800 text-sm">
                                            <strong>JSON Error:</strong> {jsonError}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="flex-1 flex flex-col">
                                    <label htmlFor="json-editor" className="block text-sm font-medium text-gray-700 mb-2">
                                        JSON Content:
                                    </label>
                                    <textarea
                                        id="json-editor"
                                        value={jsonContent}
                                        onChange={handleJsonChange}
                                        className={`flex-1 w-full p-4 border rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            jsonError ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter valid JSON content..."
                                        spellCheck={false}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 p-6 border-t">
                                <Button
                                    onClick={handleCloseJsonEditor}
                                    className="bg-gray-500 hover:bg-gray-600 text-white"
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveJson}
                                    className={`text-white flex items-center gap-2 ${
                                        saving || jsonError 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-green-500 hover:bg-green-600'
                                    }`}
                                    disabled={saving || !!jsonError}
                                >
                                    <FaSave />
                                    {saving ? 'Saving...' : 'Save JSON'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HomeLayout>
    );
};

export default RulePage; 