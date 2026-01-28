import React from 'react';
import { HandCoins, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatRelativeTime } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface MoneyRequest {
  id: string;
  amount: number;
  note?: string;
  status: string;
  created_at: string;
  requester?: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  };
  requested_from?: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  };
}

interface PendingRequestsProps {
  incoming: MoneyRequest[];
  outgoing: MoneyRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  isLoading?: boolean;
}

const PendingRequests = React.forwardRef<HTMLDivElement, PendingRequestsProps>(
  ({ incoming, outgoing, onAccept, onDecline, isLoading }, ref) => {
    const pendingIncoming = incoming.filter(r => r.status === 'pending');
    const pendingOutgoing = outgoing.filter(r => r.status === 'pending');

    if (pendingIncoming.length === 0 && pendingOutgoing.length === 0) {
      return null;
    }

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    return (
      <div ref={ref} className="mb-6">
        {/* Incoming requests - need to pay */}
        {pendingIncoming.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-warning-soft flex items-center justify-center">
                <HandCoins className="w-3.5 h-3.5 text-warning" />
              </div>
              <h3 className="text-sm font-medium text-foreground">Payment Requests</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning-soft text-warning font-medium">
                {pendingIncoming.length}
              </span>
            </div>

            <div className="space-y-2">
              {pendingIncoming.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-card border border-warning/20 rounded-2xl"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                      {getInitials(request.requester?.name || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {request.requester?.name || 'Someone'} requested money
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{request.requester?.username || 'unknown'}
                      </p>
                      {request.note && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          "{request.note}"
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-foreground">
                        {formatCurrency(request.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(request.created_at))}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="send"
                      size="sm"
                      onClick={() => onAccept(request.id)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4" />
                      Pay
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDecline(request.id)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing pending requests - waiting for response */}
        {pendingOutgoing.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-info-soft flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-info" />
              </div>
              <h3 className="text-sm font-medium text-foreground">Awaiting Payment</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-info-soft text-info font-medium">
                {pendingOutgoing.length}
              </span>
            </div>

            <div className="space-y-2">
              {pendingOutgoing.map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-card border border-border/50 rounded-xl flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0">
                    {getInitials(request.requested_from?.name || 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Requested from {request.requested_from?.name || 'someone'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(request.created_at))}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-foreground text-sm">
                      {formatCurrency(request.amount)}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-info-soft text-info font-medium">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

PendingRequests.displayName = 'PendingRequests';

export default PendingRequests;