/**
 * Lightweight toast notification system
 * No external dependencies - pure vanilla JS
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

const defaultOptions: Required<ToastOptions> = {
  duration: 3000,
  position: 'top-right',
};

class ToastManager {
  private container: HTMLDivElement | null = null;

  private getContainer(): HTMLDivElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private getPositionStyles(position: string): string {
    const positions: Record<string, string> = {
      'top-right': 'top: 20px; right: 20px;',
      'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
      'top-left': 'top: 20px; left: 20px;',
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);',
      'bottom-left': 'bottom: 20px; left: 20px;',
    };
    return positions[position] || positions['top-right'];
  }

  private getIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️',
    };
    return icons[type];
  }

  private getColors(type: ToastType): { bg: string; border: string } {
    const colors: Record<ToastType, { bg: string; border: string }> = {
      success: { bg: '#10b981', border: '#059669' },
      error: { bg: '#ef4444', border: '#dc2626' },
      info: { bg: '#3b82f6', border: '#2563eb' },
      warning: { bg: '#f59e0b', border: '#d97706' },
    };
    return colors[type];
  }

  show(message: string, type: ToastType = 'info', options: ToastOptions = {}) {
    const opts = { ...defaultOptions, ...options };
    const container = this.getContainer();
    const colors = this.getColors(type);
    const icon = this.getIcon(type);

    // Update container position
    container.style.cssText += this.getPositionStyles(opts.position);

    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${colors.bg};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      border: 2px solid ${colors.border};
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-weight: 500;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      min-width: 250px;
      max-width: 400px;
    `;

    toast.innerHTML = `
      <span style="font-size: 18px;">${icon}</span>
      <span style="flex: 1;">${message}</span>
    `;

    // Add animation keyframes if not exists
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `;
      document.head.appendChild(style);
    }

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        container.removeChild(toast);
        if (container.children.length === 0) {
          document.body.removeChild(container);
          this.container = null;
        }
      }, 300);
    }, opts.duration);
  }

  success(message: string, options?: ToastOptions) {
    this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions) {
    this.show(message, 'error', options);
  }

  info(message: string, options?: ToastOptions) {
    this.show(message, 'info', options);
  }

  warning(message: string, options?: ToastOptions) {
    this.show(message, 'warning', options);
  }
}

// Export singleton instance
export const toast = new ToastManager();
