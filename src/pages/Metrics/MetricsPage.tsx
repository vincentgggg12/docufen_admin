import React from 'react';
import { SidebarLeft } from "@/components/left-sidebar/sidebar-left";
import { SidebarInset } from "@/components/ui/sidebar";
import { MonthlyPagesChart } from "@/components/charts/MonthlyPagesChart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const MetricsPage: React.FC = () => {
  return (
    <>
      <SidebarLeft />
      <SidebarInset style={{ border: 'none' }}>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Metrics Dashboard</h1>
          <Tabs defaultValue="production" className="w-full">
            <TabsList>
              <TabsTrigger value="stage">Stage</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
            </TabsList>
            <TabsContent value="stage" className="mt-6">
              <div className="grid gap-6">
                <MonthlyPagesChart />
              </div>
            </TabsContent>
            <TabsContent value="production" className="mt-6">
              <div className="grid gap-6">
                <MonthlyPagesChart />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </>
  );
};

export default MetricsPage;
