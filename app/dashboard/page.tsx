"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit,
  MessageSquare,
  User as UserIcon,
  UserPlus,
  Eye,
  Clock,
  Activity,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-provider";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import type {
  User,
  Skill,
  CollabNeed,
  ProfileView,
  Connection,
  ConnectionStatus,
} from "@/lib/types";

// Custom type for using Connection with different field names and extended user objects
type ConnectionWithUser = {
  id: string;
  status: ConnectionStatus;
  created_at: string;
  user_a: string; // Connection.user_a (instead of userA)
  user_b: string; // Connection.user_b (instead of userB)
  connected_user?: User; // Extended to include full User object
  requesting_user?: User; // For pending connections
};

export default function DashboardPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithUser[]>([]);
  const [pendingConnections, setPendingConnections] = useState<
    ConnectionWithUser[]
  >([]);
  const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [collabNeeds, setCollabNeeds] = useState<CollabNeed[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const { toast } = useToast();
  const router = useRouter();

  const fetchUserDashboardData = async () => {
    try {
      if (!profile?.id) return;

      setLoadingData(true);

      // 1. Fetch user skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("user_skills")
        .select(
          `
          skill_id,
          skills (
            id,
            name
          )
        `
        )
        .eq("user_id", profile.id);

      if (skillsError) throw skillsError;

      // 2. Fetch collaboration needs
      const { data: needsData, error: needsError } = await supabase
        .from("collab_needs")
        .select("*")
        .eq("user_id", profile.id);

      if (needsError) throw needsError;

      // 3. Fetch profile views (who viewed current user's profile)
      const { data: viewsData, error: viewsError } = await supabase
        .from("profile_views")
        .select(
          `
          id,
          viewer_id,
          viewed_user_id,
          viewed_at,
          viewer:viewer_id (
            id,
            full_name,
            profile_picture,
            location
          )
        `
        )
        .eq("viewed_user_id", profile.id)
        .order("viewed_at", { ascending: false })
        .limit(5);

      if (viewsError) throw viewsError;

      // 4. Fetch connections
      // First, fetch connections where user is user_a
      const { data: connectionsAsA, error: errorAsA } = await supabase
        .from("connections")
        .select(
          `
          id,
          status,
          created_at,
          user_a,
          user_b,
          connected_user:user_b (
            id,
            full_name,
            profile_picture,
            location
          )
        `
        )
        .eq("user_a", profile.id)
        .eq("status", "accepted");

      if (errorAsA) throw errorAsA;

      // Next, fetch connections where user is user_b
      const { data: connectionsAsB, error: errorAsB } = await supabase
        .from("connections")
        .select(
          `
          id,
          status,
          created_at,
          user_a,
          user_b,
          connected_user:user_a (
            id,
            full_name,
            profile_picture,
            location
          )
        `
        )
        .eq("user_b", profile.id)
        .eq("status", "accepted");

      if (errorAsB) throw errorAsB;

      // 5. Fetch pending connections (connection requests)
      const { data: pendingRequests, error: pendingError } = await supabase
        .from("connections")
        .select(
          `
          id,
          status,
          created_at,
          user_a,
          user_b,
          requesting_user:user_a (
            id,
            full_name,
            profile_picture,
            location
          )
        `
        )
        .eq("user_b", profile.id)
        .eq("status", "pending");

      if (pendingError) throw pendingError;

      // Process and set the data
      // Fix the skills data structure - flatten the nested arrays
      const processedSkills: Skill[] = skillsData
        ? (skillsData as any[]).reduce((acc: Skill[], item: any) => {
            if (item?.skills) {
              // Handle both single object and array cases
              if (Array.isArray(item.skills)) {
                // If it's an array, take the first item if it has id and name
                if (
                  item.skills.length > 0 &&
                  typeof item.skills[0] === "object"
                ) {
                  const skill = item.skills[0];
                  if ("id" in skill && "name" in skill) {
                    // Create a proper Skill object conforming to the type
                    acc.push({
                      id: skill.id,
                      name: skill.name,
                      users: [], // Initialize with empty array to match Skill type
                    });
                  }
                }
              } else if (typeof item.skills === "object") {
                // It's a single object
                const skill = item.skills;
                if ("id" in skill && "name" in skill) {
                  // Create a proper Skill object conforming to the type
                  acc.push({
                    id: skill.id,
                    name: skill.name,
                    users: [], // Initialize with empty array to match Skill type
                  });
                }
              }
            }
            return acc;
          }, [])
        : [];

      // Fix the connections data typing
      const processedConnections: ConnectionWithUser[] = [
        ...(connectionsAsA
          ? connectionsAsA.map((conn: any) => {
              const userObject =
                conn.connected_user && !Array.isArray(conn.connected_user)
                  ? conn.connected_user
                  : Array.isArray(conn.connected_user) &&
                    conn.connected_user.length > 0
                  ? conn.connected_user[0]
                  : null;

              return {
                id: conn.id,
                status: conn.status as ConnectionStatus,
                created_at: conn.created_at,
                user_a: conn.user_a,
                user_b: conn.user_b,
                connected_user: userObject
                  ? {
                      id: userObject.id,
                      full_name: userObject.full_name,
                      profile_picture: userObject.profile_picture,
                      location: userObject.location,
                      username: userObject.username || null,
                      bio: userObject.bio || null,
                      availability: userObject.availability || null,
                      created_at: userObject.created_at || conn.created_at,
                    }
                  : undefined,
              };
            })
          : []),
        ...(connectionsAsB
          ? connectionsAsB.map((conn: any) => {
              const userObject =
                conn.connected_user && !Array.isArray(conn.connected_user)
                  ? conn.connected_user
                  : Array.isArray(conn.connected_user) &&
                    conn.connected_user.length > 0
                  ? conn.connected_user[0]
                  : null;

              return {
                id: conn.id,
                status: conn.status as ConnectionStatus,
                created_at: conn.created_at,
                user_a: conn.user_a,
                user_b: conn.user_b,
                connected_user: userObject
                  ? {
                      id: userObject.id,
                      full_name: userObject.full_name,
                      profile_picture: userObject.profile_picture,
                      location: userObject.location,
                      username: userObject.username || null,
                      bio: userObject.bio || null,
                      availability: userObject.availability || null,
                      created_at: userObject.created_at || conn.created_at,
                    }
                  : undefined,
              };
            })
          : []),
      ];

      // Fix the profile views data typing
      const formattedViews: ProfileView[] = viewsData
        ? viewsData.map((view: any) => {
            const viewerObject =
              view.viewer && !Array.isArray(view.viewer)
                ? view.viewer
                : Array.isArray(view.viewer) && view.viewer.length > 0
                ? view.viewer[0]
                : null;

            return {
              id: view.id,
              viewer_id: view.viewer_id,
              viewed_user_id: view.viewed_user_id,
              viewed_at: view.viewed_at,
              viewer: viewerObject
                ? {
                    id: viewerObject.id,
                    full_name: viewerObject.full_name,
                    profile_picture: viewerObject.profile_picture,
                    location: viewerObject.location,
                    username: viewerObject.username || null,
                    bio: viewerObject.bio || null,
                    availability: viewerObject.availability || null,
                    created_at: viewerObject.created_at || view.viewed_at,
                  }
                : undefined,
            };
          })
        : [];

      // Fix the pending connections data typing
      const formattedPendingConnections: ConnectionWithUser[] = pendingRequests
        ? pendingRequests.map((conn: any) => {
            const userObject =
              conn.requesting_user && !Array.isArray(conn.requesting_user)
                ? conn.requesting_user
                : Array.isArray(conn.requesting_user) &&
                  conn.requesting_user.length > 0
                ? conn.requesting_user[0]
                : null;

            return {
              id: conn.id,
              status: conn.status as ConnectionStatus,
              created_at: conn.created_at,
              user_a: conn.user_a,
              user_b: conn.user_b,
              requesting_user: userObject
                ? {
                    id: userObject.id,
                    full_name: userObject.full_name,
                    profile_picture: userObject.profile_picture,
                    location: userObject.location,
                    username: userObject.username || null,
                    bio: userObject.bio || null,
                    availability: userObject.availability || null,
                    created_at: userObject.created_at || conn.created_at,
                  }
                : undefined,
            };
          })
        : [];

      const formattedNeeds: CollabNeed[] = needsData
        ? needsData.map((need: any) => ({
            id: need.id,
            user_id: need.user_id,
            looking_for: need.looking_for || "",
            description: need.description || "",
            conditions: need.conditions,
            created_at: need.created_at,
          }))
        : [];

      setUserSkills(processedSkills);
      setCollabNeeds(formattedNeeds);
      setProfileViews(formattedViews);
      setConnections(processedConnections);
      setPendingConnections(formattedPendingConnections);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error loading dashboard",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!profile) {
      router.push("/auth/signin");
      return;
    }

    fetchUserDashboardData();
  }, [profile, authLoading, router]);

  const handleConnectionResponse = async (
    connectionId: string,
    accept: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({
          status: accept ? "accepted" : "rejected",
        })
        .eq("id", connectionId);

      if (error) throw error;

      toast({
        title: accept ? "Connection accepted" : "Connection declined",
        description: accept
          ? "You can now message this connection"
          : "The connection request has been declined",
      });

      // Update the UI
      if (accept) {
        const accepted = pendingConnections.find((c) => c.id === connectionId);
        if (accepted) {
          // Format the accepted connection to match our connections format
          const newConnection: ConnectionWithUser = {
            id: accepted.id,
            status: "accepted",
            created_at: accepted.created_at,
            user_a: accepted.user_a,
            user_b: accepted.user_b,
            connected_user: accepted.requesting_user,
          };
          setConnections([...connections, newConnection]);
        }
      }

      setPendingConnections(
        pendingConnections.filter((c) => c.id !== connectionId)
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const slideUp = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardHover = {
    rest: { scale: 1 },
    hover: {
      scale: 1.02,
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.2 },
    },
  };

  if (authLoading) {
    return (
      <div className="container py-10 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="border-b-2 border-b-foreground rounded-b-full animate-spin w-14 h-14" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="container py-8 px-4 md:py-10 md:px-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={slideUp}
        >
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild>
              <Link href="/profile/edit">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-2"
          variants={staggerContainer}
        >
          {/* Profile Overview */}
          <motion.div variants={slideUp}>
            <motion.div
              initial="rest"
              whileHover="hover"
              animate="rest"
              variants={cardHover}
            >
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>Profile Overview</CardTitle>
                  <CardDescription>
                    Your public profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : profile ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {profile.profile_picture ? (
                            <img
                              src={profile.profile_picture}
                              alt={profile.full_name || "Profile"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {profile.full_name || "Complete your profile"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {profile.location ||
                              "Add your location to get better matches"}
                          </p>
                        </div>
                      </div>

                      {(!profile.full_name ||
                        userSkills.length === 0 ||
                        collabNeeds.length === 0) && (
                        <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                          <p className="text-sm">
                            Complete your profile to increase your chances of
                            finding collaborators.
                          </p>
                        </div>
                      )}

                      <div>
                        <h3 className="font-medium mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {userSkills && userSkills.length > 0 ? (
                            userSkills.map((skill, index) => (
                              <motion.span
                                key={index}
                                className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.1 }}
                              >
                                {skill.name}
                              </motion.span>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No skills added yet
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Looking For</h3>
                        <div className="flex flex-wrap gap-2">
                          {collabNeeds && collabNeeds.length > 0 ? (
                            collabNeeds.map((need) =>
                              need.conditions.map((con, index) => (
                                <motion.span
                                  key={index}
                                  className="inline-flex items-center rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-medium"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.2 + index * 0.1 }}
                                  whileHover={{ scale: 1.1 }}
                                >
                                  {con}
                                </motion.span>
                              ))
                            )
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No collaboration needs specified
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button asChild variant="outline" size="sm">
                            <Link href="/profile">
                              View Full Profile
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        Let's create your profile to get started.
                      </p>
                      <Button asChild className="mt-4">
                        <Link href="/profile/create">Create Profile</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Activity & Stats */}
          <motion.div variants={slideUp}>
            <motion.div
              initial="rest"
              whileHover="hover"
              animate="rest"
              variants={cardHover}
            >
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>Activity Overview</CardTitle>
                  <CardDescription>
                    Recent profile views and activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingData ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div
                          className="flex flex-col space-y-1 rounded-lg border p-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="flex items-center text-muted-foreground">
                            <Eye className="mr-1 h-4 w-4" />
                            <span className="text-xs">Profile Views</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {profileViews.length}
                          </p>
                        </motion.div>
                        <motion.div
                          className="flex flex-col space-y-1 rounded-lg border p-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex items-center text-muted-foreground">
                            <Activity className="mr-1 h-4 w-4" />
                            <span className="text-xs">Connections</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {connections.length}
                          </p>
                        </motion.div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                          <TrendingUp className="mr-1 h-4 w-4 text-muted-foreground" />
                          Recent Profile Visitors
                        </h3>
                        {profileViews.length > 0 ? (
                          <motion.div
                            className="space-y-3"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                          >
                            {profileViews.slice(0, 3).map((view, index) => (
                              <motion.div
                                key={view.id}
                                className="flex items-center justify-between"
                                variants={slideUp}
                                custom={index}
                                transition={{ delay: index * 0.1 }}
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                    {view.viewer?.profile_picture ? (
                                      <img
                                        src={view.viewer.profile_picture}
                                        alt={view.viewer.full_name || "Profile"}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <UserIcon className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {view.viewer?.full_name ||
                                        "Anonymous User"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {view.viewed_at
                                        ? formatDistanceToNow(
                                            new Date(view.viewed_at),
                                            { addSuffix: true }
                                          )
                                        : ""}
                                    </p>
                                  </div>
                                </div>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button asChild variant="ghost" size="sm">
                                    <Link href={`/profile/${view.viewer?.id}`}>
                                      View
                                    </Link>
                                  </Button>
                                </motion.div>
                              </motion.div>
                            ))}
                          </motion.div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No profile views yet
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={slideUp}>
          <motion.div
            initial="rest"
            whileHover="hover"
            animate="rest"
            variants={cardHover}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks to help you get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="h-auto flex-col items-start p-4 hover:bg-muted/50 transition-colors w-full"
                    >
                      <Link href="/search">
                        <div className="flex flex-col items-start gap-1">
                          <UserPlus className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">
                            Find Collaborators
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Search for skills you need
                          </span>
                        </div>
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="h-auto flex-col items-start p-4 hover:bg-muted/50 transition-colors w-full"
                    >
                      <Link href="/messages">
                        <div className="flex flex-col items-start gap-1">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Messages</span>
                          <span className="text-xs text-muted-foreground">
                            Chat with connections
                          </span>
                        </div>
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="h-auto flex-col items-start p-4 hover:bg-muted/50 transition-colors w-full"
                    >
                      <Link href="/profile/edit">
                        <div className="flex flex-col items-start gap-1">
                          <Edit className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">
                            Edit Profile
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Update your information
                          </span>
                        </div>
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="h-auto flex-col items-start p-4 hover:bg-muted/50 transition-colors w-full"
                    >
                      <Link href="/how-it-works">
                        <div className="flex flex-col items-start gap-1">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">
                            How It Works
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Learn about SkillLink
                          </span>
                        </div>
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Connections and Requests */}
        <motion.div variants={slideUp}>
          <Tabs defaultValue="connections" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="mb-4">
                <TabsTrigger value="connections">My Connections</TabsTrigger>
                <TabsTrigger value="requests">
                  Connection Requests
                  {pendingConnections.length > 0 && (
                    <motion.span
                      className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      {pendingConnections.length}
                    </motion.span>
                  )}
                </TabsTrigger>
              </TabsList>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild variant="outline" size="sm">
                  <Link href="/search">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Find More
                  </Link>
                </Button>
              </motion.div>
            </div>

            <TabsContent value="connections">
              {loadingData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[140px] w-full" />
                  ))}
                </div>
              ) : connections.length > 0 ? (
                <motion.div
                  className="grid gap-4 md:grid-cols-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {connections.map((connection, index) => (
                    <motion.div
                      key={connection.id}
                      variants={slideUp}
                      custom={index}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <Card className="overflow-hidden transition-all hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {connection.connected_user?.profile_picture ? (
                                <img
                                  src={
                                    connection.connected_user.profile_picture
                                  }
                                  alt={
                                    connection.connected_user.full_name ||
                                    "Profile"
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <UserIcon className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">
                                {connection.connected_user?.full_name ||
                                  "Unnamed User"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {connection.connected_user?.location ||
                                  "No location specified"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-end space-x-2">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href={`/profile/${connection.connected_user?.id}`}
                                >
                                  View Profile
                                </Link>
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button asChild size="sm">
                                <Link
                                  href={`/messages/${connection.connected_user?.id}`}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Message
                                </Link>
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-lg border border-dashed p-8 text-center"
                >
                  <h3 className="font-medium">No connections yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start by searching for collaborators with the skills you
                    need
                  </p>
                  <motion.div
                    className="mt-4 inline-block"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button asChild>
                      <Link href="/search">Find Collaborators</Link>
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              {loadingData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-[140px] w-full" />
                  ))}
                </div>
              ) : pendingConnections.length > 0 ? (
                <motion.div
                  className="grid gap-4 md:grid-cols-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {pendingConnections.map((connection, index) => (
                    <motion.div
                      key={connection.id}
                      variants={slideUp}
                      custom={index}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <Card className="overflow-hidden transition-all hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {connection.requesting_user?.profile_picture ? (
                                <img
                                  src={
                                    connection.requesting_user.profile_picture
                                  }
                                  alt={
                                    connection.requesting_user.full_name ||
                                    "Profile"
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <UserIcon className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">
                                {connection.requesting_user?.full_name ||
                                  "Unnamed User"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {connection.requesting_user?.location ||
                                  "No location specified"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-end space-x-2">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleConnectionResponse(connection.id, false)
                                }
                                className="hover:bg-destructive/10 transition-colors"
                              >
                                Decline
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleConnectionResponse(connection.id, true)
                                }
                                className="hover:bg-primary/90 transition-colors"
                              >
                                Accept
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-lg border border-dashed p-8 text-center"
                >
                  <h3 className="font-medium">No pending requests</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    When someone wants to connect with you, you'll see their
                    request here
                  </p>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
}
