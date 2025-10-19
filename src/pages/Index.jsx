import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-100 to-emerald-200 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8">
        <Sprout className="h-20 w-20 text-primary mx-auto" />
        <h1 className="text-5xl font-bold text-foreground">GreenGo Crop Helper</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Your complete agricultural companion for crop management, soil analysis, market insights, and expert advice
        </p>
        <Button size="lg" onClick={() => navigate("/auth")} className="mt-4">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
