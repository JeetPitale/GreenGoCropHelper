import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus } from 'lucide-react';

const SellCrop = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [crops, setCrops] = useState([]);
  const [wholesalers, setWholesalers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    crop_id: '',
    wholesaler_id: '',
    quantity_kg: '',
    price_per_kg: '',
    notes: '',
  });

  // Fetch data on load
  useEffect(() => {
    if (user) {
      fetchCrops();
      fetchWholesalers();
      fetchTransactions();

      // Listen for transaction changes
      const channel = supabase
        .channel('farmer_transactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `farmer_id=eq.${user.id}`,
          },
          () => fetchTransactions()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Fetch farmer's crops
  const fetchCrops = async () => {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('farmer_id', user.id);
    if (error) console.error(error);
    else setCrops(data);
  };

  // Fetch wholesalers for dropdown
  const fetchWholesalers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, profiles(full_name, email)')
        .eq('role', 'wholesaler');

      if (error) {
        console.error('Error fetching wholesalers:', error);
        return;
      }

      if (data) {
        const list = data.map((w) => ({
          id: w.user_id,
          full_name: w.profiles?.full_name || w.profiles?.email || 'Unnamed Wholesaler',
        }));
        setWholesalers(list);
      }
    } catch (err) {
      console.error('Error in fetchWholesalers:', err);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        wholesaler_profile:profiles!transactions_wholesaler_id_fkey(full_name),
        crops(crop_name)
      `)
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setTransactions(data);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.wholesaler_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Select a wholesaler' });
      return;
    }

    const crop = crops.find((c) => c.id === formData.crop_id);
    if (!crop) return;

    const quantity = parseFloat(formData.quantity_kg);
    const price = parseFloat(formData.price_per_kg);

    const { error } = await supabase.from('transactions').insert([{
      crop_id: formData.crop_id,
      farmer_id: user.id,
      wholesaler_id: formData.wholesaler_id,
      crop_name: crop.crop_name,
      quantity_kg: quantity,
      price_per_kg: price,
      total_amount: quantity * price,
      notes: formData.notes,
      status: 'completed',
    }]);

    if (error) toast({ variant: 'destructive', title: 'Error', description: 'Failed to create transaction' });
    else {
      toast({ title: 'Success', description: 'Sale recorded!' });
      setFormData({ crop_id: '', wholesaler_id: '', quantity_kg: '', price_per_kg: '', notes: '' });
      setShowForm(false);
      fetchTransactions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sell Crops</h2>
          <p className="text-muted-foreground">Manage your crop sales</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'New Sale'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Sale</CardTitle>
            <CardDescription>Record a new crop sale</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Crop select */}
              <div>
                <Label htmlFor="crop">Crop</Label>
                <Select
                  value={formData.crop_id}
                  onValueChange={(value) => setFormData({ ...formData, crop_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {crops.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.crop_name} ({c.expected_yield_kg} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Wholesaler select */}
              <div>
                <Label htmlFor="wholesaler">Wholesaler</Label>
                <Select
                  value={formData.wholesaler_id}
                  onValueChange={(value) => setFormData({ ...formData, wholesaler_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wholesaler" />
                  </SelectTrigger>
                  <SelectContent>
                    {wholesalers.length === 0 ? (
                      <SelectItem value="none" disabled>No wholesalers available</SelectItem>
                    ) : (
                      wholesalers.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.full_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity (kg)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity_kg}
                    onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price per kg (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              {/* Total Amount */}
              {formData.quantity_kg && formData.price_per_kg && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Total: ₹{(parseFloat(formData.quantity_kg) * parseFloat(formData.price_per_kg)).toFixed(2)}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full">Record Sale</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Sales History</h3>
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No sales recorded yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {transactions.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        {t.crops?.crop_name} sold
                      </CardTitle>
                      <CardDescription>
                        To: {t.wholesaler_profile?.full_name || 'Unknown'} | Qty: {t.quantity_kg} kg | ₹{t.total_amount.toFixed(2)}
                      </CardDescription>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellCrop;
