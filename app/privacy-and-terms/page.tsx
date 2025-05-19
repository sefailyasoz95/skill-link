"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PrivacyAndTermsPage() {
	return (
		<div className='container py-10 px-4 md:px-6'>
			<div className='mx-auto max-w-4xl'>
				<Card className='shadow-lg rounded-2xl'>
					<CardHeader>
						<CardTitle className='text-2xl font-bold text-center'>Privacy Policy & Terms of Use</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue='privacy' className='w-full'>
							<TabsList className='grid grid-cols-2 w-full rounded-lg bg-muted p-1 mb-6'>
								<TabsTrigger value='privacy'>Privacy Policy</TabsTrigger>
								<TabsTrigger value='terms'>Terms of Use</TabsTrigger>
							</TabsList>

							<TabsContent value='privacy' className='space-y-6'>
								<div className='prose dark:prose-invert max-w-none'>
									<h2>Privacy Policy</h2>
									<p>
										<strong>Effective Date:</strong> {new Date().toLocaleDateString()}
									</p>
									<p>
										<strong>Developed by:</strong> Softwarify (
										<a href='https://softwarify.co' target='_blank' rel='noopener noreferrer'>
											softwarify.co
										</a>
										)
									</p>
									<p>
										<strong>Contact:</strong> <a href='mailto:sio@softwarify.co'>sio@softwarify.co</a>
									</p>

									<h3>1. Information Collection</h3>
									<p>
										We may collect personal and usage information from you when you register, use the app, or interact
										with our services. This includes but is not limited to:
									</p>
									<ul>
										<li>Name, email address, and profile information</li>
										<li>Usage metrics, device information, and in-app behavior</li>
									</ul>

									<h3>2. How We Use Your Information</h3>
									<p>Your data may be used to:</p>
									<ul>
										<li>Improve app performance and user experience</li>
										<li>Analyze user behavior and app metrics</li>
										<li>Display internal advertisements or promotions tailored to your usage</li>
									</ul>

									<h3>3. Data Sharing</h3>
									<p>
										We do <strong>not</strong> share your personal information with third parties. All data remains
										strictly within Softwarify and its internal analytics tools unless legally required.
									</p>

									<h3>4. Security</h3>
									<p>We take reasonable steps to protect your data from unauthorized access, use, or disclosure.</p>

									<h3>5. Your Choices</h3>
									<p>
										You may contact us at <a href='mailto:sio@softwarify.co'>sio@softwarify.co</a> to:
									</p>
									<ul>
										<li>Access or correct your personal information</li>
										<li>Request account deletion or data removal</li>
									</ul>
								</div>
							</TabsContent>

							<TabsContent value='terms' className='space-y-6'>
								<div className='prose dark:prose-invert max-w-none'>
									<h2>Terms of Use</h2>
									<p>
										<strong>Effective Date:</strong> {new Date().toLocaleDateString()}
									</p>
									<p>
										<strong>Developed by:</strong> Softwarify (
										<a href='https://softwarify.co' target='_blank' rel='noopener noreferrer'>
											softwarify.co
										</a>
										)
									</p>
									<p>
										<strong>Contact:</strong> <a href='mailto:sio@softwarify.co'>sio@softwarify.co</a>
									</p>

									<h3>1. User Agreements</h3>
									<p>
										Skill Link enables users to create agreements for collaborative or freelance projects. Once both
										parties agree to terms through the platform, the agreement is considered binding.
									</p>

									<h3>2. Responsibility</h3>
									<p>Both parties are expected to:</p>
									<ul>
										<li>Fulfill the commitments outlined in their mutual agreement</li>
										<li>Communicate clearly and respectfully</li>
										<li>Deliver on their promised timelines and deliverables</li>
									</ul>

									<h3>3. Legal Consequences</h3>
									<p>
										Failure to uphold a project agreement may result in <strong>legal consequences</strong>. Skill Link
										does not mediate disputes but may provide communication logs or records if legally required.
									</p>

									<h3>4. Acceptable Use</h3>
									<ul>
										<li>Do not use the platform for illegal or harmful activities</li>
										<li>Do not impersonate other users or submit false information</li>
									</ul>

									<h3>5. Changes to These Terms</h3>
									<p>
										We may update these Terms from time to time. Continued use of the app after changes implies
										acceptance of the new terms.
									</p>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
