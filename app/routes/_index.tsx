import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, json, useLoaderData } from "@remix-run/react";
import type { LucideIcon } from "lucide-react";
import {
	AlertCircle,
	Circle,
	GlassWater,
	Heart,
	Lightbulb,
	MapPin,
	Salad,
	Search,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import VoicedeckStats from "~/components/voicedeck-stats";
import { siteConfig } from "~/config/site";
import { Report } from "~/types";
import { fetchReports } from "../impact-reports.server";

const iconComponents: { [key: string]: LucideIcon } = {
	Hunger: Salad,
	Thirst: GlassWater,
	Opportunity: Lightbulb,
	Dignity: Heart,
};

interface DynamicCategoryIconProps {
	category: string;
	color: string;
	strokeWidth: string;
	size: string;
}

const DynamicCategoryIcon: React.FC<DynamicCategoryIconProps> = ({
	category,
	color,
	strokeWidth,
	size,
}) => {
	const CategoryIcon = iconComponents[category];
	if (!CategoryIcon) {
		return <AlertCircle size={14} />; // or a placeholder component
	}
	return <CategoryIcon color={color} strokeWidth={strokeWidth} size={size} />;
};

export const meta: MetaFunction = () => {
	return [
		{ title: "VoiceDeck" },
		{ name: "description", content: "Welcome to VoiceDeck!" },
	];
};

export const loader: LoaderFunction = async () => {
	try {
		const response = await fetchReports();

		return json(response);
	} catch (error) {
		console.error(`Failed to load impact reports: ${error}`);
		throw new Response("Failed to load impact reports", { status: 500 });
	}
};

export default function Index() {
	const reports = useLoaderData<typeof loader>();
	const uniqueCategories = useMemo(() => {
		return reports
			.map((report: Report, index: number) => report.category || null)
			.filter(
				(value: string, index: number, self: string[]) =>
					self.indexOf(value) === index,
			);
	}, [reports]);

	// here using amounts directly from the HC, needs additional logic to group those amounts into displayed ranges ie $0-50, $50-100
	const uniqueFundedAmounts = useMemo(() => {
		return reports
			.map((report: Report, index: number) => report.fundedSoFar || null)
			.filter(
				(value: number, index: number, self: number[]) =>
					self.indexOf(value) === index,
			);
	}, [reports]);

	const uniqueMediaOutlets = useMemo(() => {
		return reports
			.map((report: Report, index: number) => report.contributors[0] || null)
			.filter(
				(value: string, index: number, self: string[]) =>
					self.indexOf(value) === index,
			);
	}, [reports]);

	const uniqueStates = useMemo(() => {
		return reports
			.map((report: Report, index: number) => report.state || null)
			.filter(
				(value: string, index: number, self: string[]) =>
					self.indexOf(value) === index,
			);
	}, [reports]);

	return (
		<main className="flex flex-col gap-6 md:gap-4 justify-center items-center p-4 md:px-[14%]">
			<header className="flex-row bg-[url('/hero_imgLG.jpg')] bg-cover bg-center justify-start items-baseline text-vd-beige-200 rounded-3xl p-4 pt-24 md:pt-36 md:pr-48 md:pb-2 md:pl-8 max-w-screen-xl">
				<h1 className="text-6xl font-bold text-left">{siteConfig.title}</h1>
				<h2 className="text-lg font-medium text-left py-6">
					{siteConfig.description}
				</h2>
			</header>

			<section className="flex flex-col lg:flex-row w-full gap-3 max-w-screen-xl">
				<VoicedeckStats
					key="flower"
					icon="flower"
					heading="Total Supporters"
					data="104"
				/>
				<VoicedeckStats
					key="elephant"
					icon="elephant"
					heading="Total Support Received"
					data="3.6K"
					currency="USD"
				/>
				<VoicedeckStats
					key="candle"
					icon="candle"
					heading="# of Reports Fully Funded"
					data="12"
				/>
			</section>

			<article className="w-full max-w-screen-xl">
				<h2 className="text-3xl md:text-4xl font-semibold pt-6 md:pt-10">
					Reports
				</h2>
				<div className="flex flex-col md:flex-row md:justify-between md:items-end pb-8">
					<p className="text-base pb-4 md:pb-0 ">
						Find and fund reports that resonate with you.
					</p>
					<div className="flex flex-col md:flex-row gap-3">
						<Input
							className="h-10 border-vd-blue-500 bg-vd-beige-100 py-2 text-base font-medium placeholder:text-vd-blue-500 ring-offset-white focus-visible:ring-offset-2 focus-visible:ring-vd-blue-500 focus-visible:ring-2"
							type="search"
							placeholder="Search Reports"
						/>
						<Select>
							<SelectTrigger>
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="amount-needed">Amount Needed</SelectItem>
								<SelectItem value="newest-oldest">Newest to Oldest</SelectItem>
								<SelectItem value="oldest-newest">Oldest to Newest</SelectItem>
								<SelectItem value="most-contributors">
									Most Contributors
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="flex flex-col md:flex-row gap-10 pb-16">
					<section>
						<div className="border border-b-vd-blue-400 py-4">
							<h2 className="text-base font-medium pb-4">Categories</h2>
							{uniqueCategories.map((category: string) => (
								<div key={category} className="flex items-center gap-2 pb-1">
									<DynamicCategoryIcon
										category={category}
										color="#E48F85"
										strokeWidth="1.5"
										size="26"
									/>
									<p className="text-sm">{category}</p>
								</div>
							))}
						</div>
						<div className="border border-b-vd-blue-400 pt-6 pb-4">
							<h2 className="text-base font-medium pb-4">Amount needed</h2>

							{uniqueFundedAmounts.map((fundedSoFar: number) => (
								<div key={fundedSoFar} className="flex items-center gap-2 pb-1">
									<Circle size={18} strokeWidth={1} />
									<p className="text-xs">${1000 - fundedSoFar}</p>
								</div>
							))}
						</div>
						<div className="border border-b-vd-blue-400 pt-6 pb-4">
							<h2 className="text-base font-medium pb-4">Story from</h2>
							{uniqueMediaOutlets.map((outlet: string) => (
								<div key={outlet} className="flex items-center gap-2 pb-1">
									<Circle size={18} strokeWidth={1} />
									<p className="text-xs">{outlet}</p>
								</div>
							))}
						</div>
						<div className="border border-b-vd-blue-400 pt-6 pb-4">
							<h2 className="text-base font-medium pb-4">State</h2>
							{uniqueStates.map((state: string) => (
								<div key={state} className="flex items-center gap-2 pb-1">
									<Circle size={18} strokeWidth={1} />
									<p className="text-xs">{state}</p>
								</div>
							))}
						</div>
						<div className="flex flex-col gap-5 pt-8 pb-4">
							<Button>Apply</Button>
							<Button variant={"outline"}>Clear all</Button>
						</div>
					</section>
					<section className="grid grid-rows-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 md:gap-3">
						{reports.map((report: Report) => (
							<Link to={`/reports/${report.slug}`} key={report.hypercertId}>
								<Card
									key={report.hypercertId}
									className="w-full rounded-3xl bg-vd-beige-100 text-vd-blue-900"
								>
									<img
										src={report.image}
										alt="gpt-generated report illustration"
										className="w-full h-56 overflow-clip object-cover object-center rounded-t-3xl"
									/>
									<CardHeader className="space-y-0.5 px-5 py-3">
										<CardTitle className="text-lg font-bold tracking-wide leading-5 line-clamp-2">
											{report.title}
										</CardTitle>
										<CardDescription className="text-xs tracking-normal line-clamp-2">
											{report.summary}
										</CardDescription>
									</CardHeader>
									<CardContent className="flex justify-center gap-2 px-2 pb-3">
										<Badge className="gap-1 rounded-full px-2 py-1 text-[10px] font-normal">
											<DynamicCategoryIcon
												category={report.category}
												color="#E48F85"
												strokeWidth="1.5"
												size="14"
											/>
											<p>{report.category}</p>
										</Badge>
										<Badge className="gap-1 rounded-full px-2 py-1 text-[10px] font-normal">
											<MapPin color="#C14E41" strokeWidth={1} size={14} />
											<p>{report.state}</p>
										</Badge>
									</CardContent>
									<CardFooter className="flex-col justify-center gap-2 px-8 pb-4 pt-0">
										<Progress value={report.fundedSoFar / 10} />
										<p className="text-xs">
											${report.totalCost - report.fundedSoFar} still needed
										</p>
									</CardFooter>
								</Card>
							</Link>
						))}
					</section>
				</div>
			</article>
		</main>
	);
}
