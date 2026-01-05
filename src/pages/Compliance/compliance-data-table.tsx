// import * as React from "react"
// import {
//   IconChevronDown,
//   IconChevronLeft,
//   IconChevronRight,
//   IconChevronsLeft,
//   IconChevronsRight,
//   IconChevronUp,
//   IconTrash,
//   IconExternalLink,
//   IconSearch,
// } from "@tabler/icons-react"
// import { FileWarning, FileX, File } from "lucide-react"
// import {
//   ColumnDef,
//   ColumnFiltersState,
//   SortingState,
//   VisibilityState,
//   flexRender,
//   getCoreRowModel,
//   getFacetedRowModel,
//   getFacetedUniqueValues,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   useReactTable,
// } from "@tanstack/react-table"
// import { toast } from "sonner"
// import { z } from "zod"

// import { Badge } from "../../components/ui/badge"
// import { Button } from "../../components/ui/button"
// import { Input } from "../../components/ui/input"
// import { Label } from "../../components/ui/label"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../../components/ui/select"
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../../components/ui/table"
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "../../components/ui/tabs"
// import { Switch } from "../../components/ui/switch"

// export const schema = z.object({
//   id: z.number(),
//   header: z.string(),
//   type: z.string(),
//   status: z.string(),
//   documentCategory: z.string().optional(),
//   exceptionNumber: z.string(),
//   createdOn: z.string(),
//   owner: z.string(),
//   docufenId: z.string().optional(),
//   documentLink: z.string().optional(),
// })

// const columns: ColumnDef<z.infer<typeof schema>>[] = [
//   {
//     id: "expand",
//     header: () => null,
//     cell: ({ row }) => (
//       <div onClick={(e) => {
//         e.stopPropagation(); // This is good - prevent event bubbling
//         row.toggleExpanded();
//       }}
//       className="cursor-pointer"
//       >
//         {row.getIsExpanded() ? (
//           <IconChevronUp className="h-4 w-4" />
//         ) : (
//           <IconChevronDown className="h-4 w-4" />
//         )}
//       </div>
//     ),
//     enableSorting: false,
//     enableHiding: false,
//   },
//   {
//     accessorKey: "exceptionNumber",
//     header: "Number",
//     cell: ({ row }) => {
//       return <div className="text-sm font-normal text-gray-600">{row.original.exceptionNumber}</div>
//     },
//     enableHiding: false,
//   },
//   {
//     id: "type",
//     header: () => null,
//     cell: ({ row }) => {
//       if (row.original.documentCategory === "deviation") {
//         return <FileWarning className="h-4 w-4" />;
//       } else if (row.original.documentCategory === "non-conformance") {
//         return <FileX className="h-4 w-4" />;
//       } else {
//         return <File className="h-4 w-4" />;
//       }
//     },
//     enableSorting: false,
//     enableHiding: false,
//   },
//   {
//     accessorKey: "header",
//     header: "Exception Title",
//     cell: ({ row }) => {
//       return <div className="text-foreground">{row.original.header}</div>
//     },
//     enableHiding: false,
//   },
//   {
//     accessorKey: "type",
//     id: "typeDisplay", // Add this line to create a unique identifier
//     header: "Type",
//     cell: ({ row }) => (
//       <div className="w-32">
//         <Badge variant="outline" className="text-muted-foreground px-1.5">
//           {row.original.type}
//         </Badge>
//       </div>
//     ),
//   },
//   {
//     accessorKey: "owner",
//     header: "Owner",
//     cell: ({ row }) => (
//       <div className="text-sm font-normal text-gray-600">
//         {row.original.owner}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "createdOn",
//     header: "Created on",
//     cell: ({ row }) => {
//       const date = new Date(row.original.createdOn);
//       const day = date.getDate().toString().padStart(2, '0');
//       const month = date.toLocaleString('en-US', { month: 'short' });
//       const year = date.getFullYear();
//       const formattedDate = `${day}-${month}-${year}`;
      
//       return (
//         <div className="text-muted-foreground">
//           {formattedDate}
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "status",
//     header: "Status",
//     cell: ({ row }) => {
//       const status = row.original.status;
      
