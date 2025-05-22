// ConnectionCard.tsx
import Link from "next/link";
import { MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Connection } from "@/lib/types";

interface ConnectionCardProps {
	connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
	const connectedUser = connection.userA;

	return (
		<Card key={connection.id}>
			<CardContent className='p-4'>
				<div className='flex items-start space-x-4'>
					<div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
						{connectedUser?.profile_picture ? (
							<img
								src={connectedUser.profile_picture}
								alt={connectedUser.full_name || "Profile"}
								className='h-10 w-10 rounded-full object-cover'
							/>
						) : (
							<User className='h-5 w-5 text-primary' />
						)}
					</div>
					<div className='flex-1 space-y-1'>
						<p className='font-medium'>{connectedUser?.full_name || "Unnamed User"}</p>
						<div className='flex flex-wrap gap-1'>
							{connectedUser?.skills?.slice(0, 3).map((skill, i) => (
								<span
									key={i}
									className='inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
									{skill}
								</span>
							))}
							{connectedUser?.skills && connectedUser.skills.length > 3 && (
								<span className='inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium'>
									+{connectedUser.skills.length - 3} more
								</span>
							)}
						</div>
					</div>
				</div>
				<div className='mt-4 flex items-center justify-end space-x-2'>
					<Button asChild variant='outline' size='sm'>
						<Link href={`/profile/${connectedUser?.id}`}>View Profile</Link>
					</Button>
					<Button asChild size='sm'>
						<Link href={`/messages/${connectedUser?.id}`}>
							<MessageSquare className='mr-2 h-4 w-4' />
							Message
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
