// File: src/components/dashboard/WholesalerDashboard.jsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, LogOut, ShoppingCart, Receipt } from 'lucide-react';
import WholesalerRequestsManager from '@/components/farmer/WholesalerRequestsManager';
import WholesalerPurchasesManager from '@/components/wholesaler/WholesalerPurchasesManager';

const WholesalerDashboard = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-900 border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">GreenGo Crop Helper</h1>
              <p className="text-sm text-muted-foreground">Wholesaler Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="purchase" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Purchases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <WholesalerRequestsManager />
          </TabsContent>
  



          <TabsContent value="purchase">
            <WholesalerPurchasesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WholesalerDashboard;
