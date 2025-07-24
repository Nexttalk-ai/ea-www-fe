import { useState, useCallback, ChangeEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { FaCheck, FaRegEdit, FaRegCopy, FaEye, FaTrash } from 'react-icons/fa';

import DotButton from '../ui/DotButton';
import TableSearchBar from '../ui/TableSearchBar';
import CustomPagination from '../ui/CustomPagination';
import CustomScrollbarH from '../ui/CustomScrollbarH';
import PageContainer from '../ui/PageContainer';
import Button from '../ui/Button';

ModuleRegistry.registerModules([AllCommunityModule]);

interface CreativeMaker {
    id: string;
    item: string;
    preview: string;
    taskStatus: 'New' | 'Scale' | 'Rejected';
    rejectionReason?: string;
    vertical: string;
    language: string;
    landingPageLanguage: string;
    creatives: string;
    text: string;
    headline: string;
    videoImage: string;
    submissionDateTime: string;
}

const CreativeMakerTable = () => {
    const navigate = useNavigate();
    const [rowData, setRowData] = useState<CreativeMaker[]>([
        {
            id: 'CM001',
            item: 'Creative Item 1',
            preview: 'https://example.com/preview1',
            taskStatus: 'New',
            vertical: 'E-commerce',
            language: 'English',
            landingPageLanguage: 'English',
            creatives: '3',
            text: 'Amazing product description text here',
            headline: 'Best Product Ever',
            videoImage: 'video.mp4',
            submissionDateTime: '2024-03-15 14:30'
        },
        {
            id: 'CM002',
            item: 'Creative Item 2',
            preview: 'https://example.com/preview2',
            taskStatus: 'Scale',
            vertical: 'Technology',
            language: 'Spanish',
            landingPageLanguage: 'Spanish',
            creatives: '2',
            text: 'Innovative tech solution description',
            headline: 'Revolutionary Technology',
            videoImage: 'image.jpg',
            submissionDateTime: '2024-03-14 16:45'
        },
        {
            id: 'CM003',
            item: 'Creative Item 3',
            preview: 'https://example.com/preview3',
            taskStatus: 'Rejected',
            rejectionReason: 'Image resolution too low',
            vertical: 'Health',
            language: 'French',
            landingPageLanguage: 'French',
            creatives: '4',
            text: 'Health and wellness product description',
            headline: 'Healthy Living',
            videoImage: 'video.mp4',
            submissionDateTime: '2024-03-13 09:20'
        },
        {
            id: 'CM004',
            item: 'Creative Item 4',
            preview: 'https://example.com/preview4',
            taskStatus: 'New',
            vertical: 'Education',
            language: 'German',
            landingPageLanguage: 'German',
            creatives: '1',
            text: 'Educational content description',
            headline: 'Learn Today',
            videoImage: 'image.jpg',
            submissionDateTime: '2024-03-12 11:15'
        },
        {
            id: 'CM005',
            item: 'Creative Item 5',
            preview: 'https://example.com/preview5',
            taskStatus: 'Rejected',
            rejectionReason: 'Text content violates guidelines',
            vertical: 'Finance',
            language: 'English',
            landingPageLanguage: 'English',
            creatives: '5',
            text: 'Financial services description',
            headline: 'Smart Finance',
            videoImage: 'video.mp4',
            submissionDateTime: '2024-03-11 13:40'
        }
    ]);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [quickFilterText, setQuickFilterText] = useState<string>();
    const tableRef = useRef<HTMLDivElement>(null);
    const [tableScrollWidth, setTableScrollWidth] = useState(1970);
    const [selectedRejectionCell, setSelectedRejectionCell] = useState<{ rowId: string; reason: string; position: { x: number; y: number } } | null>(null);

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
            setTimeout(() => {
                if (tableRef.current) {
                    setTableScrollWidth(tableRef.current.scrollWidth);
                }
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [gridApi]);

    useEffect(() => {
        if (tableRef.current) {
            const updateScrollWidth = () => {
                setTableScrollWidth(tableRef.current!.scrollWidth);
            };
            updateScrollWidth();
            
            const observer = new ResizeObserver(updateScrollWidth);
            observer.observe(tableRef.current);
            
            return () => observer.disconnect();
        }
    }, [tableRef]);

    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
        setTimeout(() => {
            if (tableRef.current) {
                setTableScrollWidth(tableRef.current.scrollWidth);
            }
        }, 100);
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

    const onFilterTextBoxChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const filterValue = e.target.value;
        setQuickFilterText(filterValue);
    }, []);

    const handleBulkUpload = () => {
        navigate('/bulk-upload');
    };

    const handleDone = (data: CreativeMaker) => {
        console.log('Done clicked for:', data.id);
    };

    const handleEdit = (data: CreativeMaker) => {
        console.log('Edit clicked for:', data.id);
    };

    const handleDuplicate = (data: CreativeMaker) => {
        console.log('Duplicate clicked for:', data.id);
    };

    const handleReview = (data: CreativeMaker) => {
        console.log('Review clicked for:', data.id);
    };

    const handleDelete = (data: CreativeMaker) => {
        console.log('Delete clicked for:', data.id);
    };



    const handleCloseRejectionNote = () => {
        setSelectedRejectionCell(null);
    };

    const columnDefs: ColDef[] = [
        {
            headerName: '',
            field: 'checkbox',
            width: 50,
            checkboxSelection: true,
            headerCheckboxSelection: true,
            headerClass: 'ag-header-cell-with-separator',
            sortable: false,
            filter: false,
            resizable: false
        },
        { 
            field: 'item', 
            headerName: 'Item',
            width: 200,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'preview', 
            headerName: 'Preview',
            width: 150,
            headerClass: 'ag-header-cell-with-separator',
            cellRenderer: (params: any) => (
                <a 
                    href={params.value} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline text-[14px]"
                >
                    {params.value}
                </a>
            )
        },
        { 
            field: 'taskStatus', 
            headerName: 'Task Status',
            width: 150,
            headerClass: 'ag-header-cell-with-separator',
            cellClass: 'hover:bg-gray-100 cursor-pointer transition-colors',
            onCellClicked: (params: any) => {
                if (params.value === 'Rejected' && params.data.rejectionReason) {
                    const cellElement = params.event.target.closest('[role="gridcell"]');
                    if (cellElement) {
                        const rect = cellElement.getBoundingClientRect();
                        const tableContainer = tableRef.current;
                        
                        if (tableContainer) {
                            const tableRect = tableContainer.getBoundingClientRect();
                            const scrollLeft = tableContainer.scrollLeft;
                            const scrollTop = tableContainer.scrollTop;
                            
                            setSelectedRejectionCell({
                                rowId: params.data.id,
                                reason: params.data.rejectionReason,
                                position: { 
                                    x: rect.left - tableRect.left + scrollLeft, 
                                    y: rect.top - tableRect.top + scrollTop 
                                }
                            });
                        }
                    }
                } else {
                    setSelectedRejectionCell(null);
                }
            }
        },
        { 
            field: 'vertical', 
            headerName: 'Vertical',
            width: 120,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'language', 
            headerName: 'Language',
            width: 120,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'landingPageLanguage', 
            headerName: 'Landing Page Language',
            width: 200,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'creatives', 
            headerName: 'Creatives',
            width: 100,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'text', 
            headerName: 'Text',
            width: 250,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'headline', 
            headerName: 'Headline',
            width: 200,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'videoImage', 
            headerName: 'Video/Image',
            width: 150,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'submissionDateTime', 
            headerName: 'Submission Date and Time',
            width: 200,
            valueFormatter: (params) => {
                if (!params.value) return '';
                return new Date(params.value).toLocaleString();
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 80,
            sortable: false,
            filter: false,
            cellRenderer: (params: any) => (
                <DotButton>
                    <button
                        onClick={() => handleDone(params.data)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                    >
                        <FaCheck className="text-black w-4 h-4" />
                        <span className="text-[14px]">Done</span>
                    </button>
                    <button
                        onClick={() => handleEdit(params.data)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                    >
                        <FaRegEdit className="text-black w-4 h-4" />
                        <span className="text-[14px]">Edit</span>
                    </button>
                    <button
                        onClick={() => handleDuplicate(params.data)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                    >
                        <FaRegCopy className="text-black w-4 h-4" />
                        <span className="text-[14px]">Duplicate</span>
                    </button>
                    <button
                        onClick={() => handleReview(params.data)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                    >
                        <FaEye className="text-black w-4 h-4" />
                        <span className="text-[14px]">Review</span>
                    </button>
                    <button
                        onClick={() => handleDelete(params.data)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                    >
                        <FaTrash className="text-red-600 w-4 h-4" />
                        <span className="text-[14px]">Delete</span>
                    </button>
                </DotButton>
            )
        }
    ];

    const defaultColDef = {
        resizable: true,
        sortable: true,
        filter: false,
        wrapText: true,
        autoHeight: true,
        cellClass: 'cell-wrap-text'
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
                --ag-border-color: transparent;
                --ag-border-radius: 0;
            }
            .ag-theme-quartz .ag-root-wrapper {
                border: none;
                border-radius: 0;
            }
            .ag-theme-quartz .ag-header {
                border-radius: 0;
            }
            .ag-theme-quartz .ag-body-viewport {
                border-radius: 0;
            }
            .table-container {
                scrollbar-width: none;
                -ms-overflow-style: none;
                position: relative;
            }
            .table-container::-webkit-scrollbar {
                display: none;
            }
            .ag-theme-quartz .ag-body-horizontal-scroll {
                display: none !important;
            }
            .ag-theme-quartz .ag-body-viewport {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            .ag-theme-quartz .ag-body-viewport::-webkit-scrollbar {
                display: none;
            }
            .ag-theme-quartz .ag-center-cols-container {
                position: relative !important;
            }
            .custom-scrollbar {
                scrollbar-width: auto;
                scrollbar-color: rgba(0,0,0,0.4) #ffffff;
            }
            .custom-scrollbar::-webkit-scrollbar {
                height: 17px;
                width: 17px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #ffffff;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.4);
                border-radius: 8px;
                border: 2px solid transparent;
                background-clip: content-box;
                min-width: 30px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(0,0,0,0.6);
                background-clip: content-box;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:active {
                background: rgba(0,0,0,0.8);
                background-clip: content-box;
            }
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    return (
        <PageContainer
            title="Creative Maker"
            leftElement={
                <TableSearchBar
                    id="creative-maker-search"
                    onInput={onFilterTextBoxChanged}
                    className="pl-10 pr-10 w-[300px] h-[36px] gap-[10px] border-0 bg-[#fafafa]"
                />
            }
            rightElement={
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleBulkUpload}
                        className="bg-white text-black flex items-center justify-center h-[30px] rounded-[2px] border border-[#d9d9d9] px-[5px] py-[6.4px] shadow-sm font-normal text-base whitespace-nowrap"
                    >
                        Bulk Upload
                    </Button>
                </div>
            }
            bottomElement={
                <div className="flex items-center justify-between gap-4 h-[32px] max-w-full" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
                    <div className="flex-1 flex items-center min-w-0">
                        <CustomScrollbarH
                            tableRef={tableRef}
                            tableScrollWidth={tableScrollWidth}
                        />
                    </div>
                    
                    <div className="flex-shrink-0 ml-4" style={{ position: 'relative', zIndex: 1 }}>
                        <CustomPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                        />
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-[calc(100vh-276px)]">
                <div 
                    ref={tableRef}
                    className="w-full h-full overflow-x-auto table-container relative"
                >
                    <div className="ag-theme-quartz h-full" style={{ minWidth: '1970px' }}>
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
                            suppressHorizontalScroll={false}
                            domLayout="normal"
                            theme="legacy"
                            rowSelection="multiple"
                        />
                    </div>
                    
                    {/* Rejection Note Message */}
                    {selectedRejectionCell && (
                        <div 
                            className="absolute z-50 bg-white border border-gray-200 rounded-md p-3 shadow-lg max-w-xs"
                            style={{
                                left: selectedRejectionCell.position.x + 15,
                                top: selectedRejectionCell.position.y - 40,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-gray-800 text-sm mr-2">{selectedRejectionCell.reason}</p>
                                <button
                                    onClick={handleCloseRejectionNote}
                                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 -mt-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {/* Speech bubble tail */}
                            <div 
                                className="absolute w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-200"
                                style={{
                                    right: '10px',
                                    top: '100%'
                                }}
                            />
                            <div 
                                className="absolute w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-white"
                                style={{
                                    right: '10px',
                                    top: '100%'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default CreativeMakerTable; 