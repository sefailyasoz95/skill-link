"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

function SignInPage() {
	const router = useRouter();
	const { googleSignIn, user, isLoading: loading } = useAuth();
	const { toast } = useToast();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirectTo") || "/dashboard";

	// If user is already logged in, redirect them
	// But only after auth is loaded and not to auth pages
	useEffect(() => {
		if (!loading && user && redirectTo !== window.location.pathname) {
			// Prevent redirects to auth routes, which could cause loops
			if (redirectTo.startsWith("/auth/")) {
				router.push("/dashboard");
			} else {
				router.push(redirectTo);
			}
		}
	}, [user, redirectTo, loading, router]);

	const handleSignIn = async () => {
		try {
			// Only pass the redirectTo if it's not an auth page (prevent loops)
			const safeRedirectTo = redirectTo.startsWith("/auth/") ? "/dashboard" : redirectTo;

			const res = await googleSignIn(safeRedirectTo);
			if (res.error) {
				toast({
					title: "Sign In Error",
					description: (res.error as any)?.message || "Failed to sign in with Google",
					variant: "destructive",
				});
			}
		} catch (error: any) {
			toast({
				title: "Sign In Error",
				description: error.message || "An unexpected error occurred",
				variant: "destructive",
			});
		}
	};

	return (
		<div className='container flex h-screen max-w-md items-center justify-center'>
			<Card className='w-full'>
				<CardHeader className='space-y-1 text-center'>
					<CardTitle className='text-2xl font-bold'>Sign in</CardTitle>
					<CardDescription>Use your Google account to sign in</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant='outline' className='w-full' onClick={handleSignIn}>
						<svg className='mr-2 h-4 w-4' viewBox='0 0 24 24'>
							<path
								d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
								fill='#4285F4'
							/>
							<path
								d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
								fill='#34A853'
							/>
							<path
								d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
								fill='#FBBC05'
							/>
							<path
								d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
								fill='#EA4335'
							/>
							<path d='M1 1h22v22H1z' fill='none' />
						</svg>
						Google
					</Button>
					<small>
						By signing in, you agree to our <Link href={"/privacy-and-terms"}>Privacy Policy & Terms of Usage</Link>
					</small>
				</CardContent>
				<CardFooter className='flex justify-center text-center text-sm text-muted-foreground'>
					{redirectTo !== "/dashboard" && !redirectTo.startsWith("/auth/") && (
						<p>You'll be redirected after signing in</p>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}

export default function SignInPageSuspense() {
	return (
		<Suspense
			fallback={
				<div className='container py-10 flex flex-col items-center justify-center min-h-[50vh]'>
					<div className='border-b-2 border-b-foreground rounded-b-full animate-spin w-14 h-14' />
					<p className='mt-4 text-muted-foreground'>Loading...</p>
				</div>
			}>
			<SignInPage />
		</Suspense>
	);
}
