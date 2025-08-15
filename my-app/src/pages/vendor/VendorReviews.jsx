import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PageLayout from '@/components/layout/PageLayout';
import { 
  Star, 
  TrendingUp, 
  MessageSquare,
  Users,
  Award,
  Download,
  Reply
} from 'lucide-react';

const VendorReviews = () => {
  const reviewStats = {
    averageRating: 4.9,
    totalReviews: 127,
    ratingDistribution: {
      5: 89,
      4: 25,
      3: 8,
      2: 3,
      1: 2
    },
    recentTrend: "+0.2"
  };

  const reviews = [
    {
      id: 1,
      clientName: "Sarah Johnson",
      eventName: "Wedding Reception",
      date: "March 10, 2024",
      rating: 5,
      comment: "Absolutely exceptional service! The team went above and beyond to make our special day perfect. The food was incredible and the presentation was beautiful. Highly recommend!",
      helpful: 12,
      eventType: "Wedding",
      verified: true
    },
    {
      id: 2,
      clientName: "Tech Corp",
      eventName: "Annual Conference",
      date: "March 8, 2024",
      rating: 5,
      comment: "Professional, reliable, and delicious food. They handled our 250-person corporate event flawlessly. Great communication throughout the planning process.",
      helpful: 8,
      eventType: "Corporate",
      verified: true
    },
    {
      id: 3,
      clientName: "Michael Brown",
      eventName: "Birthday Party",
      date: "March 5, 2024",
      rating: 4,
      comment: "Good food and service. The setup was a bit delayed but the team made up for it with excellent customer service. Would book again.",
      helpful: 5,
      eventType: "Private Party",
      verified: true
    },
    {
      id: 4,
      clientName: "Innovation Labs",
      eventName: "Product Launch",
      date: "March 2, 2024",
      rating: 5,
      comment: "Outstanding catering for our product launch. The team was flexible with last-minute changes and the quality was top-notch. Our investors were impressed!",
      helpful: 15,
      eventType: "Corporate",
      verified: true
    },
    {
      id: 5,
      clientName: "Emma Davis",
      eventName: "Engagement Party",
      date: "February 28, 2024",
      rating: 4,
      comment: "Beautiful presentation and tasty food. The only minor issue was some items running out earlier than expected, but overall a great experience.",
      helpful: 3,
      eventType: "Private Party",
      verified: true
    }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'Wedding': return 'bg-pink-100 text-pink-800';
      case 'Corporate': return 'bg-blue-100 text-blue-800';
      case 'Private Party': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageLayout 
      title="Reviews & Ratings" 
      subtitle="Monitor your customer feedback and service quality ratings."
    >
      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { 
            label: "Average Rating", 
            value: reviewStats.averageRating, 
            icon: Star, 
            color: "text-yellow-600",
            suffix: "/5"
          },
          { 
            label: "Total Reviews", 
            value: reviewStats.totalReviews, 
            icon: MessageSquare, 
            color: "text-blue-600",
            suffix: ""
          },
          { 
            label: "Rating Trend", 
            value: reviewStats.recentTrend, 
            icon: TrendingUp, 
            color: "text-green-600",
            suffix: " this month"
          },
          { 
            label: "Response Rate", 
            value: "94%", 
            icon: Reply, 
            color: "text-purple-600",
            suffix: ""
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
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
        {/* Reviews List */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span>Customer Reviews</span>
              </CardTitle>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Reviews
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-foreground">{review.clientName}</h3>
                            {review.verified && (
                              <Badge className="bg-green-100 text-green-800" variant="outline">
                                <Award className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.eventName}</p>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          {renderStars(review.rating)}
                        </div>
                        <Badge className={getEventTypeColor(review.eventType)} variant="outline">
                          {review.eventType}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{review.comment}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {review.helpful} people found this helpful
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        <Reply className="h-4 w-4 mr-2" />
                        Respond
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
          {/* Rating Distribution */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <span>Rating Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(reviewStats.ratingDistribution)
                  .reverse()
                  .map(([rating, count]) => (
                    <div key={rating} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 w-12">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <Progress 
                          value={(count / reviewStats.totalReviews) * 100} 
                          className="h-2" 
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {reviewStats.averageRating}
                  </div>
                  <div className="flex justify-center space-x-1 mb-2">
                    {renderStars(reviewStats.averageRating)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {reviewStats.totalReviews} reviews
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Categories */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Review Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: "Food Quality", rating: 4.9, reviews: 98 },
                  { category: "Service", rating: 4.8, reviews: 95 },
                  { category: "Presentation", rating: 4.9, reviews: 87 },
                  { category: "Timeliness", rating: 4.7, reviews: 92 },
                  { category: "Communication", rating: 4.8, reviews: 89 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.category}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {renderStars(item.rating)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({item.reviews} reviews)
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{item.rating}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Top Rated</span>
                  </div>
                  <p className="text-xs text-yellow-600">Maintained 4.8+ rating for 6 months</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">100 Reviews</span>
                  </div>
                  <p className="text-xs text-green-600">Reached 100+ customer reviews</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Reply className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Quick Responder</span>
                  </div>
                  <p className="text-xs text-blue-600">95% response rate to reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default VendorReviews;