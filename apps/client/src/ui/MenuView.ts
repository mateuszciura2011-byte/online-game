export class MenuView {
  constructor(
    private readonly menu: HTMLElement,
    private readonly panel: HTMLElement,
  ) {}

  open(page: string) {
    this.menu.hidden = false;
    this.panel.hidden = false;
    this.panel.dataset.page = page;
  }

  close() {
    this.panel.hidden = true;
    delete this.panel.dataset.page;
  }
}
