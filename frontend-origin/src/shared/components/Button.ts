export class Button {
  private element: HTMLButtonElement;

  constructor(
    text: string,
    options: {
      variant?: 'primary' | 'secondary' | 'danger';
      size?: 'small' | 'medium' | 'large';
      loading?: boolean;
      className?: string;
    } = {}
  ) {
    this.element = document.createElement('button');
    this.element.textContent = text;
    
    const {
      variant = 'primary',
      size = 'medium',
      loading = false,
      className = ''
    } = options;

    this.element.className = [
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      loading ? 'btn-loading' : '',
      className
    ].filter(Boolean).join(' ');

    if (loading) {
      this.addSpinner();
    }

    this.attachEventListeners();
  }

  private addSpinner(): void {
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    spinner.textContent = '⟳';
    this.element.prepend(spinner);
  }

  private attachEventListeners(): void {
    // Add any default event listeners
  }

  public onClick(callback: (event: MouseEvent) => void): void {
    this.element.addEventListener('click', callback);
  }

  public setDisabled(disabled: boolean): void {
    this.element.disabled = disabled;
  }

  public setLoading(loading: boolean): void {
    if (loading) {
      this.element.classList.add('btn-loading');
      if (!this.element.querySelector('.btn-spinner')) {
        this.addSpinner();
      }
    } else {
      this.element.classList.remove('btn-loading');
      const spinner = this.element.querySelector('.btn-spinner');
      if (spinner) {
        spinner.remove();
      }
    }
  }

  public getElement(): HTMLButtonElement {
    return this.element;
  }

  public render(container: HTMLElement): void {
    container.appendChild(this.element);
  }
}