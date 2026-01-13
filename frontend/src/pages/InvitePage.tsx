import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, Spinner, Avatar, Chip } from '@heroui/react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useInvitePreview } from '../hooks/useInvitePreview';
import { useAcceptInvite } from '../hooks/useAcceptInvite';
import { useSendInviteMagicLink } from '../hooks/useSendInviteMagicLink';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { data: invite, isLoading, error } = useInvitePreview(token);
  const acceptInvite = useAcceptInvite();
  const sendMagicLink = useSendInviteMagicLink();
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const handleAcceptInvite = async () => {
    if (!token || !invite) return;
    try {
      await acceptInvite.mutateAsync(token);
      toast.success(`You've joined ${invite.groupName}!`);
      navigate('/groups', { replace: true });
    } catch {
      // Error handled by mutation
    }
  };

  const handleSendMagicLink = async () => {
    if (!token) return;
    try {
      const result = await sendMagicLink.mutateAsync(token);
      setMagicLinkSent(true);
      setSentToEmail(result.email);
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-8">
            <h1 className="text-xl font-bold text-danger mb-4">
              Invalid Invite
            </h1>
            <p className="text-default-500 mb-6">
              {error?.message || 'This invite link is invalid or has expired.'}
            </p>
            <Button color="primary" onPress={() => navigate('/groups')}>
              Go to Groups
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const canJoin = !invite.isExpired && !invite.isUsed && !invite.isGroupFull;

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardBody className="text-center py-8 space-y-6">
          <Avatar
            name={invite.groupName.charAt(0).toUpperCase()}
            className="w-20 h-20 text-2xl mx-auto"
          />

          <div>
            <h1 className="text-2xl font-bold mb-2">{invite.groupName}</h1>
            {invite.invitedByName && (
              <p className="text-default-500">
                Invited by {invite.invitedByName}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-2">
            <Chip size="sm" variant="flat">
              {invite.memberCount} member{invite.memberCount !== 1 ? 's' : ''}
            </Chip>
            {invite.isGroupFull && (
              <Chip size="sm" color="warning" variant="flat">
                Group Full
              </Chip>
            )}
          </div>

          {invite.isExpired && (
            <p className="text-danger text-sm">This invite has expired.</p>
          )}

          {invite.isUsed && (
            <p className="text-default-500 text-sm">
              This invite has already been used.
            </p>
          )}

          {invite.isGroupFull && !invite.isExpired && !invite.isUsed && (
            <p className="text-warning text-sm">
              This group has reached its maximum capacity.
            </p>
          )}

          {acceptInvite.isError && (
            <p className="text-danger text-sm">
              {acceptInvite.error?.message || 'Failed to join group'}
            </p>
          )}

          {sendMagicLink.isError && (
            <p className="text-danger text-sm">
              {sendMagicLink.error?.message || 'Failed to send sign-in link'}
            </p>
          )}

          <div className="pt-4">
            {!session ? (
              canJoin ? (
                magicLinkSent ? (
                  <div className="space-y-4 text-center">
                    <div className="text-4xl">✉️</div>
                    <p className="text-default-600">
                      Check your email at <strong>{sentToEmail}</strong>
                    </p>
                    <p className="text-sm text-default-500">
                      Click the link in your email to join {invite.groupName}
                    </p>
                    <Button
                      variant="light"
                      size="sm"
                      onPress={() => {
                        setMagicLinkSent(false);
                        sendMagicLink.reset();
                      }}
                    >
                      Resend link
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-default-500 text-sm">
                      A sign-in link was sent to your email. Click it to join!
                    </p>
                    <Button
                      variant="light"
                      size="lg"
                      className="w-full"
                      onPress={handleSendMagicLink}
                      isLoading={sendMagicLink.isPending}
                    >
                      Resend sign-in link
                    </Button>
                  </div>
                )
              ) : (
                <Button
                  variant="flat"
                  size="lg"
                  className="w-full"
                  onPress={() => navigate('/signin')}
                >
                  Sign In
                </Button>
              )
            ) : canJoin ? (
              <Button
                color="primary"
                size="lg"
                className="w-full"
                onPress={handleAcceptInvite}
                isLoading={acceptInvite.isPending}
              >
                Join Group
              </Button>
            ) : (
              <Button
                variant="flat"
                size="lg"
                className="w-full"
                onPress={() => navigate('/groups')}
              >
                Go to Groups
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
