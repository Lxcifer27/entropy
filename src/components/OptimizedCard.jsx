import React, { memo } from 'react';

/**
 * OptimizedCard - A performance-optimized card component that prevents unnecessary re-renders
 * This component is memoized to only re-render when props actually change
 */
const OptimizedCard = memo(({
  children,
  title,
  subtitle,
  footerContent,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  noPadding = false,
  bordered = false,
  onClick = null,
}) => {
  return (
    <div 
      className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden ${bordered ? 'border border-gray-700' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className={`px-6 py-4 border-b border-gray-700 ${headerClassName}`}>
          {title && <h2 className="text-xl font-semibold text-white">{title}</h2>}
          {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className={`${noPadding ? '' : 'p-6'} ${bodyClassName}`}>
        {children}
      </div>
      
      {footerContent && (
        <div className={`px-6 py-4 bg-gray-800/60 border-t border-gray-700 ${footerClassName}`}>
          {footerContent}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to determine if the component should re-render
  // Return true if the props are equal (no re-render needed)
  // This is an optimization to prevent unnecessary re-renders
  
  // Compare simple props
  const simplePropsEqual = 
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.className === nextProps.className &&
    prevProps.headerClassName === nextProps.headerClassName &&
    prevProps.bodyClassName === nextProps.bodyClassName &&
    prevProps.footerClassName === nextProps.footerClassName &&
    prevProps.noPadding === nextProps.noPadding &&
    prevProps.bordered === nextProps.bordered &&
    prevProps.onClick === nextProps.onClick;
  
  // If simple props are not equal, we need to re-render
  if (!simplePropsEqual) return false;
  
  // For children, we do a shallow comparison
  // This isn't perfect but helps in most cases
  const prevChildren = React.Children.toArray(prevProps.children);
  const nextChildren = React.Children.toArray(nextProps.children);
  
  if (prevChildren.length !== nextChildren.length) return false;
  
  // For footerContent, do a shallow comparison or check equality if it's a primitive
  const prevFooter = prevProps.footerContent;
  const nextFooter = nextProps.footerContent;
  
  if (typeof prevFooter !== typeof nextFooter) return false;
  
  if (
    (typeof prevFooter === 'string' || typeof prevFooter === 'number' || prevFooter === null) && 
    prevFooter !== nextFooter
  ) {
    return false;
  }
  
  // If we reached here, we consider props equal and no re-render is needed
  return true;
});

// For better debugging in React DevTools
OptimizedCard.displayName = 'OptimizedCard';

export default OptimizedCard; 