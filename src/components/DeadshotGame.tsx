import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Play, Pause, RotateCcw } from 'lucide-react';

export default function DeadshotGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const gameStateRef = useRef({
    targets: [] as Array<{ x: number; y: number; radius: number; id: number; speed: number }>,
    animationId: null as number | null,
    targetIdCounter: 0,
    lastSpawnTime: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = Math.min(container.clientWidth - 32, 800);
        canvas.height = Math.min(window.innerHeight - 300, 600);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId);
      }
    };
  }, []);

  const spawnTarget = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const radius = 20 + Math.random() * 30;
    const x = radius + Math.random() * (canvas.width - radius * 2);
    const y = radius + Math.random() * (canvas.height - radius * 2);
    const speed = 0.5 + Math.random() * 2;

    gameStateRef.current.targets.push({
      x,
      y,
      radius,
      id: gameStateRef.current.targetIdCounter++,
      speed,
    });
  };

  const gameLoop = (timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !isPlaying) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Spawn new targets
    if (timestamp - gameStateRef.current.lastSpawnTime > 1500) {
      spawnTarget();
      gameStateRef.current.lastSpawnTime = timestamp;
    }

    // Update and draw targets
    gameStateRef.current.targets = gameStateRef.current.targets.filter((target) => {
      target.radius -= target.speed;

      if (target.radius <= 5) {
        setGameOver(true);
        setIsPlaying(false);
        return false;
      }

      // Draw target
      const gradient = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, target.radius);
      gradient.addColorStop(0, '#ef4444');
      gradient.addColorStop(0.7, '#dc2626');
      gradient.addColorStop(1, '#991b1b');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw rings
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * 0.4, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = '#fee2e2';
      ctx.beginPath();
      ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
      ctx.fill();

      return true;
    });

    // Draw crosshair at mouse position
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    gameStateRef.current.animationId = requestAnimationFrame(gameLoop);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on any target
    let hit = false;
    gameStateRef.current.targets = gameStateRef.current.targets.filter((target) => {
      const distance = Math.sqrt((target.x - x) ** 2 + (target.y - y) ** 2);
      if (distance <= target.radius) {
        const points = Math.floor(100 / target.radius);
        setScore((prev) => {
          const newScore = prev + points;
          if (newScore > highScore) {
            setHighScore(newScore);
          }
          return newScore;
        });
        hit = true;
        return false;
      }
      return true;
    });

    // Visual feedback
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = hit ? '#10b981' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    gameStateRef.current.targets = [];
    gameStateRef.current.targetIdCounter = 0;
    gameStateRef.current.lastSpawnTime = 0;

    if (gameStateRef.current.animationId) {
      cancelAnimationFrame(gameStateRef.current.animationId);
    }

    requestAnimationFrame(gameLoop);
  };

  const pauseGame = () => {
    setIsPlaying(false);
    if (gameStateRef.current.animationId) {
      cancelAnimationFrame(gameStateRef.current.animationId);
    }
  };

  const resetGame = () => {
    pauseGame();
    setScore(0);
    setGameOver(false);
    gameStateRef.current.targets = [];
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Deadshot - Target Shooter
          </CardTitle>
          <CardDescription>
            Click targets before they shrink completely. Smaller targets = more points!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{score}</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{highScore}</div>
                <div className="text-xs text-muted-foreground">High Score</div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isPlaying && !gameOver && (
                <Button onClick={startGame} size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
              {isPlaying && (
                <Button onClick={pauseGame} variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={resetGame} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {gameOver && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-center animate-scale-in">
              <h3 className="text-lg font-bold text-destructive mb-2">Game Over!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                A target shrank completely. Final Score: {score}
              </p>
              <Button onClick={startGame} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Play Again
              </Button>
            </div>
          )}

          <div className="relative border-2 border-border rounded-lg overflow-hidden bg-black">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="cursor-crosshair w-full"
              style={{ imageRendering: 'pixelated' }}
            />
            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Button onClick={startGame} size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Start Game
                </Button>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Click on red targets before they disappear</p>
            <p>• Smaller targets give more points</p>
            <p>• Game ends if any target shrinks completely</p>
            <p>• Works on both PC and mobile (tap to shoot)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
