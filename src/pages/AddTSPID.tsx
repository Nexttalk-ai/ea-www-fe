import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import HomeLayout from '../layouts/HomeLayout';
import { FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { tspidService } from '../services/tspidService';
import { TSPID } from '../types/types';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ReactJson from 'react-json-view';
import { v4 as uuidv4 } from 'uuid';

interface TSPIDEntry {
    id: string;
    tspid_value: string;
    pixel_id: string;
    source: 'facebook' | 'google' | 's2s-pusher';
}

const AddTSPID: React.FC = () => {
    const navigate = useNavigate();
    const [configName, setConfigName] = useState('');
    const [tspidEntries, setTspidEntries] = useState<TSPIDEntry[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [configData, setConfigData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const SOURCE_OPTIONS = [
        { value: 'facebook', label: 'Facebook' },
        { value: 'google', label: 'Google' },
        { value: 's2s-pusher', label: 'S2S Pusher' }
    ];

    const addTSPIDEntry = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
        }
        setTspidEntries([...tspidEntries, {
            id: uuidv4(),
            tspid_value: '',
            pixel_id: '',
            source: 'facebook'
        }]);
    };

    const removeTSPIDEntry = (index: number) => {
        setTspidEntries(tspidEntries.filter((_, i) => i !== index));
    };

    const updateTSPIDEntry = (index: number, field: keyof TSPIDEntry, value: string) => {
        const newEntries = [...tspidEntries];
        newEntries[index] = {
            ...newEntries[index],
            [field]: value
        };
        setTspidEntries(newEntries);
    };

    const validateForm = () => {
        if (!configName.trim()) {
            alert('Please enter a configuration name');
            return false;
        }

        if (configName.trim().length < 2) {
            alert('Configuration name must be at least 2 characters long');
            return false;
        }

        if (tspidEntries.length === 0) {
            alert('Please add at least one TSPID entry');
            return false;
        }

        // Validate each entry
        for (let i = 0; i < tspidEntries.length; i++) {
            const entry = tspidEntries[i];
            if (!entry.tspid_value.trim()) {
                alert(`TSPID value is required for entry ${i + 1}`);
                return false;
            }
            if (!entry.source) {
                alert(`Source is required for entry ${i + 1}`);
                return false;
            }
        }

        return true;
    };

    const createConfigData = () => {
        const config: { [key: string]: any } = {};
        
        tspidEntries.forEach(entry => {
            if (entry.tspid_value.trim()) {
                config[entry.tspid_value.trim()] = {
                    ...(entry.pixel_id.trim() && { pixel_id: entry.pixel_id.trim() }),
                    source: entry.source
                };
            }
        });

        return config;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const data = createConfigData();
        setConfigData(data);
        setShowPreview(true);
    };

    const handleSave = async (dataToSave?: any) => {
        const saveData = dataToSave || configData;

        if (!saveData) {
            setError('No configuration data to save');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Generate storage key using actual config name
            const sanitizedName = configName
                .replace(/[^a-zA-Z0-9_-]/g, '_')
                .replace(/_{2,}/g, '_')
                .replace(/^_|_$/g, '')
                .substring(0, 100) || 'tspid_config';

            const s3_key = `${sanitizedName}.json`;

            // Check for duplicate config names
            try {
                const existingConfigs = await tspidService.list();
                const duplicateConfig = existingConfigs.find(config => config.tspid_value === configName);
                if (duplicateConfig) {
                    setError(`A TSPID configuration with the name "${configName}" already exists. Please choose a different name.`);
                    return;
                }
            } catch (listErr) {
                console.warn('Could not check for duplicate config names:', listErr);
            }

            // Create the TSPID config using the service
            await tspidService.create({
                tspid_value: configName,
                content: saveData
            });

            navigate('/tspid');
        } catch (err) {
            console.error('Error saving TSPID config:', err);
            setError(err instanceof Error ? err.message : 'Failed to save TSPID configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = () => handleSave();

    const handleDirectSave = () => {
        if (!validateForm()) {
            return;
        }
        const data = createConfigData();
        handleSave(data);
    };

    const handleBack = () => {
        setShowPreview(false);
    };

    return (
        <HomeLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        onClick={() => navigate('/tspid')}
                        className="text-black hover:text-black flex items-center gap-2"
                    >
                        <FaArrowLeft />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold">Add New TSPID Configuration</h1>
                </div>

                {!showPreview ? (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Configuration Name */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Configuration Name</h2>
                            <input
                                type="text"
                                value={configName}
                                onChange={(e) => setConfigName(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter configuration name"
                                required
                            />
                            {configName.trim() && (
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>
                                        <span className="font-medium">Storage key: </span>
                                        <span className="font-mono">
                                            {configName
                                                .replace(/[^a-zA-Z0-9_-]/g, '_')
                                                .replace(/_{2,}/g, '_')
                                                .replace(/^_|_$/g, '')
                                                .substring(0, 100) || 'tspid_config'}.json
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Configuration names must be unique. Special characters will be replaced with underscores.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* TSPID Entries Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">TSPID Entries</h2>
                            {tspidEntries.map((entry, index) => (
                                <div key={entry.id} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            label="TSPID Value"
                                            placeholder="Enter unique TSPID value (e.g., 1048321527047168, f8x1D)"
                                            value={entry.tspid_value}
                                            onChange={(e) => updateTSPIDEntry(index, 'tspid_value', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            label="Pixel ID (Optional)"
                                            placeholder="Enter pixel ID (e.g., 1048321527047168, 650124024655693)"
                                            value={entry.pixel_id}
                                            onChange={(e) => updateTSPIDEntry(index, 'pixel_id', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Select
                                            id={`source-${index}`}
                                            label="Source"
                                            options={SOURCE_OPTIONS}
                                            value={[entry.source]}
                                            onChange={(value) => updateTSPIDEntry(index, 'source', value[0] as 'facebook' | 'google' | 's2s-pusher')}
                                            placeholder="Select source"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeTSPIDEntry(index)}
                                        className="text-red-500 hover:text-red-700 mt-6"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                            <Button
                                onClick={addTSPIDEntry}
                                className="flex items-center gap-2"
                            >
                                <FaPlus />
                                <span>Add TSPID</span>
                            </Button>
                        </div>

                        {error && (
                            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button
                                onClick={() => navigate('/tspid')}
                                className="bg-gray-500 hover:bg-gray-600 whitespace-nowrap min-h-[40px] flex items-center justify-center"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (validateForm()) {
                                        const data = createConfigData();
                                        setConfigData(data);
                                        setShowPreview(true);
                                    }
                                }}
                                className="bg-blue-500 hover:bg-blue-600 whitespace-nowrap min-h-[40px] flex items-center justify-center"
                            >
                                Preview Config
                            </Button>
                            <Button
                                onClick={handleDirectSave}
                                className={`text-white whitespace-nowrap min-h-[40px] flex items-center justify-center ${isLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Save Config'}
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
                            <h2 className="text-xl font-semibold mb-4">Configuration Preview</h2>
                            <ReactJson
                                src={configData}
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
                                className="bg-gray-500 hover:bg-gray-600 whitespace-nowrap min-h-[40px] flex items-center justify-center"
                                disabled={isLoading}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handlePublish}
                                className={`text-white whitespace-nowrap min-h-[40px] flex items-center justify-center ${isLoading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
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

export default AddTSPID; 