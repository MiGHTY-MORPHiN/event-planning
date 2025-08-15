import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageLayout from '@/components/layout/PageLayout';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  DollarSign,
  Heart,
  MessageCircle,
  Calendar,
  Award,
  Users
} from 'lucide-react';

const VendorMarketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  const vendors = [
    {
      id: 1,
      name: "Elegant Catering Co.",
      category: "Catering",
      rating: 4.9,
      reviews: 127,
      price: "$$$",
      location: "Downtown",
      image: "/api/placeholder/300/200",
      verified: true,
      specialties: ["Wedding", "Corporate", "Fine Dining"],
      description: "Premium catering services with 15+ years of experience",
      availability: "Available",
      featured: true
    },
    {
      id: 2,
      name: "Sounds Perfect DJ",
      category: "Entertainment", 
      rating: 4.8,
      reviews: 89,
      price: "$$",
      location: "Midtown",
      image: "/api/placeholder/300/200",
      verified: true,
      specialties: ["Wedding", "Party", "Corporate"],
      description: "Professional DJ services with state-of-the-art equipment",
      availability: "Limited",
      featured: false
    },
    {
      id: 3,
      name: "Bloom & Blossom",
      category: "Florist",
      rating: 4.7,
      reviews: 203,
      price: "$$",
      location: "Garden District",
      image: "/api/placeholder/300/200",
      verified: true,
      specialties: ["Wedding", "Corporate", "Seasonal"],
      description: "Beautiful floral arrangements for every occasion",
      availability: "Available",
      featured: true
    },
    {
      id: 4,
      name: "Lens & Light Photography",
      category: "Photography",
      rating: 4.9,
      reviews: 156,
      price: "$$$",
      location: "Arts District",
      image: "/api/placeholder/300/200",
      verified: true,
      specialties: ["Wedding", "Event", "Portrait"],
      description: "Capturing your special moments with artistic vision",
      availability: "Booked",
      featured: false
    },
    {
      id: 5,
      name: "Party Rentals Plus",
      category: "Equipment",
      rating: 4.6,
      reviews: 91,
      price: "$",
      location: "Industrial Zone",
      image: "/api/placeholder/300/200",
      verified: false,
      specialties: ["Tables", "Chairs", "Tents"],
      description: "Complete party equipment rental solutions",
      availability: "Available",
      featured: false
    },
    {
      id: 6,
      name: "Sweet Dreams Bakery",
      category: "Bakery",
      rating: 4.8,
      reviews: 134,
      price: "$$",
      location: "Baker Street",
      image: "/api/placeholder/300/200",
      verified: true,
      specialties: ["Wedding Cakes", "Desserts", "Custom"],
      description: "Artisanal cakes and desserts made with love",
      availability: "Available",
      featured: true
    }
  ];

  const categories = [
    "All Categories", "Catering", "Entertainment", "Florist", 
    "Photography", "Equipment", "Bakery", "Decoration", "Security"
  ];

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Limited': return 'bg-yellow-100 text-yellow-800';
      case 'Booked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageLayout 
      title="Vendor Marketplace" 
      subtitle="Discover and connect with the best vendors for your event."
    >
      {/* Search and Filters */}
      <Card className="shadow-soft mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search vendors, categories, or specialties..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem 
                    key={category} 
                    value={category === 'All Categories' ? 'all' : category}
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="$">$ (Budget)</SelectItem>
                <SelectItem value="$$">$$ (Mid-range)</SelectItem>
                <SelectItem value="$$$">$$$ (Premium)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Featured Vendors */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Featured Vendors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.filter(v => v.featured).map((vendor) => (
            <Card key={vendor.id} className="shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden">
              <div className="relative">
                <div className="h-48 bg-gradient-secondary"></div>
                {vendor.featured && (
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                    Featured
                  </Badge>
                )}
                {vendor.verified && (
                  <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground">{vendor.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{vendor.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">({vendor.reviews} reviews)</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{vendor.description}</p>

                <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{vendor.price}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {vendor.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getAvailabilityColor(vendor.availability)}>
                    {vendor.availability}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                      <Calendar className="h-4 w-4 mr-1" />
                      Book
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* All Vendors */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">All Vendors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.filter(v => !v.featured).map((vendor) => (
            <Card key={vendor.id} className="shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden">
              <div className="relative">
                <div className="h-48 bg-gradient-secondary"></div>
                {vendor.verified && (
                  <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground">{vendor.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{vendor.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">({vendor.reviews} reviews)</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{vendor.description}</p>

                <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{vendor.price}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {vendor.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getAvailabilityColor(vendor.availability)}>
                    {vendor.availability}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                      <Calendar className="h-4 w-4 mr-1" />
                      Book
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{filteredVendors.length}</p>
            <p className="text-sm text-muted-foreground">Vendors Found</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{filteredVendors.filter(v => v.verified).length}</p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{filteredVendors.filter(v => v.availability === 'Available').length}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">4.8</p>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default VendorMarketplace;