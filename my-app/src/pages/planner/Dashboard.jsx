import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { 
  CalendarDays, 
  Users, 
  MapPin, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const upcomingEvents = [
    {
      id: 1,
      name: "Annual Conference 2024",
      date: "March 15, 2024",
      status: "In Progress",
      attendees: 250,
      venue: "Grand Convention Center"
    },
    {
      id: 2,
      name: "Product Launch Event",
      date: "March 22, 2024", 
      status: "Planning",
      attendees: 100,
      venue: "Innovation Hub"
    },
    {
      id: 3,
      name: "Team Building Retreat",
      date: "April 5, 2024",
      status: "Confirmed",
      attendees: 50,
      venue: "Mountain Resort"
    }
  ];

  const stats = [
    { label: "Active Events", value: "8", icon: CalendarDays, change: "+2" },
    { label: "Total Attendees", value: "1,245", icon: Users, change: "+15%" },
    { label: "Vendors Booked", value: "24", icon: MapPin, change: "+3" },
    { label: "Revenue", value: "$125K", icon: TrendingUp, change: "+8%" }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Confirmed': return CheckCircle;
      case 'In Progress': return Clock;
      case 'Planning': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <PageLayout 
      title="Dashboard" 
      subtitle="Welcome back! Here's what's happening with your events."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change}</p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span>Upcoming Events</span>
              </CardTitle>
              <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const StatusIcon = getStatusIcon(event.status);
                  return (
                    <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                          <StatusIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{event.name}</h3>
                          <p className="text-sm text-muted-foreground">{event.date} • {event.venue}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{event.attendees} attendees</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="shadow-soft mb-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Guest Lists
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Browse Vendors
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Track RSVPs
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-muted-foreground">Vendor confirmed for Conference</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm text-muted-foreground">15 new RSVPs received</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <p className="text-sm text-muted-foreground">Floorplan updated</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <p className="text-sm text-muted-foreground">New vendor application</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;