import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Building, FileText, Key, Plus, TrendingUp, Calendar } from "lucide-react";

interface OwnerDashboardProps {
  ownerEmail: string;
}

export function OwnerDashboard({ ownerEmail }: OwnerDashboardProps) {
  // State for date range selection
  const [dateRange, setDateRange] = useState({
    dateFrom: "",
    dateTo: ""
  });

  // Mock data - in real app this would be filtered by owner
  const getOwnerProperties = () => {
    if (ownerEmail.includes('john') || ownerEmail.includes('smith')) {
      return [
        { id: "1", name: "Rose Wood Retreat", status: "Active", lastUpdated: "2 days ago" },
        { id: "2", name: "Sunset Villa", status: "Active", lastUpdated: "1 week ago" }
      ];
    } else if (ownerEmail.includes('sarah')) {
      return [
        { id: "2", name: "Riverside Apartments", status: "Active", lastUpdated: "1 week ago" }
      ];
    } else {
      return [
        { id: "3", name: "Oak Grove Complex", status: "Pending", lastUpdated: "3 days ago" }
      ];
    }
  };

  const myProperties = getOwnerProperties();
  const activeProperties = myProperties.filter(p => p.status === "Active").length;
  const pendingProperties = myProperties.filter(p => p.status === "Pending").length;

  const metrics = [
    {
      title: "My Properties",
      value: myProperties.length.toString(),
      change: "+1 this month",
      icon: Building,
      color: "text-blue-600"
    },
    {
      title: "Active Properties",
      value: activeProperties.toString(),
      change: "All operational",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Reports Generated",
      value: "12",
      change: "+3 this month",
      icon: FileText,
      color: "text-purple-600"
    },
    {
      title: "Access Requests",
      value: "8",
      change: "+2 this week",
      icon: Key,
      color: "text-orange-600"
    }
  ];

  const upcomingTasks = [
    {
      id: 1,
      task: "Property inspection due",
      property: "Rose Wood Retreat",
      dueDate: "Tomorrow",
      priority: "high"
    },
    {
      id: 2,
      task: "Quarterly report generation",
      property: "All Properties",
      dueDate: "Next week",
      priority: "medium"
    },
    {
      id: 3,
      task: "Update utility information",
      property: "Sunset Villa",
      dueDate: "2 weeks",
      priority: "low"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1>My Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your property portfolio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text -muted-foreground">
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Date Range Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Filter by Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateRange.dateFrom}
                onChange={(e) => setDateRange({...dateRange, dateFrom: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateRange.dateTo}
                onChange={(e) => setDateRange({...dateRange, dateTo: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Properties</CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myProperties.map((property) => (
                <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{property.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Updated {property.lastUpdated}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={property.status === "Active" ? "default" : "secondary"}>
                      {property.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {myProperties.length === 0 && (
                <div className="text-center py-6">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Properties Yet</h3>
                  <p className="text-muted-foreground">Add your first property to get started</p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{task.task}</div>
                    <div className="text-sm text-muted-foreground">
                      {task.property} • Due {task.dueDate}
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle>Property Portfolio Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Properties with Complete Information</span>
              <span>85%</span>
            </div>
            <Progress value={85} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Up-to-date Utility Records</span>
              <span>92%</span>
            </div>
            <Progress value={92} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Recent Property Reports</span>
              <span>75%</span>
            </div>
            <Progress value={75} />
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}