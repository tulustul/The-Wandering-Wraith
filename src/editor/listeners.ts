export class Listeners {
  private listeners: [EventTarget, string, (event: Event) => void][] = [];

  listen(
    node: EventTarget | string,
    event: string,
    listener: (event: Event) => void,
  ) {
    if (typeof node === "string") {
      node = document.getElementById(node)!;
    }
    node.addEventListener(event, listener);
    this.listeners.push([node, event, listener]);
  }

  clear() {
    for (const [node, event, listener] of this.listeners) {
      node.removeEventListener(event, listener);
    }
    this.listeners = [];
  }
}
