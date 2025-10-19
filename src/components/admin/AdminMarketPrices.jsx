import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const AdminMarketPrices = () => {
  const { toast } = useToast();
  const [prices, setPrices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    crop_name: '',
    price_per_kg: '',
    market_location: '',
    trend: 'stable',
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    const { data } = await supabase
      .from('market_prices')
      .select('*')
      .order('price_date', { ascending: false });
    if (data) setPrices(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('market_prices').insert([{
      crop_name: formData.crop_name,
      price_per_kg: parseFloat(formData.price_per_kg),
      market_location: formData.market_location,
      trend: formData.trend,
    }]);
    
    if (!error) {
      toast({ title: 'Success', description: 'Price added' });
      setShowForm(false);
      setFormData({ crop_name: '', price_per_kg: '', market_location: '', trend: 'stable' });
      fetchPrices();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Market Prices</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'Add Price'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Crop</Label>
                  <Input
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Price/kg</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.market_location}
                    onChange={(e) => setFormData({ ...formData, market_location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Trend</Label>
                  <Select value={formData.trend} onValueChange={(v) => setFormData({ ...formData, trend: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rising">Rising</SelectItem>
                      <SelectItem value="stable">Stable</SelectItem>
                      <SelectItem value="falling">Falling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prices.slice(0, 9).map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="text-base">{p.crop_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>₹{p.price_per_kg}/kg</p>
              <p className="text-sm">{p.market_location}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminMarketPrices;
