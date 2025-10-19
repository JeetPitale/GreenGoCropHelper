import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MarketPrices = () => {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .order('price_date', { ascending: false });

    if (!error && data) setPrices(data);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'falling':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Market Prices</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prices.map((price) => (
          <Card key={price.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{price.crop_name}</CardTitle>
                {getTrendIcon(price.trend)}
              </div>
              <CardDescription>{price.market_location}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">₹{price.price_per_kg}</p>
              <p className="text-sm text-muted-foreground">per kg</p>
              <p className="text-xs text-muted-foreground mt-2">
                Updated: {new Date(price.price_date).toLocaleDateString()}
              </p>
              {price.trend && (
                <Badge
                  variant={
                    price.trend === 'rising' ? 'default' :
                    price.trend === 'falling' ? 'destructive' : 'secondary'
                  }
                  className="mt-2"
                >
                  {price.trend}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {prices.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No market prices available yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketPrices;