//       return (
//         <Badge className={
//           status === 'Open' ? "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-800" : 
//           status === 'Closed' ? "bg-[#FAF9F4] text-gray-700 hover:bg-[#FAF9F4] hover:text-gray-800" :
//           "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
//         }>
//           {status}
//         </Badge>
//       );
//     },
//   },
// ]

// export function ComplianceTableData({
//   data: initialData,
// }: {
//   data: z.infer<typeof schema>[]
// }) {
//   const enhancedData = React.useMemo(() => {
//     return initialData.map((item, index) => ({
//       ...item,
//       documentCategory: index < 3 ? "deviation" : "non-conformance",
//       docufenId: `DOCUF-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`, // Mock Docufen ID
//       documentLink: `https://docufen.com/documents/${Math.floor(Math.random() * 100000)}`, // Mock document link
//     }));
//   }, [initialData]);
  
//   const [data, _setData] = React.useState(() => enhancedData)
//   const [expandedState, setExpandedState] = React.useState<Record<string, boolean>>({})
//   const [columnVisibility, setColumnVisibility] =
//     React.useState<VisibilityState>({})
//   const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
//     []
//   )
//   const [sorting, setSorting] = React.useState<SortingState>([])
//   const [pagination, setPagination] = React.useState({
//     pageIndex: 0,
//     pageSize: 10,
//   })
//   const [searchQuery, setSearchQuery] = React.useState("");
//   const [viewMode, setViewMode] = React.useState<"detailed" | "compact">("detailed");
  
//   // Filter data based on search query
//   const filteredData = React.useMemo(() => {
//     return data.filter(item => {
//       const searchLower = searchQuery.toLowerCase();
//       return (
//         item.header.toLowerCase().includes(searchLower) ||
//         item.type.toLowerCase().includes(searchLower) ||
//         item.exceptionNumber.toLowerCase().includes(searchLower) ||
//         item.owner.toLowerCase().includes(searchLower) ||
//         item.status.toLowerCase().includes(searchLower)
//       );
//     });
//   }, [data, searchQuery]);

//   const table = useReactTable({
//     data: filteredData,
//     columns,
//     state: {
//       sorting,
//       columnVisibility,
//       columnFilters,
//       pagination,
//       expanded: expandedState,
//     },
//     getRowId: (row) => row.id.toString(),
//     onSortingChange: setSorting,
//     onColumnFiltersChange: setColumnFilters,
//     onColumnVisibilityChange: setColumnVisibility,
//     onPaginationChange: setPagination,
//     onExpandedChange: (updater: unknown) => {
//       setExpandedState((prev: Record<string, boolean>) => 
//         typeof updater === 'function' ? updater(prev) : updater
//       );
//     },
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFacetedRowModel: getFacetedRowModel(),
//     getFacetedUniqueValues: getFacetedUniqueValues(),
//     getExpandedRowModel: getCoreRowModel(),
//   })

//   // Determine which columns to hide in compact mode
//   React.useEffect(() => {
//     if (viewMode === "compact") {
//       setColumnVisibility({
//         owner: false,
//         createdOn: false,
//         type: false,
//       });
//     } else {
//       setColumnVisibility({});
//     }
//   }, [viewMode]);

//   return (
//     <Tabs
//       defaultValue="outline"
//       className="w-full flex-col justify-start gap-6"
//     >
//       <div className="flex items-center justify-between">
//         <Label htmlFor="view-selector" className="sr-only">
//           View
//         </Label>
//         <Select defaultValue="outline">
//           <SelectTrigger
//             className="flex w-fit @4xl/main:hidden"
//             size="sm"
//             id="view-selector"
//           >
//             <SelectValue placeholder="Select a view" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="outline">All Users</SelectItem>
//             <SelectItem value="past-performance">Active Users</SelectItem>
//             <SelectItem value="key-personnel">Pending</SelectItem>
//             <SelectItem value="focus-documents">External Users</SelectItem>
//           </SelectContent>
//         </Select>
//         <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
//           <TabsTrigger value="outline">All Users</TabsTrigger>
//           <TabsTrigger value="past-performance">
//             Active Users <Badge variant="secondary">3</Badge>
//           </TabsTrigger>
//           <TabsTrigger value="key-personnel">
//             Pending <Badge variant="secondary">2</Badge>
//           </TabsTrigger>
//           <TabsTrigger value="focus-documents">External Users</TabsTrigger>
//         </TabsList>
//         <div className="flex items-center gap-2">
//           {/* User Columns and Add User buttons removed */}
//         </div>
//       </div>
      
