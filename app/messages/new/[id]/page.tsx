"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { User } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-server";

export default function NewMessagePage() {
	// Get params using the hook instead of props
	const params = useParams();
	// Extract the recipient ID safely - ensure it's a string
	const recipientId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

	const [recipientUser, setRecipientUser] = useState<User | null>(null);
	const [message, setMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isFetchingUser, setIsFetchingUser] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();
	const { user, isLoading: authLoading } = useAuth();
	const { toast } = useToast();

	// Get the recipient user data
	useEffect(() => {
		async function fetchRecipientUser() {
			if (!recipientId) return;

			try {
				const { data, error } = await supabase
					.from("users")
					.select("id, full_name, username, profile_picture, bio")
					.eq("id", recipientId)
					.single();

				if (error) {
					throw new Error("Error fetching recipient user");
				}

				if (!data) {
					throw new Error("User not found");
				}

				setRecipientUser(data as User);
			} catch (err: any) {
				setError(err.message || "Failed to fetch user information");
				toast({
					title: "Error",
					description: err.message || "Failed to fetch user information",
					variant: "destructive",
				});
			} finally {
				setIsFetchingUser(false);
			}
		}

		if (authLoading) return; // Wait until auth is loaded
		if (!user) {
			router.push("/auth/signin");
			return;
		}
		fetchRecipientUser();
	}, [recipientId, router, toast, user, authLoading]);

	// Check if there's an existing chat between these users
	useEffect(() => {
		async function checkExistingChat() {
			if (!user || !recipientUser) return;

			try {
				// Find any chat where both users are members
				const { data: chatMembers, error } = await supabase
					.from("chat_members")
					.select(
						`
            chat_id,
            chat:chats!inner (
              id,
              is_group
            )
          `
					)
					.eq("user_id", user.id);

				if (error) throw error;

				if (chatMembers && chatMembers.length > 0) {
					// For each chat the current user is in, check if the recipient is also a member
					for (const member of chatMembers) {
						const chat = member.chat as any;

						// Skip group chats
						if (chat.is_group) continue;

						const { data: recipientMember, error: recipientError } = await supabase
							.from("chat_members")
							.select("chat_id")
							.eq("chat_id", chat.id)
							.eq("user_id", recipientUser.id)
							.maybeSingle();

						if (recipientError) throw recipientError;

						// If we found a match, this is an existing 1-on-1 chat
						if (recipientMember) {
							// Redirect to the existing chat
							router.push(`/messages/${chat.id}`);
							return;
						}
					}
				}
			} catch (err: any) {}
		}

		checkExistingChat();
	}, [user, recipientUser, router]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		if (!user || !recipientUser) {
			toast({
				title: "Error",
				description: "Missing user information",
				variant: "destructive",
			});
			return;
		}

		if (!message.trim()) {
			toast({
				title: "Error",
				description: "Please enter a message",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);

		try {
			// 1. Create a new chat
			const { data: newChat, error: chatError } = await supabase
				.from("chats")
				.insert({
					is_group: false,
					name: null, // 1-on-1 chats don't need names
					created_at: new Date().toISOString(),
				})
				.select("id")
				.single();

			if (chatError) throw chatError;

			// 2. Add the current user as chat member
			const { error: memberError1 } = await supabase.from("chat_members").insert({
				chat_id: newChat.id,
				user_id: user.id,
				joined_at: new Date().toISOString(),
			});
			if (memberError1) throw memberError1;

			// 3. Add the recipient as chat member
			const { error: memberError2 } = await supabase.from("chat_members").insert({
				chat_id: newChat.id,
				user_id: recipientUser.id,
				joined_at: new Date().toISOString(),
			});
			if (memberError2) throw memberError2;

			// 4. Only after both users are in chat_members, send the first message
			const { error: messageError } = await supabase.from("messages").insert({
				chat_id: newChat.id,
				sender_id: user.id,
				content: message,
				sent_at: new Date().toISOString(),
			});
			if (messageError) throw messageError;

			// 5. Navigate to the new chat
			toast({
				title: "Success",
				description: "Message sent successfully",
			});
			router.push(`/messages/${newChat.id}`);
		} catch (err: any) {
			toast({
				title: "Error",
				description: err.message || "Failed to send message",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (error) {
		return (
			<div className='container py-10'>
				<div className='mx-auto max-w-2xl'>
					<Card>
						<CardHeader>
							<CardTitle>Error</CardTitle>
							<CardDescription>There was a problem loading this page</CardDescription>
						</CardHeader>
						<CardContent>
							<p className='text-destructive'>{error}</p>
						</CardContent>
						<CardFooter>
							<Button asChild variant='outline'>
								<Link href='/messages'>
									<ArrowLeft className='mr-2 h-4 w-4' />
									Back to Messages
								</Link>
							</Button>
						</CardFooter>
					</Card>
				</div>
			</div>
		);
	}

	if (isFetchingUser) {
		return (
			<div className='container py-10'>
				<div className='mx-auto max-w-2xl flex justify-center'>
					<Loader2 className='h-8 w-8 animate-spin text-primary' />
				</div>
			</div>
		);
	}

	return (
		<div className='container py-10'>
			<div className='mx-auto max-w-2xl'>
				<Card>
					<CardHeader>
						<div className='flex items-center'>
							<Button asChild variant='ghost' size='icon' className='mr-2'>
								<Link href='/messages'>
									<ArrowLeft className='h-4 w-4' />
								</Link>
							</Button>
							<div>
								<CardTitle>New Message</CardTitle>
								<CardDescription>To: {recipientUser?.full_name || recipientUser?.username || "User"}</CardDescription>
							</div>
						</div>
					</CardHeader>

					<CardContent>
						<form onSubmit={handleSubmit} className='space-y-4'>
							<div className='rounded-lg border p-4 bg-muted/20'>
								<div className='flex items-center space-x-4 mb-4'>
									<div className='h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center'>
										{recipientUser?.profile_picture ? (
											<img
												src={recipientUser.profile_picture}
												alt={recipientUser?.full_name || "User"}
												className='h-10 w-10 object-cover'
											/>
										) : (
											<span className='text-sm font-medium'>
												{(recipientUser?.full_name || recipientUser?.username || "User").charAt(0).toUpperCase()}
											</span>
										)}
									</div>
									<div>
										<h3 className='font-medium'>{recipientUser?.full_name || recipientUser?.username || "User"}</h3>
										{recipientUser?.bio && (
											<p className='text-sm text-muted-foreground line-clamp-1'>{recipientUser.bio}</p>
										)}
									</div>
								</div>
								<p className='text-sm text-muted-foreground'>
									This will start a new conversation. You can send messages to this user after you connect.
								</p>
							</div>

							<div className='flex items-center space-x-2'>
								<Input
									placeholder='Type your message...'
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									className='flex-1'
									disabled={isLoading}
								/>
								<Button type='submit' disabled={isLoading || !message.trim()}>
									{isLoading ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<>
											<Send className='h-4 w-4 mr-2' />
											Send
										</>
									)}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
