
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IceCream } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-orange-400 rounded-3xl flex items-center justify-center">
            <IceCream className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Page Not Found</h2>
        <p className="text-gray-600 max-w-md">
          Sorry, we couldn't find the page you're looking for. The page might have been moved or doesn't exist.
        </p>
        <Button 
          onClick={() => window.location.href = "/"}
          className="bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
