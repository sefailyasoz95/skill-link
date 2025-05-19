"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/firebase";
import { useRouter } from "next/navigation";
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SupportForm() {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [subject, setSubject] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { toast } = useToast();
	useEffect(() => {
		trackEvent("support_form_viewed", {
			event_category: "support",
			event_label: "support_form_viewed",
			non_interaction: true,
		});
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) return;
		trackEvent("support_form_viewed", {
			event_category: "support",
			event_label: "support_form_submitted",
			email,
		});
		setIsLoading(true);
		const isValidEmail = emailRegex.test(email);
		if (isValidEmail) {
			const { data, error } = await supabase.from("supports").insert({ email, message, subject });
			if (error) {
				toast({
					title: "Error!",
					description: "Couldn't save your message! Please reach us at 'sio@softwarify.co' !",
				});
				setIsLoading(false);
				return;
			}
			toast({
				title: "Thanks!",
				description: "We've received your message and will get back to you soon.",
			});
			setTimeout(() => {
				router.back();
			}, 500);
		} else {
			if (!subject || !message) {
				toast({
					title: "Error!",
					description: "Make sure to fill all the fields !",
				});
				return;
			}
			toast({
				title: "Error!",
				description: "Please enter a valid email !",
			});
		}
		setIsLoading(false);
	};

	return (
		<motion.form
			initial={{
				opacity: 0,
				y: 50,
			}}
			whileInView={{
				opacity: 1,
				y: 0,
			}}
			onSubmit={handleSubmit}
			className='flex w-full flex-col items-center  space-y-2'>
			<Input
				type='email'
				placeholder='Enter your email'
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
				className='flex-1'
			/>
			<Input
				type='text'
				placeholder='Enter subject'
				value={subject}
				onChange={(e) => setSubject(e.target.value)}
				required
				className='flex-1'
			/>
			<Input
				type='text'
				placeholder='Enter your message'
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				required
				className='flex-1'
			/>
			<Button type='submit' disabled={isLoading}>
				{isLoading ? (
					<span className='flex items-center'>
						<svg
							className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
							xmlns='http://www.w3.org/2000/svg'
							fill='none'
							viewBox='0 0 24 24'>
							<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
							<path
								className='opacity-75'
								fill='currentColor'
								d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
						</svg>
						Processing
					</span>
				) : (
					<span className='flex items-center'>
						<Send className='mr-2 h-4 w-4' /> Send
					</span>
				)}
			</Button>
		</motion.form>
	);
}
