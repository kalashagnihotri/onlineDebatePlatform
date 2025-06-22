import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  variant?: 'particles' | 'waves' | 'gradient' | 'geometric';
  intensity?: 'low' | 'medium' | 'high';
  color?: 'blue' | 'purple' | 'green' | 'red' | 'rainbow';
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'particles',
  intensity = 'medium',
  color = 'blue',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    if (variant === 'particles') {
      const particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        opacity: number;
      }> = [];

      const particleCount = intensity === 'low' ? 30 : intensity === 'medium' ? 60 : 100;
      
      // Initialize particles
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.1
        });
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((particle, index) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Bounce off edges
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
          
          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          
          const colorMap = {
            blue: `rgba(59, 130, 246, ${particle.opacity})`,
            purple: `rgba(147, 51, 234, ${particle.opacity})`,
            green: `rgba(34, 197, 94, ${particle.opacity})`,
            red: `rgba(239, 68, 68, ${particle.opacity})`,
            rainbow: `hsl(${(index * 360) / particles.length}, 70%, 60%)`
          };
          
          ctx.fillStyle = colorMap[color];
          ctx.fill();
          
          // Draw connections
          particles.forEach((otherParticle, otherIndex) => {
            if (index !== otherIndex) {
              const dx = particle.x - otherParticle.x;
              const dy = particle.y - otherParticle.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 100) {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 * (1 - distance / 100)})`;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
          });
        });
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    }

    // Waves animation
    if (variant === 'waves') {
      let time = 0;
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const waves = intensity === 'low' ? 2 : intensity === 'medium' ? 3 : 5;
        
        for (let i = 0; i < waves; i++) {
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          
          for (let x = 0; x <= canvas.width; x += 10) {
            const y = canvas.height / 2 + Math.sin((x * 0.01) + (time * 0.02) + (i * 0.5)) * (50 + i * 20);
            ctx.lineTo(x, y);
          }
          
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 - i * 0.05})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        time++;
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    }

    // Gradient animation
    if (variant === 'gradient') {
      let time = 0;
      
      const animate = () => {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2 + Math.sin(time * 0.01) * 100,
          canvas.height / 2 + Math.cos(time * 0.01) * 100,
          0,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height)
        );
        
        gradient.addColorStop(0, `rgba(59, 130, 246, 0.1)`);
        gradient.addColorStop(0.5, `rgba(147, 51, 234, 0.05)`);
        gradient.addColorStop(1, `rgba(34, 197, 94, 0.02)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        time++;
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [variant, intensity, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  );
};

// Simple CSS-based animated backgrounds for better performance
export const CSSAnimatedBackground: React.FC<{
  variant?: 'gradient' | 'dots' | 'lines';
  className?: string;
}> = ({ variant = 'gradient', className = '' }) => {
  const variants = {
    gradient: (
      <div className={`fixed inset-0 -z-10 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-tl from-green-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-blue-800 dark:to-purple-800 opacity-30 animate-pulse" />
      </div>
    ),
    dots: (
      <div className={`fixed inset-0 -z-10 ${className}`}>
        <div 
          className="absolute inset-0 opacity-20 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            animation: 'float 20s ease-in-out infinite'
          }}
        />
      </div>
    ),
    lines: (
      <div className={`fixed inset-0 -z-10 ${className}`}>
        <div 
          className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: 'linear-gradient(45deg, #3b82f6 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            animation: 'slide 15s linear infinite'
          }}
        />
      </div>
    )
  };

  return variants[variant];
};

export default AnimatedBackground;