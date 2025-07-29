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

    const handleEditJson = () => {
        if (tspidConfig?.content && Object.keys(tspidConfig.content).length > 0) {
            setJsonContent(JSON.stringify(tspidConfig.content, null, 2));
        } else {
            // Provide a template for empty content
            setJsonContent(JSON.stringify({
                "1048321527047168": {
                    "pixel_id": "1048321527047168",
                    "source": "facebook"
                },
                "f8x1D": {
                    "pixel_id": "650124024655693",
                    "source": "facebook"
                }
            }, null, 2));
        }
        setJsonError(null);
        setShowJsonEditor(true);
    };

    const validateJson = (jsonString: string): { isValid: boolean; parsed?: any; error?: string } => {
        try {
            const parsed = JSON.parse(jsonString);
            
            // Validate that it's an object with TSPID entries
            if (typeof parsed !== 'object' || parsed === null) {
                return { isValid: false, error: 'Configuration must be a JSON object' };
            }
            
            // Check if it has at least one entry
            const keys = Object.keys(parsed);
            if (keys.length === 0) {
                return { isValid: false, error: 'Configuration must have at least one TSPID entry' };
            }
            
            // Validate each entry
            for (const key of keys) {
                const entry = parsed[key];
                if (typeof entry !== 'object' || entry === null) {
                    return { isValid: false, error: `Entry "${key}" must be an object` };
                }
                
                if (!entry.source) {
                    return { isValid: false, error: `Entry "${key}" must have a "source" field` };
                }
                
                const validSources = ['facebook', 'google', 's2s-pusher'];
                if (!validSources.includes(entry.source)) {
                    return { isValid: false, error: `Entry "${key}" has invalid source "${entry.source}". Must be one of: ${validSources.join(', ')}` };
                }
            }
            
            return { isValid: true, parsed };
        } catch (e) {
            return { isValid: false, error: 'Invalid JSON format' };
        }
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setJsonContent(newContent);
        
        if (newContent.trim()) {
            const validation = validateJson(newContent);
            setJsonError(validation.isValid ? null : validation.error || null);
        } else {
            setJsonError(null);
        }
    };

    const handleSaveJson = async () => {
        const validation = validateJson(jsonContent);
        if (!validation.isValid) {
            setJsonError(validation.error || null);
            return;
        }

        try {
            setSaving(true);
            setJsonError(null);

            await tspidService.update({
                id: tspidConfig!.id,
                content: validation.parsed
            });

            // Refresh the config data
            const updatedConfig = await tspidService.get(id!);
            setTspidConfig(updatedConfig);
            setShowJsonEditor(false);
        } catch (err) {
            setJsonError(err instanceof Error ? err.message : 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleCloseJsonEditor = () => {
        setShowJsonEditor(false);
        setJsonContent('');
        setJsonError(null);
    };

    useEffect(() => {
        const fetchTSPIDConfig = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                setError(null);
                setContentError(null);
                
                const config = await tspidService.get(id);
                setTspidConfig(config);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch TSPID configuration');
                setLoading(false);
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

    // Extract configuration info from the actual data structure
    const configName = tspidConfig.tspid_value || 'Not set';
    const isEnabled = tspidConfig.enabled !== undefined ? tspidConfig.enabled : true;
    const lastUpdated = tspidConfig.updated_at ? new Date(tspidConfig.updated_at).toLocaleString() : 'N/A';
    
    // Count TSPID entries in the content
    const entryCount = tspidConfig.content && typeof tspidConfig.content === 'object' 
        ? Object.keys(tspidConfig.content).length 
        : 0;

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
                    <h1 className="text-2xl font-bold px-4 py-2">TSPID Configuration: {configName}</h1>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => navigate(`/tspid/edit/${tspidConfig.id}`)}
                            className="bg-green-500 hover:bg-green-600 text-white whitespace-nowrap min-h-[40px] flex items-center justify-center"
                        >
                            Edit Config
                        </Button>
                        <Button
                            onClick={handleEditJson}
                            className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap min-h-[40px] flex items-center justify-center"
                        >
                            Edit JSON
                        </Button>
                    </div>
                </div>

                {/* Configuration Info */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Configuration Name</h2>
                            <p className="mt-1 font-medium">{configName}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Status</h2>
                            <p className="mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {isEnabled ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">TSPID Entries</h2>
                            <p className="mt-1 font-medium">{entryCount}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Last Updated</h2>
                            <p className="mt-1">{lastUpdated}</p>
                        </div>
                    </div>
                </div>

                {/* JSON Configuration */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Configuration JSON</h2>
                    
                    {contentError && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-800 text-sm">{contentError}</p>
                        </div>
                    )}
                    
                    <div className="bg-gray-50 rounded p-4" style={{ height: '500px', overflow: 'auto' }}>
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
                                <p className="text-lg mb-2">No JSON configuration available</p>
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