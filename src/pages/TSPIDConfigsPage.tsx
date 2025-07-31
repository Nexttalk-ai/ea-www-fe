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
import { Modal } from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

ModuleRegistry.registerModules([AllCommunityModule]);

type ModalMode = 'add' | 'edit';

type TSPIDData = {
    id: string;
    organization_id: string;
    revshare_coefficient: number | null;
    status: 'ENABLED' | 'DISABLED';
};

type TSPIDValidationError = {
    id?: boolean;
    organization_id?: boolean;
    revshare_coefficient?: boolean;
};

const TSPIDConfigsPage = () => {
    const [rowData, setRowData] = useState<TSPID[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('add');
    const [formData, setFormData] = useState<Partial<TSPID>>({
        id: '',
        organization_id: '',
        revshare_coefficient: null,
        status: 'ENABLED'
    });
    const [errors, setErrors] = useState<TSPIDValidationError>({});
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
        setFormData({
            id: tspid.id,
            organization_id: tspid.organization_id,
            revshare_coefficient: tspid.revshare_coefficient,
            status: tspid.status
        });
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDelete = (tspid: TSPID) => {
        setTspidToDelete(tspid);
        setShowConfirmDelete(true);
    };

    const handleView = (tspid: TSPID) => {
        navigate(`/tspid/${tspid.id}`);
    };

    const handleInputChange = (field: keyof TSPID, value: any) => {
        setFormData((prev: Partial<TSPID>) => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const newErrors: TSPIDValidationError = {};
        
        if (!formData.id?.trim()) newErrors.id = true;
        if (!formData.organization_id?.trim()) newErrors.organization_id = true;
        if (formData.revshare_coefficient !== null && formData.revshare_coefficient !== undefined && formData.revshare_coefficient < 0) newErrors.revshare_coefficient = true;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const showNotificationModal = (message: string, type: 'success' | 'error', operation: 'add' | 'edit' | 'delete' = 'add') => {
        const title = operation === 'add' ? 'Add TSPID Config' : operation === 'edit' ? 'Edit TSPID Config' : 'Delete TSPID Config';
        
        const successMessage = operation === 'add' ? 'TSPID configuration successfully created' : 
                             operation === 'edit' ? 'TSPID configuration successfully updated' : 
                             'TSPID configuration successfully deleted';
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

    const handleSubmit = async () => {
        try {
            if (!validateForm()) {
                showNotificationModal('Please correct the errors before submitting', 'error', modalMode);
                return;
            }

            setIsLoading(true);
            if (modalMode === 'add') {
                try {
                    const createData = {
                        id: formData.id!.trim(),
                        organization_id: formData.organization_id!.trim(),
                        revshare_coefficient: formData.revshare_coefficient || undefined,
                        status: formData.status || 'ENABLED'
                    };
                    await tspidService.create(createData);
                    showNotificationModal('', 'success', modalMode);
                    await fetchTSPIDs();
                    setIsModalOpen(false);
                    setFormData({ id: '', organization_id: '', revshare_coefficient: null, status: 'ENABLED' });
                    setErrors({});
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to create TSPID configuration';
                    showNotificationModal(errorMessage, 'error', modalMode);
                }
            } else {
                if (!formData.id) {
                    throw new Error('TSPID ID is missing');
                }
                const updateData = {
                    id: formData.id,
                    organization_id: formData.organization_id?.trim(),
                    revshare_coefficient: formData.revshare_coefficient || undefined,
                    status: formData.status
                };
                await tspidService.update(updateData);
                showNotificationModal('', 'success', modalMode);
                await fetchTSPIDs();
                setIsModalOpen(false);
                setFormData({ id: '', organization_id: '', revshare_coefficient: null, status: 'ENABLED' });
                setErrors({});
            }
        } catch (err) {
            console.error('Error handling TSPID:', err);
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            showNotificationModal(errorMessage, 'error', modalMode);
        } finally {
            setIsLoading(false);
        }
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
            field: 'id',
            headerName: 'TSPID',
            sortable: true,
            filter: true,
            flex: 1,
            minWidth: 120,
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            field: 'organization_id',
            headerName: 'Organization ID',
            sortable: true,
            filter: true,
            flex: 2,
            minWidth: 200,
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            field: 'revshare_coefficient',
            headerName: 'Revshare Coefficient',
            sortable: true,
            filter: true,
            flex: 1,
            minWidth: 150,
            cellRenderer: (params: any) => {
                return params.value !== null ? params.value : 'N/A';
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            field: 'status',
            headerName: 'Status',
            sortable: true,
            filter: true,
            flex: 1,
            minWidth: 120,
            cellRenderer: (params: any) => {
                return (
                    <div className="flex items-center gap-2">
                        <div 
                            className={`w-2 h-2 rounded-full ${
                            params.value === 'ENABLED' ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                    />
                    <span>{params.value === 'ENABLED' ? 'Enabled' : 'Disabled'}</span>
                </div>
            )
          },
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
                        onClick={() => {
                            setFormData({
                                id: '',
                                organization_id: '',
                                revshare_coefficient: null,
                                status: 'ENABLED'
                            });
                            setModalMode('add');
                            setIsModalOpen(true);
                        }}
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

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    classNameBackground="bg-black/50"
                    classNameModal="fixed w-[460px] h-[569px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                    <Modal.Header className="relative border-none">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="flex flex-col items-center">
                            <FaRegFileCode className="mb-2 w-8 h-8" />
                            <h2 className="text-xl font-semibold">
                                {modalMode === 'add' ? 'Create a new TSPID configuration' : 'Edit TSPID configuration'}
                            </h2>
                        </div>
                    </Modal.Header>

                    <Modal.Body className="border-none">
                        <div className="flex flex-col gap-4">
                            <Input
                                type="text"
                                label="TSPID"
                                placeholder="Enter TSPID"
                                value={formData.id || ''}
                                onChange={(e) => handleInputChange('id', e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                className={errors.id ? 'border-red-500' : ''}
                            />
                            <Input
                                type="text"
                                label="Organization ID"
                                placeholder="Enter organization ID"
                                value={formData.organization_id || ''}
                                onChange={(e) => handleInputChange('organization_id', e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                className={errors.organization_id ? 'border-red-500' : ''}
                            />
                            <Input
                                type="number"
                                label="Revshare Coefficient"
                                placeholder="Enter coefficient (optional)"
                                value={formData.revshare_coefficient || ''}
                                onChange={(e) => handleInputChange('revshare_coefficient', e.target.value ? parseFloat(e.target.value) : null)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                className={errors.revshare_coefficient ? 'border-red-500' : ''}
                            />
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-black">Status</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={formData.status === 'ENABLED'}
                                            onChange={() => handleInputChange('status', 'ENABLED')}
                                            className="mr-2"
                                        />
                                        <span className="text-black">Enabled</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={formData.status === 'DISABLED'}
                                            onChange={() => handleInputChange('status', 'DISABLED')}
                                            className="mr-2"
                                        />
                                        <span className="text-black">Disabled</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>

                    <Modal.Footer className="border-none">
                        <div className="flex justify-center w-full">
                            <Button
                                className="w-[114px] h-[40px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] gap-[10px] bg-white text-black hover:text-gray-600"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : modalMode === 'add' ? 'Add' : 'Save'}
                            </Button>
                        </div>
                    </Modal.Footer>
                </Modal>

                <DeleteConfirmationModal
                    isOpen={showConfirmDelete}
                    onClose={() => {
                        setShowConfirmDelete(false);
                        setTspidToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Delete TSPID Configuration"
                    message={`Are you sure you want to delete the TSPID configuration "${tspidToDelete?.id}"? This action cannot be undone.`}
                    isLoading={isLoading}
                />

                <NotificationContainer />
            </PageContainer>
        </HomeLayout>
    );
};

export default TSPIDConfigsPage; 