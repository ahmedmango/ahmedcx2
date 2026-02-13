import { useState, useEffect, useRef } from 'react';

// Typewriter effect component
const TypewriterText = ({ text, style }: { text: string; style: React.CSSProperties }) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span style={style}>
      {displayed}
      <span style={{ opacity: displayed.length < text.length ? 1 : 0, transition: 'opacity 0.3s' }}>|</span>
    </span>
  );
};

interface ThresholdGateProps {
  isOpen: boolean;
  onPass: () => void;
  onFail: () => void;
}

interface Question {
  question: string;
  context: string; // The relevant passage/concept for Claude to evaluate against
  essence: string; // The core truth the answer must demonstrate understanding of
}

const QUESTIONS: Question[] = [
  {
    question: "What is the default of a man who is not a storm?",
    context: "Without a Raging Storm, man defaults into a coma. His days consist of nothing more than putting out fires.",
    essence: "The answer should convey the idea of a coma, sleepwalking through life, or being consumed by putting out fires. The person must understand that without a consuming journey/purpose, man falls into unconscious routine existence."
  },
  {
    question: "What kills softly?",
    context: "This coma is like Carbon Monoxide poisoning. It kills slowly and softly.",
    essence: "The answer should reference the coma of ordinary existence, carbon monoxide poisoning as metaphor, comfort, routine, or the gradual slipping away of life. The person must understand that it's the invisible, comfortable numbness that destroys."
  },
  {
    question: "What stands between man and his freedom?",
    context: "The single thing that stands between man and his freedom is the belief in 'time.'",
    essence: "The answer must reference time, the belief in time, or the illusion of having time. Not literal imprisonment but the psychological trap of believing there is always more time."
  },
  {
    question: "What cannot be prescribed?",
    context: "Flailing can't be prescribed. There are no how-to's. Greatness comes from a very murky affair.",
    essence: "The answer should convey flailing, greatness, or the authentic messy process of pursuing something. The person must understand that the genuine path to greatness cannot be turned into a formula or recipe."
  },
  {
    question: "What does the fish not see?",
    context: "A line that is invisible, and a hook that is imperceptible, keeps the fish trapped forever. The mind gives its fish a little extra line to roam within invisible boundaries.",
    essence: "The answer should reference the invisible line/hook, the boundaries set by the mind, the illusion of freedom, or the trap of believing one is in control. The person must understand the metaphor of the mind as the fisherman."
  },
  {
    question: "Where does truth bloom?",
    context: "Truth can only bloom in the wild and free world that is devoid of rules, culture, and religion.",
    essence: "The answer should reference freedom from rules/culture/religion, the wild, solitude, or places free from social constructs. Like Musashi in the jungle — truth requires freedom from all prescribed systems."
  },
  {
    question: "What did Musashi find in the jungle?",
    context: "What Musashi discovered in those ancient jungles of central Japan was himself. He discovered the truth that others did not have the freedom to explore.",
    essence: "The answer should convey self-discovery, himself, or truth. Not a technique or skill, but the discovery of his authentic self which could only happen away from society's constructs."
  },
  {
    question: "What is the destination of all things?",
    context: "Zero is the destination of all things.",
    essence: "The answer must be zero, nothing, nothingness, or emptiness. This is about the fundamental nature of existence returning to nothing."
  },
  {
    question: "What does the lonely man seek at the gathering?",
    context: "Every social gathering is an escape from pain and a salacious bid at pleasure. The lonely type: seeking companionship. Humans spend their lives hiding from themselves.",
    essence: "The answer should reference companionship, escape from pain, connection, or hiding from themselves. The deeper truth is that all social behavior is an escape from confronting oneself."
  },
  {
    question: "Why can't a man love himself?",
    context: "How can he love himself if he does not know what love truly is? How can he be happy with a self that he does not truly understand? The things that man believes himself to be are lights and shadows.",
    essence: "The answer should convey that he doesn't know what love is, doesn't know himself, or that his self-image is built on illusions (lights and shadows). The person must understand the impossibility of loving something you haven't genuinely encountered."
  },
  {
    question: "What is enormous in ego-lessness?",
    context: "The only human being who publicly says 'I do not know' is the one who uses this to proudly demonstrate how humble he is. There is enormous ego in ego-lessness.",
    essence: "The answer must be ego. The person must understand the paradox that performed humility is itself a form of ego — that even the display of having no ego is driven by ego."
  },
  {
    question: "What does the raging storm extinguish?",
    context: "Raging Storms don't cause fires. They extinguish them.",
    essence: "The answer should be fires — the petty daily concerns, distractions, and small crises that consume an ordinary life. A true consuming purpose eliminates the trivial fires that otherwise become a man's entire existence."
  },
  {
    question: "Who is Mohammed in the cave?",
    context: "Mohammed (P) and Jesus are not Mohammed (P) and Jesus only in public. Mohammed (P) and Jesus are Mohammed (P) and Jesus when there is no one around. In the quiet of a cave, sitting before a man who genuinely seeks the truth, his words would be very different.",
    essence: "The answer should convey that he is his true self, different from his public persona, speaks different truths privately, or that he reveals raw truth only to genuine seekers. The person must understand the distinction between public teaching and private truth."
  },
  {
    question: "What happens when you reveal truth to the masses?",
    context: "Revealing truths to the masses does not create enlightened humans; it creates parrots.",
    essence: "The answer should reference parrots, repetition without understanding, or mimicry. Truth given freely to crowds becomes slogans and bumper stickers, not genuine understanding."
  },
  {
    question: "When are you not there?",
    context: "The things that you do greatest, are the things that you know not how you do them. I'd argue that you're not even there when you do them.",
    essence: "The answer should reference doing your greatest work, peak performance, flow states, or moments of transcendent creation. The person must understand that the highest human performance happens when the conscious self steps aside."
  },
];

