import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { 
  ClipboardList, 
  Plus, 
  Upload, 
  Download, 
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Save,
  Eye
} from 'lucide-react';

const AgendaManager = () => {
  const [selectedDay, setSelectedDay] = useState('day1');
  
  const agendaItems = {
    day1: [
      {
        id: 1,
        time: "09:00 AM",
        duration: 30,
        title: "Registration & Welcome Coffee",
        description: "Guest registration and networking",
        location: "Main Lobby",
        speaker: "",
        type: "Reception",
        attendees: 250
      },
      {
        id: 2,
        time: "09:30 AM",
        duration: 60,
        title: "Opening Keynote",
        description: "Welcome address and industry overview",
        location: "Main Auditorium",
        speaker: "John Smith, CEO",
        type: "Keynote",
        attendees: 250
      },
      {
        id: 3,
        time: "10:30 AM",
        duration: 15,
        title: "Coffee Break",
        description: "Networking break with refreshments",
        location: "Exhibition Hall",
        speaker: "",
        type: "Break",
        attendees: 250
      },
      {
        id: 4,
        time: "10:45 AM",
        duration: 45,
        title: "Tech Innovation Panel",
        description: "Discussion on emerging technologies",
        location: "Conference Room A",
        speaker: "Tech Leaders Panel",
        type: "Panel",
        attendees: 100
      }
    ],
    day2: [
      {
        id: 5,
        time: "09:00 AM",
        duration: 45,
        title: "Workshop: Digital Transformation",
        description: "Hands-on workshop for digital strategies",
        location: "Workshop Room 1",
        speaker: "Sarah Johnson",
        type: "Workshop",
        attendees: 50
      },
      {
        id: 6,
        time: "10:00 AM",
        duration: 60,
        title: "Investor Presentations",
        description: "Startup pitch presentations",
        location: "Main Auditorium",
        speaker: "Various Startups",
        type: "Presentation",
        attendees: 200
      }
    ]
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Keynote': return 'bg-purple-100 text-purple-800';
      case 'Panel': return 'bg-blue-100 text-blue-800';
      case 'Workshop': return 'bg-green-100 text-green-800';
      case 'Presentation': return 'bg-orange-100 text-orange-800';
      case 'Break': return 'bg-gray-100 text-gray-800';
      case 'Reception': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentItems = agendaItems[selectedDay] || [];

  return (
    <PageLayout 
      title="Agenda Manager" 
      subtitle="Create and manage your event schedule and session details."
    >
      {/* Actions Bar */}
      <Card className="shadow-soft mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant={selectedDay === 'day1' ? 'default' : 'outline'}
                onClick={() => setSelectedDay('day1')}
              >
                Day 1 - March 15
              </Button>
              <Button 
                variant={selectedDay === 'day2' ? 'default' : 'outline'}
                onClick={() => setSelectedDay('day2')}
              >
                Day 2 - March 16
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agenda Timeline */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <span>Event Schedule - {selectedDay === 'day1' ? 'Day 1' : 'Day 2'}</span>
              </CardTitle>
              <Badge variant="secondary">
                {currentItems.length} sessions
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentItems.map((item, index) => (
                  <div key={item.id} className="relative">
                    {index < currentItems.length - 1 && (
                      <div className="absolute left-6 top-16 bottom-0 w-px bg-border"></div>
                    )}
                    <div className="flex space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {item.time.split(':')[0]}:{item.time.split(':')[1].split(' ')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.duration}min
                        </div>
                      </div>
                      <div className="flex-1 bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge className={getTypeColor(item.type)}>
                                {item.type}
                              </Badge>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{item.location}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{item.attendees}</span>
                              </div>
                            </div>
                            {item.speaker && (
                              <p className="text-sm font-medium text-foreground">
                                Speaker: {item.speaker}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Editor */}
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Add New Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sessionTitle">Session Title</Label>
                <Input id="sessionTitle" placeholder="Enter session title" />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Session description..." rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" type="time" />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input id="duration" type="number" placeholder="60" />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Room or venue" />
              </div>

              <div>
                <Label htmlFor="speaker">Speaker</Label>
                <Input id="speaker" placeholder="Speaker name" />
              </div>

              <div>
                <Label htmlFor="sessionType">Session Type</Label>
                <select className="w-full p-2 border border-input rounded-md bg-background">
                  <option value="keynote">Keynote</option>
                  <option value="panel">Panel Discussion</option>
                  <option value="workshop">Workshop</option>
                  <option value="presentation">Presentation</option>
                  <option value="break">Break</option>
                  <option value="reception">Reception</option>
                </select>
              </div>

              <Button className="w-full bg-gradient-primary hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Schedule Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Sessions</span>
                <span className="font-medium">
                  {Object.values(agendaItems).flat().length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Duration</span>
                <span className="font-medium">8.5 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Speakers</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Venues</span>
                <span className="font-medium">5</span>
              </div>
            </CardContent>
          </Card>

          {/* Session Types */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Session Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { type: "Keynote", count: 2 },
                  { type: "Panel", count: 3 },
                  { type: "Workshop", count: 4 },
                  { type: "Presentation", count: 5 },
                  { type: "Break", count: 4 },
                  { type: "Reception", count: 2 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <Badge className={getTypeColor(item.type)} variant="outline">
                      {item.type}
                    </Badge>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default AgendaManager;