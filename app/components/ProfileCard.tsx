"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Briefcase,
  MapPin,
  User,
  Clock,
  Link2,
  Calendar,
  Github,
  UserPlus,
  UserMinus,
  UserCheck,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User as UserType, Project } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-server";
import Image from "next/image";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ExtendedUserProfile extends UserType {
  projects: Project[];
}

// Define the connection state between the current user and the profile
type ConnectionState = {
  status: "not_connected" | "pending" | "connected";
  connectionId?: string;
  isRequestSent?: boolean; // True if current user sent the request
};

interface ProfileCardProps {
  userId?: string;
  showEditButton?: boolean;
}

export default function ProfileCard({
  userId,
  showEditButton = true,
}: ProfileCardProps) {
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: "not_connected",
  });
  const [isLoadingConnection, setIsLoadingConnection] = useState(false);

  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Record that the current user viewed this profile
  const recordProfileView = async (viewerId: string, viewedUserId: string) => {
    try {
      // Check if we've already recorded this view recently (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: existingViews, error: checkError } = await supabase
        .from("profile_views")
        .select("*")
        .eq("viewer_id", viewerId)
        .eq("viewed_user_id", viewedUserId)
        .gte("viewed_at", twentyFourHoursAgo.toISOString())
        .limit(1);

      if (checkError) {
        return; // Silently fail for view recording
      }

      // Only record a new view if no recent views exist
      if (!existingViews || existingViews.length === 0) {
        const { error: insertError } = await supabase
          .from("profile_views")
          .insert({
            viewer_id: viewerId,
            viewed_user_id: viewedUserId,
            viewed_at: new Date().toISOString(),
          });

        if (insertError) {
        }
      }
    } catch (error) {
      // Silently fail - we don't want to interrupt the user experience for view tracking
    }
  };

  useEffect(() => {
    // Determine which user ID to use for fetching

    const targetUserId = userId || user?.id;

    if (!targetUserId && !loading) {
      router.push("/auth/signin");
      return;
    }

    // Record profile view if viewing someone else's profile
    if (user?.id && userId && user.id !== userId) {
      recordProfileView(user.id, userId);
    }

    const fetchProfile = async () => {
      try {
        // Fetch user basic info
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", targetUserId)
          .single();

        if (userError) {
          throw userError;
        }

        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", targetUserId);

        if (projectsError) {
          throw projectsError;
        }

        const projects = projectsData || [];

        const fullProfile = {
          ...userData,
          projects: projects,
        };

        setProfile(fullProfile as ExtendedUserProfile);

        // Check connection status if viewing someone else's profile
        if (user?.id && userId && user.id !== userId) {
          await checkConnectionStatus(user.id, userId);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load profile data",
          variant: "destructive",
        });
      }
    };

    if (!loading) fetchProfile();
  }, [userId, user, router, toast]);

  const checkConnectionStatus = async (
    currentUserId: string,
    targetUserId: string
  ) => {
    try {
      // Check for existing connection in either direction
      const { data: connectionData, error } = await supabase
        .from("connections")
        .select("*")
        .or(
          `and(user_a.eq.${currentUserId},user_b.eq.${targetUserId}),and(user_a.eq.${targetUserId},user_b.eq.${currentUserId})`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (connectionData && connectionData.length > 0) {
        const connection = connectionData[0];

        if (connection.status === "accepted") {
          setConnectionState({
            status: "connected",
            connectionId: connection.id,
          });
        } else if (connection.status === "pending") {
          setConnectionState({
            status: "pending",
            connectionId: connection.id,
            isRequestSent: connection.user_a === currentUserId,
          });
        } else {
          setConnectionState({ status: "not_connected" });
        }
      } else {
        setConnectionState({ status: "not_connected" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to check connection status",
        variant: "destructive",
      });
    }
  };

  const sendConnectionRequest = async () => {
    if (!user?.id || !userId) return;

    setIsLoadingConnection(true);
    try {
      // Create new connection
      const { data, error } = await supabase
        .from("connections")
        .insert({
          user_a: user.id,
          user_b: userId,
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setConnectionState({
        status: "pending",
        connectionId: data.id,
        isRequestSent: true,
      });

      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConnection(false);
    }
  };

  const removeConnection = async () => {
    if (!connectionState.connectionId) return;

    setIsLoadingConnection(true);
    try {
      // Delete or update connection based on your DB structure
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("id", connectionState.connectionId);

      if (error) throw error;

      setConnectionState({ status: "not_connected" });

      toast({
        title: "Connection Removed",
        description: "The connection has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove connection",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConnection(false);
    }
  };

  const acceptConnectionRequest = async () => {
    if (!connectionState.connectionId) return;

    setIsLoadingConnection(true);
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionState.connectionId);

      if (error) throw error;

      setConnectionState({
        status: "connected",
        connectionId: connectionState.connectionId,
      });

      toast({
        title: "Connection Accepted",
        description: "You are now connected with this user.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept connection request",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[200px] md:w-[300px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[250px] w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[150px] w-full rounded-lg" />
          <Skeleton className="h-[150px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Profile Not Found</h1>
        <p className="text-muted-foreground">
          {userId
            ? "This user profile could not be found."
            : "Please create your profile to get started."}
        </p>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isCurrentUser = !userId || userId === user?.id;
  const profileTitle = isCurrentUser ? "My Profile" : "User Profile";

  // Connection button rendering helper
  const renderConnectionButton = () => {
    if (isCurrentUser) return null;

    if (isLoadingConnection) {
      return (
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading
        </Button>
      );
    }

    switch (connectionState.status) {
      case "not_connected":
        return (
          <Button onClick={sendConnectionRequest}>
            <UserPlus className="mr-2 h-4 w-4" />
            Connect
          </Button>
        );
      case "pending":
        if (connectionState.isRequestSent) {
          return (
            <Button variant="outline" disabled>
              <Clock className="mr-2 h-4 w-4" />
              Request Pending
            </Button>
          );
        } else {
          return (
            <div className="flex gap-2">
              <Button onClick={acceptConnectionRequest} variant="outline">
                <UserCheck className="mr-2 h-4 w-4" />
                Accept
              </Button>
              <Button onClick={removeConnection} variant="outline">
                Decline
              </Button>
            </div>
          );
        }
      case "connected":
        return (
          <Button variant="outline" onClick={removeConnection}>
            <UserMinus className="mr-2 h-4 w-4" />
            Remove Connection
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {profileTitle}
        </h1>
        <div className="flex gap-3">
          {showEditButton && isCurrentUser && (
            <Button asChild>
              <a href="/profile/edit">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </a>
            </Button>
          )}
          {renderConnectionButton()}
        </div>
      </div>

      <Card className="overflow-hidden border rounded-xl">
        <CardHeader className="relative pb-0">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-t-lg" />
          <div className="relative mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-primary/10 ring-4 ring-background flex items-center justify-center">
              {profile?.profile_picture ? (
                <Image
                  src={profile?.profile_picture}
                  alt={profile?.full_name || "Profile"}
                  className="h-full w-full rounded-full object-cover"
                  width={48}
                  height={48}
                />
              ) : (
                <User className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl md:text-2xl">
                {profile?.full_name || "Unnamed User"}
              </CardTitle>
              <div className="flex flex-col md:flex-row md:items-center md:gap-3 mt-1">
                {profile?.location && (
                  <CardDescription className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />{" "}
                    {profile?.location}
                  </CardDescription>
                )}
                {profile?.availability && (
                  <CardDescription className="flex items-center mt-1 md:mt-0">
                    <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    Available for {profile?.availability}
                  </CardDescription>
                )}
                {profile?.created_at && (
                  <CardDescription className="flex items-center mt-1 md:mt-0">
                    <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    Joined {formatDate(profile?.created_at)}
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {profile?.bio && (
            <div>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {profile?.bio}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile?.skills && profile?.skills.length > 0 ? (
                profile?.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 text-sm"
                  >
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No skills specified
                </p>
              )}
            </div>
          </div>

          <Separator className="my-1" />

          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              Looking For
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile?.looking_for && profile?.looking_for.length > 0 ? (
                profile?.looking_for.map((looking, index) => (
                  <Badge key={index} className="px-3 py-1 text-sm">
                    {looking}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No collaboration needs specified
                </p>
              )}
            </div>
          </div>
          <Separator className="my-1" />

          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              Conditions
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile?.conditions && profile?.conditions.length > 0 ? (
                profile?.conditions.map((condition, index) => (
                  <Badge key={index} className="px-3 py-1 text-sm">
                    {condition}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No conditions specified
                </p>
              )}
            </div>
          </div>

          {profile?.projects && profile?.projects.length > 0 && (
            <>
              <Separator className="my-1" />
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Github className="h-4 w-4 mr-2 text-muted-foreground" />
                  Projects
                </h3>
                <div className="space-y-4">
                  {profile?.projects.map((project, index) => {
                    const isOwner = user?.id === project.user_id;
                    return (
                      <Card key={index} className="overflow-hidden border">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-base">
                                  {project.title}
                                </h4>
                                {project.is_accepting_applications &&
                                  isOwner && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-green-700 border-green-400 bg-green-50"
                                    >
                                      Accepting Applications
                                    </Badge>
                                  )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 md:pr-4">
                                {project.description}
                              </p>
                              {project.created_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Added on {formatDate(project.created_at)}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              {project.url && (
                                <div className="mt-2 md:mt-0">
                                  <a
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center text-sm"
                                  >
                                    <Link2 className="h-3.5 w-3.5 mr-1" /> View
                                    Project
                                  </a>
                                </div>
                              )}
                              {!isOwner && (
                                <ApplyDialogButton
                                  project={project}
                                  user={user}
                                  toast={toast}
                                />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApplyDialogButton({
  project,
  user,
  toast,
}: {
  project: Project;
  user: UserType | null | undefined;
  toast: (args: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("applications").insert({
        applicant_id: user.id,
        project_id: project.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "pending",
        description,
      });
      if (error) throw error;
      toast({
        title: "Application Sent",
        description: "Your application has been submitted.",
      });
      setOpen(false);
      setDescription("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge
          variant="outline"
          className="text-xs text-green-700 border-green-400 bg-green-50 cursor-pointer hover:bg-green-100"
          onClick={() => setOpen(true)}
        >
          Apply Now
        </Badge>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to {project.title}</DialogTitle>
          <DialogDescription>
            Are you sure you want to apply to this project? Please tell the
            owner why you want to join.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why do you want to join this project?"
          minLength={10}
          maxLength={500}
          disabled={loading}
        />
        <DialogFooter>
          <Button
            onClick={handleApply}
            disabled={loading || description.length < 10}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
