import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { userService, User } from '../services/userService';
import { organizationService, Organization } from '../services/organizationService';
import HomeLayout from '../layouts/HomeLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { DeleteConfirmationModal } from '../components/ui/DeleteConfirmationModal';
import { OrganizationsInput } from '../components/ui/OrganizationsInput';
import { useNotification } from '../hooks/useNotification';
import GoBackButton from '../components/ui/GoBackButton';

type Tab = 'details' | 'permissions' | 'activity';

const AVAILABLE_ROLES = ['user', 'Admin'];

const UserDetails: React.FC = () => {
    const { id, org_id } = useParams<{ id: string; org_id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { show, NotificationContainer } = useNotification();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState<Partial<User>>({});
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const roleDropdownRef = useRef<HTMLDivElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const shouldEdit = searchParams.get('edit') === 'true';
        if (shouldEdit) {
            setIsEditing(true);
            // Remove the edit parameter from URL without reloading
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
                setShowRoleDropdown(false);
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setShowStatusDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            if (!id) return;
            
            try {
                setIsLoading(true);
                setError(null);
                const [userData, orgsData] = await Promise.all([
                    userService.get(id),
                    organizationService.list()
                ]);
                setUser(userData);
                setEditedUser(userData);
                setOrganizations(orgsData);
            } catch (err) {
                setError('Failed to fetch user details. Please try again.');
                console.error('Error fetching user:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    const showNotificationModal = (message: string, type: 'success' | 'error', operation: 'edit' | 'delete' = 'edit') => {
        const title = operation === 'edit' ? 'Edit User' : 'Delete User';
        
        const successMessage = operation === 'edit' ? 'User successfully changed' : 'User successfully deleted';
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

    const handleDelete = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await userService.delete(id!);
            showNotificationModal('', 'success', 'delete');
            
            if (org_id) {
                navigate(`/organizations/${org_id}`);
            } else {
                navigate('/users');
            }
        } catch (err) {
            showNotificationModal('Failed to delete user. Please try again.', 'error', 'delete');
        } finally {
            setIsLoading(false);
            setShowConfirmDelete(false);
        }
    };

    const handleDeleteClick = () => {
        setShowConfirmDelete(true);
    };

    const handleEdit = () => {
        if (isEditing) {
            setIsEditing(false);
            setEditedUser(user || {});
        } else {
            setIsEditing(true);
        }
    };

    const handleStatusChange = async (newStatus: 'Active' | 'Inactive') => {
        if (!user) return;
        try {
            setIsLoading(true);
            setError(null);

            const updatedLocalUser = {
                ...user,
                deleted_at: newStatus === 'Inactive' ? new Date().toISOString() : null
            };
            setUser(updatedLocalUser);
            setEditedUser(updatedLocalUser);

            const updateData = {
                id: id!,
                deleted_at: newStatus === 'Inactive' ? new Date().toISOString() : null,
                version: user.version,
                name: user.name,
                email: user.email,
                role: user.role,
                organizations: user.organizations
            };

            await userService.update(updateData);
            const verifyUser = await userService.get(id!);

            const currentStatus = verifyUser.deleted_at ? 'Inactive' : 'Active';
            if (currentStatus !== newStatus) {
                throw new Error(`Failed to update status. Expected: ${newStatus}, Got: ${currentStatus}`);
            }

            setUser(verifyUser);
            setEditedUser(verifyUser);
            setShowStatusDropdown(false);
            setIsEditing(false);
        } catch (err) {
            setUser(user);
            setEditedUser(user);
            setError(err instanceof Error ? err.message : 'Failed to update user status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            setError(null);

            const currentStatus = user.deleted_at ? 'Inactive' : 'Active';
            const newStatus = editedUser.deleted_at ? 'Inactive' : 'Active';

            if (currentStatus !== newStatus) {
                await handleStatusChange(newStatus);
                return;
            }

            const updateData = {
                id: id!,
                name: editedUser.name || user.name,
                email: editedUser.email || user.email,
                role: editedUser.role || user.role,
                organizations: editedUser.organizations || user.organizations,
                deleted_at: editedUser.deleted_at,
                version: user.version
            };

            try {
                const updatedUser = await userService.update(updateData);
                if (!updatedUser || !updatedUser.id) {
                    throw new Error('Invalid response from server');
                }
                
                const verifiedUser = await userService.get(id!);
                if (verifiedUser.email !== updateData.email || 
                    verifiedUser.name !== updateData.name || 
                    verifiedUser.role !== updateData.role) {
                    throw new Error('Update verification failed');
                }
                
                setUser(verifiedUser);
                setEditedUser(verifiedUser);
                setIsEditing(false);
                setError(null);
                showNotificationModal('', 'success', 'edit');
            } catch (apiError) {
                if (apiError instanceof Error && apiError.message.includes('502')) {
                    try {
                        const currentUser = await userService.get(id!);
                        if (currentUser.email === updateData.email && 
                            currentUser.name === updateData.name && 
                            currentUser.role === updateData.role) {
                            setUser(currentUser);
                            setEditedUser(currentUser);
                            setIsEditing(false);
                            setError(null);
                            showNotificationModal('', 'success', 'edit');
                            return;
                        }
                    } catch (verifyError) {
                        throw apiError;
                    }
                }
                throw apiError;
            }
        } catch (err) {
            console.error('Error updating user:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to update user. Please try again.';
            showNotificationModal(errorMessage, 'error', 'edit');
            return;
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof User, value: string | string[] | null) => {
        setEditedUser(prev => ({
            ...prev,
            [field]: field === 'deleted_at' ? value : (value || '')
        }));
    };

    const handleOrganizationsChange = (newOrganizations: string[]) => {
        setEditedUser(prev => ({
            ...prev,
            organizations: newOrganizations
        }));
    };

    const getBackButtonProps = () => {
        if (org_id) {
            return {
                text: 'Back to Organization',
                path: `/organizations/${org_id}`
            };
        }
        return {
            text: 'Back to Users',
            path: '/users'
        };
    };

    if (isLoading) {
        return (
            <HomeLayout>
                <div className="flex justify-center items-center h-full">
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

    if (!user) {
        return (
            <HomeLayout>
                <div className="text-center py-4">
                    User not found
                </div>
            </HomeLayout>
        );
    }

    const displayUser = isEditing ? editedUser : user;

    return (
        <HomeLayout>
            <div className="flex flex-col items-center px-4 gap-6">
                <GoBackButton {...getBackButtonProps()} />
                <div className="w-[1184px] h-[144px] bg-white rounded-lg p-6">
                    <div className="flex justify-between h-full">
                        <div className="flex flex-col">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-[24px] font-medium text-black">{user?.name}</h1>
                                <div className="flex items-center gap-6 text-[14px] text-gray-500">
                                    <span>{user?.email}</span>
                                    <span>{user?.role}</span>
                                </div>
                            </div>
                            <div className="flex gap-6 mt-6">
                                <button
                                    className={`text-sm ${activeTab === 'details' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                                    onClick={() => setActiveTab('details')}
                                >
                                    Details
                                </button>
                                <button
                                    className={`text-sm ${activeTab === 'permissions' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                                    onClick={() => setActiveTab('permissions')}
                                >
                                    Permissions
                                </button>
                                <button
                                    className={`text-sm ${activeTab === 'activity' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    Activity
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleEdit}
                                className="bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                            >
                                Edit
                            </Button>
                            <Button
                                onClick={handleDeleteClick}
                                className="bg-white text-black flex items-center justify-center gap-[10px] w-[112px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="w-[1184px] bg-white rounded-lg p-6 relative">
                    {isEditing && (
                        <div className="absolute top-6 right-6">
                            <Button
                                onClick={handleSave}
                                className="bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    )}
                    <div className="w-[360px] rounded-[2px] border border-[#F0F0F0] p-6">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="block text-sm text-gray-500">Status</label>
                                {isEditing ? (
                                    <div className="relative max-w-md" ref={statusDropdownRef}>
                                        <div 
                                            role="combobox"
                                            aria-labelledby="status-label"
                                            aria-expanded={showStatusDropdown}
                                            aria-haspopup="listbox"
                                            className="flex items-center p-2 border rounded-md bg-white min-h-[42px] cursor-pointer"
                                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${editedUser.deleted_at ? 'bg-gray-400' : 'bg-green-500'}`} />
                                                <span className="text-[#262626] text-[14px] leading-[22px] font-semibold align-middle">{editedUser.deleted_at ? 'Inactive' : 'Active'}</span>
                                            </div>
                                        </div>
                                        {showStatusDropdown && (
                                            <div 
                                                role="listbox"
                                                aria-labelledby="status-label"
                                                className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg"
                                            >
                                                <div
                                                    role="option"
                                                    aria-selected={editedUser.deleted_at === null}
                                                    className="px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-[#262626] flex items-center gap-2"
                                                    onClick={() => {
                                                        handleInputChange('deleted_at', null);
                                                        setShowStatusDropdown(false);
                                                    }}
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    Active
                                                </div>
                                                <div
                                                    role="option"
                                                    aria-selected={editedUser.deleted_at !== null}
                                                    className="px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-[#262626] flex items-center gap-2"
                                                    onClick={() => {
                                                        handleInputChange('deleted_at', new Date().toISOString());
                                                        setShowStatusDropdown(false);
                                                    }}
                                                >
                                                    <div className={`w-2 h-2 rounded-full bg-gray-400`} />
                                                    Inactive
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center p-2 border rounded-md bg-[#F5F5F5] min-h-[42px]">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user?.deleted_at ? 'bg-gray-400' : 'bg-green-500'}`} />
                                            <span className="text-[#262626] text-[14px] leading-[22px] font-semibold align-middle">{user?.deleted_at ? 'Inactive' : 'Active'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-sm text-gray-500">ID</label>
                                <div className="p-2 border rounded-md bg-[#F5F5F5] min-h-[42px] flex items-center">
                                    <span className="text-[#262626] text-[14px] leading-[22px] font-semibold">{user?.id}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-sm text-gray-500">Username</label>
                                {isEditing ? (
                                    <div className="border rounded-md bg-white min-h-[42px] flex items-center">
                                        <Input
                                            type="text"
                                            value={editedUser.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="max-w-md text-[#262626] text-[14px] leading-[22px] font-semibold border-none pl-2"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-2 border rounded-md bg-[#F5F5F5] min-h-[42px] flex items-center">
                                        <span className="text-[#262626] text-[14px] leading-[22px] font-semibold">{user?.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-sm text-gray-500">Email</label>
                                <div className="p-2 border rounded-md bg-[#F5F5F5] min-h-[42px] flex items-center">
                                    <span className="text-[#262626] text-[14px] leading-[22px] font-semibold">{user?.email}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-sm text-gray-500">Role</label>
                                {isEditing ? (
                                    <div className="relative max-w-md" ref={roleDropdownRef}>
                                        <div 
                                            role="combobox"
                                            aria-labelledby="role-label"
                                            aria-expanded={showRoleDropdown}
                                            aria-haspopup="listbox"
                                            className="flex items-center p-2 border rounded-md bg-white min-h-[42px] cursor-pointer"
                                            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                                        >
                                            <span className="text-[#262626] text-[14px] leading-[22px] font-semibold">{editedUser.role}</span>
                                        </div>
                                        {showRoleDropdown && (
                                            <div 
                                                role="listbox"
                                                aria-labelledby="role-label"
                                                className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg"
                                            >
                                                {AVAILABLE_ROLES.map(role => (
                                                    <div
                                                        key={role}
                                                        role="option"
                                                        aria-selected={editedUser.role === role}
                                                        className="px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-[#262626] text-[14px] leading-[22px] font-semibold"
                                                        onClick={() => {
                                                            handleInputChange('role', role);
                                                            setShowRoleDropdown(false);
                                                        }}
                                                    >
                                                        {role}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-2 border rounded-md bg-[#F5F5F5] min-h-[42px]">
                                        <span className="text-[#262626] text-[14px] leading-[22px] font-semibold">{user?.role}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-sm text-gray-500">Organizations</label>
                                <OrganizationsInput
                                    organizations={organizations}
                                    selectedOrganizations={isEditing ? editedUser.organizations || [] : user?.organizations || []}
                                    onOrganizationsChange={handleOrganizationsChange}
                                    disabled={!isEditing}
                                    className="max-w-md"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-sm text-gray-500">Last Updated</label>
                                <div className="p-2 flex items-center">
                                    <span className="text-[#262626] text-[14px] leading-[22px] font-semibold">
                                        {displayUser.updated_at ? new Date(displayUser.updated_at).toLocaleString() : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-sm text-gray-500">Created At</label>
                                <div className="p-2 flex items-center">
                                    <span className="text-[#262626] text-[14px] leading-[22px] font-semibold">
                                        {displayUser.created_at ? new Date(displayUser.created_at).toLocaleString() : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <DeleteConfirmationModal
                    isOpen={showConfirmDelete}
                    onClose={() => setShowConfirmDelete(false)}
                    onConfirm={handleDelete}
                    title="Delete User"
                    message="Are you sure you want to delete this user?"
                    isLoading={isLoading}
                />
                <NotificationContainer />
            </div>
        </HomeLayout>
    );
};

export default UserDetails; 