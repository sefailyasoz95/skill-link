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
import { supabase } from "@/lib/supabase-client";
import {
  Edit,
  Briefcase,
  MapPin,
  User,
  Clock,
  Link2,
  Calendar,
  Github,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-provider";
import { User as UserType, Skill, CollabNeed, Project } from "@/lib/types";

interface ExtendedUserProfile extends UserType {
  skills: Skill[];
  collab_needs: CollabNeed[];
  projects: Project[];
}

interface ProfileCardProps {
  userId?: string;
  showEditButton?: boolean;
}

export default function ProfileCard({
  userId,
  showEditButton = true,
}: ProfileCardProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Determine which user ID to use for fetching
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      router.push("/auth/signin");
      return;
    }

    const fetchProfile = async () => {
      console.log("Fetching profile data for user:", targetUserId);
      try {
        // Fetch user basic info
        console.log("Fetching basic user information...");
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", targetUserId)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          throw userError;
        }
        console.log("User data retrieved:", userData);

        // Fetch user skills
        console.log("Fetching user skills...");
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
          .eq("user_id", targetUserId);

        if (skillsError) {
          console.error("Error fetching user skills:", skillsError);
          throw skillsError;
        }
        console.log("User skills retrieved:", skillsData);

        // Fetch collaboration needs
        console.log("Fetching collaboration needs...");
        const { data: needsData, error: needsError } = await supabase
          .from("collab_needs")
          .select("*")
          .eq("user_id", targetUserId);

        if (needsError) {
          console.error("Error fetching collaboration needs:", needsError);
          throw needsError;
        }
        console.log("Collaboration needs retrieved:", needsData);

        // Fetch projects
        console.log("Fetching user projects...");
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", targetUserId);

        if (projectsError) {
          console.error("Error fetching projects:", projectsError);
          throw projectsError;
        }
        console.log("User projects retrieved:", projectsData);

        // Combine all data
        const skills = skillsData?.map((item) => item.skills) || [];
        const needs = needsData || [];
        const projects = projectsData || [];

        const fullProfile = {
          ...userData,
          skills: skills,
          collab_needs: needs,
          projects: projects,
        };

        console.log("Complete profile data:", fullProfile);
        setProfile(fullProfile as ExtendedUserProfile);
      } catch (error: any) {
        console.error("Error in fetchProfile:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, user, router, toast]);

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

  if (!profile) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Profile Not Found</h1>
        <p className="text-muted-foreground">
          {userId
            ? "This user profile could not be found."
            : "Please create your profile to get started."}
        </p>
        {!userId && (
          <Button asChild>
            <a href="/profile/create">Create Profile</a>
          </Button>
        )}
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

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {profileTitle}
        </h1>
        {showEditButton && isCurrentUser && (
          <Button asChild>
            <a href="/profile/edit">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </a>
          </Button>
        )}
      </div>

      <Card className="overflow-hidden border rounded-xl">
        <CardHeader className="relative pb-0">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-t-lg" />
          <div className="relative mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-primary/10 ring-4 ring-background flex items-center justify-center">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.full_name || "Profile"}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl md:text-2xl">
                {profile.full_name || "Unnamed User"}
              </CardTitle>
              <div className="flex flex-col md:flex-row md:items-center md:gap-3 mt-1">
                {profile.location && (
                  <CardDescription className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />{" "}
                    {profile.location}
                  </CardDescription>
                )}
                {profile.availability && (
                  <CardDescription className="flex items-center mt-1 md:mt-0">
                    <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    Available for {profile.availability}
                  </CardDescription>
                )}
                {profile.created_at && (
                  <CardDescription className="flex items-center mt-1 md:mt-0">
                    <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    Joined {formatDate(profile.created_at)}
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {profile.bio && (
            <div>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 text-sm"
                  >
                    {skill.name}
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
              {profile.collab_needs && profile.collab_needs.length > 0 ? (
                profile.collab_needs.map((need, index) => (
                  <Badge key={index} className="px-3 py-1 text-sm">
                    {need.conditions}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No collaboration needs specified
                </p>
              )}
            </div>
          </div>

          {profile.projects && profile.projects.length > 0 && (
            <>
              <Separator className="my-1" />
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Github className="h-4 w-4 mr-2 text-muted-foreground" />
                  Past Projects
                </h3>
                <div className="space-y-4">
                  {profile.projects.map((project, index) => (
                    <Card key={index} className="overflow-hidden border">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-base">
                              {project.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1 md:pr-4">
                              {project.description}
                            </p>
                            {project.created_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Added on {formatDate(project.created_at)}
                              </p>
                            )}
                          </div>
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
