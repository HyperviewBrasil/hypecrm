import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm border";

  const variantClasses = {
    primary: "bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 focus:ring-blue-400",
    secondary: "bg-gray-600/20 text-gray-200 border-gray-500/30 hover:bg-gray-600/30 hover:border-gray-500/50 focus:ring-gray-400",
    danger: "bg-red-500/20 text-red-200 border-red-400/30 hover:bg-red-500/30 hover:border-red-400/50 focus:ring-red-400",
    success: "bg-green-500/20 text-green-200 border-green-400/30 hover:bg-green-500/30 hover:border-green-400/50 focus:ring-green-400",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`} {...props}>
      {children}
    </button>
  );
};

export default Button;