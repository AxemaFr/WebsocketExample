export type CanvasDrawElement = {
  x: number,
  y: number,
};

export type Message = {
  type: MessageType.Init,
  data: CanvasDrawElement[]
} | {
  type: MessageType.Update,
  data: CanvasDrawElement,
};

export enum MessageType {
  Init = 'init',
  Update = 'update',
};
