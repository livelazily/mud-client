import { ConnectorHandler } from './connectorHandler';

// speedwalk 13wn4w4s5wdd
export class SpeedWalk extends ConnectorHandler {
  get connectorCommands() {
    return [];
  }

  get connectorEvents() {
    return ['readlineClient'];
  }

  onReadlineClient(line, result) {
    if (line.match(/^[0-9neswud]+$/)) {
      result.handled = true;
      let walks = SpeedWalk.split(line);
      for (let i = 0; i < walks.length; i++) {
        this.connector.write(walks[i], true);
      }
    }
  }

  static split(speedwalk: string): string[] {
    let items = [];
    let walks = speedwalk.match(/\d*[neswud]/g);

    if (!walks) {
      return [];
    }

    for (let walk of walks) {
      // 13w
      let direction = walk[walk.length - 1];
      let count = parseInt(walk) || 1;
      for (let j = 0; j < count; j++) {
        items.push(direction);
      }
    }

    return items;
  }

  static splitMany(walk: string): string[] {
    let walks = walk.split(';');
    let result = [];
    for (let line of walks) {
      if (line.match(/^[0-9neswud]+$/)) {
        result = result.concat(SpeedWalk.split(line));
      } else {
        result.push(line)
      }
    }
    return result;
  }
}
