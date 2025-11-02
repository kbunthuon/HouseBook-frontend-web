import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ui/table";
import { Button } from "@ui/button";
import { Badge } from "@ui/badge";
import { Copy, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Job, JobAsset } from "@backend/JobService";
import { useState } from "react";
import { PinManagementDialog } from "./PinManagementDialog";
import { Property } from "@shared/types/serverTypes";

export interface PinTableProps {
  propertyId: string;
  property: Property | null;
  jobs: Job[];
  jobAssets: JobAsset[];
  onDeleteJob: (jobId: string) => void;
  onSaveJobEdits: (updatedJob: Job) => void;
}

export function PinTable({ propertyId, property, jobs, jobAssets, onDeleteJob, onSaveJobEdits }: PinTableProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("PIN copied to clipboard");
    } catch {
      toast.error("Failed to copy PIN");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setIsPinDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsPinDialogOpen(false);
    setSelectedJob(null);
  };

  const handleSaveEdit = (updatedJob: Job) => {
    onSaveJobEdits(updatedJob);
    handleCloseDialog();
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>You do not have jobs yet</p>
        <p className="text-sm">Create a job</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PIN</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Number of Accessible Assets</TableHead>
            <TableHead>Created Time</TableHead>
            <TableHead>Expired Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const assetIds = job.id
              ? jobAssets.filter((a) => a.job_id.toString() === job.id!.toString()).map((a) => a.asset_id)
              : [];

            return (
              <TableRow key={job.id}>
                <TableCell>
                  <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{job.pin}</code>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{job.title}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground">
                    {assetIds.length} asset{assetIds.length !== 1 ? "s" : ""}
                  </p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(job.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {job.endTime ? new Date(job.endTime).toLocaleString() : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(job.pin)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditJob(job)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteJob(job.id!)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* PIN Management Dialog for editing */}
      {selectedJob && (
        <PinManagementDialog
          open={isPinDialogOpen}
          onOpenChange={setIsPinDialogOpen}
          propertyId={propertyId}
          property={property}
          job={selectedJob}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}