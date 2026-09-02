import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inbox, MessagesSquare, Trash2, Send, ChevronLeft, Mail, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  adminListConversations, adminReply, adminMarkRead, adminDeleteConversation, type Conversation,
} from '@/lib/contactApi';

const QK = ['admin', 'contact-conversations'] as const;

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function ContactMessagesAdmin() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: QK,
    queryFn: adminListConversations,
    refetchInterval: 30_000,
  });

  const conversations = data ?? [];
  const newOnes = useMemo(() => conversations.filter((c) => c.status === 'new'), [conversations]);
  const active = useMemo(() => conversations.filter((c) => c.status === 'active'), [conversations]);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const markRead = useMutation({
    mutationFn: adminMarkRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });

  const del = useMutation({
    mutationFn: adminDeleteConversation,
    onSuccess: () => {
      toast({ title: 'Conversation deleted' });
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });

  const send = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => adminReply(id, body),
    onSuccess: (res) => {
      setReply('');
      qc.invalidateQueries({ queryKey: QK });
      toast(
        res.emailed
          ? { title: 'Reply sent', description: 'The customer has been emailed your response.' }
          : { title: 'Reply saved, but email failed', description: res.emailError || 'Check RESEND settings.', variant: 'destructive' },
      );
    },
    onError: (e: Error) => toast({ title: 'Could not send reply', description: e.message, variant: 'destructive' }),
  });

  const open = (c: Conversation) => {
    setSelectedId(c.id);
    setReply('');
    if (c.admin_unread) markRead.mutate(c.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading messages…
      </div>
    );
  }
  if (isError) {
    return (
      <div className="border border-destructive/40 p-6 text-sm">
        <p className="text-destructive mb-3">{(error as Error).message}</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  // ---------- thread view ----------
  if (selected) {
    return (
      <div className="border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} aria-label="Back to messages">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h3 className="font-display text-lg text-foreground truncate">{selected.subject || '(no subject)'}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {selected.customer_name} · <a className="hover:underline" href={`mailto:${selected.customer_email}`}>{selected.customer_email}</a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={selected.status === 'new' ? 'default' : 'secondary'} className="uppercase tracking-wider text-[10px]">
              {selected.status === 'new' ? 'New' : 'Active'}
            </Badge>
            <DeleteButton onConfirm={() => del.mutate(selected.id)} pending={del.isPending} />
          </div>
        </div>

        <div className="p-4 max-h-[50vh] overflow-y-auto flex flex-col gap-4 bg-muted/20">
          {selected.messages.map((m) => {
            const mine = m.sender === 'admin';
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] p-3 text-sm leading-relaxed whitespace-pre-wrap border ${
                  mine ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border'
                }`}>
                  <div className={`text-[10px] uppercase tracking-[0.15em] mb-1 ${mine ? 'text-background/60' : 'text-muted-foreground'}`}>
                    {mine ? 'You' : selected.customer_name} · {fmt(m.created_at)}
                  </div>
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>

        <form
          className="border-t border-border p-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const body = reply.trim();
            if (body) send.mutate({ id: selected.id, body });
          }}
        >
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={`Write your reply to ${selected.customer_name}…`}
            className="min-h-[120px] rounded-none resize-y"
            maxLength={5000}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Sends a branded email to {selected.customer_email} with a reply button.
            </p>
            <Button type="submit" disabled={!reply.trim() || send.isPending} className="rounded-none gap-2 uppercase tracking-wider text-xs">
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send reply
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ---------- list view ----------
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {conversations.length === 0 ? 'No messages yet.' : `${newOnes.length} new · ${active.length} active`}
        </p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Section
        icon={<Inbox className="h-4 w-4" />}
        title="New messages"
        subtitle="Messages from the contact form you haven't replied to yet"
        items={newOnes}
        empty="Nothing new — you're all caught up."
        onOpen={open}
        onDelete={(id) => del.mutate(id)}
        deleting={del.isPending}
      />

      <Section
        icon={<MessagesSquare className="h-4 w-4" />}
        title="Active conversations"
        subtitle="Conversations you've replied to — customers can keep replying by email"
        items={active}
        empty="No active conversations yet. Reply to a new message to start one."
        onOpen={open}
        onDelete={(id) => del.mutate(id)}
        deleting={del.isPending}
      />
    </div>
  );
}

function Section({
  icon, title, subtitle, items, empty, onOpen, onDelete, deleting,
}: {
  icon: React.ReactNode; title: string; subtitle: string; items: Conversation[]; empty: string;
  onOpen: (c: Conversation) => void; onDelete: (id: string) => void; deleting: boolean;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-1 text-foreground">
        {icon}
        <h3 className="font-display text-lg">{title}</h3>
        <span className="text-xs text-muted-foreground ml-1">({items.length})</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>

      {items.length === 0 ? (
        <div className="border border-dashed border-border p-6 text-sm text-muted-foreground text-center">{empty}</div>
      ) : (
        <ul className="border border-border divide-y divide-border">
          {items.map((c) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <li key={c.id} className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => onOpen(c)}
                  className="flex-1 min-w-0 text-left p-4 hover:bg-muted/40 transition-colors flex gap-4 items-start"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c.admin_unread ? 'bg-accent' : 'bg-transparent'}`} aria-label={c.admin_unread ? 'Unread' : undefined} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={`truncate ${c.admin_unread ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                        {c.customer_name} <span className="text-muted-foreground font-normal text-xs">· {c.customer_email}</span>
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">{fmt(c.last_message_at)}</span>
                    </span>
                    <span className="block text-sm text-foreground/90 truncate mt-0.5">{c.subject || '(no subject)'}</span>
                    {last && (
                      <span className="block text-xs text-muted-foreground truncate mt-0.5">
                        {last.sender === 'admin' ? 'You: ' : ''}{last.body}
                      </span>
                    )}
                  </span>
                </button>
                <div className="flex items-center pr-3">
                  <DeleteButton onConfirm={() => onDelete(c.id)} pending={deleting} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function DeleteButton({ onConfirm, pending }: { onConfirm: () => void; pending: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label="Delete conversation" disabled={pending}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the message thread. The customer will not be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
