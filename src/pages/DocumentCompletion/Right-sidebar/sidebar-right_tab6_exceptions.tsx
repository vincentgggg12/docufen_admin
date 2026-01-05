// import { useState, useEffect, useRef } from "react";
// import { FileX, FileWarning, AlertTriangle, PlusCircle } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useTranslation } from "react-i18next";

// // Define the non-conformance interface
// interface NonConformance {
//   id: string;
//   number: number;
//   title: string;
//   description: string;
//   status: "open" | "closed";
//   createdAt: Date;
//   updatedAt: Date;
// }

// // Define the deviation interface
// interface Deviation {
//   id: string;
//   number: number;
//   title: string;
//   description: string;
//   status: "open" | "closed";
//   createdAt: Date;
//   updatedAt: Date;
// }

// // Define the exception type
// type ExceptionType = "non-conformance" | "deviation" | "";

// // Status chip component that matches the compliance page styling
// const StatusChip = ({ status }: { status: "open" | "closed" }) => {
//   return (
//     <Badge variant="outline" className="text-muted-foreground px-1.5 min-w-16 flex justify-center">
//       {status === "closed" ? (
//         <>
//           <IconCircleCheckFilled className="fill-primary dark:fill-primary" />
//           <span>closed</span>
//         </>
//       ) : (
//         <>
//           <IconLoader />
//           <span>open</span>
//         </>
//       )}
//     </Badge>
//   );
// };

// // Static icon for use in the sidebar navigation
// export const ExceptionsIcon = () => <AlertTriangle className="h-5 w-5" />;

// export function ExceptionsTab() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const { t } = useTranslation();
//   // State for non-conformances list
//   const [nonConformances, setNonConformances] = useState<NonConformance[]>([
//     {
//       id: "nc-1",
//       number: 1,
//       title: t('except.system-failed-at-startup'),
//       description: t('except.the-system-failed-to-initialize'),
//       status: "closed",
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
//       updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
//     },
//     {
//       id: "nc-2",
//       number: 2,
//       title: "User validation error",
//       description: "User authentication failed due to incorrect validation process.",
//       status: "open",
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
//       updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
//     }
//   ]);

//   // State for deviations list
//   const [deviations, setDeviations] = useState<Deviation[]>([
//     {
//       id: "dev-1",
//       number: 1,
//       title: "Temperature deviation",
//       description: "Temperature exceeded the acceptable range during processing.",
//       status: "closed",
//       createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
//       updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
//     },
//     {
//       id: "dev-2",
//       number: 2,
//       title: "Protocol deviation",
//       description: "Protocol steps were not followed according to the standard procedure.",
//       status: "open",
//       createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
//       updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
//     }
//   ]);

//   // Combined state for the add exception modal
//   const [isAddExceptionModalOpen, setIsAddExceptionModalOpen] = useState(false);
//   const [exceptionType, setExceptionType] = useState<ExceptionType>("");
//   const [newExceptionTitle, setNewExceptionTitle] = useState("");
//   const [newExceptionDescription, setNewExceptionDescription] = useState("");
//   const [newExceptionNumber, setNewExceptionNumber] = useState("");

//   // Event handlers to open the add modal from the parent component
//   useEffect(() => {
//     const currentContainer = containerRef.current;
    
//     const openAddModalHandler = () => {
//       setIsAddExceptionModalOpen(true);
//     };
    
//     if (currentContainer) {
//       currentContainer.addEventListener('openAddModal', openAddModalHandler);
//     }
    
//     return () => {
//       if (currentContainer) {
//         currentContainer.removeEventListener('openAddModal', openAddModalHandler);
//       }
//     };
//   }, []);

//   // Function to add a new exception (either non-conformance or deviation)
//   const handleAddException = () => {
//     if (!newExceptionTitle.trim() || !exceptionType) return;

//     if (exceptionType === "non-conformance") {
//       const newNonConformance: NonConformance = {
//         id: `nc-${Date.now()}`,
//         number: newExceptionNumber && parseInt(newExceptionNumber) ? parseInt(newExceptionNumber) : nonConformances.length + 1,
//         title: newExceptionTitle.trim(),
//         description: newExceptionDescription.trim(),
//         status: "open",
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };
//       setNonConformances([...nonConformances, newNonConformance]);
//     } else {
//       const newDeviation: Deviation = {
//         id: `dev-${Date.now()}`,
//         number: newExceptionNumber && parseInt(newExceptionNumber) ? parseInt(newExceptionNumber) : deviations.length + 1,
//         title: newExceptionTitle.trim(),
//         description: newExceptionDescription.trim(),
//         status: "open",
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };
//       setDeviations([...deviations, newDeviation]);
//     }

//     // Reset form and close modal
//     setNewExceptionTitle("");
//     setNewExceptionDescription("");
//     setNewExceptionNumber("");
//     setIsAddExceptionModalOpen(false);
//     setExceptionType("");
//   };

