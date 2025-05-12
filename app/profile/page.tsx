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
import { Edit, Briefcase, MapPin, User, Clock, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-provider";

type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  past_projects:
    | {
        title: string;
        description: string;
        url: string;
      }[]
    | null;
  collaboration_needs: string[] | null;
  collaboration_terms: string[] | null;
  availability: string | null;
  location: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error: any) {
        console.error("Error fetching profile:", error.message);
        // If the profile doesn't exist, redirect to create one
        if (error.code === "PGRST116") {
          router.push("/profile/create");
        } else {
          toast({
            title: "Error",
            description: "Failed to load profile information",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, router, toast]);

  if (loading) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <h1 className="text-3xl font-bold">Profile Not Found</h1>
          <p className="text-muted-foreground">
            Let's create your profile to get started.
          </p>
          <Button asChild>
            <a href="/profile/create">Create Profile</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <Button asChild>
            <a href="/profile/edit">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </a>
          </Button>
        </div>

        <Card>
          <CardHeader className="relative pb-0">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-t-lg" />
            <div className="relative mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-primary/10 ring-4 ring-background flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Profile"}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {profile.full_name || "Unnamed User"}
                </CardTitle>
                {profile.location && (
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-3.5 w-3.5 mr-1" /> {profile.location}
                  </CardDescription>
                )}
                {profile.availability && (
                  <CardDescription className="flex items-center mt-1">
                    <Clock className="h-3.5 w-3.5 mr-1" /> Available for{" "}
                    {profile.availability}
                  </CardDescription>
                )}
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
              <h3 className="text-lg font-medium">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
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

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Looking For</h3>
              <div className="flex flex-wrap gap-2">
                {profile.collaboration_needs &&
                profile.collaboration_needs.length > 0 ? (
                  profile.collaboration_needs.map((need, index) => (
                    <Badge key={index}>{need}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No collaboration needs specified
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Collaboration Terms</h3>
              <div className="flex flex-wrap gap-2">
                {profile.collaboration_terms &&
                profile.collaboration_terms.length > 0 ? (
                  profile.collaboration_terms.map((term, index) => (
                    <Badge key={index} variant="outline">
                      {term}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No collaboration terms specified
                  </p>
                )}
              </div>
            </div>

            {profile.past_projects && profile.past_projects.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Past Projects</h3>
                  <div className="space-y-4">
                    {profile.past_projects.map((project, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{project.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {project.description}
                              </p>
                            </div>
                            {project.url && (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center text-sm"
                              >
                                <Link2 className="h-3.5 w-3.5 mr-1" /> View
                                Project
                              </a>
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
    </div>
  );
}
