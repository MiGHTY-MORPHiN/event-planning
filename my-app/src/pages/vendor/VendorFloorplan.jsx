import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { 
  MapPin, 
  Eye, 
  Download,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const VendorFloorplan = () => {
  const assignedSlots = [
    {
      id: 1,
      eventName: "Annual Conference 2024",
      date: "March 15, 2024",
      venue: "Grand Convention Center",
      slotLocation: "Kitchen Area A",
      setupTime: "7:00 AM",
      serviceTime: "9:00 AM - 6:00 PM",
      status: "Confirmed",
      specialRequirements: ["Electrical outlets", "Water access", "Storage space"]
    },
    {
      id: 2,
      eventName: "Wedding Reception",
      date: "March 22, 2024",
      venue: "Sunset Gardens",
      slotLocation: "Catering Station B",
      setupTime: "2:00 PM",
      serviceTime: "5:00 PM - 11:00 PM",
      status: "Pending Confirmation",
      specialRequirements: ["Refrigeration unit", "Serving tables"]
    }
  ];

  const currentEvent = assignedSlots[0];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Pending Confirmation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Confirmed': return CheckCircle;
      case 'Pending Confirmation': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <PageLayout 
      title="Floorplan Viewer" 
      subtitle="View your assigned positions and setup details for upcoming events."
    >
      {/* Event Selection */}
      <Card className="shadow-soft mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{currentEvent.eventName}</h2>
                <p className="text-sm text-muted-foreground">{currentEvent.venue} • {currentEvent.date}</p>
              </div>
              <Badge className={getStatusColor(currentEvent.status)}>
                {currentEvent.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Plan
              </Button>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Eye className="h-4 w-4 mr-2" />
                View Full Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Floorplan Viewer */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Event Floorplan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[500px] bg-muted rounded-lg overflow-hidden border border-border">
                {/* Grid Background */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Venue Elements */}
                <div className="absolute inset-4">
                  {/* Main Stage */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-40 h-16 bg-purple-500 rounded-lg flex items-center justify-center shadow-medium">
                    <span className="text-white font-medium text-sm">Main Stage</span>
                  </div>

                  {/* Tables */}
                  <div className="absolute top-32 left-8 w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center shadow-medium">
                    <span className="text-white font-medium text-xs">Table 1</span>
                  </div>
                  <div className="absolute top-32 left-32 w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center shadow-medium">
                    <span className="text-white font-medium text-xs">Table 2</span>
                  </div>
                  <div className="absolute top-32 right-32 w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center shadow-medium">
                    <span className="text-white font-medium text-xs">Table 3</span>
                  </div>
                  <div className="absolute top-32 right-8 w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center shadow-medium">
                    <span className="text-white font-medium text-xs">Table 4</span>
                  </div>

                  {/* Your Assigned Area - Highlighted */}
                  <div className="absolute bottom-8 left-8 w-32 h-24 bg-accent rounded-lg flex items-center justify-center shadow-strong border-4 border-accent animate-pulse">
                    <div className="text-center">
                      <span className="text-white font-bold text-sm">Kitchen Area A</span>
                      <div className="text-white text-xs mt-1">YOUR STATION</div>
                    </div>
                  </div>

                  {/* Other Vendor Areas */}
                  <div className="absolute bottom-8 right-8 w-24 h-24 bg-green-500 rounded-lg flex items-center justify-center shadow-medium">
                    <span className="text-white font-medium text-xs text-center">Bar Service</span>
                  </div>

                  {/* Entrance */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-8 bg-gray-500 rounded flex items-center justify-center">
                    <span className="text-white font-medium text-xs">Entrance</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">Legend</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-accent rounded"></div>
                      <span className="text-xs">Your Station</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-xs">Guest Tables</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className="text-xs">Stage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-xs">Other Vendors</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Details Sidebar */}
        <div className="space-y-6">
          {/* Assigned Slot Details */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Your Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Station Location</p>
                <p className="font-semibold text-foreground">{currentEvent.slotLocation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Setup Time</p>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{currentEvent.setupTime}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service Hours</p>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{currentEvent.serviceTime}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Special Requirements</p>
                <div className="space-y-1">
                  {currentEvent.specialRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedSlots.slice(1).map((slot) => {
                  const StatusIcon = getStatusIcon(slot.status);
                  return (
                    <div key={slot.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{slot.eventName}</h4>
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{slot.venue}</p>
                      <p className="text-xs text-muted-foreground">{slot.date}</p>
                      <Badge className={`${getStatusColor(slot.status)} mt-2`} variant="outline">
                        {slot.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Event Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Event Coordinator</p>
                  <p className="text-sm text-muted-foreground">Sarah Johnson</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">sarah@techcorp.com</p>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Contact Coordinator
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default VendorFloorplan;
