import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { 
  User, 
  Star, 
  Award, 
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Camera,
  Save,
  Plus,
  X
} from 'lucide-react';

const VendorProfile = () => {
  const [profile, setProfile] = useState({
    businessName: "Elegant Catering Co.",
    description: "Premium catering services with 15+ years of experience specializing in corporate events and weddings.",
    category: "Catering",
    email: "info@elegantcatering.com",
    phone: "+1 (555) 123-4567",
    location: "Downtown, City",
    website: "www.elegantcatering.com"
  });

  const [services, setServices] = useState([
    { id: 1, name: "Wedding Catering", price: "$75/person", description: "Full service wedding catering" },
    { id: 2, name: "Corporate Events", price: "$45/person", description: "Business meeting and conference catering" },
    { id: 3, name: "Private Parties", price: "$55/person", description: "Birthday parties and celebrations" }
  ]);

  const certifications = [
    { name: "Food Safety Certified", issuer: "Health Department", year: "2023" },
    { name: "ServSafe Manager", issuer: "National Restaurant Association", year: "2022" },
    { name: "Business License", issuer: "City License Department", year: "2023" }
  ];

  const stats = {
    rating: 4.9,
    totalReviews: 127,
    completedEvents: 342,
    responseTime: "< 2 hours"
  };

  return (
    <PageLayout 
      title="Vendor Profile" 
      subtitle="Manage your business profile and service offerings."
    >
      {/* Profile Header */}
      <Card className="shadow-soft mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-primary rounded-xl flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
              <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{profile.businessName}</h2>
                  <Badge className="mt-1 mb-2">{profile.category}</Badge>
                  <p className="text-muted-foreground">{profile.description}</p>
                </div>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Rating", value: stats.rating, icon: Star, suffix: "/5" },
          { label: "Reviews", value: stats.totalReviews, icon: Star, suffix: "" },
          { label: "Events Completed", value: stats.completedEvents, icon: Award, suffix: "" },
          { label: "Response Time", value: stats.responseTime, icon: Mail, suffix: "" }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Icon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}{stat.suffix}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input 
                  id="businessName"
                  value={profile.businessName}
                  onChange={(e) => setProfile({...profile, businessName: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile({...profile, description: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({...profile, website: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services & Pricing */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span>Services & Pricing</span>
              </CardTitle>
              <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                      <p className="text-sm font-medium text-primary mt-1">{service.price}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Verification Status */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Verification Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Business License</span>
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Insurance</span>
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Background Check</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Portfolio Review</span>
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Certifications</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {certifications.map((cert, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">{cert.name}</h4>
                    <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                    <p className="text-xs text-muted-foreground">{cert.year}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Profile Info</span>
                  <span className="text-sm text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Services</span>
                  <span className="text-sm text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Portfolio</span>
                  <span className="text-sm text-yellow-600">○</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reviews</span>
                  <span className="text-sm text-green-600">✓</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-sm text-muted-foreground text-center">85% Complete</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default VendorProfile;