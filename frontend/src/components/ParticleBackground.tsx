import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseX: number;
  baseY: number;
  grabbed: boolean;
}

const PARTICLE_COUNT = 80;
const CONNECT_DIST = 150;
const MOUSE_RADIUS = 120;
const GRAB_RADIUS = 18;

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const mouse = { x: -1000, y: -1000, down: false };
    let grabbedParticle: Particle | null = null;

    // Initialize particles
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2.5 + 1.5,
        baseX: x,
        baseY: y,
        grabbed: false,
      });
    }

    function onResize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Drag grabbed particle
      if (grabbedParticle && mouse.down) {
        grabbedParticle.x = e.clientX;
        grabbedParticle.y = e.clientY;
      }
    }

    function onMouseDown(e: MouseEvent) {
      mouse.down = true;
      // Try to grab nearest particle
      for (const p of particles) {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        if (Math.sqrt(dx * dx + dy * dy) < GRAB_RADIUS) {
          grabbedParticle = p;
          p.grabbed = true;
          break;
        }
      }
    }

    function onMouseUp() {
      mouse.down = false;
      if (grabbedParticle) {
        // Give it a little velocity based on recent movement
        grabbedParticle.grabbed = false;
        grabbedParticle.baseX = grabbedParticle.x;
        grabbedParticle.baseY = grabbedParticle.y;
        grabbedParticle = null;
      }
    }

    function onMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.down = false;
      if (grabbedParticle) {
        grabbedParticle.grabbed = false;
        grabbedParticle = null;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // ── Update particles ──
      for (const p of particles) {
        if (p.grabbed) continue;

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx += (dx / dist) * force * 0.8;
          p.vy += (dy / dist) * force * 0.8;
        }

        // Drift
        p.x += p.vx;
        p.y += p.vy;

        // Friction
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Gentle return to base
        p.vx += (p.baseX - p.x) * 0.001;
        p.vy += (p.baseY - p.y) * 0.001;

        // Bounce off edges
        if (p.x < 0) { p.x = 0; p.vx *= -0.5; }
        if (p.x > w) { p.x = w; p.vx *= -0.5; }
        if (p.y < 0) { p.y = 0; p.vy *= -0.5; }
        if (p.y > h) { p.y = h; p.vy *= -0.5; }
      }

      // ── Draw connections ──
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.4;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // ── Also connect particles near mouse with brighter lines ──
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const alpha = (1 - dist / MOUSE_RADIUS) * 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ── Draw particles ──
      for (const p of particles) {
        // Glow for grabbed particle
        if (p.grabbed) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

        // Particles near mouse glow brighter
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const brightness = 1 - dist / MOUSE_RADIUS;
          ctx.fillStyle = `rgba(${140 + 50 * brightness}, ${150 + 30 * brightness}, ${255}, ${0.6 + brightness * 0.4})`;
        } else {
          ctx.fillStyle = "rgba(120, 130, 255, 0.55)";
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "auto",
      }}
    />
  );
}
