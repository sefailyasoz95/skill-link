"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, User, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { User as UserType, Project } from "@/lib/types";
import { skillOptions, collaborationTermOptions } from "@/lib/constants";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-server";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";

type FiltersState = {
	skills: string[];
	needs: string[];
	availability: string | undefined;
	terms: string[];
};

function ProjectDialog({ project, owner }: { project: Project; owner?: UserType }) {
	return (
		<DialogContent className='max-w-lg'>
			<DialogHeader>
				<DialogTitle>{project.title}</DialogTitle>
				<DialogDescription>{project.description || "No description provided."}</DialogDescription>
			</DialogHeader>
			<div className='space-y-4 mt-4'>
				<div className='flex items-center gap-2'>
					<User className='h-4 w-4 text-muted-foreground' />
					<span className='text-sm text-muted-foreground'>{owner?.full_name || "Unknown Owner"}</span>
				</div>
				{project.url && (
					<div>
						<a
							href={project.url}
							target='_blank'
							rel='noopener noreferrer'
							className='text-primary underline break-all'>
							{project.url}
						</a>
					</div>
				)}
				<div className='text-xs text-muted-foreground'>
					Created: {project.created_at ? new Date(project.created_at).toLocaleString() : "Unknown"}
				</div>
			</div>
			<DialogFooter>
				<Button variant='outline' asChild>
					<Link href={`/profile/${project.user_id}`}>View Owner</Link>
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

export default function SearchPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [profiles, setProfiles] = useState<UserType[]>([]);
	const [filteredProfiles, setFilteredProfiles] = useState<UserType[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [projectOwners, setProjectOwners] = useState<Record<string, UserType>>({});
	const [sendingConnection, setSendingConnection] = useState<string | null>(null);
	const [filters, setFilters] = useState<FiltersState>({
		skills: [],
		needs: [],
		availability: undefined,
		terms: [],
	});
	const [activeFilters, setActiveFilters] = useState<FiltersState>({
		skills: [],
		needs: [],
		availability: undefined,
		terms: [],
	});
	const [sheetOpen, setSheetOpen] = useState(false);
	const [tab, setTab] = useState<"founders" | "projects">("founders");

	const { user, isLoading: loading } = useAuth();
	const { toast } = useToast();
	const router = useRouter();

	const fetchProfiles = async () => {
		try {
			// Approach with a more efficient fetching strategy using subqueries for skills and needs
			const { data: userData, error: userError } = await supabase.from("users").select("*").neq("id", user?.id);

			if (userError) throw userError;

			// Process the returned data into the expected format
			const processedProfiles = userData.map((profile) => {
				// Process skills from nested format
				const processedSkills = profile.skills
					? profile.skills
							.map((item: any) => {
								if (item.skills && typeof item.skills === "object") {
									return {
										id: item.skills.id,
										name: item.skills.name,
									};
								}
								return null;
							})
							.filter(Boolean)
					: [];

				return {
					...profile,
					skills: processedSkills,
					// collab_needs is already in the right format
				};
			});

			setProfiles(processedProfiles);
			setFilteredProfiles(processedProfiles);

			// Extract all unique skills, needs, and terms for filters
			const uniqueSkills = new Set<string>();
			const uniqueNeeds = new Set<string>();

			processedProfiles.forEach((profile) => {
				profile.skills?.forEach((skill: any) => uniqueSkills.add(skill.name));
				profile.collab_needs?.forEach((need: any) => uniqueNeeds.add(need.conditions));
			});
		} catch (error: any) {
			toast({
				title: "Error fetching profiles",
				description: error.message,
				variant: "destructive",
			});
		}
	};

	// Fetch projects with is_accepting_applications=true
	const fetchProjects = async () => {
		try {
			const { data: projectData, error: projectError } = await supabase
				.from("projects")
				.select("*, user: user_id (id, full_name, profile_picture)")
				.eq("is_accepting_applications", true);
			if (projectError) throw projectError;
			setProjects(projectData || []);
			// Map owners for quick lookup
			const owners: Record<string, UserType> = {};
			(projectData || []).forEach((proj: any) => {
				if (proj.user) owners[proj.user_id] = proj.user;
			});
			setProjectOwners(owners);
		} catch (error: any) {
			toast({
				title: "Error fetching projects",
				description: error.message,
				variant: "destructive",
			});
		}
	};

	useEffect(() => {
		if (!loading) {
			fetchProfiles();
			fetchProjects();
		}
	}, [user, router, toast, loading]);

	// Filter profiles when search query or filters change
	useEffect(() => {
		if (!profiles.length) return;

		let result = [...profiles];

		// Apply text search
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(profile) =>
					profile.full_name?.toLowerCase().includes(query) ||
					profile.bio?.toLowerCase().includes(query) ||
					profile.skills?.some((skill) => skill.toLowerCase().includes(query)) ||
					profile.looking_for?.some((looking) => looking.toLowerCase().includes(query))
			);
		}

		// Apply filters
		if (activeFilters.skills.length) {
			result = result.filter((profile) => profile.skills?.some((skill) => activeFilters.skills.includes(skill)));
		}

		if (activeFilters.needs.length) {
			result = result.filter((profile) => profile.looking_for?.some((need) => activeFilters.needs.includes(need)));
		}

		// Add filter for collaboration terms
		if (activeFilters.terms.length) {
			result = result.filter((profile) =>
				profile.conditions?.some((condition) => activeFilters.terms.includes(condition))
			);
		}

		if (activeFilters.availability) {
			result = result.filter((profile) => profile.availability === activeFilters.availability);
		}

		setFilteredProfiles(result);
	}, [searchQuery, activeFilters, profiles]);

	const sendConnectionRequest = async (profileId: string) => {
		if (!user) return;

		setSendingConnection(profileId);

		try {
			// Check if connection already exists
			const { data: existingConn, error: checkError } = await supabase
				.from("connections")
				.select("*")
				.or(`and(user_a.eq.${user.id},user_b.eq.${profileId}),and(user_a.eq.${profileId},user_b.eq.${user.id})`)
				.maybeSingle();

			if (checkError) throw checkError;

			if (existingConn) {
				toast({
					title: "Connection already exists",
					description: "You already have a connection with this user",
				});
				return;
			}

			// Create new connection
			const { error } = await supabase.from("connections").insert({
				user_a: user.id,
				user_b: profileId,
				status: "pending",
				created_at: new Date().toISOString(),
			});

			if (error) throw error;

			toast({
				title: "Connection request sent",
				description: "Your connection request has been sent successfully",
			});
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		} finally {
			setSendingConnection(null);
		}
	};

	const applyFilters = () => {
		// Apply current filter state to active filters
		setActiveFilters({ ...filters });
		// Close the sheet
		setSheetOpen(false);
	};

	const resetFilters = () => {
		const emptyFilters = {
			skills: [],
			needs: [],
			availability: undefined,
			terms: [],
		};
		setFilters(emptyFilters);
		setActiveFilters(emptyFilters);
	};

	const toggleSkillFilter = (skill: string) => {
		setFilters((prev) => ({
			...prev,
			skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
		}));
	};

	const toggleNeedFilter = (need: string) => {
		setFilters((prev) => ({
			...prev,
			needs: prev.needs.includes(need) ? prev.needs.filter((n) => n !== need) : [...prev.needs, need],
		}));
	};

	const toggleTermFilter = (term: string) => {
		setFilters((prev) => ({
			...prev,
			terms: prev.terms.includes(term) ? prev.terms.filter((t) => t !== term) : [...prev.terms, term],
		}));
	};

	const totalActiveFilters =
		activeFilters.skills.length +
		activeFilters.needs.length +
		activeFilters.terms.length +
		(activeFilters.availability ? 1 : 0);

	return (
		<div className='container py-10'>
			<div className='mx-auto max-w-5xl space-y-8'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Search</h1>
					<p className='text-muted-foreground mt-2'>Find founders or projects to collaborate with</p>
				</div>
				<Tabs value={tab} onValueChange={(v) => setTab(v as "founders" | "projects")} className='w-full'>
					<TabsList className='mb-6 flex w-full'>
						<TabsTrigger value='founders' className='flex-1'>
							Find Founders
						</TabsTrigger>
						<TabsTrigger value='projects' className='flex-1'>
							Find Projects
						</TabsTrigger>
					</TabsList>
					<TabsContent value='founders'>
						<div className='flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
							<div className='relative flex-1'>
								<SearchIcon className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
								<Input
									placeholder='Search by name, skills, or bio...'
									className='pl-9'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
							<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
								<SheetTrigger asChild>
									<Button variant='outline' className='sm:w-auto' onClick={() => setSheetOpen(true)}>
										<Filter className='mr-2 h-4 w-4' />
										Filter
										{totalActiveFilters > 0 && (
											<Badge variant='secondary' className='ml-2'>
												{totalActiveFilters}
											</Badge>
										)}
									</Button>
								</SheetTrigger>
								<SheetContent className='sm:max-w-md' title='Filter Collaborators'>
									<SheetHeader>
										<SheetTitle>Filter Collaborators</SheetTitle>
										<SheetDescription>Narrow your search to find the perfect match</SheetDescription>
									</SheetHeader>
									<div className='mt-6 space-y-6'>
										<div className='space-y-3'>
											<div className='flex items-center justify-between'>
												<h3 className='text-sm font-medium'>Looking For</h3>
												{filters.skills.length > 0 && (
													<Button
														variant='ghost'
														size='sm'
														onClick={() => setFilters((prev) => ({ ...prev, skills: [] }))}
														className='h-auto py-1 text-xs'>
														Clear
													</Button>
												)}
											</div>
											<div className='space-y-2 max-h-48 overflow-y-auto pr-2'>
												{skillOptions.map((skill) => (
													<div key={skill} className='flex items-center space-x-2'>
														<Checkbox
															id={`skill-${skill}`}
															checked={filters.skills.includes(skill)}
															onCheckedChange={() => toggleSkillFilter(skill)}
														/>
														<Label htmlFor={`skill-${skill}`} className='text-sm font-normal'>
															{skill}
														</Label>
													</div>
												))}
											</div>
										</div>

										<Separator />

										<div className='space-y-3'>
											<div className='flex items-center justify-between'>
												<h3 className='text-sm font-medium'>Collaboration Terms</h3>
												{filters.terms.length > 0 && (
													<Button
														variant='ghost'
														size='sm'
														onClick={() => setFilters((prev) => ({ ...prev, terms: [] }))}
														className='h-auto py-1 text-xs'>
														Clear
													</Button>
												)}
											</div>
											<div className='space-y-2 max-h-48 overflow-y-auto pr-2'>
												{collaborationTermOptions.map((term) => (
													<div key={term} className='flex items-center space-x-2'>
														<Checkbox
															id={`term-${term}`}
															checked={filters.terms.includes(term)}
															onCheckedChange={() => toggleTermFilter(term)}
														/>
														<Label htmlFor={`term-${term}`} className='text-sm font-normal'>
															{term}
														</Label>
													</div>
												))}
											</div>
										</div>

										<Separator />

										<div className='space-y-3'>
											<div className='flex items-center justify-between'>
												<h3 className='text-sm font-medium'>Availability</h3>
												{filters.availability && (
													<Button
														variant='ghost'
														size='sm'
														onClick={() =>
															setFilters((prev) => ({
																...prev,
																availability: undefined,
															}))
														}
														className='h-auto py-1 text-xs'>
														Clear
													</Button>
												)}
											</div>
											<Select
												value={filters.availability}
												onValueChange={(value) =>
													setFilters((prev) => ({
														...prev,
														availability: value || undefined,
													}))
												}>
												<SelectTrigger>
													<SelectValue placeholder='Select availability' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='Any'>Any availability</SelectItem>
													<SelectItem value='Full-time'>Full-time</SelectItem>
													<SelectItem value='Part-time'>Part-time</SelectItem>
													<SelectItem value='Project-based'>Project-based</SelectItem>
													<SelectItem value='Weekends'>Weekends only</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className='flex justify-between pt-4'>
											<Button variant='outline' onClick={resetFilters}>
												Reset All
											</Button>
											<Button type='button' onClick={applyFilters}>
												Apply Filters
											</Button>
										</div>
									</div>
								</SheetContent>
							</Sheet>
						</div>
						<div className='mt-6'>
							{loading ? (
								<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
									{[1, 2, 3, 4, 5, 6].map((i) => (
										<Card key={i} className='animate-pulse'>
											<CardHeader className='h-48 bg-muted' />
											<CardContent className='h-32 space-y-2'>
												<div className='h-4 w-3/4 rounded bg-muted' />
												<div className='h-4 w-1/2 rounded bg-muted' />
												<div className='h-4 w-5/6 rounded bg-muted' />
											</CardContent>
										</Card>
									))}
								</div>
							) : filteredProfiles.length > 0 ? (
								<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
									{filteredProfiles.map((profile, index) => (
										<motion.div
											key={profile.id}
											initial={{ x: -5, opacity: 0 }}
											animate={{ x: 0, opacity: 1 }}
											transition={{ delay: 0.1 * index }}>
											<Card>
												<CardHeader>
													<div className='flex items-center space-x-4'>
														<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
															{profile.profile_picture ? (
																<Image
																	src={profile.profile_picture}
																	alt={profile.full_name || "Profile"}
																	className='h-12 w-12 rounded-full object-cover'
																	width={48}
																	height={48}
																/>
															) : (
																<User className='h-6 w-6 text-primary' />
															)}
														</div>
														<div>
															<CardTitle className='text-lg'>{profile.full_name || "Unnamed User"}</CardTitle>
															<CardDescription>{profile.availability || "Availability not specified"}</CardDescription>
														</div>
													</div>
												</CardHeader>
												<CardContent className='space-y-4'>
													<div>
														<h4 className='text-sm font-medium'>Skills</h4>
														{profile.skills && profile.skills.length ? (
															<div className='mt-2 flex flex-wrap gap-1'>
																{profile.skills?.slice(0, 4).map((skill, i) => (
																	<Badge key={i} variant='secondary'>
																		{skill}
																	</Badge>
																))}
																{profile.skills && profile.skills.length > 4 && (
																	<Badge variant='outline'>+{profile.skills.length - 4}</Badge>
																)}
															</div>
														) : (
															<small className='text-muted-foreground text-xs'>
																{profile.full_name} did not add a skill yet
															</small>
														)}
													</div>
													<div>
														<h4 className='text-sm font-medium'>Looking For</h4>
														{profile.looking_for && profile.looking_for.length ? (
															<div className='mt-1 flex flex-wrap gap-1'>
																{profile?.looking_for.slice(0, 2).map((con, i) => (
																	<Badge key={i} variant='outline'>
																		{con}
																	</Badge>
																))}
																{profile.looking_for && profile.looking_for.length > 2 && (
																	<Badge variant='outline'>+{profile.looking_for.length - 2}</Badge>
																)}
															</div>
														) : (
															<small className='text-muted-foreground text-xs'>
																{profile.full_name} did not specify what they are looking for yet
															</small>
														)}
													</div>
													<div>
														<h4 className='text-sm font-medium'>Conditions</h4>
														{profile.conditions && profile.conditions.length ? (
															<div className='mt-1 flex flex-wrap gap-1'>
																{profile?.conditions.slice(0, 2).map((con, i) => (
																	<Badge key={i} variant='outline'>
																		{con}
																	</Badge>
																))}
																{profile.conditions && profile.conditions.length > 2 && (
																	<Badge variant='outline'>+{profile.conditions.length - 2}</Badge>
																)}
															</div>
														) : (
															<small className='text-muted-foreground text-xs'>
																{profile.full_name} did not specify any conditions yet
															</small>
														)}
													</div>
												</CardContent>
												<CardFooter className='flex justify-between'>
													<Button variant='outline' asChild>
														<Link href={`/profile/${profile.id}`}>View Profile</Link>
													</Button>
													<Button
														onClick={() => sendConnectionRequest(profile.id)}
														disabled={sendingConnection === profile.id}>
														{sendingConnection === profile.id ? "Sending..." : "Connect"}
													</Button>
												</CardFooter>
											</Card>
										</motion.div>
									))}
								</div>
							) : (
								<div className='rounded-lg border border-dashed p-8 text-center'>
									<h3 className='font-medium'>No matches found</h3>
									<p className='mt-1 text-sm text-muted-foreground'>
										Try adjusting your search or filters to find more collaborators
									</p>
									<Button onClick={resetFilters} className='mt-4'>
										Reset Filters
									</Button>
								</div>
							)}
						</div>
					</TabsContent>
					<TabsContent value='projects'>
						<div className='mt-6'>
							{loading ? (
								<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
									{[1, 2, 3, 4, 5, 6].map((i) => (
										<Card key={i} className='animate-pulse'>
											<CardHeader className='h-48 bg-muted' />
											<CardContent className='h-32 space-y-2'>
												<div className='h-4 w-3/4 rounded bg-muted' />
												<div className='h-4 w-1/2 rounded bg-muted' />
												<div className='h-4 w-5/6 rounded bg-muted' />
											</CardContent>
										</Card>
									))}
								</div>
							) : projects.length > 0 ? (
								<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
									{projects.map((project, index) => (
										<motion.div
											key={project.id}
											initial={{ x: -5, opacity: 0 }}
											animate={{ x: 0, opacity: 1 }}
											transition={{ delay: 0.1 * index }}>
											<Card>
												<CardHeader>
													<CardTitle className='text-lg line-clamp-1'>{project.title}</CardTitle>
													<CardDescription className='line-clamp-2'>{project.description}</CardDescription>
												</CardHeader>
												<CardContent className='space-y-2'>
													<div className='flex items-center gap-2'>
														<User className='h-4 w-4 text-muted-foreground' />
														<span className='text-sm text-muted-foreground'>
															{projectOwners[project.user_id]?.full_name || "Unknown Owner"}
														</span>
													</div>
												</CardContent>
												<CardFooter className='flex justify-between'>
													<Button variant='outline' asChild>
														<Link href={`/profile/${project.user_id}`}>View Owner</Link>
													</Button>
													<Dialog>
														<DialogTrigger asChild>
															<Button>View Project</Button>
														</DialogTrigger>
														<ProjectDialog project={project} owner={projectOwners[project.user_id]} />
													</Dialog>
												</CardFooter>
											</Card>
										</motion.div>
									))}
								</div>
							) : (
								<div className='rounded-lg border border-dashed p-8 text-center'>
									<h3 className='font-medium'>No projects found</h3>
									<p className='mt-1 text-sm text-muted-foreground'>No projects are currently accepting applications</p>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
