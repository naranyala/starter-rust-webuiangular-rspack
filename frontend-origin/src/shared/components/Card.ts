export class Card {
  private container: HTMLElement;
  private headerElement: HTMLElement | null = null;
  private bodyElement: HTMLElement;

  constructor(title?: string, className: string = '') {
    this.container = document.createElement('div');
    this.container.className = `card ${className}`.trim();

    if (title) {
      this.createHeader(title);
    }

    this.bodyElement = document.createElement('div');
    this.bodyElement.className = 'card-body';
    this.container.appendChild(this.bodyElement);
  }

  private createHeader(title: string): void {
    this.headerElement = document.createElement('div');
    this.headerElement.className = 'card-header';
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'card-title';
    titleElement.textContent = title;
    
    this.headerElement.appendChild(titleElement);
    this.container.appendChild(this.headerElement);
  }

  public setTitle(title: string): void {
    if (this.headerElement) {
      const titleElement = this.headerElement.querySelector('.card-title');
      if (titleElement) {
        titleElement.textContent = title;
      }
    } else {
      this.createHeader(title);
    }
  }

  public setContent(content: string | HTMLElement): void {
    this.bodyElement.innerHTML = '';
    if (typeof content === 'string') {
      this.bodyElement.innerHTML = content;
    } else {
      this.bodyElement.appendChild(content);
    }
  }

  public appendContent(content: string | HTMLElement): void {
    if (typeof content === 'string') {
      this.bodyElement.insertAdjacentHTML('beforeend', content);
    } else {
      this.bodyElement.appendChild(content);
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public render(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }
}

export class CardSection {
  private container: HTMLElement;
  private titleElement: HTMLElement | null = null;
  private contentElement: HTMLElement;

  constructor(title?: string, className: string = '') {
    this.container = document.createElement('div');
    this.container.className = `card-section ${className}`.trim();

    if (title) {
      this.createTitle(title);
    }

    this.contentElement = document.createElement('div');
    this.contentElement.className = 'card-section-content';
    this.container.appendChild(this.contentElement);
  }

  private createTitle(title: string): void {
    this.titleElement = document.createElement('h4');
    this.titleElement.className = 'card-section-title';
    this.titleElement.textContent = title;
    this.container.insertBefore(this.titleElement, this.contentElement);
  }

  public setTitle(title: string): void {
    if (this.titleElement) {
      this.titleElement.textContent = title;
    } else {
      this.createTitle(title);
    }
  }

  public setContent(content: string | HTMLElement): void {
    this.contentElement.innerHTML = '';
    if (typeof content === 'string') {
      this.contentElement.innerHTML = content;
    } else {
      this.contentElement.appendChild(content);
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}