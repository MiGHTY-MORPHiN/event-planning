import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { Settings, Users, Ban, Eye, AlertTriangle } from 'lucide-react';

const AdminUserManagement = () => {
  const reportedUsers = [
    {
      id: 1,
      name: "John Problematic",
      email: "john@example.com",
      type: "Planner",
      reports: 3,
      lastActivity: "2 days ago",
      reason: "Inappropriate communication with vendors"
    },
    {
      id: 2,
      name: "Bad Vendor Co.",
      email: "contact@badvendor.com",
      type: "Vendor",
      reports: 5,
      lastActivity: "1 day ago",
      reason: "Poor service quality and non-compliance"
    }
  ];

  return (
    <PageLayout title="User Management" subtitle="Manage problematic users and reports.">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Users", value: "2,456", icon: Users, color: "text-blue-600" },
          { label: "Active Reports", value: "8", icon: AlertTriangle, color: "text-red-600" },
          { label: "Suspended Users", value: "12", icon: Ban, color: "text-orange-600" },
          { label: "Resolved Cases", value: "45", icon: Settings, color: "text-green-600" }
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

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <span>Reported Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportedUsers.map((user) => (
              <div key={user.id} className="border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-foreground">{user.name}</h3>
                      <Badge variant="outline">{user.type}</Badge>
                      <Badge className="bg-red-100 text-red-800">{user.reports} reports</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">Last active: {user.lastActivity}</p>
                    <p className="text-sm mt-1">{user.reason}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default AdminUserManagement;