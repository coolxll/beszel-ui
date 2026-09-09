import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/** Catches uncaught errors in child components and shows a recovery UI. */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[beszel-ui] Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="max-w-md rounded-lg border border-red-300 bg-red-50 p-6 text-sm dark:border-red-900/50 dark:bg-red-950/40">
            <h2 className="mb-2 font-semibold text-red-700 dark:text-red-300">
              页面出错了
            </h2>
            <p className="mb-4 text-red-600 dark:text-red-400">
              {this.state.error?.message ?? '未知错误'}
            </p>
            <button
              className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-500"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              重试
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
