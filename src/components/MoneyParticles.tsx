import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  speedY: number;
  speedX: number;
  speedRotX: number;
  speedRotY: number;
  speedRotZ: number;
  size: number;
  opacity: number;
  type: "bill" | "coin";
}

const MoneyParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 35;

    const createParticle = (randomY = false): Particle => ({
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -60,
      z: Math.random() * 0.7 + 0.3,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      speedY: Math.random() * 0.6 + 0.3,
      speedX: (Math.random() - 0.5) * 0.4,
      speedRotX: (Math.random() - 0.5) * 0.02,
      speedRotY: (Math.random() - 0.5) * 0.03,
      speedRotZ: (Math.random() - 0.5) * 0.01,
      size: Math.random() * 20 + 16,
      opacity: Math.random() * 0.25 + 0.08,
      type: Math.random() > 0.4 ? "bill" : "coin",
    });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(true));
    }

    const drawBill = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.z, p.z);
      ctx.rotate(p.rotZ);

      const w = p.size * 2.2;
      const h = p.size;
      const perspective = Math.cos(p.rotY);
      const perspectiveX = Math.cos(p.rotX);

      ctx.globalAlpha = p.opacity * Math.abs(perspective) * 0.8;

      // Shadow
      ctx.shadowColor = "rgba(34, 197, 94, 0.3)";
      ctx.shadowBlur = 15 * p.z;
      ctx.shadowOffsetY = 5 * p.z;

      // Bill body
      const gradient = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      gradient.addColorStop(0, "#15803d");
      gradient.addColorStop(0.3, "#22c55e");
      gradient.addColorStop(0.5, "#4ade80");
      gradient.addColorStop(0.7, "#22c55e");
      gradient.addColorStop(1, "#15803d");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      const rw = w * Math.abs(perspective);
      const rh = h * Math.abs(perspectiveX);
      ctx.roundRect(-rw / 2, -rh / 2, rw, rh, 3);
      ctx.fill();

      // Inner border
      ctx.strokeStyle = "rgba(74, 222, 128, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-rw / 2 + 3, -rh / 2 + 3, rw - 6, rh - 6, 2);
      ctx.stroke();

      // $ symbol
      if (Math.abs(perspective) > 0.3) {
        ctx.fillStyle = "rgba(187, 247, 208, 0.7)";
        ctx.font = `bold ${p.size * 0.6}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 0);
      }

      ctx.shadowColor = "transparent";
      ctx.restore();
    };

    const drawCoin = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.z, p.z);
      ctx.rotate(p.rotZ);

      const r = p.size * 0.6;
      const perspective = Math.cos(p.rotY);

      ctx.globalAlpha = p.opacity * 0.9;

      // Shadow
      ctx.shadowColor = "rgba(234, 179, 8, 0.4)";
      ctx.shadowBlur = 12 * p.z;
      ctx.shadowOffsetY = 4 * p.z;

      // Coin body
      const gradient = ctx.createRadialGradient(
        -r * 0.3, -r * 0.3, 0,
        0, 0, r
      );
      gradient.addColorStop(0, "#fde047");
      gradient.addColorStop(0.4, "#eab308");
      gradient.addColorStop(0.8, "#ca8a04");
      gradient.addColorStop(1, "#a16207");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * Math.abs(perspective), r, 0, 0, Math.PI * 2);
      ctx.fill();

      // Edge highlight
      ctx.strokeStyle = "rgba(253, 224, 71, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * Math.abs(perspective) * 0.75, r * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();

      // $ on coin
      if (Math.abs(perspective) > 0.25) {
        ctx.fillStyle = "rgba(161, 98, 7, 0.8)";
        ctx.font = `bold ${p.size * 0.5}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 1);
      }

      ctx.shadowColor = "transparent";
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.005) * 0.3;
        p.rotX += p.speedRotX;
        p.rotY += p.speedRotY;
        p.rotZ += p.speedRotZ;

        if (p.y > canvas.height + 60) {
          particles[i] = createParticle(false);
        }

        if (p.type === "bill") drawBill(p);
        else drawCoin(p);
      });

      animId = requestAnimationFrame(animate);
    };

    animate();

    // Resize observer to handle scroll height changes
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default MoneyParticles;
