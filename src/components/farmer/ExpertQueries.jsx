import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ExpertQueries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [queries, setQueries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    query_text: '',
    category: '',
  });

  useEffect(() => {
    if (user) fetchQueries();
  }, [user]);

  const fetchQueries = async () => {
    const { data, error } = await supabase
      .from('expert_queries')
      .select('*')
      .eq('farmer_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) setQueries(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const queryData = {
      farmer_id: user?.id,
      query_text: formData.query_text,
      category: formData.category || null,
      status: 'pending',
    };

    const { error } = await supabase.from('expert_queries').insert([queryData]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit query' });
    } else {
      toast({ title: 'Success', description: 'Query submitted to experts' });
      setShowForm(false);
      setFormData({ query_text: '', category: '' });
      fetchQueries();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ask an Expert</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'New Question'}
        </Button>
      </div>

      {/* New Query Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
            <CardDescription>Get expert advice on your farming queries</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pest-control">Pest Control</SelectItem>
                    <SelectItem value="crop-disease">Crop Disease</SelectItem>
                    <SelectItem value="irrigation">Irrigation</SelectItem>
                    <SelectItem value="fertilization">Fertilization</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="query_text">Your Question</Label>
                <Textarea
                  id="query_text"
                  value={formData.query_text}
                  onChange={(e) => setFormData({ ...formData, query_text: e.target.value })}
                  required
                  rows={5}
                  placeholder="Describe your question in detail..."
                />
              </div>
              <Button type="submit">Submit Question</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Queries List */}
      <div className="space-y-4">
        {queries.map((query) => (
          <Card key={query.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {query.category && <Badge variant="outline">{query.category}</Badge>}
                    <Badge variant={query.status === 'answered' ? 'default' : query.status === 'pending' ? 'secondary' : 'outline'}>
                      {query.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Asked: {new Date(query.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1">Question:</p>
                <p className="text-sm">{query.query_text}</p>
              </div>
              {query.response_text && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-1">Expert Response:</p>
                  <p className="text-sm">{query.response_text}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Queries */}
      {queries.length === 0 && !showForm && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No questions yet. Ask an expert to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpertQueries;
