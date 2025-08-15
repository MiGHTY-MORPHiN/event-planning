import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { 
  FileText, 
  Upload, 
  Download, 
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Search
} from 'lucide-react';

const VendorContracts = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const contracts = [
    {
      id: 1,
      title: "Annual Conference 2024 - Catering Agreement",
      client: "Tech Corp",
      eventDate: "March 15, 2024",
      contractValue: "$8,500",
      status: "Active",
      signedDate: "February 10, 2024",
      type: "Service Agreement",
      description: "Full catering service for 250 attendees including breakfast, lunch, and coffee breaks"
    },
    {
      id: 2,
      title: "Wedding Reception Catering Contract",
      client: "Sarah & Michael Johnson",
      eventDate: "March 22, 2024",
      contractValue: "$6,200",
      status: "Pending Signature",
      signedDate: "Pending",
      type: "Wedding Contract",
      description: "Wedding reception catering for 120 guests with cocktail hour and dinner service"
    },
    {
      id: 3,
      title: "Product Launch Event Agreement",
      client: "Innovation Labs",
      eventDate: "March 28, 2024",
      contractValue: "$3,400",
      status: "Draft",
      signedDate: "Not signed",
      type: "Corporate Event",
      description: "Launch event catering with appetizers and networking dinner for 80 attendees"
    },
    {
      id: 4,
      title: "Monthly Corporate Lunch Contract",
      client: "Enterprise Solutions",
      eventDate: "Ongoing",
      contractValue: "$2,400/month",
      status: "Active",
      signedDate: "January 15, 2024",
      type: "Recurring Service",
      description: "Monthly corporate lunch service for 50 employees every third Friday"
    }
  ];

  const contractTemplates = [
    { name: "Standard Catering Agreement", type: "General" },
    { name: "Wedding Service Contract", type: "Wedding" },
    { name: "Corporate Event Agreement", type: "Corporate" },
    { name: "Recurring Service Contract", type: "Subscription" }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending Signature': return 'bg-yellow-100 text-yellow-800';
      case 'Draft': return 'bg-blue-100 text-blue-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return CheckCircle;
      case 'Pending Signature': return Clock;
      case 'Draft': return FileText;
      case 'Expired': return AlertCircle;
      default: return FileText;
    }
  };

  const filteredContracts = contracts.filter(contract => 
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout 
      title="Contracts & Agreements" 
      subtitle="Manage your service contracts and legal agreements."
    >
      {/* Actions Bar */}
      <Card className="shadow-soft mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search contracts..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Contract
              </Button>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contracts List */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Active Contracts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredContracts.map((contract) => {
                  const StatusIcon = getStatusIcon(contract.status);
                  return (
                    <div key={contract.id} className="border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{contract.title}</h3>
                            <Badge className={getStatusColor(contract.status)}>
                              {contract.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{contract.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-muted-foreground">Client:</span>
                              <span className="font-medium">{contract.client}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Event Date:</span>
                              <span className="font-medium">{contract.eventDate}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Value:</span>
                              <span className="font-medium text-primary">{contract.contractValue}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Signed:</span>
                              <span className="font-medium">{contract.signedDate}</span>
                            </div>
                          </div>

                          <Badge variant="outline" className="mt-3">
                            {contract.type}
                          </Badge>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          {contract.status === 'Draft' && (
                            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                              Edit
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Templates */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Contract Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contractTemplates.map((template, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.type}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Use
                    </Button>
                  </div>
                ))}
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
                <Plus className="h-4 w-4 mr-2" />
                Create New Contract
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Upload Signed Contract
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export All Contracts
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Contract Templates
              </Button>
            </CardContent>
          </Card>

          {/* Contract Stats */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Contract Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Contracts</span>
                  <span className="font-medium">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Signature</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Drafts</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-medium">Total Value</span>
                  <span className="font-bold text-primary">$20,500</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Contract Form */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Quick Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contractTitle">Contract Title</Label>
                <Input id="contractTitle" placeholder="Enter contract title" />
              </div>

              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" placeholder="Client name" />
              </div>

              <div>
                <Label htmlFor="contractValue">Contract Value</Label>
                <Input id="contractValue" placeholder="$0.00" />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Contract description..." rows={3} />
              </div>

              <Button className="w-full bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default VendorContracts;