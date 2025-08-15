import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PageLayout from '@/components/layout/PageLayout';
import { 
  UserCheck, 
  Users, 
  Clock, 
  XCircle,
  TrendingUp,
  Calendar,
  Download,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const RSVPTracker = () => {
  const rsvpStats = {
    total: 250,
    confirmed: 187,
    pending: 38,
    declined: 25,
    responseRate: 90,
    deadline: "March 10, 2024"
  };

  const recentRSVPs = [
    {
      id: 1,
      name: "Alice Cooper",
      email: "alice@company.com",
      status: "Confirmed",
      timestamp: "2 minutes ago",
      plusOne: true,
      dietary: "Vegetarian"
    },
    {
      id: 2,
      name: "Bob Wilson",
      email: "bob.wilson@corp.com",
      status: "Declined",
      timestamp: "15 minutes ago",
      plusOne: false,
      dietary: "None",
      reason: "Schedule conflict"
    },
    {
      id: 3,
      name: "Carol Martinez",
      email: "carol.m@startup.io",
      status: "Confirmed",
      timestamp: "1 hour ago",
      plusOne: true,
      dietary: "Gluten-free"
    },
    {
      id: 4,
      name: "David Kim",
      email: "d.kim@enterprise.com",
      status: "Confirmed",
      timestamp: "3 hours ago",
      plusOne: false,
      dietary: "Vegan"
    }
  ];

  const dailyResponses = [
    { date: "Mar 1", responses: 23 },
    { date: "Mar 2", responses: 31 },
    { date: "Mar 3", responses: 18 },
    { date: "Mar 4", responses: 42 },
    { date: "Mar 5", responses: 27 },
    { date: "Mar 6", responses: 35 },
    { date: "Mar 7", responses: 11 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Confirmed': return CheckCircle;
      case 'Pending': return Clock;
      case 'Declined': return XCircle;
      default: return AlertCircle;
    }
  };

  return (
    <PageLayout 
      title="RSVP Tracker" 
      subtitle="Monitor guest responses and track attendance confirmations."
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { 
            label: "Total Invites", 
            value: rsvpStats.total, 
            icon: Users, 
            color: "text-blue-600",
            change: "+12"
          },
          { 
            label: "Confirmed", 
            value: rsvpStats.confirmed, 
            icon: CheckCircle, 
            color: "text-green-600",
            change: "+8"
          },
          { 
            label: "Pending", 
            value: rsvpStats.pending, 
            icon: Clock, 
            color: "text-yellow-600",
            change: "-5"
          },
          { 
            label: "Declined", 
            value: rsvpStats.declined, 
            icon: XCircle, 
            color: "text-red-600",
            change: "+3"
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.change} today</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Response Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Response Overview</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Response Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Response Rate</span>
                    <span className="text-sm text-muted-foreground">{rsvpStats.responseRate}%</span>
                  </div>
                  <Progress value={rsvpStats.responseRate} className="h-2" />
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{rsvpStats.confirmed}</div>
                    <div className="text-sm text-green-600">Confirmed</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((rsvpStats.confirmed / rsvpStats.total) * 100)}%
                    </div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{rsvpStats.pending}</div>
                    <div className="text-sm text-yellow-600">Pending</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((rsvpStats.pending / rsvpStats.total) * 100)}%
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{rsvpStats.declined}</div>
                    <div className="text-sm text-red-600">Declined</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((rsvpStats.declined / rsvpStats.total) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Daily Response Chart Placeholder */}
                <div className="h-64 bg-gradient-secondary rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Daily Response Chart</p>
                    <p className="text-sm text-muted-foreground">Chart visualization would go here</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent RSVPs */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <span>Recent RSVPs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRSVPs.map((rsvp) => {
                  const StatusIcon = getStatusIcon(rsvp.status);
                  return (
                    <div key={rsvp.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                          <StatusIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{rsvp.name}</p>
                          <p className="text-sm text-muted-foreground">{rsvp.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">{rsvp.timestamp}</span>
                            {rsvp.plusOne && (
                              <Badge variant="outline" className="text-xs">+1</Badge>
                            )}
                            {rsvp.dietary !== "None" && (
                              <Badge variant="outline" className="text-xs">{rsvp.dietary}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(rsvp.status)}>
                          {rsvp.status}
                        </Badge>
                        {rsvp.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{rsvp.reason}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deadline Alert */}
          <Card className="shadow-soft border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-accent" />
                <span>RSVP Deadline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{rsvpStats.deadline}</p>
                <p className="text-sm text-muted-foreground">3 days remaining</p>
                <Button className="w-full mt-4 bg-gradient-primary hover:opacity-90">
                  <Send className="h-4 w-4 mr-2" />
                  Send Final Reminder
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Guest List
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Send className="h-4 w-4 mr-2" />
                Send Bulk Reminders
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                View All Guests
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          {/* Dietary Requirements Summary */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Dietary Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { requirement: "Vegetarian", count: 23 },
                  { requirement: "Vegan", count: 12 },
                  { requirement: "Gluten-free", count: 8 },
                  { requirement: "Nut allergy", count: 5 },
                  { requirement: "None", count: 139 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.requirement}</span>
                    <Badge variant="secondary">{item.count}</Badge>
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

export default RSVPTracker;