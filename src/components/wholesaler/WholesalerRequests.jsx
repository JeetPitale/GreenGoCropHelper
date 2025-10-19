// File: src/components/wholesaler/WholesalerRequests.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const WholesalerRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [availableCrops, setAvailableCrops] = useState([]);
  const [formData, setFormData] = useState({
    crop_name: '',
    quantity_kg: '',
    offered_price_per_kg: '',
    delivery_date: '',
    notes: '',
    crop_id: '',
    farmer_id: '',
  });

  // Fetch requests and available crops when the user is logged in
  useEffect(() => {
    if (!user) return;
    fetchRequests();
    fetchAvailableCrops();

    const channel = supabase
      .channel('wholesaler_requests_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wholesaler_requests', filter: `wholesaler_id=eq.${user.id}` },
        () => fetchRequests()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // Fetch purchase requests for this wholesaler
  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('wholesaler_requests')
      .select('*')
      .eq('wholesaler_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch requests' });
    setRequests(data || []);
  };

  // Fetch available crops for request creation
  const fetchAvailableCrops = async () => {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .in('status', ['growing', 'harvested'])
      .order('created_at', { ascending: false });

    if (error) return toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch crops' });
    setAvailableCrops(data || []);
  };

  // Select a crop to request for purchase
  const handleSelectCrop = (crop) => {
    setFormData({
      crop_name: crop.crop_name,
      crop_id: crop.id,
      farmer_id: crop.farmer_id,
      quantity_kg: crop.expected_yield_kg?.toString() || '',
      offered_price_per_kg: '',
      delivery_date: '',
      notes: '',
    });
    setShowForm(true);
  };

  // Handle the form submission to create a purchase request
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    const quantity = parseFloat(formData.quantity_kg);
    const price = parseFloat(formData.offered_price_per_kg);
    if (isNaN(quantity) || isNaN(price)) {
      return toast({ variant: 'destructive', title: 'Error', description: 'Invalid quantity or price' });
    }

    const requestData = { ...formData, wholesaler_id: user.id, status: 'pending' };
    requestData.quantity_kg = quantity;
    requestData.offered_price_per_kg = price;

    const { error } = await supabase.from('wholesaler_requests').insert([requestData]);
    if (error) return toast({ variant: 'destructive', title: 'Error', description: error.message });

    toast({ title: 'Success', description: 'Request created successfully' });
    setShowForm(false);
    setFormData({ crop_name: '', quantity_kg: '', offered_price_per_kg: '', delivery_date: '', notes: '', crop_id: '', farmer_id: '' });
    fetchRequests();
  };

  // Reset form when the form is closed
  useEffect(() => {
    if (!showForm) {
      setFormData({
        crop_name: '',
        quantity_kg: '',
        offered_price_per_kg: '',
        delivery_date: '',
        notes: '',
        crop_id: '',
        farmer_id: '',
      });
    }
  }, [showForm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Purchase Requests</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Request'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Purchase Request</CardTitle>
            <CardDescription>Request crops from farmers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Crop Name</Label>
                <Input value={formData.crop_name} onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Quantity (kg)</Label>
                <Input type="number" value={formData.quantity_kg} onChange={(e) => setFormData({ ...formData, quantity_kg: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Offered Price (per kg)</Label>
                <Input type="number" value={formData.offered_price_per_kg} onChange={(e) => setFormData({ ...formData, offered_price_per_kg: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Preferred Delivery Date</Label>
                <Input type="date" value={formData.delivery_date} onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <Button type="submit">Create Request</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">My Requests</h3>
        {requests.length === 0 ? <p>No requests yet.</p> : (
          <div className="space-y-4">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardHeader>
                  <CardTitle>{req.crop_name}</CardTitle>
                  <CardDescription>Status: {req.status}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Quantity: {req.quantity_kg} kg</p>
                  <p>Offered Price: ₹{req.offered_price_per_kg}/kg</p>
                  {req.delivery_date && <p>Delivery: {new Date(req.delivery_date).toLocaleDateString()}</p>}
                  {req.notes && <p>Notes: {req.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Available Crops</h3>
        {availableCrops.length === 0 ? <p>No crops available.</p> : (
          <div className="space-y-4">
            {availableCrops.map((crop) => (
              <Card key={crop.id} className="cursor-pointer" onClick={() => handleSelectCrop(crop)}>
                <CardHeader>
                  <CardTitle>{crop.crop_name}</CardTitle>
                  <CardDescription>Farmer: {crop.farmer_id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Expected Yield: {crop.expected_yield_kg} kg</p>
                  <p>Harvest Date: {new Date(crop.expected_harvest_date).toLocaleDateString()}</p>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSelectCrop(crop); }}>Request Purchase</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WholesalerRequests;
