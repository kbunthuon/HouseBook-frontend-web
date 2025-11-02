import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";
import { Button } from "@ui/button";
import { Key, Plus } from "lucide-react";
import { PinTable } from "../components/PinTable";
import { Property } from "@housebookgroup/shared-types";
import { Job, JobAsset } from "@backend/JobService";

interface JobsSectionProps {
  propertyId: string;
  property: Property | null;
  jobs: Job[];
  jobAssets: JobAsset[];
  onDeleteJob: (jobId: string) => void;
  onSaveJobEdits: (updatedJob: Job) => void;
  onOpenPinDialog: () => void;
}

export default function JobsSection({ propertyId, property, jobs, jobAssets, onDeleteJob, onSaveJobEdits, onOpenPinDialog }: JobsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2" />Jobs & Access Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex justify-end">
          <Button onClick={onOpenPinDialog}>
            <Plus className="h-4 w-4 mr-2" />Create New Job
          </Button>
        </div>

        <PinTable
          propertyId={propertyId}
          property={property}
          jobs={jobs}
          jobAssets={jobAssets}
          onDeleteJob={onDeleteJob}
          onSaveJobEdits={onSaveJobEdits}
        />
      </CardContent>
    </Card>
  );
}
