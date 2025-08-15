import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { Shield, Check, X, Eye, Clock, AlertTriangle } from 'lucide-react';

const AdminVerification = () => {
  const pendingVerifications = [
    {
      id: 1,
      vendorName: "Elite Catering Services",
      submittedDate: "March 10, 2024",
      category: "Catering",
      documents: ["Business License", "Insurance", "Food Safety Certificate"],
      status: "Under Review"
    },
    {
      id: 2,
      vendorName: "Perfect Sound DJ",
      submittedDate: "March 8, 2024",
      category: "Entertainment",
      documents: ["Business License", "Equipment Insurance"],
      status: "Pending Documents"
    }
  ];

  return (
    <PageLayout title="Vendor Verification" subtitle="Review and approve vendor applications.">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Pending Review", value: "12", icon: Clock, color: "text-yellow-600" },
          { label: "Approved Today", value: "5", icon: Check, color: "text-green-600" },
          { label: "Rejected", value: "2", icon: X, color: "text-red-600" },
          { label: "Total Vendors", value: "156", icon: Shield, color: "text-blue-600" }
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
            <Shield className="h-5 w-5 text-primary" />
            <span>Pending Verifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingVerifications.map((vendor) => (
              <div key={vendor.id} className="border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{vendor.vendorName}</h3>
                    <p className="text-sm text-muted-foreground">Category: {vendor.category}</p>
                    <p className="text-sm text-muted-foreground">Submitted: {vendor.submittedDate}</p>
                    <div className="flex space-x-2 mt-2">
                      {vendor.documents.map((doc, idx) => (
                        <Badge key={idx} variant="outline">{doc}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Reject
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

export default AdminVerification;