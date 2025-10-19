import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CropManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [crops, setCrops] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [formData, setFormData] = useState({
    crop_name: '',
    sowing_date: '',
    expected_harvest_date: '',
    soil_type: '',
    area_acres: '',
    expected_yield_kg: '',
    status: 'growing',
  });

  useEffect(() => {
    if (user) fetchCrops();
  }, [user]);

  const fetchCrops = async () => {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch crops' });
    } else {
      setCrops(data || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cropData = {
      farmer_id: user.id,
      crop_name: formData.crop_name,
      sowing_date: formData.sowing_date,
      expected_harvest_date: formData.expected_harvest_date || null,
      soil_type: formData.soil_type || null,
      area_acres: formData.area_acres ? parseFloat(formData.area_acres) : null,
      expected_yield_kg: formData.expected_yield_kg ? parseFloat(formData.expected_yield_kg) : null,
      status: formData.status,
    };

    if (editingCrop) {
      const { error } = await supabase.from('crops').update(cropData).eq('id', editingCrop.id);
      if (error) toast({ variant: 'destructive', title: 'Error', description: 'Failed to update crop' });
      else {
        toast({ title: 'Success', description: 'Crop updated successfully' });
        resetForm();
        fetchCrops();
      }
    } else {
      const { error } = await supabase.from('crops').insert([cropData]);
      if (error) toast({ variant: 'destructive', title: 'Error', description: 'Failed to add crop' });
      else {
        toast({ title: 'Success', description: 'Crop added successfully' });
        resetForm();
        fetchCrops();
      }
    }
  };

  const handleEdit = (crop) => {
    setEditingCrop(crop);
    setFormData({
      crop_name: crop.crop_name,
      sowing_date: crop.sowing_date,
      expected_harvest_date: crop.expected_harvest_date || '',
      soil_type: crop.soil_type || '',
      area_acres: crop.area_acres?.toString() || '',
      expected_yield_kg: crop.expected_yield_kg?.toString() || '',
      status: crop.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('crops').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete crop' });
    else {
      toast({ title: 'Success', description: 'Crop deleted successfully' });
      fetchCrops();
    }
  };

  const resetForm = () => {
    setFormData({ crop_name: '', sowing_date: '', expected_harvest_date: '', soil_type: '', area_acres: '', expected_yield_kg: '', status: 'growing' });
    setEditingCrop(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Crops</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'Add Crop'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCrop ? 'Edit Crop' : 'Add New Crop'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crop_name">Crop Name</Label>
                  <Input id="crop_name" value={formData.crop_name} onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sowing_date">Sowing Date</Label>
                  <Input id="sowing_date" type="date" value={formData.sowing_date} onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_harvest_date">Expected Harvest Date</Label>
                  <Input id="expected_harvest_date" type="date" value={formData.expected_harvest_date} onChange={(e) => setFormData({ ...formData, expected_harvest_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soil_type">Soil Type</Label>
                  <Input id="soil_type" value={formData.soil_type} onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area_acres">Area (acres)</Label>
                  <Input id="area_acres" type="number" step="0.01" value={formData.area_acres} onChange={(e) => setFormData({ ...formData, area_acres: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_yield_kg">Expected Yield (kg)</Label>
                  <Input id="expected_yield_kg" type="number" step="0.01" value={formData.expected_yield_kg} onChange={(e) => setFormData({ ...formData, expected_yield_kg: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="growing">Growing</SelectItem>
                      <SelectItem value="harvested">Harvested</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingCrop ? 'Update' : 'Add'} Crop</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crops.map((crop) => (
          <Card key={crop.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{crop.crop_name}</CardTitle>
                <Badge variant={crop.status === 'growing' ? 'default' : crop.status === 'harvested' ? 'secondary' : 'outline'}>
                  {crop.status}
                </Badge>
              </div>
              <CardDescription>Sown: {new Date(crop.sowing_date).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {crop.area_acres && <p className="text-sm">Area: {crop.area_acres} acres</p>}
              {crop.expected_yield_kg && <p className="text-sm">Expected Yield: {crop.expected_yield_kg} kg</p>}
              {crop.soil_type && <p className="text-sm">Soil: {crop.soil_type}</p>}
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(crop)}>
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(crop.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {crops.length === 0 && !showForm && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No crops added yet. Click "Add Crop" to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CropManagement;
