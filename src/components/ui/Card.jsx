const Card = ({
  children,
  className = '',
  title,
  subtitle,
  headerActions,
  footerContent,
  noPadding = false
}) => {
  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 shadow-lg flex flex-col ${className}`}>
      {(title || headerActions) && (
        <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
          <div>
            {title && <h3 className="font-medium text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
          {headerActions && <div className="flex items-center">{headerActions}</div>}
        </div>
      )}
      
      <div className={`${noPadding ? '' : 'p-4'} overflow-auto flex-grow`}>
        {children}
      </div>
      
      {footerContent && (
        <div className="p-4 border-t border-gray-800 shrink-0">
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default Card; 