import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-bold text-white">404</h1>
        <h2 className="text-3xl font-semibold text-white">Page Not Found</h2>
        <p className="text-green-100 text-lg">
          The page you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate('/dashboard')} size="lg">
          <Home className="w-5 h-5 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
