import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ 
    children, 
    className, 
    variant = 'primary', 
    size = 'md', 
    ...props 
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]";
    
    const variants = {
        primary: "text-white hover:opacity-90 focus:ring-indigo-500",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    };

    const sizes = {
        sm: "px-2.5 py-1.5 text-xs sm:text-sm",
        md: "px-3 py-2 text-sm sm:text-base",
        lg: "px-4 py-2.5 sm:px-6 sm:py-3 text-base sm:text-lg",
    };

    const getPrimaryBg = variant === 'primary' ? { background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' } : {};

    return (
        <button 
            className={clsx(baseStyles, variants[variant], sizes[size], className)} 
            style={getPrimaryBg}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
