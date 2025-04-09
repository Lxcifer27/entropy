const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  className = '',
  disabled = false,
  type = 'button',
  fullWidth = false
}) => {
  const baseClasses = 'font-medium rounded-md transition-all duration-200 flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50',
    secondary: 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50',
    outline: 'bg-transparent text-gray-300 border border-gray-700 hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50',
  };
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClass} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button; 