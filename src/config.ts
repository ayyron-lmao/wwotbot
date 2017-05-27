import {writeFileSync, readFileSync} from 'fs';

class ConfigManager {
  private obj: any;
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  public save() {
    writeFileSync(this.filename, JSON.stringify(this.obj));
  }

  public load() {
    this.obj = JSON.parse(readFileSync(this.filename, 'ascii'));
  }

  public get(node: string, defaultValue: any): string {
    let path = node.split('.');
    let temp = this.obj;
    for (let n in path) {
      if (temp[path[n]]) {
        temp = temp[path[n]];
      } else {
        console.log('node \'' + node + '\' does not exist in config tree. Stuck at: ' + path[n]);
        return defaultValue;
      }
    }
    return temp;
  }

  public set(node: string, value: any) {
    let path = node.split('.');
    let lastn = '';
    let parent = null;
    let current = this.obj;
    for (let n in path) {
      parent = current;
      if (current[path[n]]) {
        current = current[path[n]];
      } else {
        lastn = path[n];
        current[path[n]] = {};
        current = current[path[n]];
      }
    }
    if (current) {
      parent[lastn] = value;
      this.save();
    } 
    return current;
  }
}

export {ConfigManager};