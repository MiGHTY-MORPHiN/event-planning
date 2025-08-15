import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageLayout from '@/components/layout/PageLayout';
import { 
  MapPin, 
  Square, 
  Circle, 
  RotateCw,
  Move3D,
  Trash2,
  Save,
  Upload,
  Download,
  Layers,
  Grid,
  Maximize
} from 'lucide-react';

const FloorplanEditor = () => {
  const [selectedTool, setSelectedTool] = useState('select');
  const [gridVisible, setGridVisible] = useState(true);
  const [elements, setElements] = useState([
    { id: 1, type: 'table', x: 100, y: 100, width: 120, height: 80, rotation: 0, label: 'Table 1' },
    { id: 2, type: 'stage', x: 300, y: 50, width: 200, height: 100, rotation: 0, label: 'Main Stage' },
    { id: 3, type: 'booth', x: 150, y: 250, width: 100, height: 100, rotation: 0, label: 'Vendor Booth A' },
  ]);

  const tools = [
    { id: 'select', icon: Move3D, label: 'Select' },
    { id: 'table', icon: Square, label: 'Table' },
    { id: 'stage', icon: Square, label: 'Stage' },
    { id: 'booth', icon: Square, label: 'Booth' },
    { id: 'entrance', icon: Circle, label: 'Entrance' },
  ];

  const elementTypes = {
    table: { color: 'bg-blue-500', border: 'border-blue-600' },
    stage: { color: 'bg-purple-500', border: 'border-purple-600' },
    booth: { color: 'bg-green-500', border: 'border-green-600' },
    entrance: { color: 'bg-orange-500', border: 'border-orange-600' },
  };

  return (
    <PageLayout 
      title="Floorplan Editor" 
      subtitle="Design and customize your event layout."
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tools Panel */}
        <div className="lg:col-span-1">
          <Card className="shadow-soft mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-primary" />
                <span>Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    variant={selectedTool === tool.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tool.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="shadow-soft mb-6">
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="elementName">Element Name</Label>
                <Input id="elementName" placeholder="Enter name" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Input id="width" type="number" placeholder="120" />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input id="height" type="number" placeholder="80" />
                </div>
              </div>
              <div>
                <Label htmlFor="rotation">Rotation (°)</Label>
                <Input id="rotation" type="number" placeholder="0" />
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Layers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {elements.map((element) => (
                  <div 
                    key={element.id}
                    className="flex items-center justify-between p-2 rounded border border-border hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded ${elementTypes[element.type]?.color}`}></div>
                      <span className="text-sm">{element.label}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {element.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-3">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Canvas</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={gridVisible ? "default" : "outline"}
                  onClick={() => setGridVisible(!gridVisible)}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Maximize className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[600px] bg-muted overflow-hidden">
                {/* Grid Background */}
                {gridVisible && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                )}

                {/* Floor Elements */}
                {elements.map((element) => {
                  const styles = elementTypes[element.type];
                  return (
                    <div
                      key={element.id}
                      className={`absolute border-2 ${styles.color} ${styles.border} rounded-lg cursor-move flex items-center justify-center shadow-medium hover:shadow-strong transition-all`}
                      style={{
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        transform: `rotate(${element.rotation}deg)`,
                      }}
                    >
                      <span className="text-white font-medium text-xs text-center px-2">
                        {element.label}
                      </span>
                    </div>
                  );
                })}

                {/* Coordinate Indicator */}
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
                  <p className="text-sm text-muted-foreground">x: 0, y: 0</p>
                </div>

                {/* Scale Indicator */}
                <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
                  <p className="text-sm text-muted-foreground">Scale: 100%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card className="shadow-soft">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{elements.length}</p>
                <p className="text-sm text-muted-foreground">Elements</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">2,400</p>
                <p className="text-sm text-muted-foreground">sq ft</p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">85%</p>
                <p className="text-sm text-muted-foreground">Capacity</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default FloorplanEditor;