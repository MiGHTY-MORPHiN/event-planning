import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import PageLayout from '@/components/layout/PageLayout';
import { 
  Users, 
  Upload, 
  Download, 
  Send, 
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal
} from 'lucide-react';

const GuestListManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<[]>([]);

  const guests = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 234-567-8900",
      company: "Tech Corp",
      status: "Confirmed",
      type: "VIP",
      plusOne: true,
      dietary: "Vegetarian"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@company.com",
      phone: "+1 234-567-8901",
      company: "Design Studio",
      status: "Pending",
      type: "Speaker",
      plusOne: false,
      dietary: "None"
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "m.brown@enterprise.com",
      phone: "+1 234-567-8902",
      company: "Enterprise Inc",
      status: "Declined",
      type: "Attendee",
      plusOne: true,
      dietary: "Gluten-free"
    },
    {
      id: 4,
      name: "Emma Davis",
      email: "emma.davis@startup.io",
      phone: "+1 234-567-8903",
      company: "Startup Co",
      status: "Confirmed",
      type: "Sponsor",
      plusOne: false,
      dietary: "Vegan"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'VIP': return 'bg-purple-100 text-purple-800';
      case 'Speaker': return 'bg-blue-100 text-blue-800';
      case 'Sponsor': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectGuest = (guestId) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const handleSelectAll = () => {
    setSelectedGuests(
      selectedGuests.length === guests.length 
        ? [] 
        : guests.map(guest => guest.id)
    );
  };

  return (
    <PageLayout 
      title="Guest List Manager" 
      subtitle="Manage your event attendees and send invitations."
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Guests", value: "124", icon: Users, color: "text-blue-600" },
          { label: "Confirmed", value: "89", icon: Users, color: "text-green-600" },
          { label: "Pending", value: "25", icon: Users, color: "text-yellow-600" },
          { label: "Declined", value: "10", icon: Users, color: "text-red-600" }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions Bar */}
      <Card className="shadow-soft mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search guests..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
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
              <Button className="bg-gradient-primary hover:opacity-90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guest List Table */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Guest List</span>
            {selectedGuests.length > 0 && (
              <Badge variant="secondary">
                {selectedGuests.length} selected
              </Badge>
            )}
          </CardTitle>
          {selectedGuests.length > 0 && (
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Invites
              </Button>
              <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                <Send className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4">
                    <Checkbox 
                      checked={selectedGuests.length === guests.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Plus One</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Dietary</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-4">
                      <Checkbox 
                        checked={selectedGuests.includes(guest.id)}
                        onCheckedChange={() => handleSelectGuest(guest.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{guest.name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{guest.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{guest.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{guest.company}</span>
                    </td>
                    <td className="p-4">
                      <Badge className={getTypeColor(guest.type)}>
                        {guest.type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(guest.status)}>
                        {guest.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {guest.plusOne ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{guest.dietary}</span>
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default GuestListManager;