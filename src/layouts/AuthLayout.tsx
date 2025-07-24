import { useWindowSize } from "@/hooks/useWindowSize";

interface AuthLayoutProps {
    mainComponent: React.ReactNode;
    sideComponent: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ( {mainComponent, sideComponent}: AuthLayoutProps ) => {
    const width = useWindowSize();
    const isMobile = width < 768;

    return (
        <div className="min-h-screen w-full flex items-center justify-center">
        <div className="w-full h-screen flex shadow-2xl overflow-hidden">

            {/* Auth Forms Section - 65% */}  
            <div className="min-h-screen w-full flex items-center justify-center p-4">
                <div className={`${isMobile ? 'w-full' : 'w-[65%]'} h-[50%]`}>
                    <div className="max-w-[520px] mx-auto flex flex-col">
                        {mainComponent}
                    </div>
                </div>
            </div>

            {/* Welcome Section - 35% */}
            {!isMobile && (
                <div className="w-[35%] h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-8">
                    <div className="text-center text-white">
                        {sideComponent}
                    </div>
                </div>
            )}

        </div>
    </div>
    )
}

export default AuthLayout;