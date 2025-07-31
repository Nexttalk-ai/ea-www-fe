import { useState, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

import { domainService } from '../../services/domainService';
import { Domain } from '../../types/types';
import { FaGlobe } from 'react-icons/fa6';
import { Modal } from '../ui/Modal';
import { useNotification } from '../../hooks/useNotification';
import Button from '../ui/Button';
import ViewButton from '../ui/ViewButton';
import DotButton from '../ui/DotButton';
import { EditButton, DeleteButton } from '../ui/Actions';
import Input from '../ui/Input';
import TableSearchBar from '../ui/TableSearchBar';
import CustomPagination from '../ui/CustomPagination';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import PageContainer from '../ui/PageContainer';

ModuleRegistry.registerModules([AllCommunityModule]);

type ModalMode = 'add' | 'edit';

type TableTheme = {
    gridTheme: string;
    isDarkMode: boolean;
}

const tableTheme: TableTheme = {
    gridTheme: 'ag-theme-quartz',
    isDarkMode: false
}

const themeClass: string = tableTheme.isDarkMode ? `${tableTheme.gridTheme}-dark` : tableTheme.gridTheme;

type DomainData = {
    name: string;
    domain_url: string;
    status: 'ENABLED' | 'DISABLED';
};

type DomainValidationError = {
    name?: boolean;
    domain_url?: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RETRY_DELAY = 1000;

const DomainsTable = () => {
    const [rowData, setRowData] = useState<Domain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('add');
    const [formData, setFormData] = useState<Partial<Domain>>({
        name: '',
        domain_url: '',
        status: 'ENABLED'
    });
    const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const { show, NotificationContainer } = useNotification();
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

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
            const totalPages = gridApi.paginationGetTotalPages();
            setCurrentPage(currentPage);
            setTotalPages(Math.max(1, totalPages));
        }
    };

    useEffect(() => {
        if (gridApi) {
            gridApi.sizeColumnsToFit();
            const totalPages = gridApi.paginationGetTotalPages();
            setTotalPages(Math.max(1, totalPages));
        }
    }, [gridApi, rowData]);

    const onPageChange = (page: number) => {
        if (gridApi) {
            gridApi.paginationGoToPage(page - 1);
            setCurrentPage(page);
        }
    };

    const [quickFilterText, setQuickFilterText] = useState<string>();
    const [errors, setErrors] = useState<DomainValidationError>({});

    const onFilterTextBoxChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const filterValue = e.target.value;
        setQuickFilterText(filterValue);
    }, []);

    const fetchDomains = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const domains = await domainService.list();
            setRowData(domains);
        } catch (err) {
            setError('Failed to fetch domains. Please try again.');
            console.error('Error fetching domains:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setShowStatusDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (gridApi && rowData.length > 0) {
            const totalPages = gridApi.paginationGetTotalPages();
            setTotalPages(Math.max(1, totalPages));
        }
    }, [gridApi, rowData]);

    const handleEdit = (domain: Domain) => {
        setFormData({
            id: domain.id,
            name: domain.name,
            domain_url: domain.domain_url,
            status: domain.status
        });
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDelete = (domain: Domain) => {
        setDomainToDelete(domain);
        setShowConfirmDelete(true);
    };

    const handleInputChange = (field: keyof Domain, value: string | 'ENABLED' | 'DISABLED') => {
        setFormData((prev: Partial<Domain>) => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const newErrors: DomainValidationError = {};
        
        if (!formData.name?.trim()) newErrors.name = true;
        if (!formData.domain_url?.trim()) newErrors.domain_url = true;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const showNotificationModal = (message: string, type: 'success' | 'error', operation: 'add' | 'edit' | 'delete' = 'add') => {
        const title = operation === 'add' ? 'Add Domain' : operation === 'edit' ? 'Edit Domain' : 'Delete Domain';
        
        const successMessage = operation === 'add' ? 'Domain successfully created' : 
                             operation === 'edit' ? 'Domain successfully updated' : 
                             'Domain successfully deleted';
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
        if (!domainToDelete) return;
        
        try {
            setIsLoading(true);
            await domainService.delete(domainToDelete.id);
            showNotificationModal('', 'success', 'delete');
            await fetchDomains();
            setShowConfirmDelete(false);
            setDomainToDelete(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete domain';
            showNotificationModal(errorMessage, 'error', 'delete');
        } finally {
            setIsLoading(false);
        }
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
                        name: formData.name!.trim(),
                        domain_url: formData.domain_url!.trim(),
                        status: formData.status || 'ENABLED'
                    };
                    await domainService.create(createData);
                    showNotificationModal('', 'success', modalMode);
                    await fetchDomains();
                    setIsModalOpen(false);
                    setFormData({ name: '', domain_url: '', status: 'ENABLED' });
                    setErrors({});
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to create domain';
                    showNotificationModal(errorMessage, 'error', modalMode);
                }
            } else {
                if (!formData.id) {
                    throw new Error('Domain ID is missing');
                }
                const updateData = {
                    id: formData.id,
                    name: formData.name?.trim(),
                    domain_url: formData.domain_url?.trim(),
                    status: formData.status
                };
                await domainService.update(updateData);
                showNotificationModal('', 'success', modalMode);
                await fetchDomains();
                setIsModalOpen(false);
                setFormData({ name: '', domain_url: '', status: 'ENABLED' });
                setErrors({});
            }
        } catch (err) {
            console.error('Error handling domain:', err);
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            showNotificationModal(errorMessage, 'error', modalMode);
        } finally {
            setIsLoading(false);
        }
    };

    const columnDefs: ColDef[] = [
        { 
            field: 'id', 
            headerName: 'ID', 
            sortable: true, 
            filter: false,
            flex: 1,
            minWidth: 160,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'name', 
            headerName: 'Domain Name', 
            sortable: true, 
            filter: false,
            flex: 1,
            minWidth: 120,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'domain_url', 
            headerName: 'Domain URL', 
            sortable: true, 
            filter: false,
            flex: 1.5,
            minWidth: 180,
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            field: 'status',
            headerName: 'Status',
            sortable: true,
            filter: false,
            flex: 1,
            minWidth: 100,
            headerClass: 'ag-header-cell-with-separator',
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
          }
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            sortable: true,
            filter: false,
            flex: 1,
            minWidth: 140,
            headerClass: 'ag-header-cell-with-separator',
            valueFormatter: (params) => {
                if (!params.value) return '';
                const date = new Date(params.value);
                return date.toLocaleString();
            }
        },
        {
            field: 'actions',
            headerName: '',
            sortable: false,
            filter: false,
            width: 100,
            minWidth: 100,
            cellRenderer: (params: any) => (
                <div className="flex justify-end items-center gap-2 w-full h-full px-2">
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
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    return (
        <PageContainer
            title="Domains"
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
                            name: '',
                            domain_url: '',
                            status: 'ENABLED'
                        });
                        setIsModalOpen(true);
                    }}
                    className="bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                >
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
                        <FaGlobe className="mb-2 w-8 h-8" />
                        <h2 className="text-xl font-semibold">
                            {modalMode === 'add' ? 'Create a new domain' : 'Edit domain'}
                        </h2>
                    </div>
                </Modal.Header>

                <Modal.Body className="border-none">
                    <div className="flex flex-col gap-4">
                        <Input
                            type="text"
                            label="Domain Name"
                            placeholder="Domain name"
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        <Input
                            type="text"
                            label="Domain URL"
                            placeholder="example.com"
                            value={formData.domain_url || ''}
                            onChange={(e) => handleInputChange('domain_url', e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            className={errors.domain_url ? 'border-red-500' : ''}
                        />
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-black">Status</label>
                            <div className="relative" ref={statusDropdownRef}>
                                <div 
                                    className="flex items-center p-2 border rounded-md bg-white min-h-[42px] cursor-pointer"
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className={`w-2 h-2 rounded-full ${
                                            formData.status === 'ENABLED' ? 'bg-green-500' : 'bg-gray-400'
                                        }`}
                                    />
                                        <span className="text-black">{formData.status === 'ENABLED' ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                </div>
                                {showStatusDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                                        <div
                                            className="px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-black"
                                            onClick={() => {
                                                handleInputChange('status', 'ENABLED');
                                                setShowStatusDropdown(false);
                                            }}
                                        >
                                            Enabled
                                        </div>
                                        <div
                                            className="px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-black"
                                            onClick={() => {
                                                handleInputChange('status', 'DISABLED');
                                                setShowStatusDropdown(false);
                                            }}
                                        >
                                            Disabled
                                        </div>
                                    </div>
                                )}
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
                onClose={() => setShowConfirmDelete(false)}
                onConfirm={confirmDelete}
                title="Delete Domain"
                message="Are you sure you want to delete this domain?"
            />

            <NotificationContainer />
        </PageContainer>
    );
};

export default DomainsTable; 