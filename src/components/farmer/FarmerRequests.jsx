// File: src/components/farmer/FarmerRequests.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const FarmerRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchRequests();

    const channel = supabase
      .channel('farmer_requests_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wholesaler_requests', filter: `farmer_id=eq.${user.id}` },
        () => fetchRequests()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('wholesaler_requests')
      .select(`
        *,
        wholesaler:profiles!wholesaler_id(full_name, location),
        crop:crops(crop_name)
      `)
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch requests' });
    } else {
      setRequests(data || []);
    }
  };

  const handleRequest = async (requestId, action, requestData) => {
    try {
      // 1️⃣ Update request status
      const { error: updateError } = await supabase
        .from('wholesaler_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 2️⃣ If accepted → create transaction
      if (action === 'accepted') {
        const transactionData = {
          wholesaler_id: requestData.wholesaler_id,
          farmer_id: requestData.farmer_id,
          crop_id: requestData.crop_id,
          quantity_kg: requestData.quantity_kg,
          price_per_kg: requestData.offered_price_per_kg,
          total_amount: requestData.quantity_kg * requestData.offered_price_per_kg,
          notes: requestData.notes || null,
        };

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert([transactionData]);

        if (transactionError) throw transactionError;
      }

      toast({ title: `Request ${action}`, description: `Request has been ${action}` });
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Incoming Purchase Requests</h2>
      {requests.length === 0 ? (
        <p className="text-muted-foreground">No requests yet.</p>
      ) : (
        requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{request.crop?.crop_name || request.crop_name}</CardTitle>
                <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
              </div>
              <CardDescription>
                Requested by: {request.wholesaler?.full_name} • {request.wholesaler?.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Quantity: {request.quantity_kg} kg</p>
              <p>Offered Price: ₹{request.offered_price_per_kg}/kg</p>
              {request.delivery_date && <p>Delivery: {new Date(request.delivery_date).toLocaleDateString()}</p>}
              {request.notes && <p>Notes: {request.notes}</p>}

              {/* Accept / Reject Buttons */}
              {request.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <Button onClick={() => handleRequest(request.id, 'accepted', request)}>Accept</Button>
                  <Button variant="destructive" onClick={() => handleRequest(request.id, 'rejected', request)}>Reject</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default FarmerRequests;
