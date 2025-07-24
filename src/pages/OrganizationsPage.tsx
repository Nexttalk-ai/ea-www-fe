import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import HomeLayout from '../layouts/HomeLayout';
import ViewButton from '../components/ui/ViewButton';
import Button from '../components/ui/Button';
import { FaRegCircleUser } from 'react-icons/fa6';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { organizationService, Organization } from '../services/organizationService';
import { userService} from '../services/userService';
import TableSearchBar from '../components/ui/TableSearchBar';
import CustomPagination from '../components/ui/CustomPagination';
import DotButton from '../components/ui/DotButton';
import { EditButton } from '../components/ui/Actions';
import { useNotification } from '../hooks/useNotification';
import PageContainer from '../components/ui/PageContainer';

ModuleRegistry.registerModules([AllCommunityModule]);

interface FormData {
    name: string;
    users: string[];
}

const OrganizationsPage = () => {
    const [rowData, setRowData] = useState<Organization[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userOptions, setUserOptions] = useState<{ value: string; label: string; }[]>([]);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        users: []
    });
    const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [quickFilterText, setQuickFilterText] = useState<string>();
    const { show, NotificationContainer } = useNotification();

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

    const onFilterTextBoxChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(e.target.value);
    }, []);

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

    const onPageChange = (page: number) => {
        if (gridApi) {
            gridApi.paginationGoToPage(page - 1);
            setCurrentPage(page);
        }
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const [organizations, users] = await Promise.all([
                organizationService.list(),
                userService.list()
            ]);

            setRowData(organizations);
            // Ensure we have both id and name for each user option
            setUserOptions(users.map(user => ({
                value: user.id,
                label: user.name || user.id // Fallback to ID if name is not available
            })));
        } catch (err) {
            setError('Failed to fetch data. Please try again.');
            console.error('Error fetching data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (gridApi) {
            gridApi.sizeColumnsToFit();
            const totalPages = gridApi.paginationGetTotalPages();
            setTotalPages(Math.max(1, totalPages));
        }
    }, [gridApi, rowData]);

    const handleEdit = async (organization: Organization) => {
        setIsLoading(true);
        setEditingOrganization(organization);
        setIsModalOpen(true);

        try {
            const [orgDetails, users] = await Promise.all([
                organizationService.get(organization.id),
                userService.list()
            ]);

            // Update user options with fresh data
            setUserOptions(users.map(user => ({
                value: user.id,
                label: user.name
            })));

            // Set form data with user IDs
            setFormData({
                name: orgDetails.name,
                users: Array.isArray(orgDetails.users) ? orgDetails.users : []
            });
        } catch (error) {
            console.error("Failed to fetch organization details", error);
            show(
                <div className="flex flex-col items-center text-center">
                    <h4 className="text-lg font-semibold mb-2">Error</h4>
                    <p className="text-gray-700">Failed to load organization data.</p>
                </div>,
                { type: 'error', position: 'top-right' }
            );
            setIsModalOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const columnDefs: ColDef[] = [
        { 
            field: 'name', 
            headerName: 'Organizations',
            filter: false,
            flex: 1,
            minWidth: 228,
            headerClass: 'custom-header'
        },
        { 
            field: 'id', 
            headerName: 'ID',
            filter: false,
            flex: 1,
            minWidth: 142,
            headerClass: 'custom-header'
        },
        { 
            field: 'created_at', 
            headerName: 'Created At',
            filter: false,
            flex: 1,
            minWidth: 204,
            headerClass: 'custom-header',
            valueFormatter: (params) => {
                if (!params.value) return '';
                return new Date(params.value).toLocaleString();
            }
        },
        { 
            field: 'assets', 
            headerName: 'Assets',
            filter: false,
            flex: 1,
            minWidth: 204,
            headerClass: 'custom-header',
            cellRenderer: (params: any) => (
                <div className="flex items-center justify-center">
                    <span className="text-sm text-gray-400">-</span>
                </div>
            )
        },
        { 
            field: 'users', 
            headerName: 'Users',
            filter: false,
            flex: 1,
            minWidth: 160,
            valueGetter: (params) => {
                // Backend returns users as a count (number), not an array
                return params.data.users || 0;
            },
            headerClass: 'custom-header'
        },
        {
            headerName: 'Actions',
            field: 'actions',
            filter: false,
            width: 100,
            minWidth: 120,
            headerClass: 'text-right',
            cellRenderer: (params: any) => (
                <div className="flex justify-end items-center gap-2 w-full h-full px-2">
                    <ViewButton path={`/organizations/${params.data.id}`} />
                    <DotButton>
                        <EditButton onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(params.data);
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
            .custom-header {
                background-color: #fafafa !important;
                border-bottom: 1px solid #f0f0f0 !important;
                font-weight: 500 !important;
                color: #262626 !important;
            }
            .custom-header::after {
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
                --ag-header-height: 48px;
                --ag-row-height: 48px;
                --ag-header-foreground-color: #262626;
                --ag-header-background-color: #fafafa;
                --ag-odd-row-background-color: white;
                --ag-row-border-color: transparent;
                --ag-cell-horizontal-padding: 16px;
                --ag-borders: none;
            }
            .ag-theme-quartz .ag-root-wrapper {
                border: none;
            }
            .ag-theme-quartz .ag-row {
                border-bottom: 1px solid #f0f0f0;
            }
            .ag-theme-quartz .ag-header-cell.text-right .ag-header-cell-label {
                justify-content: flex-end;
            }
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    const handleInputChange = (field: keyof FormData, value: string | string[]) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!formData.name.trim()) {
                show(
                    <div className="flex flex-col items-center text-center">
                        <h4 className="text-lg font-semibold mb-2">Organization Error</h4>
                        <p className="text-gray-700">Organization name is required</p>
                    </div>,
                    { type: 'error', position: 'top-right' }
                );
                return;
            }

            if (rowData.some(org => 
                org.name.toLowerCase() === formData.name.toLowerCase() && 
                (!editingOrganization || org.id !== editingOrganization.id)
            )) {
                show(
                    <div className="flex flex-col items-center text-center">
                        <h4 className="text-lg font-semibold mb-2">Organization Error</h4>
                        <p className="text-gray-700">Organization with this name already exists</p>
                    </div>,
                    { type: 'error', position: 'top-right' }
                );
                return;
            }

            const organizationData = {
                name: formData.name.trim(),
                users: formData.users
            };

            if (editingOrganization) {
                await organizationService.update({
                    id: editingOrganization.id,
                    ...organizationData
                });
            } else {
                await organizationService.create(organizationData);
            }

            await fetchData();
            
            setIsModalOpen(false);
            setFormData({ name: '', users: [] });
            setEditingOrganization(null);

            show(
                <div className="flex flex-col items-center text-center">
                    <h4 className="text-lg font-semibold mb-2">{editingOrganization ? 'Edit Organization' : 'Add Organization'}</h4>
                    <p className="text-gray-700">Organization successfully {editingOrganization ? 'updated' : 'created'}</p>
                </div>,
                { type: 'success', position: 'top-right' }
            );
        } catch (err) {
            console.error('Error saving organization:', err);
            show(
                <div className="flex flex-col items-center text-center">
                    <h4 className="text-lg font-semibold mb-2">Organization Error</h4>
                    <p className="text-gray-700">Failed to save organization. Please try again.</p>
                </div>,
                { type: 'error', position: 'top-right' }
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <HomeLayout>
            <PageContainer
                title="Organizations"
                leftElement={
                    <TableSearchBar
                        id="filter-text-box"
                        onInput={onFilterTextBoxChanged}
                        className="pl-10 pr-10 w-[300px] h-[36px] gap-[10px] border-0 bg-[#fafafa]"
                    />
                }
                rightElement={
                    <Button
                        onClick={() => setIsModalOpen(true)}
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
                    ) : (
                        <div className="flex-1 min-h-0 w-full ag-theme-quartz">
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                onGridReady={onGridReady}
                                onPaginationChanged={onPaginationChanged}
                                animateRows={true}
                                suppressCellFocus={false}
                                enableCellTextSelection={true}
                                suppressColumnVirtualisation={true}
                                rowHeight={55}
                                headerHeight={55}
                                pagination={true}
                                paginationPageSize={rowsPerPage}
                                suppressPaginationPanel={true}
                                detailRowAutoHeight={true}
                                quickFilterText={quickFilterText}
                                domLayout="autoHeight"
                                suppressHorizontalScroll={true}
                                theme="legacy"
                            />
                        </div>
                    )}
                </div>
            </PageContainer>

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
                        <FaRegCircleUser className="mb-2 w-8 h-8" />
                        <h2 className="text-xl font-semibold">
                            {editingOrganization ? 'Edit Organization' : 'Create a new organization'}
                        </h2>
                    </div>
                </Modal.Header>

                <Modal.Body className="p-6">
                    <div className="space-y-4">
                        <Input
                            id="name"
                            label="Organization Name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter organization name"
                        />
                        <Select
                            id="users"
                            label="Select Users"
                            options={userOptions}
                            value={formData.users}
                            onChange={(value) => handleInputChange('users', value)}
                            multipleSelect={true}
                            placeholder="Select users..."
                            showSearchBar={true}
                        />
                    </div>
                </Modal.Body>

                <Modal.Footer className="border-none">
                    <div className="flex justify-center w-full">
                        <Button
                            className="w-[114px] h-[40px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] gap-[10px] bg-white text-black hover:text-gray-600"
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : editingOrganization ? 'Save' : 'Add'}
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

            <NotificationContainer />
        </HomeLayout>
    );
};

export default OrganizationsPage;