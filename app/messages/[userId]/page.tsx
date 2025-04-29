"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
	id: string;
	full_name: string | null;
	avatar_url: string | null;
};

type Message = {
	id: string;
	sender_id: string;
	recipient_id: string;
	content: string;
	created_at: string;
	read: boolean;
};
export async function generateStaticParams() {
	// Fetch all profiles from your database to generate paths
	const { data: profiles } = await supabase.from("profiles").select("id");

	// Return array of objects with userId property
	return (profiles || []).map((profile) => ({
		userId: profile.id,
	}));
}
export default function MessagesPage() {
	const { userId } = useParams();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const { user } = useAuth();
	const router = useRouter();
	const { toast } = useToast();

	useEffect(() => {
		if (!user) {
			router.push("/auth/signin");
			return;
		}

		const fetchProfileAndMessages = async () => {
			try {
				// Fetch the other user's profile
				const { data: profileData, error: profileError } = await supabase
					.from("profiles")
					.select("id, full_name, avatar_url")
					.eq("id", userId)
					.single();

				if (profileError) throw profileError;
				setProfile(profileData);

				// Fetch messages between the two users
				const { data: messagesData, error: messagesError } = await supabase
					.from("messages")
					.select("*")
					.or(
						`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
					)
					.order("created_at", { ascending: true });

				if (messagesError) throw messagesError;
				setMessages(messagesData || []);

				// Mark unread messages as read
				const unreadMessages = messagesData?.filter((msg) => msg.recipient_id === user.id && !msg.read) || [];

				if (unreadMessages.length > 0) {
					const unreadIds = unreadMessages.map((msg) => msg.id);

					await supabase.from("messages").update({ read: true }).in("id", unreadIds);
				}
			} catch (error: any) {
				toast({
					title: "Error fetching conversation",
					description: error.message,
					variant: "destructive",
				});
			} finally {
				setLoading(false);
			}
		};

		fetchProfileAndMessages();

		// Subscribe to new messages
		const messagesSubscription = supabase
			.channel("messages-channel")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "messages",
					filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id}))`,
				},
				(payload) => {
					// Add the new message
					const newMsg = payload.new as Message;
					setMessages((current) => [...current, newMsg]);

					// If we're the recipient, mark as read
					if (newMsg.recipient_id === user.id) {
						supabase.from("messages").update({ read: true }).eq("id", newMsg.id);
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(messagesSubscription);
		};
	}, [user, userId, router, toast]);

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const sendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim() || !user || !userId) return;

		setSending(true);
		try {
			const { error } = await supabase.from("messages").insert({
				sender_id: user.id,
				recipient_id: userId,
				content: newMessage.trim(),
				read: false,
			});

			if (error) throw error;
			setNewMessage("");
		} catch (error: any) {
			toast({
				title: "Error sending message",
				description: error.message,
				variant: "destructive",
			});
		} finally {
			setSending(false);
		}
	};

	// Group messages by date
	const groupedMessages: { [date: string]: Message[] } = {};
	messages.forEach((message) => {
		const date = new Date(message.created_at).toDateString();
		if (!groupedMessages[date]) {
			groupedMessages[date] = [];
		}
		groupedMessages[date].push(message);
	});

	return (
		<div className='container h-screen py-4 flex flex-col'>
			<div className='flex items-center mb-4'>
				<Button variant='ghost' size='icon' asChild className='mr-2'>
					<Link href='/messages'>
						<ArrowLeft className='h-5 w-5' />
						<span className='sr-only'>Back</span>
					</Link>
				</Button>

				{loading ? (
					<div className='flex items-center space-x-3'>
						<Skeleton className='h-10 w-10 rounded-full' />
						<Skeleton className='h-4 w-[200px]' />
					</div>
				) : (
					<div className='flex items-center space-x-3'>
						<div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
							{profile?.avatar_url ? (
								<img
									src={profile.avatar_url}
									alt={profile.full_name || "Profile"}
									className='h-10 w-10 rounded-full object-cover'
								/>
							) : (
								<User className='h-5 w-5 text-primary' />
							)}
						</div>
						<div>
							<h2 className='font-medium'>{profile?.full_name || "Unnamed User"}</h2>
						</div>
					</div>
				)}
			</div>

			<div className='flex-1 overflow-y-auto mb-4 space-y-6'>
				{loading ? (
					<div className='space-y-4 p-4'>
						<div className='flex justify-start'>
							<div className='rounded-lg bg-muted p-3 max-w-[80%]'>
								<Skeleton className='h-4 w-[200px]' />
							</div>
						</div>
						<div className='flex justify-end'>
							<div className='rounded-lg bg-primary/10 p-3 max-w-[80%]'>
								<Skeleton className='h-4 w-[150px]' />
							</div>
						</div>
						<div className='flex justify-start'>
							<div className='rounded-lg bg-muted p-3 max-w-[80%]'>
								<Skeleton className='h-4 w-[250px]' />
							</div>
						</div>
					</div>
				) : (
					Object.entries(groupedMessages).map(([date, dateMessages]) => (
						<div key={date} className='space-y-4'>
							<div className='relative py-2'>
								<div className='absolute inset-0 flex items-center'>
									<span className='w-full border-t' />
								</div>
								<div className='relative flex justify-center'>
									<span className='bg-background px-2 text-xs text-muted-foreground'>
										{new Date(date).toLocaleDateString(undefined, {
											weekday: "long",
											month: "short",
											day: "numeric",
											year: new Date(date).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
										})}
									</span>
								</div>
							</div>

							<div className='space-y-4 px-4'>
								{dateMessages.map((message) => (
									<div
										key={message.id}
										className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
										<div
											className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${
												message.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
											}`}>
											<p className='text-sm'>{message.content}</p>
											<p className='text-xs opacity-70 mt-1 text-right'>
												{format(new Date(message.created_at), "h:mm a")}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			<form onSubmit={sendMessage} className='flex space-x-2'>
				<Input
					type='text'
					placeholder='Type your message...'
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					disabled={loading || sending}
					className='flex-1'
				/>
				<Button type='submit' disabled={!newMessage.trim() || loading || sending}>
					{sending ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : (
						<>
							<Send className='h-4 w-4 mr-2' />
							Send
						</>
					)}
				</Button>
			</form>
		</div>
	);
}
