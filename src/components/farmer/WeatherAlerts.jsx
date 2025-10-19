import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CloudRain, AlertTriangle, Thermometer, Wind, Droplet } from 'lucide-react';

const WeatherAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [userLocation, setUserLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState('');

  // OpenWeatherMap API key
  const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  useEffect(() => {
    if (user) fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (userLocation) {
      fetchAlerts();
      fetchWeather();
    }
  }, [userLocation]);

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('location')
      .eq('id', user.id)
      .single();

    if (data?.location) setUserLocation(data.location);
  };

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('weather_alerts')
      .select('*')
      .ilike('location', `%${userLocation}%`)
      .order('start_date', { ascending: false });

    if (!error && data) setAlerts(data);
  };

  const fetchWeather = async () => {
    if (!WEATHER_API_KEY || !userLocation) return;
    setLoadingWeather(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          userLocation
        )}&appid=${WEATHER_API_KEY}&units=metric`
      );

      const data = await response.json();

      if (data.cod === 200) {
        setWeather(data);
      } else {
        setError('Unable to fetch weather for this location.');
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Error fetching weather data.');
    } finally {
      setLoadingWeather(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CloudRain className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Weather & Alerts</h2>
      </div>

      {userLocation && (
        <p className="text-sm text-muted-foreground">
          Showing data for: <span className="font-medium">{userLocation}</span>
        </p>
      )}

      {/* ===== Current Weather Section ===== */}
      <Card className="border-blue-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-blue-500" />
            Current Weather
          </CardTitle>
          <CardDescription>Real-time weather from OpenWeather API</CardDescription>
        </CardHeader>

        <CardContent>
          {loadingWeather ? (
            <p className="text-muted-foreground">Loading weather...</p>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : weather ? (
            <div className="flex items-center justify-between">
              {/* Left: Weather Icon + Main Info */}
              <div className="flex items-center gap-4">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                  alt="Weather Icon"
                  className="w-14 h-14"
                />
                <div>
                  <p className="text-xl font-semibold">
                    {Math.round(weather.main.temp)}°C
                  </p>
                  <p className="capitalize text-muted-foreground">
                    {weather.weather[0].description}
                  </p>
                </div>
              </div>

              {/* Right: Details */}
              <div className="space-y-1 text-sm text-muted-foreground text-right">
                <div className="flex items-center justify-end gap-2">
                  <Droplet className="h-4 w-4" /> Humidity: {weather.main.humidity}%
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Wind className="h-4 w-4" /> Wind: {weather.wind.speed} m/s
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Thermometer className="h-4 w-4" /> Feels like: {Math.round(weather.main.feels_like)}°C
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {userLocation
                ? 'Weather data will appear here.'
                : 'Please set your location in your profile.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ===== Alerts Section ===== */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">{alert.alert_type}</CardTitle>
                </div>
                <Badge variant={getSeverityColor(alert.severity)}>
                  {alert.severity}
                </Badge>
              </div>
              <CardDescription>{alert.location}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{alert.description}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>
                  Start: {new Date(alert.start_date).toLocaleDateString()}
                </span>
                {alert.end_date && (
                  <span>End: {new Date(alert.end_date).toLocaleDateString()}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== No Alerts ===== */}
      {alerts.length === 0 && (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">
              {userLocation
                ? 'No weather alerts for your area at this time.'
                : 'Please update your location in your profile to see relevant weather alerts.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeatherAlerts;
