import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, 
  Users, 
  ShoppingBag, 
  Shield,
  Star,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const Index = () => {
  const userTypes = [
    {
      title: "Event Planner",
      description: "Plan, organize and manage events with powerful tools",
      features: ["Event Creation", "Vendor Management", "Guest Lists", "RSVP Tracking"],
      link: "/dashboard",
      icon: CalendarDays,
      gradient: "bg-gradient-primary"
    },
    {
      title: "Vendor",
      description: "Showcase your services and manage bookings",
      features: ["Profile Management", "Booking Calendar", "Reviews", "Contracts"],
      link: "/vendor/profile",
      icon: ShoppingBag,
      gradient: "bg-gradient-hero"
    },
    {
      title: "Administrator",
      description: "Oversee platform operations and user management",
      features: ["User Verification", "Reports", "Platform Analytics", "User Management"],
      link: "/admin/verification",
      icon: Shield,
      gradient: "bg-gradient-secondary"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-strong">
                <CalendarDays className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Event Planning
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The complete platform for event planners, vendors, and administrators. 
              Create memorable events with powerful tools and seamless collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                <Zap className="h-5 w-5 mr-2" />
                Get Started
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* User Type Selection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Journey</h2>
          <p className="text-lg text-muted-foreground">
            Select your role to access the features designed specifically for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {userTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Card key={index} className="shadow-soft hover:shadow-strong transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${type.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-medium`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <p className="text-muted-foreground">{type.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {type.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={type.link}>
                    <Button className="w-full group-hover:scale-105 transition-transform duration-300">
                      Enter Dashboard
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Platform Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to create successful events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: CalendarDays, title: "Event Management", desc: "Create and manage events with ease" },
              { icon: Users, title: "Guest Management", desc: "Track RSVPs and manage attendees" },
              { icon: ShoppingBag, title: "Vendor Network", desc: "Connect with verified vendors" },
              { icon: Star, title: "Quality Assurance", desc: "Reviews and ratings system" }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="shadow-soft text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Create Amazing Events?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of event planners who trust our platform for their success
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                Start Planning
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/vendor/profile">
              <Button size="lg" variant="outline">
                Join as Vendor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
