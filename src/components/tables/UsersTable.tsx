import { useState, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

import { userService, User } from '../../services/userService';
import { organizationService, Organization } from '../../services/organizationService';
import { FaRegCircleUser } from 'react-icons/fa6';
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
import { OrganizationsInput } from '../ui/OrganizationsInput';
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



type UserData = {
    email: string;
    name: string;
    organizations?: string[];
};

type UserValidationError = {
    name?: boolean;
    email?: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RETRY_DELAY = 1000;

const UsersTable = () => {
    const [rowData, setRowData] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('add');
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        organizations: []
    });
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);

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
                gridApi.paginationGoToPage(0); // Reset to first page
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
    const [errors, setErrors] = useState<UserValidationError>({});

    const onFilterTextBoxChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const filterValue = e.target.value;
        setQuickFilterText(filterValue);
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const users = await userService.list();
            setRowData(users);
        } catch (err) {
            setError('Failed to fetch users. Please try again.');
            console.error('Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const orgs = await organizationService.list();
                setOrganizations(orgs);
            } catch (err) {
                console.error('Error fetching organizations:', err);
            }
        };
        fetchOrganizations();
    }, []);



    useEffect(() => {
        if (gridApi && rowData.length > 0) {
            const totalPages = gridApi.paginationGetTotalPages();
            setTotalPages(Math.max(1, totalPages));
            gridApi.paginationGoToPage(0);
            setCurrentPage(1);
        }
    }, [gridApi, rowData]);

    const handleEdit = (user: User) => {
        navigate(`/users/${user.id}?edit=true`);
    };

    const handleDelete = (user: User) => {
        if (!user?.id) {
            showNotificationModal('Invalid user data', 'error', 'delete');
            return;
        }
        setUserToDelete(user);
        setShowConfirmDelete(true);
    };

    const handleInputChange = (field: keyof User, value: string | string[]) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const newErrors: UserValidationError = {};
        
        if (!formData.name?.trim()) newErrors.name = true;
        if (!formData.email?.trim() || !EMAIL_REGEX.test(formData.email)) newErrors.email = true;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const doesUserMatch = (user: User, userData: UserData): boolean => {
        return user.email === userData.email && 
               user.name === userData.name;
    };

    const findMatchingUserInList = async (userData: UserData): Promise<User | undefined> => {
        try {
            const users = await userService.list();
            return users.find(u => doesUserMatch(u, userData));
        } catch (error) {
            console.error('Error finding matching user:', error);
            return undefined;
        }
    };

    const handle502Error = async <T,>(
        operation: () => Promise<T>, 
        maxRetries: number = 1
    ): Promise<T> => {
        let lastError: Error | undefined;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (error instanceof Error && error.message.includes('502')) {
                    lastError = error;
                    if (attempt < maxRetries) {
                        await delay(RETRY_DELAY);
                        continue;
                    }
                }
                throw error;
            }
        }
        
        throw lastError || new Error('Operation failed after retries');
    };

    const validateUserData = (data: Partial<UserData> & { id?: string }): UserData => {
        const errors: string[] = [];
        
        if (!data.name?.trim()) errors.push('Name is required');
        if (!data.email?.trim()) errors.push('Email is required');
        else if (!EMAIL_REGEX.test(data.email)) errors.push('Invalid email format');

        if (data.organizations?.some(org => !org)) errors.push('Invalid organization selected');
        
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        
        return {
            name: data.name!.trim(),
            email: data.email!.trim(),
            organizations: data.organizations || []
        };
    };

    const verifyUserData = async (userData: UserData, userId: string): Promise<boolean> => {
        const getUserAndVerify = async () => {
            const user = await userService.get(userId);
            return doesUserMatch(user, userData);
        };

        try {
            return await handle502Error(getUserAndVerify, 2);
        } catch (error) {
            console.error('Error verifying user data:', error);
            return false;
        }
    };

    const handleUserOperation = async <T extends { id: string }>(
        operation: () => Promise<T>,
        userData: UserData,
        verificationAttempts: number = 3
    ): Promise<boolean> => {
        let userId: string | undefined;

        try {
            const result = await handle502Error(operation, 1);
            if (!result?.id) {
                throw new Error('Invalid response from server');
            }
            userId = result.id;

            const verificationResult = await verifyUserData(userData, result.id);
            if (verificationResult) {
                return true;
            }

            const matchingUser = await findMatchingUserInList(userData);
            if (matchingUser) {
                return true;
            }

            if (userId && verificationAttempts > 0) {
                const finalVerification = await handle502Error(
                    async () => {
                        const verifiedUser = await userService.get(userId!);
                        return doesUserMatch(verifiedUser, userData);
                    },
                    2
                );
                if (finalVerification) {
                    return true;
                }
            }

            throw new Error('Failed to verify user operation');
        } catch (error) {
            if (error instanceof Error && error.message.includes('502') && verificationAttempts > 0) {
                return handleUserOperation(operation, userData, verificationAttempts - 1);
            }
            throw error;
        }
    };

    const handleCreateUser = async (createData: UserData): Promise<boolean> => {
        return handleUserOperation(
            () => userService.create(createData),
            createData
        );
    };

    const handleUpdateUser = async (updateData: UserData & { 
        id: string,
        version: number,
        deleted_at: string | null 
    }): Promise<boolean> => {
        return handleUserOperation(
            () => userService.update(updateData),
            updateData
        );
    };

    const showNotificationModal = (message: string, type: 'success' | 'error', operation: 'add' | 'edit' | 'delete' = 'add') => {
        const title = operation === 'add' ? 'Add User' : 
                     operation === 'edit' ? 'Edit User' : 
                     'Delete User';
        
        const successMessage = operation === 'add' ? 'User successfully created' : 
                             operation === 'edit' ? 'User successfully changed' :
                             'User successfully deleted';
        
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

    const verifyUserExists = async (userId: string): Promise<boolean> => {
        try {
            await userService.get(userId);
            return true;
        } catch {
            return false;
        }
    };

    const handleSuccessfulDelete = async () => {
        showNotificationModal('', 'success', 'delete');
        await fetchUsers();
        setShowConfirmDelete(false);
        setUserToDelete(null);
    };

    const confirmDelete = async () => {
        try {
            if (!userToDelete?.id) {
                showNotificationModal('Invalid user data', 'error', 'delete');
                return;
            }
            setIsLoading(true);
            
            const userExists = await verifyUserExists(userToDelete.id);
            if (!userExists) {
                await handleSuccessfulDelete();
                return;
            }

            const result = await userService.delete(userToDelete.id);
            if (result && (result.status === 'success' || result.id === userToDelete.id)) {
                await handleSuccessfulDelete();
            } else {
                throw new Error('Unexpected response from server');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            
            const userExists = await verifyUserExists(userToDelete!.id);
            if (!userExists) {
                await handleSuccessfulDelete();
            } else {
                showNotificationModal('Failed to delete user. Please try again.', 'error', 'delete');
            }
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
                    const users = await userService.list();
                    const emailExists = users.some(user => user.email === formData.email);
                    if (emailExists) {
                        setErrors(prev => ({ ...prev, email: true }));
                        return;
                    }

                    const createData = validateUserData(formData);
                    await handleCreateUser(createData);
                    showNotificationModal('', 'success', modalMode);
                    await fetchUsers();
                    setIsModalOpen(false);
                    setFormData({ name: '', email: '', organizations: [] });
                    setErrors({});
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
                    showNotificationModal(errorMessage, 'error', modalMode);
                }
            } else {
                if (!formData.id) {
                    throw new Error('User ID is missing');
                }
                const currentUser = await userService.get(formData.id);
                const updateData = {
                    ...validateUserData(formData),
                    id: formData.id,
                    version: currentUser.version,
                    deleted_at: currentUser.deleted_at
                };
                await handleUpdateUser(updateData);
                showNotificationModal('', 'success', modalMode);
                await fetchUsers();
                setIsModalOpen(false);
                setFormData({ name: '', email: '', organizations: [] });
                setErrors({});
            }
        } catch (err) {
            console.error('Error handling user:', err);
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
            headerName: 'Name', 
            sortable: true, 
            filter: false,
            flex: 1,
            minWidth: 120,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'email', 
            headerName: 'Email', 
            sortable: true, 
            filter: false,
            flex: 1.5,
            minWidth: 180,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'organizations', 
            headerName: 'Organizations', 
            sortable: true, 
            filter: false,
            flex: 1.5,
            minWidth: 180,
            valueGetter: (params) => params.data.organizations?.join(', ') || '',
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
                            params.deleted_at !== null ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                    />
                    <span>{params.deleted_at !== null ? 'Active' : 'Inactive'}</span>
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
                    <ViewButton path={`/users/${params.data.id}`} />
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
            title="User Management"
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
                            email: '',
                            organizations: []
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
                        <FaRegCircleUser className="mb-2 w-8 h-8" />
                        <h2 className="text-xl font-semibold">
                            {modalMode === 'add' ? 'Create a new user' : 'Edit user'}
                        </h2>
                    </div>
                </Modal.Header>

                <Modal.Body className="border-none">
                    <div className="flex flex-col gap-4">
                        <Input
                            type="text"
                            label="Name"
                            placeholder="Name"
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        <Input
                            type="email"
                            label="Email"
                            placeholder="example@email.com"
                            value={formData.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`${errors.email ? 'border-red-500' : ''} ${modalMode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={modalMode === 'edit'}
                        />
                        {errors.email && modalMode === 'add' && (
                            <p className="text-red-500 text-sm mt-1">User with this email already exists</p>
                        )}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-black">Organizations</label>
                            <OrganizationsInput
                                organizations={organizations}
                                selectedOrganizations={formData.organizations || []}
                                onOrganizationsChange={(orgs) => handleInputChange('organizations', orgs)}
                                className="w-full"
                            />
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
                title="Delete User"
                message="Are you sure you want to delete this user?"
            />

            <NotificationContainer />
        </PageContainer>
    );
};

export default UsersTable;