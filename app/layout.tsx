import "./globals.css";
import type { Metadata } from "next";
import { Laila } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";
import Footer from "@/components/footer";

const inter = Laila({ weight: "500", subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Skill Link | Build together. Grow faster.",
	description:
		"Connect with like-minded solopreneurs to collaborate on projects. Find your co-founder for your startup.",
	keywords:
		"solopreneur, collaboration, projects, networking, skills, connect, build, grow, community, startup, entrepreneurship, freelancing, partnerships, innovation, ideas, teamwork, growth, support, resources",
	authors: [
		{
			name: "Softwarify",
			url: "https://softwarify.co",
		},
	],
	creator: "Softwarify",
	applicationName: "Skill Link",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body className={inter.className}>
				<ThemeProvider attribute='class' defaultTheme='dark'>
					<div className='flex min-h-screen flex-col items-center'>
						<Header />
						<main className='flex-1'>{children}</main>
						<Footer />
					</div>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
