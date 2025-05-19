"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  Loader2,
  User,
  MessageSquare,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Chat,
  Message as MessageType,
  User as UserType,
  Skill,
} from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

// Custom interface for a message with its sender information
interface ExtendedMessage extends Omit<MessageType, "sender"> {
  sender?: UserType | null;
}

// Interface for extended user info with skills
interface UserWithSkills extends UserType {
  skills?: Skill[];
}

export default function ChatPage() {
  // Get params using the hook instead of props
  const params = useParams();
  // Extract the chat ID safely - ensure it's a string
  const chatId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [participants, setParticipants] = useState<UserWithSkills[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch chat data, messages and user skills
  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    const fetchChatData = async () => {
      if (!chatId) return;

      setIsLoading(true);
      try {
        // 1. Get the chat details
        const { data: chatData, error: chatError } = await supabase
          .from("chats")
          .select("*")
          .eq("id", chatId)
          .single();

        if (chatError) throw chatError;
        setChat(chatData as Chat);

        // 2. Get the chat members (participants)
        const { data: chatMembers, error: membersError } = await supabase
          .from("chat_members")
          .select(
            `
            user_id,
            user:users (
              id,
              full_name,
              username,
              profile_picture,
              bio,
              location,
              availability,
              created_at
            )
          `
          )
          .eq("chat_id", chatId);

        if (membersError) throw membersError;

        // Verify the current user is a member of this chat
        const isUserMember = chatMembers.some(
          (member: any) => member.user_id === user.id
        );

        if (!isUserMember) {
          throw new Error("You don't have access to this conversation");
        }

        // Extract users from chat members
        const chatParticipants = chatMembers
          .map((member: any) => member.user)
          .filter(Boolean);

        // Fetch skills for each participant
        const participantsWithSkills: UserWithSkills[] = [];

        for (const participant of chatParticipants) {
          const { data: userSkills, error: skillsError } = await supabase
            .from("user_skills")
            .select(
              `
              skill_id,
              skill:skills (
                id,
                name
              )
            `
            )
            .eq("user_id", participant.id);

          if (!skillsError && userSkills) {
            const skills = userSkills
              .map((us: any) => us.skill)
              .filter(Boolean);
            participantsWithSkills.push({
              ...participant,
              skills,
            });
          } else {
            participantsWithSkills.push(participant);
          }
        }

        setParticipants(participantsWithSkills);

        // 3. Get all messages for this chat
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(
            `
            id,
            chat_id,
            content,
            sent_at,
            sender_id,
            sender:users (
              id,
              full_name,
              username,
              profile_picture,
              bio,
              location,
              availability,
              created_at
            )
          `
          )
          .eq("chat_id", chatId)
          .order("sent_at", { ascending: true });

        if (messagesError) throw messagesError;

        // Type cast the data to our custom message type
        const typedMessages = (messagesData || []).map((msg: any) => ({
          id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          content: msg.content,
          sent_at: msg.sent_at,
          sender: msg.sender,
        })) as ExtendedMessage[];

        setMessages(typedMessages);
      } catch (err: any) {
        console.error("Error fetching chat data:", err);
        setError(err.message || "Failed to load conversation");
        toast({
          title: "Error",
          description: err.message || "Failed to load conversation",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();

    // Set up real-time subscription for new messages
    const channelName = `chat:${chatId}`;
    const messagesSubscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);
          // Fetch the sender's details for the new message
          const { data: senderData } = await supabase
            .from("users")
            .select(
              "id, full_name, username, profile_picture, bio, location, availability, created_at"
            )
            .eq("id", payload.new.sender_id)
            .single();

          const newMsg: ExtendedMessage = {
            id: payload.new.id,
            chat_id: payload.new.chat_id,
            sender_id: payload.new.sender_id,
            content: payload.new.content,
            sent_at: payload.new.sent_at,
            sender: (senderData as UserType) || null,
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });

    return () => {
      console.log(`Removing channel: ${channelName}`);
      supabase.removeChannel(messagesSubscription);
    };
  }, [chatId, router, toast, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || !chat) {
      toast({
        title: "Error",
        description: "Unable to send message",
        variant: "destructive",
      });
      return;
    }

    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const messageToSend = {
        chat_id: chat.id,
        sender_id: user.id,
        content: newMessage.trim(),
        sent_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("messages")
        .insert(messageToSend)
        .select(`
          id,
          chat_id,
          content,
          sent_at,
          sender_id,
          sender:users (id, full_name, username, profile_picture)
        `);

      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }

      // Add the new message to the state immediately
      if (data?.[0]) {
        const newMsg: ExtendedMessage = {
          ...data[0],
          sender: user // Add the current user as sender since we know it's the sender
        };
        setMessages((prev) => [...prev, newMsg]);
        setNewMessage("");
        // Scroll to the new message
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getChatName = () => {
    if (!chat) return "Conversation";

    if (chat.name) return chat.name;

    if (!chat.is_group) {
      // For 1-on-1 chats, show the other person's name
      const otherParticipants = participants.filter((p) => p.id !== user?.id);

      if (otherParticipants.length > 0) {
        const otherUser = otherParticipants[0];
        return otherUser.full_name || otherUser.username || "User";
      }
    }

    return "Conversation";
  };

  // Find a user in participants by ID
  const findParticipant = (userId: string): UserWithSkills | undefined => {
    return participants.find((p) => p.id === userId);
  };

  // Render a profile card for a user
  const renderProfileCard = (userInfo: UserWithSkills) => {
    return (
      <div className="flex flex-col space-y-3 p-1">
        <div className="flex items-center space-x-3">
          <div className="h-14 w-14 rounded-full overflow-hidden bg-primary/10">
            {userInfo.profile_picture ? (
              <img
                src={userInfo.profile_picture}
                alt={userInfo.full_name || userInfo.username || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-lg font-medium text-primary">
                {(userInfo.full_name || userInfo.username || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-base">
              {userInfo.full_name || userInfo.username || "User"}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {userInfo.location && (
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {userInfo.location}
                </span>
              )}
              {userInfo.availability && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {userInfo.availability.replace("-", " ")}
                </span>
              )}
            </div>
          </div>
        </div>

        {userInfo.bio && (
          <p className="text-sm text-muted-foreground">{userInfo.bio}</p>
        )}

        {userInfo.skills && userInfo.skills.length > 0 && (
          <div className="space-y-1">
            <h5 className="text-xs font-medium">Skills</h5>
            <div className="flex flex-wrap gap-1">
              {userInfo.skills.map((skill) => (
                <Badge key={skill.id} variant="secondary" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 inline mr-1" />
          Joined{" "}
          {formatDistanceToNow(new Date(userInfo.created_at), {
            addSuffix: true,
          })}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                There was a problem loading this conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{error}</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/messages">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Messages
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-5xl">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <Button asChild variant="ghost" size="icon" className="mr-2">
                <Link href="/messages">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex-1">
                <Skeleton className="h-6 w-[150px] mb-1" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex ${
                      i % 2 === 0 ? "justify-end" : "justify-start"
                    }`}
                  >
                    {i % 2 !== 0 && (
                      <Skeleton className="h-10 w-10 rounded-full mr-2" />
                    )}
                    <div>
                      <Skeleton
                        className={`h-[60px] ${
                          i % 2 === 0 ? "w-[250px]" : "w-[200px]"
                        } rounded-lg`}
                      />
                      <Skeleton className="h-3 w-[80px] mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex w-full space-x-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[80px]" />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 w-screen">
      <div className="mx-auto max-w-5xl">
        <Card className="flex flex-col h-[calc(100vh-8rem)]">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-3">
              <Button asChild variant="ghost" size="icon" className="mr-1">
                <Link href="/messages">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  {/* Main user/group name */}
                  <CardTitle>{getChatName()}</CardTitle>
                </div>

                <CardDescription className="mt-1">
                  {chat?.is_group
                    ? `${participants.length} participants`
                    : "Private conversation"}
                </CardDescription>
              </div>

              <div className="ml-auto flex -space-x-2">
                {participants
                  .filter((p) => p.id !== user?.id)
                  .slice(0, 3)
                  .map((participant) => (
                    <HoverCard key={participant.id}>
                      <HoverCardTrigger asChild>
                        <div className="h-8 w-8 rounded-full border-2 border-background overflow-hidden bg-primary/10 cursor-pointer hover:scale-105 transition-transform">
                          {participant.profile_picture ? (
                            <img
                              src={participant.profile_picture}
                              alt={
                                participant.full_name ||
                                participant.username ||
                                "User"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs font-medium text-primary">
                              {(
                                participant.full_name ||
                                participant.username ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="bottom" className="w-72">
                        {renderProfileCard(participant)}
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                {participants.filter((p) => p.id !== user?.id).length > 3 && (
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                    +{participants.filter((p) => p.id !== user?.id).length - 3}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 overflow-y-auto py-6 pl-12 pr-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium mb-1">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Start the conversation by sending a message below.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => {
                  const isCurrentUser = message.sender_id === user?.id;
                  const senderInfo = isCurrentUser
                    ? undefined
                    : findParticipant(message.sender_id || "");

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isCurrentUser && senderInfo && (
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex-shrink-0 mr-2 cursor-pointer">
                              {senderInfo.profile_picture ? (
                                <img
                                  src={senderInfo.profile_picture}
                                  alt={senderInfo.full_name || "User"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-sm font-medium text-primary">
                                  {(
                                    senderInfo.full_name ||
                                    senderInfo.username ||
                                    "U"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent side="right" className="w-72">
                            {renderProfileCard(senderInfo)}
                          </HoverCardContent>
                        </HoverCard>
                      )}

                      <div
                        className={
                          isCurrentUser ? "max-w-[70%]" : "max-w-[65%]"
                        }
                      >
                        <div
                          className={`rounded-lg px-4 py-3 inline-block ${
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(message.sent_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>

          <Separator />

          <CardFooter className="pt-4">
            <form
              onSubmit={handleSendMessage}
              className="flex w-full space-x-2"
            >
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
                disabled={isSending}
              />
              <Button type="submit" disabled={isSending || !newMessage.trim()}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
