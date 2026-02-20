import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface LeaveTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  isLoading?: boolean;
  onLeave: () => void;
}

export function LeaveTeamModal({ open, onOpenChange, teamName, isLoading, onLeave }: LeaveTeamModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Leave Team
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to leave the team <b>{teamName}</b>?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onLeave} disabled={isLoading}>
            {isLoading ? "Leaving..." : "Leave"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
