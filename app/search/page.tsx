"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Search as SearchIcon, User, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Profile = {
	id: string;
	full_name: string | null;
	avatar_url: string | null;
	bio: string | null;
	skills: string[] | null;
	collaboration_needs: string[] | null;
	collaboration_terms: string[] | null;
	availability: string | null;
};

type FiltersState = {
	skills: string[];
	needs: string[];
	availability: string | null;
	terms: string[];
};

export default function SearchPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
	const [loading, setLoading] = useState(true);
	const [sendingConnection, setSendingConnection] = useState<string | null>(null);
	const [filters, setFilters] = useState<FiltersState>({
		skills: [],
		needs: [],
		availability: null,
		terms: [],
	});
	const [allSkills, setAllSkills] = useState<string[]>([]);
	const [allNeeds, setAllNeeds] = useState<string[]>([]);
	const [allTerms, setAllTerms] = useState<string[]>([]);

	const { user } = useAuth();
	const { toast } = useToast();
	const router = useRouter();

	useEffect(() => {
		if (!user) {
			router.push("/auth/signin");
			return;
		}

		const fetchProfiles = async () => {
			try {
				const { data, error } = await supabase.from("profiles").select("*").neq("id", user.id);

				if (error) throw error;

				setProfiles(data || []);
				setFilteredProfiles(data || []);

				// Extract all unique skills, needs, and terms for filters
				const skills = new Set<string>();
				const needs = new Set<string>();
				const terms = new Set<string>();

				data?.forEach((profile) => {
					profile.skills?.forEach((skill: any) => skills.add(skill));
					profile.collaboration_needs?.forEach((need: any) => needs.add(need));
					profile.collaboration_terms?.forEach((term: any) => terms.add(term));
				});

				setAllSkills(Array.from(skills));
				setAllNeeds(Array.from(needs));
				setAllTerms(Array.from(terms));
			} catch (error: any) {
				toast({
					title: "Error fetching profiles",
					description: error.message,
					variant: "destructive",
				});
			} finally {
				setLoading(false);
			}
		};

		fetchProfiles();
	}, [user, router, toast]);

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
					profile.collaboration_needs?.some((need) => need.toLowerCase().includes(query))
			);
		}

		// Apply filters
		if (filters.skills.length) {
			result = result.filter((profile) => profile.skills?.some((skill) => filters.skills.includes(skill)));
		}

		if (filters.needs.length) {
			result = result.filter((profile) => profile.collaboration_needs?.some((need) => filters.needs.includes(need)));
		}

		if (filters.terms.length) {
			result = result.filter((profile) => profile.collaboration_terms?.some((term) => filters.terms.includes(term)));
		}

		if (filters.availability) {
			result = result.filter((profile) => profile.availability === filters.availability);
		}

		setFilteredProfiles(result);
	}, [searchQuery, filters, profiles]);

	const sendConnectionRequest = async (profileId: string) => {
		if (!user) return;

		setSendingConnection(profileId);

		try {
			// Check if connection already exists
			const { data: existingConn, error: checkError } = await supabase
				.from("connections")
				.select("*")
				.or(
					`and(user_id_1.eq.${user.id},user_id_2.eq.${profileId}),and(user_id_1.eq.${profileId},user_id_2.eq.${user.id})`
				)
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
				user_id_1: user.id,
				user_id_2: profileId,
				status: "pending",
				initiator_id: user.id,
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

	const resetFilters = () => {
		setFilters({
			skills: [],
			needs: [],
			availability: null,
			terms: [],
		});
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
		filters.skills.length + filters.needs.length + filters.terms.length + (filters.availability ? 1 : 0);

	return (
		<div className='container py-10'>
			<div className='mx-auto max-w-5xl space-y-8'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Find Collaborators</h1>
					<p className='text-muted-foreground mt-2'>
						Search for solopreneurs with the skills and interests that match your needs
					</p>
				</div>

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

					<Sheet>
						<SheetTrigger asChild>
							<Button variant='outline' className='sm:w-auto'>
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
										<h3 className='text-sm font-medium'>Skills</h3>
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
									<div className='space-y-2'>
										{allSkills.slice(0, 10).map((skill) => (
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
										<h3 className='text-sm font-medium'>Looking For</h3>
										{filters.needs.length > 0 && (
											<Button
												variant='ghost'
												size='sm'
												onClick={() => setFilters((prev) => ({ ...prev, needs: [] }))}
												className='h-auto py-1 text-xs'>
												Clear
											</Button>
										)}
									</div>
									<div className='space-y-2'>
										{allNeeds.slice(0, 10).map((need) => (
											<div key={need} className='flex items-center space-x-2'>
												<Checkbox
													id={`need-${need}`}
													checked={filters.needs.includes(need)}
													onCheckedChange={() => toggleNeedFilter(need)}
												/>
												<Label htmlFor={`need-${need}`} className='text-sm font-normal'>
													{need}
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
												onClick={() => setFilters((prev) => ({ ...prev, availability: null }))}
												className='h-auto py-1 text-xs'>
												Clear
											</Button>
										)}
									</div>
									<Select
										value={filters.availability || ""}
										onValueChange={(value) => setFilters((prev) => ({ ...prev, availability: value || null }))}>
										<SelectTrigger>
											<SelectValue placeholder='Select availability' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value=''>Any availability</SelectItem>
											<SelectItem value='Full-time'>Full-time</SelectItem>
											<SelectItem value='Part-time'>Part-time</SelectItem>
											<SelectItem value='Project-based'>Project-based</SelectItem>
											<SelectItem value='Weekends'>Weekends only</SelectItem>
										</SelectContent>
									</Select>
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
									<div className='space-y-2'>
										{allTerms.slice(0, 10).map((term) => (
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

								<div className='flex justify-between pt-4'>
									<Button variant='outline' onClick={resetFilters}>
										Reset All
									</Button>
									<Button type='submit'>Apply Filters</Button>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>

				<Tabs defaultValue='grid'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center space-x-2'>
							<TabsList>
								<TabsTrigger value='grid'>Grid</TabsTrigger>
								<TabsTrigger value='list'>List</TabsTrigger>
							</TabsList>
							<p className='text-sm text-muted-foreground'>
								{filteredProfiles.length} {filteredProfiles.length === 1 ? "result" : "results"}
							</p>
						</div>
						{totalActiveFilters > 0 && (
							<Button variant='ghost' size='sm' onClick={resetFilters}>
								Clear Filters
							</Button>
						)}
					</div>

					<TabsContent value='grid' className='mt-6'>
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
								{filteredProfiles.map((profile) => (
									<Card key={profile.id}>
										<CardHeader>
											<div className='flex items-center space-x-4'>
												<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
													{profile.avatar_url ? (
														<img
															src={profile.avatar_url}
															alt={profile.full_name || "Profile"}
															className='h-12 w-12 rounded-full object-cover'
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
											</div>
											{profile.collaboration_needs && profile.collaboration_needs.length > 0 && (
												<div>
													<h4 className='text-sm font-medium'>Looking for</h4>
													<div className='mt-1 flex flex-wrap gap-1'>
														{profile.collaboration_needs?.slice(0, 2).map((need, i) => (
															<Badge key={i} variant='outline'>
																{need}
															</Badge>
														))}
														{profile.collaboration_needs && profile.collaboration_needs.length > 2 && (
															<Badge variant='outline'>+{profile.collaboration_needs.length - 2}</Badge>
														)}
													</div>
												</div>
											)}
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
					</TabsContent>

					<TabsContent value='list' className='mt-6'>
						{loading ? (
							<div className='space-y-4'>
								{[1, 2, 3, 4, 5].map((i) => (
									<div key={i} className='animate-pulse rounded-lg border p-4'>
										<div className='flex items-center space-x-4'>
											<div className='h-12 w-12 rounded-full bg-muted' />
											<div className='space-y-2'>
												<div className='h-4 w-36 rounded bg-muted' />
												<div className='h-3 w-24 rounded bg-muted' />
											</div>
										</div>
										<div className='mt-4 space-y-2'>
											<div className='h-3 w-full rounded bg-muted' />
											<div className='h-3 w-5/6 rounded bg-muted' />
										</div>
										<div className='mt-4 flex justify-end space-x-2'>
											<div className='h-9 w-24 rounded bg-muted' />
											<div className='h-9 w-24 rounded bg-muted' />
										</div>
									</div>
								))}
							</div>
						) : filteredProfiles.length > 0 ? (
							<div className='space-y-4'>
								{filteredProfiles.map((profile) => (
									<Card key={profile.id}>
										<CardContent className='p-4 sm:p-6'>
											<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
												<div className='flex items-center space-x-4'>
													<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
														{profile.avatar_url ? (
															<img
																src={profile.avatar_url}
																alt={profile.full_name || "Profile"}
																className='h-12 w-12 rounded-full object-cover'
															/>
														) : (
															<User className='h-6 w-6 text-primary' />
														)}
													</div>
													<div>
														<h3 className='font-medium'>{profile.full_name || "Unnamed User"}</h3>
														<p className='text-sm text-muted-foreground'>
															{profile.availability || "Availability not specified"}
														</p>
													</div>
												</div>
												<div className='mt-4 sm:mt-0 flex flex-wrap gap-1'>
													{profile.skills?.slice(0, 3).map((skill, i) => (
														<Badge key={i} variant='secondary'>
															{skill}
														</Badge>
													))}
													{profile.skills && profile.skills.length > 3 && (
														<Badge variant='outline'>+{profile.skills.length - 3}</Badge>
													)}
												</div>
											</div>
											{profile.bio && <p className='mt-4 text-sm line-clamp-2'>{profile.bio}</p>}
											<div className='mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
												<div className='flex items-center space-x-2'>
													<span className='text-sm font-medium'>Looking for:</span>
													<div className='flex flex-wrap gap-1'>
														{profile.collaboration_needs?.slice(0, 2).map((need, i) => (
															<Badge key={i} variant='outline'>
																{need}
															</Badge>
														))}
														{profile.collaboration_needs && profile.collaboration_needs.length > 2 && (
															<Badge variant='outline'>+{profile.collaboration_needs.length - 2}</Badge>
														)}
													</div>
												</div>
												<div className='mt-4 sm:mt-0 flex space-x-2'>
													<Button variant='outline' size='sm' asChild>
														<Link href={`/profile/${profile.id}`}>View Profile</Link>
													</Button>
													<Button
														size='sm'
														onClick={() => sendConnectionRequest(profile.id)}
														disabled={sendingConnection === profile.id}>
														{sendingConnection === profile.id ? "Sending..." : "Connect"}
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
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
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
