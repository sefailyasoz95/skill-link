"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Search, User, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-server";
import { Chat, ChatMember, ConversationDisplayItem, Message, User as UserType, Connection } from "@/lib/types";

// Define interface for chat member with nested user info
interface ChatMemberWithUser {
	user_id: string;
	user: {
		id: string;
		full_name: string | null;
		username: string | null;
		profile_picture: string | null;
	} | null;
}

// Define interface for messages with sender info
interface MessageWithSender {
	id: string;
	content: string;
	sent_at: string;
	sender_id: string | null;
	sender: {
		id: string;
		full_name: string | null;
		username: string | null;
		profile_picture: string | null;
	} | null;
}

// Define interface for chat with members and messages
interface ChatData {
	id: string;
	is_group: boolean;
	name: string | null;
	created_at: string;
	chat_members: ChatMemberWithUser[];
	messages: MessageWithSender[] | null;
}

// Define interface for connection user details
interface ConnectionUserDetails {
	id: string;
	full_name: string | null;
	username: string | null;
	profile_picture: string | null;
	bio: string | null;
	location: string | null;
	availability: string | null;
	created_at: string;
}

export default function MessagesPage() {
	// const [searchQuery, setSearchQuery] = useState("");
	// const [conversations, setConversations] = useState<ConversationDisplayItem[]>([]);
	// const [filteredConversations, setFilteredConversations] = useState<ConversationDisplayItem[]>([]);
	// const [connections, setConnections] = useState<UserType[]>([]);

	// const { user, isLoading:loading } = useAuth();
	// const router = useRouter();
	// const { toast } = useToast();

	// 	const fetchConversations = async () => {
	// 		if (!user || !user.id) {
	// 			toast({
	// 				title: "Authentication Error",
	// 				description: "Current user not found. Please log in.",
	// 				variant: "destructive",
	// 			});
	// 			setLoading(false);
	// 			return;
	// 		}
	// 		try {
	// 			// 1. Fetch chats the current user is a member of
	// 			const { data: userChatMemberships, error: chatMembershipsError } = await supabase
	// 				.from("chat_members")
	// 				.select(
	// 					`
	//       chat:chats!inner (
	//         id,
	//         is_group,
	//         name,
	//         created_at,
	//         chat_members (
	//           user_id,
	//           user:users (
	//             id,
	//             full_name,
	//             username,
	//             profile_picture
	//           )
	//         ),
	//         messages (
	//           id,
	//           content,
	//           sent_at,
	//           sender_id,
	//           sender:users (
	//             id,
	//             full_name,
	//             username,
	//             profile_picture
	//           )
	//         )
	//       )
	//     `
	// 				)
	// 				.eq("user_id", user.id);

	// 			if (chatMembershipsError) throw chatMembershipsError;

	// 			// Process the data - we need to handle the nested structure carefully
	// 			const conversationsData: ConversationDisplayItem[] = [];

	// 			if (userChatMemberships) {
	// 				for (const membership of userChatMemberships) {
	// 					// Type assertion - treating this as any first to allow property access
	// 					const rawMembership = membership as any;
	// 					if (!rawMembership.chat) continue;

	// 					const chat = rawMembership.chat as ChatData;

	// 					const lastMessageData = chat.messages && chat.messages.length > 0 ? chat.messages[0] : null;

	// 					// Filter out null users and map to UserType
	// 					const allParticipants = chat.chat_members
	// 						.filter((cm: any) => cm.user !== null)
	// 						.map((cm: any) => {
	// 							const user = cm.user;
	// 							if (!user) return null;
	// 							return {
	// 								id: user.id,
	// 								full_name: user.full_name,
	// 								username: user.username,
	// 								profile_picture: user.profile_picture,
	// 							} as UserType;
	// 						})
	// 						.filter((user: any): user is UserType => user !== null);

	// 					const otherParticipants = allParticipants.filter((p: any) => p.id !== user.id);

	// 					let conversationName = chat.name;
	// 					if (!chat.is_group && !conversationName && otherParticipants.length > 0) {
	// 						conversationName = otherParticipants.map((p: any) => p.full_name || p.username).join(", ");
	// 					} else if (chat.is_group && !conversationName) {
	// 						conversationName = "Group Chat"; // Default group name
	// 					}

	// 					// Only add conversations with messages
	// 					if (lastMessageData) {
	// 						const lastMessage = {
	// 							id: lastMessageData.id,
	// 							content: lastMessageData.content,
	// 							sent_at: lastMessageData.sent_at,
	// 							sender: lastMessageData.sender
	// 								? ({
	// 										id: lastMessageData.sender.id,
	// 										full_name: lastMessageData.sender.full_name,
	// 										username: lastMessageData.sender.username,
	// 										profile_picture: lastMessageData.sender.profile_picture,
	// 								  } as UserType)
	// 								: null,
	// 							is_sender: lastMessageData.sender_id === user.id,
	// 						};

	// 						conversationsData.push({
	// 							id: chat.id,
	// 							is_group: chat.is_group,
	// 							name: conversationName,
	// 							lastMessage,
	// 							participants: allParticipants,
	// 							otherParticipants: otherParticipants,
	// 							unreadCount: 0, // TODO: Implement unread count logic
	// 							created_at: chat.created_at,
	// 						});
	// 					}
	// 				}
	// 			}

	// 			// Sort conversations by the last message's sent_at time, descending
	// 			const sortedConversations = conversationsData.sort((a, b) => {
	// 				if (!a.lastMessage && !b.lastMessage) return 0;
	// 				if (!a.lastMessage) return 1;
	// 				if (!b.lastMessage) return -1;
	// 				return new Date(b.lastMessage.sent_at).getTime() - new Date(a.lastMessage.sent_at).getTime();
	// 			});

	// 			setConversations(sortedConversations);
	// 			setFilteredConversations(sortedConversations);

	// 			// 2. Fetch connections to display in the "New Message" tab
	// 			const { data: connectionsData, error: connectionsError } = await supabase
	// 				.from("connections")
	// 				.select(
	// 					`
	//       id,
	//       status,
	//       user_a,
	//       user_b,
	//       userA:users!connections_user_a_fkey (
	//         id,
	//         full_name,
	//         username,
	//         profile_picture,
	//         bio,
	//         location,
	//         availability,
	//         created_at
	//       ),
	//       userB:users!connections_user_b_fkey (
	//         id,
	//         full_name,
	//         username,
	//         profile_picture,
	//         bio,
	//         location,
	//         availability,
	//         created_at
	//       )
	//     `
	// 				)
	// 				.or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
	// 				.eq("status", "accepted");

	// 			if (connectionsError) throw connectionsError;

	// 			const connectedUsersList: UserType[] = [];
	// 			const seenUserIds = new Set<string>();

	// 			// Process connections data to extract connected users
	// 			if (connectionsData) {
	// 				for (const conn of connectionsData) {
	// 					// Type assertion to safely access properties
	// 					const connection = conn as any;

	// 					if (connection.user_a === user.id && connection.userB && !seenUserIds.has(connection.user_b)) {
	// 						// Convert to UserType
	// 						const userB = connection.userB as ConnectionUserDetails;
	// 						connectedUsersList.push({
	// 							id: userB.id,
	// 							full_name: userB.full_name,
	// 							username: userB.username,
	// 							profile_picture: userB.profile_picture,
	// 							bio: userB.bio,
	// 							location: userB.location,
	// 							availability: userB.availability,
	// 							created_at: userB.created_at,
	// 						} as UserType);
	// 						seenUserIds.add(connection.user_b);
	// 					} else if (connection.user_b === user.id && connection.userA && !seenUserIds.has(connection.user_a)) {
	// 						// Convert to UserType
	// 						const userA = connection.userA as ConnectionUserDetails;
	// 						connectedUsersList.push({
	// 							id: userA.id,
	// 							full_name: userA.full_name,
	// 							username: userA.username,
	// 							profile_picture: userA.profile_picture,
	// 							bio: userA.bio,
	// 							location: userA.location,
	// 							availability: userA.availability,
	// 							created_at: userA.created_at,
	// 						} as UserType);
	// 						seenUserIds.add(connection.user_a);
	// 					}
	// 				}
	// 			}

	// 			setConnections(connectedUsersList);
	// 		} catch (error: any) {
	// 			toast({
	// 				title: "Error fetching data",
	// 				description: error.message || "An unexpected error occurred.",
	// 				variant: "destructive",
	// 			});
	// 		}
	// 	};
	// useEffect(() => {

	// if(!loading){
	// 	fetchConversations();
	// }

	// 	// Set up a real-time subscription for new messages
	// 	const messagesSubscription = supabase
	// 		.channel("messages-channel")
	// 		.on(
	// 			"postgres_changes",
	// 			{
	// 				event: "INSERT",
	// 				schema: "public",
	// 				table: "messages",
	// 			},
	// 			() => {
	// 				// Refresh conversations when a new message is received
	// 				fetchConversations();
	// 			}
	// 		)
	// 		.subscribe();

	// 	return () => {
	// 		supabase.removeChannel(messagesSubscription);
	// 	};
	// }, [user, router, toast,loading]);

	// // Filter conversations when search query changes
	// useEffect(() => {
	// 	if (!conversations.length) return;

	// 	if (searchQuery) {
	// 		const query = searchQuery.toLowerCase();
	// 		const filtered = conversations.filter(
	// 			(conv) =>
	// 				conv.name?.toLowerCase().includes(query) ||
	// 				(conv.lastMessage?.content && conv.lastMessage.content.toLowerCase().includes(query)) ||
	// 				conv.otherParticipants.some(
	// 					(p) => p.full_name?.toLowerCase().includes(query) || p.username?.toLowerCase().includes(query)
	// 				)
	// 		);
	// 		setFilteredConversations(filtered);
	// 	} else {
	// 		setFilteredConversations(conversations);
	// 	}
	// }, [searchQuery, conversations]);

	return (
		<div className='container py-10'>
			<div className='mx-auto max-w-5xl space-y-8'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Messages</h1>
					<p className='text-muted-foreground mt-2'>Chat with your connections and collaborate on projects</p>
				</div>
				<h1 className='text-3xl font-bold tracking-tight'>Coming soon..</h1>
				{/* <Tabs defaultValue='conversations'>
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
								{filteredConversations.map((conversation) => {
									// Get the first other participant (or "Group Chat" name for group chats)
									const otherUser = conversation.otherParticipants[0];
									const displayName = conversation.is_group
										? conversation.name
										: otherUser?.full_name || otherUser?.username || "Unnamed User";

									return (
										<Link key={conversation.id} href={`/messages/${conversation.id}`} className='block'>
											<div
												className={`flex items-start space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
													conversation.unreadCount > 0 ? "bg-primary/5" : ""
												}`}>
												<div className='relative'>
													<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
														{otherUser?.profile_picture ? (
															<img
																src={otherUser.profile_picture}
																alt={String(displayName || "User")}
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
															{displayName}
														</p>
														<p className='text-xs text-muted-foreground'>
															{conversation.lastMessage &&
																formatDistanceToNow(new Date(conversation.lastMessage.sent_at), { addSuffix: true })}
														</p>
													</div>
													<p
														className={`text-sm line-clamp-1 ${
															conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
														}`}>
														{conversation.lastMessage?.is_sender ? (
															<span>You: {conversation.lastMessage.content}</span>
														) : (
															conversation.lastMessage?.content
														)}
													</p>
												</div>
											</div>
										</Link>
									);
								})}
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
									.filter(
										(conn) =>
											!searchQuery ||
											conn.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
											conn.username?.toLowerCase().includes(searchQuery.toLowerCase())
									)
									.map((connection) => (
										<div key={connection.id} className='flex items-center justify-between rounded-lg border p-4'>
											<div className='flex items-center space-x-4'>
												<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
													{connection.profile_picture ? (
														<img
															src={connection.profile_picture}
															alt={String(connection.full_name || connection.username || "User")}
															className='h-12 w-12 rounded-full object-cover'
														/>
													) : (
														<User className='h-6 w-6 text-primary' />
													)}
												</div>
												<div>
													<p className='font-medium'>{connection.full_name || connection.username || "Unnamed User"}</p>
												</div>
											</div>
											<Button asChild size='sm'>
												<Link href={`/messages/new/${connection.id}`}>Message</Link>
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
				</Tabs> */}
			</div>
		</div>
	);
}
