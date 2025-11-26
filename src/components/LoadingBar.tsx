interface LoadingBarProps {
  color?: string;
}

const LoadingBar = ({ color = '5 100% 66%' }: LoadingBarProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-64 h-1 bg-muted/30 rounded-full overflow-hidden">
        <div 
          className="h-full animate-pulse rounded-full"
          style={{ 
            backgroundColor: `hsl(${color})`,
            animation: 'loading-pulse 1.5s ease-in-out infinite'
          }}
        />
      </div>
      <style>{`
        @keyframes loading-pulse {
          0%, 100% {
            opacity: 0.3;
            width: 20%;
            transform: translateX(0);
          }
          50% {
            opacity: 1;
            width: 60%;
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingBar;
