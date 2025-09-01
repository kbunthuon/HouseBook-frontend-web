import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Building, Users, FileText, Key } from "lucide-react";

export function Dashboard() {
  const metrics = [
    {
      title: "Active Properties",
      value: "24",
      change: "+12%",
      icon: Building,
      color: "text-blue-600"
    },
    {
      title: "Property Owners",
      value: "18",
      change: "+8%",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Reports Generated",
      value: "156",
      change: "+23%",
      icon: FileText,
      color: "text-purple-600"
    },
    {
      title: "Access Tokens",
      value: "47",
      change: "+15%",
      icon: Key,
      color: "text-orange-600"
    }
  ];

  // const recentActivity = [
  //   {
  //     id: 1,
  //     action: "Property onboarded",
  //     property: "Maple Heights Development",
  //     user: "John Smith",
  //     time: "2 hours ago",
  //     status: "completed"
  //   },
  //   {
  //     id: 2,
  //     action: "Access token updated",
  //     property: "Riverside Apartments",
  //     user: "Sarah Johnson",
  //     time: "4 hours ago",
  //     status: "completed"
  //   },
  //   {
  //     id: 3,
  //     action: "Report generated",
  //     property: "Oak Grove Complex",
  //     user: "Mike Wilson",
  //     time: "6 hours ago",
  //     status: "completed"
  //   },
  //   {
  //     id: 4,
  //     action: "Property transfer initiated",
  //     property: "Pine Valley Homes",
  //     user: "Admin",
  //     time: "1 day ago",
  //     status: "pending"
  //   }
  // ];

  return (
    <div className="space-y-8">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your property management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-xs text-muted-foreground">
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Properties with Complete Data</span>
                <span>75%</span>
              </div>
              <Progress value={75} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Utility Information</span>
                <span>82%</span>
              </div>
              <Progress value={82} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Floor Plans Uploaded</span>
                <span>68%</span>
              </div>
              <Progress value={68} />
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {/* <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.property} • {activity.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                    {activity.status}
                  </Badge>
                </div> */}
              {/* ))}
            </div> */}
          {/* </CardContent> */}
        {/* </Card> } */}
      </div>
    </div>
  );
}