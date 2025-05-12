"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Search,
  UserCog,
  Activity,
  Settings,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/components/auth-provider";

type Profile = {
  id: string;
  created_at: string;
  full_name: string | null;
  email?: string;
};

type StatsData = {
  totalUsers: number;
  activeUsers: number;
  totalConnections: number;
  totalMessages: number;
  weeklySignups: { day: string; count: number }[];
  skillDistribution: { name: string; value: number }[];
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalConnections: 0,
    totalMessages: 0,
    weeklySignups: [],
    skillDistribution: [],
  });

  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Check if user is admin (in a real app, this would be a proper role check)
  const isAdmin = user?.email === "admin@example.com"; // This is just a placeholder

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    if (!isAdmin) {
      router.push("/dashboard");
      toast({
        title: "Access denied",
        description: "You do not have permission to access the admin area",
        variant: "destructive",
      });
      return;
    }

    const fetchUsers = async () => {
      try {
        // In a real app, this would be a secured admin API endpoint
        // Here we're simulating direct DB access which would normally be restricted
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, created_at, full_name")
          .order("created_at", { ascending: false });

        if (usersError) throw usersError;

        // Get emails from auth.users (this is simplified and would normally be done server-side)
        const { data: authData, error: authError } =
          await supabase.auth.admin.listUsers();

        // This is a simulation - in reality this would require admin access through server functions
        // For demo purposes only
        const usersWithEmail =
          usersData?.map((profile) => {
            const authUser = authData?.users.find((u) => u.id === profile.id);
            return {
              ...profile,
              email: authUser?.email,
            };
          }) || [];

        setUsers(usersWithEmail);
        setFilteredUsers(usersWithEmail);

        // Generate some mock stats
        generateMockStats(usersWithEmail);
      } catch (error: any) {
        toast({
          title: "Error fetching users",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, router, toast, isAdmin]);

  // Generate mock statistics data
  const generateMockStats = (users: Profile[]) => {
    // Mock weekly signups
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklySignups = days.map((day) => ({
      day,
      count: Math.floor(Math.random() * 15) + 1,
    }));

    // Mock skill distribution
    const skills = [
      "Web Development",
      "Design",
      "Marketing",
      "Business",
      "Other",
    ];
    const skillDistribution = skills.map((name) => ({
      name,
      value: Math.floor(Math.random() * 50) + 10,
    }));

    setStats({
      totalUsers: users.length,
      activeUsers: Math.floor(users.length * 0.7),
      totalConnections: Math.floor(users.length * 1.5),
      totalMessages: Math.floor(users.length * 5),
      weeklySignups,
      skillDistribution,
    });
  };

  // Filter users when search query changes
  useEffect(() => {
    if (!users.length) return;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  if (!isAdmin) {
    return null; // Already redirected in useEffect
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users and monitor platform activity
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {Math.floor(Math.random() * 10) + 1}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {Math.floor((stats.activeUsers / stats.totalUsers) * 100)}% of
                total users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConnections}</div>
              <p className="text-xs text-muted-foreground">
                Avg {(stats.totalConnections / stats.totalUsers).toFixed(1)} per
                user
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                {Math.floor(Math.random() * 15) + 5}% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="moderation">
              Moderation
              <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                2
              </span>
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Export</Button>
                <Button>Add User</Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>
                  Manage platform users and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {user.full_name || "Unnamed User"}
                          </TableCell>
                          <TableCell>{user.email || "No email"}</TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Weekly Signups</CardTitle>
                  <CardDescription>
                    New user registrations over the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stats.weeklySignups}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Skills Distribution</CardTitle>
                  <CardDescription>
                    Most common skills on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.skillDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {stats.skillDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reported Content</CardTitle>
                  <Button size="sm" variant="destructive">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    View All Reports
                  </Button>
                </div>
                <CardDescription>
                  Review and moderate reported user content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reported User</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Message</TableCell>
                      <TableCell>John Smith</TableCell>
                      <TableCell>Inappropriate content</TableCell>
                      <TableCell>{format(new Date(), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Profile</TableCell>
                      <TableCell>Alice Johnson</TableCell>
                      <TableCell>Misleading information</TableCell>
                      <TableCell>{format(new Date(), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Platform Settings</CardTitle>
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>
                  Configure global platform settings and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-medium">User Registration</h3>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <p>Allow new registrations</p>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable new user sign-ups
                      </p>
                    </div>
                    <div>
                      <Button>Enabled</Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">Content Moderation</h3>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <p>Auto-moderation</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically filter inappropriate content
                      </p>
                    </div>
                    <div>
                      <Button variant="outline">Configure</Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">Email Notifications</h3>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <p>System emails</p>
                      <p className="text-sm text-muted-foreground">
                        Configure email templates and sending schedule
                      </p>
                    </div>
                    <div>
                      <Button variant="outline">Configure</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
