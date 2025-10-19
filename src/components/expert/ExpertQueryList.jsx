import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

const ExpertQueryList = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [response, setResponse] = useState('');

  // Fetch queries
  const fetchQueries = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expert_queries')
        .select('id, farmer_id, expert_id, query_text, response_text, status, category, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data) return;

      // Fetch profiles for each query
      const queriesWithProfiles = await Promise.all(
        data.map(async (q) => {
          if (!q.farmer_id) return q;

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', q.farmer_id)
            .single();

          if (profileError) return { ...q, profiles: { full_name: 'Farmer' } };
          return { ...q, profiles: profileData || { full_name: 'Farmer' } };
        })
      );

      setQueries(queriesWithProfiles);
    } catch (err) {
      console.error('Error fetching queries:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch queries',
      });
    }
  }, [user, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchQueries();

    const channel = supabase
      .channel('expert_queries_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expert_queries' },
        () => fetchQueries()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchQueries]);

  // Handle response
  const handleRespond = async () => {
    if (!selectedQuery || !response.trim()) return;

    const { error } = await supabase
      .from('expert_queries')
      .update({
        expert_id: user.id,
        response_text: response,
        status: 'answered',
      })
      .eq('id', selectedQuery.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit response' });
    } else {
      toast({ title: 'Success', description: 'Response submitted successfully' });
      setResponse('');
      setSelectedQuery(null);
      fetchQueries();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Farmer Questions</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Questions List</h3>
          {queries.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No questions available yet.</p>
              </CardContent>
            </Card>
          )}

          {queries.map((query) => (
            <Card
              key={query.id}
              className={`cursor-pointer transition-colors ${selectedQuery?.id === query.id ? 'border-primary' : ''}`}
              onClick={() => {
                setSelectedQuery(query);
                setResponse(query.response_text || '');
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{query.profiles?.full_name || 'Farmer'}</CardTitle>
                    {query.category && <Badge variant="outline" className="mt-1">{query.category}</Badge>}
                  </div>
                  <Badge variant={query.status === 'answered' ? 'default' : 'secondary'}>{query.status}</Badge>
                </div>
                <CardDescription>{new Date(query.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{query.query_text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Response Panel */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Respond to Question</h3>
          {selectedQuery ? (
            <Card>
              <CardHeader>
                <CardTitle>Question from {selectedQuery.profiles?.full_name || 'Farmer'}</CardTitle>
                <CardDescription>Asked on {new Date(selectedQuery.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Question:</p>
                  <p className="text-sm">{selectedQuery.query_text}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response">Your Response</Label>
                  <Textarea
                    id="response"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={8}
                    placeholder="Provide detailed advice and recommendations..."
                  />
                </div>

                <Button onClick={handleRespond} disabled={!response.trim()}>
                  Submit Response
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Select a question to respond</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertQueryList;
