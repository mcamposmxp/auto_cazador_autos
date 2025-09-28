import { Badge } from "@/components/ui/badge";
import { Shield, Star, Award, Sparkles, UserCheck } from "lucide-react";

interface BadgeConfianzaProps {
  badge: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showText?: boolean;
}

const badgeConfig = {
  nuevo: {
    label: "Nuevo",
    icon: UserCheck,
    variant: "secondary" as const,
    description: "Profesional recién registrado"
  },
  basico: {
    label: "Básico",
    icon: Shield,
    variant: "outline" as const,
    description: "Profesional con pocas evaluaciones"
  },
  verificado: {
    label: "Verificado",
    icon: Shield,
    variant: "default" as const,
    description: "Profesional con buena reputación"
  },
  confiable: {
    label: "Confiable",
    icon: Star,
    variant: "secondary" as const,
    description: "Profesional altamente confiable"
  },
  elite: {
    label: "Elite",
    icon: Award,
    variant: "default" as const,
    description: "Profesional de máxima confianza"
  }
};

export function BadgeConfianza({ 
  badge, 
  size = "md", 
  showIcon = true, 
  showText = true 
}: BadgeConfianzaProps) {
  const config = badgeConfig[badge as keyof typeof badgeConfig] || badgeConfig.nuevo;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${sizeClasses[size]} flex items-center gap-1`}
      title={config.description}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showText && config.label}
    </Badge>
  );
}