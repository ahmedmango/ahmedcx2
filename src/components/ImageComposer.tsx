import { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ShapeType = 'circle' | 'triangle';

interface ImageComposerProps {
  onImageCreated: (imageUrl: string) => void;
}

const ImageComposer = ({ onImageCreated }: ImageComposerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useSettings();
  const [shape, setShape] = useState<ShapeType>('circle');
  const [centerText, setCenterText] = useState('');
  const [point1Text, setPoint1Text] = useState('');
  const [point2Text, setPoint2Text] = useState('');
  const [point3Text, setPoint3Text] = useState('');
  const [size, setSize] = useState(600);
  const [isGenerating, setIsGenerating] = useState(false);

  const bodyTextColor = settings.body_text_color || '0 0% 20%';
  const backgroundColor = '0 0% 100%'; // White background

  useEffect(() => {
    drawShape();
  }, [shape, centerText, point1Text, point2Text, point3Text, size, bodyTextColor, backgroundColor]);

  const drawShape = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Parse HSL colors
    const bgHsl = backgroundColor.split(' ');
    const textHsl = bodyTextColor.split(' ');
    const bgColor = `hsl(${bgHsl[0]}, ${bgHsl[1]}, ${bgHsl[2]})`;
    const textColor = `hsl(${textHsl[0]}, ${textHsl[1]}, ${textHsl[2]})`;

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Draw shape
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.fillStyle = 'transparent';

    if (shape === 'circle') {
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size * 0.35;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw center text
      if (centerText) {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${size * 0.08}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Word wrap
        const words = centerText.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > radius * 1.5) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);

        const lineHeight = size * 0.1;
        const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, i) => {
          ctx.fillText(line, centerX, startY + i * lineHeight);
        });
      }
    } else if (shape === 'triangle') {
      const centerX = size / 2;
      const radius = size * 0.35;
      const height = radius * Math.sqrt(3);

      const topX = centerX;
      const topY = size / 2 - (2 * height) / 3;
      const leftX = centerX - radius;
      const leftY = size / 2 + height / 3;
      const rightX = centerX + radius;
      const rightY = size / 2 + height / 3;

      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = `bold ${size * 0.06}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Top point
      if (point1Text) {
        ctx.fillText(point1Text, topX, topY - size * 0.08);
      }

      // Left point
      if (point2Text) {
        ctx.textAlign = 'right';
        ctx.fillText(point2Text, leftX - size * 0.05, leftY);
      }

      // Right point
      if (point3Text) {
        ctx.textAlign = 'left';
        ctx.fillText(point3Text, rightX + size * 0.05, rightY);
      }
    }
  };

  const handleGenerate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      // Upload to storage
      const fileName = `epigram-${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('epigram-images')
        .upload(fileName, blob);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('epigram-images')
        .getPublicUrl(fileName);

      onImageCreated(publicUrl);
      toast.success('Image created successfully');

      // Reset form
      setCenterText('');
      setPoint1Text('');
      setPoint2Text('');
      setPoint3Text('');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to create image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-xl font-bold">Create Image Epigram</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Shape</label>
          <div className="flex gap-2">
            <Button
              variant={shape === 'circle' ? 'default' : 'outline'}
              onClick={() => setShape('circle')}
            >
              Circle
            </Button>
            <Button
              variant={shape === 'triangle' ? 'default' : 'outline'}
              onClick={() => setShape('triangle')}
            >
              Triangle
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Size (px)</label>
          <Input
            type="number"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            min={400}
            max={1200}
            step={50}
          />
        </div>
      </div>

      {shape === 'circle' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Center Text</label>
          <Textarea
            value={centerText}
            onChange={(e) => setCenterText(e.target.value)}
            placeholder="Enter text for center of circle"
            rows={3}
          />
        </div>
      )}

      {shape === 'triangle' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Top Point</label>
            <Input
              value={point1Text}
              onChange={(e) => setPoint1Text(e.target.value)}
              placeholder="Text for top point"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Left Point</label>
            <Input
              value={point2Text}
              onChange={(e) => setPoint2Text(e.target.value)}
              placeholder="Text for left point"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Right Point</label>
            <Input
              value={point3Text}
              onChange={(e) => setPoint3Text(e.target.value)}
              placeholder="Text for right point"
            />
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4 bg-muted/30">
        <p className="text-sm font-medium mb-2">Preview:</p>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border max-w-full h-auto"
            style={{ maxHeight: '400px' }}
          />
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        {isGenerating ? 'Creating...' : 'Create Image Epigram'}
      </Button>
    </div>
  );
};

export default ImageComposer;