import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { ColDef, GridApi, GridReadyEvent, DomLayoutType } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { GiRecycle } from "react-icons/gi";
import * as XLSX from 'xlsx';

import DotButton from '../ui/DotButton';
import TableSearchBar from '../ui/TableSearchBar';
import CustomPagination from '../ui/CustomPagination';
import PageContainer from '../ui/PageContainer';
import Button from '../ui/Button';
import { Modal } from '../ui/Modal';
import Input from '../ui/Input';
import { useNotification } from '../../hooks/useNotification';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';

ModuleRegistry.registerModules([AllCommunityModule]);

type TableTheme = {
    gridTheme: string;
    isDarkMode: boolean;
}

interface RecycleCampaign {
    campaignName: string;
    campaignId: string;
    vertical: string;
    target: string;
    locale: string;
    type: string;
}

interface RecycleCampaignErrors {
    campaignName?: string;
    campaignId?: string;
    vertical?: string;
    target?: string;
    locale?: string;
    type?: string;
    general?: string;
}

interface RecycleCampaignResponse {
    success: boolean;
    message: string;
    campaignId?: string;
    error?: {
        code: string;
        details: string;
    };
}

const tableTheme: TableTheme = {
    gridTheme: 'ag-theme-quartz',
    isDarkMode: false
}

const themeClass: string = tableTheme.isDarkMode ? `${tableTheme.gridTheme}-dark` : tableTheme.gridTheme;

interface ActivityLog {
    timestamp: string;
    user: string;
    campaignId: string;
    actionType: string;
    status: string;
    message: string;
}

