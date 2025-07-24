import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

import { tspidService } from '../services/tspidService';
import { TSPID } from '../types/types';
import { FaRegFileCode } from 'react-icons/fa';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/ui/Button';
import ViewButton from '../components/ui/ViewButton';
import DotButton from '../components/ui/DotButton';
import { EditButton, DeleteButton } from '../components/ui/Actions';
import TableSearchBar from '../components/ui/TableSearchBar';
import CustomPagination from '../components/ui/CustomPagination';
import { DeleteConfirmationModal } from '../components/ui/DeleteConfirmationModal';
import PageContainer from '../components/ui/PageContainer';
import HomeLayout from '../layouts/HomeLayout';

ModuleRegistry.registerModules([AllCommunityModule]);

const TSPIDConfigsPage = () => {
    const [rowData, setRowData] = useState<TSPID[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [tspidToDelete, setTspidToDelete] = useState<TSPID | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const { show, NotificationContainer } = useNotification();
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [quickFilterText, setQuickFilterText] = useState<string>();

    const calculateRowsPerPage = () => {
        const containerHeight = window.innerHeight - 350;
        const rowHeight = 55;
        const headerHeight = 55;
        const paginationHeight = 48;
        
        const availableHeight = containerHeight - headerHeight - paginationHeight;
        const calculatedRows = Math.floor(availableHeight / rowHeight);
        
        return Math.max(1, calculatedRows);
    };

    useEffect(() => {
        const handleResize = () => {
            if (gridApi) {
                const newRowsPerPage = calculateRowsPerPage();
                setRowsPerPage(newRowsPerPage);
                gridApi.paginationGoToPage(0);
                setTimeout(() => {
                    gridApi.setGridOption('paginationPageSize', newRowsPerPage);
                }, 0);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [gridApi]);

    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
        params.api.sizeColumnsToFit();
    };

    const onPaginationChanged = () => {
        if (gridApi) {
            const currentPage = gridApi.paginationGetCurrentPage() + 1;
            setCurrentPage(currentPage);
            const totalPages = gridApi.paginationGetTotalPages();
            setTotalPages(totalPages);
        }
    };

    const onPageChange = (page: number) => {
        if (gridApi) {
            gridApi.paginationGoToPage(page - 1);
        }
    };

    const fetchTSPIDs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await tspidService.list();
            setRowData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch TSPID configurations');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTSPIDs();
    }, []);

    const handleEdit = (tspid: TSPID) => {
        navigate(`/tspid/${tspid.id}`);
    };

    const handleDelete = (tspid: TSPID) => {
        setTspidToDelete(tspid);
        setShowConfirmDelete(true);
    };

    const handleView = (tspid: TSPID) => {
        navigate(`/tspid/${tspid.id}`);
    };

    const showNotificationModal = (message: string, type: 'success' | 'error', operation: 'delete' = 'delete') => {
        const title = 'Delete TSPID Config';
        const successMessage = 'TSPID configuration successfully deleted';
        const errorMessage = message || 'An error occurred while processing your request';
        
        show(
            <div className="flex flex-col items-center text-center">
                <h4 className="text-lg font-semibold mb-2">{title}</h4>
                <p className="text-gray-700">{type === 'success' ? successMessage : errorMessage}</p>
            </div>,
            {
                type,
                position: 'top-right'
            }
        );
    };

    const confirmDelete = async () => {
        if (!tspidToDelete) return;
        
        try {
            setIsLoading(true);
            await tspidService.delete(tspidToDelete.id);
            showNotificationModal('', 'success', 'delete');
            await fetchTSPIDs();
            setShowConfirmDelete(false);
            setTspidToDelete(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete TSPID configuration';
            showNotificationModal(errorMessage, 'error', 'delete');
        } finally {
            setIsLoading(false);
        }
    };

    const onFilterTextBoxChanged = useCallback((event: any) => {
        setQuickFilterText(event.target.value);
    }, []);

    const columnDefs: ColDef[] = [
        {
            field: 'tspid_value',
            headerName: 'TSPID Value',
            sortable: true,
            filter: true,
            flex: 2,
            minWidth: 200,
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            field: 'enabled',
            headerName: 'Status',
            sortable: true,
            filter: true,
            flex: 1,
            minWidth: 120,
            cellRenderer: (params: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {params.value ? 'Active' : 'Inactive'}
                </span>
            ),
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            field: 'generationMethod',
            headerName: 'Generation Method',
            sortable: true,
            filter: true,
            flex: 1.5,
            minWidth: 150,
            cellRenderer: (params: any) => {
                const method = params.value;
                const labels: { [key: string]: string } = {
                    'manual': 'Manual',
                    'auto': 'Auto',
                    'partner_feed': 'Partner Feed'
                };
                return labels[method] || method;
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            field: 'expiryDays',
            headerName: 'Expiry Days',
            sortable: true,
            filter: true,
            flex: 1,
            minWidth: 120,
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            sortable: true,
            filter: true,
            flex: 1.5,
            minWidth: 150,
            cellRenderer: (params: any) => {
                return params.value ? new Date(params.value).toLocaleDateString() : 'N/A';
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            headerName: 'Actions',
            sortable: false,
            filter: false,
            flex: 1,
            minWidth: 120,
            cellRenderer: (params: any) => (
                <div className="flex justify-end items-center gap-2 w-full h-full px-2">
                    <ViewButton path={`/tspid/${params.data.id}`} />
                    <DotButton>
                        <EditButton onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(params.data);
                        }} />
                        <DeleteButton onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(params.data);
                        }} />
                    </DotButton>
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
        cellClass: 'cell-wrap-text',
        suppressSizeToFit: false
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
                width: 100% !important;
                height: 100% !important;
            }
            .ag-theme-quartz .ag-root-wrapper {
                border: none;
            }
            .ag-theme-quartz .ag-center-cols-container {
                width: 100%;
            }
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    if (error) {
        return (
            <HomeLayout>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </HomeLayout>
        );
    }

    return (
        <HomeLayout>
            <PageContainer
                title="TSPID Configurations"
                leftElement={
                    <TableSearchBar
                        id="filter-text-box"
                        onInput={onFilterTextBoxChanged}
                        className="pl-10 pr-10 w-[300px] h-[36px] gap-[10px] border-0 bg-[#fafafa]"
                    />
                }
                rightElement={
                    <Button
                        onClick={() => navigate('/tspid/add-tspid')}
                        className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                    >
                        <FaRegFileCode />
                        Add
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
                <div className="flex flex-col h-[calc(100vh-276px)]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : (
                        <div className="flex-1 min-h-0 w-full ag-theme-quartz">
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                onGridReady={onGridReady}
                                onPaginationChanged={onPaginationChanged}
                                pagination={true}
                                paginationPageSize={rowsPerPage}
                                quickFilterText={quickFilterText}
                                suppressPaginationPanel={true}
                                animateRows={true}
                                suppressCellFocus={false}
                                enableCellTextSelection={true}
                                suppressColumnVirtualisation={true}
                                rowHeight={55}
                                headerHeight={55}
                                suppressHorizontalScroll={true}
                                theme="legacy"
                            />
                        </div>
                    )}
                </div>

                <DeleteConfirmationModal
                    isOpen={showConfirmDelete}
                    onClose={() => {
                        setShowConfirmDelete(false);
                        setTspidToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Delete TSPID Configuration"
                    message={`Are you sure you want to delete the TSPID configuration "${tspidToDelete?.tspid_value}"? This action cannot be undone.`}
                    isLoading={isLoading}
                />

                <NotificationContainer />
            </PageContainer>
        </HomeLayout>
    );
};

export default TSPIDConfigsPage; 