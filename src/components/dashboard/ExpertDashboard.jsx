import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sprout, LogOut } from 'lucide-react';
import ExpertQueryList from '@/components/expert/ExpertQueryList';

const ExpertDashboard = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-900 border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">GreenGo Crop Helper</h1>
              <p className="text-sm text-muted-foreground">Expert Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExpertQueryList />
      </main>
    </div>
  );
};

export default ExpertDashboard;
