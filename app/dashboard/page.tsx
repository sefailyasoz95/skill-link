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
import { Edit, MessageSquare, User, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-provider";
import { Connection, User as UserType } from "@/lib/types";

export default function DashboardPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<Connection[]>(
    []
  );
  const [loadingConnections, setLoadingConnections] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);

      // Fetch accepted connections where current user is user_a
      const { data: connectionsAsA, error: connectionsAsAError } =
        await supabase
          .from("connections")
          .select(
            `
        id,
        status,
        created_at,
        userB:user_b(
          id, 
          full_name, 
          username,
          profile_picture,
          skills(id, name)
        )
      `
          )
          .eq("user_a", profile?.id)
          .eq("status", "accepted");

      if (connectionsAsAError) throw connectionsAsAError;

      // Fetch accepted connections where current user is user_b
      const { data: connectionsAsB, error: connectionsAsBError } =
        await supabase
          .from("connections")
          .select(
            `
        id,
        status,
        created_at,
        userA:user_a(
          id, 
          full_name, 
          username,
          profile_picture,
          skills(id, name)
        )
      `
          )
          .eq("user_b", profile?.id)
          .eq("status", "accepted");

      if (connectionsAsBError) throw connectionsAsBError;

      // Fetch pending connection requests received (where current user is user_b)
      const { data: pendingReceivedData, error: pendingReceivedError } =
        await supabase
          .from("connections")
          .select(
            `
        id,
        status,
        created_at,
        userA:user_a(
          id, 
          full_name, 
          username,
          profile_picture,
          skills(id, name)
        )
      `
          )
          .eq("user_b", profile?.id)
          .eq("status", "pending");

      if (pendingReceivedError) throw pendingReceivedError;

      // Fetch pending connection requests sent (where current user is user_a)
      const { data: pendingSentData, error: pendingSentError } = await supabase
        .from("connections")
        .select(
          `
        id,
        status,
        created_at,
        userB:user_b(
          id, 
          full_name, 
          username,
          profile_picture,
          skills(id, name)
        )
      `
        )
        .eq("user_a", profile?.id)
        .eq("status", "pending");

      if (pendingSentError) throw pendingSentError;

      // Format accepted connections where the current user is user_a
      const formattedConnectionsAsA =
        connectionsAsA?.map((conn) => ({
          id: conn.id,
          status: conn.status,
          created_at: conn.created_at,
          connectedUser: conn.userB,
        })) || [];

      // Format accepted connections where the current user is user_b
      const formattedConnectionsAsB =
        connectionsAsB?.map((conn) => ({
          id: conn.id,
          status: conn.status,
          created_at: conn.created_at,
          connectedUser: conn.userA,
        })) || [];

      // Format pending connections received (where current user is user_b)
      const formattedPendingReceived =
        pendingReceivedData?.map((conn) => ({
          id: conn.id,
          status: conn.status,
          created_at: conn.created_at,
          requestingUser: conn.userA,
        })) || [];

      // Format pending connections sent (where current user is user_a)
      const formattedPendingSent =
        pendingSentData?.map((conn) => ({
          id: conn.id,
          status: conn.status,
          created_at: conn.created_at,
          requestedUser: conn.userB,
        })) || [];

      // Combine accepted connections
      const allConnections = [
        ...formattedConnectionsAsA,
        ...formattedConnectionsAsB,
      ];

      // Return or set state with the fetched data
      // setConnections(allConnections);
      // setPendingConnectionsReceived(formattedPendingReceived);
      // setPendingConnectionsSent(formattedPendingSent);
      setLoadingConnections(false);

      return {
        connections: allConnections,
        pendingReceived: formattedPendingReceived,
        pendingSent: formattedPendingSent,
      };
    } catch (error: any) {
      setLoadingConnections(false);

      return {
        connections: [],
        pendingReceived: [],
        pendingSent: [],
      };
    } finally {
      setLoadingConnections(false);
    }
  };
  useEffect(() => {
    if (authLoading) return;

    if (!profile) {
      router.push("/auth/signin");
      return;
    }

    fetchConnections();
  }, [profile, authLoading, router]);

  const handleConnectionResponse = async (
    connectionId: string,
    accept: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({
          status: accept ? "connected" : "rejected",
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
          setConnections([...connections, accepted]);
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

  if (authLoading) {
    return (
      <div className="container py-10 flex flex-col">
        {/* <div className="flex flex-row items-center">
          <div className="mx-auto max-w-5xl space-y-8">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="mx-auto max-w-5xl space-y-8">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div> */}
        <div className="border-b-2 border-b-foreground rounded-b-full animate-spin w-14 h-14" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button asChild>
            <Link href="/profile/edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>Your public profile information</CardDescription>
            </CardHeader>
            <CardContent>
              {authLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : profile ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {profile.profile_picture ? (
                        <img
                          src={profile.profile_picture}
                          alt={profile.full_name || "Profile"}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {profile.full_name || "Complete your profile"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.full_name
                          ? "Your profile is visible to others"
                          : "Your profile is incomplete"}
                      </p>
                    </div>
                  </div>

                  {!profile.full_name && (
                    <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                      <p className="text-sm">
                        Complete your profile to increase your chances of
                        finding collaborators.
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium">Skills</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                          >
                            {skill.name}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No skills added yet
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/profile">View Full Profile</Link>
                    </Button>
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to help you get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col items-start p-4"
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
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col items-start p-4"
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connections and Requests */}
        <div>
          <Tabs defaultValue="connections">
            <div className="flex items-center justify-between">
              <TabsList className="mb-4">
                <TabsTrigger value="connections">My Connections</TabsTrigger>
                <TabsTrigger value="requests">
                  Connection Requests
                  {pendingConnections.length > 0 && (
                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                      {pendingConnections.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <Button asChild variant="outline" size="sm">
                <Link href="/search">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Find More
                </Link>
              </Button>
            </div>

            <TabsContent value="connections">
              {loadingConnections ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[140px] w-full" />
                  ))}
                </div>
              ) : connections.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {connections.map((connection) => (
                    <Card key={connection.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {connection.userA?.profile_picture ? (
                              <img
                                src={connection.userA.profile_picture}
                                alt={connection.userA.full_name || "Profile"}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">
                              {connection.userA?.full_name || "Unnamed User"}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {connection.userA?.skills
                                ?.slice(0, 3)
                                .map((skill, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                                  >
                                    {skill.name}
                                  </span>
                                ))}
                              {connection.userA?.skills &&
                                connection.userA.skills.length > 3 && (
                                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                    +{connection.userA.skills.length - 3} more
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end space-x-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/profile/${connection.userA?.id}`}>
                              View Profile
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link href={`/messages/${connection.userA?.id}`}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <h3 className="font-medium">No connections yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start by searching for collaborators with the skills you
                    need
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/search">Find Collaborators</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              {loadingConnections ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-[140px] w-full" />
                  ))}
                </div>
              ) : pendingConnections.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingConnections.map((connection) => (
                    <Card key={connection.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {connection.userA?.profile_picture ? (
                              <img
                                src={connection.userA.profile_picture}
                                alt={connection.userA.full_name || "Profile"}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">
                              {connection.userA?.full_name || "Unnamed User"}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {connection.userA?.skills
                                ?.slice(0, 3)
                                .map((skill, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                                  >
                                    {skill.name}
                                  </span>
                                ))}
                              {connection.userA?.skills &&
                                connection.userA.skills.length > 3 && (
                                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                    +{connection.userA.skills.length - 3} more
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleConnectionResponse(connection.id, false)
                            }
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleConnectionResponse(connection.id, true)
                            }
                          >
                            Accept
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <h3 className="font-medium">No pending requests</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    When someone wants to connect with you, you'll see their
                    request here
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
