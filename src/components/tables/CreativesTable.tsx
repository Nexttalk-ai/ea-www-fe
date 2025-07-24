import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { FaPlus, FaRegEdit, FaRegCopy, FaEye, FaRegTrashAlt, FaRegCommentAlt, FaShare } from 'react-icons/fa';
import { AiOutlineLike } from 'react-icons/ai';
import { BsThreeDots } from 'react-icons/bs';
import { BiMessageRounded } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import PageContainer from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';
import TableSearchBar from '@/components/ui/TableSearchBar';
import CustomPagination from '@/components/ui/CustomPagination';
import DotButton from '@/components/ui/DotButton';
import Notification from '@/components/ui/Notification';

ModuleRegistry.registerModules([AllCommunityModule]);

// Types
interface Creative {
    id: string;
    creative: { imageUrl: string; title: string; };
    text: string;
    headline: string;
    language: string;
    keywords: string[];
    active: boolean;
    spend: number;
    roi: number;
    cpa: number;
    rpc: number;
    platforms: string[];
    creationDate: string;
    lastUpdated: string;
    cm: string;
}

interface Platform { id: string; name: string; template: string; }
interface PreviewModalProps { isOpen: boolean; onClose: () => void; creative: Creative; }
interface ValueFormatterParams { value: any; }
interface CellRendererParams { value: any; data: Creative; }

// Constants
const CONSTANTS = {
    languages: ['All', 'English', 'Spanish', 'French', 'German'],
    dates: ['All', 'Creation Date', 'Last Updated'],
    statuses: ['All', 'Active', 'Not Active'],
    platforms: [
        { id: 'facebook_ads', name: 'Facebook Ads', template: 'social_feed' },
        { id: 'instagram_stories', name: 'Instagram Stories', template: 'stories' },
        { id: 'gdn', name: 'Google Ads GDN', template: 'display' },
        { id: 'taboola', name: 'Taboola', template: 'native' },
        { id: 'outbrain', name: 'Outbrain', template: 'native' }
    ] as Platform[]
};

