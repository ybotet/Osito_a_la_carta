import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

/**
 * Fallback renderizado por el ErrorBoundary: muestra un mensaje amigable con
 * un botón para recargar la página.
 *
 * Es un componente hijo (función) para poder usar `useTranslation` dentro:
 * el ErrorBoundary en sí es una clase (React lo exige) y no puede usar hooks,
 * así que delega el render del fallback a este componente.
 */
const ErrorFallback = ({
  onReset,
}: {
  onReset: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-md p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('errors.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('errors.fallback')}
          </p>
          <Button onClick={onReset} variant="outline" className="w-full">
            {t('errors.retry')}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

/**
 * ErrorBoundary de la aplicación.
 *
 * **Captura errores durante el renderizado, en eventos de lifecycle y en
 * constructores de árboles hijos.** Sin esto, un error en un componente
 * deja la pantalla completamente en blanco con solo un mensaje en consola;
 * con este boundary, el usuario ve un fallback amigable con un botón para
 * recargar.
 *
 * ErrorBoundary debe ser una clase (React no permite function components como
 * boundaries). El fallback delega en `ErrorFallback`, un componente función
 * que sí puede usar hooks como `useTranslation`.
 *
 * El `componentDidCatch` loggea el error a consola para que los desarrolladores
 * lo vean, aunque el usuario solo vea el fallback.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
};

export default ErrorBoundary;
