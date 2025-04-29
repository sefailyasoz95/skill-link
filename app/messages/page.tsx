"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Search, User, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
	id: string;
	full_name: string | null;
	avatar_url: string | null;
};

type Message = {
	id: string;
	created_at: string;
	sender_id: string;
	recipient_id: string;
	content: string;
	read: boolean;
};

type Conversation = {
	profile: Profile;
	lastMessage: {
		content: string;
		created_at: string;
		is_sender: boolean;
		read: boolean;
	};
	unreadCount: number;
};

export default function MessagesPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
	const [connections, setConnections] = useState<Profile[]>([]);
	const [loading, setLoading] = useState(true);

	const { user } = useAuth();
	const router = useRouter();
	const { toast } = useToast();

	useEffect(() => {
		if (!user) {
			router.push("/auth/signin");
			return;
		}

		const fetchConversations = async () => {
			try {
				// Fetch all messages where the user is either sender or recipient
				const { data: messagesData, error: messagesError } = await supabase
					.from("messages")
					.select("*")
					.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
					.order("created_at", { ascending: false });

				if (messagesError) throw messagesError;

				// Get unique user IDs from the messages (excluding the current user)
				const userIds = new Set<string>();
				messagesData?.forEach((msg) => {
					if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
					if (msg.recipient_id !== user.id) userIds.add(msg.recipient_id);
				});

				// Fetch profiles for these users
				if (userIds.size > 0) {
					const { data: profilesData, error: profilesError } = await supabase
						.from("profiles")
						.select("id, full_name, avatar_url")
						.in("id", Array.from(userIds));

					if (profilesError) throw profilesError;

					// Create conversations based on the last message
					const conversationsMap = new Map<string, Conversation>();
					const profiles = profilesData || [];

					messagesData?.forEach((message) => {
						const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
						const profile = profiles.find((p) => p.id === otherUserId);

						if (!profile) return;

						if (!conversationsMap.has(otherUserId)) {
							conversationsMap.set(otherUserId, {
								profile,
								lastMessage: {
									content: message.content,
									created_at: message.created_at,
									is_sender: message.sender_id === user.id,
									read: message.read,
								},
								unreadCount: message.sender_id !== user.id && !message.read ? 1 : 0,
							});
						} else if (message.sender_id !== user.id && !message.read) {
							// Count unread messages
							const conversation = conversationsMap.get(otherUserId)!;
							conversation.unreadCount++;
							conversationsMap.set(otherUserId, conversation);
						}
					});

					const sortedConversations = Array.from(conversationsMap.values()).sort((a, b) => {
						return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
					});

					setConversations(sortedConversations);
					setFilteredConversations(sortedConversations);
				}

				// Fetch all connections to display in the "New Message" tab
				const { data: connectionsData, error: connectionsError } = await supabase
					.from("connections")
					.select(
						`
            user_id_1, user_id_2,
            profiles!connections_user_id_2_fkey (id, full_name, avatar_url)
          `
					)
					.eq("user_id_1", user.id)
					.eq("status", "connected");

				if (connectionsError) throw connectionsError;

				// Also fetch connections where the user is user_id_2
				const { data: connectionsData2, error: connectionsError2 } = await supabase
					.from("connections")
					.select(
						`
            user_id_1, user_id_2,
            profiles!connections_user_id_1_fkey (id, full_name, avatar_url)
          `
					)
					.eq("user_id_2", user.id)
					.eq("status", "connected");

				if (connectionsError2) throw connectionsError2;

				// Combine and deduplicate connections
				const allConnections: Profile[] = [];
				connectionsData?.forEach((conn) => {
					if (conn.profiles) {
						// allConnections.push(conn.profiles as Profile);
					}
				});

				connectionsData2?.forEach((conn) => {
					if (conn.profiles) {
						// allConnections.push(conn.profiles as Profile);
					}
				});

				// Remove duplicates
				const uniqueConnections = allConnections.filter(
					(conn, index, self) => index === self.findIndex((c) => c.id === conn.id)
				);

				setConnections(uniqueConnections);
			} catch (error: any) {
				toast({
					title: "Error fetching messages",
					description: error.message,
					variant: "destructive",
				});
			} finally {
				setLoading(false);
			}
		};

		fetchConversations();

		// Set up a real-time subscription for new messages
		const messagesSubscription = supabase
			.channel("messages-channel")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "messages",
					filter: `recipient_id=eq.${user.id}`,
				},
				() => {
					// Refresh conversations when a new message is received
					fetchConversations();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(messagesSubscription);
		};
	}, [user, router, toast]);

	// Filter conversations when search query changes
	useEffect(() => {
		if (!conversations.length) return;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			const filtered = conversations.filter(
				(conv) =>
					conv.profile.full_name?.toLowerCase().includes(query) ||
					conv.lastMessage.content.toLowerCase().includes(query)
			);
			setFilteredConversations(filtered);
		} else {
			setFilteredConversations(conversations);
		}
	}, [searchQuery, conversations]);

	return (
		<div className='container py-10'>
			<div className='mx-auto max-w-5xl space-y-8'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Messages</h1>
					<p className='text-muted-foreground mt-2'>Chat with your connections and collaborate on projects</p>
				</div>

				<Tabs defaultValue='conversations'>
					<div className='flex items-center justify-between mb-4'>
						<TabsList>
							<TabsTrigger value='conversations'>
								Conversations
								{conversations.reduce((sum, conv) => sum + conv.unreadCount, 0) > 0 && (
									<span className='ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white'>
										{conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
									</span>
								)}
							</TabsTrigger>
							<TabsTrigger value='new'>New Message</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value='conversations'>
						<div className='relative'>
							<Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
							<Input
								placeholder='Search conversations...'
								className='pl-9 mb-4'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{loading ? (
							<div className='space-y-3'>
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className='flex items-center space-x-4 rounded-lg border p-4'>
										<Skeleton className='h-12 w-12 rounded-full' />
										<div className='space-y-2 flex-1'>
											<Skeleton className='h-4 w-[200px]' />
											<Skeleton className='h-3 w-[300px]' />
										</div>
									</div>
								))}
							</div>
						) : filteredConversations.length > 0 ? (
							<div className='space-y-3'>
								{filteredConversations.map((conversation) => (
									<Link key={conversation.profile.id} href={`/messages/${conversation.profile.id}`} className='block'>
										<div
											className={`flex items-start space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
												conversation.unreadCount > 0 ? "bg-primary/5" : ""
											}`}>
											<div className='relative'>
												<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
													{conversation.profile.avatar_url ? (
														<img
															src={conversation.profile.avatar_url}
															alt={conversation.profile.full_name || "Profile"}
															className='h-12 w-12 rounded-full object-cover'
														/>
													) : (
														<User className='h-6 w-6 text-primary' />
													)}
												</div>
												{conversation.unreadCount > 0 && (
													<span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white'>
														{conversation.unreadCount}
													</span>
												)}
											</div>
											<div className='flex-1 space-y-1'>
												<div className='flex items-center justify-between'>
													<p
														className={`font-medium ${
															conversation.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
														}`}>
														{conversation.profile.full_name || "Unnamed User"}
													</p>
													<p className='text-xs text-muted-foreground'>
														{formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })}
													</p>
												</div>
												<p
													className={`text-sm line-clamp-1 ${
														conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
													}`}>
													{conversation.lastMessage.is_sender ? (
														<span>You: {conversation.lastMessage.content}</span>
													) : (
														conversation.lastMessage.content
													)}
												</p>
											</div>
										</div>
									</Link>
								))}
							</div>
						) : (
							<Card>
								<CardContent className='flex flex-col items-center justify-center p-6'>
									<MessageSquare className='h-12 w-12 text-muted-foreground mb-4' />
									<CardTitle className='text-lg mb-2'>No conversations yet</CardTitle>
									<CardDescription className='text-center mb-4'>
										Start a new conversation with one of your connections
									</CardDescription>
									<Button asChild>
										<Link href='/search'>Find Collaborators</Link>
									</Button>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value='new'>
						<div className='relative'>
							<Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
							<Input
								placeholder='Search connections...'
								className='pl-9 mb-4'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{loading ? (
							<div className='space-y-3'>
								{[1, 2, 3].map((i) => (
									<div key={i} className='flex items-center space-x-4 rounded-lg border p-4'>
										<Skeleton className='h-12 w-12 rounded-full' />
										<div className='space-y-2 flex-1'>
											<Skeleton className='h-4 w-[200px]' />
											<Skeleton className='h-3 w-[300px]' />
										</div>
										<Skeleton className='h-9 w-[100px]' />
									</div>
								))}
							</div>
						) : connections.length > 0 ? (
							<div className='space-y-3'>
								{connections
									.filter((conn) => !searchQuery || conn.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
									.map((connection) => (
										<div key={connection.id} className='flex items-center justify-between rounded-lg border p-4'>
											<div className='flex items-center space-x-4'>
												<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
													{connection.avatar_url ? (
														<img
															src={connection.avatar_url}
															alt={connection.full_name || "Profile"}
															className='h-12 w-12 rounded-full object-cover'
														/>
													) : (
														<User className='h-6 w-6 text-primary' />
													)}
												</div>
												<div>
													<p className='font-medium'>{connection.full_name || "Unnamed User"}</p>
												</div>
											</div>
											<Button asChild size='sm'>
												<Link href={`/messages/${connection.id}`}>Message</Link>
											</Button>
										</div>
									))}
							</div>
						) : (
							<Card>
								<CardContent className='flex flex-col items-center justify-center p-6'>
									<AlertCircle className='h-12 w-12 text-muted-foreground mb-4' />
									<CardTitle className='text-lg mb-2'>No connections yet</CardTitle>
									<CardDescription className='text-center mb-4'>
										You need to connect with other users before you can message them
									</CardDescription>
									<Button asChild>
										<Link href='/search'>Find Collaborators</Link>
									</Button>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
