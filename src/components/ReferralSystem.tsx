import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useReferralSystem } from '@/hooks/useReferralSystem';
import { Gift, Users, Share2, Link2, Copy, MessageCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export const ReferralSystem: React.FC = () => {
  const { referralData, loading, shareReferralLink } = useReferralSystem();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!referralData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Error al cargar datos de referidos
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (referralData.monthlyReferrals / referralData.maxMonthlyReferrals) * 100;
  const baseUrl = window.location.origin;
  const referralUrl = `${baseUrl}/?ref=${referralData.code}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Te invito a unirte a esta plataforma de análisis de precios de autos! Regístrate con mi código ${referralData.code}: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Invita Amigos y Gana Créditos</CardTitle>
          <p className="text-muted-foreground">
            Gana <span className="font-semibold text-primary">5 créditos</span> por cada amigo que se registre y use la plataforma
          </p>
        </CardHeader>
      </Card>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Progreso Mensual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Referidos este mes:</span>
            <span className="font-medium">
              {referralData.monthlyReferrals} / {referralData.maxMonthlyReferrals}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Créditos restantes: {(referralData.maxMonthlyReferrals - referralData.monthlyReferrals) * 5}
            </div>
            <Badge variant={referralData.monthlyReferrals >= referralData.maxMonthlyReferrals ? "secondary" : "default"}>
              {referralData.monthlyReferrals >= referralData.maxMonthlyReferrals ? "Límite alcanzado" : "Activo"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{referralData.totalReferrals}</div>
            <div className="text-sm text-muted-foreground">Total Referidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{referralData.creditsEarned}</div>
            <div className="text-sm text-muted-foreground">Créditos Ganados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{referralData.pendingReferrals}</div>
            <div className="text-sm text-muted-foreground">Pendientes</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Tu Código de Referido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 font-mono text-lg font-bold text-primary">
              {referralData.code}
            </code>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tu link de referido:</label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-xs text-muted-foreground truncate">
                {referralUrl}
              </code>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Compartir:</h4>
            <div className="flex gap-2">
              <Button onClick={shareReferralLink} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
              <Button onClick={shareWhatsApp} variant="outline" className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">1</div>
            <div className="text-sm">Comparte tu código o link de referido con amigos</div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">2</div>
            <div className="text-sm">Tu amigo se registra usando tu código</div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">3</div>
            <div className="text-sm">Cuando realice su primera búsqueda o evaluación, ¡ganas 5 créditos!</div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Límite:</strong> Máximo 5 referidos por mes (25 créditos). Los créditos se resetean cada mes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};