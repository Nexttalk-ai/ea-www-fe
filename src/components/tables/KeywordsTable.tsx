import { useState, useCallback, ChangeEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import Select from '../ui/Select';
import PageContainer from '../ui/PageContainer';
import TableSearchBar from '../ui/TableSearchBar';
import CustomPagination from '../ui/CustomPagination';
import CustomScrollbarH from '../ui/CustomScrollbarH';
import Button from '../ui/Button';

interface Keyword {
    id: string;
    keyword: string;
    creatorName: string;
    creationDate: string;
    vertical: string;
    language: string;
    landingPageLanguage: string;
    specialAdCategory: string;
    terms: string;
    spend: number;
    revenue: number;
    roi: number;
    cpa: number;
    cvr: number;
    revConversions: number;
    rpc: number;
}

const timeRanges = [
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' }
];

const KeywordsTable = () => {
    const navigate = useNavigate();
    const [rowData, setRowData] = useState<Keyword[]>([
        {
            id: 'KW001',
            keyword: 'digital marketing',
            creatorName: 'John Smith',
            creationDate: '2024-03-15',
            vertical: 'Marketing',
            language: 'English',
            landingPageLanguage: 'English',
            specialAdCategory: 'Business Services',
            terms: 'Standard',
            spend: 1200.50,
            revenue: 2500.75,
            roi: 108.31,
            cpa: 45.20,
            cvr: 3.75,
            revConversions: 55,
            rpc: 45.47
        },
        {
            id: 'KW002',
            keyword: 'machine learning courses',
            creatorName: 'Sarah Johnson',
            creationDate: '2024-03-14',
            vertical: 'Education',
            language: 'English',
            landingPageLanguage: 'English',
            specialAdCategory: 'Education',
            terms: 'Premium',
            spend: 2300.00,
            revenue: 5600.00,
            roi: 143.48,
            cpa: 38.33,
            cvr: 4.20,
            revConversions: 146,
            rpc: 38.36
        },
        {
            id: 'KW003',
            keyword: 'cloud computing services',
            creatorName: 'Mike Chen',
            creationDate: '2024-03-13',
            vertical: 'Technology',
            language: 'English',
            landingPageLanguage: 'English',
            specialAdCategory: 'Technology Services',
            terms: 'Enterprise',
            spend: 3500.00,
            revenue: 8900.00,
            roi: 154.29,
            cpa: 50.00,
            cvr: 5.00,
            revConversions: 178,
            rpc: 50.00
        },
        {
            id: 'KW004',
            keyword: 'data analytics tools',
            creatorName: 'Emma Davis',
            creationDate: '2024-03-12',
            vertical: 'Technology',
            language: 'English',
            landingPageLanguage: 'English',
            specialAdCategory: 'Business Software',
            terms: 'Standard',
            spend: 1800.00,
            revenue: 4200.00,
            roi: 133.33,
            cpa: 42.86,
            cvr: 3.90,
            revConversions: 98,
            rpc: 42.86
        },
        {
            id: 'KW005',
            keyword: 'cybersecurity solutions',
            creatorName: 'Alex Turner',
            creationDate: '2024-03-11',
            vertical: 'Security',
            language: 'English',
            landingPageLanguage: 'English',
            specialAdCategory: 'Security Services',
            terms: 'Premium',
            spend: 4200.00,
            revenue: 9800.00,
            roi: 133.33,
            cpa: 55.26,
            cvr: 4.50,
            revConversions: 177,
            rpc: 55.37
        },
        {
            id: 'KW006',
            keyword: 'artificial intelligence',
            creatorName: 'Lisa Wong',
            creationDate: '2024-03-10',
            vertical: 'Technology',
            language: 'English',
            landingPageLanguage: 'English',
            specialAdCategory: 'Technology Services',
            terms: 'Enterprise',
            spend: 5000.00,
            revenue: 12000.00,
            roi: 140.00,
            cpa: 48.00,
            cvr: 5.20,
            revConversions: 250,
            rpc: 48.00
        },
        {
            id: 'KW007',
            keyword: 'business analytics',
            creatorName: 'David Brown',
            creationDate: '2024-03-09',
            vertical: 'Business',
            language: 'English',
            landingPageLanguage: 'English',
            specialAdCategory: 'Business Services',
            terms: 'Standard',
            spend: 1500.00,
            revenue: 3800.00,
            roi: 153.33,
            cpa: 40.43,
            cvr: 3.80,
            revConversions: 94,
            rpc: 40.43
        }
    ]);
    const [selectedTimeRange, setSelectedTimeRange] = useState('7');
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [quickFilterText, setQuickFilterText] = useState<string>();
    const tableRef = useRef<HTMLDivElement>(null);
    const [tableScrollWidth, setTableScrollWidth] = useState(2300);



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

    // Update table scroll width when tableRef changes
    useEffect(() => {
        if (tableRef.current) {
            const updateScrollWidth = () => {
                setTableScrollWidth(tableRef.current!.scrollWidth);
            };
            updateScrollWidth();
            
            // Also listen for table content changes
            const observer = new ResizeObserver(updateScrollWidth);
            observer.observe(tableRef.current!);
            
            return () => observer.disconnect();
        }
    }, [tableRef]);



    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
        // Comment out to prevent auto-fitting columns
        // params.api.sizeColumnsToFit();
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
            // Comment out to prevent auto-fitting columns
            // gridApi.sizeColumnsToFit();
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

    const columnDefs: ColDef[] = [
        { 
            field: 'id', 
            headerName: 'ID',
            width: 100,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'keyword', 
            headerName: 'Keyword',
            width: 200,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'creatorName', 
            headerName: 'Creator Name',
            width: 180,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'creationDate', 
            headerName: 'Creation Date',
            width: 150,
            valueFormatter: (params) => {
                if (!params.value) return '';
                return new Date(params.value).toLocaleDateString();
            },
            headerClass: 'ag-header-cell-with-separator'
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
            width: 250,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'specialAdCategory', 
            headerName: 'Special Ad Category',
            width: 250,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'terms', 
            headerName: 'Terms',
            width: 120,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'spend', 
            headerName: 'Spend',
            width: 120,
            valueFormatter: (params) => {
                if (typeof params.value !== 'number') return '';
                return `$${params.value.toFixed(2)}`;
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'revenue', 
            headerName: 'Revenue',
            width: 120,
            valueFormatter: (params) => {
                if (typeof params.value !== 'number') return '';
                return `$${params.value.toFixed(2)}`;
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'roi', 
            headerName: 'ROI',
            width: 100,
            valueFormatter: (params) => {
                if (typeof params.value !== 'number') return '';
                return `${params.value.toFixed(2)}%`;
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'cpa', 
            headerName: 'CPA',
            width: 100,
            valueFormatter: (params) => {
                if (typeof params.value !== 'number') return '';
                return `$${params.value.toFixed(2)}`;
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'cvr', 
            headerName: 'CVR',
            width: 100,
            valueFormatter: (params) => {
                if (typeof params.value !== 'number') return '';
                return `${params.value.toFixed(2)}%`;
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'revConversions', 
            headerName: 'Rev Conversions',
            width: 150,
            valueFormatter: (params) => {
                if (typeof params.value !== 'number') return '';
                return params.value.toFixed(0);
            },
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'rpc', 
            headerName: 'RPC',
            width: 100,
            valueFormatter: (params) => {
                if (typeof params.value !== 'number') return '';
                return `$${params.value.toFixed(2)}`;
            },
            headerClass: 'ag-header-cell-with-separator'
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

    const handleTimeRangeChange = (values: string[]) => {
        setSelectedTimeRange(values[0]);
        // Here you would typically fetch new data based on the selected time range
    };

    const handleAdd = () => {
        navigate('add');
    };

    const handleEdit = () => {
        navigate('edit');
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
            /* Hide table scrollbar */
            .table-container {
                scrollbar-width: none;
                -ms-overflow-style: none;
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
            /* Custom scrollbar styling - white background with darker elements */
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
            title="Keywords Bank"
            leftElement={
                <div className="flex items-center gap-4">
                    <TableSearchBar
                        id="keywords-search"
                        onInput={onFilterTextBoxChanged}
                        className="pl-10 pr-10 w-[300px] h-[36px] gap-[10px] border-0 bg-[#fafafa]"
                    />
                    <Select
                        id="timeRange"
                        value={[selectedTimeRange]}
                        onChange={handleTimeRangeChange}
                        options={timeRanges}
                        multipleSelect={false}
                    />
                </div>
            }
            rightElement={
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleEdit}
                        className="bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                    >
                        Edit
                    </Button>
                    <Button
                        onClick={handleAdd}
                        className="bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                    >
                        Add
                    </Button>
                </div>
            }
            bottomElement={
                <div className="flex items-center justify-between gap-4 h-[32px] max-w-full" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
                    {/* Custom horizontal scrollbar */}
                    <div className="flex-1 flex items-center min-w-0">
                        <CustomScrollbarH
                            tableRef={tableRef}
                            tableScrollWidth={tableScrollWidth}
                        />
                    </div>
                    
                    {/* Pagination */}
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
                    className="w-full h-full overflow-x-auto table-container"
                >
                    <div className="ag-theme-quartz h-full" style={{ minWidth: '2300px' }}>
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
                        />
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default KeywordsTable; 