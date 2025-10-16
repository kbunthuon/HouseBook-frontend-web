import { useParams, Link } from "react-router-dom";
import { Button } from "./ui/button";

export default function TransferSubmittedPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen w-full bg-muted/20 flex items-start justify-center p-6">
      <div className="w-full max-w-[560px] rounded-2xl bg-background shadow-sm border p-8 space-y-4">
        <h1 className="text-2xl font-semibold">Transfer request submitted</h1>
        <p className="text-muted-foreground">
          Your property transfer request has been submitted successfully. We’ll notify the current owner to approve it.
        </p>
        <div className="pt-2">
          <Button asChild className="w-full h-11 text-base">
            <Link to="/">Go to Dashboard</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Ref: <code>{id}</code></p>
      </div>
    </div>
  );
}
