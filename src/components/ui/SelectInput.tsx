import React from 'react';
import clsx from 'clsx';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectInputProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string;
    options: SelectOption[];
    error?: string;
    onChange?: (value: string) => void;
}

const SelectInput: React.FC<SelectInputProps> = ({ 
    label, 
    options, 
    error, 
    className, 
    id, 
    onChange,
    ...props 
}) => {
    return (
        <div className="mb-3 sm:mb-4">
            {label && (
                <label htmlFor={id} className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: '#242A2A' }}>
                    {label}
                </label>
            )}
            <select
                id={id}
                className={clsx(
                    "block w-full rounded-lg shadow-sm text-sm p-2.5 sm:p-3 border-2 transition-all duration-200 bg-white cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-offset-1",
                    error 
                        ? "border-red-400 focus:border-red-500 focus:ring-red-200" 
                        : "border-[#D4C9A8] focus:border-[#242A2A] focus:ring-[#EBE0C0]",
                    className
                )}
                style={{ color: '#242A2A' }}
                onChange={(e) => onChange?.(e.target.value)}
                {...props}
            >
                <option value="">Select...</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1.5 text-xs sm:text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default SelectInput;
