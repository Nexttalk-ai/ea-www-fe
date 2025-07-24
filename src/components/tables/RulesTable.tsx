import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { AllCommunityModule, ModuleRegistry, SizeColumnsToFitGridStrategy } from "ag-grid-community";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { rulesService, Rule } from '../../services/rulesService';
import { FaRegFileCode } from 'react-icons/fa6';
import Button from '../ui/Button';
import ViewButton from '../ui/ViewButton';
import EditButton from '../ui/EditButton';
import CustomPagination from '../ui/CustomPagination';
import { useNavigate } from 'react-router-dom';

ModuleRegistry.registerModules([AllCommunityModule]);

interface TableTheme {
    gridTheme: string;
    isDarkMode: boolean;
}

const tableTheme: TableTheme = {
    gridTheme: 'ag-theme-quartz',
    isDarkMode: false
};

const themeClass: string = tableTheme.isDarkMode ? `${tableTheme.gridTheme}-dark` : tableTheme.gridTheme;

const RulesTable = () => {
    const navigate = useNavigate();
    const [rowData, setRowData] = useState<Rule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const gridApiRef = useRef<GridApi | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const totalPages = Math.max(1, Math.ceil(rowData.length / rowsPerPage));

    const calculateRowsPerPage = () => {
        const headerHeight = 55;
        const paginationHeight = 48;
        const rowHeight = 55;
        
        const windowHeight = window.innerHeight;
        const availableHeight = windowHeight - (headerHeight + paginationHeight);
        const calculatedRows = Math.floor(availableHeight / rowHeight);
        
        return Math.max(5, calculatedRows);
    };

    useEffect(() => {
        const handleResize = () => {
            setRowsPerPage(calculateRowsPerPage());
        };

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const onPageChange = (page: number) => {
        setCurrentPage(page);
        if (gridApiRef.current) {
            gridApiRef.current.paginationGoToPage(page - 1);
        }
    };

    const onGridReady = useCallback((params: GridReadyEvent) => {
        gridApiRef.current = params.api;
    }, []);

    const autoSizeStrategy = useMemo<SizeColumnsToFitGridStrategy>(
        () => ({
            type: "fitGridWidth",
        }),
        []
    );

    const fetchRules = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const rules = await rulesService.list();
            setRowData(rules);
        } catch (err) {
            setError('Failed to fetch rules. Please try again.');
            console.error('Error fetching rules:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);



    const columnDefs: ColDef[] = [
        {
            field: 'name',
            headerName: 'Rule Name',
            flex: 1,
            minWidth: 200,
            cellStyle: { whiteSpace: 'normal' },
            autoHeight: true,
        },
        {
            field: 's3_key',
            headerName: 'Storage Key',
            flex: 1,
            minWidth: 200,
            cellRenderer: (params: any) => {
                const key = params.value || '';
                const maxLength = 40;
                const displayKey = key.length > maxLength ? `${key.substring(0, maxLength)}...` : key;
                
                return (
                    <div 
                        className="text-sm font-mono text-gray-600 cursor-help"
                        title={key}
                    >
                        {displayKey}
                    </div>
                );
            },
            cellStyle: { 
                whiteSpace: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            },
            autoHeight: true,
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            flex: 1,
            minWidth: 150,
            valueFormatter: (params) => {
                return new Date(params.value).toLocaleDateString();
            }
        },
        {
            field: 'version',
            headerName: 'Version',
            flex: 1,
            minWidth: 100,
            cellRenderer: (params: any) => (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    v{params.value}
                </span>
            )
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 120,
            filter: false,
            cellRenderer: (params: any) => (
                <div className="flex justify-center items-center gap-2 w-full h-full px-2">
                    <ViewButton path={`/rules/${params.data.id}`} />
                    <EditButton id={params.data.id} path="/rules"/>
                </div>
            ),
            cellStyle: { 
                overflow: 'visible',
                display: 'flex',
                alignItems: 'center',
                padding: '0'
            }
        }
    ];

    const defaultColDef = {
        resizable: true,
        sortable: true,
        filter: true,
        wrapText: true,
        autoHeight: true,
        cellClass: 'cell-wrap-text'
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Rules</h1>
                    <p className="text-gray-600 text-sm">
                        Manage your rules and their configurations
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/rules/add-rule')}
                    className="flex items-center gap-2"
                >
                    <FaRegFileCode className="w-4 h-4" />
                    Add Rule
                </Button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                ) : (
                    <div>
                        <div className={`${themeClass} w-full`} style={{ height: rowsPerPage * 48 + 2 }}>
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                pagination={true}
                                paginationPageSize={rowsPerPage}
                                onGridReady={onGridReady}
                                autoSizeStrategy={autoSizeStrategy}
                                suppressPaginationPanel={true}
                                suppressScrollOnNewData={true}
                                theme="legacy"
                            />
                        </div>
                        {totalPages > 0 && (
                            <div className="mt-4 flex justify-end w-full">
                                <CustomPagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={onPageChange}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>


        </div>
    );
};

export default RulesTable; 