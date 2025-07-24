import { useState, useRef, useMemo, useCallback, ChangeEvent } from 'react';
import { AllCommunityModule, ModuleRegistry, SizeColumnsToFitGridStrategy } from "ag-grid-community";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import { Modal } from '../ui/Modal';
import Input from '../ui/Input';

ModuleRegistry.registerModules([AllCommunityModule]);

interface BaseTableProps<T> {
    rowData: T[];
    setRowData: (data: T[]) => void;
    columnDefs: ColDef[];
    defaultColDef?: any;
    modalContent?: (formData: Partial<T>, handleInputChange: (field: keyof T, value: any) => void) => React.ReactNode;
    onAdd?: () => void;
    onEdit?: (data: T) => void;
    onDelete?: (data: T[]) => void;
    modalTitle?: string;
    addButtonText?: string;
    editButtonText?: string;
    deleteButtonText?: string;
    showSearch?: boolean;
    showAddButton?: boolean;
    showEditButton?: boolean;
    showDeleteButton?: boolean;
}

const BaseTable = <T extends object>({
    rowData,
    setRowData,
    columnDefs,
    defaultColDef,
    modalContent,
    onAdd,
    onEdit,
    onDelete,
    modalTitle = 'Edit Item',
    addButtonText = 'Add',
    editButtonText = 'Edit',
    deleteButtonText = 'Delete',
    showSearch = true,
    showAddButton = true,
    showEditButton = true,
    showDeleteButton = true
}: BaseTableProps<T>) => {
    const gridApiRef = useRef<GridApi | null>(null);
    const [selectedRows, setSelectedRows] = useState<T[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState<Partial<T>>({});
    const [quickFilterText, setQuickFilterText] = useState<string>();

    const onFilterTextBoxChanged = useCallback(
        ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
            setQuickFilterText(value),
        []
    );

    const onGridReady = useCallback((params: GridReadyEvent) => {
        gridApiRef.current = params.api;
    }, []);

    const autoSizeStrategy = useMemo<SizeColumnsToFitGridStrategy>(
        () => ({
            type: "fitGridWidth",
        }),
        []
    );

    const handleEdit = () => {
        if (selectedRows.length === 1) {
            setFormData(selectedRows[0]);
            setModalMode('edit');
            setIsModalOpen(true);
            onEdit?.(selectedRows[0]);
        }
    };

    const handleDelete = () => {
        if (selectedRows.length > 0) {
            onDelete?.(selectedRows);
            setRowData(rowData.filter(item => !selectedRows.includes(item)));
        }
    };

    const handleAdd = () => {
        setFormData({});
        setModalMode('add');
        setIsModalOpen(true);
        onAdd?.();
    };

    const handleInputChange = (field: keyof T, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = () => {
        if (modalMode === 'add') {
            setRowData([...rowData, formData as T]);
        } else {
            setRowData(rowData.map(item =>
                item === selectedRows[0] ? { ...item, ...formData } : item
            ));
        }
        setIsModalOpen(false);
    };

    const onSelectionChanged = () => {
        if (gridApiRef.current) {
            const selectedNodes = gridApiRef.current.getSelectedNodes();
            const selectedData = selectedNodes.map(node => node.data);
            setSelectedRows(selectedData);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center">
            {(showSearch || showAddButton || showEditButton || showDeleteButton) && (
                <div className="w-full mb-4 flex justify-end items-center gap-2">
                    {showSearch && (
                        <Input
                            type="text"
                            id="filter-text-box"
                            placeholder="Search..."
                            onInput={onFilterTextBoxChanged}
                            className="w-1/3"
                        />
                    )}
                    {showAddButton && (
                        <Button
                            onClick={handleAdd}
                            className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                        >
                            <FaUserPlus />
                            {addButtonText}
                        </Button>
                    )}
                    {showEditButton && (
                        <Button
                            onClick={handleEdit}
                            className="bg-blue-500 hover:bg-blue-600 flex text-white items-center gap-2"
                            disabled={selectedRows.length !== 1}
                        >
                            <FaEdit />
                            {editButtonText}
                        </Button>
                    )}
                    {showDeleteButton && (
                        <Button
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                            disabled={selectedRows.length === 0}
                        >
                            <FaTrash />
                            {deleteButtonText}
                        </Button>
                    )}
                </div>
            )}
            <div className="w-full h-[calc(100vh-6rem)] ag-theme-quartz">
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    animateRows={true}
                    rowSelection="single"
                    suppressCellFocus={false}
                    enableCellTextSelection={true}
                    onSelectionChanged={onSelectionChanged}
                    suppressColumnVirtualisation={true}
                    rowHeight={48}
                    headerHeight={48}
                    pagination={true}
                    paginationPageSize={10}
                    paginationPageSizeSelector={[10, 20, 50, 100]}
                    detailRowAutoHeight={true}
                    autoSizeStrategy={autoSizeStrategy}
                    quickFilterText={quickFilterText}
                    onGridReady={onGridReady}
                    suppressRowClickSelection={false}
                    rowMultiSelectWithClick={false}
                    theme="legacy"
                />
            </div>

            {modalContent && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <Modal.Header>
                        {modalMode === 'add' ? `Add ${modalTitle}` : `Edit ${modalTitle}`}
                    </Modal.Header>
                    <Modal.Body>
                        {modalContent(formData, handleInputChange)}
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="flex justify-center w-full gap-2">
                            <Button
                                className='bg-red-500 hover:bg-red-600'
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className='bg-green-500 hover:bg-green-600'
                                onClick={handleSubmit}
                            >
                                {modalMode === 'add' ? 'Add' : 'Save Changes'}
                            </Button>
                        </div>
                    </Modal.Footer>
                </Modal>
            )}
        </div>
    );
};

export default BaseTable; 