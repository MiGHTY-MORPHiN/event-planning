import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageLayout from '@/components/layout/PageLayout';
import { BarChart3, Users, DollarSign, TrendingUp } from 'lucide-react';

const AdminReports = () => {
  return (
    <PageLayout title="Platform Reports" subtitle="Analytics and performance metrics.">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Users", value: "2,456", icon: Users, color: "text-blue-600" },
          { label: "Active Vendors", value: "156", icon: Users, color: "text-green-600" },
          { label: "Monthly Revenue", value: "$45,600", icon: DollarSign, color: "text-purple-600" },
          { label: "Events This Month", value: "89", icon: TrendingUp, color: "text-orange-600" }
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
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Platform Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-secondary rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Analytics dashboard would display here</p>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default AdminReports;