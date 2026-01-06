import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
    className = '', 
    variant = 'rectangular',
    width,
    height,
    count = 1
}) => {
    const baseClass = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';
    
    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    const elements = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            className={`${baseClass} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    ));

    return <>{elements}</>;
};

// Pre-built skeleton components for common use cases
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => (
    <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#EBE0C0' }}>
        {/* Header */}
        <div className="p-4" style={{ backgroundColor: '#242A2A' }}>
            <div className="flex gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 h-4 opacity-30" />
                ))}
            </div>
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div 
                key={rowIndex} 
                className="p-4 border-t flex gap-4"
                style={{ borderColor: '#EBE0C0', backgroundColor: rowIndex % 2 === 0 ? '#FAFAF5' : '#FFFFFF' }}
            >
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton key={colIndex} className="flex-1 h-4" />
                ))}
            </div>
        ))}
    </div>
);

export const CardSkeleton: React.FC = () => (
    <div 
        className="rounded-xl shadow-md overflow-hidden border-2"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#EBE0C0' }}
    >
        <Skeleton className="h-1.5 rounded-none" />
        <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={12} />
                    <Skeleton width="80%" height={24} />
                </div>
                <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
            </div>
        </div>
    </div>
);

export const DashboardSkeleton: React.FC = () => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
                <Skeleton width={200} height={28} />
                <Skeleton width={300} height={14} />
            </div>
            <Skeleton width={120} height={40} className="rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    </div>
);

export const PageSkeleton: React.FC<{ title?: boolean; filters?: boolean; rows?: number }> = ({ 
    title = true, 
    filters = false,
    rows = 5 
}) => (
    <div>
        {title && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="space-y-2">
                    <Skeleton width={180} height={28} />
                    <Skeleton width={250} height={14} />
                </div>
                <div className="flex gap-2">
                    <Skeleton width={100} height={40} className="rounded-lg" />
                    <Skeleton width={100} height={40} className="rounded-lg" />
                </div>
            </div>
        )}
        {filters && (
            <div className="mb-4 p-4 rounded-xl border-2" style={{ borderColor: '#EBE0C0' }}>
                <div className="flex flex-wrap gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="flex-1 min-w-[150px] h-10 rounded-lg" />
                    ))}
                </div>
            </div>
        )}
        <TableSkeleton rows={rows} columns={4} />
    </div>
);

export const InvoiceSkeleton: React.FC = () => (
    <div className="space-y-4 sm:space-y-6">
        <PageSkeleton filters={true} rows={5} />
        
        {/* Invoice Details Section */}
        <div className="rounded-xl border-2 p-4" style={{ borderColor: '#EBE0C0' }}>
            <div className="flex justify-between items-center mb-4">
                <Skeleton width={150} height={24} />
                <div className="flex gap-2">
                    <Skeleton width={80} height={36} className="rounded-lg" />
                    <Skeleton width={80} height={36} className="rounded-lg" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <Skeleton height={40} className="rounded-lg" />
                <Skeleton height={40} className="rounded-lg" />
            </div>
            <TableSkeleton rows={3} columns={4} />
        </div>
    </div>
);

export default Skeleton;
