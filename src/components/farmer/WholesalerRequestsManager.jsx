// File: src/components/wholesaler/WholesalerRequestsManager.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';

const WholesalerRequestsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null); // <-- store channel

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('wholesaler_requests')
      .select(`
        *,
        farmer:profiles(full_name, phone)
      `)
      .eq('wholesaler_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }, [user, toast]);

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchRequests();

    const channel = supabase
      .channel('wholesaler_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wholesaler_requests',
          filter: `wholesaler_id=eq.${user.id}`,
        },
        () => fetchRequests()
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchRequests]);

  const handleUpdateStatus = async (requestId, status) => {
    const { error } = await supabase
      .from('wholesaler_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update request status',
      });
    } else {
      toast({
        title: 'Success',
        description: `Request ${status} successfully`,
      });
      fetchRequests();
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Purchase Requests</h2>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Loading requests...</p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No purchase requests yet. Wholesalers can send you requests for your crops.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{request.crop_name}</CardTitle>
                  <Badge variant={getStatusVariant(request.status)}>
                    {request.status}
                  </Badge>
                </div>
                <CardDescription>
                  From: {request.farmer?.full_name || 'Unknown'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p>Quantity: {request.quantity_kg} kg</p>
                  <p>Offered Price: ₹{request.offered_price_per_kg}/kg</p>
                  <p className="font-semibold">
                    Total Value: ₹{(request.quantity_kg * request.offered_price_per_kg).toFixed(2)}
                  </p>
                  {request.delivery_date && <p>Delivery: {new Date(request.delivery_date).toLocaleDateString()}</p>}
                  {request.notes && <p className="text-muted-foreground">Notes: {request.notes}</p>}
                  {request.farmer?.phone && <p className="text-muted-foreground">Contact: {request.farmer.phone}</p>}
                  <p className="text-xs text-muted-foreground">
                    Requested: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateStatus(request.id, 'accepted')} className="flex-1">Accept</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(request.id, 'rejected')} className="flex-1">Reject</Button>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <Button size="sm" onClick={() => handleUpdateStatus(request.id, 'completed')} className="w-full">
                    Mark as Completed
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WholesalerRequestsManager;
