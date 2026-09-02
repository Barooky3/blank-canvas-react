import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getReplyThread, sendCustomerReply } from '@/lib/contactApi';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ConversationReply = () => {
  const { token = '' } = useParams<{ token: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [text, setText] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reply-thread', token],
    queryFn: () => getReplyThread(token),
    enabled: !!token,
    retry: false,
  });

  const send = useMutation({
    mutationFn: (body: string) => sendCustomerReply(token, body),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['reply-thread', token] });
      toast({ title: 'Reply sent', description: "We've received your message and will get back to you by email." });
    },
    onError: (e: Error) => toast({ title: 'Could not send reply', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="min-h-screen py-20 md:py-28 bg-background">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] text-muted-foreground font-medium mb-4 uppercase">Your conversation</p>
            <h1 className="font-display text-3xl md:text-4xl text-foreground text-balance">
              {isLoading ? 'Loading…' : data?.conversation.subject || 'Your message to Parfumistry'}
            </h1>
            {data && (
              <p className="text-sm text-muted-foreground mt-3">
                Started {fmt(data.conversation.created_at)} · Replies are sent to the email you contacted us with.
              </p>
            )}
          </div>

          {isLoading && (
            <div className="flex justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {isError && (
            <div className="border border-border p-8 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
              <p className="text-foreground mb-2">{(error as Error).message}</p>
              <p className="text-sm text-muted-foreground mb-6">This reply link may be invalid or the conversation may have been closed.</p>
              <Button asChild variant="outline" className="rounded-none uppercase tracking-wider text-xs">
                <Link to="/contact">Send a new message</Link>
              </Button>
            </div>
          )}

          {data && (
            <div className="border border-border">
              <div className="p-5 md:p-6 flex flex-col gap-4 bg-muted/20 max-h-[55vh] overflow-y-auto">
                {data.messages.map((m) => {
                  const mine = m.sender === 'customer';
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 text-sm leading-relaxed whitespace-pre-wrap border ${
                        mine ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border'
                      }`}>
                        <div className={`text-[10px] uppercase tracking-[0.15em] mb-1.5 ${mine ? 'text-background/60' : 'text-accent'}`}>
                          {mine ? 'You' : 'Parfumistry'} · {fmt(m.created_at)}
                        </div>
                        {m.body}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                className="border-t border-border p-5 md:p-6 flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = text.trim();
                  if (body) send.mutate(body);
                }}
              >
                <label htmlFor="reply" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
                  Your reply
                </label>
                <Textarea
                  id="reply"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your reply…"
                  required
                  maxLength={5000}
                  className="min-h-[140px] bg-background border-border rounded-none focus:border-foreground resize-y"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!text.trim() || send.isPending}
                  className="w-full h-14 text-xs font-medium tracking-[0.15em] uppercase rounded-none gap-2"
                >
                  {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {send.isPending ? 'Sending…' : 'Send reply'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationReply;
