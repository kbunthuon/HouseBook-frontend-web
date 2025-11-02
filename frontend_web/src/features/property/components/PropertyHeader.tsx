import { ArrowLeft, Edit } from "lucide-react";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import React from "react";
import { Property } from "@housebookgroup/shared-types";

interface PropertyHeaderProps {
  property?: Property | null;
  onBack: () => void;
  onEditProperty: () => void;
}

export default function PropertyHeader({ property, onBack, onEditProperty }: PropertyHeaderProps) {
  const status = (property && (property as any).status) ?? "Active";

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Properties
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant="default">{status}</Badge>
        <Button variant="outline" size="sm" onClick={onEditProperty}>
          <Edit className="h-4 w-4 mr-2" />Edit Property
        </Button>
      </div>
    </div>
  );
}
