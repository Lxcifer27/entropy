import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] px-6 py-12 text-center">
      <div className="space-y-8 max-w-md">
        <h1 className="text-6xl lg:text-9xl font-bold text-cyan-500">404</h1>
        
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">Page Not Found</h2>
          <p className="text-gray-400 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary" size="lg">
              Go Home
            </Button>
          </Link>
          <Link to="/review">
            <Button variant="outline" size="lg">
              Try Code Review
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 