//   // Function to toggle the status of a non-conformance
//   const toggleNcStatus = (id: string) => {
//     setNonConformances(
//       nonConformances.map(nc =>
//         nc.id === id
//           ? { ...nc, status: nc.status === "open" ? "closed" : "open", updatedAt: new Date() }
//           : nc
//       )
//     );
//   };

//   // Function to toggle the status of a deviation
//   const toggleDevStatus = (id: string) => {
//     setDeviations(
//       deviations.map(dev =>
//         dev.id === id
//           ? { ...dev, status: dev.status === "open" ? "closed" : "open", updatedAt: new Date() }
//           : dev
//       )
//     );
//   };

//   return (
//     <div 
//       ref={containerRef}
//       data-exceptions-tab="true"
//       className="h-full bg-background overflow-auto"
//       style={{ backgroundColor: "#F5F2EE" }}
//     >
//       {/* Header with title and Add button */}
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-base font-medium">Exceptions</h2>
//         <Button 
//           variant="outline" 
//           size="sm" 
//           className="h-7 flex items-center gap-1"
//           onClick={() => setIsAddExceptionModalOpen(true)}
//         >
//           <PlusCircle className="h-3.5 w-3.5" />
//           <span>Add</span>
//         </Button>
//       </div>
      
//       {/* Non-Conformances Section */}
//       <div className="mb-4">
//         <div className="flex items-center justify-between mb-2">
//           <h3 className="text-sm font-medium">Non-Conformances</h3>
//         </div>
        
//         <div className="space-y-2">
//           {nonConformances.length === 0 ? (
//             <div className="flex items-center justify-center h-16 text-gray-500 text-sm">
//               No non-conformances yet
//             </div>
//           ) : (
//             nonConformances.map((nc) => (
//               <div 
//                 key={nc.id} 
//                 className="flex items-center gap-3 p-2 bg-[#FAF9F5] rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
//                 onClick={() => toggleNcStatus(nc.id)}
//               >
//                 <div className="flex items-center justify-center w-6 min-w-6 text-xs font-medium text-gray-500">
//                   {String(nc.number).padStart(2, '0')}
//                 </div>
                
//                 <FileX className="h-5 w-5 text-gray-500 flex-shrink-0" />
                
//                 <div className="flex-grow truncate">
//                   <span className="text-sm">{nc.title}</span>
//                 </div>
//                 <StatusChip status={nc.status} />
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Deviations Section */}
//       <div>
//         <div className="flex items-center justify-between mb-2">
//           <h3 className="text-sm font-medium">Deviations</h3>
//         </div>
        
//         <div className="space-y-2">
//           {deviations.length === 0 ? (
//             <div className="flex items-center justify-center h-16 text-gray-500 text-sm">
//               No deviations yet
//             </div>
//           ) : (
//             deviations.map((dev) => (
//               <div 
//                 key={dev.id} 
//                 className="flex items-center gap-3 p-2 bg-[#FAF9F5] rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
//                 onClick={() => toggleDevStatus(dev.id)}
//               >
//                 <div className="flex items-center justify-center w-6 min-w-6 text-xs font-medium text-gray-500">
//                   {String(dev.number).padStart(2, '0')}
//                 </div>
                
//                 <FileWarning className="h-5 w-5 text-gray-500 flex-shrink-0" />
                
//                 <div className="flex-grow truncate">
//                   <span className="text-sm">{dev.title}</span>
//                 </div>
//                 <StatusChip status={dev.status} />
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Add Exception Modal (Combined) */}
//       <Dialog open={isAddExceptionModalOpen} onOpenChange={setIsAddExceptionModalOpen}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Add an Exception</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <Label htmlFor="exception-type">Type</Label>
//               <Select
//                 value={exceptionType}
//                 onValueChange={(value) => setExceptionType(value as ExceptionType)}
//               >
//                 <SelectTrigger id="exception-type">
//                   <SelectValue placeholder="Select" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="non-conformance">Non-Conformance</SelectItem>
//                   <SelectItem value="deviation">Deviation</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="exception-title">Title</Label>
//               <Input
//                 id="exception-title"
//                 placeholder="Enter a title"
//                 value={newExceptionTitle}
//                 onChange={(e) => setNewExceptionTitle(e.target.value)}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="exception-number">Number (Optional)</Label>
//               <Input
//                 id="exception-number"
//                 placeholder="Enter a number"
//                 value={newExceptionNumber}
//                 onChange={(e) => setNewExceptionNumber(e.target.value)}
//                 type="number"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="exception-description">Description</Label>
//               <Textarea
//                 id="exception-description"
//                 placeholder="Enter a description"
//                 value={newExceptionDescription}
//                 onChange={(e) => setNewExceptionDescription(e.target.value)}
//                 rows={4}
//               />
//             </div>
//           </div>
//           <DialogFooter className="sm:justify-end">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => {
//                 setIsAddExceptionModalOpen(false);
//                 setNewExceptionTitle("");
//                 setNewExceptionDescription("");
//                 setNewExceptionNumber("");
//                 setExceptionType("");
//               }}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="button"
//               onClick={handleAddException}
//               disabled={!newExceptionTitle.trim() || !exceptionType}
//             >
//               Add
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// export default ExceptionsTab;
