import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary-600 font-display">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          Page not found
        </h1>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8">
          <Link to="/dashboard">
            <Button>
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
