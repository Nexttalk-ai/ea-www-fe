import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactJson from 'react-json-view';
import Button from '../components/ui/Button';
import HomeLayout from '../layouts/HomeLayout';
import { FaArrowLeft, FaRedo, FaTimes, FaSave } from 'react-icons/fa';
import { tspidService } from '../services/tspidService';
import { TSPID } from '../types/types';

const TSPIDPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tspidConfig, setTspidConfig] = useState<TSPID | null>(null);
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
                
                // If body itself looks like content (has tspid structure), use it
                if (bodyData && typeof bodyData === 'object' && (
                    bodyData.tspid_value || bodyData.enabled !== undefined || bodyData.generationMethod
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
        
        // Last resort: if response has tspid-like structure, use it as content
        if (response && typeof response === 'object' && (
            response.tspid_value || response.enabled !== undefined || response.generationMethod
        )) {
            return response;
        }
        
        return null;
    };

    const handleEditJson = () => {
        if (tspidConfig?.content && Object.keys(tspidConfig.content).length > 0) {
            setJsonContent(JSON.stringify(tspidConfig.content, null, 2));
        } else {
            // Provide a template for empty content
            setJsonContent(JSON.stringify({
                "tspid_value": "",
                "enabled": true,
                "generationMethod": "manual",
                "expiryDays": 30
            }, null, 2));
        }
        setJsonError(null);
        setShowJsonEditor(true);
    };

    const validateJson = (jsonString: string): { isValid: boolean; parsed?: any; error?: string } => {
        try {
            const parsed = JSON.parse(jsonString);
            
            // Validate required fields
            if (!parsed.tspid_value) {
                return { isValid: false, error: 'tspid_value is required' };
            }
            if (parsed.enabled === undefined) {
                return { isValid: false, error: 'enabled field is required' };
            }
            if (!parsed.generationMethod || !['manual', 'auto', 'partner_feed'].includes(parsed.generationMethod)) {
                return { isValid: false, error: 'generationMethod must be one of: manual, auto, partner_feed' };
            }
            if (!parsed.expiryDays || typeof parsed.expiryDays !== 'number' || parsed.expiryDays <= 0) {
                return { isValid: false, error: 'expiryDays must be a positive number' };
            }
            
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
        if (!tspidConfig) return;
        
        const validation = validateJson(jsonContent);
        if (!validation.isValid) {
            setJsonError(validation.error || 'Invalid JSON format');
            return;
        }

        try {
            setSaving(true);
            setJsonError(null);

            // Update the tspid config with new content
            await tspidService.update({
                id: tspidConfig.id,
                tspid_value: validation.parsed.tspid_value,
                enabled: validation.parsed.enabled,
                generationMethod: validation.parsed.generationMethod,
                expiryDays: validation.parsed.expiryDays
            });

            // Update local state
            setTspidConfig({
                ...tspidConfig,
                content: validation.parsed
            });

            setShowJsonEditor(false);
            
            // Show success message
            alert('TSPID configuration updated successfully!');
            
        } catch (error) {
            setJsonError(error instanceof Error ? error.message : 'Failed to save TSPID configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleCloseJsonEditor = () => {
        setShowJsonEditor(false);
        setJsonError(null);
    };

    useEffect(() => {
        const fetchTSPIDConfig = async (retries = 2) => {
            if (!id) return;
            
            try {
                setLoading(true);
                setError(null);
                setContentError(null);
                
                // Step 1: Get all TSPID configs to find our config and get the metadata
                const allTSPIDs = await tspidService.list();
                const foundTSPID = allTSPIDs.find(t => t.id === id);
                
                if (!foundTSPID) {
                    setError(`TSPID configuration with ID "${id}" not found`);
                    setLoading(false);
                    return;
                }
                
                // Step 2: Try get() method to fetch full content
                try {
                    const tspidWithContent = await tspidService.get(id);
                    
                    // Try to extract content from various possible locations
                    const extractedContent = extractContentFromResponse(tspidWithContent);
                    
                    if (extractedContent) {
                        const finalTSPID = {
                            ...foundTSPID,
                            ...tspidWithContent,
                            content: extractedContent
                        };
                        setTspidConfig(finalTSPID);
                    } else {
                        setTspidConfig({
                            ...foundTSPID,
                            content: {
                                tspid_value: foundTSPID.tspid_value,
                                enabled: foundTSPID.enabled,
                                generationMethod: foundTSPID.generationMethod,
                                expiryDays: foundTSPID.expiryDays
                            }
                        });
                        setContentError('TSPID configuration has no content or content could not be extracted');
                    }
                } catch (getError) {
                    setContentError(`Failed to load content: ${getError instanceof Error ? getError.message : String(getError)}`);
                    
                    // Fallback to metadata only
                    setTspidConfig({
                        ...foundTSPID,
                        content: {
                            tspid_value: foundTSPID.tspid_value,
                            enabled: foundTSPID.enabled,
                            generationMethod: foundTSPID.generationMethod,
                            expiryDays: foundTSPID.expiryDays
                        }
                    });
                }
                
                setLoading(false);
            } catch (err) {
                if (retries > 0) {
                    setTimeout(() => fetchTSPIDConfig(retries - 1), 1000);
                } else {
                    setError(err instanceof Error ? err.message : 'Failed to fetch TSPID configuration');
                    setLoading(false);
                }
            }
        };

        fetchTSPIDConfig();
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

    if (error || !tspidConfig) {
        return (
            <HomeLayout>
                <div className="p-6">
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                        {error || 'TSPID configuration not found'}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button
                            onClick={() => navigate('/tspid')}
                            className="text-black hover:text-black flex items-center gap-2"
                        >
                            <FaArrowLeft />
                            Back
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
                    onClick={() => navigate('/tspid')}
                    className="text-black hover:text-black flex items-center gap-2"
                >
                    <FaArrowLeft />
                    Back
                </Button>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold px-4 py-2">TSPID Configuration</h1>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => navigate(`/tspid/edit/${tspidConfig.id}`)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                        >
                            Edit TSPID Config
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
                            <h2 className="text-sm font-medium text-gray-500">TSPID Value</h2>
                            <p className="mt-1">{tspidConfig.tspid_value || 'Not set'}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Status</h2>
                            <p className="mt-1">{tspidConfig.enabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Generation Method</h2>
                            <p className="mt-1">{tspidConfig.generationMethod}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Expiry Days</h2>
                            <p className="mt-1">{tspidConfig.expiryDays}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Version</h2>
                            <p className="mt-1">v{tspidConfig.version || '1'}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Last Updated</h2>
                            <p className="mt-1">{tspidConfig.updated_at ? new Date(tspidConfig.updated_at).toLocaleString() : 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-sm font-medium text-gray-500 mb-4">Configuration</h2>
                    
                    {/* Show content error if any */}
                    {contentError && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-800 text-sm">{contentError}</p>
                        </div>
                    )}
                    
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 bg-gray-50 rounded" style={{ height: 'calc(100vh - 400px)', overflow: 'auto' }}>
                            {tspidConfig.content && Object.keys(tspidConfig.content).length > 0 ? (
                                <ReactJson
                                    src={tspidConfig.content}
                                    name={false}
                                    theme="rjv-default"
                                    enableClipboard={false}
                                    displayDataTypes={false}
                                    displayObjectSize={false}
                                    quotesOnKeys={false}
                                />
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-lg mb-2">No configuration available</p>
                                    <p className="text-sm">
                                        {contentError 
                                            ? 'There was an issue loading the TSPID configuration.' 
                                            : 'This TSPID configuration has no JSON content configured.'
                                        }
                                    </p>
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
                                <h2 className="text-xl font-bold">Edit TSPID Configuration</h2>
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
                                        TSPID Configuration JSON:
                                    </label>
                                    <textarea
                                        id="json-editor"
                                        value={jsonContent}
                                        onChange={handleJsonChange}
                                        className={`flex-1 w-full p-4 border rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            jsonError ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter valid TSPID configuration JSON..."
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
                                    {saving ? 'Saving...' : 'Save Configuration'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HomeLayout>
    );
};

export default TSPIDPage; 