'use client'
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateTeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    onNameChange: (value: string) => void;
    description: string;
    onDescriptionChange: (value: string) => void;
    loading: boolean;
    message: string | null;
    error: string | null;
    onSubmit: (e: React.FormEvent) => void;
}

export function CreateTeamDialog({
    open,
    onOpenChange,
    name,
    onNameChange,
    description,
    onDescriptionChange,
    loading,
    message,
    error,
    onSubmit,
}: CreateTeamDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Team
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Create a New Team</DialogTitle>
                    <DialogDescription>
                        Set up a new team to collaborate with your members
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="team-name">
                            Team Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="team-name"
                            type="text"
                            placeholder="Enter team name"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">
                            Description <span className="text-slate-400 text-sm">(optional)</span>
                        </Label>
                        <textarea
                            id="description"
                            placeholder="Describe your team's purpose"
                            value={description}
                            onChange={(e) => onDescriptionChange(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                            rows={3}
                        />
                    </div>

                    {message && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 text-sm font-medium">{message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Creating...
                            </>
                        ) : (
                            "Create Team"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
