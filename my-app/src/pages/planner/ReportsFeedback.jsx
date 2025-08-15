import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PageLayout from '@/components/layout/PageLayout';
import { 
  BarChart3, 
  Download, 
  Star,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye
} from 'lucide-react';

const ReportsFeedback = () => {
  const eventMetrics = {
    totalAttendees: 187,
    satisfactionScore: 4.6,
    netPromoterScore: 73,
    responseRate: 82,
    revenue: 125000,
    expenses: 89000,
    profit: 36000
  };

  const feedback = [
    {
      id: 1,
      attendee: "John Smith",
      rating: 5,
      comment: "Excellent event! Great speakers and networking opportunities.",
      session: "Opening Keynote",
      timestamp: "2 hours ago",
      sentiment: "positive"
    },
    {
      id: 2,
      attendee: "Sarah Johnson",
      rating: 4,
      comment: "Good content but the venue was a bit crowded during breaks.",
      session: "Tech Innovation Panel",
      timestamp: "4 hours ago",
      sentiment: "positive"
    },
    {
      id: 3,
      attendee: "Mike Brown",
      rating: 3,
      comment: "Average experience. Some sessions ran over time.",
      session: "Workshop: Digital Transformation",
      timestamp: "6 hours ago",
      sentiment: "neutral"
    },
    {
      id: 4,
      attendee: "Emily Davis",
      rating: 5,
      comment: "Amazing organization and valuable insights from speakers.",
      session: "Overall Event",
      timestamp: "8 hours ago",
      sentiment: "positive"
    }
  ];

  const sessionRatings = [
    { session: "Opening Keynote", rating: 4.8, responses: 145 },
    { session: "Tech Innovation Panel", rating: 4.5, responses: 98 },
    { session: "Digital Transformation Workshop", rating: 4.2, responses: 67 },
    { session: "Investor Presentations", rating: 4.6, responses: 123 },
    { session: "Networking Reception", rating: 4.7, responses: 134 }
  ];

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return ThumbsUp;
      case 'negative': return ThumbsDown;
      default: return MessageSquare;
    }
  };

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

  return (
    <PageLayout 
      title="Reports & Feedback" 
      subtitle="Analyze event performance and gather attendee insights."
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { 
            label: "Total Attendees", 
            value: eventMetrics.totalAttendees, 
            icon: Users, 
            color: "text-blue-600",
            suffix: ""
          },
          { 
            label: "Satisfaction Score", 
            value: eventMetrics.satisfactionScore, 
            icon: Star, 
            color: "text-yellow-600",
            suffix: "/5"
          },
          { 
            label: "Net Promoter Score", 
            value: eventMetrics.netPromoterScore, 
            icon: TrendingUp, 
            color: "text-green-600",
            suffix: ""
          },
          { 
            label: "Response Rate", 
            value: eventMetrics.responseRate, 
            icon: MessageSquare, 
            color: "text-purple-600",
            suffix: "%"
          }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {metric.value}{metric.suffix}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span>Financial Summary</span>
              </CardTitle>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${eventMetrics.revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">Revenue</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    ${eventMetrics.expenses.toLocaleString()}
                  </div>
                  <div className="text-sm text-red-600">Expenses</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${eventMetrics.profit.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600">Profit</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profit Margin</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((eventMetrics.profit / eventMetrics.revenue) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(eventMetrics.profit / eventMetrics.revenue) * 100} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Session Ratings */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Session Ratings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessionRatings.map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">{session.session}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {renderStars(session.rating)}
                        </div>
                        <span className="text-sm font-medium">{session.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({session.responses} responses)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress value={(session.rating / 5) * 100} className="w-20 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span>Recent Feedback</span>
              </CardTitle>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.map((item) => {
                  const SentimentIcon = getSentimentIcon(item.sentiment);
                  return (
                    <div key={item.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground">{item.attendee}</span>
                          <div className="flex space-x-1">
                            {renderStars(item.rating)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <SentimentIcon className={`h-4 w-4 ${getSentimentColor(item.sentiment)}`} />
                          <span className="text-sm text-muted-foreground">{item.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.comment}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.session}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Report Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download Full Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Export Feedback
              </Button>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                <TrendingUp className="h-4 w-4 mr-2" />
                Create Summary
              </Button>
            </CardContent>
          </Card>

          {/* Feedback Summary */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Feedback Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Positive</span>
                  </div>
                  <span className="text-sm font-medium">67%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Neutral</span>
                  </div>
                  <span className="text-sm font-medium">28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Negative</span>
                  </div>
                  <span className="text-sm font-medium">5%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Comments */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Most Appreciated</p>
                  <p className="text-xs text-green-600">Speaker quality and content</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Room for Improvement</p>
                  <p className="text-xs text-yellow-600">Venue space during breaks</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Suggestion</p>
                  <p className="text-xs text-blue-600">More networking time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default ReportsFeedback;