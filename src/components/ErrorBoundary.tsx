import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for now (could be sent to Sentry/etc. in future)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo: errorInfo?.componentStack || null });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-glow opacity-30" />
          <Card className="glass-effect max-w-lg w-full z-10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>حدث خطأ غير متوقع</CardTitle>
              <CardDescription>
                لا تقلق، فريقنا تم إخطاره. يمكنك إعادة تحميل الصفحة أو العودة للرئيسية.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <details className="text-xs bg-muted/50 rounded-md p-3 cursor-pointer">
                  <summary className="font-medium text-muted-foreground hover:text-foreground">
                    تفاصيل الخطأ (للمطورين)
                  </summary>
                  <pre className="mt-2 text-[10px] overflow-auto max-h-40 text-destructive">
                    {this.state.error.name}: {this.state.error.message}
                    {this.state.errorInfo && '\n\n' + this.state.errorInfo}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة المحاولة
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1">
                  <Home className="w-4 h-4 ml-2" />
                  الرئيسية
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
