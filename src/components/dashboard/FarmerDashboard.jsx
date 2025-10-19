import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, LogOut, Leaf, TestTube, DollarSign, MessageSquare, CloudRain, ShoppingCart, Receipt } from 'lucide-react';
import CropManagement from '@/components/farmer/CropManagement';
import SoilAnalysis from '@/components/farmer/SoilAnalysis';
import MarketPrices from '@/components/farmer/MarketPrices';
import ExpertQueries from '@/components/farmer/ExpertQueries';
import WeatherAlerts from '@/components/farmer/WeatherAlerts';
import WholesalerRequestsManager from '@/components/farmer/WholesalerRequestsManager';
import SellCrop from '@/components/farmer/SellCrop';

const FarmerDashboard = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState('crops');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-900 border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">GreenGo Crop Helper</h1>
              <p className="text-sm text-muted-foreground">Farmer Dashboard</p>
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
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="crops" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              <span className="hidden sm:inline">Crops</span>
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Sell</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="soil" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Soil</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Market</span>
            </TabsTrigger>
            <TabsTrigger value="expert" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Expert</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <CloudRain className="h-4 w-4" />
              <span className="hidden sm:inline">Weather</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crops">
            <CropManagement />
          </TabsContent>

          <TabsContent value="sell">
            <SellCrop />
          </TabsContent>

          <TabsContent value="requests">
            <WholesalerRequestsManager />
          </TabsContent>

          <TabsContent value="soil">
            <SoilAnalysis />
          </TabsContent>

          <TabsContent value="market">
            <MarketPrices />
          </TabsContent>

          <TabsContent value="expert">
            <ExpertQueries />
          </TabsContent>

          <TabsContent value="weather">
            <WeatherAlerts />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FarmerDashboard;
