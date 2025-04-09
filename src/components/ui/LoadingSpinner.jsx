import { useLoading } from '../../context/LoadingContext';

const LoadingSpinner = () => {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 max-w-sm mx-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        <p className="text-white text-center">{loadingMessage}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 