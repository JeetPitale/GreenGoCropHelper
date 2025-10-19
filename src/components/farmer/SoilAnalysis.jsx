import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const SoilAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    ph_level: '',
    nitrogen_level: '',
    phosphorus_level: '',
    potassium_level: '',
    organic_matter: '',
    soil_type: '',
    test_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) fetchAnalyses();
  }, [user]);

  const fetchAnalyses = async () => {
    const { data, error } = await supabase
      .from('soil_analysis')
      .select('*')
      .eq('farmer_id', user.id)
      .order('test_date', { ascending: false });

    if (!error && data) setAnalyses(data);
  };

  const generateRecommendations = (data) => {
    const recommendations = [];
    
    if (data.ph_level < 6.0) recommendations.push('Soil is acidic. Consider adding lime to increase pH.');
    else if (data.ph_level > 7.5) recommendations.push('Soil is alkaline. Consider adding sulfur to decrease pH.');
    else recommendations.push('pH level is optimal for most crops.');

    if (data.nitrogen_level === 'low') recommendations.push('Nitrogen is low. Add nitrogen-rich fertilizers or compost.');
    if (data.phosphorus_level === 'low') recommendations.push('Phosphorus is low. Consider adding bone meal or rock phosphate.');
    if (data.potassium_level === 'low') recommendations.push('Potassium is low. Add potash or wood ash.');

    return recommendations.join(' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const analysisData = {
      farmer_id: user.id,
      ph_level: formData.ph_level ? parseFloat(formData.ph_level) : null,
      nitrogen_level: formData.nitrogen_level || null,
      phosphorus_level: formData.phosphorus_level || null,
      potassium_level: formData.potassium_level || null,
      organic_matter: formData.organic_matter ? parseFloat(formData.organic_matter) : null,
      soil_type: formData.soil_type || null,
      test_date: formData.test_date,
      recommendations: generateRecommendations(formData),
    };

    const { error } = await supabase.from('soil_analysis').insert([analysisData]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add soil analysis' });
    } else {
      toast({ title: 'Success', description: 'Soil analysis added with recommendations' });
      setShowForm(false);
      setFormData({
        ph_level: '',
        nitrogen_level: '',
        phosphorus_level: '',
        potassium_level: '',
        organic_matter: '',
        soil_type: '',
        test_date: new Date().toISOString().split('T')[0],
      });
      fetchAnalyses();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Soil Health Analysis</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'New Analysis'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Soil Analysis</CardTitle>
            <CardDescription>Enter your soil test results to get recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ph_level">pH Level</Label>
                  <Input
                    id="ph_level"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={formData.ph_level}
                    onChange={(e) => setFormData({ ...formData, ph_level: e.target.value })}
                    placeholder="6.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soil_type">Soil Type</Label>
                  <Input
                    id="soil_type"
                    value={formData.soil_type}
                    onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                    placeholder="e.g., Clay, Loam, Sandy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nitrogen_level">Nitrogen Level</Label>
                  <Select value={formData.nitrogen_level} onValueChange={(value) => setFormData({ ...formData, nitrogen_level: value })}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phosphorus_level">Phosphorus Level</Label>
                  <Select value={formData.phosphorus_level} onValueChange={(value) => setFormData({ ...formData, phosphorus_level: value })}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="potassium_level">Potassium Level</Label>
                  <Select value={formData.potassium_level} onValueChange={(value) => setFormData({ ...formData, potassium_level: value })}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organic_matter">Organic Matter (%)</Label>
                  <Input
                    id="organic_matter"
                    type="number"
                    step="0.01"
                    value={formData.organic_matter}
                    onChange={(e) => setFormData({ ...formData, organic_matter: e.target.value })}
                    placeholder="3.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test_date">Test Date</Label>
                  <Input
                    id="test_date"
                    type="date"
                    value={formData.test_date}
                    onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit">Add Analysis</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {analyses.map((analysis) => (
          <Card key={analysis.id}>
            <CardHeader>
              <CardTitle>Soil Test - {new Date(analysis.test_date).toLocaleDateString()}</CardTitle>
              <CardDescription>{analysis.soil_type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analysis.ph_level && (
                  <div>
                    <p className="text-sm text-muted-foreground">pH Level</p>
                    <p className="font-semibold">{analysis.ph_level}</p>
                  </div>
                )}
                {analysis.nitrogen_level && (
                  <div>
                    <p className="text-sm text-muted-foreground">Nitrogen</p>
                    <p className="font-semibold capitalize">{analysis.nitrogen_level}</p>
                  </div>
                )}
                {analysis.phosphorus_level && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phosphorus</p>
                    <p className="font-semibold capitalize">{analysis.phosphorus_level}</p>
                  </div>
                )}
                {analysis.potassium_level && (
                  <div>
                    <p className="text-sm text-muted-foreground">Potassium</p>
                    <p className="font-semibold capitalize">{analysis.potassium_level}</p>
                  </div>
                )}
              </div>
              {analysis.recommendations && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Recommendations:</p>
                  <p className="text-sm">{analysis.recommendations}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {analyses.length === 0 && !showForm && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No soil analyses yet. Add one to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SoilAnalysis;