const ActivityLogTable = () => {
    const [rowData, setRowData] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [quickFilterText, setQuickFilterText] = useState<string>('');
    const [displayedRows, setDisplayedRows] = useState<ActivityLog[]>([]);
    const [isRecycleModalOpen, setIsRecycleModalOpen] = useState(false);
    const [showExportConfirmation, setShowExportConfirmation] = useState(false);
    const [recycleCampaignData, setRecycleCampaignData] = useState<RecycleCampaign>({
        campaignName: '',
        campaignId: '',
        vertical: '',
        target: '',
        locale: '',
        type: ''
    });
    const [formErrors, setFormErrors] = useState<RecycleCampaignErrors>({});
    const { show, NotificationContainer } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const calculateRowsPerPage = () => {
        const containerHeight = window.innerHeight - 350;
        const rowHeight = 55;
        const headerHeight = 55;
        const paginationHeight = 48;
        
        const availableHeight = containerHeight - headerHeight - paginationHeight;
        const calculatedRows = Math.floor(availableHeight / rowHeight);
        
        return Math.max(1, calculatedRows);
    };

    const updateDisplayedRows = useCallback((data: ActivityLog[], page: number, pageSize: number, searchText: string) => {
        const filteredData = searchText
            ? data.filter(row => 
                Object.values(row).some(value => 
                    String(value)
                        .toLowerCase()
                        .includes(searchText.toLowerCase().trim())
                )
            )
            : data;

        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        setDisplayedRows(filteredData.slice(start, end));
        const totalPages = Math.ceil(filteredData.length / pageSize);
        setCurrentPage(page > totalPages ? 1 : page);
    }, []);

    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
        params.api.sizeColumnsToFit();
    };

    useEffect(() => {
        if (gridApi) {
            gridApi.sizeColumnsToFit();
        }
    }, [gridApi, displayedRows]);

    const onPageChange = (page: number) => {
        setCurrentPage(page);
        updateDisplayedRows(rowData, page, rowsPerPage, quickFilterText);
    };

    const onFilterTextBoxChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const filterValue = e.target.value;
        setQuickFilterText(filterValue);
        updateDisplayedRows(rowData, 1, rowsPerPage, filterValue);
    }, [rowData, rowsPerPage, updateDisplayedRows]);

    useEffect(() => {
        updateDisplayedRows(rowData, currentPage, rowsPerPage, quickFilterText);
    }, [rowData, currentPage, rowsPerPage, quickFilterText, updateDisplayedRows]);

    // Mock data - replace with actual API call
    useEffect(() => {
        const mockData: ActivityLog[] = [
            {
                timestamp: '15/03/2024 09:30',
                user: 'John Doe',
                campaignId: 'CAMP-001',
                actionType: 'Create',
                status: 'Success',
                message: 'Successfully uploaded'
            },
            {
                timestamp: '14/03/2024 16:45',
                user: 'Jane Smith',
                campaignId: 'CAMP-002',
                actionType: 'Update',
                status: 'Failed',
                message: 'Failed to upload'
            },
            {
                timestamp: '14/03/2024 11:20',
                user: 'Mike Johnson',
                campaignId: 'CAMP-003',
                actionType: 'Delete',
                status: 'Success',
                message: 'Successfully uploaded'
            },
            {
                timestamp: '13/03/2024 14:15',
                user: 'Sarah Wilson',
                campaignId: 'CAMP-004',
                actionType: 'Create',
                status: 'Failed',
                message: 'Failed to upload'
            },
            {
                timestamp: '13/03/2024 10:05',
                user: 'Alex Brown',
                campaignId: 'CAMP-005',
                actionType: 'Update',
                status: 'Success',
                message: 'Successfully uploaded'
            },
            {
                timestamp: '12/03/2024 15:30',
                user: 'Emily Davis',
                campaignId: 'CAMP-006',
                actionType: 'Create',
                status: 'Success',
                message: 'Successfully uploaded'
            },
            {
                timestamp: '12/03/2024 09:45',
                user: 'Tom Anderson',
                campaignId: 'CAMP-007',
                actionType: 'Delete',
                status: 'Failed',
                message: 'Failed to upload'
            },
            {
                timestamp: '11/03/2024 13:50',
                user: 'Lisa Taylor',
                campaignId: 'CAMP-008',
                actionType: 'Update',
                status: 'Success',
                message: 'Successfully uploaded'
            }
        ];
        setRowData(mockData);
        updateDisplayedRows(mockData, 1, rowsPerPage, quickFilterText);
        setIsLoading(false);
    }, [rowsPerPage, quickFilterText, updateDisplayedRows]);

    useEffect(() => {
        const handleResize = () => {
            const newRowsPerPage = calculateRowsPerPage();
            setRowsPerPage(newRowsPerPage);
            updateDisplayedRows(rowData, currentPage, newRowsPerPage, quickFilterText);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [currentPage, rowData, quickFilterText, updateDisplayedRows]);

    const columnDefs: ColDef[] = [
        { 
            field: 'timestamp',
            headerName: 'Timestamp',
            sortable: true,
            filter: false,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'user',
            headerName: 'User',
            sortable: true,
            filter: false,
            headerClass: 'ag-header-cell-with-separator',
        },
        { 
            field: 'campaignId',
            headerName: 'Campaign ID',
            sortable: true,
            filter: false,
            headerClass: 'ag-header-cell-with-separator',
        },
        { 
            field: 'actionType',
            headerName: 'Action Type',
            sortable: true,
            filter: false,
            headerClass: 'ag-header-cell-with-separator',
        },
        { 
            field: 'status',
            headerName: 'Status',
            sortable: true,
            filter: false,
            headerClass: 'ag-header-cell-with-separator',
        },
        { 
            field: 'message',
            headerName: 'Message',
            sortable: true,
            filter: false
        },
        {
            headerName: '',
            field: 'actions',
            sortable: false,
            filter: false,
            width: 50,
            cellRenderer: (params: any) => (
                <DotButton>
                    <button
                        onClick={() => {
                            setRecycleCampaignData({
                                campaignName: '',
                                campaignId: params.data.campaignId,
                                vertical: '',
                                target: '',
                                locale: '',
                                type: ''
                            });
                            setIsRecycleModalOpen(true);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                    >
                        <GiRecycle className="text-black w-4 h-4" />
                        <span className="text-[14px]">Recycle Campaign</span>
                    </button>
                </DotButton>
            )
        }
    ];

    const handlePrint = useCallback(() => {
        if (gridApi) {
            const printContainer = document.createElement('div');
            printContainer.id = 'print-container';
            document.body.appendChild(printContainer);

            const title = document.createElement('div');
            title.className = 'print-title';
            title.textContent = 'Activity Log';

            const table = document.createElement('table');
            table.className = 'print-table';

            const tbody = document.createElement('tbody');
            rowData.forEach(row => {
                const tr = document.createElement('tr');
                columnDefs
                    .filter(col => col.field !== 'actions')
                    .forEach(col => {
                        const td = document.createElement('td');
                        td.textContent = row[col.field as keyof ActivityLog]?.toString() || '';
                        tr.appendChild(td);
                    });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            
            printContainer.appendChild(title);
            printContainer.appendChild(table);

            window.print();

            document.body.removeChild(printContainer);
        }
    }, [gridApi, columnDefs, rowData]);

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
            @media print {
                @page {
                    size: landscape;
                    margin: 20mm;
                }
                html, body {
                    height: 100%;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                body * {
                    visibility: hidden;
                }
                #print-container,
                #print-container * {
                    visibility: visible;
                }
                #print-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                .print-title {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 18px;
                    font-weight: bold;
                }
                .print-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                .print-table th,
                .print-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                .print-table tr {
                    page-break-inside: avoid;
                }
            }
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    const handleExport = () => {
        setShowExportConfirmation(true);
    };

    const confirmExport = () => {
        try {
            // Get all data from the grid
            const dataToExport = rowData.map(row => ({
                Timestamp: row.timestamp,
                User: row.user,
                'Campaign ID': row.campaignId,
                'Action Type': row.actionType,
                Status: row.status,
                Message: row.message
            }));

            // Create a new workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(dataToExport);

            // Add the worksheet to the workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Activity Log');

            // Generate the file name with current date
            const date = new Date();
            const fileName = `activity_log_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.xlsx`;

            // Save the file
            XLSX.writeFile(wb, fileName);

            // Show success notification
            show(
                <div className="flex flex-col items-center text-center">
                    <h4 className="text-lg font-semibold mb-2">Export Successful</h4>
                    <p className="text-gray-700">Activity log has been exported to Excel</p>
                </div>,
                { type: 'success', position: 'top-right' }
            );
        } catch (error) {
            console.error('Error exporting data:', error);
            show(
                <div className="flex flex-col items-center text-center">
                    <h4 className="text-lg font-semibold mb-2">Export Failed</h4>
                    <p className="text-gray-700">Failed to export activity log. Please try again.</p>
                </div>,
                { type: 'error', position: 'top-right' }
            );
        } finally {
            setShowExportConfirmation(false);
        }
    };

    const handleInputChange = (field: keyof RecycleCampaign, value: string) => {
        setRecycleCampaignData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for the field being changed
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const validateRecycleForm = () => {
        const newErrors: RecycleCampaignErrors = {};
        let isValid = true;

        const requiredFields: (keyof RecycleCampaign)[] = ['campaignName', 'vertical', 'target', 'locale', 'type'];
        
        requiredFields.forEach(field => {
            if (!recycleCampaignData[field].trim()) {
                newErrors[field] = 'Required field';
                isValid = false;
            }
        });

        setFormErrors(newErrors);
        return isValid;
    };

    const handleRecycle = async () => {
        if (!validateRecycleForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const mockResponse: RecycleCampaignResponse = {
                success: true,
                message: 'Campaign recycled successfully',
                campaignId: `RC-${Math.random().toString(36).substr(2, 9)}`
            };

            show(
                <div className="flex flex-col items-center text-center">
                    <h4 className="text-lg font-semibold mb-2">Successfully Recycled</h4>
                </div>,
                { type: 'success', position: 'top-right' }
            );
            setIsRecycleModalOpen(false);
            setRecycleCampaignData({
                campaignName: '',
                campaignId: '',
                vertical: '',
                target: '',
                locale: '',
                type: ''
            });
            fetchActivityLogs();
        } catch (error) {
            console.error('Error recycling campaign:', error);
            setFormErrors({
                ...formErrors,
                general: 'Failed to recycle campaign. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchActivityLogs = async () => {
        try {
            setIsLoading(true);
            const formatDate = (date: Date) => {
                return date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).replace(',', '');
            };

            const mockData: ActivityLog[] = [
                {
                    timestamp: formatDate(new Date()),
                    user: 'John Doe',
                    campaignId: 'CAMP-001',
                    actionType: 'Create',
                    status: 'Success',
                    message: 'Campaign created successfully'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 30 * 60000)), // 30 mins ago
                    user: 'Emma Wilson',
                    campaignId: 'CAMP-008',
                    actionType: 'Update',
                    status: 'Success',
                    message: 'Budget updated'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 2 * 60 * 60000)), // 2 hours ago
                    user: 'Alex Thompson',
                    campaignId: 'CAMP-015',
                    actionType: 'Recycle',
                    status: 'Success',
                    message: 'Campaign recycled with new settings'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 86400000)), // 1 day ago
                    user: 'Jane Smith',
                    campaignId: 'CAMP-002',
                    actionType: 'Update',
                    status: 'Success',
                    message: 'Campaign settings updated'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 100800000)), // ~28 hours ago
                    user: 'Robert Chen',
                    campaignId: 'CAMP-023',
                    actionType: 'Create',
                    status: 'Failed',
                    message: 'Invalid campaign parameters'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 172800000)), // 2 days ago
                    user: 'Mike Johnson',
                    campaignId: 'CAMP-003',
                    actionType: 'Recycle',
                    status: 'Success',
                    message: 'Campaign recycled successfully'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 180000000)), // ~50 hours ago
                    user: 'Sarah Davis',
                    campaignId: 'CAMP-019',
                    actionType: 'Update',
                    status: 'Success',
                    message: 'Target audience modified'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 259200000)), // 3 days ago
                    user: 'Sarah Wilson',
                    campaignId: 'CAMP-004',
                    actionType: 'Delete',
                    status: 'Failed',
                    message: 'Error deleting campaign'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 345600000)), // 4 days ago
                    user: 'David Miller',
                    campaignId: 'CAMP-011',
                    actionType: 'Create',
                    status: 'Success',
                    message: 'New campaign launched'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 432000000)), // 5 days ago
                    user: 'Lisa Anderson',
                    campaignId: 'CAMP-007',
                    actionType: 'Update',
                    status: 'Success',
                    message: 'Creative assets updated'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 518400000)), // 6 days ago
                    user: 'Tom Brown',
                    campaignId: 'CAMP-016',
                    actionType: 'Recycle',
                    status: 'Success',
                    message: 'Campaign duplicated with new locale'
                },
                {
                    timestamp: formatDate(new Date(Date.now() - 604800000)), // 7 days ago
                    user: 'Rachel Green',
                    campaignId: 'CAMP-025',
                    actionType: 'Delete',
                    status: 'Success',
                    message: 'Campaign archived successfully'
                }
            ];

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setRowData(mockData);
            updateDisplayedRows(mockData, currentPage, rowsPerPage, quickFilterText);
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            show(
                <div className="flex flex-col items-center text-center">
                    <h4 className="text-lg font-semibold mb-2">Error</h4>
                    <p className="text-gray-700">Failed to fetch activity logs. Please refresh the page.</p>
                </div>,
                { type: 'error', position: 'top-right' }
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivityLogs();
    }, []);

    return (
        <PageContainer
            title="Activity Log"
            leftElement={
                <TableSearchBar
                    id="filter-text-box"
                    onInput={onFilterTextBoxChanged}
                    className="pl-10 pr-10 w-[300px] h-[36px] gap-[10px] border-0 bg-[#fafafa]"
                />
            }
            rightElement={
                <div className="flex gap-2">
                    <Button
                        onClick={handleExport}
                        className="bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                    >
                        Export
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                    >
                        Print
                    </Button>
                </div>
            }
            bottomElement={
                <div className="flex items-center justify-end h-[32px]">
                    <CustomPagination
                        currentPage={currentPage}
                        totalPages={Math.max(1, Math.ceil(rowData.filter(row => 
                            !quickFilterText || Object.values(row).some(value => 
                                String(value)
                                    .toLowerCase()
                                    .includes(quickFilterText.toLowerCase().trim())
                            )
                        ).length / rowsPerPage))}
                        onPageChange={onPageChange}
                    />
                </div>
            }
        >
            <div className={`w-full h-[calc(100vh-350px)] ${themeClass}`}>
                <AgGridReact
                    rowData={displayedRows}
                    columnDefs={columnDefs}
                    onGridReady={onGridReady}
                    rowHeight={55}
                    headerHeight={55}
                    suppressCellFocus={true}
                    animateRows={true}
                    pagination={false}
                    theme="legacy"
                />
            </div>

            <Modal
                isOpen={isRecycleModalOpen}
                onClose={() => {
                    setIsRecycleModalOpen(false);
                    setFormErrors({});
                }}
                classNameBackground="bg-black/50"
                classNameModal="fixed w-[520px] h-[666px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
                <Modal.Header className="relative border-none pt-8">
                    <button 
                        onClick={() => setIsRecycleModalOpen(false)}
                        className="absolute right-4 top-6 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex flex-col items-center">
                        <h2 className="text-xl font-semibold">Recycle Campaign</h2>
                    </div>
                </Modal.Header>

                <Modal.Body className="px-[74px] py-8">
                    <div className="flex flex-col gap-4">
                        <div>
                            <Input
                                type="text"
                                label="Campaign Name"
                                placeholder="Enter campaign name"
                                value={recycleCampaignData.campaignName}
                                onChange={(e) => {
                                    handleInputChange('campaignName', e.target.value);
                                    if (formErrors.campaignName) {
                                        setFormErrors(prev => ({ ...prev, campaignName: undefined }));
                                    }
                                }}
                                className={formErrors.campaignName ? 'border-red-500' : ''}
                            />
                            {formErrors.campaignName && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.campaignName}</p>
                            )}
                        </div>

                        <div>
                            <Input
                                type="text"
                                label="Campaign ID"
                                placeholder="Enter campaign ID"
                                value={recycleCampaignData.campaignId}
                                disabled
                                className="bg-gray-100 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <Input
                                type="text"
                                label="Vertical"
                                placeholder="Enter vertical"
                                value={recycleCampaignData.vertical}
                                onChange={(e) => {
                                    handleInputChange('vertical', e.target.value);
                                    if (formErrors.vertical) {
                                        setFormErrors(prev => ({ ...prev, vertical: undefined }));
                                    }
                                }}
                                className={formErrors.vertical ? 'border-red-500' : ''}
                            />
                            {formErrors.vertical && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.vertical}</p>
                            )}
                        </div>

                        <div>
                            <Input
                                type="text"
                                label="Target"
                                placeholder="Enter target"
                                value={recycleCampaignData.target}
                                onChange={(e) => {
                                    handleInputChange('target', e.target.value);
                                    if (formErrors.target) {
                                        setFormErrors(prev => ({ ...prev, target: undefined }));
                                    }
                                }}
                                className={formErrors.target ? 'border-red-500' : ''}
                            />
                            {formErrors.target && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.target}</p>
                            )}
                        </div>

                        <div>
                            <Input
                                type="text"
                                label="Locale"
                                placeholder="Enter locale"
                                value={recycleCampaignData.locale}
                                onChange={(e) => {
                                    handleInputChange('locale', e.target.value);
                                    if (formErrors.locale) {
                                        setFormErrors(prev => ({ ...prev, locale: undefined }));
                                    }
                                }}
                                className={formErrors.locale ? 'border-red-500' : ''}
                            />
                            {formErrors.locale && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.locale}</p>
                            )}
                        </div>

                        <div>
                            <Input
                                type="text"
                                label="Type"
                                placeholder="Enter type"
                                value={recycleCampaignData.type}
                                onChange={(e) => {
                                    handleInputChange('type', e.target.value);
                                    if (formErrors.type) {
                                        setFormErrors(prev => ({ ...prev, type: undefined }));
                                    }
                                }}
                                className={formErrors.type ? 'border-red-500' : ''}
                            />
                            {formErrors.type && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>
                            )}
                        </div>

                        {formErrors.general && (
                            <p className="text-red-500 text-xs text-center mt-2">{formErrors.general}</p>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer className="border-none">
                    <div className="flex justify-center w-full">
                        <Button
                            onClick={handleRecycle}
                            disabled={isSubmitting}
                            className="w-[114px] h-[40px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] gap-[10px] bg-white text-black hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Recycling...' : 'Recycle'}
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

            <NotificationContainer />

            <DeleteConfirmationModal
                isOpen={showExportConfirmation}
                onClose={() => setShowExportConfirmation(false)}
                onConfirm={confirmExport}
                title="Export log data"
                message="Do you want to export this table to xlsx?"
            />
        </PageContainer>
    );
};

export default ActivityLogTable; 