const PlatformPreview: React.FC<{ platform: Platform; creative: Creative; isSelected: boolean }> = ({ platform, creative, isSelected }) => {
    if (!isSelected) return null;

    const renderPreview = () => {
        switch (platform.template) {
            case 'social_feed':
                return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-w-md">
                        <div className="p-3">
                            <div className="flex items-center mb-2">
                                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                <div className="ml-2">
                                    <div className="text-sm font-semibold">Page Name · <span className="text-gray-500 font-normal">Sponsored</span></div>
                                </div>
                            </div>
                            <p className="text-sm mb-3">{creative.text}</p>
                            <img src={creative.creative.imageUrl} alt={creative.creative.title} className="w-full h-48 object-cover rounded mb-3" />
                            <div className="border border-gray-200 rounded">
                                <div className="p-2">
                                    <div className="text-xs uppercase text-gray-500">{creative.creative.title}</div>
                                    <div className="font-semibold">{creative.creative.title}</div>
                                </div>
                                <div className="px-2 py-1 bg-gray-50 border-t">
                                    <button className="w-full text-blue-600 font-semibold">Learn More</button>
                                </div>
                            </div>
                            <div className="mt-3 pt-2 border-t flex items-center space-x-4 text-sm text-gray-500">
                                <button className="flex items-center space-x-1"><AiOutlineLike /><span>Like</span></button>
                                <button className="flex items-center space-x-1"><FaRegCommentAlt /><span>Comment</span></button>
                                <button className="flex items-center space-x-1"><FaShare /><span>Share</span></button>
                            </div>
                        </div>
                    </div>
                );

            case 'stories':
                return (
                    <div className="relative w-80 h-96 bg-black mx-auto overflow-hidden rounded-lg">
                        <img src={creative.creative.imageUrl} alt={creative.creative.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-0 right-0 px-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-red-500 bg-gray-200"></div>
                                    <span className="text-white text-sm ml-2">Page Name</span>
                                </div>
                                <BsThreeDots className="text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <p className="text-white mb-4">{creative.text}</p>
                            <div className="flex items-center space-x-4">
                                <div className="flex-1 bg-black/30 rounded-full p-2 text-center">
                                    <span className="text-white text-sm">Learn More</span>
                                </div>
                                <BiMessageRounded className="text-white" size={24} />
                                <FaShare className="text-white" size={20} />
                            </div>
                        </div>
                    </div>
                );

            case 'display':
                return (
                    <div className="w-80 h-64 border border-gray-300 rounded overflow-hidden bg-white">
                        <div className="h-6 bg-gray-100 border-b flex items-center px-2 justify-between">
                            <span className="text-xs text-blue-600">Ads</span>
                            <span className="text-xs text-gray-500">Close Ad</span>
                        </div>
                        <img src={creative.creative.imageUrl} alt={creative.creative.title} className="w-full h-32 object-cover" />
                        <div className="p-2">
                            <div className="text-xs text-blue-600 mb-1">Ad · www.example.com</div>
                            <h3 className="font-medium text-sm mb-1">{creative.creative.title}</h3>
                            <p className="text-xs text-gray-600">{creative.text}</p>
                        </div>
                    </div>
                );

            case 'native':
                return (
                    <div className="w-96 bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="flex">
                            <img src={creative.creative.imageUrl} alt={creative.creative.title} className="w-32 h-24 object-cover" />
                            <div className="flex-1 p-3">
                                <div className="text-xs text-gray-500 mb-1">
                                    {platform.id === 'taboola' ? 'Sponsored Content By Taboola' : 'recommended by Outbrain'}
                                </div>
                                <h3 className="font-bold text-sm mb-1">{creative.creative.title}</h3>
                                <p className="text-xs text-gray-600 mb-1">{creative.text}</p>
                                <div className="text-xs text-gray-500">Brand Name</div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div className="text-center p-8">Preview not available</div>;
        }
    };

    return (
        <div className="w-full h-full bg-white rounded-lg flex items-center justify-center p-8">
            {renderPreview()}
        </div>
    );
};

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, creative }) => {
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>(CONSTANTS.platforms[0]);
    const [showError, setShowError] = useState(false);

    const handlePlatformSelect = (platform: Platform) => {
        if (!creative.platforms.includes(platform.name)) {
            setShowError(true);
            return;
        }
        setSelectedPlatform(platform);
        setShowError(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-[900px] h-[600px] flex flex-col">
                    <div className="relative border-b border-gray-200 p-4">
                        <h2 className="text-xl font-semibold text-center">Preview Ads</h2>
                        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
                            <IoClose size={24} />
                        </button>
                    </div>
                    <div className="flex flex-1 min-h-0">
                        <div className="w-48 border-r border-gray-200 p-4">
                            <div className="space-y-2">
                                {CONSTANTS.platforms.map((platform: Platform) => (
                                    <button
                                        key={platform.id}
                                        onClick={() => handlePlatformSelect(platform)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                            selectedPlatform.id === platform.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        {platform.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <PlatformPreview
                                platform={selectedPlatform}
                                creative={creative}
                                isSelected={creative.platforms.includes(selectedPlatform.name)}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {showError && (
                <Notification type="error" position="top-right" onClose={() => setShowError(false)}>
                    <div>
                        <p className="font-semibold">Not Compatible</p>
                        <p className="text-sm text-gray-500">This creative is not configured for this platform</p>
                    </div>
                </Notification>
            )}
        </>
    );
};

const CreativesTable: React.FC = () => {
    const gridApiRef = useRef<GridApi | null>(null);
    const [allData, setAllData] = useState<Creative[]>([]);
    const [rowData, setRowData] = useState<Creative[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
    const [selectedDate, setSelectedDate] = useState<string>('All');
    const [selectedStatus, setSelectedStatus] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [quickFilterText, setQuickFilterText] = useState('');
    const [filteredData, setFilteredData] = useState<Creative[]>([]);
    const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const languages = ['All', 'English', 'Spanish', 'French', 'German'];
    const dates = ['All', 'Created At', 'Last Updated'];
    const statuses = ['All', 'Active', 'Not Active'];
    const rowsPerPageOptions = [10, 30, 50];

    const handleDotButtonAction = (action: string, data: Creative) => {
        switch (action) {
            case 'Show Ads':
                setSelectedCreative(data);
                setIsPreviewModalOpen(true);
                break;
            default:
                console.log(`${action} action for creative:`, data);
        }
    };

    const calculateRowsPerPage = () => {
        // Default to 10 rows per page
        return 10;
    };

    // Filter function
    const applyFilters = useCallback(() => {
        let filtered = [...allData];

        // Language filter
        if (selectedLanguage !== 'All') {
            filtered = filtered.filter(item => item.language === selectedLanguage);
        }

        // Status filter
        if (selectedStatus !== 'All') {
            const isActive = selectedStatus === 'Active';
            filtered = filtered.filter(item => item.active === isActive);
        }

        // Date filter
        if (selectedDate === 'Created At') {
            filtered = filtered.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
        } else if (selectedDate === 'Last Updated') {
            filtered = filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        }

        setFilteredData(filtered);
        setTotalPages(filtered.length > 0 ? Math.ceil(filtered.length / rowsPerPage) : 1);
        setCurrentPage(1);
        
        // Reset to first page when filters change
        if (gridApiRef.current) {
            gridApiRef.current.paginationGoToPage(0);
        }
    }, [allData, selectedLanguage, selectedStatus, selectedDate, rowsPerPage]);

    // Apply filters when filter values change
    useEffect(() => {
        if (allData.length > 0) {
            applyFilters();
        }
    }, [selectedLanguage, selectedStatus, selectedDate, applyFilters]);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        gridApiRef.current = params.api;
        params.api.sizeColumnsToFit();
        params.api.setGridOption('paginationPageSize', rowsPerPage);
        params.api.paginationGoToPage(0);
    }, [rowsPerPage]);

    const onPaginationChanged = useCallback(() => {
        if (gridApiRef.current) {
            const currentPageFromGrid = gridApiRef.current.paginationGetCurrentPage() + 1;
            const totalPagesFromGrid = gridApiRef.current.paginationGetTotalPages();
            setCurrentPage(currentPageFromGrid);
            setTotalPages(Math.max(1, totalPagesFromGrid));
        }
    }, []);

    const onPageChange = useCallback((page: number) => {
        if (gridApiRef.current) {
            gridApiRef.current.paginationGoToPage(page - 1);
            setCurrentPage(page);
        }
    }, []);

    const mockData: Creative[] = [
        {
            id: '1',
            creative: { imageUrl: 'https://picsum.photos/200/300?random=1', title: 'Summer Sale Banner' },
            text: 'Get up to 50% off on all summer items! Limited time offer.',
            headline: 'Summer Mega Sale',
            language: 'English',
            keywords: ['summer', 'sale', 'discount'],
            active: true,
            spend: 1200.50,
            roi: 245.30,
            cpa: 12.40,
            rpc: 30.50,
            platforms: ['Facebook Ads', 'Instagram Stories'],
            creationDate: '2024-12-15',
            lastUpdated: '2024-12-20',
            cm: 'John Doe'
        },
        {
            id: '2',
            creative: { imageUrl: 'https://picsum.photos/200/300?random=2', title: 'Winter Collection' },
            text: 'Discover our new winter collection. Stay warm in style!',
            headline: 'New Winter Collection',
            language: 'Spanish',
            keywords: ['winter', 'fashion', 'collection'],
            active: true,
            spend: 800.75,
            roi: 180.25,
            cpa: 15.60,
            rpc: 28.20,
            platforms: ['Facebook Ads', 'Taboola'],
            creationDate: '2024-11-20',
            lastUpdated: '2024-12-18',
            cm: 'Jane Smith'
        },
        {
            id: '3',
            creative: { imageUrl: 'https://picsum.photos/200/300?random=3', title: 'Spring Promotion' },
            text: 'Welcome spring with our new collection. Fresh styles available now!',
            headline: 'Spring is Here',
            language: 'French',
            keywords: ['spring', 'fashion', 'new'],
            active: false,
            spend: 600.25,
            roi: 150.80,
            cpa: 18.90,
            rpc: 25.40,
            platforms: ['Google Ads GDN', 'Outbrain'],
            creationDate: '2024-12-01',
            lastUpdated: '2024-12-19',
            cm: 'Alice Johnson'
        },
        {
            id: '4',
            creative: { imageUrl: 'https://picsum.photos/200/300?random=4', title: 'Tech Gadgets' },
            text: 'Explore the latest tech gadgets. Innovation at your fingertips!',
            headline: 'Tech Innovation',
            language: 'German',
            keywords: ['tech', 'gadgets', 'innovation'],
            active: true,
            spend: 1500.00,
            roi: 300.45,
            cpa: 20.30,
            rpc: 45.60,
            platforms: ['Taboola', 'Outbrain'],
            creationDate: '2024-10-28',
            lastUpdated: '2024-12-17',
            cm: 'Mark Wilson'
        },
        {
            id: '5',
            creative: { imageUrl: 'https://picsum.photos/200/300?random=5', title: 'Holiday Special' },
            text: 'Special holiday deals on all products. Celebrate with us!',
            headline: 'Holiday Deals',
            language: 'English',
            keywords: ['holiday', 'special', 'deals'],
            active: true,
            spend: 950.25,
            roi: 200.15,
            cpa: 14.75,
            rpc: 32.80,
            platforms: ['Facebook Ads', 'Instagram Stories', 'Google Ads GDN'],
            creationDate: '2024-12-05',
            lastUpdated: '2024-12-21',
            cm: 'Sarah Brown'
        },
        {
            id: '6',
            creative: { imageUrl: 'https://picsum.photos/200/300?random=6', title: 'Fitness Challenge' },
            text: 'Join our 30-day fitness challenge! Transform your life with expert guidance.',
            headline: 'Transform Your Life',
            language: 'Spanish',
            keywords: ['fitness', 'health', 'challenge', 'workout'],
            active: true,
            spend: 750.80,
            roi: 190.60,
            cpa: 16.25,
            rpc: 31.15,
            platforms: ['Instagram Stories', 'Taboola', 'Outbrain'],
            creationDate: '2024-11-10',
            lastUpdated: '2024-12-16',
            cm: 'David Martinez'
        },
        {
            id: '7',
            creative: { imageUrl: 'https://picsum.photos/200/300?random=7', title: 'Home Office Setup' },
            text: 'Create your perfect workspace with our home office collection. Comfort meets productivity!',
            headline: 'Work From Home Setup',
            language: 'French',
            keywords: ['home office', 'workspace', 'productivity', 'furniture'],
            active: false,
            spend: 1100.30,
            roi: 220.75,
            cpa: 19.80,
            rpc: 43.25,
            platforms: ['Facebook Ads', 'Google Ads GDN', 'Outbrain'],
            creationDate: '2024-09-30',
            lastUpdated: '2024-12-15',
            cm: 'Emma Wilson'
        },
        {
            id: '8',
            creative: {
                imageUrl: 'https://picsum.photos/200/300?random=8',
                title: 'Online Learning Platform'
            },
            text: 'Master new skills with our comprehensive online courses. Learn at your own pace!',
            headline: 'Learn New Skills',
            language: 'English',
            keywords: ['education', 'online', 'courses', 'skills'],
            active: true,
            spend: 2200.00,
            roi: 275.50,
            cpa: 22.40,
            rpc: 38.90,
            platforms: ['Facebook', 'Google', 'LinkedIn'],
            creationDate: '2024-02-20',
            lastUpdated: '2024-03-18',
            cm: 'Michael Chen'
        },
        {
            id: '9',
            creative: {
                imageUrl: 'https://picsum.photos/200/300?random=9',
                title: 'Eco-Friendly Products'
            },
            text: 'Go green with our sustainable and eco-friendly product line. Save the planet!',
            headline: 'Sustainable Living',
            language: 'German',
            keywords: ['eco', 'sustainable', 'green', 'environment'],
            active: true,
            spend: 890.75,
            roi: 165.30,
            cpa: 17.85,
            rpc: 29.65,
            platforms: ['Instagram', 'Pinterest', 'TikTok'],
            creationDate: '2024-03-02',
            lastUpdated: '2024-03-16',
            cm: 'Anna Schmidt'
        },
        {
            id: '10',
            creative: {
                imageUrl: 'https://picsum.photos/200/300?random=10',
                title: 'Mobile App Launch'
            },
            text: 'Download our revolutionary mobile app now! Experience the future of productivity.',
            headline: 'Revolutionary App',
            language: 'Spanish',
            keywords: ['app', 'mobile', 'productivity', 'download'],
            active: false,
            spend: 1650.50,
            roi: 195.80,
            cpa: 24.70,
            rpc: 41.25,
            platforms: ['Facebook', 'Instagram', 'Google'],
            creationDate: '2024-01-25',
            lastUpdated: '2024-03-11',
            cm: 'Carlos Rodriguez'
        },
        {
            id: '11',
            creative: {
                imageUrl: 'https://picsum.photos/200/300?random=11',
                title: 'Travel Destinations'
            },
            text: 'Discover breathtaking destinations around the world. Your adventure awaits!',
            headline: 'Adventure Awaits',
            language: 'French',
            keywords: ['travel', 'adventure', 'destinations', 'vacation'],
            active: true,
            spend: 1320.25,
            roi: 235.60,
            cpa: 19.50,
            rpc: 35.40,
            platforms: ['Facebook', 'Instagram', 'YouTube'],
            creationDate: '2024-02-05',
            lastUpdated: '2024-03-20',
            cm: 'Sophie Dubois'
        },
        {
            id: '12',
            creative: {
                imageUrl: 'https://picsum.photos/200/300?random=12',
                title: 'Cooking Masterclass'
            },
            text: 'Learn to cook like a professional chef with our step-by-step masterclass series.',
            headline: 'Cook Like a Pro',
            language: 'English',
            keywords: ['cooking', 'chef', 'masterclass', 'recipes'],
            active: true,
            spend: 780.90,
            roi: 158.40,
            cpa: 16.80,
            rpc: 28.90,
            platforms: ['YouTube', 'Facebook', 'Pinterest'],
            creationDate: '2024-02-12',
            lastUpdated: '2024-03-17',
            cm: 'Gordon Baker'
        },
        {
            id: '13',
            creative: {
                imageUrl: 'https://picsum.photos/200/300?random=13',
                title: 'Smart Home Technology'
            },
            text: 'Transform your home into a smart home with our cutting-edge IoT devices.',
            headline: 'Smart Home Revolution',
            language: 'German',
            keywords: ['smart home', 'IoT', 'technology', 'automation'],
            active: false,
            spend: 2100.00,
            roi: 285.70,
            cpa: 26.30,
            rpc: 47.80,
            platforms: ['LinkedIn', 'Facebook', 'Google'],
            creationDate: '2024-01-18',
            lastUpdated: '2024-03-13',
            cm: 'Klaus Mueller'
        },
        {
            id: '14',
            creative: {
                imageUrl: 'https://picsum.photos/200/300?random=14',
                title: 'Fashion Trends 2024'
            },
            text: 'Stay ahead of fashion trends with our exclusive 2024 collection. Style redefined!',
            headline: 'Fashion Forward',
            language: 'Spanish',
            keywords: ['fashion', 'trends', 'style', 'collection'],
            active: true,
            spend: 1450.60,
            roi: 210.90,
            cpa: 21.20,
            rpc: 36.70,
            platforms: ['Instagram', 'TikTok', 'Pinterest'],
            creationDate: '2024-02-25',
            lastUpdated: '2024-03-19',
            cm: 'Isabella Garcia'
        },
        {
            id: '15',
            creative: {
                imageUrl: 'https://picsum.photos/200/300?random=15',
                title: 'Cryptocurrency Guide'
            },
            text: 'Master cryptocurrency trading with our comprehensive guide. Invest smart, invest safe!',
            headline: 'Crypto Mastery',
            language: 'English',
            keywords: ['crypto', 'trading', 'investment', 'blockchain'],
            active: true,
            spend: 3200.00,
            roi: 350.25,
            cpa: 28.90,
            rpc: 52.60,
            platforms: ['LinkedIn', 'Facebook', 'Twitter'],
            creationDate: '2024-03-08',
            lastUpdated: '2024-03-21',
            cm: 'Robert Kim'
        }
    ];

    // Load mock data on component mount
    useEffect(() => {
        setIsLoading(true);
        // Simulate API call delay
        setTimeout(() => {
            setAllData(mockData);
            setFilteredData(mockData);
            setIsLoading(false);
        }, 1000);
    }, []);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (gridApiRef.current) {
                gridApiRef.current.sizeColumnsToFit();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Add styles for header separators and remove borders
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
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    const columnDefs: ColDef[] = [
        { 
            field: 'creative',
            headerName: 'Creative',
            flex: 1,
            minWidth: 90,
            headerClass: 'ag-header-cell-with-separator',
            cellRenderer: (params: any) => (
                <div className="flex items-center justify-center">
                    <img 
                        src={params.value.imageUrl} 
                        alt={params.value.title}
                        className="w-16 h-24 object-cover rounded"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x96?text=No+Image';
                        }}
                    />
                </div>
            )
        },
        { field: 'text', headerName: 'Text', flex: 1, minWidth: 200, wrapText: true, autoHeight: true, headerClass: 'ag-header-cell-with-separator' },
        { field: 'headline', headerName: 'Headline', flex: 1, minWidth: 150, wrapText: true, autoHeight: true, headerClass: 'ag-header-cell-with-separator' },
        { field: 'language', headerName: 'Language', flex: 1, minWidth: 100, headerClass: 'ag-header-cell-with-separator' },
        { 
            field: 'keywords',
            headerName: 'Keywords',
            flex: 1,
            minWidth: 150,
            valueFormatter: (params: ValueFormatterParams) => params.value?.join(', ') || '',
            wrapText: true,
            autoHeight: true,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'active',
            headerName: 'Active',
            flex: 1,
            minWidth: 100,
            headerClass: 'ag-header-cell-with-separator',
            cellRenderer: (params: CellRendererParams) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {params.value ? 'Active' : 'Not Active'}
                </span>
            )
        },
        { 
            field: 'spend',
            headerName: 'Spend',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2) || '0.00'}`,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'roi',
            headerName: 'ROI',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => `${params.value?.toFixed(2) || '0.00'}%`,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'cpa',
            headerName: 'CPA',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2) || '0.00'}`,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'rpc',
            headerName: 'RPC',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2) || '0.00'}`,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'platforms',
            headerName: 'Platforms',
            flex: 1,
            minWidth: 150,
            valueFormatter: (params: ValueFormatterParams) => params.value?.join(', ') || '',
            wrapText: true,
            autoHeight: true,
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'creationDate',
            headerName: 'Creation Date',
            flex: 1,
            minWidth: 150,
            valueFormatter: (params: ValueFormatterParams) => params.value ? new Date(params.value).toLocaleDateString() : '',
            headerClass: 'ag-header-cell-with-separator'
        },
        { 
            field: 'lastUpdated',
            headerName: 'Last Updated',
            flex: 1,
            minWidth: 150,
            valueFormatter: (params: ValueFormatterParams) => params.value ? new Date(params.value).toLocaleDateString() : '',
            headerClass: 'ag-header-cell-with-separator'
        },
        { field: 'cm', headerName: 'CM', flex: 1, minWidth: 100, headerClass: 'ag-header-cell-with-separator' },
        {
            width: 20,
            filter: false,
            sortable: false,
            cellRenderer: (params: CellRendererParams) => (
                <div className="flex items-center justify-center">
                    <DotButton>
                        <button
                            onClick={() => handleDotButtonAction('Create', params.data)}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                        >
                            <FaPlus className="text-black w-4 h-4" />
                            <span className="text-[14px]">Create</span>
                        </button>
                        <button
                            onClick={() => handleDotButtonAction('Edit', params.data)}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                        >
                            <FaRegEdit className="text-black w-4 h-4" />
                            <span className="text-[14px]">Edit</span>
                        </button>
                        <button
                            onClick={() => handleDotButtonAction('Duplicate', params.data)}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                        >
                            <FaRegCopy className="text-black w-4 h-4" />
                            <span className="text-[14px]">Duplicate</span>
                        </button>
                        <button
                            onClick={() => handleDotButtonAction('Show Ads', params.data)}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                        >
                            <FaEye className="text-black w-4 h-4" />
                            <span className="text-[14px]">Show Ads</span>
                        </button>
                        <button
                            onClick={() => handleDotButtonAction('Delete', params.data)}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
                        >
                            <FaRegTrashAlt className="text-[#EA3A3D] w-4 h-4" />
                            <span className="text-[14px] text-[#EA3A3D]">Delete</span>
                        </button>
                    </DotButton>
                </div>
            )
        }
    ];

    const defaultColDef = {
        resizable: true,
        sortable: true,
        filter: false,
        suppressHeaderMenuButton: true
    };

    const handleAdd = () => {
        // Handle add action
        console.log('Add new creative');
    };

    const handleRowsPerPageChange = (newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage);
        if (gridApiRef.current) {
            gridApiRef.current.setGridOption('paginationPageSize', newRowsPerPage);
            gridApiRef.current.paginationGoToPage(0);
            setCurrentPage(1);
        }
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
                --ag-row-height: 122px !important;
                --ag-header-height: 55px !important;
                width: 100% !important;
                height: 100% !important;
            }
            .ag-theme-quartz .ag-root-wrapper {
                border: none;
            }
            .ag-theme-quartz .ag-center-cols-container {
                width: 100%;
            }
            .ag-theme-quartz .ag-header {
                border-bottom: 1px solid #f0f0f0;
            }
            .ag-theme-quartz .ag-row {
                border-bottom: 1px solid #f0f0f0;
            }
            .ag-theme-quartz .ag-row-hover {
                background-color: #fafafa !important;
            }
            .table-container {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            .table-container::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    return (
        <PageContainer
            title="Creatives"
            leftElement={
                <TableSearchBar
                    id="creatives-search"
                    onInput={(e) => setQuickFilterText(e.target.value)}
                    className="pl-10 pr-10 w-[300px] h-[36px] gap-[10px] border-0 bg-[#fafafa]"
                />
            }
            centerElement={
                <div className="flex gap-4 h-[32px]">
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="px-3 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={selectedLanguage} hidden>Language: {selectedLanguage}</option>
                        {CONSTANTS.languages.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <select
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={selectedDate} hidden>Date: {selectedDate}</option>
                        {CONSTANTS.dates.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={selectedStatus} hidden>Status: {selectedStatus}</option>
                        {CONSTANTS.statuses.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            }
            rightElement={
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => console.log('Delete')}
                        className="bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                    >
                        Delete
                    </Button>
                    <Button
                        onClick={() => console.log('Add')}
                        className="bg-white text-black flex items-center justify-center gap-[10px] w-[96px] h-[30px] rounded-[2px] border border-[#d9d9d9] px-[15px] py-[6.4px] shadow-sm font-normal text-base"
                    >
                        Add
                    </Button>
                </div>
            }
            bottomElement={
                <div className="flex items-center justify-between h-[32px]">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Rows per page:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                            className="px-2 py-1 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {rowsPerPageOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                </div>
            }
        >
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <>
                    <div className="flex-1 ag-theme-quartz" style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
                        <style>
                            {`
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
                                .ag-theme-quartz .ag-header-cell-label {
                                    justify-content: center !important;
                                    text-align: center !important;
                                }
                                .ag-theme-quartz .ag-header-cell-text {
                                    text-align: center !important;
                                }
                                .ag-theme-quartz .ag-header-cell {
                                    background-color: #f8f9fa !important;
                                }
                                .ag-theme-quartz {
                                    --ag-row-height: 122px;
                                    --ag-header-height: 55px;
                                    --ag-borders: none;
                                    --ag-borders-secondary: none;
                                    --ag-header-column-separator-display: none;
                                    --ag-border-color: transparent;
                                    --ag-border-radius: 0;
                                }
                                .ag-theme-quartz .ag-root-wrapper {
                                    border: none;
                                    border-radius: 0;
                                }
                                .ag-theme-quartz .ag-header {
                                    border-bottom: 1px solid #f0f0f0;
                                    border-radius: 0;
                                    background-color: #f8f9fa !important;
                                }
                                .ag-theme-quartz .ag-body-viewport {
                                    border-radius: 0;
                                }
                                .ag-theme-quartz .ag-row {
                                    border-bottom: 1px solid #f0f0f0;
                                }
                                .ag-theme-quartz .ag-row-hover {
                                    background-color: #fafafa !important;
                                }
                                .ag-theme-quartz .ag-paging-panel {
                                    display: none !important;
                                }
                                .ag-theme-quartz .ag-overlay-no-rows-wrapper {
                                    display: flex !important;
                                    align-items: center !important;
                                    justify-content: center !important;
                                    height: 200px !important;
                                }
                            `}
                        </style>
                        <AgGridReact
                            rowData={filteredData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            onGridReady={onGridReady}
                            onPaginationChanged={onPaginationChanged}
                            pagination={true}
                            paginationPageSize={rowsPerPage}
                            quickFilterText={quickFilterText}
                            suppressPaginationPanel={true}
                            animateRows={true}
                            rowHeight={122}
                            headerHeight={55}
                            suppressHorizontalScroll={true}
                            overlayNoRowsTemplate={`<div class="text-gray-500 text-center py-8">No creatives found matching your filters</div>`}
                        />
                    </div>
                    {selectedCreative && (
                        <PreviewModal
                            isOpen={isPreviewModalOpen}
                            onClose={() => setIsPreviewModalOpen(false)}
                            creative={selectedCreative}
                        />
                    )}
                </>
            )}
        </PageContainer>
    );
};

export default CreativesTable; 