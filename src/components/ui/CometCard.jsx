import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { cn } from "../../lib/utils"; // Fixed path from src/components/ui to src/lib

export const CometCard = ({
  rotateDepth = 15, // Light rotation for Premium feel
  translateDepth = 10,
  className,
  children,
}) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    [`-${rotateDepth}deg`, `${rotateDepth}deg`]
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    [`${rotateDepth}deg`, `-${rotateDepth}deg`]
  );
  
  // Minimal translation for depth
  const translateX = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    [`-${translateDepth}px`, `${translateDepth}px`]
  );
  const translateY = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    [`-${translateDepth}px`, `${translateDepth}px`]
  );

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], [0, 100]);

  // Premium Glare Effect
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 30%, rgba(130, 80, 255, 0.05) 60%, rgba(255, 255, 255, 0) 80%)`;

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className={cn("perspective-[1000px] [transform-style:preserve-3d]", className)}
      style={{ isolation: 'isolate' }}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          translateX,
          translateY,
          // Premium Multi-layered Shadow
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.2), inset 0 0 1px 1px rgba(255,255,255,0.05)",
        }}
        initial={{
          scale: 1,
          z: 0,
        }}
        whileHover={{
          scale: 1.02, // Subtle scale
          z: 20,
          transition: {
            duration: 0.25,
            ease: "easeOut"
          },
        }}
        className="relative rounded-2xl cursor-default overflow-hidden w-full h-full"
      >
        <div className="[transform-style:preserve-3d] w-full h-full">
            {children}
        </div>
        
        {/* Dynamic Glare Layer */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-50 h-full w-full mix-blend-overlay"
          style={{
            background: glareBackground,
            opacity: 0.4,
          }}
          transition={{
            duration: 0.1,
          }}
        />
        
        {/* Inner Border Brilliance */}
        <div className="pointer-events-none absolute inset-0 z-40 rounded-2xl border border-white/10" />
      </motion.div>
    </div>
  );
};
