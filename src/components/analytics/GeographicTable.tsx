import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminAnalytics } from "@/hooks/useAdminAnalytics";
import { MapPin, Users } from "lucide-react";

interface GeographicTableProps {
  analytics: AdminAnalytics;
}

export function GeographicTable({ analytics }: GeographicTableProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Cities */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">Ciudades con Mayor Actividad</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topCities.slice(0, 8).map((city, index) => (
              <div key={city.city} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium text-foreground">{city.city}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-semibold text-primary">{city.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top States */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">Estados con Mayor Actividad</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topStates.slice(0, 8).map((state, index) => (
              <div key={state.state} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium text-foreground">{state.state}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-semibold text-primary">{state.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}