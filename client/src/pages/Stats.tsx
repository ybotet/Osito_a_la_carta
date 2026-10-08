import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../api/stats';
import { formatPrice } from '../lib/format';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Button } from '../components/ui/button';

/**
 * Esqueleto de carga para las tarjetas de resumen y gráficos.
 */
const StatsSkeleton = () => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-6 text-3xl font-bold">{t('stats.title')}</h1>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-1/3 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-1/2 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-1/4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="sr-only" role="status">
        {t('stats.loading')}
      </p>
    </main>
  );
};

/**
 * Estado de error con botón de reintento.
 */
const StatsError = ({ message }: { message?: string }) => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-3xl font-bold">{t('stats.title')}</h1>
      <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {t('stats.error')}
      </p>
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
      <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
        {t('stats.retry')}
      </Button>
    </main>
  );
};

/**
 * Tarjeta de resumen con icono, valor y etiqueta.
 */
const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-2xl">{icon}</span>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

/**
 * Gráfico de barras horizontal para top 5.
 */
const HorizontalBarChart = ({
  data,
  dataKey,
  nameKey,
  label,
  color,
}: {
  data: Array<{ [key: string]: string | number }>;
  dataKey: string;
  nameKey: string;
  label: string;
  color: string;
}) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{label}</h3>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">{label}</h3>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey={nameKey}
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

/**
 * Formatea una fecha ISO a formato legible.
 */
const formatMemberSince = (isoString: string, language: string): string => {
  try {
    return new Date(isoString).toLocaleDateString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
};

const Stats = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['stats', language],
    queryFn: fetchStats,
  });

  if (isPending) {
    return <StatsSkeleton />;
  }

  if (isError) {
    return <StatsError message={error?.message} />;
  }

  if (!data) {
    return <StatsSkeleton />;
  }

  const { topViewedDishes, topOrderedDishes, totalOrders, totalSpent, memberSince } = data;

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t('stats.title')}</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('stats.refresh')}
        </Button>
      </div>

      {/* Resumen numérico */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          label={t('stats.totalOrders')}
          value={totalOrders.toString()}
          icon="📦"
        />
        <StatCard
          label={t('stats.totalSpent')}
          value={formatPrice(totalSpent, language)}
          icon="💰"
        />
        <StatCard
          label={t('stats.memberSince')}
          value={formatMemberSince(memberSince, language)}
          icon="📅"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <HorizontalBarChart
          data={topViewedDishes.map((d) => ({ name: d.name, views: d.views }))}
          dataKey="views"
          nameKey="name"
          label={t('stats.topViewedDishes')}
          color="#3b82f6"
        />
        <HorizontalBarChart
          data={topOrderedDishes.map((d) => ({ name: d.name, count: d.count }))}
          dataKey="count"
          nameKey="name"
          label={t('stats.topOrderedDishes')}
          color="#10b981"
        />
      </div>
    </main>
  );
};

export default Stats;