const ThresholdGate = ({ isOpen, onPass, onFail }: ThresholdGateProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<'entering' | 'questioning' | 'evaluating' | 'passing' | 'failing'>('entering');
  const [fadeIn, setFadeIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Pick a random question
      const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
      setCurrentQuestion(q);
      setAnswer('');
      setPhase('entering');
      setFadeIn(false);
      
      // Fade in sequence
      setTimeout(() => setFadeIn(true), 100);
      setTimeout(() => {
        setPhase('questioning');
        // Focus input after transition
        setTimeout(() => inputRef.current?.focus(), 500);
      }, 1200);
    }
  }, [isOpen]);

  const evaluateAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return;
    
    setPhase('evaluating');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: `You are evaluating whether someone understood a philosophical text deeply enough. You must be strict but fair — reward genuine understanding, not perfect wording.

Question asked: "${currentQuestion.question}"
The relevant passage: "${currentQuestion.context}"
What the answer must demonstrate: "${currentQuestion.essence}"
User's answer: "${answer}"

Does this answer demonstrate genuine understanding of the concept? Consider synonyms, paraphrasing, and partial but meaningful understanding. Be generous with someone who clearly gets the core idea even if they express it differently. Be strict with someone who is guessing or giving a surface-level response.

Respond with ONLY "PASS" or "FAIL" — nothing else.`
            }
          ]
        })
      });

      const data = await response.json();
      const result = data.content?.[0]?.text?.trim().toUpperCase();

      if (result === 'PASS') {
        setPhase('passing');
        setTimeout(() => onPass(), 2500);
      } else {
        setPhase('failing');
        setTimeout(() => onFail(), 2500);
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      // Fallback: simple keyword matching
      const lowerAnswer = answer.toLowerCase().trim();
      const passed = fallbackEvaluate(currentQuestion, lowerAnswer);
      
      if (passed) {
        setPhase('passing');
        setTimeout(() => onPass(), 2500);
      } else {
        setPhase('failing');
        setTimeout(() => onFail(), 2500);
      }
    }
  };

  // Fallback evaluation when API is unavailable
  const fallbackEvaluate = (q: Question, answer: string): boolean => {
    const keywordSets: Record<string, string[][]> = {
      "What is the default of a man who is not a storm?": [["coma"], ["fire"], ["putting out fire"], ["sleep"], ["slumber"]],
      "What kills softly?": [["coma"], ["carbon monoxide"], ["comfort"], ["routine"], ["default"]],
      "What stands between man and his freedom?": [["time"], ["belief in time"], ["illusion of time"]],
      "What cannot be prescribed?": [["flail"], ["greatness"], ["great"]],
      "What does the fish not see?": [["line"], ["hook"], ["boundar"], ["trap"], ["invisible"]],
      "Where does truth bloom?": [["wild"], ["free"], ["devoid"], ["without rule"], ["jungle"], ["nature"]],
      "What did Musashi find in the jungle?": [["himself"], ["self"], ["truth"], ["who he"]],
      "What is the destination of all things?": [["zero"], ["nothing"], ["noth"], ["empty"], ["void"]],
      "What does the lonely man seek at the gathering?": [["companion"], ["escape"], ["connection"], ["hiding"], ["pain"]],
      "Why can't a man love himself?": [["know"], ["understand"], ["light"], ["shadow"], ["illusion"]],
      "What is enormous in ego-lessness?": [["ego"]],
      "What does the raging storm extinguish?": [["fire"]],
      "Who is Mohammed in the cave?": [["true"], ["himself"], ["different"], ["real"], ["authentic"]],
      "What happens when you reveal truth to the masses?": [["parrot"], ["mimic"], ["repeat"], ["copy"]],
      "When are you not there?": [["great"], ["best"], ["flow"], ["peak"], ["transcend"], ["creat"]],
    };

    const keywords = keywordSets[q.question] || [];
    return keywords.some(group => group.some(kw => answer.includes(kw)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answer.trim()) {
      evaluateAnswer();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: '#000000',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 1s ease',
      }}
    >
      {/* Question */}
      {phase !== 'entering' && (
        <div 
          className="max-w-lg mx-auto px-8 text-center"
          style={{
            opacity: phase === 'questioning' || phase === 'evaluating' ? 1 : 
                     phase === 'passing' ? 0 : 
                     phase === 'failing' ? 0.3 : 0,
            transform: phase === 'failing' ? 'scale(0.95)' : 'scale(1)',
            transition: 'all 1s ease',
          }}
        >
          {/* The question */}
          <p
            className="font-serif mb-12"
            style={{
              fontSize: 'clamp(1.3rem, 4vw, 2rem)',
              color: '#FF7A00',
              textShadow: '0 0 20px rgba(255, 122, 0, 0.2)',
              lineHeight: 1.6,
              letterSpacing: '0.01em',
            }}
          >
            {currentQuestion?.question}
          </p>

          {/* Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={phase !== 'questioning'}
              placeholder=""
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full bg-transparent border-b border-orange-500/30 text-center font-serif text-lg py-3 px-4 outline-none focus:border-orange-500/60 transition-colors"
              style={{
                color: '#FF7A00',
                caretColor: '#FF7A00',
                letterSpacing: '0.05em',
              }}
            />
            
            {/* Submit hint */}
            {answer.trim() && phase === 'questioning' && (
              <button
                onClick={evaluateAnswer}
                className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-1 text-orange-500/30 hover:text-orange-500/60 transition-colors text-xs tracking-widest"
              >
                ↵
              </button>
            )}
          </div>

          {/* Evaluating indicator */}
          {phase === 'evaluating' && (
            <div className="mt-8">
              <div 
                className="inline-block w-1 h-1 rounded-full bg-orange-500/40"
                style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Pass state — typewriter "Congratulations" */}
      {phase === 'passing' && (
        <div className="text-center">
          <TypewriterText 
            text="Congratulations" 
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              color: '#FF7A00',
              textShadow: '0 0 40px rgba(255, 122, 0, 0.5)',
              letterSpacing: '0.1em',
              fontFamily: '"Courier New", Courier, monospace',
            }}
          />
        </div>
      )}

      {/* Fail state — typewriter "Goodbye" */}
      {phase === 'failing' && (
        <div className="text-center">
          <TypewriterText 
            text="Goodbye" 
            style={{
              fontSize: 'clamp(1.3rem, 4vw, 2rem)',
              color: 'rgba(255, 122, 0, 0.2)',
              letterSpacing: '0.15em',
              fontFamily: '"Courier New", Courier, monospace',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(2); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ThresholdGate;
