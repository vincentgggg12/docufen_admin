// "use client"

// import * as React from "react"
// import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

// import { useIsMobile } from "../../hooks/use-mobile"
// import {
//   Card,
//   CardAction,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "../../components/ui/card"
// import {
//   ChartConfig,
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "../../components/ui/chart"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../../components/ui/select"
// import {
//   ToggleGroup,
//   ToggleGroupItem,
// } from "../../components/ui/toggle-group"

// export const description = "An interactive area chart"

// const chartData = [
//   { date: "2024-04-01", deviation: 150, nonconformance: 222 },
//   { date: "2024-04-02", deviation: 180, nonconformance: 97 },
//   { date: "2024-04-03", deviation: 120, nonconformance: 167 },
//   { date: "2024-04-04", deviation: 260, nonconformance: 242 },
//   { date: "2024-04-05", deviation: 290, nonconformance: 373 },
//   { date: "2024-04-06", deviation: 340, nonconformance: 301 },
//   { date: "2024-04-07", deviation: 180, nonconformance: 245 },
//   { date: "2024-04-08", deviation: 320, nonconformance: 409 },
//   { date: "2024-04-09", deviation: 110, nonconformance: 59 },
//   { date: "2024-04-10", deviation: 190, nonconformance: 261 },
//   { date: "2024-04-11", deviation: 350, nonconformance: 327 },
//   { date: "2024-04-12", deviation: 210, nonconformance: 292 },
//   { date: "2024-04-13", deviation: 380, nonconformance: 342 },
//   { date: "2024-04-14", deviation: 220, nonconformance: 137 },
//   { date: "2024-04-15", deviation: 170, nonconformance: 120 },
//   { date: "2024-04-16", deviation: 190, nonconformance: 138 },
//   { date: "2024-04-17", deviation: 360, nonconformance: 446 },
//   { date: "2024-04-18", deviation: 410, nonconformance: 364 },
//   { date: "2024-04-19", deviation: 180, nonconformance: 243 },
//   { date: "2024-04-20", deviation: 150, nonconformance: 89 },
//   { date: "2024-04-21", deviation: 200, nonconformance: 137 },
//   { date: "2024-04-22", deviation: 170, nonconformance: 224 },
//   { date: "2024-04-23", deviation: 230, nonconformance: 138 },
//   { date: "2024-04-24", deviation: 290, nonconformance: 387 },
//   { date: "2024-04-25", deviation: 250, nonconformance: 215 },
//   { date: "2024-04-26", deviation: 130, nonconformance: 75 },
//   { date: "2024-04-27", deviation: 420, nonconformance: 383 },
//   { date: "2024-04-28", deviation: 180, nonconformance: 122 },
//   { date: "2024-04-29", deviation: 240, nonconformance: 315 },
//   { date: "2024-04-30", deviation: 380, nonconformance: 454 },
//   { date: "2024-05-01", deviation: 220, nonconformance: 165 },
//   { date: "2024-05-02", deviation: 310, nonconformance: 293 },
//   { date: "2024-05-03", deviation: 190, nonconformance: 247 },
//   { date: "2024-05-04", deviation: 420, nonconformance: 385 },
//   { date: "2024-05-05", deviation: 390, nonconformance: 481 },
//   { date: "2024-05-06", deviation: 520, nonconformance: 498 },
//   { date: "2024-05-07", deviation: 300, nonconformance: 388 },
//   { date: "2024-05-08", deviation: 210, nonconformance: 149 },
//   { date: "2024-05-09", deviation: 180, nonconformance: 227 },
//   { date: "2024-05-10", deviation: 330, nonconformance: 293 },
//   { date: "2024-05-11", deviation: 270, nonconformance: 335 },
//   { date: "2024-05-12", deviation: 240, nonconformance: 197 },
//   { date: "2024-05-13", deviation: 160, nonconformance: 197 },
//   { date: "2024-05-14", deviation: 490, nonconformance: 448 },
//   { date: "2024-05-15", deviation: 380, nonconformance: 473 },
//   { date: "2024-05-16", deviation: 400, nonconformance: 338 },
//   { date: "2024-05-17", deviation: 420, nonconformance: 499 },
//   { date: "2024-05-18", deviation: 350, nonconformance: 315 },
//   { date: "2024-05-19", deviation: 180, nonconformance: 235 },
//   { date: "2024-05-20", deviation: 230, nonconformance: 177 },
//   { date: "2024-05-21", deviation: 140, nonconformance: 82 },
//   { date: "2024-05-22", deviation: 120, nonconformance: 81 },
//   { date: "2024-05-23", deviation: 290, nonconformance: 252 },
//   { date: "2024-05-24", deviation: 220, nonconformance: 294 },
//   { date: "2024-05-25", deviation: 250, nonconformance: 201 },
//   { date: "2024-05-26", deviation: 170, nonconformance: 213 },
//   { date: "2024-05-27", deviation: 460, nonconformance: 420 },
//   { date: "2024-05-28", deviation: 190, nonconformance: 233 },
//   { date: "2024-05-29", deviation: 130, nonconformance: 78 },
//   { date: "2024-05-30", deviation: 280, nonconformance: 340 },
//   { date: "2024-05-31", deviation: 230, nonconformance: 178 },
//   { date: "2024-06-01", deviation: 200, nonconformance: 178 },
//   { date: "2024-06-02", deviation: 410, nonconformance: 470 },
//   { date: "2024-06-03", deviation: 160, nonconformance: 103 },
//   { date: "2024-06-04", deviation: 380, nonconformance: 439 },
//   { date: "2024-06-05", deviation: 140, nonconformance: 88 },
//   { date: "2024-06-06", deviation: 250, nonconformance: 294 },
//   { date: "2024-06-07", deviation: 370, nonconformance: 323 },
//   { date: "2024-06-08", deviation: 320, nonconformance: 385 },
//   { date: "2024-06-09", deviation: 480, nonconformance: 438 },
//   { date: "2024-06-10", deviation: 200, nonconformance: 155 },
//   { date: "2024-06-11", deviation: 150, nonconformance: 92 },
//   { date: "2024-06-12", deviation: 420, nonconformance: 492 },
//   { date: "2024-06-13", deviation: 130, nonconformance: 81 },
//   { date: "2024-06-14", deviation: 380, nonconformance: 426 },
//   { date: "2024-06-15", deviation: 350, nonconformance: 307 },
//   { date: "2024-06-16", deviation: 310, nonconformance: 371 },
//   { date: "2024-06-17", deviation: 520, nonconformance: 475 },
//   { date: "2024-06-18", deviation: 170, nonconformance: 107 },
//   { date: "2024-06-19", deviation: 290, nonconformance: 341 },
//   { date: "2024-06-20", deviation: 450, nonconformance: 408 },
//   { date: "2024-06-21", deviation: 210, nonconformance: 169 },
//   { date: "2024-06-22", deviation: 270, nonconformance: 317 },
//   { date: "2024-06-23", deviation: 530, nonconformance: 480 },
//   { date: "2024-06-24", deviation: 180, nonconformance: 132 },
//   { date: "2024-06-25", deviation: 190, nonconformance: 141 },
//   { date: "2024-06-26", deviation: 380, nonconformance: 434 },
//   { date: "2024-06-27", deviation: 490, nonconformance: 448 },
//   { date: "2024-06-28", deviation: 200, nonconformance: 149 },
//   { date: "2024-06-29", deviation: 160, nonconformance: 103 },
//   { date: "2024-06-30", deviation: 400, nonconformance: 446 },
// ]

