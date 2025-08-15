import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import PageLayout from '@/components/layout/PageLayout';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  DollarSign,
  Check,
  X,
  Eye,
  Users,
  MessageCircle
} from 'lucide-react';

const VendorBookings = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const bookings = [
    {
      id: 1,
      eventName: "Annual Conference 2024",
      client: "Tech Corp",
      date: "March 15, 2024",
      time: "9:00 AM - 6:00 PM",
      location: "Grand Convention Center",
      attendees: 250,
      value: "$8,500",
      status: "Confirmed",
      type: "Corporate Event",
      description: "Full catering service for annual company conference"
    },
    {
      id: 2,
      eventName: "Wedding Reception",
      client: "Sarah & Michael",
      date: "March 22, 2024",
      time: "5:00 PM - 11:00 PM",
      location: "Sunset Gardens",
      attendees: 120,
      value: "$6,200",
      status: "Pending",
      type: "Wedding",
      description: "Wedding reception catering with cocktail hour"
    },
    {
      id: 3,
      eventName: "Product Launch",
      client: "Innovation Labs",
      date: "March 28, 2024",
      time: "2:00 PM - 8:00 PM",
      location: "Tech Hub Downtown",
      attendees: 80,
      value: "$3,400",
      status: "Inquiry",
      type: "Corporate Event",
      description: "Launch event with appetizers and networking dinner"
    },
    {
      id: 4,
      eventName: "Birthday Celebration",
      client: "Johnson Family",
      date: "April 5, 2024",
      time: "12:00 PM - 4:00 PM",
      location: "Private Residence",
      attendees: 40,
      value: "$1,800",
      status: "Declined",
      type: "Private Party",
      description: "50th birthday party catering"
    }
  ];

  const upcomingEvents = bookings.filter(booking => booking.status === 'Confirmed');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Inquiry': return 'bg-blue-100 text-blue-800';
      case 'Declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Confirmed': return Check;
      case 'Pending': return Clock;
      case 'Inquiry': return Eye;
      case 'Declined': return X;
      default: return Clock;
    }
  };

  const monthlyStats = {
    totalBookings: 12,
    confirmedBookings: 8,
    pendingBookings: 3,
    totalRevenue: 45600
  };

  return (
    <PageLayout 
      title="Booking Calendar" 
      subtitle="Manage your event bookings and schedule."
    >
      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { 
            label: "Total Bookings", 
            value: monthlyStats.totalBookings, 
            icon: CalendarIcon, 
            color: "text-blue-600" 
          },
          { 
            label: "Confirmed", 
            value: monthlyStats.confirmedBookings, 
            icon: Check, 
            color: "text-green-600" 
          },
          { 
            label: "Pending Review", 
            value: monthlyStats.pendingBookings, 
            icon: Clock, 
            color: "text-yellow-600" 
          },
          { 
            label: "Total Revenue", 
            value: `$${monthlyStats.totalRevenue.toLocaleString()}`, 
            icon: DollarSign, 
            color: "text-purple-600" 
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span>Calendar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-soft mt-6">
            <CardHeader>
              <CardTitle>This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Events</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Guests</span>
                  <span className="font-medium">450</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-medium">$18,100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        <div className="lg:col-span-3">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Recent Bookings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const StatusIcon = getStatusIcon(booking.status);
                  return (
                    <div key={booking.id} className="border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{booking.eventName}</h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{booking.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Client:</span>
                              <span className="font-medium">{booking.client}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Date:</span>
                              <span className="font-medium">{booking.date}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Time:</span>
                              <span className="font-medium">{booking.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Venue:</span>
                              <span className="font-medium">{booking.location}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6 mt-3 text-sm">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{booking.attendees} guests</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-primary">{booking.value}</span>
                            </div>
                            <Badge variant="outline">{booking.type}</Badge>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          {booking.status === 'Pending' && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Check className="h-4 w-4 mr-2" />
                                Accept
                              </Button>
                              <Button size="sm" variant="outline">
                                <X className="h-4 w-4 mr-2" />
                                Decline
                              </Button>
                            </>
                          )}
                          {booking.status === 'Inquiry' && (
                            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Respond
                            </Button>
                          )}
                          {booking.status === 'Confirmed' && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default VendorBookings;