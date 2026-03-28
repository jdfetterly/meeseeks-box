import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AttachConversationToWork } from '@/components/chat/AttachConversationToWork';
import { ConversationThread } from '@/components/chat/ConversationThread';
import { ConversationToWorkComposer } from '@/components/chat/ConversationToWorkComposer';
import { StartConversationBranchButton } from '@/components/chat/StartConversationBranchButton';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatConversationKind, formatConversationStatus } from '@/lib/conversations/service';
import {
  getConversationById,
  getProjectById,
  listMessages,
  listOpenLoops,
  listWorkItems,
} from '@/lib/product-state/repositories';

export const dynamic = 'force-dynamic';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = getConversationById(id);

  if (!conversation) {
    notFound();
  }

  const messages = listMessages(id);
  const project = conversation.projectId ? getProjectById(conversation.projectId) : null;
  const openLoops = listOpenLoops({ conversationId: id, status: 'open' });
  const attachableWorkItems = listWorkItems()
    .filter(
      (workItem) =>
        workItem.scope === conversation.scope &&
        (!workItem.sourceConversationId || workItem.sourceConversationId === conversation.id),
    )
    .map((workItem) => ({
      id: workItem.id,
      title: workItem.title,
    }));

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4) var(--space-12)',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <Link
              href="/chat"
              style={{
                width: 'fit-content',
                textDecoration: 'none',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              Back to conversations
            </Link>
            <p style={eyebrowStyle}>
              {formatConversationKind(conversation.kind)} • {formatConversationStatus(conversation.status)}
              {project ? ` • ${project.title}` : ''}
            </p>
            <h1 style={headlineStyle}>{conversation.title ?? 'Untitled conversation'}</h1>
            <p style={ledeStyle}>
              {conversation.summary ??
                conversation.currentObjective ??
                'This saved conversation keeps the working context, linked objects, and open follow-up visible.'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Working context</CardTitle>
              <CardDescription>Use Assistant to continue this work or branch into an alternative.</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <OpenChatPanelButton
                  label="Continue in Assistant"
                  intent="general_chat"
                  context={{
                    entityType: conversation.projectId ? 'project' : 'home',
                    entityId: conversation.projectId,
                    projectId: conversation.projectId,
                    page: 'conversation',
                    suggestedPrompt: conversation.recommendedNextAction ?? conversation.currentObjective ?? undefined,
                    pinnedConversationId: conversation.id,
                  }}
                />
                <StartConversationBranchButton conversationId={conversation.id} />
              </div>
              {conversation.recommendedNextAction ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Next suggested move: {conversation.recommendedNextAction}
                </p>
              ) : null}
              {conversation.linkedObjects.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {conversation.linkedObjects.map((linkedObject) => (
                    <span key={`${linkedObject.kind}:${linkedObject.id}`} style={chipStyle}>
                      {linkedObject.label ?? `${linkedObject.kind} ${linkedObject.id}`}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {openLoops.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Open loops</CardTitle>
                <CardDescription>Unfinished work already detected from this conversation.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {openLoops.map((loop) => (
                  <div key={loop.id} style={listRowStyle}>
                    <strong>{loop.title}</strong>
                    <span style={metaStyle}>
                      {loop.priority} priority • waiting on {loop.waitingOn}
                    </span>
                    {loop.detail ? <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{loop.detail}</p> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
              <CardDescription>
                {messages.length} message{messages.length === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <ConversationThread conversationId={conversation.id} initialMessages={messages} />
            </CardContent>
          </Card>

          <div
            style={{
              display: 'grid',
              gap: 'var(--space-4)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Create tracked work</CardTitle>
                <CardDescription>
                  Use this only when the conversation becomes its own operational object.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConversationToWorkComposer
                  conversationId={conversation.id}
                  defaultTitle={conversation.title ?? 'Conversation follow-up'}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attach to existing work</CardTitle>
                <CardDescription>
                  Secondary path for linking this context to work that already exists.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttachConversationToWork
                  conversationId={conversation.id}
                  workItems={attachableWorkItems}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const eyebrowStyle = {
  margin: 0,
  color: 'var(--text-tertiary)',
  fontSize: 'var(--text-caption1)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  fontWeight: 'var(--weight-semibold)',
};

const headlineStyle = {
  margin: 0,
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  lineHeight: 0.98,
  letterSpacing: '-0.05em',
};

const ledeStyle = {
  margin: 0,
  maxWidth: 720,
  color: 'var(--text-secondary)',
};

const metaStyle = {
  color: 'var(--text-tertiary)',
  fontSize: '0.85rem',
};

const chipStyle = {
  border: '1px solid var(--separator)',
  borderRadius: '999px',
  padding: '4px 10px',
  color: 'var(--text-tertiary)',
  fontSize: '0.8rem',
};

const listRowStyle = {
  border: '1px solid var(--separator)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-3)',
  background: 'var(--material-thin)',
  display: 'grid',
  gap: '6px',
};