// const chartConfig = {
//   visitors: {
//     label: "Visitors",
//   },
//   deviation: {
//     label: "Deviations",
//     color: "#1CC355", // Bright green
//   },
//   nonconformance: {
//     label: "Non-Conformances",
//     color: "#115427", // Dark green
//   },
// } satisfies ChartConfig

// export function ComplianceChartArea() {
//   const isMobile = useIsMobile()
//   const [timeRange, setTimeRange] = React.useState("90d")

//   React.useEffect(() => {
//     if (isMobile) {
//       setTimeRange("7d")
//     }
//   }, [isMobile])

//   const filteredData = chartData.filter((item) => {
//     const date = new Date(item.date)
//     const referenceDate = new Date("2024-06-30")
//     let daysToSubtract = 90
//     if (timeRange === "30d") {
//       daysToSubtract = 30
//     } else if (timeRange === "7d") {
//       daysToSubtract = 7
//     }
//     const startDate = new Date(referenceDate)
//     startDate.setDate(startDate.getDate() - daysToSubtract)
//     return date >= startDate
//   })

//   return (
//     <Card className="@container/card">
//       <CardHeader>
//         <CardTitle>Total Deviations and Non-Conformances</CardTitle>
//         <CardDescription>
//           <span className="hidden @[540px]/card:block">
//             Total for the last 3 months
//           </span>
//           <span className="@[540px]/card:hidden">Last 3 months</span>
//         </CardDescription>
//         <CardAction>
//           <ToggleGroup
//             type="single"
//             value={timeRange}
//             onValueChange={setTimeRange}
//             variant="outline"
//             className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
//           >
//             <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
//             <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
//             <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
//           </ToggleGroup>
//           <Select value={timeRange} onValueChange={setTimeRange}>
//             <SelectTrigger
//               className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
//               size="sm"
//               aria-label="Select a value"
//             >
//               <SelectValue placeholder="Last 3 months" />
//             </SelectTrigger>
//             <SelectContent className="rounded-xl">
//               <SelectItem value="90d" className="rounded-lg">
//                 Last 3 months
//               </SelectItem>
//               <SelectItem value="30d" className="rounded-lg">
//                 Last 30 days
//               </SelectItem>
//               <SelectItem value="7d" className="rounded-lg">
//                 Last 7 days
//               </SelectItem>
//             </SelectContent>
//           </Select>
//         </CardAction>
//       </CardHeader>
//       <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
//         <ChartContainer
//           config={chartConfig}
//           className="aspect-auto h-[250px] w-full"
//         >
//           <AreaChart data={filteredData}>
//             <defs>
//               <linearGradient id="fillNonconformance" x1="0" y1="0" x2="0" y2="1">
//                 <stop
//                   offset="5%"
//                   stopColor="#115427"
//                   stopOpacity={1.0}
//                 />
//                 <stop
//                   offset="95%"
//                   stopColor="#115427"
//                   stopOpacity={0.1}
//                 />
//               </linearGradient>
//               <linearGradient id="fillDeviation" x1="0" y1="0" x2="0" y2="1">
//                 <stop
//                   offset="5%"
//                   stopColor="#1CC355"
//                   stopOpacity={0.8}
//                 />
//                 <stop
//                   offset="95%"
//                   stopColor="#1CC355"
//                   stopOpacity={0.1}
//                 />
//               </linearGradient>
//             </defs>
//             <CartesianGrid vertical={false} />
//             <XAxis
//               dataKey="date"
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               minTickGap={32}
//               tickFormatter={(value) => {
//                 const date = new Date(value)
//                 return date.toLocaleDateString("en-US", {
//                   month: "short",
//                   day: "numeric",
//                 })
//               }}
//             />
//             <ChartTooltip
//               cursor={false}
//               defaultIndex={isMobile ? -1 : 10}
//               content={
//                 <ChartTooltipContent
//                   labelFormatter={(value) => {
//                     return new Date(value).toLocaleDateString("en-US", {
//                       month: "short",
//                       day: "numeric",
//                     })
//                   }}
//                   indicator="dot"
//                 />
//               }
//             />
//             <Area
//               dataKey="deviation"
//               type="natural"
//               fill="url(#fillDeviation)"
//               stroke="#1CC355"
//               stackId="a"
//             />
//             <Area
//               dataKey="nonconformance"
//               type="natural"
//               fill="url(#fillNonconformance)"
//               stroke="#115427"
//               stackId="a"
//             />
//           </AreaChart>
//         </ChartContainer>
//       </CardContent>
//     </Card>
//   )
// }
