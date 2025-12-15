export const loginStyles = `
  @keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    50% { transform: translateX(8px); }
    75% { transform: translateX(-4px); }
    100% { transform: translateX(0); }
  }
  .animate-shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }
  
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.1); }
  }
  .animate-pulse-slow {
    animation: pulse-slow 8s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) translateX(0); }
    25% { transform: translateY(-20px) translateX(10px); }
    50% { transform: translateY(-10px) translateX(-10px); }
    75% { transform: translateY(-30px) translateX(5px); }
  }
  .animate-float {
    animation: float 12s ease-in-out infinite;
  }
  
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-25px) scale(1.05); }
  }
  .animate-float-delayed {
    animation: float-delayed 10s ease-in-out infinite;
    animation-delay: 2s;
  }

  @keyframes ken-burns {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .animate-ken-burns {
    animation: ken-burns 20s ease-in-out infinite alternate;
  }

  @keyframes float-particle-1 {
    0%, 100% { transform: translate(0, 0); opacity: 0; }
    25% { opacity: 0.5; }
    50% { transform: translate(20px, -20px); opacity: 0.2; }
    75% { opacity: 0.5; }
    100% { transform: translate(40px, -40px); opacity: 0; }
  }
  .animate-float-particle-1 {
    animation: float-particle-1 15s linear infinite;
  }
  
  @keyframes float-particle-2 {
    0%, 100% { transform: translate(0, 0); opacity: 0; }
    50% { transform: translate(-30px, -30px); opacity: 0.4; }
    100% { transform: translate(-60px, -60px); opacity: 0; }
  }
  .animate-float-particle-2 {
    animation: float-particle-2 20s linear infinite;
    animation-delay: 2s;
  }
  
  @keyframes float-particle-3 {
    0%, 100% { transform: translate(0, 0); opacity: 0; }
    50% { transform: translate(20px, -40px); opacity: 0.3; }
    100% { transform: translate(40px, -80px); opacity: 0; }
  }
  .animate-float-particle-3 {
    animation: float-particle-3 18s linear infinite;
    animation-delay: 5s;
  }
`
