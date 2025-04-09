const SectionHeader = ({
  title,
  subtitle,
  className = '',
  align = 'center'
}) => {
  const alignmentClasses = {
    'left': 'text-left',
    'center': 'text-center mx-auto',
    'right': 'text-right ml-auto'
  };

  return (
    <div className={`mb-8 ${alignmentClasses[align]} ${className}`}>
      <h2 className="text-2xl font-bold mb-3 text-white">{title}</h2>
      {subtitle && <p className="text-gray-400 max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
};

export default SectionHeader; 