import { Prompt } from '../types/prompts';

/**
 * Sample prompts for reference only.
 * The backend assigns prompts deterministically — this list is kept
 * as a local reference and is NOT used for data fetching.
 */
export const samplePrompts: Prompt[] = [
  { id: 'p1', text: "What's the best meal you've had recently?", category: 'icebreaker' },
  { id: 'p2', text: 'What show are you currently binge-watching?', category: 'icebreaker' },
  { id: 'p3', text: "What's the last song you had stuck in your head?", category: 'icebreaker' },
  { id: 'p4', text: 'If you could travel anywhere tomorrow, where would you go?', category: 'icebreaker' },
  { id: 'p5', text: "What's something small that made you smile today?", category: 'icebreaker' },
  { id: 'p6', text: "What's something you've learned about yourself this year?", category: 'reflection' },
  { id: 'p7', text: "What's a goal you're working towards right now?", category: 'reflection' },
  { id: 'p8', text: "What's the best advice someone has given you?", category: 'reflection' },
  { id: 'p9', text: "What's something you wish you had more time for?", category: 'reflection' },
  { id: 'p10', text: "What's a skill you'd love to learn?", category: 'reflection' },
  { id: 'p11', text: 'If you could have any superpower for a day, what would it be?', category: 'fun' },
  { id: 'p12', text: "What's your go-to karaoke song?", category: 'fun' },
  { id: 'p13', text: 'If you could have dinner with anyone (alive or dead), who would it be?', category: 'fun' },
  { id: 'p14', text: "What's the weirdest food combo you secretly love?", category: 'fun' },
  { id: 'p15', text: 'If your life had a theme song, what would it be?', category: 'fun' },
  { id: 'p16', text: "What's something you've changed your mind about recently?", category: 'deep' },
  { id: 'p17', text: 'What does friendship mean to you?', category: 'deep' },
  { id: 'p18', text: "What's a memory you'd love to relive?", category: 'deep' },
  { id: 'p19', text: "What's something you're proud of that you don't talk about often?", category: 'deep' },
  { id: 'p20', text: 'What makes you feel most like yourself?', category: 'deep' },
];
