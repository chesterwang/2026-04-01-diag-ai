import { Metadata } from 'next';
import { Chatbot } from '@/components/Chatbot';

export const metadata: Metadata = {
  title: 'Mermaid AI Chat',
  description: 'Chat with our AI assistant to create and visualize Mermaid diagrams',
};

export default function ChatPage() {
  return <Chatbot />;
}
