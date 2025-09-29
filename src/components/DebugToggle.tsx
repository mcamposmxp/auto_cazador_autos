import { Bug, BugOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useDebugMode } from '@/hooks/useDebugMode';

interface DebugToggleProps {
  className?: string;
  variant?: 'switch' | 'button' | 'card';
}

export function DebugToggle({ className, variant = 'switch' }: DebugToggleProps) {
  const { debugMode, loading, toggleDebugMode } = useDebugMode();

  if (loading) return null;

  if (variant === 'button') {
    return (
      <Button
        variant={debugMode ? "default" : "outline"}
        size="sm"
        onClick={toggleDebugMode}
        className={className}
      >
        {debugMode ? (
          <>
            <Bug className="h-4 w-4 mr-2" />
            Debug ON
          </>
        ) : (
          <>
            <BugOff className="h-4 w-4 mr-2" />
            Debug OFF
          </>
        )}
      </Button>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Modo Debug</Label>
              <p className="text-xs text-muted-foreground">
                Muestra información técnica de cálculos y fuentes de datos
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="debug-mode"
                checked={debugMode}
                onCheckedChange={toggleDebugMode}
              />
              {debugMode ? (
                <Bug className="h-4 w-4 text-green-600" />
              ) : (
                <BugOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default switch variant
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Switch
        id="debug-mode"
        checked={debugMode}
        onCheckedChange={toggleDebugMode}
      />
      <Label htmlFor="debug-mode" className="text-sm font-medium cursor-pointer">
        {debugMode ? (
          <span className="flex items-center gap-1 text-green-600">
            <Bug className="h-4 w-4" />
            Debug
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <BugOff className="h-4 w-4" />
            Debug
          </span>
        )}
      </Label>
    </div>
  );
}