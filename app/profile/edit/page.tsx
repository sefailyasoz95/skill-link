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
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, X, AlertCircle, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@/components/auth-provider";

const profileFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  avatar_url: z.string().nullable(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").nullable(),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  collaboration_needs: z.array(z.string()).nullable(),
  collaboration_terms: z.array(z.string()).nullable(),
  availability: z.string().nullable(),
  location: z.string().nullable(),
  past_projects: z
    .array(
      z.object({
        title: z.string().min(1, "Project title is required"),
        description: z.string().nullable(),
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
const skillOptions = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Graphic Design",
  "Marketing",
  "Content Writing",
  "SEO",
  "Social Media",
  "Business Strategy",
  "Product Management",
  "Data Analysis",
  "AI/ML",
  "DevOps",
  "Sales",
  "Customer Support",
  "Video Editing",
  "Audio Production",
  "Photography",
  "Illustration",
  "Animation",
  "3D Modeling",
  "Game Development",
  "Blockchain",
  "Copywriting",
  "Email Marketing",
];

const collaborationTermOptions = [
  "Revenue Share",
  "Equity",
  "Fixed Fee",
  "Hourly Rate",
  "Skill Exchange",
  "Co-founder",
  "Advisor",
  "Mentorship",
];

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pastProjects, setPastProjects] = useState<
    { title: string; description: string | null; url: string | null }[]
  >([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [customNeeds, setCustomNeeds] = useState<string[]>([]);
  const [customTerms, setCustomTerms] = useState<string[]>([]);

  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
      avatar_url: null,
      bio: "",
      skills: [],
      collaboration_needs: [],
      collaboration_terms: [],
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
        form.setValue("avatar_url", url);

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

        if (error) {
          if (error.code !== "PGRST116") {
            throw error;
          }
          // Profile doesn't exist yet, use defaults
          setLoading(false);
          return;
        }

        // Initialize form with existing data
        if (data) {
          form.reset({
            full_name: data.full_name || "",
            avatar_url: data.avatar_url,
            bio: data.bio || "",
            skills: data.skills || [],
            collaboration_needs: data.collaboration_needs || [],
            collaboration_terms: data.collaboration_terms || [],
            availability: data.availability || null,
            location: data.location || "",
            past_projects: data.past_projects || [],
          });

          setAvatarUrl(data.avatar_url);
          setPastProjects(data.past_projects || []);

          // Add custom skills, needs, and terms
          if (data.skills) {
            const custom = data.skills.filter(
              (skill: any) => !skillOptions.includes(skill)
            );
            setCustomSkills(custom);
          }

          if (data.collaboration_needs) {
            const custom = data.collaboration_needs.filter(
              (need: any) => !skillOptions.includes(need)
            );
            setCustomNeeds(custom);
          }

          if (data.collaboration_terms) {
            const custom = data.collaboration_terms.filter(
              (term: any) => !collaborationTermOptions.includes(term)
            );
            setCustomTerms(custom);
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, router, toast, form]);

  const addPastProject = () => {
    setPastProjects([
      ...pastProjects,
      { title: "", description: null, url: null },
    ]);
  };

  const removePastProject = (index: number) => {
    const updated = [...pastProjects];
    updated.splice(index, 1);
    setPastProjects(updated);
  };

  const updatePastProject = (
    index: number,
    field: keyof (typeof pastProjects)[0],
    value: string
  ) => {
    const updated = [...pastProjects];
    updated[index] = { ...updated[index], [field]: value };
    setPastProjects(updated);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setSubmitting(true);

    // Include past projects
    values.past_projects = pastProjects.length ? pastProjects : null;

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        ...values,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });

      router.push("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
                <div className="h-7 w-1/3 animate-pulse rounded-lg bg-muted" />
              </CardTitle>
              <CardDescription>
                <div className="h-5 w-2/3 animate-pulse rounded-lg bg-muted" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-5 w-1/4 animate-pulse rounded-lg bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                </div>
              ))}
            </CardContent>
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
                    name="avatar_url"
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
                    name="collaboration_needs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Looking For</FormLabel>
                        <FormControl>
                          <MultiSelect
                            placeholder="Select skills you're looking for"
                            options={[...skillOptions, ...customNeeds].map(
                              (skill) => ({
                                label: skill,
                                value: skill,
                              })
                            )}
                            selected={field.value || []}
                            onChange={field.onChange}
                            creatable
                            onCreateOption={(newNeed) => {
                              setCustomNeeds((prev) => [...prev, newNeed]);
                              field.onChange([...(field.value || []), newNeed]);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Select the skills you're looking for in collaborators
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collaboration_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collaboration Terms</FormLabel>
                        <FormControl>
                          <MultiSelect
                            placeholder="Select or create terms"
                            options={[
                              ...collaborationTermOptions,
                              ...customTerms,
                            ].map((term) => ({
                              label: term,
                              value: term,
                            }))}
                            selected={field.value || []}
                            onChange={field.onChange}
                            creatable
                            onCreateOption={(newTerm) => {
                              setCustomTerms((prev) => [...prev, newTerm]);
                              field.onChange([...(field.value || []), newTerm]);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Select the collaboration terms you're open to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Past Projects */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Past Projects</h3>
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
                      <h4 className="font-medium">No past projects added</h4>
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
