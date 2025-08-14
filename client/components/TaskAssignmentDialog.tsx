import { useState } from 'react';
import { Users, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { type TeamMember } from '@shared/dao';

interface TaskAssignmentDialogProps {
  currentAssignedTo?: string;
  availableMembers: TeamMember[];
  onAssignmentChange: (memberId?: string) => void;
  taskName: string;
}

export default function TaskAssignmentDialog({ 
  currentAssignedTo, 
  availableMembers, 
  onAssignmentChange,
  taskName 
}: TaskAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | undefined>(currentAssignedTo);

  const handleSave = () => {
    onAssignmentChange(selectedMember);
    setOpen(false);
  };

  const handleCancel = () => {
    setSelectedMember(currentAssignedTo);
    setOpen(false);
  };

  const handleRemoveAssignment = () => {
    setSelectedMember(undefined);
  };

  const currentMember = availableMembers.find(m => m.id === currentAssignedTo);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {currentMember ? (
          <button
            className="inline-flex items-center rounded-md border border-input bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {currentMember.name}
          </button>
        ) : (
          <Button variant="outline" size="sm" className="h-6 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Assigner
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assigner la tâche
          </DialogTitle>
          <DialogDescription>
            Assignez un membre d'équipe à la tâche : "{taskName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Membre assigné</Label>
            {selectedMember ? (
              <div className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">
                    {availableMembers.find(m => m.id === selectedMember)?.name}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {availableMembers.find(m => m.id === selectedMember)?.role === 'chef_equipe' ? 'Chef d\'équipe' : 'Membre d\'équipe'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAssignment}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun membre assigné</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Choisir un membre</Label>
            <Select
              value={selectedMember || 'unassigned'}
              onValueChange={(value) => setSelectedMember(value === 'unassigned' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Non assigné</SelectItem>
                {availableMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <span>{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.role === 'chef_equipe' ? 'Chef' : 'Membre'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
