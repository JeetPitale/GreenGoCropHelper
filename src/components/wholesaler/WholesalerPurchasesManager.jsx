import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const WholesalerPurchasesManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availableCrops, setAvailableCrops] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    crop_id: '',
    quantity_kg: '',
    price_per_kg: '',
    notes: '',
  });

  const channelRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchAvailableCrops();
    fetchTransactions();

    const channel = supabase
      .channel('wholesaler_transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `wholesaler_id=eq.${user.id}` },
        () => fetchTransactions()
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  const fetchAvailableCrops = async () => {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .neq('farmer_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) return toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch crops' });
    setAvailableCrops(data || []);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wholesaler_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch transactions' });
    setTransactions(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const crop = availableCrops.find((c) => c.id === formData.crop_id);
    if (!crop) return;

    const transactionData = {
      crop_id: formData.crop_id,
      crop_name: crop.crop_name,
      farmer_id: crop.farmer_id,
      wholesaler_id: user.id,
      quantity_kg: parseFloat(formData.quantity_kg),
      price_per_kg: parseFloat(formData.price_per_kg),
      total_amount: parseFloat(formData.quantity_kg) * parseFloat(formData.price_per_kg),
      notes: formData.notes,
      status: 'completed',
    };

    const { error } = await supabase.from('transactions').insert([transactionData]);
    if (error) return toast({ variant: 'destructive', title: 'Error', description: 'Failed to create purchase transaction' });

    toast({ title: 'Success', description: 'Purchase recorded!' });
    setShowForm(false);
    setFormData({ crop_id: '', quantity_kg: '', price_per_kg: '', notes: '' });
    fetchTransactions();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wholesaler Purchases</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Purchase'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record Purchase</CardTitle>
            <CardDescription>Buy crops from available farmers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Select Crop</Label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={formData.crop_id}
                  onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                  required
                >
                  <option value="">Select crop</option>
                  {availableCrops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.crop_name} ({crop.expected_yield_kg} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity (kg)</Label>
                  <Input
                    type="number"
                    value={formData.quantity_kg}
                    onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Price per kg</Label>
                  <Input
                    type="number"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">Record Purchase</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-4">Purchase History</h3>
        {transactions.length === 0 ? (
          <p>No purchases recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <CardHeader>
                  <CardTitle>{tx.crop_name}</CardTitle>
                  <CardDescription>
                    Quantity: {tx.quantity_kg} kg • Total: ₹{tx.total_amount.toFixed(2)}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WholesalerPurchasesManager;
