// ProfileOverviewCard.tsx
import { User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User as UserType } from "@/lib/types";

interface ProfileOverviewCardProps {
  profile: UserType | null;
  loading: boolean;
}

export function ProfileOverviewCard({
  profile,
  loading,
}: ProfileOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Overview</CardTitle>
        <CardDescription>Your public profile information</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
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
                  Complete your profile to increase your chances of finding
                  collaborators.
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
                      {skill}
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
  );
}
