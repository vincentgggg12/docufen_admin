// "use client"

// import * as React from "react"
// import { TrendingUp } from "lucide-react"
// import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"

// // Define colors directly without HSL variables
// const chartData = [
//   { name: "Quality", value: 275, fill: "#0D3E1D" }, 
//   { name: "Production", value: 200, fill: "#1CC355" }, 
//   { name: "Regulatory", value: 287, fill: "#19A044" }, 
//   { name: "Safety", value: 173, fill: "#115427" }, 
//   { name: "Other", value: 190, fill: "#072511" }, 
// ]


// const COLORS = ['#0D3E1D', '#1CC355', '#19A044', '#115427', '#072511'];

// export function Component() {
//   const totalVisitors = React.useMemo(() => {
//     return chartData.reduce((acc, curr) => acc + curr.value, 0)
//   }, [])

//   return (
//     <Card className="flex flex-col">
//       <CardHeader className="items-center pb-0">
//         <CardTitle>Pie Chart - Donut with Text</CardTitle>
//         <CardDescription>January - June 2024</CardDescription>
//       </CardHeader>
//       <CardContent className="flex-1 pb-0">
//         <div className="mx-auto aspect-square h-[250px] w-full">
//           <ResponsiveContainer width="100%" height="100%">
//             <PieChart>
//               <Pie
//                 data={chartData}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 innerRadius={50}
//                 outerRadius={80}
//                 paddingAngle={1}
//                 dataKey="value"
//                 stroke="#fff"
//                 strokeWidth={1}
//               >
//                 {chartData.map((_entry, index) => (
//                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>
//               <text
//                 x="50%"
//                 y="50%"
//                 textAnchor="middle"
//                 dominantBaseline="middle"
//                 style={{ 
//                   fontSize: '24px', 
//                   fontWeight: 'bold',
//                   fill: 'var(--foreground)' 
//                 }}
//               >
//                 {totalVisitors.toLocaleString()}
//               </text>
//               <text
//                 x="50%"
//                 y="58%"
//                 textAnchor="middle"
//                 dominantBaseline="middle"
//                 style={{ 
//                   fontSize: '12px',
//                   fill: 'var(--muted-foreground)' 
//                 }}
//               >
//                 Visitors
//               </text>
//             </PieChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//       <CardFooter className="flex-col gap-2 text-sm">
//         <div className="flex items-center gap-2 font-medium leading-none">
//           Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
//         </div>
//         <div className="leading-none text-muted-foreground">
//           Showing total visitors for the last 6 months
//         </div>
//       </CardFooter>
//     </Card>
//   )
// }
