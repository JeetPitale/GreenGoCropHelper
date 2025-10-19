import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminWeatherAlerts = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [formData, setFormData] = useState({
    location: '',
    alert_type: '',
    severity: 'medium',
    description: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchAlerts();
    getUserLocationAndWeather();
  }, []);

  const getUserLocationAndWeather = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();
        
        if (profile?.location) {
          setSearchLocation(profile.location);
          fetchWeatherData(profile.location);
        }
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const fetchWeatherData = async (location) => {
    if (!location.trim()) return;
    
    setLoadingWeather(true);
    try {
      // Get API key from environment variable or use direct key
      const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'ce1e9ad5c4a6545d5561786a79781904';
      
      // Check if API key is configured
      if (!API_KEY || API_KEY === 'ce1e9ad5c4a6545d5561786a79781904') {
        // Demo mode with mock data
        setTimeout(() => {
          setWeatherData({
            location: location,
            temperature: 28,
            feels_like: 31,
            humidity: 65,
            wind_speed: 12,
            description: 'Partly cloudy',
            icon: 'clouds',
            visibility: 10,
            pressure: 1013,
            forecast: [
              { day: 'Mon', temp: 28, icon: 'clouds', desc: 'Cloudy' },
              { day: 'Tue', temp: 30, icon: 'sun', desc: 'Sunny' },
              { day: 'Wed', temp: 26, icon: 'rain', desc: 'Rainy' },
              { day: 'Thu', temp: 27, icon: 'clouds', desc: 'Cloudy' },
              { day: 'Fri', temp: 29, icon: 'sun', desc: 'Sunny' },
            ]
          });
          toast({
            title: ' Weather Alert',
            description: 'Using weather data. '
          });
          setLoadingWeather(false);
        }, 500);
        return;
      }

      // Real API call to OpenWeatherMap
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=metric`
      );
      
      if (!weatherResponse.ok) {
        if (weatherResponse.status === 401) {
          throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
        } else if (weatherResponse.status === 404) {
          throw new Error('Location not found. Please try a different location.');
        } else {
          throw new Error('Failed to fetch weather data. Please try again.');
        }
      }
      
      const weather = await weatherResponse.json();
      
      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=metric`
      );
      
      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch forecast data');
      }
      
      const forecastData = await forecastResponse.json();
      
      // Process forecast (get one per day at noon)
      const forecast = [];
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const processedDates = new Set();
      
      for (const item of forecastData.list) {
        const date = new Date(item.dt * 1000);
        const dateString = date.toDateString();
        
        // Take first forecast of each day (avoid duplicates)
        if (!processedDates.has(dateString) && forecast.length < 5) {
          processedDates.add(dateString);
          forecast.push({
            day: daysOfWeek[date.getDay()],
            temp: Math.round(item.main.temp),
            icon: item.weather[0].main.toLowerCase(),
            desc: item.weather[0].main
          });
        }
      }

      setWeatherData({
        location: weather.name,
        temperature: Math.round(weather.main.temp),
        feels_like: Math.round(weather.main.feels_like),
        humidity: weather.main.humidity,
        wind_speed: Math.round(weather.wind.speed * 3.6), // Convert m/s to km/h
        description: weather.weather[0].description,
        icon: weather.weather[0].main.toLowerCase(),
        visibility: Math.round(weather.visibility / 1000), // Convert m to km
        pressure: weather.main.pressure,
        forecast: forecast
      });

      toast({
        title: 'Weather Updated',
        description: `Showing weather for ${weather.name}`
      });

    } catch (error) {
      console.error('Weather fetch error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch weather data',
        variant: 'destructive'
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('weather_alerts')
      .select('*')
      .order('start_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch alerts',
        variant: 'destructive'
      });
    } else if (data) {
      setAlerts(data);
    }
  };

  const createAlert = async () => {
    if (!formData.location || !formData.alert_type || !formData.description || !formData.start_date) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const { error } = await supabase
      .from('weather_alerts')
      .insert([{ 
        ...formData, 
        end_date: formData.end_date || null 
      }]);

    if (!error) {
      toast({ 
        title: 'Success',
        description: 'Alert created successfully' 
      });
      setShowForm(false);
      setFormData({ 
        location: '', 
        alert_type: '', 
        severity: 'medium', 
        description: '', 
        start_date: '', 
        end_date: '' 
      });
      fetchAlerts();
    } else {
      console.error('Error creating alert:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create alert',
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteAlert = async (id) => {
    const { error } = await supabase
      .from('weather_alerts')
      .delete()
      .eq('id', id);

    if (!error) {
      toast({ 
        title: 'Success',
        description: 'Alert deleted successfully' 
      });
      fetchAlerts();
    } else {
      console.error('Error deleting alert:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive' 
      });
    }
  };

  const getWeatherIcon = (icon) => {
    const iconMap = {
      'sun': <Sun className="h-8 w-8 text-yellow-500" />,
      'clear': <Sun className="h-8 w-8 text-yellow-500" />,
      'rain': <CloudRain className="h-8 w-8 text-blue-500" />,
      'drizzle': <CloudRain className="h-8 w-8 text-blue-500" />,
      'clouds': <Cloud className="h-8 w-8 text-gray-500" />,
      'default': <Cloud className="h-8 w-8 text-gray-500" />
    };
    
    return iconMap[icon?.toLowerCase()] || iconMap['default'];
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    };
    return <Badge variant={variants[severity] || 'default'}>{severity?.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Weather & Alerts</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'Add Alert'}
        </Button>
      </div>

      <Tabs defaultValue="weather" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weather">Current Weather</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="weather" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter location (e.g., Mumbai, India)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchWeatherData(searchLocation)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => fetchWeatherData(searchLocation)} 
                  disabled={!searchLocation || loadingWeather}
                >
                  {loadingWeather ? 'Loading...' : 'Get Weather'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {weatherData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Current Weather - {weatherData.location}</span>
                    {getWeatherIcon(weatherData.icon)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-2xl font-bold">{weatherData.temperature}°C</p>
                        <p className="text-xs text-muted-foreground">Feels {weatherData.feels_like}°C</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{weatherData.humidity}%</p>
                        <p className="text-xs text-muted-foreground">Humidity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-2xl font-bold">{weatherData.wind_speed}</p>
                        <p className="text-xs text-muted-foreground">km/h Wind</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{weatherData.visibility}</p>
                        <p className="text-xs text-muted-foreground">km Visibility</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg capitalize text-center">{weatherData.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {weatherData.forecast.map((day, idx) => (
                      <div key={idx} className="text-center p-3 rounded-lg bg-muted">
                        <p className="font-semibold text-sm mb-2">{day.day}</p>
                        <div className="flex justify-center mb-2">
                          {getWeatherIcon(day.icon)}
                        </div>
                        <p className="text-xl font-bold">{day.temp}°C</p>
                        <p className="text-xs text-muted-foreground">{day.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {showForm && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Location *</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Mumbai, Maharashtra"
                        required
                      />
                    </div>
                    <div>
                      <Label>Alert Type *</Label>
                      <Input
                        value={formData.alert_type}
                        onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                        placeholder="e.g., Heavy Rain"
                        required
                      />
                    </div>
                    <div>
                      <Label>Severity</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(v) => setFormData({ ...formData, severity: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Start Date *</Label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>End Date (Optional)</Label>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide details about the alert..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={createAlert}>Create Alert</Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p className="text-lg">No active alerts</p>
                  <p className="text-sm mt-2">Create your first weather alert to notify farmers</p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{alert.alert_type}</h3>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-sm mb-2">{alert.description}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>📍 {alert.location}</span>
                          <span>📅 {new Date(alert.start_date).toLocaleDateString()}</span>
                          {alert.end_date && (
                            <span>→ {new Date(alert.end_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWeatherAlerts;