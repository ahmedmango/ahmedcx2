interface LoadingBarProps {
  color?: string;
}

const LoadingBar = ({ color = '5 100% 66%' }: LoadingBarProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div 
        className="text-8xl font-black tracking-tighter"
        style={{ 
          color: `hsl(${color})`,
          animation: 'spin-loading 2s linear infinite',
          fontWeight: 900
        }}
      >
        ΔV
      </div>
      <style>{`
        @keyframes spin-loading {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingBar;