//       {/* Search and Toggle Section */}
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex items-center space-x-2">
//           <Switch
//             checked={viewMode === "detailed"}
//             onCheckedChange={(checked) => setViewMode(checked ? "detailed" : "compact")}
//             id="view-mode"
//           />
//           <Label htmlFor="view-mode" className="cursor-pointer text-sm font-medium">
//             {viewMode === "detailed" ? "Detailed View" : "Compact View"}
//           </Label>
//         </div>
        
//         <div className="relative w-80">
//           <Input
//             placeholder="Search exceptions..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="pl-10"
//           />
//           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
//             <IconSearch className="h-4 w-4" />
//           </div>
//         </div>
//       </div>
      
//       <TabsContent
//         value="outline"
//         className="relative flex flex-col gap-4 overflow-auto"
//       >
//         <div className="overflow-hidden rounded-lg border">
//           <Table className="w-full min-w-max">
//             <TableHeader>
//               {table.getHeaderGroups().map((headerGroup) => (
//                 <TableRow key={headerGroup.id} className="bg-table-header">
//                   {headerGroup.headers.map((header) => {
//                     return (
//                       <TableHead
//                         key={header.id}
//                         colSpan={header.colSpan}
//                         className="text-sm font-medium text-gray-600 bg-table-header border-b z-10"
//                       >
//                         {header.isPlaceholder
//                           ? null
//                           : flexRender(
//                               header.column.columnDef.header,
//                               header.getContext()
//                             )}
//                       </TableHead>
//                     )
//                   })}
//                 </TableRow>
//               ))}
//             </TableHeader>
//             <TableBody className="**:data-[slot=table-cell]:first:w-8">
//               {table.getRowModel().rows?.length ? (
//                 table.getRowModel().rows.map((row) => (
//                   <React.Fragment key={row.id}>
//                     <TableRow 
//                       className={`cursor-pointer ${viewMode === "compact" ? "h-10" : "h-12"} hover:bg-[#FAF9F4] ${expandedState[row.id.toString()] ? 'bg-[#FAF9F4]' : ''}`}
//                       onClick={(e) => {
//                         // Only toggle if not clicking on the expand icon cell
//                         if (!e.defaultPrevented) {
//                           row.toggleExpanded();
//                         }
//                       }}
//                       data-state={row.getIsSelected() && "selected"}
//                     >
//                       {row.getVisibleCells().map((cell) => (
//                         <TableCell key={cell.id}>
//                           {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                         </TableCell>
//                       ))}
//                     </TableRow>
//                     {expandedState[row.id.toString()] && (
//                       <TableRow className="bg-[#FAF9F4]">
//                         <TableCell colSpan={columns.length} className="p-0">
//                           <div className="grid grid-cols-1 gap-6 p-6">
//                             <div className="space-y-4">
//                               <div className="border rounded-md p-4 bg-white h-full">
//                                 <div className="flex items-center justify-between mb-4">
//                                   <h3 className="text-lg font-semibold text-gray-600">Document Information</h3>
//                                 </div>
//                                 <div className="space-y-4 mt-4">
//                                   <div className="space-y-1">
//                                     <Label className="text-xs text-muted-foreground">Docufen Document ID</Label>
//                                     <p className="text-sm font-medium text-gray-600">
//                                       {row.original.docufenId}
//                                     </p>
//                                   </div>
                                  
