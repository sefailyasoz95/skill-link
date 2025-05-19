import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
	ArrowRight,
	Users,
	Network,
	MessageSquare,
	Rocket,
	Star,
	ChevronRight,
	Check,
	ArrowUpRight,
} from "lucide-react";
import Image from "next/image";
import EarlyAccessForm from "@/components/early-access-form";

export default function Home() {
	return (
		<div className='flex flex-col overflow-hidden'>
			{/* Enhanced Hero section */}
			<section className='relative overflow-hidden py-20 md:py-32 rounded-3xl mt-5 px-5'>
				{/* Background with gradient and animated elements */}
				<div className='absolute inset-0 bg-gradient-radial from-indigo-50 via-white to-slate-50 dark:from-indigo-950/20 dark:via-background dark:to-background/80 z-0'></div>

				{/* Animated background patterns */}
				<div className='absolute inset-0 z-0'>
					<div className='absolute top-20 left-10 w-64 h-64 rounded-full bg-gradient-conic from-indigo-200 via-purple-200 to-indigo-200 blur-3xl opacity-20 dark:opacity-10 animate-pulse'></div>
					<div
						className='absolute bottom-10 right-10 w-80 h-80 rounded-full bg-gradient-conic from-indigo-300 via-blue-200 to-indigo-300 blur-3xl opacity-20 dark:opacity-10 animate-pulse'
						style={{ animationDuration: "8s" }}></div>
				</div>

				{/* Floating shapes */}
				<div
					className='absolute top-1/4 left-1/5 w-6 h-6 bg-indigo-400 rounded-full opacity-30 dark:opacity-20 animate-bounce'
					style={{ animationDuration: "3s" }}></div>
				<div
					className='absolute top-1/3 right-1/4 w-8 h-8 bg-indigo-300 rounded-full opacity-30 dark:opacity-20 animate-bounce'
					style={{ animationDuration: "5s" }}></div>
				<div
					className='absolute bottom-1/4 left-1/3 w-4 h-4 bg-purple-400 rounded-full opacity-30 dark:opacity-20 animate-bounce'
					style={{ animationDuration: "4s" }}></div>

				{/* Main content */}
				<div className='container px-4 md:px-6 relative z-10 drop-shadow-xl'>
					<div className='grid gap-8 lg:grid-cols-2 lg:gap-16 items-center drop-shadow-xl'>
						<div className='space-y-8'>
							<div className='space-y-4'>
								<div className='inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-sm font-medium animate-fadeIn'>
									<span className='flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse'></span>
									Join our community today for FREE
								</div>
								<h1 className='text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl animate-slideInFromLeft'>
									Build together. <br />
									<span className='bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 animate-gradient'>
										Grow faster.
									</span>
								</h1>
								<p
									className='max-w-[600px] text-gray-600 md:text-xl dark:text-gray-300 animate-slideInFromLeft'
									style={{ animationDelay: "0.1s" }}>
									Connect with like-minded solopreneurs to collaborate on projects, share skills, and grow your business
									together.
								</p>
							</div>
							{/* <div
                className="flex flex-col sm:flex-row gap-4 animate-slideInFromLeft"
                style={{ animationDelay: "0.2s" }}
              >
                <Link
                  href="/auth/signup"
                  className={`${buttonVariants({
                    size: "lg",
                  })} bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 dark:hover:shadow-indigo-700/20`}
                >
                  Get Started{" "}
                  <ArrowRight className="ml-2 h-4 w-4 animate-bounceRight" />
                </Link>
                <Link
                  href="/search"
                  className={`${buttonVariants({
                    variant: "outline",
                    size: "lg",
                  })} hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-300`}
                >
                  Browse Collaborators
                </Link>
              </div> */}

							<div
								className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 animate-slideInFromLeft'
								style={{ animationDelay: "0.3s" }}>
								<div className='flex -space-x-2'>
									<div className='h-6 w-6 rounded-full bg-indigo-200 border border-white dark:border-gray-800'></div>
									<div className='h-6 w-6 rounded-full bg-purple-200 border border-white dark:border-gray-800'></div>
									<div className='h-6 w-6 rounded-full bg-blue-200 border border-white dark:border-gray-800'></div>
								</div>
								<span>
									Join <span className='font-medium text-indigo-600 dark:text-indigo-400'>{/* 500+ */}</span> and
									connect with other solopreneurs
									{/* already connected */}
								</span>
							</div>
						</div>

						<div className='relative lg:pl-10 animate-slideInFromRight'>
							<div className='relative mx-auto aspect-video overflow-hidden rounded-2xl shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-700/10 transition-transform duration-500 hover:scale-[1.02] group'>
								{/* Decorative elements */}
								<div className='absolute -top-6 -right-6 w-24 h-24 bg-indigo-200 dark:bg-indigo-800/30 rounded-full blur-2xl opacity-70 dark:opacity-40'></div>
								<div className='absolute -bottom-8 -left-8 w-28 h-28 bg-purple-200 dark:bg-purple-800/30 rounded-full blur-2xl opacity-70 dark:opacity-40'></div>

								{/* Border glow effect */}
								<div
									className='absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-30 dark:group-hover:opacity-20 transition-opacity duration-500 animate-rotate'
									style={{ animationDuration: "8s" }}></div>

								{/* Image container */}
								<div className='relative rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-100 to-slate-100 dark:from-indigo-950/30 dark:to-slate-900/30 z-10'>
									<img
										src='https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg'
										alt='Solopreneurs collaborating'
										className='object-cover w-full h-96'
									/>

									{/* Floating UI elements */}
									<div
										className='absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-lg backdrop-blur-sm animate-float'
										style={{ animationDuration: "4s" }}>
										<div className='flex items-center space-x-2'>
											<div className='h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center'>
												<Users className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
											</div>
											<div>
												<p className='text-xs font-medium'>New connection</p>
												<p className='text-xs text-gray-500 dark:text-gray-400'>Marketing × Development</p>
											</div>
										</div>
									</div>

									<div
										className='absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-lg backdrop-blur-sm animate-float'
										style={{ animationDelay: "1s", animationDuration: "5s" }}>
										<div className='flex items-center space-x-2'>
											<div className='h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center'>
												<MessageSquare className='h-4 w-4 text-purple-600 dark:text-purple-400' />
											</div>
											<div>
												<p className='text-xs font-medium'>Project launched</p>
												<p className='text-xs text-gray-500 dark:text-gray-400'>SaaS collaboration</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Enhanced Features section */}
			<section className='py-20 md:py-32 relative overflow-hidden'>
				{/* Background with subtle pattern */}
				<div className='absolute inset-0 bg-white dark:bg-background z-0'>
					<div className='absolute inset-0 opacity-5 dark:opacity-10'>
						<div className="h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNmMtMy4zMTQgMC02IDIuNjg2LTYgNnMyLjY4NiA2IDYgNnptMCAwYzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02Yy0zLjMxNCAwLTYgMi42ODYtNiA2czIuNjg2IDYgNiA2em0wIDI0YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02Yy0zLjMxNCAwLTYgMi42ODYtNiA2czIuNjg2IDYgNiA2em0wIDBjMy4zMTQgMCA2LTIuNjg2IDYtNnMtMi42ODYtNi02LTZjLTMuMzE0IDAgNiAyLjY4Ni02IDZzMi42ODYgNiA2IDZ6Ii8+PC9nPjwvc3ZnPg==')]"></div>
					</div>
				</div>

				<div className='container px-4 md:px-6 relative z-10'>
					<div className='text-center mb-16 relative'>
						<div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-70 dark:opacity-30'></div>
						<div className='relative'>
							<h2 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl animate-fadeIn'>
								How Skill Link Works
							</h2>
							<div className='w-24 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mx-auto mt-4 rounded-full animate-pulse'></div>
							<p
								className='mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400 animate-fadeIn'
								style={{ animationDelay: "0.2s" }}>
								Find the perfect collaborator in three simple steps
							</p>
						</div>
					</div>

					<div className='grid gap-8 md:grid-cols-3 relative'>
						{/* Connecting line between steps */}
						<div className='absolute top-24 left-0 right-0 h-0.5 bg-indigo-100 dark:bg-indigo-900/20 hidden md:block'>
							<div
								className='h-full bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 animate-progressLine'
								style={{ width: "0%" }}></div>
						</div>

						{/* Step 1 */}
						<div className='flex flex-col items-center text-center space-y-6 group'>
							<div className='relative'>
								<div className='absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-xl opacity-70 dark:opacity-30 transform group-hover:scale-150 transition-transform duration-500'></div>
								<div className='relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 shadow-lg transition-transform duration-300 transform group-hover:scale-110 animate-fadeIn'>
									<Users className='h-10 w-10 text-white' />
								</div>
								<div className='absolute -top-1 -right-1 h-6 w-6 rounded-full bg-indigo-600 dark:bg-indigo-400 text-white flex items-center justify-center text-xs font-bold'>
									1
								</div>
							</div>
							<h3 className='text-2xl font-bold animate-fadeIn' style={{ animationDelay: "0.1s" }}>
								Create Your Profile
							</h3>
							<p className='text-gray-500 dark:text-gray-400 animate-fadeIn' style={{ animationDelay: "0.2s" }}>
								Showcase your skills, past projects, and what you're looking for in a collaborator.
							</p>
							<div className='pt-2'>
								<Link
									href='/profile/create'
									className='inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200 animate-fadeIn'
									style={{ animationDelay: "0.3s" }}>
									Learn more <ChevronRight className='ml-1 h-4 w-4' />
								</Link>
							</div>
						</div>

						{/* Step 2 */}
						<div className='flex flex-col items-center text-center space-y-6 group'>
							<div className='relative'>
								<div className='absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-xl opacity-70 dark:opacity-30 transform group-hover:scale-150 transition-transform duration-500'></div>
								<div
									className='relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 shadow-lg transition-transform duration-300 transform group-hover:scale-110 animate-fadeIn'
									style={{ animationDelay: "0.1s" }}>
									<Network className='h-10 w-10 text-white' />
								</div>
								<div className='absolute -top-1 -right-1 h-6 w-6 rounded-full bg-indigo-600 dark:bg-indigo-400 text-white flex items-center justify-center text-xs font-bold'>
									2
								</div>
							</div>
							<h3 className='text-2xl font-bold animate-fadeIn' style={{ animationDelay: "0.2s" }}>
								Find Your Match
							</h3>
							<p className='text-gray-500 dark:text-gray-400 animate-fadeIn' style={{ animationDelay: "0.3s" }}>
								Search and filter through our network of solopreneurs to find your perfect match.
							</p>
							<div className='pt-2'>
								<Link
									href='/search'
									className='inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200 animate-fadeIn'
									style={{ animationDelay: "0.4s" }}>
									Learn more <ChevronRight className='ml-1 h-4 w-4' />
								</Link>
							</div>
						</div>

						{/* Step 3 */}
						<div className='flex flex-col items-center text-center space-y-6 group'>
							<div className='relative'>
								<div className='absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-xl opacity-70 dark:opacity-30 transform group-hover:scale-150 transition-transform duration-500'></div>
								<div
									className='relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 shadow-lg transition-transform duration-300 transform group-hover:scale-110 animate-fadeIn'
									style={{ animationDelay: "0.2s" }}>
									<MessageSquare className='h-10 w-10 text-white' />
								</div>
								<div className='absolute -top-1 -right-1 h-6 w-6 rounded-full bg-indigo-600 dark:bg-indigo-400 text-white flex items-center justify-center text-xs font-bold'>
									3
								</div>
							</div>
							<h3 className='text-2xl font-bold animate-fadeIn' style={{ animationDelay: "0.3s" }}>
								Start Collaborating
							</h3>
							<p className='text-gray-500 dark:text-gray-400 animate-fadeIn' style={{ animationDelay: "0.4s" }}>
								Connect directly, discuss terms, and begin building your project together.
							</p>
							<div className='pt-2'>
								<Link
									href='/collaboration'
									className='inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200 animate-fadeIn'
									style={{ animationDelay: "0.5s" }}>
									Learn more <ChevronRight className='ml-1 h-4 w-4' />
								</Link>
							</div>
						</div>
					</div>

					{/* Feature highlights */}
					<div className='mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
						{[
							{
								icon: Users,
								title: "Verified Profiles",
								desc: "All members are vetted to ensure quality collaborations",
							},
							{
								icon: Network,
								title: "Skills Matching",
								desc: "Our algorithm finds the best matches for your project needs",
							},
							{
								icon: MessageSquare,
								title: "Secure Messaging",
								desc: "Built-in communication tools keep your project organized",
							},
							{
								icon: Star,
								title: "Rating System",
								desc: "Build your reputation through successful collaborations",
							},
						].map((feature, index) => (
							<div
								key={index}
								className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700 animate-slideUp'
								style={{ animationDelay: `${0.1 * index}s` }}>
								<div className='flex items-center space-x-4'>
									<div className='flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40'>
										<feature.icon className='h-6 w-6 text-indigo-600 dark:text-indigo-400' />
									</div>
									<h3 className='font-semibold text-lg'>{feature.title}</h3>
								</div>
								<p className='mt-4 text-gray-500 dark:text-gray-400'>{feature.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* <section className="py-20 md:py-32 relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200 dark:bg-indigo-800/20 rounded-bl-full opacity-30 dark:opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 dark:bg-purple-800/20 rounded-tr-full opacity-30 dark:opacity-20"></div>

        <div className="absolute inset-0 ">
          <div className="h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNmMtMy4zMTQgMC02IDIuNjg2LTYgNnMyLjY4NiA2IDYgNnptMCAwYzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02Yy0zLjMxNCAwLTYgMi42ODYtNiA2czIuNjg2IDYgNiA2em0wIDI0YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02Yy0zLjMxNCAwLTYgMi42ODYtNiA2czIuNjg2IDYgNiA2em0wIDBjMy4zMTQgMCA2LTIuNjg2IDYtNnMtMi42ODYtNi02LTZjLTMuMzE0IDAgNiAyLjY4Ni02IDZzMi42ODYgNiA2IDZ6Ii8+PC9nPjwvc3ZnPg==')]"></div>
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          <div className="mx-auto max-w-3xl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden animate-fadeIn">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 bg-indigo-200 dark:bg-indigo-800/30 rounded-full blur-2xl opacity-70 dark:opacity-40"></div>
              <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-40 h-40 bg-purple-200 dark:bg-purple-800/30 rounded-full blur-2xl opacity-70 dark:opacity-40"></div>

              <div className="relative text-center">
                <div
                  className="inline-flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-300 mb-6 animate-fadeIn"
                  style={{ animationDelay: "0.1s" }}
                >
                  <Rocket className="mr-2 h-4 w-4" /> COMING SOON
                </div>

                <h2
                  className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl animate-fadeIn"
                  style={{ animationDelay: "0.2s" }}
                >
                  Be First in Line
                </h2>

                <p
                  className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400 animate-fadeIn"
                  style={{ animationDelay: "0.3s" }}
                >
                  Join our waiting list to get early access to Skill Link and
                  find your perfect collaborator before everyone else.
                </p>

                <div
                  className="mt-8 animate-fadeIn"
                  style={{ animationDelay: "0.4s" }}
                >
                  <EarlyAccessForm />
                </div>

                <div
                  className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 animate-fadeIn"
                  style={{ animationDelay: "0.5s" }}
                >
                  {[
                    "No credit card required",
                    "Cancel anytime",
                    "Priority access",
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="mr-1 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}
		</div>
	);
}
