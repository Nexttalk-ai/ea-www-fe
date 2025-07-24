import { Modal } from './Modal';
import Button from './Button';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
}

export const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false
}: DeleteConfirmationModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            classNameBackground="bg-black/50"
            classNameModal="fixed w-[320px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
            <div className="w-full h-[244px] rounded-[8px] border border-[#D9E1E7] p-5 bg-white shadow-[0_4px_6px_-2px_#1212170D]">
                <div className="flex flex-col h-full">
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 ml-auto"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex-grow"></div>
                    <div className="h-[22px] flex justify-center items-center mb-[6px]">
                        <h2 className="text-xl font-semibold">{title}</h2>
                    </div>
                    <div className="h-[34px] mb-[6px] flex justify-center">
                        <p className="text-black text-[14px] leading-[160%] font-normal text-center">{message}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={onConfirm}
                            className="w-full h-[44px] rounded-[2px] bg-[#EA3A3D] text-white hover:bg-[#d43436]"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Yes'}
                        </Button>
                        <Button
                            onClick={onClose}
                            className="w-full h-[44px] rounded-[2px] bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                            disabled={isLoading}
                        >
                            No
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}; 