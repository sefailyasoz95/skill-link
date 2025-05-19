"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, X, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@/components/auth-provider";
import { skillOptions, collaborationTermOptions } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

const profileFormSchema = z.object({
	full_name: z.string().min(2, "Name must be at least 2 characters"),
	profile_picture: z.string().nullable(),
	bio: z.string().max(500, "Bio cannot exceed 500 characters").nullable(),
	skills: z.array(z.string()).min(1, "At least one skill is required"),
	collaboration_needs: z.array(z.string()),
	collaboration_terms: z.array(z.string()),
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

export default function EditProfilePage() {
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [pastProjects, setPastProjects] = useState<{ title: string; description: string | null; url: string | null }[]>(
		[]
	);
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
			profile_picture: null,
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
				const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

				if (uploadError) throw uploadError;

				// Get the public URL
				const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

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
		if (!user) {
			router.push("/auth/signin");
			return;
		}

		const fetchProfile = async () => {
			try {
				// Fetch user basic info
				const { data: userData, error: userError } = await supabase
					.from("users")
					.select("*")
					.eq("id", user.id)
					.single();

				if (userError) {
					throw userError;
				}

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
					.eq("user_id", user.id);

				if (skillsError) {
					throw skillsError;
				}

				// Fetch collaboration needs
				const { data: collabNeedsData, error: needsError } = await supabase
					.from("collab_needs")
					.select("*")
					.eq("user_id", user.id);

				if (needsError) {
					throw needsError;
				}

				// Fetch projects
				const { data: projectsData, error: projectsError } = await supabase
					.from("projects")
					.select("*")
					.eq("user_id", user.id);

				if (projectsError) {
					throw projectsError;
				}
				const skills = skillsData?.map((item) => item.skills) || [];

				// Process collab needs data
				let collaborationNeeds: string[] = [];
				let collaborationTerms: string[] = [];

				if (collabNeedsData && collabNeedsData.length > 0) {
					// For each collab need entry, extract the looking_for and conditions arrays
					collabNeedsData.forEach((need) => {
						// Extract looking_for values for the collaboration_needs field
						if (need.looking_for && Array.isArray(need.looking_for)) {
							collaborationNeeds = [...collaborationNeeds, ...need.looking_for];
						}

						// Extract conditions values for the collaboration_terms field
						if (need.conditions && Array.isArray(need.conditions)) {
							collaborationTerms = [...collaborationTerms, ...need.conditions];
						}
					});
				}

				const projects = projectsData || [];

				const formValues = {
					full_name: userData.full_name || "",
					profile_picture: userData.profile_picture,
					bio: userData.bio || "",
					skills: skills.map((skill: any) => skill.name),
					collaboration_needs: collaborationNeeds,
					collaboration_terms: collaborationTerms,
					availability: userData.availability || null,
					location: userData.location || "",
					past_projects: projects,
				};

				form.reset(formValues);

				setAvatarUrl(userData.profile_picture);
				setPastProjects(projects);

				// Add custom skills and needs
				if (skills.length > 0) {
					const custom = skills.filter((skill: any) => !skillOptions.includes(skill.name));
					const _custom = custom.map((skill: any) => skill.name);
					setCustomSkills(_custom);
				}

				if (collaborationNeeds.length > 0) {
					const custom = collaborationNeeds.filter((need: string) => !skillOptions.includes(need));
					setCustomNeeds(custom);
				}

				if (collaborationTerms.length > 0) {
					const custom = collaborationTerms.filter((term: string) => !collaborationTermOptions.includes(term));
					setCustomTerms(custom);
				}
			} catch (error: any) {
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
	}, [user, router, toast, form]);

	const addPastProject = () => {
		setPastProjects([...pastProjects, { title: "", description: null, url: null }]);
	};

	const removePastProject = (index: number) => {
		const updated = [...pastProjects];
		updated.splice(index, 1);
		setPastProjects(updated);
	};

	const updatePastProject = (index: number, field: keyof (typeof pastProjects)[0], value: string) => {
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
				})
				.select();

			if (userError) {
				throw userError;
			}
			const { error: skillDeleteError } = await supabase.from("user_skills").delete().eq("user_id", user.id);

			if (skillDeleteError) {
				throw skillDeleteError;
			}

			// Insert new skills
			if (values.skills && values.skills.length > 0) {
				// First ensure all skills exist in the skills table
				for (const skillName of values.skills) {
					// Try to find existing skill
					let skillId;
					const { data: existingSkill, error: findError } = await supabase
						.from("skills")
						.select("id")
						.eq("name", skillName)
						.single();

					if (findError && findError.code !== "PGRST116") {
						throw findError;
					}

					if (existingSkill) {
						skillId = existingSkill.id;
					} else {
						// Create new skill
						const { data: newSkill, error: createError } = await supabase
							.from("skills")
							.insert({ name: skillName })
							.select("id")
							.single();

						if (createError) {
							throw createError;
						}

						skillId = newSkill.id;
					}

					// Now insert the user_skill relationship
					const { error: linkError } = await supabase.from("user_skills").insert({
						user_id: user.id,
						skill_id: skillId,
					});

					if (linkError) {
						throw linkError;
					}
				}
			} else {
			}

			// 3. Handle collaboration needs and terms
			const { error: collabDeleteError } = await supabase.from("collab_needs").delete().eq("user_id", user.id);

			if (collabDeleteError) {
				throw collabDeleteError;
			}

			// Insert new combined collaboration data
			if (
				(values.collaboration_needs && values.collaboration_needs.length > 0) ||
				(values.collaboration_terms && values.collaboration_terms.length > 0)
			) {
				// Insert a single record with both arrays
				const { error: addCollabError } = await supabase.from("collab_needs").insert({
					user_id: user.id,
					looking_for: values.collaboration_needs || [],
					conditions: values.collaboration_terms || [],
					description: "", // Add a default value for the description field
					created_at: new Date().toISOString(),
				});

				if (addCollabError) {
					throw addCollabError;
				}
			} else {
			}

			// 4. Handle past projects
			const { error: projectsDeleteError } = await supabase.from("projects").delete().eq("user_id", user.id);

			if (projectsDeleteError) {
				throw projectsDeleteError;
			}
			// Insert new projects
			const validProjects = pastProjects.filter((project) => project.title.trim());
			if (validProjects.length > 0) {
				for (const project of validProjects) {
					const { error: addProjectError } = await supabase.from("projects").insert({
						user_id: user.id,
						title: project.title,
						description: project.description,
						url: project.url,
						created_at: new Date().toISOString(),
					});

					if (addProjectError) {
						throw addProjectError;
					}
				}
			} else {
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
			<div className='container py-10'>
				<div className='mx-auto max-w-3xl'>
					<Card>
						<CardHeader>
							<CardTitle className='text-2xl'>
								<Skeleton className='h-8 w-48' />
							</CardTitle>
							<CardDescription>
								<Skeleton className='h-5 w-96' />
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-8'>
							{/* Basic Information Section */}
							<div className='space-y-6'>
								<Skeleton className='h-6 w-40' />
								<div className='space-y-4'>
									<div className='flex items-center space-x-4'>
										<Skeleton className='h-24 w-24 rounded-full' />
										<div className='space-y-2'>
											<Skeleton className='h-4 w-32' />
											<Skeleton className='h-4 w-64' />
										</div>
									</div>
									<div className='space-y-2'>
										<Skeleton className='h-4 w-24' />
										<Skeleton className='h-10 w-full' />
									</div>
									<div className='space-y-2'>
										<Skeleton className='h-4 w-24' />
										<Skeleton className='h-10 w-full' />
									</div>
									<div className='space-y-2'>
										<Skeleton className='h-4 w-24' />
										<Skeleton className='h-32 w-full' />
									</div>
								</div>
							</div>

							{/* Skills & Expertise Section */}
							<div className='space-y-6 pt-4'>
								<Skeleton className='h-6 w-40' />
								<div className='space-y-4'>
									<div className='space-y-2'>
										<Skeleton className='h-4 w-24' />
										<Skeleton className='h-10 w-full' />
									</div>
									<div className='space-y-2'>
										<Skeleton className='h-4 w-24' />
										<div className='space-y-2'>
											<Skeleton className='h-8 w-32' />
											<Skeleton className='h-8 w-32' />
											<Skeleton className='h-8 w-32' />
										</div>
									</div>
								</div>
							</div>

							{/* Collaboration Preferences Section */}
							<div className='space-y-6 pt-4'>
								<Skeleton className='h-6 w-48' />
								<div className='space-y-4'>
									<div className='space-y-2'>
										<Skeleton className='h-4 w-24' />
										<Skeleton className='h-10 w-full' />
									</div>
									<div className='space-y-2'>
										<Skeleton className='h-4 w-32' />
										<Skeleton className='h-10 w-full' />
									</div>
								</div>
							</div>

							{/* Past Projects Section */}
							<div className='space-y-6 pt-4'>
								<div className='flex items-center justify-between'>
									<Skeleton className='h-6 w-32' />
									<Skeleton className='h-9 w-32' />
								</div>
								<div className='space-y-4'>
									<Card>
										<CardContent className='p-4 space-y-4'>
											<div className='flex items-start justify-between'>
												<Skeleton className='h-5 w-24' />
												<Skeleton className='h-8 w-8' />
											</div>
											<div className='space-y-4'>
												<div className='space-y-2'>
													<Skeleton className='h-4 w-16' />
													<Skeleton className='h-10 w-full' />
												</div>
												<div className='space-y-2'>
													<Skeleton className='h-4 w-24' />
													<Skeleton className='h-24 w-full' />
												</div>
												<div className='space-y-2'>
													<Skeleton className='h-4 w-16' />
													<Skeleton className='h-10 w-full' />
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						</CardContent>
						<CardFooter className='flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-x-2 sm:space-y-0'>
							<Skeleton className='h-9 w-24' />
							<Skeleton className='h-9 w-32' />
						</CardFooter>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className='container py-10'>
			<div className='mx-auto max-w-3xl'>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
						<Card>
							<CardHeader>
								<CardTitle>Edit Your Profile</CardTitle>
								<CardDescription>Make your profile stand out to find the perfect collaborator</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
								{/* Basic Information */}
								<div className='space-y-6'>
									<h3 className='text-lg font-medium'>Basic Information</h3>

									<FormField
										control={form.control}
										name='profile_picture'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Profile Picture</FormLabel>
												<FormControl>
													<div className='flex items-center space-x-4'>
														<div className='relative h-24 w-24'>
															<div
																{...getRootProps()}
																className={`relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed ${
																	isDragActive ? "border-primary bg-primary/10" : "border-input hover:bg-muted/25"
																}`}>
																<input {...getInputProps()} />

																{uploadingAvatar && (
																	<div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/10'>
																		<Loader2 className='h-6 w-6 animate-spin text-primary' />
																	</div>
																)}

																{avatarUrl ? (
																	<img
																		src={avatarUrl}
																		alt='Avatar'
																		className='h-full w-full rounded-full object-cover'
																	/>
																) : (
																	<div className='flex flex-col items-center justify-center text-sm text-muted-foreground'>
																		<PlusCircle className='mb-1 h-5 w-5' />
																		Upload
																	</div>
																)}
															</div>
														</div>
														<div className='text-sm text-muted-foreground'>
															Drop an image here or click to upload a profile picture.
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
										name='full_name'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Full Name</FormLabel>
												<FormControl>
													<Input placeholder='John Doe' {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='location'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Location</FormLabel>
												<FormControl>
													<Input placeholder='City, Country' {...field} value={field.value || ""} />
												</FormControl>
												<FormDescription>Your location helps others find local collaborators</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='bio'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Bio</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Tell others about yourself, your background, and what you're working on"
														className='min-h-32 resize-y'
														{...field}
														value={field.value || ""}
													/>
												</FormControl>
												<FormDescription>{form.watch("bio")?.length || 0}/500 characters</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Skills & Expertise */}
								<div className='space-y-6 pt-4'>
									<h3 className='text-lg font-medium'>Skills & Expertise</h3>

									<FormField
										control={form.control}
										name='skills'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Skills</FormLabel>
												<FormControl>
													<MultiSelect
														placeholder='Select or create your skills'
														options={[...skillOptions, ...customSkills].map((skill) => ({
															label: skill,
															value: skill,
														}))}
														selected={field.value || []}
														onChange={field.onChange}
														creatable
														onCreateOption={(newSkill) => {
															setCustomSkills((prev) => [...prev, newSkill]);
															field.onChange([...(field.value || []), newSkill]);
														}}
													/>
												</FormControl>
												<FormDescription>Select the skills you bring to collaborations</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='availability'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Availability</FormLabel>
												<FormControl>
													<RadioGroup
														className='flex flex-col space-y-1'
														value={field.value || ""}
														onValueChange={field.onChange}>
														<FormItem className='flex items-center space-x-3 space-y-0'>
															<FormControl>
																<RadioGroupItem value='Full-time' />
															</FormControl>
															<FormLabel className='font-normal'>Full-time</FormLabel>
														</FormItem>
														<FormItem className='flex items-center space-x-3 space-y-0'>
															<FormControl>
																<RadioGroupItem value='Part-time' />
															</FormControl>
															<FormLabel className='font-normal'>Part-time</FormLabel>
														</FormItem>
														<FormItem className='flex items-center space-x-3 space-y-0'>
															<FormControl>
																<RadioGroupItem value='Project-based' />
															</FormControl>
															<FormLabel className='font-normal'>Project-based</FormLabel>
														</FormItem>
														<FormItem className='flex items-center space-x-3 space-y-0'>
															<FormControl>
																<RadioGroupItem value='Weekends' />
															</FormControl>
															<FormLabel className='font-normal'>Weekends only</FormLabel>
														</FormItem>
													</RadioGroup>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Collaboration Preferences */}
								<div className='space-y-6 pt-4'>
									<h3 className='text-lg font-medium'>Collaboration Preferences</h3>

									<FormField
										control={form.control}
										name='collaboration_needs'
										render={({ field }) => {
											return (
												<FormItem>
													<FormLabel>Looking For</FormLabel>
													<FormControl>
														<MultiSelect
															placeholder="Select skills you're looking for"
															options={[...skillOptions, ...customNeeds].map((skill) => ({
																label: skill,
																value: skill,
															}))}
															selected={field.value || []}
															onChange={field.onChange}
															creatable
															onCreateOption={(newNeed) => {
																setCustomNeeds((prev) => [...prev, newNeed]);
																field.onChange([...(field.value || []), newNeed]);
															}}
														/>
													</FormControl>
													<FormDescription>Select the skills you're looking for in collaborators</FormDescription>
													<FormMessage />
												</FormItem>
											);
										}}
									/>

									<FormField
										control={form.control}
										name='collaboration_terms'
										render={({ field }) => {
											return (
												<FormItem>
													<FormLabel>Collaboration Terms</FormLabel>
													<FormControl>
														<MultiSelect
															placeholder='Select your preferred collaboration terms'
															options={[...collaborationTermOptions, ...customTerms].map((term) => ({
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
													<FormDescription>Select the terms under which you prefer to collaborate</FormDescription>
													<FormMessage />
												</FormItem>
											);
										}}
									/>
								</div>

								{/* Past Projects */}
								<div className='space-y-6 pt-4'>
									<div className='flex items-center justify-between'>
										<h3 className='text-lg font-medium'>Past Projects</h3>
										<Button type='button' variant='outline' size='sm' onClick={addPastProject}>
											<PlusCircle className='mr-2 h-4 w-4' />
											Add Project
										</Button>
									</div>

									{pastProjects.length === 0 ? (
										<div className='rounded-md border border-dashed p-6 text-center'>
											<h4 className='font-medium'>No past projects added</h4>
											<p className='mt-1 text-sm text-muted-foreground'>
												Showcase your past work to attract potential collaborators
											</p>
											<Button type='button' variant='outline' className='mt-4' onClick={addPastProject}>
												<PlusCircle className='mr-2 h-4 w-4' />
												Add a Project
											</Button>
										</div>
									) : (
										<div className='space-y-4'>
											{pastProjects.map((project, index) => (
												<Card key={index}>
													<CardContent className='p-4 space-y-4'>
														<div className='flex items-start justify-between'>
															<h4 className='font-medium'>Project {index + 1}</h4>
															<Button
																type='button'
																variant='ghost'
																size='icon'
																onClick={() => removePastProject(index)}>
																<X className='h-4 w-4' />
															</Button>
														</div>

														<div className='space-y-4'>
															<div>
																<FormLabel htmlFor={`project-title-${index}`}>Title</FormLabel>
																<Input
																	id={`project-title-${index}`}
																	value={project.title || ""}
																	onChange={(e) => updatePastProject(index, "title", e.target.value)}
																	placeholder='Project name'
																	required
																/>
															</div>

															<div>
																<FormLabel htmlFor={`project-description-${index}`}>Description</FormLabel>
																<Textarea
																	id={`project-description-${index}`}
																	value={project.description || ""}
																	onChange={(e) => updatePastProject(index, "description", e.target.value)}
																	placeholder='Brief description of the project'
																	className='resize-y'
																/>
															</div>

															<div>
																<FormLabel htmlFor={`project-url-${index}`}>URL</FormLabel>
																<Input
																	id={`project-url-${index}`}
																	value={project.url || ""}
																	onChange={(e) => updatePastProject(index, "url", e.target.value)}
																	placeholder='https://example.com'
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
							<CardFooter className='flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-x-2 sm:space-y-0'>
								<Button type='button' variant='outline' onClick={() => router.push("/profile")} disabled={submitting}>
									Cancel
								</Button>
								<Button type='submit' disabled={submitting}>
									{submitting ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
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
