"use client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "lucide-react";
import EarlyAccessForm from "@/components/early-access-form";

const steps = [
	{
		title: "1. Sign Up & Set Up Your Profile",
		description: `Once you sign up, you'll fill out your profile with background info, current and past projects, and what you're working on.`,
	},
	{
		title: "2. Choose Your Role(s)",
		description:
			"Select why you joined: Are you looking for someone to join your project, or are you looking to join a project? You can be both at the same time.",
	},
	{
		title: "3. Create or Join Projects",
		description:
			"If you’re a project owner, define your project and set collaboration criteria. If you’re a seeker, explore open projects and apply to join if you meet the criteria.",
	},
	{
		title: "4. Get Matched & Start Chatting",
		description:
			"Once a project owner approves your request, a direct chat opens. You can talk, ask questions, and align on goals before starting.",
	},
	{
		title: "5. Sign the Agreement",
		description:
			"If everything feels right, the project owner sends a collaboration agreement. Both sides e-sign it to formalize the partnership.",
	},
	{
		title: "6. Build Together, Outside the App",
		description:
			'After signing, you take the collaboration outside the app. Once all co-founder slots are filled, the project owner marks the project as "filled."',
	},
];

export default function HowItWorksPage() {
	return (
		<section className='min-h-screen px-4 py-12 md:py-20 bg-background text-foreground'>
			<div className='max-w-4xl mx-auto text-center space-y-6'>
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className='text-4xl md:text-5xl font-bold'>
					How It Works
				</motion.h1>
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.6 }}
					className='text-muted-foreground text-lg md:text-xl'>
					Skill Link helps solopreneurs find the right people to collaborate with, whether you're starting something or
					looking to join.
				</motion.p>
			</div>

			<div className='mt-12 max-w-3xl mx-auto space-y-8'>
				{steps.map((step, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.2 + 0.4 }}
						className='bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm'>
						<div className='flex items-start gap-4'>
							<CheckCircleIcon className='w-6 h-6 mt-1 text-primary' />
							<div>
								<h3 className='text-xl font-semibold mb-1'>{step.title}</h3>
								<p className='text-muted-foreground text-sm md:text-base'>{step.description}</p>
							</div>
						</div>
					</motion.div>
				))}
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 1.6 }}
				className='mt-16 text-center'>
				<Dialog>
					<DialogTrigger asChild>
						<Button size='lg' className='rounded-xl px-6 py-4 text-base'>
							Get Started
						</Button>
					</DialogTrigger>
					<DialogContent className='max-w-md w-full'>
						<DialogHeader>
							<DialogTitle>Join the Early Access</DialogTitle>
							<DialogDescription>Leave your email and we’ll notify you as soon as we launch.</DialogDescription>
						</DialogHeader>
						<EarlyAccessForm />
					</DialogContent>
				</Dialog>
			</motion.div>
		</section>
	);
}
