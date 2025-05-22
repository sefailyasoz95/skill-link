import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Connection } from "@/lib/types";

interface ConnectionRequestCardProps {
	connection: Connection;
	onAccept: (id: string) => void;
	onDecline: (id: string) => void;
}

export function ConnectionRequestCard({ connection, onAccept, onDecline }: ConnectionRequestCardProps) {
	const requestUser = connection.userA;

	return (
		<Card key={connection.id}>
			<CardContent className='p-4'>
				<div className='flex items-start space-x-4'>
					<div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
						{requestUser?.profile_picture ? (
							<img
								src={requestUser.profile_picture}
								alt={requestUser.full_name || "Profile"}
								className='h-10 w-10 rounded-full object-cover'
							/>
						) : (
							<User className='h-5 w-5 text-primary' />
						)}
					</div>
					<div className='flex-1 space-y-1'>
						<p className='font-medium'>{requestUser?.full_name || "Unnamed User"}</p>
						<div className='flex flex-wrap gap-1'>
							{requestUser?.skills?.slice(0, 3).map((skill, i) => (
								<span
									key={i}
									className='inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
									{skill}
								</span>
							))}
							{requestUser?.skills && requestUser.skills.length > 3 && (
								<span className='inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium'>
									+{requestUser.skills.length - 3} more
								</span>
							)}
						</div>
					</div>
				</div>
				<div className='mt-4 flex items-center justify-end space-x-2'>
					<Button variant='outline' size='sm' onClick={() => onDecline(connection.id)}>
						Decline
					</Button>
					<Button size='sm' onClick={() => onAccept(connection.id)}>
						Accept
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
