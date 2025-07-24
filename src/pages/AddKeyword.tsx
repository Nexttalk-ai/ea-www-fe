import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import PageContainer from '../components/ui/PageContainer';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import TableSearchBar from '../components/ui/TableSearchBar';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import CustomPagination from '../components/ui/CustomPagination';
import { useNotification } from '../hooks/useNotification';
import GoBackButton from '../components/ui/GoBackButton';

type Mode = 'bulk' | 'individual';

interface KeywordData {
    query: string;
    vertical: string;
    language: string;
    locale: string;
    specialCategory: string;
}

interface ValidationErrors {
    searchQueries?: string;
    vertical?: string;
    language?: string;
    locale?: string;
}

interface AddKeywordProps {
    onAdd?: () => void;
    onEdit?: () => void;
}

interface DropdownOption {
    value: string;
    label: string;
}

const PortalDropdown = ({ 
    isOpen, 
    onClose, 
    children, 
    position,
    searchable = true,
    onSelect
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    children: React.ReactNode; 
    position: { top: number; left: number; width: number; } | null;
    searchable?: boolean;
    onSelect: (value: string) => void;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const portalRoot = document.getElementById('portal-root') || document.body;
    
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen) {
                onClose();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen || !position) return null;

    return createPortal(
        <div 
            className="select-dropdown-portal"
            style={{
                top: position.top,
                left: position.left,
                width: position.width
            }}
            onClick={e => e.stopPropagation()}
        >
            {searchable && (
                <input
                    type="text"
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    onClick={e => e.stopPropagation()}
                />
            )}
            <div>
                {React.Children.map(children, child => {
                    if (!React.isValidElement(child)) return child;
                    
                    if (searchTerm && child.props.children) {
                        const filteredOptions = React.Children.toArray(child.props.children)
                            .filter((option): option is React.ReactElement => {
                                if (!React.isValidElement(option)) return false;
                                const optionText = option.props.children?.toString().toLowerCase() || '';
                                return optionText.includes(searchTerm.toLowerCase());
                            });
                        
                        return React.cloneElement(child, {}, filteredOptions);
                    }
                    
                    return child;
                })}
            </div>
        </div>,
        portalRoot
    );
};

