// src/components/patterns/TabsContainer.tsx
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

interface TabsContainerProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
}

export default function TabsContainer({ tabs, defaultTab, className = "" }: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={className}>
      <TabsList className="mb-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
