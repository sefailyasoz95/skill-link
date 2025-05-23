"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Edit,
	MessageSquare,
	User as UserIcon,
	UserPlus,
	Eye,
	Clock,
	Activity,
	TrendingUp,
	ChevronRight,
	Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import type { User, ProfileView, ConnectionStatus, Application, Project } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-server";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
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
import { useRef } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

// Custom type for using Connection with different field names and extended user objects
type ConnectionWithUser = {
	id: string;
	status: ConnectionStatus;
	created_at: string;
	user_a: string; // Connection.user_a (instead of userA)
	user_b: string; // Connection.user_b (instead of userB)
	connected_user?: User; // Extended to include full User object
	requesting_user?: User; // For pending connections
};

function ReplyToApplicationDialog({ application, onReplied }: { application: Application; onReplied: () => void }) {
	const [open, setOpen] = useState(false);
	const [status, setStatus] = useState<string>("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	const messageRef = useRef<HTMLTextAreaElement>(null);

	const handleSend = async () => {
		if (!status || !message.trim()) return;
		setLoading(true);
		try {
			// 1. Update application status
			const { error: updateError } = await supabase
				.from("applications")
				.update({ status, updated_at: new Date().toISOString() })
				.eq("id", application.id);
			if (updateError) throw updateError;

			// 2. Find or create a chat between owner and applicant
			// Check for existing 1-on-1 chat
			let chatId: string | null = null;
			const { data: existingChats } = await supabase
				.from("chats")
				.select("id")
				.eq("is_group", false)
				.in(
					"id",
					(
						await supabase
							.from("chat_members")
							.select("chat_id")
							.in("user_id", [application.applicant_id, application.project?.user_id])
					).data?.map((cm: any) => cm.chat_id) || []
				);
			if (existingChats && existingChats.length > 0) {
				chatId = existingChats[0].id;
			} else {
				// Create new chat
				const { data: newChat, error: chatError } = await supabase
					.from("chats")
					.insert({ is_group: false, created_at: new Date().toISOString() })
					.select()
					.single();
				if (chatError) throw chatError;
				chatId = newChat.id;
				// Add both users as chat members
				await supabase.from("chat_members").insert([
					{ chat_id: chatId, user_id: application.applicant_id, joined_at: new Date().toISOString() },
					{ chat_id: chatId, user_id: application.project?.user_id, joined_at: new Date().toISOString() },
				]);
			}
			// 3. Send message
			await supabase.from("messages").insert({
				chat_id: chatId,
				sender_id: application.project?.user_id,
				content: `Your application was ${status}.\n\nMessage from project owner: ${message}`,
				sent_at: new Date().toISOString(),
			});
			toast({ title: "Reply sent", description: `Application marked as ${status}. Message sent to applicant.` });
			setOpen(false);
			setStatus("");
			setMessage("");
			onReplied();
		} catch (error: any) {
			toast({ title: "Error", description: error.message || "Failed to reply.", variant: "destructive" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size='sm' variant='outline' onClick={() => setOpen(true)}>
					Reply
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reply to Application</DialogTitle>
					<DialogDescription>
						Select a status and explain your decision to the applicant. A message is required.
					</DialogDescription>
				</DialogHeader>
				<div className='space-y-4'>
					<Select value={status} onValueChange={setStatus} disabled={loading}>
						<SelectTrigger>
							<SelectValue placeholder='Select status' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='accepted'>Accept</SelectItem>
							<SelectItem value='rejected'>Decline</SelectItem>
						</SelectContent>
					</Select>
					<Textarea
						ref={messageRef}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder='Explain your decision...'
						minLength={10}
						maxLength={500}
						disabled={loading}
						required
					/>
				</div>
				<DialogFooter>
					<Button onClick={handleSend} disabled={loading || !status || message.trim().length < 10}>
						{loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
						Send
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function DashboardPage() {
	const { user: profile, isLoading: authLoading } = useAuth();
	const [connections, setConnections] = useState<ConnectionWithUser[]>([]);
	const [pendingConnections, setPendingConnections] = useState<ConnectionWithUser[]>([]);
	const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
	const [loadingData, setLoadingData] = useState(true);
	const [receivedApplications, setReceivedApplications] = useState<Application[]>([]);
	const [myApplications, setMyApplications] = useState<Application[]>([]);

	const { toast } = useToast();
	const router = useRouter();

	const fetchUserDashboardData = async () => {
		try {
			if (!profile?.id) return;

			setLoadingData(true);

			// 3. Fetch profile views (who viewed current user's profile)
			const { data: viewsData, error: viewsError } = await supabase
				.from("profile_views")
				.select(
					`
          id,
          viewer_id,
          viewed_user_id,
          viewed_at,
          viewer:viewer_id (
            id,
            full_name,
            profile_picture,
            location
          )
        `
				)
				.eq("viewed_user_id", profile.id)
				.order("viewed_at", { ascending: false })
				.limit(5);

			if (viewsError) throw viewsError;

			// 4. Fetch connections
			// First, fetch connections where user is user_a
			const { data: connectionsAsA, error: errorAsA } = await supabase
				.from("connections")
				.select(
					`
          id,
          status,
          created_at,
          user_a,
          user_b,
          connected_user:user_b (
            id,
            full_name,
            profile_picture,
            location
          )
        `
				)
				.eq("user_a", profile.id)
				.eq("status", "accepted");

			if (errorAsA) throw errorAsA;

			// Next, fetch connections where user is user_b
			const { data: connectionsAsB, error: errorAsB } = await supabase
				.from("connections")
				.select(
					`
          id,
          status,
          created_at,
          user_a,
          user_b,
          connected_user:user_a (
            id,
            full_name,
            profile_picture,
            location
          )
        `
				)
				.eq("user_b", profile.id)
				.eq("status", "accepted");

			if (errorAsB) throw errorAsB;

			// 5. Fetch pending connections (connection requests)
			const { data: pendingRequests, error: pendingError } = await supabase
				.from("connections")
				.select(
					`
          id,
          status,
          created_at,
          user_a,
          user_b,
          requesting_user:user_a (
            id,
            full_name,
            profile_picture,
            location
          )
        `
				)
				.eq("user_b", profile.id)
				.eq("status", "pending");

			if (pendingError) throw pendingError;

			// Fix the connections data typing
			const processedConnections: any[] = [
				...(connectionsAsA
					? connectionsAsA.map((conn: any) => {
							const userObject =
								conn.connected_user && !Array.isArray(conn.connected_user)
									? conn.connected_user
									: Array.isArray(conn.connected_user) && conn.connected_user.length > 0
									? conn.connected_user[0]
									: null;

							return {
								id: conn.id,
								status: conn.status as ConnectionStatus,
								created_at: conn.created_at,
								user_a: conn.user_a,
								user_b: conn.user_b,
								connected_user: userObject
									? {
											id: userObject.id,
											full_name: userObject.full_name,
											profile_picture: userObject.profile_picture,
											location: userObject.location,
											username: userObject.username || null,
											bio: userObject.bio || null,
											availability: userObject.availability || null,
											created_at: userObject.created_at || conn.created_at,
									  }
									: undefined,
							};
					  })
					: []),
				...(connectionsAsB
					? connectionsAsB.map((conn: any) => {
							const userObject =
								conn.connected_user && !Array.isArray(conn.connected_user)
									? conn.connected_user
									: Array.isArray(conn.connected_user) && conn.connected_user.length > 0
									? conn.connected_user[0]
									: null;

							return {
								id: conn.id,
								status: conn.status as ConnectionStatus,
								created_at: conn.created_at,
								user_a: conn.user_a,
								user_b: conn.user_b,
								connected_user: userObject
									? {
											id: userObject.id,
											full_name: userObject.full_name,
											profile_picture: userObject.profile_picture,
											location: userObject.location,
											username: userObject.username || null,
											bio: userObject.bio || null,
											availability: userObject.availability || null,
											created_at: userObject.created_at || conn.created_at,
									  }
									: undefined,
							};
					  })
					: []),
			];

			// Fix the profile views data typing
			const formattedViews: any[] = viewsData
				? viewsData.map((view: any) => {
						const viewerObject =
							view.viewer && !Array.isArray(view.viewer)
								? view.viewer
								: Array.isArray(view.viewer) && view.viewer.length > 0
								? view.viewer[0]
								: null;

						return {
							id: view.id,
							viewer_id: view.viewer_id,
							viewed_user_id: view.viewed_user_id,
							viewed_at: view.viewed_at,
							viewer: viewerObject
								? {
										id: viewerObject.id,
										full_name: viewerObject.full_name,
										profile_picture: viewerObject.profile_picture,
										location: viewerObject.location,
										username: viewerObject.username || null,
										bio: viewerObject.bio || null,
										availability: viewerObject.availability || null,
										created_at: viewerObject.created_at || view.viewed_at,
								  }
								: undefined,
						};
				  })
				: [];

			// Fix the pending connections data typing
			const formattedPendingConnections: any[] = pendingRequests
				? pendingRequests.map((conn: any) => {
						const userObject =
							conn.requesting_user && !Array.isArray(conn.requesting_user)
								? conn.requesting_user
								: Array.isArray(conn.requesting_user) && conn.requesting_user.length > 0
								? conn.requesting_user[0]
								: null;

						return {
							id: conn.id,
							status: conn.status as ConnectionStatus,
							created_at: conn.created_at,
							user_a: conn.user_a,
							user_b: conn.user_b,
							requesting_user: userObject
								? {
										id: userObject.id,
										full_name: userObject.full_name,
										profile_picture: userObject.profile_picture,
										location: userObject.location,
										username: userObject.username || null,
										bio: userObject.bio || null,
										availability: userObject.availability || null,
										created_at: userObject.created_at || conn.created_at,
								  }
								: undefined,
						};
				  })
				: [];

			setProfileViews(formattedViews);
			setConnections(processedConnections);
			setPendingConnections(formattedPendingConnections);
		} catch (error: any) {
			toast({
				title: "Error loading dashboard",
				description: error.message || "Failed to load dashboard data",
				variant: "destructive",
			});
		} finally {
			setLoadingData(false);
		}
	};

	// Fetch applications for the dashboard
	const fetchApplications = async () => {
		if (!profile?.id) return;
		// Received Applications: where user owns the project
		const { data: received, error: receivedError } = await supabase
			.from("applications")
			.select(
				`
          id,
          applicant_id,
          project_id,
          created_at,
          updated_at,
          status,
          description,
          applicant:applicant_id (id, full_name, profile_picture),
          project:project_id (id, title, user_id)
        `
			)
			.in(
				"project_id",
				(await supabase.from("projects").select("id").eq("user_id", profile.id)).data?.map((p: any) => p.id) || []
			);

		// My Applications: where user is the applicant
		const { data: mine, error: myError } = await supabase
			.from("applications")
			.select(
				`
          id,
          applicant_id,
          project_id,
          created_at,
          updated_at,
          status,
          description,
          project:project_id (id, title, user_id)
        `
			)
			.eq("applicant_id", profile.id);

		if (!receivedError && received) {
			setReceivedApplications(
				received.map((app: any) => ({
					...app,
					applicant: Array.isArray(app.applicant) ? app.applicant[0] : app.applicant,
					project: Array.isArray(app.project) ? app.project[0] : app.project,
				}))
			);
		}
		if (!myError && mine) {
			setMyApplications(
				mine.map((app: any) => ({
					...app,
					project: Array.isArray(app.project) ? app.project[0] : app.project,
				}))
			);
		}
	};

	useEffect(() => {
		if (authLoading) return;
		if (!profile) {
			router.push("/auth/signin");
			return;
		}
		fetchUserDashboardData();
		fetchApplications();
	}, [profile, authLoading, router]);

	const handleConnectionResponse = async (connectionId: string, accept: boolean) => {
		try {
			const { error } = await supabase
				.from("connections")
				.update({
					status: accept ? "accepted" : "rejected",
				})
				.eq("id", connectionId);

			if (error) throw error;

			toast({
				title: accept ? "Connection accepted" : "Connection declined",
				description: accept ? "You can now message this connection" : "The connection request has been declined",
			});

			// Update the UI
			if (accept) {
				const accepted = pendingConnections.find((c) => c.id === connectionId);
				if (accepted) {
					// Format the accepted connection to match our connections format
					const newConnection: ConnectionWithUser = {
						id: accepted.id,
						status: "accepted",
						created_at: accepted.created_at,
						user_a: accepted.user_a,
						user_b: accepted.user_b,
						connected_user: accepted.requesting_user,
					};
					setConnections([...connections, newConnection]);
				}
			}

			setPendingConnections(pendingConnections.filter((c) => c.id !== connectionId));
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		}
	};

	// Animation variants
	const fadeIn = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { duration: 0.5 },
		},
	};

	const slideUp = {
		hidden: { y: 20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: { type: "spring", stiffness: 300, damping: 30 },
		},
	};

	const staggerContainer = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const cardHover = {
		rest: { scale: 1 },
		hover: {
			scale: 1.02,
			boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
			transition: { duration: 0.2 },
		},
	};

	if (authLoading) {
		return (
			<div className='container py-10 flex flex-col items-center justify-center min-h-[50vh]'>
				<div className='border-b-2 border-b-foreground rounded-b-full animate-spin w-14 h-14' />
				<p className='mt-4 text-muted-foreground'>Loading dashboard...</p>
			</div>
		);
	}

	return (
		<motion.div className='container py-8 px-4 md:py-10 md:px-6' initial='hidden' animate='visible' variants={fadeIn}>
			<div className='mx-auto max-w-5xl space-y-8'>
				<motion.div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4' variants={slideUp}>
					<h1 className='text-2xl md:text-3xl font-bold tracking-tight'>Dashboard</h1>
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
						<Button asChild>
							<Link href='/profile/edit'>
								<Edit className='mr-2 h-4 w-4' />
								Edit Profile
							</Link>
						</Button>
					</motion.div>
				</motion.div>

				<motion.div className='grid gap-6 md:grid-cols-1' variants={staggerContainer}>
					{/* Profile Overview */}
					<motion.div variants={slideUp}>
						<motion.div initial='rest' whileHover='hover' animate='rest' variants={cardHover}>
							<Card className='overflow-hidden'>
								<CardHeader className='pb-2'>
									<CardTitle>Profile Overview</CardTitle>
									<CardDescription>Your public profile information</CardDescription>
								</CardHeader>
								<CardContent>
									{loadingData ? (
										<div className='space-y-4'>
											<Skeleton className='h-12 w-12 rounded-full' />
											<Skeleton className='h-4 w-[250px]' />
											<Skeleton className='h-20 w-full' />
											<Skeleton className='h-8 w-full' />
										</div>
									) : profile ? (
										<div className='space-y-4'>
											<div className='flex items-center space-x-4'>
												<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden'>
													{profile.profile_picture ? (
														<Image
															src={profile.profile_picture}
															alt={profile.full_name || "Profile"}
															className='h-full w-full object-cover'
															width={48}
															height={48}
														/>
													) : (
														<UserIcon className='h-6 w-6 text-primary' />
													)}
												</div>
												<div>
													<p className='font-medium'>{profile.full_name || "Complete your profile"}</p>
													<p className='text-sm text-muted-foreground'>
														{profile.location || "Add your location to get better matches"}
													</p>
												</div>
											</div>

											{!profile.skills && (
												<div className='rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'>
													<p className='text-sm'>
														Complete your profile to increase your chances of finding collaborators.
													</p>
												</div>
											)}

											<div>
												<h3 className='font-medium mb-2'>Skills</h3>
												<div className='flex flex-wrap gap-2'>
													{profile?.skills?.length ? (
														profile?.skills.map((skill, index) => (
															<motion.span
																key={index}
																className='inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
																initial={{ opacity: 0, scale: 0.8 }}
																animate={{ opacity: 1, scale: 1 }}
																transition={{ delay: index * 0.1 }}
																whileHover={{ scale: 1.1 }}>
																{skill}
															</motion.span>
														))
													) : (
														<p className='text-sm text-muted-foreground'>No skills added yet</p>
													)}
												</div>
											</div>

											<div>
												<h3 className='font-medium mb-2'>Looking For</h3>
												<div className='flex flex-wrap gap-2'>
													{profile?.looking_for?.length ? (
														profile?.looking_for?.map((looking, index) => (
															<motion.span
																key={index}
																className='inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
																initial={{ opacity: 0, scale: 0.8 }}
																animate={{ opacity: 1, scale: 1 }}
																transition={{ delay: index * 0.1 }}
																whileHover={{ scale: 1.1 }}>
																{looking}
															</motion.span>
														))
													) : (
														<p className='text-sm text-muted-foreground'>No collaboration needs specified</p>
													)}
												</div>
											</div>
											<div>
												<h3 className='font-medium mb-2'>Conditions</h3>
												<div className='flex flex-wrap gap-2'>
													{profile?.conditions?.length ? (
														profile?.conditions?.map((condition, index) => (
															<motion.span
																key={index}
																className='inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
																initial={{ opacity: 0, scale: 0.8 }}
																animate={{ opacity: 1, scale: 1 }}
																transition={{ delay: index * 0.1 }}
																whileHover={{ scale: 1.1 }}>
																{condition}
															</motion.span>
														))
													) : (
														<p className='text-sm text-muted-foreground'>No conditions specified</p>
													)}
												</div>
											</div>
											<div className='flex justify-end'>
												<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
													<Button asChild variant='outline' size='sm'>
														<Link href='/profile'>
															View Full Profile
															<ChevronRight className='ml-1 h-4 w-4' />
														</Link>
													</Button>
												</motion.div>
											</div>
										</div>
									) : (
										<div className='text-center py-4'>
											<p className='text-muted-foreground'>Let's create your profile to get started.</p>
											<Button asChild className='mt-4'>
												<Link href='/profile/create'>Create Profile</Link>
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>
					{/* Applications Tabs */}
					<motion.div variants={slideUp}>
						<Tabs defaultValue='received' className='w-full mb-8'>
							<TabsList className='mb-4'>
								<TabsTrigger value='received'>
									Received Applications
									{receivedApplications.filter((a) => a.status === "pending").length > 0 && (
										<Badge className='ml-2 bg-primary text-white'>
											{receivedApplications.filter((a) => a.status === "pending").length}
										</Badge>
									)}
								</TabsTrigger>
								<TabsTrigger value='my'>My Applications</TabsTrigger>
							</TabsList>
							<TabsContent value='received'>
								{loadingData ? (
									<div className='grid gap-4 md:grid-cols-2'>
										{[1, 2].map((i) => (
											<Skeleton key={i} className='h-[120px] w-full' />
										))}
									</div>
								) : receivedApplications.length > 0 ? (
									<div className='grid gap-4 md:grid-cols-2'>
										{receivedApplications.map((app) => (
											<Card key={app.id} className='overflow-hidden'>
												<CardContent className='p-4'>
													<div className='flex flex-col gap-2'>
														<div className='flex items-center gap-2'>
															<span className='font-medium'>Project:</span> {app.project?.title}
														</div>
														<div className='flex items-center gap-2'>
															<Link href={`/profile/${app.applicant?.id}`} className='hover:underline'>
																<span className='font-medium'>Applicant:</span> {app.applicant?.full_name}
															</Link>
														</div>
														<div className='flex items-center gap-2'>
															<span className='font-medium'>Status:</span>{" "}
															<Badge variant={app.status === "pending" ? "secondary" : "outline"}>{app.status}</Badge>
														</div>
														<div className='text-xs text-muted-foreground'>{app.description}</div>
														<div className='text-xs text-muted-foreground'>
															Applied: {new Date(app.created_at).toLocaleString()}
														</div>
														{app.status === "pending" && (
															<ReplyToApplicationDialog application={app} onReplied={fetchApplications} />
														)}
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								) : (
									<div className='text-center text-muted-foreground'>No received applications.</div>
								)}
							</TabsContent>
							<TabsContent value='my'>
								{loadingData ? (
									<div className='grid gap-4 md:grid-cols-2'>
										{[1, 2].map((i) => (
											<Skeleton key={i} className='h-[120px] w-full' />
										))}
									</div>
								) : myApplications.length > 0 ? (
									<div className='grid gap-4 md:grid-cols-2'>
										{myApplications.map((app) => (
											<Card key={app.id} className='overflow-hidden'>
												<CardContent className='p-4'>
													<div className='flex flex-col gap-2'>
														<div className='flex items-center gap-2'>
															<span className='font-medium'>Project:</span> {app.project?.title}
														</div>
														<div className='flex items-center gap-2'>
															<span className='font-medium'>Status:</span>{" "}
															<Badge variant={app.status === "pending" ? "secondary" : "outline"}>{app.status}</Badge>
														</div>
														<div className='text-xs text-muted-foreground'>{app.description}</div>
														<div className='text-xs text-muted-foreground'>
															Applied: {new Date(app.created_at).toLocaleString()}
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								) : (
									<div className='text-center text-muted-foreground'>No applications submitted.</div>
								)}
							</TabsContent>
						</Tabs>
					</motion.div>
					{/* Connections and Requests */}
					<motion.div variants={slideUp}>
						<Tabs defaultValue='connections' className='w-full'>
							<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
								<TabsList className='mb-4'>
									<TabsTrigger value='connections'>My Connections</TabsTrigger>
									<TabsTrigger value='requests'>
										Connection Requests
										{pendingConnections.length > 0 && (
											<motion.span
												className='ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white dark:text-black'
												initial={{ scale: 0 }}
												animate={{ scale: 1 }}
												transition={{
													type: "spring",
													stiffness: 300,
													damping: 20,
												}}>
												{pendingConnections.length}
											</motion.span>
										)}
									</TabsTrigger>
								</TabsList>
								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									<Button asChild variant='outline' size='sm'>
										<Link href='/search'>
											<UserIcon className='mr-2 h-4 w-4' />
											Find More
										</Link>
									</Button>
								</motion.div>
							</div>

							<TabsContent value='connections'>
								{loadingData ? (
									<div className='grid gap-4 md:grid-cols-2'>
										{[1, 2, 3, 4].map((i) => (
											<Skeleton key={i} className='h-[140px] w-full' />
										))}
									</div>
								) : connections.length > 0 ? (
									<motion.div
										className='grid gap-4 md:grid-cols-2'
										variants={staggerContainer}
										initial='hidden'
										animate='visible'>
										{connections.map((connection, index) => (
											<motion.div
												key={connection.id}
												variants={slideUp}
												custom={index}
												whileHover={{ y: -5, transition: { duration: 0.2 } }}>
												<Card className='overflow-hidden transition-all hover:shadow-md'>
													<CardContent className='p-4'>
														<div className='flex items-start space-x-4'>
															<div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden'>
																{connection.connected_user?.profile_picture ? (
																	<img
																		src={connection.connected_user.profile_picture}
																		alt={connection.connected_user.full_name || "Profile"}
																		className='h-full w-full object-cover'
																	/>
																) : (
																	<UserIcon className='h-5 w-5 text-primary' />
																)}
															</div>
															<div className='flex-1 space-y-1'>
																<p className='font-medium'>{connection.connected_user?.full_name || "Unnamed User"}</p>
																<p className='text-xs text-muted-foreground'>
																	{connection.connected_user?.location || "No location specified"}
																</p>
															</div>
														</div>
														<div className='mt-4 flex items-center justify-end space-x-2'>
															<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
																<Button asChild variant='outline' size='sm'>
																	<Link href={`/profile/${connection.connected_user?.id}`}>View Profile</Link>
																</Button>
															</motion.div>
															<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
																<Button asChild size='sm'>
																	<Link href={`/messages/${connection.connected_user?.id}`}>
																		<MessageSquare className='mr-2 h-4 w-4' />
																		Message
																	</Link>
																</Button>
															</motion.div>
														</div>
													</CardContent>
												</Card>
											</motion.div>
										))}
									</motion.div>
								) : (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ duration: 0.5 }}
										className='rounded-lg border border-dashed p-8 text-center'>
										<h3 className='font-medium'>No connections yet</h3>
										<p className='mt-1 text-sm text-muted-foreground'>
											Start by searching for collaborators with the skills you need
										</p>
										<motion.div className='mt-4 inline-block' whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
											<Button asChild>
												<Link href='/search'>Find Collaborators</Link>
											</Button>
										</motion.div>
									</motion.div>
								)}
							</TabsContent>

							<TabsContent value='requests'>
								{loadingData ? (
									<div className='grid gap-4 md:grid-cols-2'>
										{[1, 2].map((i) => (
											<Skeleton key={i} className='h-[140px] w-full' />
										))}
									</div>
								) : pendingConnections.length > 0 ? (
									<motion.div
										className='grid gap-4 md:grid-cols-2'
										variants={staggerContainer}
										initial='hidden'
										animate='visible'>
										{pendingConnections.map((connection, index) => (
											<motion.div
												key={connection.id}
												variants={slideUp}
												custom={index}
												whileHover={{ y: -5, transition: { duration: 0.2 } }}>
												<Card className='overflow-hidden transition-all hover:shadow-md'>
													<CardContent className='p-4'>
														<div className='flex items-start space-x-4'>
															<div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden'>
																{connection.requesting_user?.profile_picture ? (
																	<img
																		src={connection.requesting_user.profile_picture}
																		alt={connection.requesting_user.full_name || "Profile"}
																		className='h-full w-full object-cover'
																	/>
																) : (
																	<UserIcon className='h-5 w-5 text-primary' />
																)}
															</div>
															<div className='flex-1 space-y-1'>
																<Link
																	href={`/profile/${connection.requesting_user?.id}`}
																	className='cursor-pointer hover:underline'>
																	<p className='font-medium'>
																		{connection.requesting_user?.full_name || "Unnamed User"}
																	</p>
																</Link>
																<p className='text-xs text-muted-foreground'>
																	{connection.requesting_user?.location || "No location specified"}
																</p>
															</div>
														</div>
														<div className='mt-4 flex items-center justify-end space-x-2'>
															<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
																<Button
																	variant='outline'
																	size='sm'
																	onClick={() => handleConnectionResponse(connection.id, false)}
																	className='hover:bg-destructive/10 transition-colors'>
																	Decline
																</Button>
															</motion.div>
															<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
																<Button
																	size='sm'
																	onClick={() => handleConnectionResponse(connection.id, true)}
																	className='hover:bg-primary/90 transition-colors'>
																	Accept
																</Button>
															</motion.div>
														</div>
													</CardContent>
												</Card>
											</motion.div>
										))}
									</motion.div>
								) : (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ duration: 0.5 }}
										className='rounded-lg border border-dashed p-8 text-center'>
										<h3 className='font-medium'>No pending requests</h3>
										<p className='mt-1 text-sm text-muted-foreground'>
											When someone wants to connect with you, you'll see their request here
										</p>
									</motion.div>
								)}
							</TabsContent>
						</Tabs>
					</motion.div>
					{/* Activity & Stats */}
					<motion.div variants={slideUp}>
						<motion.div initial='rest' whileHover='hover' animate='rest' variants={cardHover}>
							<Card className='overflow-hidden'>
								<CardHeader className='pb-2'>
									<CardTitle>Activity Overview</CardTitle>
									<CardDescription>Recent profile views and activity</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									{loadingData ? (
										<div className='space-y-4'>
											<Skeleton className='h-20 w-full' />
											<Skeleton className='h-20 w-full' />
										</div>
									) : (
										<>
											<div className='grid grid-cols-2 gap-4'>
												<motion.div
													className='flex flex-col space-y-1 rounded-lg border p-4'
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: 0.2 }}>
													<div className='flex items-center text-muted-foreground'>
														<Eye className='mr-1 h-4 w-4' />
														<span className='text-xs'>Profile Views</span>
													</div>
													<p className='text-2xl font-bold'>{profileViews.length}</p>
												</motion.div>
												<motion.div
													className='flex flex-col space-y-1 rounded-lg border p-4'
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: 0.3 }}>
													<div className='flex items-center text-muted-foreground'>
														<Activity className='mr-1 h-4 w-4' />
														<span className='text-xs'>Connections</span>
													</div>
													<p className='text-2xl font-bold'>{connections.length}</p>
												</motion.div>
											</div>

											<div>
												<h3 className='text-sm font-medium mb-2 flex items-center'>
													<TrendingUp className='mr-1 h-4 w-4 text-muted-foreground' />
													Recent Profile Visitors
												</h3>
												{profileViews.length > 0 ? (
													<motion.div
														className='space-y-3'
														variants={staggerContainer}
														initial='hidden'
														animate='visible'>
														{profileViews.slice(0, 3).map((view, index) => (
															<motion.div
																key={view.id}
																className='flex items-center justify-between'
																variants={slideUp}
																custom={index}
																transition={{ delay: index * 0.1 }}>
																<div className='flex items-center space-x-2'>
																	<div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden'>
																		{view.viewer?.profile_picture ? (
																			<img
																				src={view.viewer.profile_picture}
																				alt={view.viewer.full_name || "Profile"}
																				className='h-full w-full object-cover'
																			/>
																		) : (
																			<UserIcon className='h-4 w-4 text-primary' />
																		)}
																	</div>
																	<div>
																		<p className='text-sm font-medium'>{view.viewer?.full_name || "Anonymous User"}</p>
																		<p className='text-xs text-muted-foreground'>
																			{view.viewed_at
																				? formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })
																				: ""}
																		</p>
																	</div>
																</div>
																<motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
																	<Button asChild variant='ghost' size='sm'>
																		<Link href={`/profile/${view.viewer?.id}`}>View</Link>
																	</Button>
																</motion.div>
															</motion.div>
														))}
													</motion.div>
												) : (
													<p className='text-sm text-muted-foreground'>No profile views yet</p>
												)}
											</div>
										</>
									)}
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>
				</motion.div>

				{/* Quick Actions */}
				<motion.div variants={slideUp}>
					<motion.div initial='rest' whileHover='hover' animate='rest' variants={cardHover}>
						<Card className='overflow-hidden'>
							<CardHeader className='pb-2'>
								<CardTitle>Quick Actions</CardTitle>
								<CardDescription>Common tasks to help you get started</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
									<motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
										<Button
											asChild
											variant='outline'
											className='h-auto flex-col items-start p-4 hover:bg-muted/50 transition-colors w-full'>
											<Link href='/search'>
												<div className='flex flex-col items-start gap-1'>
													<UserPlus className='h-5 w-5 text-primary' />
													<span className='text-sm font-medium'>Find Collaborators</span>
													<span className='text-xs text-muted-foreground'>Search for skills you need</span>
												</div>
											</Link>
										</Button>
									</motion.div>
									<motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
										<Button
											asChild
											variant='outline'
											className='h-auto flex-col items-start p-4 hover:bg-muted/50 transition-colors w-full'>
											<Link href='/messages'>
												<div className='flex flex-col items-start gap-1'>
													<MessageSquare className='h-5 w-5 text-primary' />
													<span className='text-sm font-medium'>Messages</span>
													<span className='text-xs text-muted-foreground'>Chat with connections</span>
												</div>
											</Link>
										</Button>
									</motion.div>
									<motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
										<Button
											asChild
											variant='outline'
											className='h-auto flex-col items-start p-4 hover:bg-muted/50 transition-colors w-full'>
											<Link href='/profile/edit'>
												<div className='flex flex-col items-start gap-1'>
													<Edit className='h-5 w-5 text-primary' />
													<span className='text-sm font-medium'>Edit Profile</span>
													<span className='text-xs text-muted-foreground'>Update your information</span>
												</div>
											</Link>
										</Button>
									</motion.div>
									<motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
										<Button
											asChild
											variant='outline'
											className='h-auto flex-col items-start p-4 hover:bg-muted/50 transition-colors w-full'>
											<Link href='/how-it-works'>
												<div className='flex flex-col items-start gap-1'>
													<Clock className='h-5 w-5 text-primary' />
													<span className='text-sm font-medium'>How It Works</span>
													<span className='text-xs text-muted-foreground'>Learn about SkillLink</span>
												</div>
											</Link>
										</Button>
									</motion.div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</motion.div>
			</div>
		</motion.div>
	);
}