const AddKeyword: React.FC<AddKeywordProps> = ({ onAdd, onEdit }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { show, NotificationContainer } = useNotification();
    const [mode, setMode] = useState<Mode>(location.pathname.includes('edit') ? 'individual' : 'bulk');
    const [searchQueries, setSearchQueries] = useState('');
    const [selectedVertical, setSelectedVertical] = useState<string[]>([]);
    const [selectedLocale, setSelectedLocale] = useState<string[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string[]>([]);
    const [specialCategory, setSpecialCategory] = useState('None');
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rowData, setRowData] = useState<KeywordData[]>([
        { query: 'best online marketing courses', vertical: 'education', language: 'en', locale: 'us', specialCategory: 'None' },
        { query: 'digital marketing certification', vertical: 'education', language: 'en', locale: 'us', specialCategory: 'None' },
        { query: 'small business loans', vertical: 'finance', language: 'en', locale: 'us', specialCategory: 'None' },
        { query: 'trabajo remoto', vertical: 'employment', language: 'es', locale: 'es', specialCategory: 'None' },
        { query: 'cours marketing digital', vertical: 'education', language: 'fr', locale: 'fr', specialCategory: 'None' }
    ]);

    // Update mode when route changes
    useEffect(() => {
        setMode(location.pathname.includes('edit') ? 'individual' : 'bulk');
    }, [location.pathname]);

    // Sample data for dropdowns
    const verticalOptions: DropdownOption[] = [
        { value: 'services', label: 'Services' },
        { value: 'employment', label: 'Employment' },
        { value: 'education', label: 'Education' },
        { value: 'finance', label: 'Finance' },
        { value: 'health', label: 'Health' },
        { value: 'other', label: 'Other' }
    ];

    const localeOptions: DropdownOption[] = [
        { value: 'us', label: 'English (United States)' },
        { value: 'uk', label: 'English (United Kingdom)' },
        { value: 'ca', label: 'English (Canada)' },
        { value: 'de', label: 'German' },
        { value: 'it', label: 'Italian' },
        { value: 'fr', label: 'French' },
        { value: 'es', label: 'Spanish' },
        { value: 'pt', label: 'Portuguese' },
        { value: 'tr', label: 'Turkish' }
    ];

    const languageOptions: DropdownOption[] = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'it', label: 'Italian' },
        { value: 'pt', label: 'Portuguese' },
        { value: 'tr', label: 'Turkish' }
    ];

    // Add column width management
    const columnWidths = useRef<{ [key: string]: number }>({});
    const [forceUpdate, setForceUpdate] = useState(0);

    const updateColumnWidth = useCallback((field: string, width: number) => {
        if (!columnWidths.current[field] || width > columnWidths.current[field]) {
            columnWidths.current[field] = width;
            setForceUpdate(prev => prev + 1);
        }
    }, []);

    const SelectCellRenderer = (props: any) => {
        const [isOpen, setIsOpen] = useState(false);
        const [value, setValue] = useState(props.value);
        const [searchTerm, setSearchTerm] = useState('');
        const [options, setOptions] = useState<DropdownOption[]>([]);
        const cellRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);
        const field = props.column.colId;
        const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
        const [isEditing, setIsEditing] = useState(false);

        // Calculate max width of options for this field
        useEffect(() => {
            if (cellRef.current) {
                const textMeasure = document.createElement('span');
                textMeasure.style.visibility = 'hidden';
                textMeasure.style.position = 'absolute';
                textMeasure.style.whiteSpace = 'nowrap';
                textMeasure.style.fontSize = '14px'; // match text-sm
                document.body.appendChild(textMeasure);

                let maxWidth = 0;
                options.forEach(option => {
                    textMeasure.textContent = option.label;
                    const width = textMeasure.getBoundingClientRect().width + 40; // reduced padding since no arrow
                    maxWidth = Math.max(maxWidth, width);
                });

                document.body.removeChild(textMeasure);
                updateColumnWidth(field, maxWidth);
        }
        }, [options, field]);

        useEffect(() => {
            // Set options based on the column field
            switch (field) {
                case 'vertical':
                    setOptions(verticalOptions);
                    break;
                case 'language':
                    setOptions(languageOptions);
                    break;
                case 'locale':
                    setOptions(localeOptions);
                    break;
                default:
                    setOptions([]);
        }
        }, [field]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                    setIsEditing(false);
                    
                    // When clicking outside, try to find matching option
                    if (searchTerm) {
                        const matchingOption = options.find(
                            opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                        if (matchingOption) {
                            props.setValue(matchingOption.value);
                            setValue(matchingOption.value);
                        }
                        setSearchTerm('');
                    }
                }
            };

            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }, [searchTerm, options]);

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!isEditing) {
                setIsEditing(true);
                if (!isOpen) {
                    // Calculate available space when opening
                    if (cellRef.current) {
                        const rect = cellRef.current.getBoundingClientRect();
                        const spaceBelow = window.innerHeight - rect.bottom;
                        const spaceAbove = rect.top;
                        const dropdownHeight = Math.min(options.length * 32 + 8, 200); // reduced height since no search

                        setDropdownPosition(spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top');
                    }
                }
                setIsOpen(!isOpen);
            }
        };

        const handleSelect = (value: string) => {
            props.setValue(value);
            setValue(value);
            setIsOpen(false);
            setIsEditing(false);
            setSearchTerm('');
        };

        const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newSearchTerm = e.target.value;
            setSearchTerm(newSearchTerm);
            setIsOpen(true);
        };

        const filteredOptions = options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const selectedOption = options.find(opt => opt.value === props.value);
        const columnWidth = columnWidths.current[field] || 200;

        return (
                <div 
                ref={cellRef}
                className="w-full h-full flex items-center justify-center px-3"
                style={{ maxWidth: '100%' }}
            >
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="h-[32px] w-full px-4 border border-blue-400 rounded-[2px] focus:outline-none"
                        value={searchTerm}
                        onChange={handleSearch}
                        onClick={e => e.stopPropagation()}
                        placeholder={`Search ${field}...`}
                        autoFocus
                    />
                ) : (
                    <div 
                        className="h-[32px] w-full flex items-center px-4 cursor-pointer border border-[#d9d9d9] rounded-[2px] hover:border-blue-400 transition-colors duration-200"
                        onClick={handleClick}
                >
                        <div className="flex-1 truncate text-sm">
                            {selectedOption?.label || `Select ${field}...`}
                        </div>
                    </div>
                )}
                {isOpen && createPortal(
                    <div 
                        className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[9999]"
                        style={{
                            width: cellRef.current?.offsetWidth,
                            ...(dropdownPosition === 'bottom' 
                                ? {
                                    top: (cellRef.current?.getBoundingClientRect().bottom || 0) + window.scrollY,
                                    marginTop: '1px'
                                }
                                : {
                                    bottom: window.innerHeight - ((cellRef.current?.getBoundingClientRect().top || 0) + window.scrollY),
                                    marginBottom: '1px'
                                }),
                            left: (cellRef.current?.getBoundingClientRect().left || 0) + window.scrollX
                        }}
                        onClick={e => e.stopPropagation()}
                >
                        <div className="max-h-48 overflow-y-auto">
                            {filteredOptions.map(option => (
                            <div
                                key={option.value}
                                    className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer truncate"
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    const QueryCellRenderer = (props: any) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(props.value);
        const inputRef = useRef<HTMLInputElement>(null);
        const field = props.column.colId;

        // Calculate width for query field
        useEffect(() => {
            const textMeasure = document.createElement('span');
            textMeasure.style.visibility = 'hidden';
            textMeasure.style.position = 'absolute';
            textMeasure.style.whiteSpace = 'nowrap';
            textMeasure.style.fontSize = '14px';
            textMeasure.textContent = value;
            document.body.appendChild(textMeasure);
            
            const width = textMeasure.getBoundingClientRect().width + 80;
            document.body.removeChild(textMeasure);
            updateColumnWidth(field, width);
        }, [value, field]);

        const handleClick = () => {
            setIsEditing(true);
        };

        const handleBlur = () => {
            setIsEditing(false);
            if (value !== props.value) {
                const validation = validateQuery(value);
                if (validation.isValid) {
                    props.setValue(value);
                } else {
                    setValue(props.value);
                    show(
                        <div className="text-red-500">
                            <p>{validation.message}</p>
                        </div>,
                        { type: 'error', position: 'top-right' }
                    );
                }
            }
        };

        useEffect(() => {
            if (isEditing && inputRef.current) {
                inputRef.current.focus();
            }
        }, [isEditing]);

        const columnWidth = columnWidths.current[field] || 200;

        return (
            <div className="w-full h-full flex items-center justify-center px-3">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="h-[32px] w-full px-4 border border-blue-400 rounded-[2px] focus:outline-none"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onBlur={handleBlur}
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <div
                        className="h-[32px] w-full flex items-center px-4 cursor-pointer border border-[#d9d9d9] rounded-[2px] hover:border-blue-400 transition-colors duration-200"
                        onClick={handleClick}
                    >
                        <span className="truncate text-sm">{value}</span>
                    </div>
                )}
            </div>
        );
    };

    const columnDefs: ColDef[] = [
        { 
            field: 'query', 
            headerName: 'Query', 
            flex: 1,
            minWidth: 150,
            headerClass: 'ag-header-cell-with-separator',
            cellRenderer: QueryCellRenderer,
            suppressSizeToFit: false
        },
        { 
            field: 'vertical', 
            headerName: 'Vertical', 
            flex: 1,
            minWidth: 120,
            headerClass: 'ag-header-cell-with-separator',
            cellRenderer: SelectCellRenderer,
            suppressSizeToFit: false
        },
        { 
            field: 'language', 
            headerName: 'Language', 
            flex: 1,
            minWidth: 120,
            headerClass: 'ag-header-cell-with-separator',
            cellRenderer: SelectCellRenderer,
            suppressSizeToFit: false
        },
        { 
            field: 'locale', 
            headerName: 'Locale', 
            flex: 1,
            minWidth: 150,
            headerClass: 'ag-header-cell-with-separator',
            cellRenderer: SelectCellRenderer,
            suppressSizeToFit: false
        },
        { 
            field: 'specialCategory', 
            headerName: 'Special Category', 
            flex: 1,
            minWidth: 150,
            headerClass: 'ag-header-cell-with-separator',
            cellRenderer: QueryCellRenderer,
            suppressSizeToFit: false
        }
    ];

    const defaultColDef = {
        resizable: true,
        sortable: true,
        filter: false,
        suppressSizeToFit: false,
        autoHeight: true
    };

    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .ag-header-cell-with-separator::after {
                content: '';
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 1px;
                height: 22px;
                background-color: #f0f0f0;
            }
            .ag-theme-quartz {
                --ag-borders: none;
                --ag-borders-secondary: none;
                --ag-header-column-separator-display: none;
                --ag-border-color: transparent;
                --ag-row-height: 55px;
                --ag-header-height: 55px;
                --ag-row-border-width: 0;
                --ag-cell-horizontal-border: none;
                width: 100% !important;
                height: 100% !important;
            }
            .ag-theme-quartz .ag-root-wrapper {
                border: none;
            }
            .ag-theme-quartz .ag-center-cols-container {
                width: 100% !important;
            }
            .ag-theme-quartz .ag-header-cell-label {
                justify-content: center !important;
                width: 100% !important;
            }
            .ag-theme-quartz .ag-header-cell {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .ag-theme-quartz .ag-row {
                border: none !important;
                width: 100% !important;
            }
            .ag-theme-quartz .ag-cell {
                border: none !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .ag-theme-quartz .ag-cell-wrapper {
                width: 100% !important;
            }
            .ag-theme-quartz .ag-header-viewport,
            .ag-theme-quartz .ag-header-row,
            .ag-theme-quartz .ag-header {
                width: 100% !important;
            }
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    // Remove getCurrentPageData function
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const total = Math.ceil(rowData.length / pageSize);
        setTotalPages(Math.max(1, total));
    }, [rowData, pageSize]);

    const onPageChange = (page: number) => {
        setCurrentPage(page);
    };

    const validateQuery = (query: string): { isValid: boolean; message?: string } => {
        const trimmed = query.trim();
        const normalized = trimmed.replace(/\s+/g, ' ');
        
        if (!normalized) return { isValid: false, message: 'Query cannot be empty' };
        if (normalized.length < 3) return { isValid: false, message: 'Query must be at least 3 characters long' };
        if (/[<>{}[\]\\]/.test(normalized)) return { isValid: false, message: 'Query contains invalid special characters' };
        if (rowData.some(row => row.query.trim().toLowerCase() === normalized.toLowerCase())) {
            return { isValid: false, message: 'This keyword already exists' };
        }

        return { isValid: true };
    };

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (mode === 'bulk') {
            const queries = searchQueries
                .split('\n')
                .map(q => q.trim())
                .filter(Boolean);

            if (!queries.length) {
                newErrors.searchQueries = 'At least one query is required';
            } else {
                const invalidQueries = queries
                    .map(query => {
                        const validation = validateQuery(query);
                        return !validation.isValid ? `"${query}" - ${validation.message}` : null;
                    })
                    .filter(Boolean);

                if (invalidQueries.length) {
                    newErrors.searchQueries = invalidQueries.join('\n');
                }
            }

            if (!selectedVertical.length) newErrors.vertical = 'Please select a vertical';
            if (!selectedLanguage.length) newErrors.language = 'Please select a language';
            if (!selectedLocale.length) newErrors.locale = 'Please select a locale';
        } else {
            const invalidRows = rowData
                .map((row, index) => {
                    const validation = validateQuery(row.query);
                    if (!validation.isValid) return `Row ${index + 1}: ${validation.message}`;
                    if (!row.vertical || !row.language || !row.locale) {
                        return `Row ${index + 1}: All fields are required`;
                    }
                    return null;
                })
                .filter(Boolean);

            if (invalidRows.length) {
                newErrors.searchQueries = invalidRows.join('\n');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCellValueChanged = (params: any) => {
    };

    const handleSubmit = async () => {
        if (!validateForm() || isSubmitting) return;

        try {
            setIsSubmitting(true);

            if (mode === 'bulk') {
                const queries = searchQueries
                    .split('\n')
                    .map(q => q.trim())
                    .filter(q => validateQuery(q).isValid);

                const newKeywords = queries.map(query => ({
                    query: query.trim(),
                    vertical: selectedVertical[0],
                    language: selectedLanguage[0],
                    locale: selectedLocale[0],
                    specialCategory: specialCategory || 'None'
                }));

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                setRowData(prev => [...prev, ...newKeywords]);

                // Clear form
                setSearchQueries('');
                setSelectedVertical([]);
                setSelectedLanguage([]);
                setSelectedLocale([]);
                setSpecialCategory('None');
                
                show(
                    <div className="flex flex-col items-center text-center">
                        <h4 className="text-lg font-semibold mb-2">Success</h4>
                        <p className="text-gray-700">Added {queries.length} keywords</p>
                    </div>,
                    { type: 'success', position: 'top-right' }
                );

                onAdd?.();
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
                show(
                    <div className="flex flex-col items-center text-center">
                        <h4 className="text-lg font-semibold mb-2">Success</h4>
                        <p className="text-gray-700">Changes saved successfully</p>
                    </div>,
                    { type: 'success', position: 'top-right' }
                );

            onEdit?.();
            }
        } catch (error) {
            show(
                <div className="text-red-500">
                    <p>Failed to {mode === 'bulk' ? 'add keywords' : 'save changes'}. Please try again.</p>
                </div>,
                { type: 'error', position: 'top-right' }
            );
        } finally {
            setIsSubmitting(false);
            setErrors({});
        }
    };

    const handleModeChange = (newMode: Mode) => {
        if (isSubmitting) return;
        setMode(newMode);
        setErrors({});
        navigate(`../${newMode === 'bulk' ? 'add' : 'edit'}`, { replace: true });
    };

    return (
        <PageContainer
            title='Add Keyword'
            leftElement={
                <div className="flex flex-col gap-4">
                    <GoBackButton text="Keywords Bank" path="/keywords" />
                <div className="flex items-center gap-4">
                    <button
                            className={`text-sm pb-2 ${mode === 'bulk' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-black'}`}
                        onClick={() => handleModeChange('bulk')}
                        disabled={isSubmitting}
                    >
                        Bulk Add
                    </button>
                    <button
                            className={`text-sm pb-2 ${mode === 'individual' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-black'}`}
                        onClick={() => handleModeChange('individual')}
                        disabled={isSubmitting}
                    >
                        Individual Edit
                    </button>
                    </div>
                </div>
            }
            rightElement={
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
            }
            bottomElement={
                <div className="flex items-center justify-end h-[32px]">
                    <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-6 h-[calc(100vh-380px)] overflow-auto">
                {mode === 'bulk' ? (
                    <>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Search Queries</label>
                            <div className="relative">
                                <textarea
                                    value={searchQueries}
                                    onChange={(e) => {
                                        setSearchQueries(e.target.value);
                                        setErrors(prev => ({ ...prev, searchQueries: undefined }));
                                    }}
                                    maxLength={100}
                                    placeholder="Enter your search queries (one per line)"
                                    className={`w-full p-2 border rounded min-h-[100px] max-h-[250px] resize-y ${
                                        errors.searchQueries ? 'border-red-500' : ''
                                    }`}
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                                    {searchQueries.length}/100
                                </div>
                            </div>
                            {errors.searchQueries && (
                                <p className="text-red-500 text-sm">{errors.searchQueries}</p>
                            )}
                        </div>
                        <div className="flex gap-6 justify-between">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Vertical</label>
                                <div className="min-h-[40px] select-container">
                                    <Select
                                        id="vertical"
                                        options={verticalOptions}
                                        value={selectedVertical}
                                        onChange={(values: string[]) => {
                                            setSelectedVertical(values);
                                            setErrors(prev => ({ ...prev, vertical: undefined }));
                                        }}
                                        multipleSelect={true}
                                        placeholder="Select vertical..."
                                        error={errors.vertical}
                                        showSearchBar={true}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Landing Page Locale</label>
                                <div className="min-h-[40px] select-container">
                                    <Select
                                        id="locale"
                                        options={localeOptions}
                                        value={selectedLocale}
                                        onChange={(values: string[]) => {
                                            setSelectedLocale(values);
                                            setErrors(prev => ({ ...prev, locale: undefined }));
                                        }}
                                        multipleSelect={true}
                                        placeholder="Select locale..."
                                        error={errors.locale}
                                        showSearchBar={true}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Target Language</label>
                                <div className="min-h-[40px] select-container">
                                    <Select
                                        id="language"
                                        options={languageOptions}
                                        value={selectedLanguage}
                                        onChange={(values: string[]) => {
                                            setSelectedLanguage(values);
                                            setErrors(prev => ({ ...prev, language: undefined }));
                                        }}
                                        multipleSelect={true}
                                        placeholder="Select language..."
                                        error={errors.language}
                                        showSearchBar={true}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Special Ad Category</label>
                                <TableSearchBar
                                    id="special-category"
                                    onInput={(e) => setSpecialCategory(e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-[calc(100vh-300px)] ag-theme-quartz">
                        <AgGridReact
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            animateRows={true}
                            suppressCellFocus={false}
                            enableCellTextSelection={true}
                            suppressColumnVirtualisation={true}
                            rowHeight={48}
                            headerHeight={48}
                            onCellValueChanged={handleCellValueChanged}
                            pagination={true}
                            paginationPageSize={pageSize}
                            suppressPaginationPanel={true}
                            suppressMovableColumns={true}
                            domLayout="normal"
                            theme="legacy"
                        />
                    </div>
                )}
            </div>
            <NotificationContainer />
        </PageContainer>
    );
};

export default AddKeyword; 