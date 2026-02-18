export interface SamplePrompt {
  id: string;
  text: string;
  category: 'icebreaker' | 'reflection' | 'fun' | 'deep';
  responseType: 'text' | 'image';
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  // Icebreakers
  { id: 'p1', text: "What's the best meal you've had recently?", category: 'icebreaker', responseType: 'text' },
  { id: 'p2', text: 'What show are you currently binge-watching?', category: 'icebreaker', responseType: 'text' },
  { id: 'p3', text: "What's the last song you had stuck in your head?", category: 'icebreaker', responseType: 'text' },
  { id: 'p4', text: 'If you could travel anywhere tomorrow, where would you go?', category: 'icebreaker', responseType: 'text' },
  { id: 'p5', text: "What's something small that made you smile today?", category: 'icebreaker', responseType: 'text' },

  // Reflection
  { id: 'p6', text: "What's something you've learned about yourself this year?", category: 'reflection', responseType: 'text' },
  { id: 'p7', text: "What's a goal you're working towards right now?", category: 'reflection', responseType: 'text' },
  { id: 'p8', text: "What's the best advice someone has given you?", category: 'reflection', responseType: 'text' },
  { id: 'p9', text: "What's something you wish you had more time for?", category: 'reflection', responseType: 'text' },
  { id: 'p10', text: "What's a skill you'd love to learn?", category: 'reflection', responseType: 'text' },

  // Fun
  { id: 'p11', text: 'If you could have any superpower for a day, what would it be?', category: 'fun', responseType: 'text' },
  { id: 'p12', text: "What's your go-to karaoke song?", category: 'fun', responseType: 'text' },
  { id: 'p13', text: 'If you could have dinner with anyone (alive or dead), who would it be?', category: 'fun', responseType: 'text' },
  { id: 'p14', text: "What's the weirdest food combo you secretly love?", category: 'fun', responseType: 'text' },
  { id: 'p15', text: 'If your life had a theme song, what would it be?', category: 'fun', responseType: 'text' },

  // Deep
  { id: 'p16', text: "What's something you've changed your mind about recently?", category: 'deep', responseType: 'text' },
  { id: 'p17', text: 'What does friendship mean to you?', category: 'deep', responseType: 'text' },
  { id: 'p18', text: "What's a memory you'd love to relive?", category: 'deep', responseType: 'text' },
  { id: 'p19', text: "What's something you're proud of that you don't talk about often?", category: 'deep', responseType: 'text' },
  { id: 'p20', text: 'What makes you feel most like yourself?', category: 'deep', responseType: 'text' },

  // Image prompts
  { id: 'p21', text: 'Take a photo of something that made you smile today', category: 'icebreaker', responseType: 'image' },
  { id: 'p22', text: 'Show us your current view right now', category: 'icebreaker', responseType: 'image' },
  { id: 'p23', text: 'Share a pic of your last meal', category: 'fun', responseType: 'image' },
  { id: 'p24', text: "What's on your desk right now? Show us!", category: 'fun', responseType: 'image' },
  { id: 'p25', text: 'Share a photo of something that inspires you', category: 'reflection', responseType: 'image' },
  { id: 'p26', text: 'Show us your favorite spot in your home', category: 'icebreaker', responseType: 'image' },
  { id: 'p27', text: 'Share a selfie with your current mood', category: 'fun', responseType: 'image' },
  { id: 'p28', text: "Take a photo of something you're working on", category: 'reflection', responseType: 'image' },
  { id: 'p29', text: 'Show us the last photo in your camera roll', category: 'fun', responseType: 'image' },
  { id: 'p30', text: 'Share a photo of something beautiful you noticed today', category: 'deep', responseType: 'image' },
];

/** Lookup map for fast prompt retrieval by ID */
export const SAMPLE_PROMPTS_MAP: Record<string, SamplePrompt> = Object.fromEntries(
  SAMPLE_PROMPTS.map((p) => [p.id, p]),
);
