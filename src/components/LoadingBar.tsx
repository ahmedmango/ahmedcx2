interface LoadingBarProps {
  color?: string;
}

const LoadingBar = ({ color = '5 100% 66%' }: LoadingBarProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div 
        className="text-5xl font-black tracking-tighter flex items-center"
        style={{ 
          color: `hsl(${color})`,
          fontWeight: 900
        }}
      >
        <span
          style={{
            display: 'inline-block',
            animation: 'spin-loading 2s linear infinite'
          }}
        >
          Δ
        </span>
        <span>V</span>
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
