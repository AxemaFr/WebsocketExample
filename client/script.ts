/*
  Все в одном файле, чтобы не прикручивать Webpack.
  Так бы конечно хорошо вынести типы отдельно.
 */
type CanvasDrawElement = {
  x: number,
  y: number,
};

type RawMessage = {
  type: MessageType.Init,
  data: string[]
} | {
  type: MessageType.Update,
  data: string
};

enum MessageType {
  Init = 'init',
  Update = 'update',
}

const socket: WebSocket = new WebSocket("ws://localhost:8081");

/*
  Дебажные штуки для наглядности :)
 */
socket.onopen = () => {
  console.log("Соединение установлено");
};

/*
  Обратите внимание, что можно вешать обработчики инлайново, а можно через addEventListener
 */
socket.addEventListener('onclose', (event: CloseEvent) => {
    if (event.wasClean) {
      console.log('Соединение закрыто без ошибок');
    } else {
      console.log('Обрыв соединения');
    }
    console.log('Код: ' + event.code + ' причина: ' + event.reason);
  }
);

socket.onerror = (error: ErrorEvent) => {
  console.log("Ошибка " + error.message);
};


/*
  Подготовка канваса к работе.
  Если не знакомы с этими штуками - лучше почитать отдельно.
 */

const canvas: HTMLCanvasElement = document.querySelector('canvas');
const ctx: CanvasRenderingContext2D = canvas.getContext("2d");

canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const drawElement = (x, y): void => {
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(x, y, 19, 0, 2 * Math.PI);
  ctx.fill();
};

/*
  Код для определения "Зажал клик и начал двигать мышку (drag)"
 */

let isDragging = false;

canvas.addEventListener('mousedown', () => {
  isDragging = true;
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});

canvas.addEventListener('mousemove', (event) => {
  if (!isDragging) {
    return;
  }

  /*
    Как только рисуем элемент у себя на канвасе - сразу же отправляем на сервер координаты
    Соответственно, сервер отошлет наши координаты другим клиентам, чтобы нарисовалось и у них.
   */
  drawElement(event.offsetX, event.offsetY);
  const outputMessage: CanvasDrawElement = {
    x: event.offsetX,
    y: event.offsetY
  }
  socket.send(JSON.stringify(outputMessage));
});

/*
  Обработчик события, которое нам пришло с сервера.
  Напомню, их два вида: "init" и "update".
  Первое присылается при подключении к серверу (текущее состояние канваса)
  Второе присылается при каждом новом элементе на канвасе
 */

socket.onmessage = (event) => {

  /*
    RawMessage - потому что JSON.parse не умеет парсить массив со вложенными объектами.
    А заводить тут модели - слишком сложно для одного доклада.
   */
  const message: RawMessage = JSON.parse(event.data);

  switch (message.type) {
    case MessageType.Init:
      const drawElements: string[]  = message.data;
      drawElements.forEach((rawDot: string) => {
        const dot: CanvasDrawElement = JSON.parse(rawDot);
        drawElement(dot.x, dot.y)
      });
      break;

    case MessageType.Update:
      const dot: CanvasDrawElement = JSON.parse(message.data);
      drawElement(dot.x, dot.y);
      break;

    default:
      console.error('Что за бодягу ты мне прислал?');
  }
};
