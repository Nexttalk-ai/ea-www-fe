import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import type { ColDef } from "ag-grid-community";
import BaseTable from '../components/tables/BaseTable';
import Button from '../components/ui/Button';
import { FaEdit, FaTrash } from 'react-icons/fa';
import ViewButton from '../components/ui/ViewButton';
import HomeLayout from '../layouts/HomeLayout';
import { User } from '../services/userService';
import { userService } from '../services/userService';
import { organizationService } from '../services/organizationService';
import GoBackButton from '../components/ui/GoBackButton';
import { Modal } from '../components/ui/Modal';
import { FaRegCircleUser } from 'react-icons/fa6';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useOrganization } from '../hooks/useOrganization';
import { useUsers } from '../hooks/useUsers';
import { useNotification } from '../hooks/useNotification';

interface FormData {
    name: string;
    userIds: string[];
}

const OrganizationDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<'users' | 'assets'>('users');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { organization, isLoading: orgLoading, isError: orgError, mutate: mutateOrganization } = useOrganization(id || '');
    const { users, isLoading: usersLoading, isError: usersError, mutate: mutateUsers } = useUsers();
    const { show, NotificationContainer } = useNotification();
    
    // Filter users for this organization
    const organizationUsers = useMemo(() => {
        return users?.filter(user =>
            user.organizations.includes(organization?.name || '')
        ) || [];
    }, [users, organization?.name]);

    const isLoading = orgLoading || usersLoading;
    const error = orgError || usersError;

    const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            name: '',
            userIds: []
        }
    });

    const watchedUserIds = watch('userIds');

    // Update form when modal opens
    useEffect(() => {
        if (isModalOpen && organization && organizationUsers) {
            // Use reset to set all values at once, ensuring proper form state
            reset({
                name: organization.name,
                userIds: organizationUsers.map(user => user.id)
            });
        }
    }, [isModalOpen, organization, organizationUsers, reset]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isModalOpen) {
            reset();
        }
    }, [isModalOpen, reset]);

    const showNotification = (message: string, type: 'success' | 'error') => {
        show(
            <div className="flex flex-col items-center text-center">
                <h4 className="text-lg font-semibold mb-2">Edit Organization</h4>
                <p className="text-gray-700">{message}</p>
            </div>,
            { type, position: 'top-right' }
        );
    };

    const onSubmit = async (data: FormData) => {
        if (!organization) return;

        setIsSubmitting(true);
        try {
            const updates: Promise<any>[] = [];
            const organizationNameChanged = data.name !== organization.name;
            const userIdsChanged = JSON.stringify(data.userIds.sort()) !== JSON.stringify(organizationUsers.map(u => u.id).sort());

            // Update organization name if changed
            if (organizationNameChanged) {
                updates.push(
                    organizationService.update({
                        id: organization.id,
                        name: data.name
                    })
                );
            }

            // Update user organizations if user selection changed
            if (userIdsChanged) {
                const currentUserIds = organizationUsers.map(u => u.id);
                const newUserIds = data.userIds;
                
                // Users to remove from organization
                const usersToRemove = currentUserIds.filter(id => !newUserIds.includes(id));
                
                // Users to add to organization
                const usersToAdd = newUserIds.filter(id => !currentUserIds.includes(id));

                // Remove organization from users organizations array
                for (const userId of usersToRemove) {
                    const user = users?.find(u => u.id === userId);
                    if (user) {
                        const updatedOrganizations = user.organizations.filter(org => org !== organization.name);
                        updates.push(
                            userService.update({
                                id: userId,
                                organizations: updatedOrganizations
                            })
                        );
                    }
                }

                // Add organization to users' organizations array
                for (const userId of usersToAdd) {
                    const user = users?.find(u => u.id === userId);
                    if (user) {
                        const updatedOrganizations = [...user.organizations, data.name];
                        updates.push(
                            userService.update({
                                id: userId,
                                organizations: updatedOrganizations
                            })
                        );
                    }
                }
            }

            // Execute all updates
            if (updates.length > 0) {
                await Promise.all(updates);
                
                // Refresh data
                await Promise.all([
                    mutateOrganization(),
                    mutateUsers()
                ]);
            }

            setIsModalOpen(false);
            showNotification('Organization successfully updated', 'success');
        } catch (error) {
            console.error('Error updating organization:', error);
            showNotification('Failed to update organization. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const columnDefs: ColDef[] = [
        {
            field: 'id',
            headerName: 'ID',
            flex: 1,
            minWidth: 100,
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
        },
        {
            field: 'role',
            headerName: 'Role',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            flex: 1,
            minWidth: 150,
            valueFormatter: (params) => {
                if (!params.value) return '';
                return new Date(params.value).toLocaleString();
            }
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 100,
            cellRenderer: (params: any) => {
                return (
                    <ViewButton path={`/organizations/${id}/user/${params.data.id}`} className="w-[50px]" />
                );
            },
            sortable: false,
            filter: false,
            suppressSizeToFit: true
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

    if (isLoading) {
        return (
            <HomeLayout>
                <div className="flex justify-center items-center h-full min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </HomeLayout>
        );
    }

    if (error) {
        return (
            <HomeLayout>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </HomeLayout>
        );
    }

    if (!organization) {
        return (
            <HomeLayout>
                <div className="text-center py-4">
                    Organization not found
                </div>
            </HomeLayout>
        );
    }

    return (
        <HomeLayout>
            <div className="px-6">
                {/* Content Section with White Background */}
                <div className="bg-white rounded-lg shadow-sm px-6 py-2">
                    <GoBackButton text="Back to Organizations" path="/organizations" className="ml-0" />
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">{organization.name}</h1>
                            <p className="text-gray-600 text-sm">
                                ID: {organization.id} • Created on {new Date(organization.created_at).toLocaleString()}
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="text-blue-500 hover:text-blue-600"
                        >
                            <FaEdit />
                        </Button>

                    </div>
                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <div className="flex space-x-8">
                            <button
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                onClick={() => setActiveTab('users')}
                            >
                                Users
                            </button>
                            <button
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'assets'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                onClick={() => setActiveTab('assets')}
                            >
                                Assets
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'users' && (
                        <BaseTable
                            rowData={organizationUsers}
                            setRowData={(data: User[]) => {}}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            modalTitle="User"
                            showSearch={false}
                            showAddButton={false}
                            showEditButton={false}
                            showDeleteButton={false}
                        />
                    )}
                    {activeTab === 'assets' && (
                        <div className="text-center py-8 text-gray-500">
                            Assets content will be implemented here
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                classNameBackground="bg-black/50"
                classNameModal="fixed w-[460px] h-[569px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Modal.Header className="relative border-none">
                        <button 
                            type="button"
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
                                Edit {organization?.name || 'Organization'}
                            </h2>
                        </div>
                    </Modal.Header>

                    <Modal.Body className="p-6">
                        <div className="space-y-4">
                            <Controller
                                name="name"
                                control={control}
                                defaultValue={organization?.name || ''}
                                rules={{ required: 'Organization name is required' }}
                                render={({ field }) => (
                                    <Input
                                        id="name"
                                        label="Organization Name"
                                        {...field}
                                        placeholder="Enter organization name"
                                        error={errors.name?.message}
                                    />
                                )}
                            />
                            <Select
                                id="users"
                                label="Select Users"
                                options={users?.map(user => ({
                                    value: user.id,
                                    label: user.name
                                })) || []}
                                value={watchedUserIds}
                                onChange={(value) => setValue('userIds', value)}
                                multipleSelect={true}
                                placeholder="Select users..."
                            />
                        </div>
                    </Modal.Body>

                    <Modal.Footer className="border-none">
                        <div className="flex justify-center w-full">
                            <Button
                                type="submit"
                                className="w-[114px] h-[40px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] gap-[10px] bg-white text-black hover:text-gray-600"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </Modal.Footer>
                </form>
            </Modal>

            <NotificationContainer />
        </HomeLayout>
    );
};

export default OrganizationDetails; 