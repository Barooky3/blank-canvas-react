import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBannedStatus } from '@/hooks/useBannedStatus';

const SESSION_KEY = 'bannedNoticeAcknowledged';

export const BannedUserPopup = () => {
  const { user } = useAuth();
  const { isBanned } = useBannedStatus();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isBanned || !user?.email) return;
    const ackedFor = sessionStorage.getItem(SESSION_KEY);
    if (ackedFor === user.email.toLowerCase()) return;
    setOpen(true);
  }, [isBanned, user?.email]);

  const handleAcknowledge = () => {
    if (user?.email) {
      sessionStorage.setItem(SESSION_KEY, user.email.toLowerCase());
    }
    setOpen(false);
  };

  if (!isBanned) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">Account Banned</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed">
            Your account <strong className="text-foreground">{user?.email}</strong> has been
            banned for abuse. You can continue to browse the site, but you will not be able to
            place any new orders while signed in to this account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleAcknowledge}>I Understand</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
