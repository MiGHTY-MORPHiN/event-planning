import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { Users, Star, DollarSign, Calendar, Eye, Ban } from 'lucide-react';

const AdminVendorDetails = () => {
  const vendors = [
    {
      id: 1,
      name: "Elegant Catering Co.",
      category: "Catering",
      rating: 4.9,
      totalEvents: 89,
      revenue: 45600,
      joinDate: "Jan 2023",
      status: "Active",
      verified: true
    },
    {
      id: 2,
      name: "Perfect Sound DJ",
      category: "Entertainment",
      rating: 4.7,
      totalEvents: 67,
      revenue: 23400,
      joinDate: "Mar 2023",
      status: "Active",
      verified: true
    }
  ];

  return (
    <PageLayout title="Vendor Management" subtitle="Manage vendor profiles and performance.">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>All Vendors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                      {vendor.verified && <Badge className="bg-green-100 text-green-800">Verified</Badge>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{vendor.rating} rating</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{vendor.totalEvents} events</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${vendor.revenue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Joined {vendor.joinDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
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

export default AdminVendorDetails;