//                                   <div className="w-fit">
//                                     <Button 
//                                       variant="outline" 
//                                       size="sm" 
//                                       className="h-8 bg-white text-gray-600 hover:bg-gray-100"
//                                       onClick={(e) => {
//                                         e.stopPropagation();
//                                         // Open linked document
//                                         window.open(row.original.documentLink, '_blank');
//                                       }}
//                                     >
//                                       <IconExternalLink className="h-3.5 w-3.5 mr-1" />
//                                       Open Linked Document
//                                     </Button>
//                                   </div>
                                  
//                                   <div className="flex justify-end pt-4">
//                                     <Button 
//                                       variant="outline" 
//                                       size="sm" 
//                                       className="h-8 bg-white text-red-600 hover:bg-red-50"
//                                       onClick={(e) => {
//                                         e.stopPropagation();
//                                         // Delete functionality
//                                         toast.info("Delete action triggered");
//                                       }}
//                                     >
//                                       <IconTrash className="h-3.5 w-3.5 mr-1" />
//                                       Delete
//                                     </Button>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </React.Fragment>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell
//                     colSpan={columns.length}
//                     className="h-24 text-center"
//                   >
//                     No results.
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </div>
//         <div className="flex items-center justify-between">
//           <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
//             {table.getFilteredRowModel().rows.length} row(s) total.
//           </div>
//           <div className="flex w-full items-center gap-8 lg:w-fit">
//             <div className="hidden items-center gap-2 lg:flex">
//               <Label htmlFor="rows-per-page" className="text-sm font-medium">
//                 Rows per page
//               </Label>
//               <Select
//                 value={`${table.getState().pagination.pageSize}`}
//                 onValueChange={(value) => {
//                   table.setPageSize(Number(value))
//                 }}
//               >
//                 <SelectTrigger size="sm" className="w-20" id="rows-per-page">
//                   <SelectValue
//                     placeholder={table.getState().pagination.pageSize}
//                   />
//                 </SelectTrigger>
//                 <SelectContent side="top">
//                   {[10, 20, 30, 40, 50].map((pageSize) => (
//                     <SelectItem key={pageSize} value={`${pageSize}`}>
//                       {pageSize}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="flex w-fit items-center justify-center text-sm font-medium">
//               Page {table.getState().pagination.pageIndex + 1} of{" "}
//               {table.getPageCount()}
//             </div>
//             <div className="ml-auto flex items-center gap-2 lg:ml-0">
//               <Button
//                 variant="outline"
//                 className="hidden h-8 w-8 p-0 lg:flex"
//                 onClick={() => table.setPageIndex(0)}
//                 disabled={!table.getCanPreviousPage()}
//               >
//                 <span className="sr-only">Go to first page</span>
//                 <IconChevronsLeft />
//               </Button>
//               <Button
//                 variant="outline"
//                 className="size-8"
//                 size="icon"
//                 onClick={() => table.previousPage()}
//                 disabled={!table.getCanPreviousPage()}
//               >
//                 <span className="sr-only">Go to previous page</span>
//                 <IconChevronLeft />
//               </Button>
//               <Button
//                 variant="outline"
//                 className="size-8"
//                 size="icon"
//                 onClick={() => table.nextPage()}
//                 disabled={!table.getCanNextPage()}
//               >
//                 <span className="sr-only">Go to next page</span>
//                 <IconChevronRight />
//               </Button>
//               <Button
//                 variant="outline"
//                 className="hidden size-8 lg:flex"
//                 size="icon"
//                 onClick={() => table.setPageIndex(table.getPageCount() - 1)}
//                 disabled={!table.getCanNextPage()}
//               >
//                 <span className="sr-only">Go to last page</span>
//                 <IconChevronsRight />
//               </Button>
//             </div>
//           </div>
//         </div>
//       </TabsContent>
//       <TabsContent
//         value="past-performance"
//         className="flex flex-col"
//       >
//         <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
//       </TabsContent>
//       <TabsContent 
//         value="key-personnel" 
//         className="flex flex-col"
//       >
//         <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
//       </TabsContent>
//       <TabsContent
//         value="focus-documents"
//         className="flex flex-col"
//       >
//         <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
//       </TabsContent>
//     </Tabs>
//   )
// }
