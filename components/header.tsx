"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Search, MessageSquare, User, LayoutDashboard } from "lucide-react";
import { trackEvent } from "@/lib/firebase";
import { useAuth } from "./auth-provider";
import Image from "next/image";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();
	const { user, signOut } = useAuth();

	useEffect(() => {
		trackEvent("home_page_viewed", {
			event_category: "home_page",
			event_label: "home_page_viewed",
			non_interaction: true,
		});
	}, []);
	const routes = [
		// {
		// 	name: "Home",
		// 	path: "/",
		// },
		// {
		// 	name: "Search",
		// 	path: "/search",
		// },
		{
			name: "How It Works",
			path: "/how-it-works",
		},
	];

	const authenticatedRoutes = [
		{
			name: "Dashboard",
			path: "/dashboard",
			icon: <LayoutDashboard className='mr-2 h-4 w-4' />,
		},
		{
			name: "Messages",
			path: "/messages",
			icon: <MessageSquare className='mr-2 h-4 w-4' />,
		},
		{
			name: "Profile",
			path: "/profile",
			icon: <User className='mr-2 h-4 w-4' />,
		},
	];

	return (
		<header className='sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
			<div className='container mx-auto flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0'>
				<div className='flex gap-6 md:gap-10'>
					<Link href={user ? "/dashboard" : "/"} className='items-center space-x-2 flex'>
						<span className='hidden font-bold sm:inline-block text-xl'>Skill Link</span>
					</Link>
					{!user && (
						<nav className='hidden md:flex gap-6'>
							{routes.map((route) => (
								<Link
									key={route.path}
									href={route.path}
									className={`text-sm my-auto font-medium transition-colors hover:text-primary ${
										pathname === route.path ? "text-foreground" : "text-muted-foreground"
									}`}>
									{route.name}
								</Link>
							))}
						</nav>
					)}
				</div>
				<div className='flex flex-1 items-center justify-end space-x-4'>
					<nav className='hidden md:flex items-center space-x-2'>
						<ModeToggle />
						{user ? (
							<>
								<Button variant='ghost' size='icon' asChild>
									<Link href='/search'>
										<Search className='h-4 w-4' />
										<span className='sr-only'>Search</span>
									</Link>
								</Button>
								<Button variant='ghost' size='icon' asChild>
									<Link href='/messages'>
										<MessageSquare className='h-4 w-4' />
										<span className='sr-only'>Messages</span>
									</Link>
								</Button>
								<Button variant='ghost' size='sm' asChild>
									<Link href='/dashboard'>Dashboard</Link>
								</Button>
								<Button variant='outline' size='sm' onClick={signOut}>
									Sign Out
								</Button>
							</>
						) : (
							<>
								<Button variant='ghost' size='sm' asChild>
									<Link href='/auth/signin'>Sign In</Link>
								</Button>
							</>
						)}
					</nav>
					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild>
							<Button variant='ghost' className='md:hidden' size='icon' aria-label='Toggle Menu'>
								<Menu className='h-5 w-5' />
							</Button>
						</SheetTrigger>
						<SheetContent side='right' className='pr-0' title='Skill Link'>
							<Link href='/' className='flex items-center' onClick={() => setIsOpen(false)}>
								<span className='font-bold'>Skill Link</span>
							</Link>
							<div className='mt-8 flex flex-col space-y-4'>
								{routes.map((route) => (
									<Link
										key={route.path}
										href={route.path}
										className='flex w-full items-center py-2 text-sm font-medium transition-colors hover:text-primary'
										onClick={() => setIsOpen(false)}>
										{route.name}
									</Link>
								))}
								<div className='h-px bg-muted my-4' />
								{user ? (
									<>
										{authenticatedRoutes.map((route) => (
											<Link
												key={route.path}
												href={route.path}
												className='flex w-full items-center py-2 text-sm font-medium transition-colors hover:text-primary'
												onClick={() => setIsOpen(false)}>
												{route.icon}
												{route.name}
											</Link>
										))}
										<Button variant='outline' className='mt-4' onClick={signOut}>
											Sign Out
										</Button>
									</>
								) : (
									<>
										<Link
											href='/auth/signin'
											className='flex w-full items-center py-2 text-sm font-medium transition-colors hover:text-primary'
											onClick={() => setIsOpen(false)}>
											Sign In
										</Link>
									</>
								)}
								<div className='flex items-center justify-between py-4'>
									<span className='text-sm font-medium'>Toggle Theme</span>
									<ModeToggle />
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
