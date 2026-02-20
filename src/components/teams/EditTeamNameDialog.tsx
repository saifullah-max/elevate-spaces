import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EditTeamNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  currentName: string;
  onSubmit: (name: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  successMessage?: string | null;
}

export function EditTeamNameDialog({
  open,
  onOpenChange,
  teamId,
  currentName,
  onSubmit,
  loading,
  error,
  successMessage,
}: EditTeamNameDialogProps) {
  const [name, setName] = useState(currentName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter new team name"
            disabled={loading}
            className="mb-4"
          />
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {successMessage && <div className="text-green-600 text-sm mb-2">{successMessage}</div>}
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
