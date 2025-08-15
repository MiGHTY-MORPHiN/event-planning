import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  Clock,
  Palette,
  Upload,
  Save,
  Eye
} from 'lucide-react';

const EventEditor = () => {
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    maxAttendees: '',
    theme: '',
    category: ''
  });

  const themes = [
    { name: 'Modern Minimalist', color: 'bg-gray-100', accent: 'bg-gray-800' },
    { name: 'Elegant Purple', color: 'bg-purple-100', accent: 'bg-purple-600' },
    { name: 'Ocean Blue', color: 'bg-blue-100', accent: 'bg-blue-600' },
    { name: 'Sunset Orange', color: 'bg-orange-100', accent: 'bg-orange-600' },
    { name: 'Forest Green', color: 'bg-green-100', accent: 'bg-green-600' },
    { name: 'Rose Gold', color: 'bg-pink-100', accent: 'bg-pink-600' }
  ];

  const handleInputChange = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <PageLayout 
      title="Create New Event" 
      subtitle="Set up your event details, theme, and venue information."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Event Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span>Event Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="eventName">Event Name</Label>
                <Input 
                  id="eventName"
                  placeholder="Enter event name"
                  value={eventData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Describe your event..."
                  rows={4}
                  value={eventData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date"
                    type="date"
                    value={eventData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time"
                    type="time"
                    value={eventData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="corporate">Corporate Event</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="exhibition">Exhibition</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Venue & Capacity */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Venue & Capacity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input 
                  id="venue"
                  placeholder="Enter venue name or address"
                  value={eventData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                <Input 
                  id="maxAttendees"
                  type="number"
                  placeholder="Enter maximum capacity"
                  value={eventData.maxAttendees}
                  onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Venue Map</span>
                </div>
                <div className="h-32 bg-gradient-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Floor Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Selection */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-primary" />
                <span>Event Theme</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {themes.map((theme, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-medium ${
                      eventData.theme === theme.name ? 'border-primary' : 'border-border'
                    }`}
                    onClick={() => handleInputChange('theme', theme.name)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-4 h-4 rounded-full ${theme.color}`}></div>
                      <div className={`w-4 h-4 rounded-full ${theme.accent}`}></div>
                    </div>
                    <p className="text-sm font-medium">{theme.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Preview */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-primary" />
                <span>Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Event Name</p>
                  <p className="font-medium">{eventData.name || 'Untitled Event'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {eventData.date || 'No date set'} {eventData.time && `at ${eventData.time}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-medium">{eventData.venue || 'No venue selected'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{eventData.maxAttendees || 'No limit set'} attendees</p>
                </div>
                {eventData.theme && (
                  <div>
                    <p className="text-sm text-muted-foreground">Theme</p>
                    <Badge variant="secondary">{eventData.theme}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Event Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion</span>
                <span className="text-sm font-medium">65%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">RSVPs</span>
                  </div>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Days Left</span>
                  </div>
                  <span className="text-sm font-medium">--</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full bg-gradient-primary hover:opacity-90">
              <Save className="h-4 w-4 mr-2" />
              Save Event
            </Button>
            <Button variant="outline" className="w-full">
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default EventEditor;