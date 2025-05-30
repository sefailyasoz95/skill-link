"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, X, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { skillOptions, collaborationTermOptions } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Project } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-server";

const profileFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  profile_picture: z.string().nullable(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").nullable(),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  looking_for: z.array(z.string()),
  conditions: z.array(z.string()),
  availability: z.string().nullable(),
  location: z.string().nullable(),
  past_projects: z
    .array(
      z.object({
        title: z.string().min(1, "Project title is required"),
        description: z.string().nullable(),
        is_accepting_applications: z.boolean().default(false),
        url: z
          .string()
          .url("Must be a valid URL")
          .or(z.string().length(0))
          .nullable()
          .transform((val) => (val === "" ? null : val)),
      })
    )
    .nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Skills and needs options

export default function EditProfilePage() {
  const [submitting, setSubmitting] = useState(false);
  const [pastProjects, setPastProjects] = useState<Partial<Project>[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [customSkills, setCustomSkills] = useState<string[]>([]);

  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
      profile_picture: null,
      bio: "",
      skills: [],
      conditions: [],
      looking_for: [],
      availability: null,
      location: "",
      past_projects: [],
    },
  });

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0 && user) {
      const file = acceptedFiles[0];

      // Simple validation
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Avatar image must be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.includes("image")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      setUploadingAvatar(true);

      try {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        // Upload the file to supabase storage
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        const url = data.publicUrl;
        setAvatarUrl(url);
        form.setValue("profile_picture", url);

        toast({
          title: "Avatar uploaded",
          description: "Your profile picture has been updated",
        });
      } catch (error: any) {
        toast({
          title: "Error uploading avatar",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
  });

  useEffect(() => {
    // if (!user) {
    // 	router.push("/auth/signin");
    // 	return;
    // }

    const fetchProfile = async () => {
      try {
        // Fetch user basic info
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user?.id)
          .single();

        if (userError) {
          throw userError;
        }
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user?.id);

        if (projectsError) {
          throw projectsError;
        }

        const projects = projectsData || [];

        const formValues = {
          full_name: userData.full_name || "",
          profile_picture: userData.profile_picture,
          bio: userData.bio || "",
          skills: userData.skills,
          availability: userData.availability || null,
          location: userData.location || "",
          past_projects: projects,
          looking_for: userData.looking_for,
          conditions: userData.conditions,
        };

        form.reset(formValues);

        setAvatarUrl(userData.profile_picture);
        setPastProjects(projects);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load profile data",
          variant: "destructive",
        });
      }
    };

    if (!loading) {
      fetchProfile();
    }
  }, [user, router, toast, form, loading]);

  const addPastProject = () => {
    setPastProjects([...pastProjects, { title: "", description: "", url: "" }]);
  };

  const removePastProject = (index: number) => {
    const updated = [...pastProjects];
    updated.splice(index, 1);
    setPastProjects(updated);
  };

  const updatePastProject = (
    index: number,
    field: keyof (typeof pastProjects)[0],
    value: string | boolean
  ) => {
    const updated = [...pastProjects];
    updated[index] = { ...updated[index], [field]: value };
    setPastProjects(updated);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      return;
    }

    setSubmitting(true);

    try {
      // 1. Update the basic user information
      const { data: userData, error: userError } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          full_name: values.full_name,
          profile_picture: values.profile_picture,
          bio: values.bio || null,
          location: values.location || null,
          availability: values.availability,
          updated_at: new Date().toISOString(),
          skills: values.skills,
          looking_for: values.looking_for,
          conditions: values.conditions,
        })
        .select();

      if (userError) {
        throw userError;
      }

      // Insert new projects
      const validProjects = pastProjects.filter(
        (project) => project.id === undefined
      );
      if (validProjects.length > 0) {
        for (const project of validProjects) {
          const { error: addProjectError } = await supabase
            .from("projects")
            .insert({
              user_id: user.id,
              title: project.title,
              description: project.description,
              url: project.url,
              created_at: new Date().toISOString(),
              is_accepting_applications: project.is_accepting_applications,
            });

          if (addProjectError) {
            throw addProjectError;
          }
        }
      }
      // update existing projects
      const existingProjects = pastProjects.filter((pro) => Boolean(pro.id));
      if (existingProjects.length > 0) {
        for (const project of existingProjects) {
          const { error: updateProject } = await supabase
            .from("projects")
            .update({
              user_id: user.id,
              title: project.title,
              description: project.description,
              url: project.url,
              created_at: new Date().toISOString(),
              is_accepting_applications: project.is_accepting_applications,
            })
            .eq("id", project.id);

          if (updateProject) {
            throw updateProject;
          }
        }
      }
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });

      router.push("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                <Skeleton className="h-8 w-48" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-5 w-96" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </div>
              </div>

              {/* Skills & Expertise Section */}
              <div className="space-y-6 pt-4">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Collaboration Preferences Section */}
              <div className="space-y-6 pt-4">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>

              {/* Projects Section */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-9 w-32" />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-x-2 sm:space-y-0">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Edit Your Profile</CardTitle>
                <CardDescription>
                  Make your profile stand out to find the perfect collaborator
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Basic Information</h3>

                  <FormField
                    control={form.control}
                    name="profile_picture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Picture</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-4">
                            <div className="relative h-24 w-24">
                              <div
                                {...getRootProps()}
                                className={`relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed ${
                                  isDragActive
                                    ? "border-primary bg-primary/10"
                                    : "border-input hover:bg-muted/25"
                                }`}
                              >
                                <input {...getInputProps()} />

                                {uploadingAvatar && (
                                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/10">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                  </div>
                                )}

                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                                    <PlusCircle className="mb-1 h-5 w-5" />
                                    Upload
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Drop an image here or click to upload a profile
                              picture.
                              <br />
                              (2MB max size, JPEG, PNG, or GIF)
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="City, Country"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Your location helps others find local collaborators
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell others about yourself, your background, and what you're working on"
                            className="min-h-32 resize-y"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch("bio")?.length || 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Skills & Expertise */}
                <div className="space-y-6 pt-4">
                  <h3 className="text-lg font-medium">Skills & Expertise</h3>

                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills</FormLabel>
                        <FormControl>
                          <MultiSelect
                            placeholder="Select or create your skills"
                            options={[...skillOptions, ...customSkills].map(
                              (skill) => ({
                                label: skill,
                                value: skill,
                              })
                            )}
                            selected={field.value || []}
                            onChange={field.onChange}
                            creatable
                            onCreateOption={(newSkill) => {
                              setCustomSkills((prev) => [...prev, newSkill]);
                              field.onChange([
                                ...(field.value || []),
                                newSkill,
                              ]);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Select the skills you bring to collaborations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability</FormLabel>
                        <FormControl>
                          <RadioGroup
                            className="flex flex-col space-y-1"
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Full-time" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Full-time
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Part-time" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Part-time
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Project-based" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Project-based
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Weekends" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Weekends only
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Collaboration Preferences */}
                <div className="space-y-6 pt-4">
                  <h3 className="text-lg font-medium">
                    Collaboration Preferences
                  </h3>

                  <FormField
                    control={form.control}
                    name="looking_for"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel>Looking For</FormLabel>
                          <FormControl>
                            <MultiSelect
                              placeholder="Select skills you're looking for"
                              options={[...skillOptions].map((skill) => ({
                                label: skill,
                                value: skill,
                              }))}
                              selected={field.value || []}
                              onChange={field.onChange}
                              creatable
                              onCreateOption={(newNeed) => {
                                field.onChange([
                                  ...(field.value || []),
                                  newNeed,
                                ]);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Select the skills you're looking for in
                            collaborators
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="conditions"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel>Collaboration Terms</FormLabel>
                          <FormControl>
                            <MultiSelect
                              placeholder="Select your preferred collaboration terms"
                              options={[...collaborationTermOptions].map(
                                (term) => ({
                                  label: term,
                                  value: term,
                                })
                              )}
                              selected={field.value || []}
                              onChange={field.onChange}
                              creatable
                              onCreateOption={(newTerm) => {
                                field.onChange([
                                  ...(field.value || []),
                                  newTerm,
                                ]);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Select the terms under which you prefer to
                            collaborate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Projects */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Projects</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPastProject}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Project
                    </Button>
                  </div>

                  {pastProjects.length === 0 ? (
                    <div className="rounded-md border border-dashed p-6 text-center">
                      <h4 className="font-medium">No projects added</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Showcase your past work to attract potential
                        collaborators
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={addPastProject}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add a Project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastProjects.map((project, index) => (
                        <Card key={index}>
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">
                                Project {index + 1}
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePastProject(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <FormLabel htmlFor={`project-title-${index}`}>
                                  Title
                                </FormLabel>
                                <Input
                                  id={`project-title-${index}`}
                                  value={project.title || ""}
                                  onChange={(e) =>
                                    updatePastProject(
                                      index,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Project name"
                                  required
                                />
                              </div>

                              <div>
                                <FormLabel
                                  htmlFor={`project-description-${index}`}
                                >
                                  Description
                                </FormLabel>
                                <Textarea
                                  id={`project-description-${index}`}
                                  value={project.description || ""}
                                  onChange={(e) =>
                                    updatePastProject(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Brief description of the project"
                                  className="resize-y"
                                />
                              </div>

                              <div>
                                <FormLabel htmlFor={`project-url-${index}`}>
                                  URL
                                </FormLabel>
                                <Input
                                  id={`project-url-${index}`}
                                  value={project.url || ""}
                                  onChange={(e) =>
                                    updatePastProject(
                                      index,
                                      "url",
                                      e.target.value
                                    )
                                  }
                                  placeholder="https://example.com"
                                />
                              </div>
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`project-current-${index}`}
                                    checked={
                                      !!project.is_accepting_applications
                                    }
                                    onChange={(e) =>
                                      updatePastProject(
                                        index,
                                        "is_accepting_applications",
                                        e.target.checked as boolean
                                      )
                                    }
                                  />
                                  <FormLabel
                                    htmlFor={`project-current-${index}`}
                                  >
                                    Allow Applications
                                  </FormLabel>
                                </div>
                                <small className="text-muted-foreground text-xs">
                                  When selected, other users can apply to your
                                  project.
                                </small>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-x-2 sm:space-y-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/profile")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
