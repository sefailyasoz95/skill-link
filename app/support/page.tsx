"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SupportForm from "@/components/support-form";

export default function SupportPage() {
	return (
		<div className='container flex h-screen max-w-md items-center justify-center'>
			<Card className='w-full'>
				<CardHeader className='space-y-1 text-center'>
					<CardTitle className='text-2xl font-bold'>Is there something you need support with ?</CardTitle>
				</CardHeader>
				<CardContent>
					<SupportForm />
				</CardContent>
			</Card>
		</div>
	);
}
